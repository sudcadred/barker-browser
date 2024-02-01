import { app, BrowserWindow, BrowserView, ipcMain, IpcMainEvent, dialog, Menu, MenuItem  } from "electron";
import { BarkerUtils } from './main_utils';
import { BarkerSettings } from "./main_settings";

/* this class is an entry-point for other classes 
   for all temporary run-time data needed during application run
   (it does not store any permanent settings)
*/   
export class BarkerData {

static mapTabsToLayouts = new Map();
static mapTabsToAddresses = new Map<string, Map<number, string>>;    //Map<'tabId', Map<browserViewNo, URL>>
static mapTabsToZoomedBrowserView = new Map<string, Electron.BrowserView>; 
static mapTabsToFirstBrowserViewNo = new Map<string, number>;
static orderedTabIds: string[] = [];
static mapTabsToTabNames = new Map<string, string>;   //tabId, tabName
static mapTabsToBrowserOffset = new Map<string, number>;
static mapsDownloadItemsToProgress = new Map<string, number>;
static bookmarkTopics: string[] = [];
static bookmarks = [{'category': '', 'name': '', 'uri': ''}];
static typedAddresses: string[] = [];

static sidebarAddresses: string[] = [];
static sidebarLayoutNo: number;
static sidebarRollingWindowOffset = 0;

static firstBrowserViewNo_sidebar: number;
static actualTabId: string;
static downloadedItems = '';
static downloadFailedItems = '';
static activeBrowserView: Electron.BrowserView = null;

static frameSidebar_width = 0;
static frameRightBar_width = 0;
static frameTopBar_height = 0;
static frameMainFrame_height = 0;
static frameBottomBar_height = 0;

static topBodyLoaded = false;
static leftBodyLoaded = false;
static mainBodyLoaded = false;
static rightBodyLoaded = false;
static bottomBodyLoaded = false;

static tabCount = 0;
static layoutString: string;
static browserHeaderButtonsString: string;

//getters and setters
static getActualTabId() { return BarkerData.actualTabId;}
static setActualTabId(tabId: string) { BarkerData.actualTabId = tabId;}
static getTabLayoutNo(tabIdName: string) { return BarkerData.mapTabsToLayouts.get(tabIdName) || BarkerSettings.defaultLayout;}
static setTabLayoutNo(tabIdName: string, layout: number) { BarkerData.mapTabsToLayouts.set(tabIdName, layout);}
static getZoomedBrowserMap() { return BarkerData.mapTabsToZoomedBrowserView;}
static getZoomedBrowserView(tabIdName: string) { return BarkerData.mapTabsToZoomedBrowserView.get(tabIdName);}
static setZoomedBrowserView(tabIdName: string, browserViewNo: Electron.BrowserView) { return BarkerData.mapTabsToZoomedBrowserView.set(tabIdName, browserViewNo);}
static deleteZoomedBrowserView(tabIdName: string) {BarkerData.mapTabsToZoomedBrowserView.delete(tabIdName)};
static getTabFirstBrowserMap() { return BarkerData.mapTabsToFirstBrowserViewNo;}
static getTabFirstBrowserViewNo(tabIdName: string) { return BarkerData.mapTabsToFirstBrowserViewNo.get(tabIdName);}
static setTabFirstBrowserViewNo(tabIdName: string, firstBrowserViewNo: number) { BarkerData.mapTabsToFirstBrowserViewNo.set(tabIdName, firstBrowserViewNo);}
static getTabAddresses (tabIdName: string) {return BarkerData.mapTabsToAddresses.get(tabIdName);}
static setTabAddresses (tabIdName: string, map: Map<number, string>) {BarkerData.mapTabsToAddresses.set(tabIdName, map);}
static getFirstBrowserViewNo_sidebar() {return BarkerData.firstBrowserViewNo_sidebar;}
static setFirstBrowserViewNo_sidebar(browserViewNo: number) {BarkerData.firstBrowserViewNo_sidebar = browserViewNo;}
static setSidebarUrl(browserNo: number, url: string) {BarkerData.sidebarAddresses[browserNo] = url;}
static getSidebarUrl(browserNo: number) {return BarkerData.sidebarAddresses[browserNo];}
static getSidebarAddresses() {return BarkerData.sidebarAddresses;}
static getDownloadedItemsString() {return BarkerData.downloadedItems;}
static setDownloadedItemsString(s: string) { BarkerData.downloadedItems = s;}
static getDownloadFailedItemsString() {return BarkerData.downloadFailedItems;}
static setDownloadFailedItemsString(s: string) {BarkerData.downloadFailedItems = s;}
static getDownloadProgressMap() {return BarkerData.mapsDownloadItemsToProgress;}
static setDownloadProgressMap(fileName: string, bytes: number) { BarkerData.mapsDownloadItemsToProgress.set(fileName, bytes);}
static getActiveBrowserView() {return BarkerData.activeBrowserView;}
static setActiveBrowserView(browserView: Electron.BrowserView) {BarkerData.activeBrowserView = browserView;}
static getSidebarLayoutNo() {return BarkerData.sidebarLayoutNo || 1;}
static setSidebarLayoutNo(layoutNo: number) {BarkerData.sidebarLayoutNo = layoutNo;}
static getSidebarRollingWindowOffset() {return BarkerData.sidebarRollingWindowOffset;}
static setSidebarRollingWindowOffset(offsetNo: number) {BarkerData.sidebarRollingWindowOffset = offsetNo;}
static getFrameSidebarWidth() { return BarkerData.frameSidebar_width;}
static setFrameSidebarWidth(width: number) { BarkerData.frameSidebar_width = width;}
static getFrameRightBarWidth() { return BarkerData.frameRightBar_width;}
static setFrameRightBarWidth(width: number) { BarkerData.frameRightBar_width = width;}
static getFrameTopBarHeight() { return BarkerData.frameTopBar_height;}
static setFrameTopBarHeight(height: number) { BarkerData.frameTopBar_height = height;}
static getFrameMainHeight() { return BarkerData.frameMainFrame_height;}
static setFrameMainHeight(height: number) { BarkerData.frameMainFrame_height = height;}
static getFrameBottomBarHeight() { return BarkerData.frameBottomBar_height;}
static setFrameBottomBarHeight(height: number) { BarkerData.frameBottomBar_height = height;}
static getOrderedTabIdsArray() { return BarkerData.orderedTabIds; };
static getOrderedTabIdName(tabIdNo: number) { return BarkerData.orderedTabIds[tabIdNo]; };
static setOrderedTabIdName(tabIdNo: number, tabIdName: string) { BarkerData.orderedTabIds[tabIdNo] = tabIdName;};
static getTabBrowserOffset(tabIdName: string) {return BarkerData.mapTabsToBrowserOffset.get(tabIdName) || 0;};
static setTabBrowserOffset(tabIdName: string, offset: number) {return BarkerData.mapTabsToBrowserOffset.set(tabIdName, offset);};
static setTopBodyLoaded(loaded: boolean) {BarkerData.topBodyLoaded = loaded};
static setLeftBodyLoaded(loaded: boolean) {BarkerData.leftBodyLoaded = loaded};
static setMainBodyLoaded(loaded: boolean) {BarkerData.mainBodyLoaded = loaded};
static setRightBodyLoaded(loaded: boolean) {BarkerData.rightBodyLoaded = loaded};
static setBottomBodyLoaded(loaded: boolean) {BarkerData.bottomBodyLoaded = loaded};
static getTopBodyLoaded() {return BarkerData.topBodyLoaded;};
static getLeftBodyLoaded() {return BarkerData.leftBodyLoaded;};
static getMainBodyLoaded() {return BarkerData.mainBodyLoaded;};
static getRightBodyLoaded() {return BarkerData.rightBodyLoaded;};
static getBottomBodyLoaded() {return BarkerData.bottomBodyLoaded;};
static getTabName(tabIdName: string) {return BarkerData.mapTabsToTabNames.get(tabIdName)};
static setTabName(tabIdName: string, tabName: string) {BarkerData.mapTabsToTabNames.set(tabIdName, tabName)};
static getTabCnt() { return BarkerData.tabCount;}
static setTabCnt(tabsCount: number) { BarkerData.tabCount = tabsCount;}
static getLayoutString() { return BarkerData.layoutString;}
static setLayoutString(layoutString: string) { BarkerData.layoutString = layoutString;}
static getBrowserHeaderString() { return BarkerData.browserHeaderButtonsString;}
static setBrowserHeaderString(s: string) { BarkerData.browserHeaderButtonsString = s;}
static getTypedAddresses() {BarkerData.typedAddresses;}
static getTypedAddress(i: number): string {return BarkerData.typedAddresses[i];}

//other methods
static bookmarkTopicExists(category: string): boolean { 
   for (let i=0; i< BarkerData.bookmarkTopics.length; i++) {
      if (category == BarkerData.bookmarkTopics[i]) return true;
   }
   return false;
}

static addBookmarkTopic(category: string) {
   if (!BarkerData.bookmarkTopicExists(category)) {
      BarkerData.bookmarkTopics.push(category);
   }
}

static addBookmark(category: string, name: string, uri: string) {
   BarkerData.bookmarks.push({'category': category, 'name': name, 'uri': uri});
}

static uriAlreadyAdded(uri: string): boolean {
   for (let i=0; i < BarkerData.typedAddresses.length; i++) {
      if (uri == BarkerData.typedAddresses[i]) {
         BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "uriAlreadyAdded(): uri="+uri);
         return true;
      }
   }
   return false;
}

static addTypedAddress(uri: string) {
   BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "addTypedAddress(): uri="+uri);
   if (!BarkerData.uriAlreadyAdded(uri)) {
      BarkerData.typedAddresses.push(uri);
   }
}

}
