import { app, BrowserWindow, BrowserView, ipcMain, IpcMainEvent, dialog, Menu, MenuItem  } from "electron";
import { BarkerUtils } from './main_utils';
import { BarkerBrowser } from './main_browser';
import { BarkerData } from "./main_data";
import { BarkerSettings } from "./main_settings";
import { BarkerSaveLoadState } from "./main_saveLoadState";
import { BarkerSideBar } from "./main_sidebar";
import { BarkerMenu } from "./main_menu";

/* this class handles IPC (inter-process communication) between renderer and main process 
   see method registerIpcMethods() at the end for complete list of methods
   (only direction from renderer - to see both directions see preload.ts)
*/

export class BarkerIpc {

static mainWindow: Electron.BrowserWindow = null;

//ctor    
constructor (mainWindow: Electron.BrowserWindow) {
    BarkerIpc.mainWindow = mainWindow;
}

static ipcChangeLayout (event: IpcMainEvent, cnt: number) {
	BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcChangeLayout(): cnt="+cnt)
    BarkerData.setTabLayoutNo(BarkerData.getActualTabId(), cnt);
    BarkerBrowser.updateMainArea(cnt, BarkerData.getActualTabId(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabId()));
}

static ipcChangeSidebarLayout (event: IpcMainEvent, cnt: number) {
	BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcChangeSidebarLayout(): cnt="+cnt)
    BarkerData.setSidebarLayoutNo(cnt);
    BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(BarkerData.getActualTabId()), BarkerData.getActualTabId(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabId()));
}

static ipcLoadURL (event: IpcMainEvent, browserNo: number, address: string) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcLoadURL(): browserNo="+browserNo+", address="+address);
    BarkerBrowser.loadUrlInActualTab(browserNo, address);

    //restore BrowserView height
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabId());
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews();
    let browser =  <BrowserView>browserViews[firstBrowserNo+browserNo-1];
    if (browser) {
        BarkerBrowser.calculateBrowserWindowPosition_mainArea(BarkerData.getTabLayoutNo(BarkerData.getActualTabId()), browserNo);
        browser.setBounds({ x:BarkerBrowser.browserWindowPosition.x, y:BarkerBrowser.browserWindowPosition.y, width:BarkerBrowser.browserWindowPosition.width, height:BarkerBrowser.browserWindowPosition.height});
    }
}

static ipcLoadURLSidebar (event: IpcMainEvent, browserNo: number, address: string) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcLoadURL(): browserNo="+browserNo+", address="+address);
    BarkerSideBar.loadURLSidebar(browserNo, address);
}

static ipcCreateTab (event: IpcMainEvent, tabNo: number) {
	BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcCreateTab: tabNo="+tabNo);
    const tabId = 'NewTab' + tabNo;
    BarkerData.setTabLayoutNo(tabId, BarkerSettings.getDefautLayoutNo());
    BarkerData.getOrderedTabIdsArray().push(tabId);
    BarkerData.setTabName(tabId, 'NewTab'+tabNo);
    BarkerData.setTabBrowserOffset(tabId, 0);
    BarkerData.setTabCnt(BarkerData.getTabCnt() + 1);
    BarkerBrowser.createBrowserViewsForOneTab(tabNo);
    BarkerIpc.mainWindow.webContents.send('set-next-tab-name', BarkerBrowser.getNextTabId());
}

static ipcChangeTab (event: IpcMainEvent, tabId: string) {
	BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcChangeTab "+tabId);
    const layout = BarkerData.getTabLayoutNo(tabId);
    BarkerData.setActualTabId(tabId);
    BarkerIpc.mainWindow.webContents.send('set-layout', layout);
    BarkerIpc.mainWindow.webContents.send('set-next-tab-name', BarkerBrowser.getNextTabId());
    BarkerBrowser.showBrowsers(layout, tabId, BarkerData.getTabBrowserOffset(tabId));
}

static ipcDeleteTab(tabNo: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcDeleteTab()");
    var i: number;
    for (i=0; i<BarkerData.getOrderedTabIdsArray().length; i++){
        if (BarkerData.getOrderedTabIdName(i)==('NewTab'+tabNo)) break;
    }
    if (i<BarkerData.getOrderedTabIdsArray().length) {
         //_orderedTabIds = _orderedTabIds.splice(i,1); ???
    }
    BarkerData.getTabFirstBrowserMap().delete('NewTab'+tabNo);
}

static ipcSaveTabs (event: IpcMainEvent) {
    BarkerSaveLoadState.saveCurrentTabs();
}

static ipcRenameTab (event: IpcMainEvent, newTabName: string) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcRenameTab(): BarkerData.getActualTabId()="+BarkerData.getActualTabId()+", newTabName="+newTabName);
    BarkerData.setTabName(BarkerData.getActualTabId(), newTabName);
}

static updateRollingText() {
    var rollingText = (BarkerData.getTabBrowserOffset(BarkerData.getActualTabId())+1).toString();
    const layout = BarkerData.getTabLayoutNo(BarkerData.getActualTabId());
    if (layout>1) rollingText += '-' + (BarkerData.getTabBrowserOffset(BarkerData.getActualTabId()) + layout);
    rollingText += '/' + BarkerSettings.getMaxBrowserViewsPerTab();
    BarkerIpc.mainWindow.webContents.send('update-rolling-browsers-text', rollingText);
}

static updateRollingTextSidebar() {
    var rollingText = (BarkerData.getSidebarRollingWindowOffset()+1).toString();
    const layout = BarkerData.getSidebarLayoutNo();
    if (layout>1) rollingText += '-' + (BarkerData.getSidebarRollingWindowOffset() + layout);
    rollingText += '/' + BarkerSettings.getMaxBrowserViewsPerTab();
    BarkerIpc.mainWindow.webContents.send('update-rolling-browsers-text-sidebar', rollingText);
}

static ipcShowPreviousBrowser (event: IpcMainEvent) {
    const layout = BarkerData.getTabLayoutNo(BarkerData.getActualTabId());
    var browserOffset = BarkerData.getTabBrowserOffset(BarkerData.getActualTabId());
    if (browserOffset-layout > 0) {
        browserOffset -= layout;
    } else if (browserOffset == 0) {
        browserOffset = BarkerSettings.getMaxBrowserViewsPerTab() - layout;
    } else if (browserOffset-(2*layout) < 0 ) {
        browserOffset = 0;
    }
    BarkerData.setTabBrowserOffset(BarkerData.getActualTabId(), browserOffset);
    BarkerBrowser.showBrowsers(layout, BarkerData.getActualTabId(), browserOffset);
}

static ipcShowNextBrowser (event: IpcMainEvent) {
    const layout = BarkerData.getTabLayoutNo(BarkerData.getActualTabId());
    var browserOffset = BarkerData.getTabBrowserOffset(BarkerData.getActualTabId());
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcShowNextBrowser(): browserOffset="+browserOffset+", layout="+layout+", BarkerSettings.getMaxBrowserViewsPerTab()="+BarkerSettings.getMaxBrowserViewsPerTab());
    if (browserOffset+(2*layout) < BarkerSettings.getMaxBrowserViewsPerTab()) {
        browserOffset += layout;
    } else if (browserOffset+layout == BarkerSettings.getMaxBrowserViewsPerTab()) {
        browserOffset = 0;
    } else if (browserOffset+(2*layout) > BarkerSettings.getMaxBrowserViewsPerTab()-1) {
        browserOffset = BarkerSettings.getMaxBrowserViewsPerTab()-layout;
    }
    BarkerData.setTabBrowserOffset(BarkerData.getActualTabId(), browserOffset);
    BarkerBrowser.showBrowsers(layout, BarkerData.getActualTabId(), browserOffset);
}

static ipcShowPreviousBrowserSidebar (event: IpcMainEvent) {
    const layout = BarkerData.getSidebarLayoutNo();
    var browserOffset = BarkerData.getSidebarRollingWindowOffset();
    if (browserOffset-layout > 0) {
        browserOffset -= layout;
    } else if (browserOffset == 0) {
        browserOffset = BarkerSettings.getMaxBrowserViewsPerTab() - layout;
    } else if (browserOffset-(2*layout) < 0 ) {
        browserOffset = 0;
    }
    BarkerData.setSidebarRollingWindowOffset(browserOffset);
    BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(BarkerData.getActualTabId()), BarkerData.getActualTabId(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabId()));
}

static ipcShowNextBrowserSidebar (event: IpcMainEvent) {
    const layout = BarkerData.getSidebarLayoutNo();
    var browserOffset = BarkerData.getSidebarRollingWindowOffset();
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcShowNextBrowserSidebar(): browserOffset="+browserOffset+", layout="+layout+", BarkerSettings.getMaxBrowserViewsPerTab()="+BarkerSettings.getMaxBrowserViewsPerTab());
    if (browserOffset+(2*layout) < BarkerSettings.getMaxBrowserViewsPerTab()) {
        browserOffset += layout;
    } else if (browserOffset+layout == BarkerSettings.getMaxBrowserViewsPerTab()) {
        browserOffset = 0;
    } else if (browserOffset+(2*layout) > BarkerSettings.getMaxBrowserViewsPerTab()-1) {
        browserOffset = BarkerSettings.getMaxBrowserViewsPerTab()-layout;
    }
    BarkerData.setSidebarRollingWindowOffset(browserOffset);
    BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(BarkerData.getActualTabId()), BarkerData.getActualTabId(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabId()));
}

static ipcToggleShowHeaders (event: IpcMainEvent) {
    BarkerSettings.toggleShowBrowserHeaders();
    var browserOffset = BarkerData.getTabBrowserOffset(BarkerData.getActualTabId());
    const layout = BarkerData.getTabLayoutNo(BarkerData.getActualTabId());
    BarkerBrowser.showBrowsers(layout, BarkerData.getActualTabId(), browserOffset);
}

static ipcFindInPage (event: IpcMainEvent, text: string) {
    var options = {
        forward: true,
        findNext: true,
        matchCase: false,
        wordStart: false,
        medialCapitalAsWordStart: false
    }
    const requestId = BarkerData.getActiveBrowserView().webContents.findInPage(text, options);    
    BarkerData.getActiveBrowserView().webContents.on('found-in-page', (event, result) => {
        console.log(result.requestId);
        console.log(result.activeMatchOrdinal);
        console.log(result.matches);
        console.log(result.selectionArea);
    });
}

static ipcClearSelection (event: IpcMainEvent) {
	BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcClearSelection()");
    BarkerData.getActiveBrowserView().webContents.stopFindInPage('clearSelection');
}

static ipcGoBack (event: IpcMainEvent, browserNo: number) {
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabId());
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    const browserViewNo = firstBrowserNo+browserNo-1;
    if (browserViews[browserViewNo].webContents) {
        (<BrowserView>browserViews[browserViewNo]).webContents.goBack();
    }
}

static ipcGoForward (event: IpcMainEvent, browserNo: number) {
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabId());
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    const browserViewNo = firstBrowserNo+browserNo-1;
    if (browserViews[browserViewNo].webContents) {
        (<BrowserView>browserViews[browserViewNo]).webContents.goForward();
    }
}

static ipcReloadPage(event: IpcMainEvent, browserNo: number) {
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabId());
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    const browserViewNo = firstBrowserNo+browserNo-1;
    if (browserViews[browserViewNo].webContents) {
        (<BrowserView>browserViews[browserViewNo]).webContents.reloadIgnoringCache();
    }
}

static ipcReloadTab(event: IpcMainEvent, tabId: string) {
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(tabId);
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    for (let i=1; i< BarkerSettings.getMaxBrowserViewsPerTab(); i++) {
        const browserViewNo = firstBrowserNo+i-1;
        if (browserViews[browserViewNo].webContents) {
            (<BrowserView>browserViews[browserViewNo]).webContents.reloadIgnoringCache();
        }
    }
}

static ipcClearPage(event: IpcMainEvent, browserNo: number) {
    const addresses = BarkerData.getTabAddresses(BarkerData.getActualTabId());
    if (addresses) {
        addresses.set(browserNo, null);
        const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabId());
        let browserViews = BarkerIpc.mainWindow.getBrowserViews();
        const browserViewNo = firstBrowserNo+browserNo-1;
        if (browserViews[browserViewNo].webContents) {
            (<BrowserView>browserViews[browserViewNo]).webContents.close();
        }
    }
}

static ipcShowThreeDotsMenu(event: IpcMainEvent, browserNo: number) {
	BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcShowThreeDotsMenu(): browserNo="+browserNo)
    BarkerMenu.createThreeDotsMenu(browserNo).popup();
}

static ipcShowThreeDotsMenuSidebar(event: IpcMainEvent, browserNo: number) {
	BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcShowThreeDotsMenuSidebar(): browserNo="+browserNo)
    BarkerMenu.createThreeDotsMenu(browserNo, true).popup();
}

static ipcAddressKeyPressed(event: IpcMainEvent, browserNo: number, inputUrlAddress: string) {
    const uri = BarkerUtils.getMostSimilarTypedAddress(inputUrlAddress);
    if (uri) {
        BarkerBrowser.showMatchedAddresses(uri, browserNo);
    }
}

static ipcMatchedAddressSelected(event: IpcMainEvent, uri: string) {
    const browserNo = BarkerBrowser.suggestionBoxBrowserNo;
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcMatchedAddressSelected(): browserNo="+BarkerBrowser.suggestionBoxBrowserNo+", uri="+uri);
    BarkerBrowser.loadUrlInActualTab(browserNo, uri);

    //restore BrowserView height
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabId());
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews();
    let browser =  <BrowserView>browserViews[firstBrowserNo+browserNo-1];
    if (browser) {
        BarkerBrowser.calculateBrowserWindowPosition_mainArea(BarkerData.getTabLayoutNo(BarkerData.getActualTabId()), browserNo);
        browser.setBounds({ x:BarkerBrowser.browserWindowPosition.x, y:BarkerBrowser.browserWindowPosition.y, width:BarkerBrowser.browserWindowPosition.width, height:BarkerBrowser.browserWindowPosition.height});
    }
}

//---sidebar

static ipcAddressKeyPressedSidebar(event: IpcMainEvent, browserNo: number, inputUrlAddress: string) {
    const uri = BarkerUtils.getMostSimilarTypedAddress(inputUrlAddress);
    if (uri) {
        BarkerSideBar.showMatchedAddresses(uri, browserNo);
    }
}

static ipcMatchedAddressSelectedSidebar(event: IpcMainEvent, uri: string) {
    const browserNo = BarkerSideBar.suggestionBoxBrowserNo;
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcMatchedAddressSelectedSidebar(): browserNo="+BarkerSideBar.suggestionBoxBrowserNo+", uri="+uri);
    BarkerSideBar.loadURLSidebar(browserNo, uri);

    //restore BrowserView height
    const firstBrowserNo = BarkerData.getFirstBrowserViewNo_sidebar();
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews();
    let browser =  <BrowserView>browserViews[firstBrowserNo+browserNo-1];
    if (browser) {
        BarkerSideBar.calculateBrowserWindowPosition_sidebar(browserNo);
        browser.setBounds({ x:BarkerSideBar.browserWindowPosition.x, y:BarkerSideBar.browserWindowPosition.y, width:BarkerSideBar.browserWindowPosition.width, height:BarkerSideBar.browserWindowPosition.height});
    }
}

static ipcGoBackSidebar (event: IpcMainEvent, browserNo: number) {
    const firstBrowserNo = BarkerData.getFirstBrowserViewNo_sidebar();
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    const browserViewNo = firstBrowserNo+browserNo-1;
    if (browserViews[browserViewNo].webContents) {
        (<BrowserView>browserViews[browserViewNo]).webContents.goBack();
    }
}

static ipcGoForwardSidebar (event: IpcMainEvent, browserNo: number) {
    const firstBrowserNo = BarkerData.getFirstBrowserViewNo_sidebar();
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    const browserViewNo = firstBrowserNo+browserNo-1;
    if (browserViews[browserViewNo].webContents) {
        (<BrowserView>browserViews[browserViewNo]).webContents.goForward();
    }
}

static ipcReloadPageSidebar(event: IpcMainEvent, browserNo: number) {
    const firstBrowserNo = BarkerData.getFirstBrowserViewNo_sidebar();
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    const browserViewNo = firstBrowserNo+browserNo-1;
    if (browserViews[browserViewNo].webContents) {
        (<BrowserView>browserViews[browserViewNo]).webContents.reloadIgnoringCache();
    }
}

static ipcReloadTabSidebar(event: IpcMainEvent, tabId: string) {
    const firstBrowserNo = BarkerData.getFirstBrowserViewNo_sidebar();
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    for (let i=1; i< BarkerSettings.getMaxBrowserViewsPerTab(); i++) {
        const browserViewNo = firstBrowserNo+i-1;
        if (browserViews[browserViewNo].webContents) {
            (<BrowserView>browserViews[browserViewNo]).webContents.reloadIgnoringCache();
        }
    }
}

static ipcClearPageSidebar(event: IpcMainEvent, browserNo: number) {
    BarkerData.setSidebarUrl(browserNo, '');
    const firstBrowserNo = BarkerData.getFirstBrowserViewNo_sidebar();
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    const browserViewNo = firstBrowserNo+browserNo-1;
    if (browserViews[browserViewNo].webContents) {
        (<BrowserView>browserViews[browserViewNo]).webContents.close();
    }
}

static ipcMainBodyLoaded(event: IpcMainEvent, height: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcMainBodyLoaded(): height="+height);
    BarkerData.setFrameMainHeight(height);
    BarkerData.setMainBodyLoaded(true);
    BarkerBrowser.showBrowsersIfBodyFullyLoaded();
}

static ipcBottomBodyLoaded(event: IpcMainEvent, height: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcBottomBodyLoaded(): height="+height);
    BarkerData.setFrameBottomBarHeight(height);
    BarkerData.setBottomBodyLoaded(true);
    BarkerBrowser.showBrowsersIfBodyFullyLoaded();
}


static ipcLeftBodyLoaded(event: IpcMainEvent, width: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcLeftBodyLoaded(): width="+width);
    BarkerData.setFrameSidebarWidth(width);
    BarkerData.setLeftBodyLoaded(true);
    BarkerBrowser.showBrowsersIfBodyFullyLoaded();
}

static ipcTopBodyLoaded(event: IpcMainEvent, height: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcTopBodyLoaded(): height="+height);
    BarkerData.setFrameTopBarHeight(height);
    BarkerData.setTopBodyLoaded(true);
    BarkerBrowser.showBrowsersIfBodyFullyLoaded();
}

static ipcRightBodyLoaded(event: IpcMainEvent, width: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcRightBodyLoaded(): width="+width);
    BarkerData.setFrameRightBarWidth(width);
    BarkerData.setRightBodyLoaded(true);
    BarkerBrowser.showBrowsersIfBodyFullyLoaded();
}

static ipcLeftSidebarResized(event: IpcMainEvent, width: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcLeftSidebarResized(): width="+width);
    BarkerData.setFrameSidebarWidth(width);
    BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(BarkerData.getActualTabId()), BarkerData.getActualTabId(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabId()));
}

static ipcRightSidebarResized(event: IpcMainEvent, width: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcRightSidebarResized(): width="+width);
    BarkerData.setFrameRightBarWidth(width);
    BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(BarkerData.getActualTabId()), BarkerData.getActualTabId(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabId()));
}

static ipcTopBarResized(event: IpcMainEvent, height: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcTopBarResized(): height="+height);
    BarkerData.setFrameTopBarHeight(height);
    BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(BarkerData.getActualTabId()), BarkerData.getActualTabId(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabId()));
}

static ipcBottomBarResized(event: IpcMainEvent, height: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcBottomBarResized(): height="+height);
    BarkerData.setFrameBottomBarHeight(height);
    BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(BarkerData.getActualTabId()), BarkerData.getActualTabId(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabId()));
}

static registerIpcMethods() {
    //listen to IPC processes coming from HTML renderer
    ipcMain.on('create-tab', BarkerIpc.ipcCreateTab);
    ipcMain.on('change-tab', BarkerIpc.ipcChangeTab);
    ipcMain.on('rename-tab', BarkerIpc.ipcRenameTab);
    ipcMain.on('save-tabs', BarkerIpc.ipcSaveTabs);

    ipcMain.on('change-layout', BarkerIpc.ipcChangeLayout);
    ipcMain.on('change-sidebar-layout', BarkerIpc.ipcChangeSidebarLayout);

    ipcMain.on('show-next-browser', BarkerIpc.ipcShowNextBrowser);
    ipcMain.on('show-previous-browser', BarkerIpc.ipcShowPreviousBrowser);
    ipcMain.on('show-next-browser-sidebar', BarkerIpc.ipcShowNextBrowserSidebar);
    ipcMain.on('show-previous-browser-sidebar', BarkerIpc.ipcShowPreviousBrowserSidebar);

    ipcMain.on('toggle-show-headers', BarkerIpc.ipcToggleShowHeaders);

    ipcMain.on('load-url', BarkerIpc.ipcLoadURL);
    ipcMain.on('load-url-sidebar', BarkerIpc.ipcLoadURLSidebar);
    ipcMain.on('find-in-page', BarkerIpc.ipcFindInPage);
    ipcMain.on('clear-selection', BarkerIpc.ipcClearSelection);
    ipcMain.on('go-back', BarkerIpc.ipcGoBack);
    ipcMain.on('go-forward', BarkerIpc.ipcGoForward);
    ipcMain.on('reload-page', BarkerIpc.ipcReloadPage);
    ipcMain.on('reload-tab', BarkerIpc.ipcReloadTab);
    ipcMain.on('clear-page', BarkerIpc.ipcClearPage);
    ipcMain.on('go-back-sidebar', BarkerIpc.ipcGoBackSidebar);
    ipcMain.on('go-forward-sidebar', BarkerIpc.ipcGoForwardSidebar);
    ipcMain.on('reload-page-sidebar', BarkerIpc.ipcReloadPageSidebar);
    ipcMain.on('reload-tab-sidebar', BarkerIpc.ipcReloadTabSidebar);
    ipcMain.on('clear-page-sidebar', BarkerIpc.ipcClearPageSidebar);
    ipcMain.on('show-three-dots-menu', BarkerIpc.ipcShowThreeDotsMenu);
    ipcMain.on('show-three-dots-menu-sidebar', BarkerIpc.ipcShowThreeDotsMenuSidebar)
    ipcMain.on('address-key-pressed', BarkerIpc.ipcAddressKeyPressed);
    ipcMain.on('address-key-pressed-sidebar', BarkerIpc.ipcAddressKeyPressedSidebar);
    ipcMain.on('matched-address-selected', BarkerIpc.ipcMatchedAddressSelected);
    ipcMain.on('matched-address-selected-sidebar', BarkerIpc.ipcMatchedAddressSelectedSidebar);
    
    ipcMain.on('main-body-loaded', BarkerIpc.ipcMainBodyLoaded);
    ipcMain.on('top-body-loaded', BarkerIpc.ipcTopBodyLoaded);
    ipcMain.on('left-body-loaded', BarkerIpc.ipcLeftBodyLoaded);
    ipcMain.on('right-body-loaded', BarkerIpc.ipcRightBodyLoaded);
    ipcMain.on('bottom-body-loaded', BarkerIpc.ipcBottomBodyLoaded);

    ipcMain.on('left-sidebar-resized', BarkerIpc.ipcLeftSidebarResized)
    ipcMain.on('right-sidebar-resized', BarkerIpc.ipcRightSidebarResized)
    ipcMain.on('topbar-resized', BarkerIpc.ipcTopBarResized)
    ipcMain.on('bottombar-resized', BarkerIpc.ipcBottomBarResized)
}

}