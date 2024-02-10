const Store = require('electron-store');
import { BarkerSettings } from "./main_settings";
import { BarkerUtils } from "./main_utils";
import { BarkerData } from "./main_data";
import { BarkerStatusBar } from "./main_statusbar";
import { BarkerBrowser } from "./main_browser";
import { BarkerSideBar } from "./main_sidebar";
import { BarkerMenu } from "./main_menu";

/* This class handles saving and loading of all addresses in all tabs including sidebar
*/

export class BarkerSaveLoadState {

/*
constructor (mainWindow: Electron.BrowserWindow)
static saveCurrentTabs()
static loadAddressesFromFile()
static loadTab(tabIdNo: number, tabName: string, tabLayout: number)
static loadTabsFromFile()
static saveBookmark(topic: string, uri: string)
*/

static store = new Store({name: 'barker_browser'});
static mainWindow: Electron.BrowserWindow = null;

//ctor    
constructor (mainWindow: Electron.BrowserWindow) {
    BarkerSaveLoadState.mainWindow = mainWindow;
}

static saveCurrentTabs() {
    //save sidebar
    BarkerSaveLoadState.store.set('sidebar.addresses_count', BarkerData.getSidebarAddresses().length-1);
    BarkerSaveLoadState.store.set('sidebar.layout', BarkerData.getSidebarLayoutNo());
    for (let j=1; j<=BarkerData.getSidebarAddresses().length;j++) {
        let url = BarkerData.getSidebarUrl(j);
        if (url) {
            BarkerSaveLoadState.store.set('sidebar.addresses.'+j, url);
        }
    }

    //save tabs
    BarkerSaveLoadState.store.set('tabcount', BarkerData.getOrderedTabIdNumbersArray().length);
    for (let i=0; i<BarkerData.getOrderedTabIdNumbersArray().length;i++) {
        const tabIdNo = i+1;
        const tabName = BarkerData.getTabName(tabIdNo);
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "saveCurrentTabs(): tabIdNo="+tabIdNo+", tabName="+tabName);
        BarkerSaveLoadState.store.set('tabs.'+tabIdNo+'.tabname', tabName);
        BarkerSaveLoadState.store.set('tabs.'+tabIdNo+'.layout', BarkerData.getTabLayoutNo(tabIdNo) );
        const addresses = BarkerData.getTabAddresses(tabIdNo);
        if (addresses) {
            //save addresses in specific tab
            for (let j=1; j<=BarkerSettings.getMaxBrowserViewsPerTab();j++) {
                const url = addresses.get(j);
                if (url && url.substring(0, 4)!='file') {
                    BarkerSaveLoadState.store.set('tabs.'+tabIdNo+'.addresses.'+j, url);
                }
            }
        }
    }
    BarkerStatusBar.updateStatusBarText('Tabs saved successfully');
}

static loadAddressesFromFile() {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadAddressesFromFile()");
    const tabCount = BarkerSaveLoadState.store.get('tabcount');
    const sidebarCount = BarkerSaveLoadState.store.get('sidebar.addresses_count');
    
    //sidebar
    for (let i=1; i<=sidebarCount; i++) {
        let sideBarAddress = BarkerSaveLoadState.store.get('sidebar.addresses.'+i);
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadAddressesFromFile(): i="+i+", sideBarAddress="+sideBarAddress);
        if (sideBarAddress) {
            BarkerSideBar.loadURLSidebar(i, sideBarAddress);
        }
    }

    //create tabs
    for (let i=1; i<=tabCount; i++) {
        const tabIdNo = i;
        const tabName = BarkerSaveLoadState.store.get('tabs.'+i+'.tabname');
        const tabLayout = BarkerSaveLoadState.store.get('tabs.'+i+'.layout');
        BarkerData.setTabBrowserOffset(tabIdNo, 0);
        BarkerData.setTabLayoutNo(tabIdNo, tabLayout);
        BarkerData.setTabAddresses(tabIdNo, new Map<number, string>);
        if (i ==1) BarkerData.setActualTabIdNo(tabIdNo);
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadAddressesFromFile(): tabname="+tabName+", tabLayout="+tabLayout);

        //load addresses
        const addresses = BarkerSaveLoadState.store.get('tabs.'+i+'.addresses');
        if (addresses) {
            for (let j=1; j<=tabLayout;j++) {
                const address = BarkerSaveLoadState.store.get('tabs.'+i+'.addresses.'+j);
                if (address) {
                    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadAddressesFromFile(): i="+i+", address="+address);
                    BarkerBrowser.loadURL(tabIdNo, j, address);
                }
            }
        }
    }
}

static createTab(tabIdNo: number, tabName: string, tabLayout: number) {
    const tabId = 'NewTab' + tabIdNo;
    BarkerData.setTabLayoutNo(tabIdNo, tabLayout);
    BarkerData.getOrderedTabIdNumbersArray().push(tabIdNo);
    BarkerData.setTabName(tabIdNo, tabName);
    BarkerData.setTabBrowserOffset(tabIdNo, 0);
    BarkerData.setTabCnt(BarkerData.getTabCnt() + 1);
    BarkerBrowser.createBrowserViewsForOneTab(tabIdNo);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createTab(): tabId="+tabId+", tabName="+tabName);
    BarkerSaveLoadState.mainWindow.webContents.send('create-tab', tabName);
}

static loadTabsFromFile() {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadTabsFromFile()");
    BarkerSaveLoadState.loadBookmarks();
    BarkerMenu.createMainMenu(BarkerSaveLoadState.mainWindow);
    BarkerSaveLoadState.loadTypedAddressesIntoData();
    BarkerData.setSidebarLayoutNo(Number(BarkerSaveLoadState.store.get('sidebar.layout')));

    //load tabs
    const tabCount = BarkerSaveLoadState.store.get('tabcount');
    for (let i=1; i<=tabCount; i++) {
        const tabName = BarkerSaveLoadState.store.get('tabs.'+i+'.tabname');
        const tabLayout = BarkerSaveLoadState.store.get('tabs.'+i+'.layout');
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadTabsFromFile(): tabname="+tabName+", tabLayout="+tabLayout);
        BarkerSaveLoadState.createTab(i, tabName, tabLayout);
    }
}

static saveBookmark(topic: string, uri: string) {
    var bookmarks_count = BarkerSaveLoadState.store.get('bookmarks.bookmarks_count');
    if (!bookmarks_count) bookmarks_count = 0;
    const new_bookmarks_count = Number(bookmarks_count)+1;
    BarkerSaveLoadState.store.set('bookmarks.bookmarks_count', new_bookmarks_count);
    BarkerSaveLoadState.store.set('bookmarks.addresses.'+new_bookmarks_count+'.category', topic);
    BarkerSaveLoadState.store.set('bookmarks.addresses.'+new_bookmarks_count+'.name', BarkerUtils.getNameFromUrl(uri));
    BarkerSaveLoadState.store.set('bookmarks.addresses.'+new_bookmarks_count+'.uri', uri);
}

static loadBookmarks() {
    const bookmarks_count = BarkerSaveLoadState.store.get('bookmarks.bookmarks_count');
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadBookmarks(): bookmarks_count="+bookmarks_count);
    for (let i=1; i<= bookmarks_count; i++) {
        let bookmarkUri = BarkerSaveLoadState.store.get('bookmarks.addresses.'+i+'.uri');
        if (bookmarkUri) {
            let category = BarkerSaveLoadState.store.get('bookmarks.addresses.'+i+'.category');
            let bookmarkName = BarkerSaveLoadState.store.get('bookmarks.addresses.'+i+'.name');
            BarkerData.addBookmarkTopic(category);
            BarkerData.addBookmark(category, bookmarkName, bookmarkUri);
        }
    }
}

static saveTypedAddress(uri: string) {
    var typedAddresses_count = BarkerSaveLoadState.store.get('typedAddresses_count');
    if (!typedAddresses_count) typedAddresses_count = 0;
    const new_count = Number(typedAddresses_count)+1;
    BarkerSaveLoadState.store.set('typedAddresses_count', new_count);
    BarkerSaveLoadState.store.set('typedAddresses.'+new_count, uri);
    BarkerData.addTypedAddress(uri);
}

static loadTypedAddressesIntoData() {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadTypedAddressesIntoData()");
    var typedAddresses_count = BarkerSaveLoadState.store.get('typedAddresses_count');
    for (let i=1; i<= Number(typedAddresses_count); i++) {
        let uri = BarkerSaveLoadState.store.get('typedAddresses.'+i);
        if (uri) {
            BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadTypedAddressesIntoData(): loading uri="+uri);
            BarkerData.addTypedAddress(uri);
            BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadTypedAddressesIntoData(): BarkerData.getTypedAddresses.length="+BarkerData.getTypedAddresses.length);
        }
    }
}

}
