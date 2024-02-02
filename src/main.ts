import { app, BrowserWindow } from "electron";
import { BarkerIpc } from './main_ipc';
import { BarkerUtils } from './main_utils';
import { BarkerData } from "./main_data";
import { BarkerBrowser } from "./main_browser";
import { BarkerSettings } from "./main_settings";
import { BarkerDownload } from "./main_download";
import { BarkerSaveLoadState } from "./main_saveLoadState";
import { BarkerKeyboardShortcuts } from "./main_keyboardShortcuts";
import { BarkerSideBar } from "./main_sidebar";
import { BarkerStatusBar } from "./main_statusbar";
import { BarkerZoom } from "./main_zoom";
const path = require('node:path')
const Store = require('electron-store');
const store = new Store();

let _mainWindow: Electron.BrowserWindow = null;

//presets
let _mainIndexFile = '../html/index_frames.html';

function createMainWindow () {
	const mainWindow = new BrowserWindow({
                                      webPreferences: { 
                                        devTools: true, 
                                        preload: path.join(__dirname, 'preload.js'),
                                        nodeIntegration: true,
                                        sandbox: false
                                        }
                                    });
	_mainWindow = mainWindow;
    _mainWindow.maximize();
    
    //initialize other classes
    new BarkerBrowser(_mainWindow);
    new BarkerDownload(_mainWindow);
    new BarkerIpc(_mainWindow);
    new BarkerKeyboardShortcuts(_mainWindow);
    new BarkerSaveLoadState(_mainWindow);
    new BarkerSideBar(_mainWindow);
    new BarkerStatusBar(_mainWindow);
    BarkerStatusBar.createStatusBar();
    new BarkerZoom(_mainWindow);
    //BarkerMenu.createMainMenu();    //now called from BarkerSaveLoadState.loadTabsFromFile() after bookmarks are loaded
    BarkerSettings.createPreferences(_mainWindow, store);
    BarkerSettings.setAppAccordingToSavedPreferences();

    //display HTML and start renderers
    _mainWindow.webContents.loadFile(_mainIndexFile);
    //_mainWindow.webContents.openDevTools();
    
    //everything other is started when Load events from renderers arrive
    // see BarkerBrowser.showBrowsersIfBodyFullyLoaded()

    _mainWindow.on('resize', function () {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "mainWindow resized");
        const actualTabId = BarkerData.getActualTabId();
        const cnt = BarkerData.getTabLayoutNo(actualTabId);
        BarkerBrowser.showBrowsers(cnt, actualTabId, BarkerData.getTabBrowserOffset(actualTabId));
    });
};

app.whenReady().then(() => {
    BarkerIpc.registerIpcMethods();
    createMainWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
});