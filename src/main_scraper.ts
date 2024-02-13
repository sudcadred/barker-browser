import { app } from "electron";
import { BarkerStatusBar } from "./main_statusbar";
import { BarkerUtils } from "./main_utils";
import { BrowserView } from "electron";
import { BarkerSettings } from "./main_settings";
import { parse } from 'node-html-parser';
import {readdir} from 'fs/promises';
const fs = require("fs");
const path = require("path");

export class BarkerScraper {

static mainWindow: Electron.BrowserWindow = null;
static browser: Electron.BrowserView = null;
static linkQueue: string[] = [];
static depthNo: number[] = [];
static downloadedLinks: string[] = [];

constructor(mainWindow: Electron.BrowserWindow) {
    BarkerScraper.mainWindow = mainWindow;

    //browser window
    let browser = new BrowserView({webPreferences: {
        devTools: true, 
        autoplayPolicy: 'document-user-activation-required',
        sandbox: false,
        }});
    browser.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    if (BarkerSettings.getUserAgent() != '') browser.webContents.setUserAgent(BarkerSettings.getUserAgent());
    BarkerScraper.browser = browser;
    BarkerScraper.mainWindow.addBrowserView(browser);
}

static addMissingBodyTag(document: string): string {

    return document;
}

static removeJavascript(body: string): string {
    const root = parse(body);
    var tags = root.getElementsByTagName('script');
    for (var i = tags.length; i >= 0; i--) {
        if (tags[i])
            tags[i].parentNode.removeChild(tags[i]);
    }
    return root.innerHTML;
}

static async scrapeUrl(startingUri: string, maxDepth: number, withinDomain = true) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl()");
    let maxScrappedFiles = Number(BarkerSettings.preferences.value('mainSection.maxScrappedFiles'));
    if (maxScrappedFiles == 0) maxScrappedFiles = 100;
    let startDomain = BarkerUtils.getHostNameFromUrl(startingUri);
    
    //create scraper folder if does not exist yet
    BarkerUtils.createFolderIfDoesNotExist(path.join(app.getPath("userData"), 'barker-scraper/'));
    BarkerUtils.createFolderIfDoesNotExist(path.join(app.getPath("userData"), 'barker-scraper/'+startDomain));

    //push starting URL to link queue
    BarkerScraper.linkQueue.push(startingUri);
    BarkerScraper.depthNo.push(0);

    while (BarkerScraper.linkQueue.length!=0) {
        let internetLink = BarkerScraper.linkQueue[0];
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): internetLink="+internetLink+", linkQueue.length="+BarkerScraper.linkQueue.length);
        let internetLinkDomain = BarkerUtils.getHostNameFromUrl(internetLink);
        let actualDepth = BarkerScraper.depthNo[0];

        let folderPath = path.join(app.getPath("userData"), 'barker-scraper/' + startDomain+'/' + internetLinkDomain);
        let localFileName = internetLink;
        if (internetLink == startingUri) {
            localFileName = 'index.html';
            folderPath = path.join(app.getPath("userData"), 'barker-scraper/' + startDomain);
        }
        else { 
            localFileName = BarkerUtils.getFileNameFromUrl(localFileName) + '.html';
        }

        //download file
        var body = '';
        try {
            var response = await fetch(internetLink);
            body = await response.text();
        } 
        catch {
            BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Download failed, internetLink="+internetLink);
            BarkerScraper.linkQueue.shift();
            BarkerScraper.depthNo.shift();
            continue;
        }

        //create domain folder if does not exist yet
        BarkerUtils.createFolderIfDoesNotExist(folderPath);

        const root = parse(BarkerScraper.removeJavascript(body));
        if (actualDepth<maxDepth) {
            //extract links
            const links = root.getElementsByTagName('a');
            //BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): links.length="+links.length+", actualDepth="+actualDepth);
            for (let i=0; i< links.length; i++) {
                //let element = links[i];
                if (links[i].hasAttribute('href')) {
                    let maxSizeCheck = (BarkerScraper.downloadedLinks.length + BarkerScraper.linkQueue.length < maxScrappedFiles);
                    if (!maxSizeCheck) {
                        //BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Max size reached, breaking cycle of extracting links");
                        break;
                    }

                    let hrefValue = links[i].getAttribute("href");
                    if (hrefValue) {

                        //workaround for absosulute path link
                        if (hrefValue[0] == '/') {
                            hrefValue = 'https://' + internetLinkDomain + hrefValue;
                        }

                        //recursion protection (against saving link into linkQueue)
                        let fileAlreadyDownloaded = false;
                        for (let j=0; j< BarkerScraper.downloadedLinks.length; j++) {
                            if (BarkerScraper.downloadedLinks[j]==hrefValue || BarkerScraper.downloadedLinks[j]==hrefValue+'/') {
                                //BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Recursion protection activated,  hrefValue="+hrefValue);
                                fileAlreadyDownloaded = true;
                                break;
                            }
                        }

                        //domain check
                        let domainCheck = true;
                        let linkDomain = BarkerUtils.getHostNameFromUrl(hrefValue);
                        if (withinDomain) domainCheck = (linkDomain==startDomain);

                        //save link to queue
                        const localHrefValue = BarkerUtils.getFileNameFromUrl(hrefValue);
                        if (!fileAlreadyDownloaded) {
                            if (domainCheck) {
                                BarkerScraper.linkQueue.push(hrefValue);
                                BarkerScraper.depthNo.push(actualDepth+1);
                                //BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Link saved to queue, hrefValue="+hrefValue+", actualDepth="+actualDepth+", BarkerScraper.linkQueue.length="+BarkerScraper.linkQueue.length);

                                //replace internet link by reference to local file
                                //BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): link.href="+hrefValue+", localHrefValue="+localHrefValue);
                                if (localHrefValue) {
                                    let localFolderPath = '../' + internetLinkDomain + '/' + localHrefValue;
                                    if (internetLink == startingUri) {
                                        localFolderPath = './' + internetLinkDomain + '/'  + localHrefValue;
                                    }
                                    links[i].setAttribute("href", localFolderPath + '.html');
                                } else {
                                    //BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Link not saved due to different domain,  hrefValue="+hrefValue+", localHrefValue="+localHrefValue);
                                }
                            }
                        } else {
                            //don't save (already saved), just replace
                            //BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): link.href="+hrefValue+", localHrefValue="+localHrefValue);
                            if (localHrefValue) {
                                let localFolderPath = '../' + internetLinkDomain + '/' + localHrefValue;
                                if (internetLink == startingUri) {
                                    localFolderPath = './' + internetLinkDomain + '/'  + localHrefValue;
                                }
                                links[i].setAttribute("href", localFolderPath + '.html');
                            }
                            //BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Link not saved,  hrefValue="+hrefValue+", fileAlreadyDownloaded="+fileAlreadyDownloaded+", domainCheck="+domainCheck+", maxSizeCheck="+maxSizeCheck);
                        }
                    }
                }
            }

            //recursion protection (against saving file more times)
            let fileAlreadyDownloaded = false;
            for (let j=0; j< BarkerScraper.downloadedLinks.length; j++) {
                if (BarkerScraper.downloadedLinks[j]==internetLink || BarkerScraper.downloadedLinks[j]==internetLink+'/') {
                    //BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Recursion protection activated,  hrefValue="+hrefValue);
                    fileAlreadyDownloaded = true;
                    break;
                }
            }

            //save file
            const fileNamePath = path.join(folderPath, localFileName);
            if (!fileAlreadyDownloaded) {
                BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Saving file "+localFileName);
                await fs.writeFile(fileNamePath, root.innerHTML, (err: Error) => {
                    if (err) {
                        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): ERROR saving file, internetLink="+internetLink+", error="+ err);
                    }
                });
                BarkerScraper.downloadedLinks.push(internetLink);
                BarkerStatusBar.updateStatusBarText("URL " + internetLink + " has been saved (actualDepth="+actualDepth+", total files saved="+BarkerScraper.downloadedLinks.length+")");
            }
        }

        //remove first link
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Going to shift link queue, BarkerScraper.linkQueue.length="+BarkerScraper.linkQueue.length);
        BarkerScraper.linkQueue.shift();
        BarkerScraper.depthNo.shift();
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Link queue shifted, BarkerScraper.linkQueue.length="+BarkerScraper.linkQueue.length);
    }
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Web scraping finished, total files saved="+BarkerScraper.downloadedLinks.length);
    BarkerStatusBar.updateStatusBarText("Web scraping finished, total files saved="+BarkerScraper.downloadedLinks.length);
}

static async showScrapedWebs(parentFolder: string) {
    const directories = (await readdir(parentFolder, {withFileTypes: true}))
    .filter(dirent => dirent.isDirectory())
    .map(dir => dir.name);
    BarkerScraper.mainWindow.webContents.send('show-scraped-webs', JSON.stringify(directories));
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showScrapedWebs(): JSON.stringify(directories)="+JSON.stringify(directories));
}

}