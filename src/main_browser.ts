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
*/


//static properties
static mainWindow: Electron.BrowserWindow = null;
static activeBrowserView: Electron.BrowserView = null;
static showBrowserHeaders = true;
static browserHeaderButtonsString: string;
static actualTabId = 'NewTab1';
    
//ctor    
constructor (mainWindow: Electron.BrowserWindow) {
    BarkerBrowser.mainWindow = mainWindow;
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
    BarkerMenu.createMainMenu();
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
        let firstBrowserNo = browserViews.length;
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
                click: () => {
                    BarkerZoom.zoomBrowserView(browserNo);
                }
            },
            {
                label: 'Unzoom',
                visible: BarkerZoom.isZoomed(tabNo, browserNo),
                click: () => {
                    BarkerZoom.unzoomBrowserView();
                }
            },*/         
            {
                label: 'Download',
                visible: ((parameters as any).linkURL),
                click: () => {
                    BarkerDownload.downloadFile((parameters as any).linkURL);
                }
            },
            {
                label: 'Bookmark link',
                visible: ((parameters as any).linkURL),
                click: () => {
                    BarkerBrowser.addToBookmarks((parameters as any).linkURL);
                }
            },
            {
                label: 'Bookmark actual address',
                visible: true,
                click: () => {
                    BarkerBrowser.addToBookmarks(browser.webContents.getURL());
                }
            },
            ]
    });

    //keyboard shortcuts
    browser.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.key.toLowerCase() === 'f') {             //ctrl+f
            event.preventDefault();
            BarkerData.setActiveBrowserView(browser);
            BarkerBrowser.mainWindow.webContents.send('show-searchbar');
        }/* else if (input.control && input.key.toLowerCase() === 'p') {      //ctrl+p
            event.preventDefault();
            showPreferences();
        } */else if ((input.control && input.key.toLowerCase() === 'r') || (input.key === 'F5')) {    //ctrl+r/F5
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
    let browserNo = 0;
    for (var i = 1; i<= sidebar_browser_rows; i++) {
        if (BarkerSettings.getShowBrowserHeaders()) {
            BarkerSideBar.showSidebarBrowserHeader(BarkerData.getSidebarRollingWindowOffset()+browserNo+1, _left, _top, sidebar_browser_width, BarkerSettings.getBrowserHeaderHeight());
            BarkerBrowser.showBrowserView(BarkerData.getSidebarRollingWindowOffset()+firstBrowserViewNo+browserNo+1, _left, _top+BarkerSettings.getBrowserHeaderHeight(), sidebar_browser_width, sidebar_browser_height-BarkerSettings.getBrowserHeaderHeight());
        } else {
            BarkerBrowser.showBrowserView(BarkerData.getSidebarRollingWindowOffset()+firstBrowserViewNo+browserNo+1, _left, _top, sidebar_browser_width, sidebar_browser_height);
        }
        browserNo++;
        _top+= sidebar_browser_height;
    }
}

static showBrowsers_showMainArea(windowsCnt: number, tabId: string, offset: number) {
    var browser_width, browser_height, maxWidth, maxHeight, zoomWindow_left, zoomWindow_width;
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

    BarkerBrowser.updateRollingText();
    for (let x in BarkerData.getTabFirstBrowserMap()) BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), " _mapTabsToFirstBrowserViewNo="+x);

    var firstBrowserViewNo = BarkerData.getTabFirstBrowserViewNo(tabId);
    if (!firstBrowserViewNo) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showBrowsers(): no firstBrowserView found, not displaying any browser windows for this tab");
        return;
    }
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showBrowsers(): firstBrowserViewNo=" + firstBrowserViewNo);

    //show browser windows
    if (windowsCnt == 2) {
        browser_width = Math.floor(maxWidth / 2); 
        if (BarkerSettings.getShowBrowserHeaders()) {
            browser_height = maxHeight - BarkerData.getFrameTopBarHeight() - BarkerSettings.getBrowserHeaderHeight();
        } else {
            browser_height = maxHeight - BarkerData.getFrameTopBarHeight();
        }
        for (var i = 0; i< 2; i++) {
            if (BarkerSettings.getShowBrowserHeaders()) {
                BarkerBrowser.showBrowserHeader(offset+i+1, _leftHeader, _topHeader, browser_width);
                BarkerBrowser.showBrowserView(offset+firstBrowserViewNo+i-1, _left, _top+BarkerSettings.getBrowserHeaderHeight(), browser_width, browser_height-BarkerSettings.getBrowserHeaderHeight());
            } else {
                BarkerBrowser.showBrowserView(offset+firstBrowserViewNo+i-1, _left, _top, browser_width, browser_height);
            }
            _left+= browser_width;
            _leftHeader+= browser_width;
        }
    } else {
        const browser_rows = Math.floor(Math.sqrt(windowsCnt));
        const browser_width = Math.floor(maxWidth / (Math.sqrt(windowsCnt)));
        const browser_height = Math.floor((maxHeight-_top) / (Math.sqrt(windowsCnt)));
        let browserNo = 0;
        for (var i = 1; i<= browser_rows; i++) {
            for (var j = 1; j<= browser_rows; j++) {
                BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showBrowsers(): firstBrowserViewNo="+firstBrowserViewNo+", browserNo="+browserNo);
                if (BarkerSettings.getShowBrowserHeaders()) {
                    BarkerBrowser.showBrowserHeader(offset+browserNo+1, _leftHeader, _topHeader, browser_width); //position relative in frame
                    BarkerBrowser.showBrowserView(offset+firstBrowserViewNo+browserNo-1, _left, _top+BarkerSettings.getBrowserHeaderHeight(), browser_width, browser_height-BarkerSettings.getBrowserHeaderHeight());
                } else {
                    BarkerBrowser.showBrowserView(offset+firstBrowserViewNo+browserNo-1, _left, _top, browser_width, browser_height);
                }
                _left+= browser_width;
                _leftHeader+= browser_width;
                browserNo++;
            }
            _left = BarkerData.getFrameSidebarWidth() + 10;       //absolute position for BrowserView
            _leftHeader = 0;                        //relative position for renderer_main frame
            _top+= browser_height;
            _topHeader+= browser_height;
        }
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
    let zoomedWindowOnOriginalPosition = browserViews[firstBrowserViewNo-2];
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
    if (browserNo<1 || browserNo>BarkerSettings.getMaxBrowserViewsPerTab()) {
        browserNo = 1
    } else {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadURL() ERROR - browserNo not valid! browserNo="+browserNo);
    }
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews();
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(tabIdName) - 2;
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadURL(): BarkerBrowser.actualTabId="+BarkerBrowser.actualTabId+", firstBrowserNo="+firstBrowserNo);
    
    var uriWithProtocol = uri;
    if (!/^https?:\/\//i.test(uri)) {
        uriWithProtocol = 'https://' + uri;
    }    

    if (isUrlHttp(uriWithProtocol)) {
        browserViews[firstBrowserNo+browserNo].webContents.loadURL(uriWithProtocol);
    } else {
        browserViews[firstBrowserNo+browserNo].webContents.loadURL('https://www.google.com/search?q='+uri);
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

}
