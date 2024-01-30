import { BrowserWindow, BrowserView  } from "electron";
import { BarkerUtils } from './main_utils';

/* This class creates and displays StatusBar at the bottom of application
   Statubar is placeholder for various status messages but also file download progress
*/

export class BarkerStatusBar {

/*
constructor(mainWindow: Electron.BrowserWindow)
static updateStatusBarText(newText: string)
static createStatusBar()
static setBoundsForStatusBar(left:number, top:number, width: number, height: number)
*/

static statusBar: Electron.BrowserView = null;
static mainWindow: Electron.BrowserWindow = null;

constructor(mainWindow: Electron.BrowserWindow) {
    BarkerStatusBar.mainWindow = mainWindow;
}

static updateStatusBarText(newText: string) {
    BarkerStatusBar.statusBar.webContents.loadURL('data:text/html;charset=utf-8,<body>'+newText+'</body>');
}

static createStatusBar() {
    let browser = new BrowserView({webPreferences: {
                                devTools: true, 
                                }});
    browser.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    BarkerStatusBar.statusBar = browser;
    BarkerStatusBar.statusBar.webContents.loadURL('data:text/html;charset=utf-8,<body>App ready</body>');
    BarkerStatusBar.mainWindow.addBrowserView(browser);
}

static setBoundsForStatusBar(left:number, top:number, width: number, height: number) {
    if (BarkerStatusBar.statusBar) {
        BarkerStatusBar.statusBar.setBounds({ x: left, y: top, width: width, height: height});
    } else {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "setBoundsForStatusBar() ERROR statusbar undefined");
    }
}
    
}
