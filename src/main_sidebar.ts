import { app, BrowserWindow, BrowserView, ipcMain, IpcMainEvent, dialog, Menu, MenuItem  } from "electron";
import { BarkerUtils } from "./main_utils";
import { BarkerSettings } from "./main_settings";
import contextMenu from "electron-context-menu";
import { BarkerData } from "./main_data";
import { BarkerDownload } from "./main_download";
import isUrlHttp from 'is-url-http';
import { BarkerBrowser } from "./main_browser";
import { BarkerStatusBar } from "./main_statusbar";

/* This class handles left sidebar creation (displayed in BarkerBrowser.showBrowser())
*/

export class BarkerSideBar {

/*
static createSidebar()
static createSideBarBrowserView(browserNo: number, firstBrowser: boolean)
static showSidebarBrowserHeader(browserNo: number, left: number, top: number, width: number, height: number)
static loadURLSidebar (browserNo: number, uri: string) {
static openLinkInNextSidebarWindow(browserNo: number, uri: string)
static openLinkInNextEmptySidebarWindow(browserNo: number, uri: string)
static updateRollingTextSidebar()
*/

static mainWindow: Electron.BrowserWindow = null;
static browserHeaderPosition = {'x': 0, 'y': 0, 'width': 0, 'height': 0};
static browserWindowPosition = {'x': 0, 'y': 0, 'width': 0, 'height': 0};
static suggestionBoxBrowserNo = 0;

constructor(mainWindow: Electron.BrowserWindow) {
    BarkerSideBar.mainWindow = mainWindow;
}

static createSidebar() {
    //create browser windows for left sidebar
    BarkerSideBar.createSideBarBrowserView(1, true);
    for (let i=1; i<BarkerSettings.getMaxBrowserViewsPerTab(); i++) {
        BarkerSideBar.createSideBarBrowserView(i+1, false);
    }
}

static getNextEmptyBrowserNo(browserNo: number) {
    const addresses = BarkerData.getSidebarAddresses();
    if (addresses) {
        for (let i=browserNo+1; i< BarkerSettings.getMaxBrowserViewsPerTab()-browserNo; i++) {
                const address = addresses[i];
                BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "getNextEmptyBrowserNo(): address="+address+", i="+i+", browserNo="+browserNo);
                if (!address) {
                    return i;
                }
        }
    }
    return -1;
}


static createSideBarBrowserView(browserNo: number, firstBrowser: boolean) {

    //browser window
    let browser = new BrowserView({webPreferences: {
                                devTools: true, 
                                autoplayPolicy: 'document-user-activation-required',
                                sandbox: false
                                }});
    browser.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    if (BarkerSettings.getUserAgent() != '') browser.webContents.setUserAgent(BarkerSettings.getUserAgent());
    browser.webContents.loadFile('../html/default_browser.html');
    BarkerSideBar.mainWindow.addBrowserView(browser);
    BarkerData.addBrowserViewNo(BarkerBrowser.mainWindow.getBrowserViews().length - 1);

    if (firstBrowser) {
        let browserViews = BarkerSideBar.mainWindow.getBrowserViews();
        let firstBrowserNo = browserViews.length -1;
        BarkerData.setFirstBrowserViewNo_sidebar(firstBrowserNo);
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createSideBarBrowserView(): _firstBrowserViewNo_sidebar sets firstBrowserNo="+firstBrowserNo);
    }

    //BrowserView navigation events (for later get URL and write it somewhere so user can see actual URL)
    browser.webContents.on('will-navigate', function(event, url) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "Sidebar BrowserView Navigation event: url=" + url);
        BarkerData.setSidebarUrl(browserNo, url);
        BarkerSideBar.mainWindow.webContents.send('update-url-sidebar', browserNo, url);
    });
    browser.webContents.on('did-navigate-in-page', function(event, url) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "Sidebar BrowserView Navigation event: url=" + url);
        BarkerData.setSidebarUrl(browserNo, url);
        BarkerSideBar.mainWindow.webContents.send('update-url-sidebar', browserNo, url);
    });

    //event hover over link, display link in statusbar
    browser.webContents.on('update-target-url', function(event, url) {
        BarkerStatusBar.updateStatusBarText(url);
    });

    //BrowserView zoom ability
    browser.webContents.setVisualZoomLevelLimits(1, 5);
    browser.webContents.on("zoom-changed", (event, zoomDirection) => {
        var currentZoom = browser.webContents.getZoomFactor();
        if (zoomDirection === "in") { browser.webContents.zoomFactor = currentZoom + 0.2; }
        if (zoomDirection === "out") { browser.webContents.zoomFactor = currentZoom - 0.2; }
    });

    //add context menu
    contextMenu({
        window: browser, 
        showSaveImageAs: true,
        prepend: (defaultActions: Object, parameters: Object, browserWindow: Object) => [
            {
                label: 'Open link in next window',
                visible: ((parameters as any).linkURL) &&(browserNo<BarkerSettings.getMaxBrowserViewsPerTab()),
                click: () => { BarkerSideBar.openLinkInNextSidebarWindow(browserNo, (parameters as any).linkURL); }
            },
            {
                label: 'Open link in next empty window',
                visible: ((parameters as any).linkURL) &&(BarkerSideBar.getNextEmptyBrowserNo(browserNo) > 0),
                click: () => { BarkerSideBar.openLinkInNextEmptySidebarWindow(browserNo, (parameters as any).linkURL); }
            },
            {
                label: 'Download',
                visible: ((parameters as any).linkURL),
                click: () => {
                    BarkerDownload.downloadFile((parameters as any).linkURL);
                }
            }
            ]
    });

    //keyboard shortcuts
    /*
    browser.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.key.toLowerCase() === 'f') {             //ctrl+f
            event.preventDefault();
            _activeBrowserView = browser;
            BarkerSideBar.mainWindow.webContents.send('show-searchbar');
        else if ((input.control && input.key.toLowerCase() === 'r') || (input.key === 'F5')) {    //ctrl+r/F5
            browser.webContents.reloadIgnoringCache();
        }
    })*/
}

static showSidebarBrowserHeader(browserNo: number, left: number, top: number, width: number, height: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showSidebarBrowserHeader(): browserNo="+browserNo+", left="+left+", top="+top);
    BarkerSideBar.mainWindow.webContents.send('create-sidebar-browser-header', browserNo, left, top);
}

static loadURLSidebar (browserNo: number, uri: string) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadURLSidebar(): browserNo="+browserNo+", uri="+uri);
    if (browserNo<1 || browserNo>BarkerSettings.getMaxBrowserViewsPerTab()) {
        browserNo = 1
    }
    let browserViews = BarkerSideBar.mainWindow.getBrowserViews();
    const firstBrowserNo = BarkerData.firstBrowserViewNo_sidebar;
    
    var uriWithProtocol = uri;
    if (!/^https?:\/\//i.test(uri)) {
        uriWithProtocol = 'https://' + uri;
    }    

    const browserViewNo = firstBrowserNo+browserNo-1;
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadURLSidebar(): firstBrowserNo="+firstBrowserNo+", browserViewNo="+browserViewNo);
    if (isUrlHttp(uriWithProtocol)) {
        browserViews[browserViewNo].webContents.loadURL(uriWithProtocol);
        BarkerData.setSidebarUrl(browserNo, uriWithProtocol);
    } else {
        browserViews[browserViewNo].webContents.loadURL('https://www.google.com/search?q='+uri);
        BarkerData.setSidebarUrl(browserNo, uri);
    }
}

static openLinkInNextSidebarWindow(browserNo: number, uri: string) {
    if (browserNo < BarkerSettings.getMaxBrowserViewsPerTab()) {
        browserNo++;
    }
    BarkerSideBar.loadURLSidebar(browserNo, uri);
}

static openLinkInNextEmptySidebarWindow(browserNo: number, uri: string) {
    const nextBrowserNo = BarkerSideBar.getNextEmptyBrowserNo(0);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "openLinkInNextEmptyWindow(): browserNo="+browserNo+", uri="+uri+", nextBrowserNo="+nextBrowserNo);
    if ((nextBrowserNo > 0)&&(nextBrowserNo < BarkerSettings.getMaxBrowserViewsPerTab())) {
        BarkerSideBar.loadURLSidebar(nextBrowserNo, uri);
    } else {
        BarkerSideBar.loadURLSidebar(1, uri);
    }
}

static updateRollingTextSidebar() {
    var rollingText = (BarkerData.getSidebarRollingWindowOffset()+1).toString();
    const layout = BarkerData.getSidebarLayoutNo();
    if (layout>1) rollingText += '-' + (BarkerData.getSidebarRollingWindowOffset() + layout);
    rollingText += '/' + BarkerSettings.getMaxBrowserViewsPerTab();
    BarkerSideBar.mainWindow.webContents.send('update-rolling-browsers-text-sidebar', rollingText);
}

static calculateBrowserWindowPosition_sidebar(browserNo: number) {
    var maxWidth, maxHeight;
    let _left = 10;
    let _top = 100;
    const currentBounds = BarkerBrowser.mainWindow.getBounds();
    maxHeight = currentBounds.height - 100;  //probably menu and app border takes about 60px
    maxWidth = currentBounds.width - 30;

    const sidebar_browser_rows = BarkerData.getSidebarLayoutNo();
    const sidebar_browser_width = BarkerData.getFrameSidebarWidth() - 10;
    const sidebar_browser_height = Math.floor((maxHeight-BarkerData.getFrameTopBarHeight()-BarkerData.getFrameBottomBarHeight())/ sidebar_browser_rows);
    let browserHeadersHeight = 0;
    if (BarkerSettings.getShowBrowserHeaders()) browserHeadersHeight = BarkerSettings.getBrowserHeaderHeight();

    BarkerSideBar.browserHeaderPosition.x = _left;
    BarkerSideBar.browserHeaderPosition.y = _top + ((browserNo-1) * sidebar_browser_height);
    BarkerSideBar.browserHeaderPosition.width = sidebar_browser_width;
    BarkerSideBar.browserHeaderPosition.height = BarkerSettings.getBrowserHeaderHeight();

    BarkerSideBar.browserWindowPosition.x = _left;
    BarkerSideBar.browserWindowPosition.y = BarkerSideBar.browserHeaderPosition.y + browserHeadersHeight;
    BarkerSideBar.browserWindowPosition.width = sidebar_browser_width;
    BarkerSideBar.browserWindowPosition.height = sidebar_browser_height-BarkerSettings.getBrowserHeaderHeight();
    
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "calculateBrowserWindowPosition_sidebar(): browserNo="+browserNo);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "calculateBrowserWindowPosition_sidebar(): header x="+BarkerSideBar.browserHeaderPosition.x+", y="+BarkerSideBar.browserHeaderPosition.y+", width="+BarkerSideBar.browserHeaderPosition.width+", height="+BarkerSideBar.browserHeaderPosition.height);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "calculateBrowserWindowPosition_sidebar(): window x="+BarkerSideBar.browserWindowPosition.x+", y="+BarkerSideBar.browserWindowPosition.y+", width="+BarkerSideBar.browserWindowPosition.width+", height="+BarkerSideBar.browserWindowPosition.height);
}

static showMatchedAddresses(uri: string, browserNo: number) {
    const firstBrowserNo = BarkerData.getFirstBrowserViewNo_sidebar();
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews();
    let browser =  <BrowserView>browserViews[firstBrowserNo+browserNo-1];
    if (browser) {
        //shift BrowserView top-border lower to see suggestion bar 
        //(it is not possible to draw HTML element over BrowserView object in Electron)
        BarkerSideBar.calculateBrowserWindowPosition_sidebar(browserNo);
        BarkerSideBar.browserWindowPosition.y += 50;
        BarkerSideBar.browserWindowPosition.height -= 50;
        browser.setBounds({ x:BarkerSideBar.browserWindowPosition.x, y:BarkerSideBar.browserWindowPosition.y, width:BarkerSideBar.browserWindowPosition.width, height:BarkerSideBar.browserWindowPosition.height});

        //draw suggestion box
        BarkerSideBar.browserHeaderPosition.x += 220;
        BarkerSideBar.browserHeaderPosition.y += BarkerSettings.getBrowserHeaderHeight();
        BarkerSideBar.browserHeaderPosition.width = BarkerBrowser.browserHeaderPosition.width / 3;
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showMatchedAddresses(): x="+BarkerSideBar.browserHeaderPosition.x+", y="+BarkerSideBar.browserHeaderPosition.y+", width="+BarkerSideBar.browserHeaderPosition.width+", height="+BarkerSideBar.browserHeaderPosition.height);
        BarkerSideBar.mainWindow.webContents.send('show-matched-addresses-sidebar', uri, BarkerSideBar.browserHeaderPosition.x, BarkerSideBar.browserHeaderPosition.y);

        //store browserNo for time when address is clicked
        BarkerSideBar.suggestionBoxBrowserNo = browserNo;
    }
}

}