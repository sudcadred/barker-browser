import { app, BrowserWindow, BrowserView, ipcMain, IpcMainEvent, dialog, Menu, MenuItem  } from "electron";
import { BarkerUtils } from './main_utils';
import { BarkerBrowser } from './main_browser';
import { BarkerData } from "./main_data";
import { BarkerSettings } from "./main_settings";
import { BarkerSaveLoadState } from "./main_saveLoadState";
import { BarkerSideBar } from "./main_sidebar";
import { BarkerMenu } from "./main_menu";
import { BarkerStatusBar } from "./main_statusbar";

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
    BarkerData.setTabLayoutNo(BarkerData.getActualTabIdNo(), cnt);
    BarkerBrowser.updateMainArea(cnt, BarkerData.getActualTabIdNo(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabIdNo()));
}

static ipcChangeSidebarLayout (event: IpcMainEvent, cnt: number) {
	BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcChangeSidebarLayout(): cnt="+cnt)
    BarkerData.setSidebarLayoutNo(cnt);
    BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo()), BarkerData.getActualTabIdNo(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabIdNo()));
}

static ipcLoadURL (event: IpcMainEvent, browserNo: number, address: string) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcLoadURL(): browserNo="+browserNo+", address="+address);
    BarkerBrowser.loadUrlInActualTab(browserNo, address);

    //restore BrowserView height
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabIdNo());
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews();
    let browser =  <BrowserView>browserViews[BarkerData.getBrowserViewNo(firstBrowserNo+browserNo-1)];
    if (browser) {
        BarkerBrowser.calculateBrowserWindowPosition_mainArea(BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo()), browserNo);
        browser.setBounds({ x:BarkerBrowser.browserWindowPosition.x, y:BarkerBrowser.browserWindowPosition.y, width:BarkerBrowser.browserWindowPosition.width, height:BarkerBrowser.browserWindowPosition.height});
    }
}

static ipcLoadURLSidebar (event: IpcMainEvent, browserNo: number, address: string) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcLoadURL(): browserNo="+browserNo+", address="+address);
    BarkerSideBar.loadURLSidebar(browserNo, address);
}

static ipcCreateTab (event: IpcMainEvent, tabNo: number) {
    BarkerBrowser.createTab(tabNo);
}

static ipcChangeTab (event: IpcMainEvent, tabIdNo: number) {
	BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcChangeTab(): tabIdNo="+tabIdNo);
    const layout = BarkerData.getTabLayoutNo(tabIdNo);
    BarkerData.setActualTabIdNo(tabIdNo);
    BarkerIpc.mainWindow.webContents.send('set-layout', layout);
    BarkerIpc.mainWindow.webContents.send('set-next-tab-name', BarkerBrowser.getNextTabIdName());
    BarkerBrowser.showBrowsers(layout, tabIdNo, BarkerData.getTabBrowserOffset(tabIdNo));
}

static ipcDeleteTab(tabIdNo: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcDeleteTab()");
    var i = 0;
    BarkerData.getTabFirstBrowserMap().delete(tabIdNo);
}

static ipcSaveTabs (event: IpcMainEvent) {
    BarkerSaveLoadState.saveCurrentTabs();
}

static ipcRenameTab (event: IpcMainEvent, newTabName: string) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcRenameTab(): BarkerData.getActualTabIdNo()="+BarkerData.getActualTabIdNo()+", newTabName="+newTabName);
    BarkerData.setTabName(BarkerData.getActualTabIdNo(), newTabName);
}

static updateRollingText() {
    var rollingText = (BarkerData.getTabBrowserOffset(BarkerData.getActualTabIdNo())+1).toString();
    const layout = BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo());
    if (layout>1) rollingText += '-' + (BarkerData.getTabBrowserOffset(BarkerData.getActualTabIdNo()) + layout);
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
    const layout = BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo());
    var browserOffset = BarkerData.getTabBrowserOffset(BarkerData.getActualTabIdNo());
    if (browserOffset-layout > 0) {
        browserOffset -= layout;
    } else if (browserOffset == 0) {
        browserOffset = BarkerSettings.getMaxBrowserViewsPerTab() - layout;
    } else if (browserOffset-(2*layout) < 0 ) {
        browserOffset = 0;
    }
    BarkerData.setTabBrowserOffset(BarkerData.getActualTabIdNo(), browserOffset);
    BarkerBrowser.showBrowsers(layout, BarkerData.getActualTabIdNo(), browserOffset);
}

static ipcShowNextBrowser (event: IpcMainEvent) {
    const layout = BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo());
    var browserOffset = BarkerData.getTabBrowserOffset(BarkerData.getActualTabIdNo());
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcShowNextBrowser(): browserOffset="+browserOffset+", layout="+layout+", BarkerSettings.getMaxBrowserViewsPerTab()="+BarkerSettings.getMaxBrowserViewsPerTab());
    if (browserOffset+(2*layout) < BarkerSettings.getMaxBrowserViewsPerTab()) {
        browserOffset += layout;
    } else if (browserOffset+layout == BarkerSettings.getMaxBrowserViewsPerTab()) {
        browserOffset = 0;
    } else if (browserOffset+(2*layout) > BarkerSettings.getMaxBrowserViewsPerTab()-1) {
        browserOffset = BarkerSettings.getMaxBrowserViewsPerTab()-layout;
    }
    BarkerData.setTabBrowserOffset(BarkerData.getActualTabIdNo(), browserOffset);
    BarkerBrowser.showBrowsers(layout, BarkerData.getActualTabIdNo(), browserOffset);
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
    BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo()), BarkerData.getActualTabIdNo(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabIdNo()));
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
    BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo()), BarkerData.getActualTabIdNo(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabIdNo()));
}

static ipcToggleShowHeaders (event: IpcMainEvent) {
    BarkerSettings.toggleShowBrowserHeaders();
    var browserOffset = BarkerData.getTabBrowserOffset(BarkerData.getActualTabIdNo());
    const layout = BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo());
    BarkerBrowser.showBrowsers(layout, BarkerData.getActualTabIdNo(), browserOffset);
}

static ipcFindInPage (event: IpcMainEvent, text: string) {
    var options = {
        forward: true,
        findNext: true,
        matchCase: false,
        wordStart: false,
        medialCapitalAsWordStart: false
    }

    //main area
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    let firstBrowserViewNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabIdNo());
    for (let i = firstBrowserViewNo; i< firstBrowserViewNo+BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo()); i++) {
        const browserViewNo = BarkerData.getBrowserViewNo(i);
        if (browserViews[browserViewNo].webContents) {
            (<BrowserView>browserViews[browserViewNo]).webContents.findInPage(text, options);
        }
    }

    //sidebar
    firstBrowserViewNo = BarkerData.getFirstBrowserViewNo_sidebar();
    for (let i = firstBrowserViewNo; i< firstBrowserViewNo+BarkerData.getSidebarLayoutNo(); i++) {
        const browserViewNo = BarkerData.getBrowserViewNo(i);
        if (browserViews[browserViewNo].webContents) {
            (<BrowserView>browserViews[browserViewNo]).webContents.findInPage(text, options);
        }
    }
}

static ipcClearSelection (event: IpcMainEvent) {
	BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcClearSelection()");
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    let firstBrowserViewNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabIdNo());
    for (let i = firstBrowserViewNo; i< firstBrowserViewNo+BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo()); i++) {
        const browserViewNo = BarkerData.getBrowserViewNo(i);
        if (browserViews[browserViewNo].webContents) {
            (<BrowserView>browserViews[browserViewNo]).webContents.stopFindInPage('clearSelection');
        }
    }
    firstBrowserViewNo = BarkerData.getFirstBrowserViewNo_sidebar();
    for (let i = firstBrowserViewNo; i< firstBrowserViewNo+BarkerData.getSidebarLayoutNo(); i++) {
        const browserViewNo = BarkerData.getBrowserViewNo(i);
        if (browserViews[browserViewNo].webContents) {
            (<BrowserView>browserViews[browserViewNo]).webContents.stopFindInPage('clearSelection');
        }
    }
    BarkerStatusBar.updateStatusBarText('Selection cleared');
}

static ipcGoBack (event: IpcMainEvent, browserNo: number) {
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabIdNo());
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    const browserViewNo = BarkerData.getBrowserViewNo(firstBrowserNo+browserNo-1);
    if (browserViews[browserViewNo].webContents) {
        (<BrowserView>browserViews[browserViewNo]).webContents.goBack();
    }
}

static ipcGoForward (event: IpcMainEvent, browserNo: number) {
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabIdNo());
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    const browserViewNo = BarkerData.getBrowserViewNo(firstBrowserNo+browserNo-1);
    if (browserViews[browserViewNo].webContents) {
        (<BrowserView>browserViews[browserViewNo]).webContents.goForward();
    }
}

static ipcReloadPage(event: IpcMainEvent, browserNo: number) {
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabIdNo());
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    const browserViewNo = BarkerData.getBrowserViewNo(firstBrowserNo+browserNo-1);
    if (browserViews[browserViewNo].webContents) {
        (<BrowserView>browserViews[browserViewNo]).webContents.reloadIgnoringCache();
    }
}

static ipcReloadTab(event: IpcMainEvent, tabIdNo: number) {
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(tabIdNo);
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    for (let i=1; i< BarkerSettings.getMaxBrowserViewsPerTab(); i++) {
        const browserViewNo = BarkerData.getBrowserViewNo(firstBrowserNo+i-1);
        if (browserViews[browserViewNo].webContents) {
            (<BrowserView>browserViews[browserViewNo]).webContents.reloadIgnoringCache();
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
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabIdNo());
    let browserViews = BarkerBrowser.mainWindow.getBrowserViews();
    let browser =  <BrowserView>browserViews[BarkerData.getBrowserViewNo(firstBrowserNo+browserNo-1)];
    if (browser) {
        BarkerBrowser.calculateBrowserWindowPosition_mainArea(BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo()), browserNo);
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
    let browser =  <BrowserView>browserViews[BarkerData.getBrowserViewNo(firstBrowserNo+browserNo-1)];
    if (browser) {
        BarkerSideBar.calculateBrowserWindowPosition_sidebar(browserNo);
        browser.setBounds({ x:BarkerSideBar.browserWindowPosition.x, y:BarkerSideBar.browserWindowPosition.y, width:BarkerSideBar.browserWindowPosition.width, height:BarkerSideBar.browserWindowPosition.height});
    }
}

static ipcGoBackSidebar (event: IpcMainEvent, browserNo: number) {
    const firstBrowserNo = BarkerData.getFirstBrowserViewNo_sidebar();
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    const browserViewNo = BarkerData.getBrowserViewNo(firstBrowserNo+browserNo-1);
    if (browserViews[browserViewNo].webContents) {
        (<BrowserView>browserViews[browserViewNo]).webContents.goBack();
    }
}

static ipcGoForwardSidebar (event: IpcMainEvent, browserNo: number) {
    const firstBrowserNo = BarkerData.getFirstBrowserViewNo_sidebar();
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    const browserViewNo = BarkerData.getBrowserViewNo(firstBrowserNo+browserNo-1);
    if (browserViews[browserViewNo].webContents) {
        (<BrowserView>browserViews[browserViewNo]).webContents.goForward();
    }
}

static ipcReloadPageSidebar(event: IpcMainEvent, browserNo: number) {
    const firstBrowserNo = BarkerData.getFirstBrowserViewNo_sidebar();
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    const browserViewNo = BarkerData.getBrowserViewNo(firstBrowserNo+browserNo-1);
    if (browserViews[browserViewNo].webContents) {
        (<BrowserView>browserViews[browserViewNo]).webContents.reloadIgnoringCache();
    }
}

static ipcReloadTabSidebar(event: IpcMainEvent, tabId: string) {
    const firstBrowserNo = BarkerData.getFirstBrowserViewNo_sidebar();
    let browserViews = BarkerIpc.mainWindow.getBrowserViews();
    for (let i=1; i< BarkerSettings.getMaxBrowserViewsPerTab(); i++) {
        const browserViewNo = BarkerData.getBrowserViewNo(firstBrowserNo+i-1);
        if (browserViews[browserViewNo].webContents) {
            (<BrowserView>browserViews[browserViewNo]).webContents.reloadIgnoringCache();
        }
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
    BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo()), BarkerData.getActualTabIdNo(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabIdNo()));
}

static ipcRightSidebarResized(event: IpcMainEvent, width: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcRightSidebarResized(): width="+width);
    BarkerData.setFrameRightBarWidth(width);
    BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo()), BarkerData.getActualTabIdNo(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabIdNo()));
}

static ipcTopBarResized(event: IpcMainEvent, height: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcTopBarResized(): height="+height);
    BarkerData.setFrameTopBarHeight(height);
    BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo()), BarkerData.getActualTabIdNo(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabIdNo()));
}

static ipcBottomBarResized(event: IpcMainEvent, height: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcBottomBarResized(): height="+height);
    BarkerData.setFrameBottomBarHeight(height);
    BarkerBrowser.showBrowsers(BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo()), BarkerData.getActualTabIdNo(), BarkerData.getTabBrowserOffset(BarkerData.getActualTabIdNo()));
}

static switchBrowserViews(oldBrowserNo:number, newBrowserNo: number, oldPosition: number, newPosition: number, mainArea = true) {

    //switch browser views
    let oldViewNo = BarkerData.getBrowserViewNo(oldPosition);
    let newViewNo = BarkerData.getBrowserViewNo(newPosition);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "switchBrowserViews(): switching positions - old position (internalNo="+oldPosition+", realViewNo="+oldViewNo+"), new position (internalNo="+(newPosition)+", realViewNo="+newViewNo+")");
    BarkerData.setBrowserViewNo(oldPosition, newViewNo);
    BarkerData.setBrowserViewNo(newPosition, oldViewNo);

    //switch URLs for browser headers
    if (mainArea) {
        const addresses = BarkerData.getTabAddresses(BarkerData.getActualTabIdNo());
        if (addresses) {
            const oldAddress = addresses.get(oldBrowserNo);
            const newAddress = addresses.get(newBrowserNo);
            addresses.set(oldBrowserNo, newAddress);
            addresses.set(newBrowserNo, oldAddress);
        }
    } else {
        const addresses = BarkerData.getSidebarAddresses();
        if (addresses) {
            const oldAddress = addresses[oldBrowserNo];
            const newAddress = addresses[newBrowserNo];
            addresses[oldBrowserNo] = newAddress;
            addresses[newBrowserNo] = oldAddress;
        }
    }

    //update windows
    let actualTabIdNo = BarkerData.getActualTabIdNo();
    if (mainArea) {
        BarkerBrowser.updateMainArea(BarkerData.getTabLayoutNo(actualTabIdNo), actualTabIdNo, BarkerData.getTabBrowserOffset(actualTabIdNo));
    } else {
       BarkerBrowser.updateSidebarArea();
    }
    BarkerStatusBar.updateStatusBarText('Browser window moved from position '+ oldBrowserNo+' to position '+newBrowserNo);
}

static ipcMoveWindowLeft(event: IpcMainEvent, browserNo: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcMoveWindowLeft(): browserNo="+browserNo);
    const switchedBrowserViewNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabIdNo())+browserNo-1;

    if (browserNo > 1) {
        BarkerIpc.switchBrowserViews(browserNo, browserNo-1, switchedBrowserViewNo, switchedBrowserViewNo-1);
    } else {
        BarkerIpc.switchBrowserViews(browserNo, 25, switchedBrowserViewNo, switchedBrowserViewNo+BarkerSettings.getMaxBrowserViewsPerTab()-1);
    }
}

static ipcMoveWindowRight(event: IpcMainEvent, browserNo: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcMoveWindowRight(): browserNo="+browserNo);
    const switchedBrowserViewNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabIdNo())+browserNo-1;

    if (browserNo < BarkerSettings.getMaxBrowserViewsPerTab()) {
        BarkerIpc.switchBrowserViews(browserNo, browserNo+1, switchedBrowserViewNo, switchedBrowserViewNo+1);
    } else {
        BarkerIpc.switchBrowserViews(browserNo, 1, switchedBrowserViewNo, switchedBrowserViewNo-BarkerSettings.getMaxBrowserViewsPerTab()+1);
    }
}

static ipcMoveWindowUp(event: IpcMainEvent, browserNo: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcMoveWindowUp(): browserNo="+browserNo);
    const switchedBrowserViewNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabIdNo())+browserNo-1;
    const tabLayout = BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo());
    let windowsPerRow: number;
    if (tabLayout == 2) 
        windowsPerRow = 2;
    else
        windowsPerRow = Math.floor(Math.sqrt(tabLayout));

    if (browserNo-windowsPerRow > 0) {
        BarkerIpc.switchBrowserViews(browserNo, browserNo-windowsPerRow, switchedBrowserViewNo, switchedBrowserViewNo-windowsPerRow);
    } else {
        BarkerStatusBar.updateStatusBarText('AI thinks it is not good idea to move window like this');
    }
}

static ipcMoveWindowDown(event: IpcMainEvent, browserNo: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcMoveWindowDown(): browserNo="+browserNo);
    const switchedBrowserViewNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabIdNo())+browserNo-1;
    const tabLayout = BarkerData.getTabLayoutNo(BarkerData.getActualTabIdNo());
    let windowsPerRow: number;
    if (tabLayout == 2) 
        windowsPerRow = 2;
    else
        windowsPerRow = Math.floor(Math.sqrt(tabLayout));

    if (browserNo+windowsPerRow < BarkerSettings.getMaxBrowserViewsPerTab()) {
        BarkerIpc.switchBrowserViews(browserNo, browserNo+windowsPerRow, switchedBrowserViewNo, switchedBrowserViewNo+windowsPerRow);
    } else {
        BarkerStatusBar.updateStatusBarText('AI thinks it is not good idea to move window like this');
    }
}

static ipcMoveWindowUpSidebar(event: IpcMainEvent, browserNo: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcMoveWindowUpSidebar(): browserNo="+browserNo);
    const switchedBrowserViewNo = BarkerData.getFirstBrowserViewNo_sidebar()+browserNo-1;

    if (browserNo-1 > 0) {
        BarkerIpc.switchBrowserViews(browserNo, browserNo-1, switchedBrowserViewNo, switchedBrowserViewNo-1, false);
    } else {
        BarkerIpc.switchBrowserViews(browserNo, 25, switchedBrowserViewNo, switchedBrowserViewNo+BarkerSettings.getMaxBrowserViewsPerTab()-1, false);
    }
}

static ipcMoveWindowDownSidebar(event: IpcMainEvent, browserNo: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "ipcMoveWindowDownSidebar(): browserNo="+browserNo);
    const switchedBrowserViewNo = BarkerData.getFirstBrowserViewNo_sidebar()+browserNo-1;

    if (browserNo+1 < BarkerSettings.getMaxBrowserViewsPerTab()) {
        BarkerIpc.switchBrowserViews(browserNo, browserNo+1, switchedBrowserViewNo, switchedBrowserViewNo+1, false);
    } else {
        BarkerIpc.switchBrowserViews(browserNo, 1, switchedBrowserViewNo, switchedBrowserViewNo-BarkerSettings.getMaxBrowserViewsPerTab()+1, false);
    }
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
    ipcMain.on('go-back-sidebar', BarkerIpc.ipcGoBackSidebar);
    ipcMain.on('go-forward-sidebar', BarkerIpc.ipcGoForwardSidebar);
    ipcMain.on('reload-page-sidebar', BarkerIpc.ipcReloadPageSidebar);
    ipcMain.on('reload-tab-sidebar', BarkerIpc.ipcReloadTabSidebar);
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

    ipcMain.on('left-sidebar-resized', BarkerIpc.ipcLeftSidebarResized);
    ipcMain.on('right-sidebar-resized', BarkerIpc.ipcRightSidebarResized);
    ipcMain.on('topbar-resized', BarkerIpc.ipcTopBarResized);
    ipcMain.on('bottombar-resized', BarkerIpc.ipcBottomBarResized);

    ipcMain.on('move-window-left', BarkerIpc.ipcMoveWindowLeft);
    ipcMain.on('move-window-right', BarkerIpc.ipcMoveWindowRight);
    ipcMain.on('move-window-up', BarkerIpc.ipcMoveWindowUp);
    ipcMain.on('move-window-down', BarkerIpc.ipcMoveWindowDown);
    ipcMain.on('move-window-up-sidebar', BarkerIpc.ipcMoveWindowUpSidebar);
    ipcMain.on('move-window-down-sidebar', BarkerIpc.ipcMoveWindowDownSidebar);
}

}