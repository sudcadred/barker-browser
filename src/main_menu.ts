import { BrowserView } from "electron";
import { Menu } from "electron";
import { BarkerUtils } from './main_utils';
import { BarkerData } from "./main_data";
import { BarkerSettings } from "./main_settings";
import { BarkerBrowser } from "./main_browser";
import { BarkerStatusBar } from "./main_statusbar";
import { BarkerDb } from "./main_db";
import { BarkerSaveLoadState } from "./main_saveLoadState";
const { dialog } = require('electron');

//wrapper methods for menu actions (I have not found other way to call class methods from dynamic menu template )
function _showPreferences() { BarkerSettings.showPreferences();}
function _openBookmark(uri: string) { BarkerBrowser.openLinkInFirstEmptyWindow(uri);}
function _openAllBookmarks(openedCategory: string) { 
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "_openAllBookmarks(): openedCategory="+openedCategory);
    let tabIdNo = BarkerBrowser.createTab(); 
    let browserNo = 1;
    for (let j=0; j< BarkerData.bookmarks.length; j++) {
        const bookmarkItem = BarkerData.bookmarks[j]; 
        const category = bookmarkItem['category'];
        if (category == openedCategory) {
            BarkerBrowser.loadURL(tabIdNo, browserNo, bookmarkItem['uri']);
            browserNo++;
            if (browserNo % BarkerSettings.getMaxBrowserViewsPerTab() == 0) {
                tabIdNo = BarkerBrowser.createTab(); 
                browserNo = 1;
            }
        }
    }
}
function _getHistory() { 
    BarkerData.toggleHistoryPanel(); 
    if (BarkerData.historyPanelActive()) 
        BarkerDb.getAllDomains('');
    else
        BarkerMenu.mainWindow.webContents.send('clear-history-panel');
}
function _toggleDevConsole() {
    BarkerData.toggleDevConsoleActive();
    if (BarkerData.getDevConsoleActive()) {
        BarkerBrowser.clearRightSidebar();
        BarkerMenu.mainWindow.webContents.setDevToolsWebContents(BarkerBrowser.rightSideBarBrowser.webContents);
        BarkerMenu.mainWindow.webContents.openDevTools({'mode': "detach"});
        BarkerData.setDevConsoleActive();
        BarkerBrowser.showRightSidebar();
    } else {
        BarkerBrowser.rightSideBarBrowser.setBounds({ x: 0, y: 0, width: 0, height: 0});
    }
}
function _saveTabs() {
    BarkerSaveLoadState.saveCurrentTabs();
}

/* This class creates main menu
*/

export class BarkerMenu {

static menu: Menu = null;
static mainWindow: Electron.BrowserWindow = null;

static createMainMenu(mainWindow: Electron.BrowserWindow) {
    const templateFirstPart = '[{label: \'File\',submenu: [' +
                              '{label: \'Show /Hide Browsing History\',accelerator: \'CmdOrCtrl+H\', click: () => {_getHistory();}}, ' +
                              '{label: \'Show /Hide General developer console (not browser-specific)\',accelerator: \'F12\', click: () => {_toggleDevConsole();}}, ' +
                              '{label: \'Save tabs and opened windows\',accelerator: \'CmdOrCtrl+S\', click: () => {_saveTabs();}}, ' +
                              '{label: \'Preferences\',accelerator: \'CmdOrCtrl+P\', click: () => {_showPreferences();}}]},';
    let category: string;

    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createMainMenu()");
    BarkerMenu.mainWindow = mainWindow;
    var template = templateFirstPart;
    for (let i=0; i< BarkerData.bookmarkTopics.length; i++) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createMainMenu(): bookmarkTopic="+BarkerData.bookmarkTopics[i]);
        template += '{label: \''+BarkerData.bookmarkTopics[i]+'\',';
        template += 'submenu: [';
        template += '{label: \'Open all bookmarks in new tab\',';
        template += 'click: () => {_openAllBookmarks(\''+ BarkerData.bookmarkTopics[i] +'\')}},';
        template += '{type: \'separator\'},';
        for (let j=0; j< BarkerData.bookmarks.length; j++) {
            const bookmarkItem = BarkerData.bookmarks[j]; 
            category = bookmarkItem['category'];
            BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createMainMenu(): bookmarkItem="+String(bookmarkItem)+", category="+category+", BarkerData.bookmarkTopics[i]="+BarkerData.bookmarkTopics[i]+", i="+i);
            if (category == BarkerData.bookmarkTopics[i]) {
                template += '{label: \''+bookmarkItem['name']+'\',';
                template += 'click: () => {_openBookmark(\''+ bookmarkItem['uri'] +'\')}},';
            }
        }
        template += ']';    //end submenu
        template += '}';    //end item
    }
    template += ']';
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createMainMenu(): template="+template);
    const templateObj = eval(template);
    BarkerMenu.menu = Menu.buildFromTemplate(templateObj);
    Menu.setApplicationMenu(BarkerMenu.menu);
}

static createThreeDotsMenu(browserNo: number, sidebar=false): Menu {
    var firstBrowserNo: number;
    if (sidebar) {
        firstBrowserNo = BarkerData.getFirstBrowserViewNo_sidebar();
    } else {
        firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabIdNo());
    }
    let browserViews = BarkerMenu.mainWindow.getBrowserViews();
    let browser = browserViews[firstBrowserNo + browserNo - 1];

    const template: Electron.MenuItemConstructorOptions[]  = [
        {label: "clear window",
         click: () => {
            if (sidebar) {
                BarkerData.setSidebarUrl(browserNo, '');
                const firstBrowserNo = BarkerData.getFirstBrowserViewNo_sidebar();
                let browserViews = BarkerMenu.mainWindow.getBrowserViews();
                const browserViewNo = firstBrowserNo+browserNo-1;
                if (browserViews[browserViewNo].webContents) {
                    (<BrowserView>browserViews[browserViewNo]).webContents.close();
                }
            } else {
                const addresses = BarkerData.getTabAddresses(BarkerData.getActualTabIdNo());
                if (addresses) {
                    addresses.set(browserNo, null);
                    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(BarkerData.getActualTabIdNo());
                    let browserViews = BarkerMenu.mainWindow.getBrowserViews();
                    const browserViewNo = firstBrowserNo+browserNo-1;
                    if (browserViews[browserViewNo].webContents) {
                        (<BrowserView>browserViews[browserViewNo]).webContents.close();
                    }
                }
            }
         }},
        {label: "mute page",
         click: () => { browser.webContents.setAudioMuted(true);
                        BarkerStatusBar.updateStatusBarText('Browser window '+browserNo + ' muted'); }},
         {label: "unmute page",
         click: () => { browser.webContents.setAudioMuted(false);
                        BarkerStatusBar.updateStatusBarText('Browser window '+browserNo + ' unmuted'); }},
         {label: "find in page", 
         click: () => { BarkerData.setActiveBrowserView(browser);
                        BarkerBrowser.mainWindow.webContents.send('show-searchbar'); }},
        {label: "save page (HTML only)",
         click: () => { const url = browser.webContents.getURL();
                        var filenameFromUrl = url.substring(url.lastIndexOf('/')+1);
                        dialog.showSaveDialog( {title: 'Save page as',
                                                defaultPath: filenameFromUrl, 
                                                filters: [ { name: 'All Files', extensions: ['*'] }]
                                              }).then(result => {
                                                browser.webContents.savePage(result.filePath, "HTMLOnly");
                                            }); }},
        {label: "save page (HTML complete)",
         click: () => { const url = browser.webContents.getURL();
                        var filenameFromUrl = url.substring(url.lastIndexOf('/')+1);
                        dialog.showSaveDialog( {title: 'Save page as',
                                                defaultPath: filenameFromUrl, 
                                                filters: [ { name: 'All Files', extensions: ['*'] }]
                                              }).then(result => {
                                                browser.webContents.savePage(result.filePath, "HTMLComplete");
                                            }); }},
        {label: "print page",
         click: () => {browser.webContents.print({});} },
        {label: "bookmark page",
         click: () => { BarkerBrowser.addToBookmarks(browser.webContents.getURL());} },
        {label: "show developer console",
         click: () => { BarkerBrowser.clearRightSidebar();
                        BarkerBrowser.lastActiveDevToolsBrowserView = browser;
                        browser.webContents.setDevToolsWebContents(BarkerBrowser.rightSideBarBrowser.webContents);
                        browser.webContents.openDevTools({'mode': "detach"});
                        BarkerData.setDevConsoleActive();
                        BarkerBrowser.showRightSidebar();
                    } },
        {label: "hide developer console",
         click: () => { BarkerBrowser.clearRightSidebar(); } },
    ];
    const menu = Menu.buildFromTemplate(template);
    return menu;
}

static createUriSimilarityMenu(browserNo: number, uri: string) {
    const template: Electron.MenuItemConstructorOptions[]  = [
        {label: uri,
         click: () => { BarkerBrowser.loadUrlInActualTab(browserNo, uri); }},
    ];
    const menu = Menu.buildFromTemplate(template);
    return menu;
}

}
