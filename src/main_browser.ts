import { BrowserView } from "electron";
import { BarkerData } from "./main_data";
import { BarkerUtils } from "./main_utils";
import { BarkerStatusBar } from "./main_statusbar";
import { BarkerSettings } from "./main_settings";
import { BarkerDownload } from "./main_download";
import { BarkerSideBar } from "./main_sidebar";
import { BarkerSaveLoadState } from "./main_saveLoadState";
import { BarkerKeyboardShortcuts } from "./main_keyboardShortcuts";
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
static clearRightSidebar()
static showRightSidebar()
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
static matchedAddressesBrowerView: Electron.BrowserView = null;
static browserHeaderPosition = {'x': 0, 'y': 0, 'width': 0, 'height': 0};
static browserWindowPosition = {'x': 0, 'y': 0, 'width': 0, 'height': 0};
static suggestionBoxBrowserNo = 0;
static rightSideBarBrowser: Electron.BrowserView = null;
static lastActiveDevToolsBrowserView: Electron.BrowserView = null;

//ctor    
constructor (mainWindow: Electron.BrowserWindow) {
    BarkerBrowser.mainWindow = mainWindow;

    //create BrowserView for matched addresses window
    let browser = new BrowserView({webPreferences: {
        devTools: true, 
        autoplayPolicy: 'document-user-activation-required',
        sandbox: false
        }});
    browser.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    BarkerBrowser.mainWindow.addBrowserView(browser);
    BarkerBrowser.matchedAddressesBrowerView = browser;

    //create BrowserView for right sidebar
    browser = new BrowserView({webPreferences: {
        devTools: true, 
        autoplayPolicy: 'document-user-activation-required',
        sandbox: false
        }});
    browser.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    BarkerBrowser.mainWindow.addBrowserView(browser);
    BarkerBrowser.rightSideBarBrowser = browser;
    
}

static isBodyFullyLoaded() {
    return (BarkerData.getMainBodyLoaded() && BarkerData.getLeftBodyLoaded() && BarkerData.getTopBodyLoaded() && BarkerData.getRightBodyLoaded() && BarkerData.getBottomBodyLoaded());
}

static showBrowsersIfBodyFullyLoaded() {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showBrowsersIfBodyFullyLoaded()");
    if (BarkerBrowser.isBodyFullyLoaded()) {
        const tabLayout = BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo());
        const sidebarLayout = BarkerData.getSidebarLayoutNo();
    
        BarkerStatusBar.createStatusBar();
        BarkerSideBar.createSidebar();
        BarkerBrowser.mainWindow.webContents.send('set-browser-header-buttons', BarkerData.getBrowserHeaderString());

        BarkerSaveLoadState.loadTabsFromFile();
        BarkerDownload.createDownloadEventCatcher();
    
        BarkerBrowser.mainWindow.webContents.send('set-layout-buttons', BarkerData.getLayoutString());
        const tabIdNo = BarkerData.getOrderedTabIdNo(0);
        if (BarkerData.getOrderedTabIdNumbersArray().length > 0) {
            BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createMainWindow(): tabId="+tabIdNo+", tabLayout="+tabLayout);
            BarkerBrowser.mainWindow.webContents.send('set-layout', Number(tabLayout));
            BarkerBrowser.mainWindow.webContents.send('activate-tab', 'NewTab'+tabIdNo);
            BarkerBrowser.mainWindow.webContents.send('set-next-tab-name', BarkerBrowser.getNextTabIdName());
            BarkerBrowser.mainWindow.webContents.send('set-sidebar-layout', Number(sidebarLayout));
            BarkerData.setActualTabIdNo(tabIdNo);
        }
        BarkerSaveLoadState.loadAddressesFromFile();
        BarkerData.setActualTabIdNo(BarkerData.getOrderedTabIdNo(0));
        let actualTabIdNo = BarkerData.getActualTabIdNo();
        BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(actualTabIdNo), actualTabIdNo, BarkerData.getTabBrowserOffset(actualTabIdNo));
    
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
    const addresses = BarkerData.getTabAddresses(BarkerData.getActualTabIdNo());
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

static createBrowserView(tabIdNo:number, browserNo: number, firstBrowser: boolean) {

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
    const tabIdName = 'NewTab' + tabIdNo;

    if (firstBrowser) {
        let browserViews = BarkerBrowser.mainWindow.getBrowserViews();
        let firstBrowserNo = browserViews.length - 1;
        BarkerData.setTabFirstBrowserViewNo(tabIdNo, firstBrowserNo);
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createBrowserView(): _mapTabsToFirstBrowserViewNo sets tabIdNo=" + tabIdNo + ", firstBrowserViewNo="+firstBrowserNo);
    }

    //BrowserView navigation events (for later get URL and write it somewhere so user can see actual URL)
    browser.webContents.on('will-navigate', function(event, url) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "BrowserView Navigation event: url=" + url);
        const addresses = BarkerData.getTabAddresses(BarkerData.getActualTabIdNo());    //get map of addresses for current tab
        if (addresses) {
            addresses.set(browserNo, url);
        }
        BarkerBrowser.mainWindow.webContents.send('update-url', browserNo, url);
    });
    browser.webContents.on('did-navigate-in-page', function(event, url) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "BrowserView Navigation event: url=" + url);
        const addresses = BarkerData.getTabAddresses(BarkerData.getActualTabIdNo());    //get map of addresses for current tab
        if (addresses) {
            addresses.set(browserNo, url);
        }
        BarkerBrowser.mainWindow.webContents.send('update-url', browserNo, url);
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
                click: () => { BarkerBrowser.openLinkInNextWindow(browserNo, (parameters as any).linkURL); }
            },
            {
                label: 'Open link in next empty window',
                visible: ((parameters as any).linkURL) &&(BarkerBrowser.getNextEmptyBrowserNo(browserNo) > 0),
                click: () => { BarkerBrowser.openLinkInNextEmptyWindow(browserNo, (parameters as any).linkURL); }
            },
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
}

static createBrowserViewsForOneTab(tabNo: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createBrowserViewsForOneTab()");

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

static hideAllBrowserViews_mainArea() {
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews()
    var firstBrowserViewNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabIdNo());
    for (let i=firstBrowserViewNo; i<=firstBrowserViewNo+BarkerSettings.getMaxBrowserViewsPerTab();i++) {
            if (browserViews[i]) {
                browserViews[i].setBounds({ x: 0, y: 0, width: 0, height: 0 });
            }
    }
}


static hideAllBrowserViews_sidebar() {
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews()
    var firstBrowserViewNo = BarkerData.getFirstBrowserViewNo_sidebar();
    for (let i=firstBrowserViewNo; i<=firstBrowserViewNo+BarkerSettings.getMaxBrowserViewsPerTab();i++) {
            if (browserViews[i]) {
                browserViews[i].setBounds({ x: 0, y: 0, width: 0, height: 0 });
            }
    }
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

    const sidebar_browser_rows = BarkerData.getSidebarLayoutNo();
    const sidebar_browser_width = BarkerData.getFrameSidebarWidth() - 10;
    const sidebar_browser_height = Math.floor((maxHeight-BarkerData.getFrameTopBarHeight()-BarkerData.getFrameBottomBarHeight())/ sidebar_browser_rows);
    var firstBrowserViewNo = BarkerData.getFirstBrowserViewNo_sidebar();
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), " showBrowsers(): firstBrowserViewNo="+firstBrowserViewNo+", _left="+_left+", _top="+_top+", sidebar_browser_rows="+sidebar_browser_rows+", sidebar_browser_width="+sidebar_browser_width+", sidebar_browser_height="+sidebar_browser_height);

    BarkerBrowser.hideAllBrowserViews_sidebar();
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

//calculate browser window position 
//(browserHeader is relative to position in main frame - sent to renderer and created there
// but browserWindow is absolute position)
static calculateBrowserWindowPosition_mainArea(windowsCnt: number, browserNo: number) {
    var browser_width: number, maxWidth: number, maxHeight: number;
    let _left = 10;
    let _top = 100;
    const currentBounds = BarkerBrowser.mainWindow.getBounds();
    maxHeight = currentBounds.height - BarkerData.frameBottomBar_height;
    maxWidth = currentBounds.width - 30;
    maxWidth -= (BarkerData.getFrameSidebarWidth() + BarkerData.getFrameRightBarWidth() + 10);
    _left = BarkerData.getFrameSidebarWidth() + 10;
    _top = BarkerData.getFrameTopBarHeight();
    var _leftHeader = 0;
    var _topHeader = 0;
    var browserHeadersHeight = 0;
    if (BarkerSettings.getShowBrowserHeaders()) browserHeadersHeight = BarkerSettings.getBrowserHeaderHeight();

    if (windowsCnt == 2) {
        browser_width = Math.floor(maxWidth / 2);
        const browser_height = maxHeight - _top - browserHeadersHeight - 70;

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
        browser_width = Math.floor(maxWidth / browser_cols);
        const browser_height_brutto = Math.floor((maxHeight-_top) / browser_rows);
        const browser_height_netto = browser_height_brutto - browserHeadersHeight;

        BarkerBrowser.browserHeaderPosition.x = _leftHeader + (browser_colNo * browser_width);
        BarkerBrowser.browserHeaderPosition.y = _topHeader + (browser_rowNo * browser_height_brutto);
        BarkerBrowser.browserHeaderPosition.width = browser_width;
        BarkerBrowser.browserHeaderPosition.height = browserHeadersHeight;

        BarkerBrowser.browserWindowPosition.x = _left + (browser_colNo * browser_width);
        BarkerBrowser.browserWindowPosition.y = _top + (browser_rowNo * browser_height_brutto);
        BarkerBrowser.browserWindowPosition.width = browser_width;
        BarkerBrowser.browserWindowPosition.height = browser_height_netto;
    }
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "calculateBrowserWindowPosition_mainArea(): browserNo="+browserNo);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "calculateBrowserWindowPosition_mainArea(): header x="+BarkerBrowser.browserHeaderPosition.x+", y="+BarkerBrowser.browserHeaderPosition.y+", width="+BarkerBrowser.browserHeaderPosition.width+", height="+BarkerBrowser.browserHeaderPosition.height);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "calculateBrowserWindowPosition_mainArea(): window x="+BarkerBrowser.browserWindowPosition.x+", y="+BarkerBrowser.browserWindowPosition.y+", width="+BarkerBrowser.browserWindowPosition.width+", height="+BarkerBrowser.browserWindowPosition.height);
}

static showBrowsers_showMainArea(windowsCnt: number, tabIdNo: number, offset: number) {
    var firstBrowserViewNo = BarkerData.getTabFirstBrowserViewNo(tabIdNo);
    if (!firstBrowserViewNo) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showBrowsers_showMainArea(): no firstBrowserView found, not displaying any browser windows for this tab");
        return;
    }
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showBrowsers_showMainArea(): firstBrowserViewNo=" + firstBrowserViewNo);

    //show browser windows
    BarkerBrowser.hideAllBrowserViews_mainArea();
    for (var i = 1; i<= windowsCnt; i++) {
        BarkerBrowser.calculateBrowserWindowPosition_mainArea(windowsCnt, i);
        BarkerBrowser.showBrowserHeader(offset+i, BarkerBrowser.browserHeaderPosition.x, BarkerBrowser.browserHeaderPosition.y, BarkerBrowser.browserHeaderPosition.width); //position relative in frame
        const browserViewNo = offset+firstBrowserViewNo+i-1;
        BarkerBrowser.showBrowserView(browserViewNo, BarkerBrowser.browserWindowPosition.x, BarkerBrowser.browserWindowPosition.y, BarkerBrowser.browserWindowPosition.width, BarkerBrowser.browserWindowPosition.height);
    }
}

static clearRightSidebar() {
    if (BarkerBrowser.lastActiveDevToolsBrowserView) {
        BarkerBrowser.lastActiveDevToolsBrowserView.webContents.closeDevTools();
        BarkerBrowser.lastActiveDevToolsBrowserView = null;
    }
    BarkerBrowser.rightSideBarBrowser.setBounds({ x: 0, y: 0, width: 0, height: 0});
}

static showRightSidebar() {
    let bounds = BarkerBrowser.mainWindow.getBounds();
    bounds.x = bounds.width - BarkerData.frameRightBar_width;
    bounds.y += 10;
    bounds.width = BarkerData.frameRightBar_width - 30;
    bounds.height -= 100;
    BarkerBrowser.rightSideBarBrowser.setBounds({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height});
}

static updateMainArea(windowsCnt: number, tabIdNo: number, offset: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "updateMainArea(): cnt=" + windowsCnt +", tabIdNo="+tabIdNo+", offset="+offset);

    BarkerBrowser.hideAllBrowserViews_mainArea();
    BarkerBrowser.mainWindow.webContents.send('delete-all-browser-headers');
    BarkerBrowser.updateRollingText();
    BarkerBrowser.showBrowsers_showMainArea(windowsCnt, tabIdNo, offset);

    //update URL in browser headers
    const addresses = BarkerData.getTabAddresses(BarkerData.getActualTabIdNo());
    if (addresses) {
        for (let i=offset; i<=offset+windowsCnt; i++) {
            const address = addresses.get(i);
            if (address) {
                BarkerBrowser.mainWindow.webContents.send('update-url', i, address);
            }
        }
    }
}

static showBrowsers (windowsCnt: number, tabIdNo: number, offset: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showBrowsers(): cnt=" + windowsCnt +", tabIdNo="+tabIdNo+", offset="+offset);

    BarkerBrowser.mainWindow.webContents.send('delete-all-browser-headers');
    BarkerBrowser.mainWindow.webContents.send('delete-all-browser-headers-sidebar');
    BarkerBrowser.updateRollingText();
    BarkerSideBar.updateRollingTextSidebar();

    BarkerBrowser.showBrowsers_showSidebar();
    BarkerBrowser.showBrowsers_showMainArea(windowsCnt, tabIdNo, offset);
    BarkerBrowser.showRightSidebar();

    //update URL in browser headers
    const addresses = BarkerData.getTabAddresses(BarkerData.getActualTabIdNo());
    if (addresses) {
        for (let i=offset; i<=offset+windowsCnt; i++) {
            const address = addresses.get(i);
            if (address) {
                BarkerBrowser.mainWindow.webContents.send('update-url', i, address);
            }
        }
    }

    //status bar
    const currentBounds = BarkerBrowser.mainWindow.getBounds();
    BarkerStatusBar.setBoundsForStatusBar(0, currentBounds.height-70-BarkerData.getFrameBottomBarHeight(), currentBounds.width, BarkerData.getFrameBottomBarHeight() + 10);
}

static loadUrlInActualTab(browserNo: number, uri: string) {
    BarkerBrowser.loadURL(BarkerData.getActualTabIdNo(), browserNo, uri);
}

static loadURL (tabIdNo: number, browserNo: number, uri: string) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadURL(): browserNo="+browserNo+", uri="+uri);
    if (browserNo>BarkerSettings.getMaxBrowserViewsPerTab()) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadURL() ERROR - browserNo not valid! browserNo="+browserNo);
        return;
    }
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews();
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(tabIdNo);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadURL(): actualTabId="+BarkerData.getActualTabIdNo()+", firstBrowserNo="+firstBrowserNo);
    
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

    const addresses = BarkerData.getTabAddresses(tabIdNo);    //get map of addresses for current tab
    if (addresses) {
        //URL already loaded, just overwrite
        addresses.set(browserNo, uri);
    }else{
        //first time load URL
        let map = new Map<number, string>;
        map.set(browserNo, uri);
        BarkerData.setTabAddresses(tabIdNo, map);
    }
}

static getNextTabIdName() {
    return 'NewTab' + BarkerBrowser.getNextTabIdNo();
}

static getNextTabIdNo () {
    //find current tab
    var i;
    for (i=0; i<BarkerData.getOrderedTabIdNumbersArray().length;i++) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "getNextTabIdNo(): i="+i+", _orderedTabIds[i]="+BarkerData.getOrderedTabIdName(i));
        if (BarkerData.getOrderedTabIdNo(i) == BarkerData.getActualTabIdNo()) break;
    }
    
    //return next tab
    if (i<BarkerData.getOrderedTabIdNumbersArray().length-1) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "getNextTabIdNo(): Returning i="+i+", _orderedTabIds[i+1]="+BarkerData.getOrderedTabIdName(i+1));
        return BarkerData.getOrderedTabIdNo(i+1); 
    } else {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "getNextTabIdNo(): Returning i="+i+", _orderedTabIds[0]="+BarkerData.getOrderedTabIdName(0));
        return BarkerData.getOrderedTabIdNo(0);
    }
}

static updateRollingText() {
    const actualTabIdNo = BarkerData.getActualTabIdNo();
    var rollingText = (BarkerData.getTabBrowserOffset(actualTabIdNo)+1).toString();
    const layout = BarkerData.getTabLayoutNo(actualTabIdNo);
    if (layout>1) rollingText += '-' + (BarkerData.getTabBrowserOffset(actualTabIdNo) + layout);
    rollingText += '/' + BarkerSettings.getMaxBrowserViewsPerTab();
    BarkerBrowser.mainWindow.webContents.send('update-rolling-browsers-text', rollingText);
}

static showMatchedAddresses(uri: string, browserNo: number) {
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabIdNo());
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews();
    let browser =  <BrowserView>browserViews[firstBrowserNo+browserNo-1];
    if (browser) {
        //shift BrowserView top-border lower to see suggestion bar 
        //(it is not possible to draw HTML element over BrowserView object in Electron)
        BarkerBrowser.calculateBrowserWindowPosition_mainArea(BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo()), browserNo);
        BarkerBrowser.browserWindowPosition.y += 50;
        BarkerBrowser.browserWindowPosition.height -= 50;
        browser.setBounds({ x:BarkerBrowser.browserWindowPosition.x, y:BarkerBrowser.browserWindowPosition.y, width:BarkerBrowser.browserWindowPosition.width, height:BarkerBrowser.browserWindowPosition.height});

        //draw suggestion box
        BarkerBrowser.browserHeaderPosition.x += 220;
        BarkerBrowser.browserHeaderPosition.y += BarkerSettings.getBrowserHeaderHeight();
        BarkerBrowser.browserHeaderPosition.width = BarkerBrowser.browserHeaderPosition.width / 3;
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showMatchedAddresses(): x="+BarkerBrowser.browserHeaderPosition.x+", y="+BarkerBrowser.browserHeaderPosition.y+", width="+BarkerBrowser.browserHeaderPosition.width+", height="+BarkerBrowser.browserHeaderPosition.height);
        BarkerBrowser.mainWindow.webContents.send('show-matched-addresses', uri, BarkerBrowser.browserHeaderPosition.x, BarkerBrowser.browserHeaderPosition.y);

        //store browserNo for time when address is clicked
        BarkerBrowser.suggestionBoxBrowserNo = browserNo;
    }
}

static createTab(paramTabIdNo = 0) {
    let tabName: string;
    let tabIdNo = paramTabIdNo;

    if (tabIdNo == 0) {
        tabIdNo = BarkerData.getHighestTabNo() + 1;
        tabName = 'Bookmarks' + tabIdNo;
    } else {
        tabName = BarkerData.getTabName(tabIdNo);
    }

    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createTab(): tabIdNo="+tabIdNo);
    BarkerData.setTabLayoutNo(tabIdNo, BarkerSettings.getDefautLayoutNo());
    BarkerData.getOrderedTabIdNumbersArray().push(tabIdNo);
    BarkerData.setTabName(tabIdNo, 'NewTab'+tabIdNo);
    BarkerData.setTabBrowserOffset(tabIdNo, 0);
    BarkerData.setTabCnt(BarkerData.getTabCnt() + 1);
    BarkerBrowser.createBrowserViewsForOneTab(tabIdNo);
    BarkerBrowser.mainWindow.webContents.send('create-tab', tabName);
    BarkerBrowser.mainWindow.webContents.send('set-next-tab-name', BarkerBrowser.getNextTabIdName());
    return tabIdNo;
}
}
