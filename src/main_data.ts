import { BrowserView } from "electron";
import { BarkerUtils } from './main_utils';
import { BarkerSettings } from "./main_settings";

/* this class is an entry-point for other classes 
   for all temporary run-time data needed during application run
   (it does not store any permanent settings)
*/   
export class BarkerData {

static mapTabIdNoToLayouts = new Map<number, number>;
static mapTabIdNoToAddresses = new Map<number, Map<number, string>>;    //Map<'tabIdNo', Map<browserViewNo, URL>>
static mapTabIdNoToFirstBrowserViewNo = new Map<number, number>;
static orderedTabIdNumbers: number[] = [];
static mapTabIdNoToTabNames = new Map<number, string>;   //tabId, tabName
static mapTabIdNoToBrowserOffset = new Map<number, number>;
static mapsDownloadItemsToProgress = new Map<string, number>;
static bookmarkTopics: string[] = [];
static bookmarks = [{'category': '', 'name': '', 'uri': ''}];
static typedAddresses: string[] = [];
static internalBrowserViewNumbers = new Map<number, number>;
static protectedTabs = new Map<number, boolean>;

static sidebarAddresses: string[] = [];
static sidebarLayoutNo: number;
static sidebarRollingWindowOffset = 0;

static firstBrowserViewNo_sidebar: number;
static actualTabIdNo: number;
static previousTabIdNo: number;
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
static devConsoleOpened = false;
static historyPanelOpened = false;

//getters and setters
static getActualTabIdNo() { return BarkerData.actualTabIdNo;}
static setActualTabIdNo(tabIdNo: number) { BarkerData.previousTabIdNo=BarkerData.actualTabIdNo; BarkerData.actualTabIdNo = tabIdNo;}
static getPreviousTabIdNo() { return BarkerData.previousTabIdNo;}
static setPreviousTabIdNoToActual() { BarkerData.previousTabIdNo = BarkerData.actualTabIdNo;}
static getTabLayoutNo(tabIdNo: number) { return BarkerData.mapTabIdNoToLayouts.get(tabIdNo) || BarkerSettings.defaultLayout;}
static setTabLayoutNo(tabIdNo: number, layout: number) { BarkerData.mapTabIdNoToLayouts.set(tabIdNo, layout);}
static getTabFirstBrowserMap() { return BarkerData.mapTabIdNoToFirstBrowserViewNo;}
static getTabFirstBrowserViewNo(tabIdNo: number) { return BarkerData.mapTabIdNoToFirstBrowserViewNo.get(tabIdNo);}
static setTabFirstBrowserViewNo(tabIdNo: number, firstBrowserViewNo: number) { BarkerData.mapTabIdNoToFirstBrowserViewNo.set(tabIdNo, firstBrowserViewNo);}
static getTabAddresses (tabIdNo: number) {return BarkerData.mapTabIdNoToAddresses.get(tabIdNo);}
static setTabAddresses (tabIdNo: number, map: Map<number, string>) {BarkerData.mapTabIdNoToAddresses.set(tabIdNo, map);}
static setTabAddress (tabIdNo: number, browserNo: number, address: string) {BarkerData.mapTabIdNoToAddresses.get(tabIdNo).set(browserNo, address);}
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
static getOrderedTabIdNumbersArray() { return BarkerData.orderedTabIdNumbers; };
static getOrderedTabIdNo(position: number) { return BarkerData.orderedTabIdNumbers[position];};
static getOrderedTabIdName(position: number) { return BarkerData.getTabIdName(BarkerData.orderedTabIdNumbers[position]);};
static setOrderedTabIdNumber(tabPosition: number, tabIdNo: number) { BarkerData.orderedTabIdNumbers[tabPosition] = tabIdNo;};
static getTabBrowserOffset(tabIdNo: number) {return BarkerData.mapTabIdNoToBrowserOffset.get(tabIdNo) || 0;};
static setTabBrowserOffset(tabIdNo: number, offset: number) {return BarkerData.mapTabIdNoToBrowserOffset.set(tabIdNo, offset);};
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
static getTabName(tabIdNo: number) {return BarkerData.mapTabIdNoToTabNames.get(tabIdNo)};
static setTabName(tabIdNo: number, tabName: string) {BarkerData.mapTabIdNoToTabNames.set(tabIdNo, tabName)};
static getTabCnt() { return BarkerData.tabCount;}
static setTabCnt(tabsCount: number) { BarkerData.tabCount = tabsCount;}
static getLayoutString() { return BarkerData.layoutString;}
static setLayoutString(layoutString: string) { BarkerData.layoutString = layoutString;}
static getBrowserHeaderString() { return BarkerData.browserHeaderButtonsString;}
static setBrowserHeaderString(s: string) { BarkerData.browserHeaderButtonsString = s;}
static getTypedAddresses() {BarkerData.typedAddresses;}
static getTypedAddress(i: number): string {return BarkerData.typedAddresses[i];}
static getTabIdName(tabIdNo: number) {return 'NewTab' + tabIdNo;}
static getBrowserViews() { return BarkerData.internalBrowserViewNumbers;}
static getBrowserViewNo(internalNo: number) {return BarkerData.internalBrowserViewNumbers.get(internalNo);}
static setBrowserViewNo(internalNo: number, browserViewNo: number) {BarkerData.internalBrowserViewNumbers.set(internalNo, browserViewNo);}
static addBrowserViewNo(browserViewNo: number) {BarkerData.internalBrowserViewNumbers.set(browserViewNo, browserViewNo);}
static toggleDevConsoleActive() {BarkerData.devConsoleOpened = !BarkerData.devConsoleOpened;}
static setDevConsoleActive() {BarkerData.devConsoleOpened = true;}
static getDevConsoleActive() {return BarkerData.devConsoleOpened;}
static historyPanelActive() {return BarkerData.historyPanelOpened;}
static toggleHistoryPanel() {BarkerData.historyPanelOpened = !BarkerData.historyPanelOpened;}
static addProtectedTab(tabIdNo: number) { BarkerData.protectedTabs.set(tabIdNo, true);}
static removeProtectedTab(tabIdNo: number) { BarkerData.protectedTabs.delete(tabIdNo);}

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

static getHighestTabNo() {
   let maxTabNo = 0;
   for (let i=0; i< BarkerData.orderedTabIdNumbers.length; i++) {
      const tabNo = BarkerData.orderedTabIdNumbers[i];
      if (tabNo > maxTabNo) {
         maxTabNo = tabNo;
      }
   }
   return maxTabNo;
}

static isTabProtected(tabIdNo: number): boolean { 
   let isProtected = false;
   let result = BarkerData.protectedTabs.get(tabIdNo);
   if (result) isProtected = true;
   return isProtected;
}

}
