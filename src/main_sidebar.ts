import { app, BrowserWindow, BrowserView, ipcMain, IpcMainEvent, dialog, Menu, MenuItem  } from "electron";
import { BarkerUtils } from "./main_utils";
import { BarkerSettings } from "./main_settings";
import contextMenu from "electron-context-menu";
import { BarkerData } from "./main_data";
import { BarkerDownload } from "./main_download";
import isUrlHttp from 'is-url-http';
import { BarkerBrowser } from "./main_browser";

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
static isZoomedSidebar(browserNo: number): boolean
static zoomSidebarView(browserNo: number)
static unzoomSidebarView()
static updateRollingTextSidebar()
*/

static mainWindow: Electron.BrowserWindow = null;

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
    const addresses = BarkerData.getTabAddresses(BarkerData.getActualTabId());
    if (addresses) {
        for (let i=browserNo+1; i< BarkerSettings.getMaxBrowserViewsPerTab()-browserNo; i++) {
                const address = addresses.get(i);
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
        BarkerSideBar.mainWindow.webContents.send('update-url', browserNo, url);
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
                label: 'Zoom',
                visible: !BarkerSideBar.isZoomedSidebar(browserNo),
                click: () => {
                    BarkerSideBar.zoomSidebarView(browserNo);
                }
            },
            {
                label: 'Unzoom',
                visible: BarkerSideBar.isZoomedSidebar(browserNo),
                click: () => {
                    BarkerSideBar.unzoomSidebarView();
                }
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

static unzoomSidebarView() {
}

static zoomSidebarView(browserNo: number) {
}

static openLinkInNextSidebarWindow(browserNo: number, uri: string) {
}

static openLinkInNextEmptySidebarWindow(browserNo: number, uri: string) {
}

static isZoomedSidebar(browserNo: number): boolean {
    return false;
}

static updateRollingTextSidebar() {
    var rollingText = (BarkerData.getSidebarRollingWindowOffset()+1).toString();
    const layout = BarkerData.getSidebarLayoutNo();
    if (layout>1) rollingText += '-' + (BarkerData.getSidebarRollingWindowOffset() + layout);
    rollingText += '/' + BarkerSettings.getMaxBrowserViewsPerTab();
    BarkerSideBar.mainWindow.webContents.send('update-rolling-browsers-text-sidebar', rollingText);
}

}