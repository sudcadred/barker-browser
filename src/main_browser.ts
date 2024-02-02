import { BrowserView } from "electron";
import { BarkerData } from "./main_data";
import { BarkerUtils } from "./main_utils";
import { BarkerStatusBar } from "./main_statusbar";
import { BarkerSettings } from "./main_settings";
import { BarkerDownload } from "./main_download";
import { BarkerSideBar } from "./main_sidebar";
import { BarkerSaveLoadState } from "./main_saveLoadState";
import { BarkerKeyboardShortcuts } from "./main_keyboardShortcuts";
import { BarkerZoom } from "./main_zoom";
import isUrlHttp from 'is-url-http';
import contextMenu from "electron-context-menu";
import { BarkerMenu } from "./main_menu";
const path = require('node:path')

/* This class handles browser windows operations 
   like BrowserView creation, setting its bounds, loadURL
   core method is showBrowsers() which shows all browser windows in application
*/

export class BarkerBrowser {

/*
constructor (mainWindow: Electron.BrowserWindow)
static isBodyFullyLoaded()
static showBrowsersIfBodyFullyLoaded()
static openLinkInNextWindow(browserNo: number, uri: string)
static getNextEmptyBrowserNo(browserNo: number)
static openLinkInNextEmptyWindow(browserNo: number, uri: string)
static openLinkInFirstEmptyWindow(uri: string)
static openLinkInNextTab(browserNo: number, tabIdNo: number)
static addToBookmarks(uri: string)
static createBrowserView(tabNo:number, browserNo: number, firstBrowser: boolean)
static createBrowserViewsForOneTab(tabNo: number)
removeBrowserViewsForOneTab(tabName: string)
static hideAllBrowserViews()
static removeAllBrowserViews()
static showBrowserHeader(browserNo: number, left: number, top: number, browserWidth: number)
static showBrowserView(browserViewNo: number, _left: number, _top: number, _width: number, _height: number)
static showBrowsers_showSidebar()
static showBrowsers_showMainArea(windowsCnt: number, tabId: string, offset: number)
static showBrowsers (windowsCnt: number, tabId: string, offset: number)
static loadURL (tabIdName: string, browserNo: number, uri: string)
static getNextTabId ()
static updateRollingText()
static showMatchedAddresses(uri: string)
*/


//static properties
static mainWindow: Electron.BrowserWindow = null;
static activeBrowserView: Electron.BrowserView = null;
static showBrowserHeaders = true;
static browserHeaderButtonsString: string;
static actualTabId = 'NewTab1';
static matchedAddressesBrowerView: Electron.BrowserView = null;
static browserHeaderPosition = {'x': 0, 'y': 0, 'width': 0, 'height': 0};
static browserWindowPosition = {'x': 0, 'y': 0, 'width': 0, 'height': 0};

//ctor    
constructor (mainWindow: Electron.BrowserWindow) {
    BarkerBrowser.mainWindow = mainWindow;
    let browser = new BrowserView({webPreferences: {
        devTools: true, 
        autoplayPolicy: 'document-user-activation-required',
        sandbox: false
        }});
    browser.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    BarkerBrowser.mainWindow.addBrowserView(browser);
    BarkerBrowser.matchedAddressesBrowerView = browser;
}

static isBodyFullyLoaded() {
    return (BarkerData.getMainBodyLoaded() && BarkerData.getLeftBodyLoaded() && BarkerData.getTopBodyLoaded() && BarkerData.getRightBodyLoaded() && BarkerData.getBottomBodyLoaded());
}

static showBrowsersIfBodyFullyLoaded() {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showBrowsersIfBodyFullyLoaded()");
    if (BarkerBrowser.isBodyFullyLoaded()) {
        const browserViews = BarkerBrowser.mainWindow.getBrowserViews();
        const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo('NewTab1');
        const tabLayout = BarkerSettings.getFirstLayout();
        const sidebarLayout = BarkerSettings.getSidebarLayout();
    
        const statusbar = new BarkerStatusBar(BarkerBrowser.mainWindow);
        BarkerStatusBar.createStatusBar();
        const sidebar = new BarkerSideBar(BarkerBrowser.mainWindow);
        BarkerSideBar.createSidebar();
        BarkerBrowser.mainWindow.webContents.send('set-browser-header-buttons', BarkerData.getBrowserHeaderString());

        BarkerSaveLoadState.loadTabsFromFile();
        BarkerDownload.createDownloadEventCatcher();
    
        BarkerBrowser.mainWindow.webContents.send('set-layout-buttons', BarkerData.getLayoutString());
        const tabId = BarkerData.getOrderedTabIdName(0);
        if (BarkerData.getOrderedTabIdsArray().length > 0) {
            BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createMainWindow(): tabId="+tabId+", tabLayout="+tabLayout);
            BarkerBrowser.mainWindow.webContents.send('set-layout', Number(tabLayout));
            BarkerBrowser.mainWindow.webContents.send('activate-tab', tabId);
            BarkerBrowser.mainWindow.webContents.send('set-next-tab-name', BarkerBrowser.getNextTabId());
            BarkerBrowser.mainWindow.webContents.send('set-sidebar-layout', Number(sidebarLayout));
            BarkerData.setActualTabId(tabId);
        }
        BarkerSaveLoadState.loadAddressesFromFile();
        BarkerData.setActualTabId(BarkerData.getOrderedTabIdName(0));
        let actualTabId = BarkerData.getActualTabId();
        BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(actualTabId), actualTabId, BarkerData.getTabBrowserOffset(actualTabId));
    
        //keyboard shortcuts valid for mainWindow level
        BarkerBrowser.mainWindow.webContents.on('before-input-event', (event, input) => {
            if (input.control && input.key.toLowerCase() === 'p') {      //ctrl+p
                event.preventDefault();
                BarkerSettings.showPreferences();
            }
            BarkerKeyboardShortcuts.evaluateKeyboardShortcutsForSwitchTab(input);
            BarkerKeyboardShortcuts.evaluateKeyboardShortcutsForSwitchLayout(input);
        })
    
    }
}

static openLinkInNextWindow(browserNo: number, uri: string) {
    if (browserNo < BarkerSettings.getMaxBrowserViewsPerTab()) {
        browserNo++;
    }
    BarkerBrowser.loadUrlInActualTab(browserNo, uri);
}

static getNextEmptyBrowserNo(browserNo: number) {
    const addresses = BarkerData.getTabAddresses(BarkerBrowser.actualTabId);
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

static openLinkInNextEmptyWindow(browserNo: number, uri: string) {
    const nextBrowserNo = BarkerBrowser.getNextEmptyBrowserNo(0);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "openLinkInNextEmptyWindow(): browserNo="+browserNo+", uri="+uri+", nextBrowserNo="+nextBrowserNo);
    if ((nextBrowserNo > 0)&&(nextBrowserNo < BarkerSettings.getMaxBrowserViewsPerTab())) {
        BarkerBrowser.loadUrlInActualTab(nextBrowserNo, uri);
    } else {
        BarkerBrowser.loadUrlInActualTab(1, uri);
    }
}

static openLinkInFirstEmptyWindow(uri: string) {
    const nextBrowserNo = BarkerBrowser.getNextEmptyBrowserNo(1);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "openLinkInNextEmptyWindow(): uri="+uri+", nextBrowserNo="+nextBrowserNo);
    if ((nextBrowserNo > 0)&&(nextBrowserNo < BarkerSettings.getMaxBrowserViewsPerTab())) {
        BarkerBrowser.loadUrlInActualTab(nextBrowserNo, uri);
    } else {
        BarkerBrowser.loadUrlInActualTab(1, uri);
    }
}

static openLinkInNextTab(browserNo: number, tabIdNo: number) {
    //THINK HOW TO TO ENTER TARGET TABID
}

static addToBookmarks(uri: string) {
    if (BarkerData.bookmarkTopics.length == 0) {
        BarkerData.bookmarkTopics.push('Bookmarks');
    }
    BarkerData.addBookmark('Bookmarks', BarkerUtils.getNameFromUrl(uri), uri);
    BarkerSaveLoadState.saveBookmark('Bookmarks', uri);
    BarkerMenu.createMainMenu(BarkerBrowser.mainWindow);
}

static createBrowserView(tabNo:number, browserNo: number, firstBrowser: boolean) {

    //browser window
    let browser = new BrowserView({webPreferences: {
                                devTools: true, 
                                autoplayPolicy: 'document-user-activation-required',
                                sandbox: false
                                }});
    browser.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    if (BarkerSettings.getUserAgent() != '') browser.webContents.setUserAgent(BarkerSettings.getUserAgent());
    browser.webContents.loadFile('../html/default_browser.html');
    BarkerBrowser.mainWindow.addBrowserView(browser);
    const tabId = 'NewTab' + tabNo;

    if (firstBrowser) {
        let browserViews = BarkerBrowser.mainWindow.getBrowserViews();
        let firstBrowserNo = browserViews.length - 1;
        BarkerData.setTabFirstBrowserViewNo(tabId, firstBrowserNo);
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createBrowserView(): _mapTabsToFirstBrowserViewNo sets tabId=" + tabId + ", firstBrowserViewNo="+firstBrowserNo);
    }

    //BrowserView navigation events (for later get URL and write it somewhere so user can see actual URL)
    browser.webContents.on('will-navigate', function(event, url) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "BrowserView Navigation event: url=" + url);
        
        const addresses = BarkerData.getTabAddresses(BarkerBrowser.actualTabId);    //get map of addresses for current tab
        if (addresses) {
            addresses.set(browserNo, url);
        }
        BarkerBrowser.mainWindow.webContents.send('update-url', browserNo, url);
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
                click: () => { BarkerBrowser.openLinkInNextWindow(browserNo, (parameters as any).linkURL); }
            },
            {
                label: 'Open link in next empty window',
                visible: ((parameters as any).linkURL) &&(BarkerBrowser.getNextEmptyBrowserNo(browserNo) > 0),
                click: () => { BarkerBrowser.openLinkInNextEmptyWindow(browserNo, (parameters as any).linkURL); }
            },
            /*
            {
                label: 'Zoom',
                visible: !BarkerZoom.isZoomed(tabNo, browserNo),
                click: () => {BarkerZoom.zoomBrowserView(browserNo);}
            },
            {
                label: 'Unzoom',
                visible: BarkerZoom.isZoomed(tabNo, browserNo),
                click: () => {BarkerZoom.unzoomBrowserView(); }
            },*/         
            {
                label: 'Download',
                visible: ((parameters as any).linkURL),
                click: () => { BarkerDownload.downloadFile((parameters as any).linkURL); }
            },
            {
                label: 'Bookmark link',
                visible: ((parameters as any).linkURL),
                click: () => { BarkerBrowser.addToBookmarks((parameters as any).linkURL); }
            },
            {
                label: 'Bookmark actual address',
                visible: true,
                click: () => { BarkerBrowser.addToBookmarks(browser.webContents.getURL());}
            },
            ]
    });

    //keyboard shortcuts
    browser.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.key.toLowerCase() === 'f') {             //ctrl+f
            event.preventDefault();
            BarkerData.setActiveBrowserView(browser);
            BarkerBrowser.mainWindow.webContents.send('show-searchbar');
        } else if ((input.control && input.key.toLowerCase() === 'r') || (input.key === 'F5')) {    //ctrl+r/F5
            browser.webContents.reloadIgnoringCache();
        }
    })
}

static createBrowserViewsForOneTab(tabNo: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createBrowserViewsForOneTab()");

    //create 2 zoom browsers windows
    BarkerZoom.createZoomWindowsForOneTab(tabNo);
     
     //create browser windows
     BarkerBrowser.createBrowserView(tabNo, 1, true);
    for (let i=1; i<BarkerSettings.getMaxBrowserViewsPerTab();i++) {
        BarkerBrowser.createBrowserView(tabNo, i+1, false);
    }
    
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews();
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createBrowserViewsForOneTab(): browserViews=" + browserViews.length);
}

removeBrowserViewsForOneTab(tabName: string) {

}

static hideAllBrowserViews() {
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews()
    for (let i=0; i<browserViews.length;i++) {
            browserViews[i].setBounds({ x: 0, y: 0, width: 0, height: 0 });
    }
}

static removeAllBrowserViews() {
    //BarkerBrowser.mainWindow.removeBrowserView(browser);
}

static showBrowserHeader(browserNo: number, left: number, top: number, browserWidth: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showBrowserHeader(): browserNo="+browserNo+", left="+left+", top="+top);
    BarkerBrowser.mainWindow.webContents.send('create-browser-header', browserNo, left, top, browserWidth);
}

static showBrowserView(browserViewNo: number, _left: number, _top: number, _width: number, _height: number) {
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews()
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showBrowserView(): browserViews=" + browserViews.length+", browserViewNo="+browserViewNo);
    if (browserViews[browserViewNo]) {
        browserViews[browserViewNo].setBounds({ x: _left, y: _top, width: _width, height: _height }); 
    } else {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showBrowserView(): ERROR! browserViews=" + browserViews.length+", browserViewNo="+browserViewNo+", browserViews[browserViewNo]="+browserViews[browserViewNo]);
    }
}

static showBrowsers_showSidebar() {
    var maxWidth, maxHeight;
    let _left = 10;
    let _top = 100;
    const currentBounds = BarkerBrowser.mainWindow.getBounds();
    maxHeight = currentBounds.height - 100;  //probably menu and app border takes about 60px
    maxWidth = currentBounds.width - 30;

    BarkerBrowser.hideAllBrowserViews();
    BarkerBrowser.mainWindow.webContents.send('delete-all-browser-headers');
    BarkerBrowser.mainWindow.webContents.send('delete-all-browser-headers-sidebar');
    BarkerSideBar.updateRollingTextSidebar();
    
    const sidebar_browser_rows = BarkerData.getSidebarLayoutNo();
    const sidebar_browser_width = BarkerData.getFrameSidebarWidth() - 10;
    const sidebar_browser_height = Math.floor((maxHeight-BarkerData.getFrameTopBarHeight()-BarkerData.getFrameBottomBarHeight())/ sidebar_browser_rows);
    var firstBrowserViewNo = BarkerData.getFirstBrowserViewNo_sidebar();
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), " showBrowsers(): firstBrowserViewNo="+firstBrowserViewNo+", _left="+_left+", _top="+_top+", sidebar_browser_rows="+sidebar_browser_rows+", sidebar_browser_width="+sidebar_browser_width+", sidebar_browser_height="+sidebar_browser_height);
    for (var i = 1; i<= sidebar_browser_rows; i++) {
        const browserViewNo = BarkerData.getSidebarRollingWindowOffset()+firstBrowserViewNo+i-1;
        if (BarkerSettings.getShowBrowserHeaders()) {
            BarkerSideBar.showSidebarBrowserHeader(BarkerData.getSidebarRollingWindowOffset()+i, _left, _top, sidebar_browser_width, BarkerSettings.getBrowserHeaderHeight());
            BarkerBrowser.showBrowserView(browserViewNo, _left, _top+BarkerSettings.getBrowserHeaderHeight(), sidebar_browser_width, sidebar_browser_height-BarkerSettings.getBrowserHeaderHeight());
        } else {
            BarkerBrowser.showBrowserView(browserViewNo, _left, _top, sidebar_browser_width, sidebar_browser_height);
        }
        BarkerSideBar.mainWindow.webContents.send('update-url-sidebar', i, BarkerData.getSidebarUrl(i));
        _top+= sidebar_browser_height;
    }
}

static calculateBrowserWindowPosition_mainArea(windowsCnt: number, browserNo: number) {
    var browser_width: number, browser_height: number, maxWidth: number, maxHeight: number;
    let _left = 10;
    let _top = 100;
    const currentBounds = BarkerBrowser.mainWindow.getBounds();
    maxHeight = currentBounds.height - 100;  //probably menu and app border takes about 60px
    maxWidth = currentBounds.width - 30;
    maxWidth -= BarkerData.getFrameSidebarWidth();
    maxWidth -= BarkerData.getFrameRightBarWidth();
    _left = BarkerData.getFrameSidebarWidth() + 10;
    _top = BarkerData.getFrameTopBarHeight();
    var _leftHeader = 0;
    var _topHeader = 0;
    var browserHeadersHeight = 0;
    if (BarkerSettings.getShowBrowserHeaders()) browserHeadersHeight = BarkerSettings.getBrowserHeaderHeight();

    if (windowsCnt == 2) {
        browser_width = Math.floor(maxWidth / 2);
        browser_height = maxHeight - BarkerData.getFrameTopBarHeight() - browserHeadersHeight;

        BarkerBrowser.browserHeaderPosition.x = _leftHeader + (browser_width * (browserNo-1));
        BarkerBrowser.browserHeaderPosition.y = _topHeader;
        BarkerBrowser.browserHeaderPosition.width = browser_width;
        BarkerBrowser.browserHeaderPosition.height = browserHeadersHeight;

        BarkerBrowser.browserWindowPosition.x = _left + (browser_width * (browserNo-1));
        BarkerBrowser.browserWindowPosition.y = _top + browserHeadersHeight;
        BarkerBrowser.browserWindowPosition.width = browser_width;
        BarkerBrowser.browserWindowPosition.height = browser_height;
    } else {
        _left = BarkerData.getFrameSidebarWidth() + 10;
        _top += browserHeadersHeight;
        const browser_rows = Math.floor(Math.sqrt(windowsCnt));
        const browser_cols = Math.floor(Math.sqrt(windowsCnt));
        const browser_rowNo = Math.floor((browserNo-1)/browser_rows);
        const browser_colNo = (browserNo-1) % browser_cols;
        browser_width = Math.floor(maxWidth / Math.floor(Math.sqrt(windowsCnt)));
        browser_height = Math.floor((maxHeight-_top) / Math.floor(Math.sqrt(windowsCnt)));

        BarkerBrowser.browserHeaderPosition.x = _leftHeader + (browser_width * (browserNo-1));
        BarkerBrowser.browserHeaderPosition.y = _topHeader;
        BarkerBrowser.browserHeaderPosition.width = browser_width;
        BarkerBrowser.browserHeaderPosition.height = browserHeadersHeight;

        BarkerBrowser.browserWindowPosition.x = _left + (browser_colNo * browser_width);
        BarkerBrowser.browserWindowPosition.y = _top + (browser_rowNo * (browser_height+browserHeadersHeight));
        BarkerBrowser.browserWindowPosition.width = browser_width;
        BarkerBrowser.browserWindowPosition.height = browser_height;
    }
}

static showBrowsers_showMainArea(windowsCnt: number, tabId: string, offset: number) {
    BarkerBrowser.updateRollingText();

    var firstBrowserViewNo = BarkerData.getTabFirstBrowserViewNo(tabId);
    if (!firstBrowserViewNo) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showBrowsers_showMainArea(): no firstBrowserView found, not displaying any browser windows for this tab");
        return;
    }
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showBrowsers_showMainArea(): firstBrowserViewNo=" + firstBrowserViewNo);

    //show browser windows
    for (var i = 1; i<= windowsCnt; i++) {
        BarkerBrowser.calculateBrowserWindowPosition_mainArea(windowsCnt, i);
        BarkerBrowser.showBrowserHeader(offset+i, BarkerBrowser.browserHeaderPosition.x, BarkerBrowser.browserHeaderPosition.y, BarkerBrowser.browserHeaderPosition.width); //position relative in frame
        const browserViewNo = offset+firstBrowserViewNo+i-1;
        BarkerBrowser.showBrowserView(browserViewNo, BarkerBrowser.browserWindowPosition.x, BarkerBrowser.browserWindowPosition.y, BarkerBrowser.browserWindowPosition.width, BarkerBrowser.browserWindowPosition.height);
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showBrowsers_showMainArea(): browserViewNo="+browserViewNo+", x="+BarkerBrowser.browserWindowPosition.x+", y="+BarkerBrowser.browserWindowPosition.y+", width="+BarkerBrowser.browserWindowPosition.width+", height="+BarkerBrowser.browserWindowPosition.height);
    }
}

static showBrowsers (windowsCnt: number, tabId: string, offset: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showBrowsers(): cnt=" + windowsCnt +", tabId="+tabId+", offset="+offset);
    BarkerBrowser.showBrowsers_showSidebar();
    BarkerBrowser.showBrowsers_showMainArea(windowsCnt, tabId, offset);

    //display zoomed window does not work now
    /*
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews();
    let emptyZoomWindow = browserViews[firstBrowserViewNo-3];
    let zoomedWindowOnOriginalPosition = browserViews[firstBrowserViewNo];
    const zoomedBrowserView = BarkerData.getZoomedBrowserViewNo(BarkerBrowser.actualTabId);
    if (zoomedBrowserView) {
        emptyZoomWindow.setBounds({ x: 0, y: 0, width: 0, height: 0 });
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "setting Zoom window coordinates: ("+(zoomWindow_left.toString())+", 100, "+(zoomWindow_width.toString())+", "+((currentBounds.height-100).toString())+")");
        (<BrowserView>zoomedWindowOnOriginalPosition).setBounds(zoomedBrowserView.getBounds());
        (<BrowserView>zoomedBrowserView).setBounds({ x: zoomWindow_left, y: 100, width: zoomWindow_width, height: currentBounds.height-100 });
    } else {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "setting empty Zoom window coordinates: ("+(zoomWindow_left.toString())+", 100, "+(zoomWindow_width.toString())+", "+((currentBounds.height-100).toString())+")");
        emptyZoomWindow.setBounds({ x: zoomWindow_left, y: 100, width: zoomWindow_width, height: currentBounds.height-100 });
        //restore zoomedBrowserView???
    } 
    */

    //update URL in browser headers
    const addresses = BarkerData.getTabAddresses(BarkerBrowser.actualTabId);
    if (addresses) {
        for (let i=offset; i<=offset+windowsCnt; i++) {
            const address = addresses.get(i);
            BarkerBrowser.mainWindow.webContents.send('update-url', i, address);
        }
    }

    //status bar
    const currentBounds = BarkerBrowser.mainWindow.getBounds();
    BarkerStatusBar.setBoundsForStatusBar(0, currentBounds.height-70-BarkerData.getFrameBottomBarHeight(), currentBounds.width, BarkerData.getFrameBottomBarHeight() + 10);
}

static loadUrlInActualTab(browserNo: number, uri: string) {
    BarkerBrowser.loadURL(BarkerData.getActualTabId(), browserNo, uri);
}

static loadURL (tabIdName: string, browserNo: number, uri: string) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadURL(): browserNo="+browserNo+", uri="+uri);
    if (browserNo>BarkerSettings.getMaxBrowserViewsPerTab()) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadURL() ERROR - browserNo not valid! browserNo="+browserNo);
        return;
    }
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews();
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(tabIdName);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadURL(): BarkerBrowser.actualTabId="+BarkerBrowser.actualTabId+", firstBrowserNo="+firstBrowserNo);
    
    var uriWithProtocol = uri;
    if (!/^https?:\/\//i.test(uri)) {
        uriWithProtocol = 'https://' + uri;
    }    

    const browserViewNo = firstBrowserNo+browserNo-1;   //browserNo starts from 1
    if (isUrlHttp(uriWithProtocol)) {
        browserViews[browserViewNo].webContents.loadURL(uriWithProtocol);
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadURL(): browserViewNo="+browserViewNo);
        
        if (!BarkerData.uriAlreadyAdded(uriWithProtocol)) {
            BarkerSaveLoadState.saveTypedAddress(uriWithProtocol);
        }
    } else {
        browserViews[browserViewNo].webContents.loadURL('https://www.google.com/search?q='+uri);
    }

    const addresses = BarkerData.getTabAddresses(tabIdName);    //get map of addresses for current tab
    if (addresses) {
        //URL already loaded, just overwrite
        addresses.set(browserNo, uri);
    }else{
        //first time load URL
        let map = new Map<number, string>;
        map.set(browserNo, uri);
        BarkerData.setTabAddresses(tabIdName, map);
    }
}

static getNextTabId () {
    //find current tab
    var i;
    for (i=0; i<BarkerData.getOrderedTabIdsArray().length;i++) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "getNextTabId(): i="+i+", _orderedTabIds[i]="+BarkerData.getOrderedTabIdName(i));
        if (BarkerData.getOrderedTabIdName(i) == BarkerBrowser.actualTabId) break;
    }
    
    //return next tab
    if (i<BarkerData.getOrderedTabIdsArray().length-1) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "getNextTabId(): Returning i="+i+", _orderedTabIds[i+1]="+BarkerData.getOrderedTabIdName(i+1));
        return BarkerData.getOrderedTabIdName(i+1); 
    } else {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "getNextTabId(): Returning i="+i+", _orderedTabIds[0]="+BarkerData.getOrderedTabIdName(0));
        return BarkerData.getOrderedTabIdName(0);
    }
}

static updateRollingText() {
    var rollingText = (BarkerData.getTabBrowserOffset(BarkerBrowser.actualTabId)+1).toString();
    const layout = BarkerData.getTabLayoutNo(BarkerBrowser.actualTabId);
    if (layout>1) rollingText += '-' + (BarkerData.getTabBrowserOffset(BarkerBrowser.actualTabId) + layout);
    rollingText += '/' + BarkerSettings.getMaxBrowserViewsPerTab();
    BarkerBrowser.mainWindow.webContents.send('update-rolling-browsers-text', rollingText);
}

static getMatchedAddressBarBounds(browserNo: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "getMatchedAddressBarBounds(): browserNo="+browserNo);
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabId());
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews();
    let browser =  <BrowserView>browserViews[firstBrowserNo+browserNo];
    if (browser) {
        const currentBounds = browser.getBounds();
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "getMatchedAddressBarBounds(): x="+currentBounds.x+", y="+currentBounds.y+", width="+currentBounds.width+", height="+currentBounds.height);
        currentBounds.y += 20;
        currentBounds.width = 200;
        currentBounds.height = 50;
        return currentBounds;
    } else {
        //return Electron.Rectangle(0,0,0,0);
    }
}

static showMatchedAddresses(uri: string, browserNo: number) {
    BarkerBrowser.matchedAddressesBrowerView.webContents.loadURL("data:text/html;charset=utf-8,<body>" + uri + "</body>");
    BarkerBrowser.matchedAddressesBrowerView.setBounds(BarkerBrowser.getMatchedAddressBarBounds(browserNo));
    BarkerBrowser.mainWindow.setTopBrowserView(BarkerBrowser.matchedAddressesBrowerView);
}

}
