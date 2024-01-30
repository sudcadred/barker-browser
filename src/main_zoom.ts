import { BrowserView } from "electron";
import { BarkerUtils } from "./main_utils";
import { BarkerBrowser } from "./main_browser";
import { BarkerData } from "./main_data";

/* This class provides methods for zooming of browser window
*/

export class BarkerZoom {

/* Public API
constructor(mainWindow: Electron.BrowserWindow)
static createZoomWindowsForOneTab(tabNo: number)
static isZoomedSidebar(browserNo: number): boolean
static isZoomed(tabNo:number, browserNo: number)
static unzoomSidebarView()
static zoomSidebarView(browserNo: number)
static unzoomBrowserView()
static zoomBrowserView(browserNo: number)
*/

static mainWindow: Electron.BrowserWindow = null;

//ctor    
constructor(mainWindow: Electron.BrowserWindow) {
    BarkerZoom.mainWindow = mainWindow;
}
    
static createZoomWindowsForOneTab(tabNo: number) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createZoomWindow(): tabNo="+tabNo);

    //create browserView for zoomed window
    let tabName = 'NewTab' + tabNo;
    let browser = new BrowserView({
                                  webPreferences: { 
                                    devTools: true, 
                                  }
                                });
    browser.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    browser.webContents.loadFile('../html/default_zoom.html');
    BarkerZoom.mainWindow.addBrowserView(browser);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createZoomWindow(): Empty zoom window created");

    //create browserView for zoomed window on original (before zoom) position
    let browser2 = new BrowserView({
                              webPreferences: { 
                                devTools: true, 
                              }
                            });
    browser2.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    browser2.webContents.loadFile('../html/default_zoomed_original.html');
    BarkerZoom.mainWindow.addBrowserView(browser2);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createZoomWindow(): Zoom window on original position created");

    let browserViews = BarkerZoom.mainWindow.getBrowserViews();
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createZoomWindow(): browserViews=" + browserViews.length);
}

static isZoomedSidebar(browserNo: number): boolean {
    return false;
}

static isZoomed(tabNo:number, browserNo: number) {
    const zoomedBrowser = BarkerData.getZoomedBrowserView('NewTab'+tabNo);
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo('NewTab'+tabNo);
    let browserViews = BarkerZoom.mainWindow.getBrowserViews();
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "isZoomed(): zoomedBrowser=" + zoomedBrowser+", firstBrowserNo="+firstBrowserNo+", browserNo="+browserNo);

    if (!zoomedBrowser) return false;   //return false if no browser is zoomed in the tab
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "isZoomed(): (<BrowserView>zoomedBrowser).webContents.id=" + (<BrowserView>zoomedBrowser).webContents.id+", (<BrowserView>browserViews[firstBrowserNo+browserNo-2]).webContents.id="+(<BrowserView>browserViews[firstBrowserNo+browserNo-2]).webContents.id);
    return ((<BrowserView>zoomedBrowser).webContents.id == (<BrowserView>browserViews[firstBrowserNo+browserNo-2]).webContents.id); //compare if browserNo is zoomed
}

static unzoomSidebarView() {
}

static zoomSidebarView(browserNo: number) {
}


static unzoomBrowserView() {
	BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "unzoomBrowserView");
    const actualTabId = BarkerData.getActualTabId();
    BarkerData.getZoomedBrowserMap().delete(actualTabId);
    const layout = BarkerData.getTabLayoutNo(actualTabId);
    BarkerBrowser.showBrowsers(layout, actualTabId, BarkerData.getTabBrowserOffset(actualTabId));
}

static zoomBrowserView(browserNo: number) {
    BarkerZoom.unzoomBrowserView();
    let browserViews = BarkerZoom.mainWindow.getBrowserViews();
    const actualTabId = BarkerData.getActualTabId();
    const firstBrowserNo = BarkerData.getTabFirstBrowserViewNo(actualTabId);
    BarkerData.getZoomedBrowserMap().set(actualTabId, browserViews[firstBrowserNo+browserNo-2]);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "zoomBrowserView(): browserViews[firstBrowserNo+browserNo-2]="+browserViews[firstBrowserNo+browserNo-2]);
    const layout = BarkerData.getTabLayoutNo(actualTabId);
    BarkerBrowser.showBrowsers(layout, actualTabId, BarkerData.getTabBrowserOffset(actualTabId));
}

}
