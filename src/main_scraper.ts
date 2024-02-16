import { app } from "electron";
import { BarkerStatusBar } from "./main_statusbar";
import { BarkerUtils } from "./main_utils";
import { BrowserView } from "electron";
import { BarkerSettings } from "./main_settings";
import { parse } from 'node-html-parser';
import {readdir} from 'fs/promises';
import { BarkerLogger } from "./main_logger";
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

static async scrapeUrl(startingUri: string, maxDepth: number, withinDomain = true) {
    BarkerLogger.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl()");
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
        BarkerLogger.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): internetLink="+internetLink+", linkQueue.length="+BarkerScraper.linkQueue.length);
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
            BarkerLogger.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Download failed, internetLink="+internetLink);
            BarkerScraper.linkQueue.shift();
            BarkerScraper.depthNo.shift();
            continue;
        }

        //create domain folder if does not exist yet
        BarkerUtils.createFolderIfDoesNotExist(folderPath);

        //const root = parse(BarkerScraper.removeJavascript(body));
        const root = parse(body);
        if (actualDepth<maxDepth) {
            //extract links
            const links = root.getElementsByTagName('a');
            for (let i=0; i< links.length; i++) {
                if (links[i].hasAttribute('href')) {
                    let maxSizeCheck = (BarkerScraper.downloadedLinks.length + BarkerScraper.linkQueue.length < maxScrappedFiles);
                    if (!maxSizeCheck) {
                        break;
                    }

                    let hrefValue = links[i].getAttribute("href");
                    if (hrefValue) {

                        //workaround for absosulute path link like /portal/page.html
                        if (hrefValue[0] == '/') {
                            hrefValue = 'https://' + internetLinkDomain + hrefValue;
                        }

                        //recursion protection (against saving link into linkQueue)
                        let fileAlreadyDownloaded = false;
                        for (let j=0; j< BarkerScraper.downloadedLinks.length; j++) {
                            if (BarkerScraper.downloadedLinks[j]==hrefValue || BarkerScraper.downloadedLinks[j]==hrefValue+'/') {
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

                                //replace internet link by reference to local file
                                if (localHrefValue) {
                                    let localFolderPath = '../' + internetLinkDomain + '/' + localHrefValue;
                                    if (internetLink == startingUri) {
                                        localFolderPath = './' + internetLinkDomain + '/'  + localHrefValue;
                                    }
                                    links[i].setAttribute("href", localFolderPath + '.html');
                                }
                            }
                        } else {
                            //don't save (already saved), just replace
                            if (localHrefValue) {
                                let localFolderPath = '../' + internetLinkDomain + '/' + localHrefValue;
                                if (internetLink == startingUri) {
                                    localFolderPath = './' + internetLinkDomain + '/'  + localHrefValue;
                                }
                                links[i].setAttribute("href", localFolderPath + '.html');
                            }
                        }
                    }
                }
            }

            //recursion protection (against saving file more times)
            let fileAlreadyDownloaded = false;
            for (let j=0; j< BarkerScraper.downloadedLinks.length; j++) {
                if (BarkerScraper.downloadedLinks[j]==internetLink || BarkerScraper.downloadedLinks[j]==internetLink+'/') {
                    fileAlreadyDownloaded = true;
                    break;
                }
            }

            //save file
            const fileNamePath = path.join(folderPath, localFileName);
            if (!fileAlreadyDownloaded) {
                BarkerLogger.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Saving file "+localFileName);

                let browser = new BrowserView({webPreferences: {
                    devTools: true, 
                    autoplayPolicy: 'document-user-activation-required',
                    sandbox: false
                    }});
                browser.setBounds({ x: 0, y: 0, width: 0, height: 0 });
                if (browser && browser.webContents) {
                    browser.webContents.loadURL(internetLink);
                    browser.webContents.on('dom-ready', () => {
                        browser.webContents.executeJavaScript("document.querySelector(\'body\').innerText").then( (result) => {

                            //prepare page text for saving
                            var pageText = 
                            `<html>
                            <head>
                            <style>
                                pre {
                                white-space: pre-wrap;
                                white-space: -moz-pre-wrap;
                                white-space: -pre-wrap;
                                white-space: -o-pre-wrap;
                                word-wrap: break-word;
                                }
                            </style>
                            </head>
                            <body>

                            <h1>Downloaded web `+ internetLink + `</h1>

                            <hr> 
                            <pre>` + 
                            
                            result +
                            
                            `</pre>
                            <hr>
                            <h2>Locally saved pages</h2>
                            <hr>`;

                            var remoteLinks = '';
                            var localLinks = '';
                            for (let i=0; i< links.length; i++) {
                                let hrefValue = links[i].getAttribute("href");
                                if (hrefValue) {
                                    if (hrefValue.substring(0,4) == 'http')
                                        remoteLinks = remoteLinks + '<a href=\"' + hrefValue + '\">' + hrefValue + '</a><br>';
                                    else
                                        localLinks = localLinks + '<a href=\"' + hrefValue + '\">' + hrefValue + '</a><br>';
                                }
                            }

                            pageText = pageText + localLinks +
                
                            `<h2>Remote links</h2>
                            <hr>`;
                            
                            pageText = pageText + remoteLinks +
                            
                            `</body>
                            </html>`;

                            fs.writeFile(fileNamePath, pageText, (err: Error) => {
                                if (err) {
                                    BarkerLogger.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): ERROR saving file, internetLink="+internetLink+", error="+ err);
                                }
                                BarkerStatusBar.updateStatusBarText("URL " + internetLink + " has been saved (actualDepth="+actualDepth+", total files saved="+BarkerScraper.downloadedLinks.length+")");
                            }); 
                        });     //end of executeJavascript.then
                        browser = null;
                    });         //end of dom-ready
                }
                
                BarkerScraper.downloadedLinks.push(internetLink);
            }
        }

        //remove first link from queue
        BarkerLogger.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Going to shift link queue, BarkerScraper.linkQueue.length="+BarkerScraper.linkQueue.length);
        BarkerScraper.linkQueue.shift();
        BarkerScraper.depthNo.shift();
        BarkerLogger.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Link queue shifted, BarkerScraper.linkQueue.length="+BarkerScraper.linkQueue.length);
    }
    BarkerLogger.log((new Error().stack.split("at ")[1]).trim(), "scrapeUrl(): Web scraping finished, total files saved="+BarkerScraper.downloadedLinks.length);
    BarkerStatusBar.updateStatusBarText("Web scraping finished, total files saved="+BarkerScraper.downloadedLinks.length);

    while (BarkerScraper.downloadedLinks.length!=0) BarkerScraper.downloadedLinks.shift();
}

static async showScrapedWebs(parentFolder: string) {
    const directories = (await readdir(parentFolder, {withFileTypes: true}))
    .filter(dirent => dirent.isDirectory())
    .map(dir => dir.name);
    BarkerScraper.mainWindow.webContents.send('show-scraped-webs', JSON.stringify(directories));
    BarkerLogger.log((new Error().stack.split("at ")[1]).trim(), "showScrapedWebs(): JSON.stringify(directories)="+JSON.stringify(directories));
}

}