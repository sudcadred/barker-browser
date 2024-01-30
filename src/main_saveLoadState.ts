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
    BarkerSaveLoadState.store.set('sidebar.addresses_count', BarkerData.getSidebarAddresses().length);
    BarkerSaveLoadState.store.set('sidebar.layout', BarkerData.getSidebarLayoutNo());
    for (let j=1; j<=BarkerSettings.getMaxBrowserViewsPerTab();j++) {
        let url = BarkerData.getSidebarUrl(j-1);
        if (url) {
            BarkerSaveLoadState.store.set('sidebar.addresses.'+j, url);
        }
    }

    BarkerSaveLoadState.store.set('tabcount', BarkerData.getOrderedTabIdsArray().length);
    for (let i=0; i<BarkerData.getOrderedTabIdsArray().length;i++) {
        let tabId = BarkerData.getOrderedTabIdName(i);
        const tabIdNo = i+1;
        const tabName = BarkerData.getTabName(tabId);
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "saveCurrentTabs(): tabId="+tabId+", tabName="+tabName);
        BarkerSaveLoadState.store.set('tabs.'+tabIdNo+'.tabname', tabName);
        BarkerSaveLoadState.store.set('tabs.'+tabIdNo+'.layout', BarkerData.getTabLayoutNo(tabId) );
        const addresses = BarkerData.getTabAddresses(tabId);
        if (addresses) {
            for (let j=0; j<BarkerSettings.getMaxBrowserViewsPerTab();j++) {
                const url = addresses.get(j);
                if (url) {
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
    
    //sidebar
    for (let i=0; i<BarkerData.getSidebarAddresses().length; i++) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadAddressesFromFile(): i="+i+", _sidebarAddresses[i]="+BarkerData.getSidebarUrl(i));
        if (BarkerData.getSidebarUrl(i) != '') {
            BarkerSideBar.loadURLSidebar(i+1, BarkerData.getSidebarUrl(i));
        }
    }

    //create tabs
    for (let i=1; i<=tabCount; i++) {
        const tabIdName = 'NewTab' + i;
        const tabName = BarkerSaveLoadState.store.get('tabs.'+i+'.tabname');
        const tabLayout = BarkerSaveLoadState.store.get('tabs.'+i+'.layout');
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadAddressesFromFile(): tabname="+tabName+", tabLayout="+tabLayout);

        //load addresses
        const addresses = BarkerSaveLoadState.store.get('tabs.'+i+'.addresses');
        if (addresses) {
            for (let j=1; j<=tabLayout;j++) {
                BarkerData.setTabBrowserOffset(tabIdName, 0);
                const address = BarkerSaveLoadState.store.get('tabs.'+i+'.addresses.'+j);
                if (address) {
                    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadAddressesFromFile(): i="+i+", address="+address);
                    BarkerData.setActualTabId(tabIdName);
                    BarkerBrowser.loadURL(tabIdName, j, address);
                }
            }
        }
    }
    
}

static loadTab(tabIdNo: number, tabName: string, tabLayout: number) {
    const tabId = 'NewTab' + tabIdNo;
    BarkerData.setTabLayoutNo(tabId, tabLayout);
    BarkerData.getOrderedTabIdsArray().push(tabId);
    BarkerData.setTabName(tabId, tabName);
    BarkerData.setTabBrowserOffset(tabId, 0);
    BarkerData.setTabCnt(BarkerData.getTabCnt() + 1);
    BarkerBrowser.createBrowserViewsForOneTab(tabIdNo);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadTab(): tabId="+tabId+", tabName="+tabName);
    BarkerSaveLoadState.mainWindow.webContents.send('load-tab', tabName);
}

static loadTabsFromFile() {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadTabsFromFile()");
    BarkerSaveLoadState.loadBookmarks();
    BarkerMenu.createMainMenu();

    //load sidebar
    BarkerData.setSidebarLayoutNo(Number(BarkerSaveLoadState.store.get('sidebar.layout')));
    for (let j=1; j<=BarkerSettings.getMaxBrowserViewsPerTab(); j++) {
        let url = BarkerSaveLoadState.store.get('sidebar.addresses.'+j);
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadTabsFromFile(): j="+j+", url="+url);
        if (url) {
            BarkerData.setSidebarUrl(j-1, url);
        } else {
            BarkerData.setSidebarUrl(j-1, '');
        }
    }
    
    //load tabs
    const tabCount = BarkerSaveLoadState.store.get('tabcount');
    for (let i=1; i<=tabCount; i++) {
        const tabId = 'NewTab' + i;
        const tabName = BarkerSaveLoadState.store.get('tabs.'+i+'.tabname');
        const tabLayout = BarkerSaveLoadState.store.get('tabs.'+i+'.layout');
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "loadTabsFromFile(): tabname="+tabName+", tabLayout="+tabLayout);
        BarkerSaveLoadState.loadTab(i, tabName, tabLayout);
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

}
