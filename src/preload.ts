/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) {
      element.innerText = text;
    }
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type as keyof NodeJS.ProcessVersions]);
  }
});

const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  // IPC - renderer to main.ts

    //layout
    changeLayout: (cnt: number) => { ipcRenderer.send('change-layout', cnt) },
    changeSidebarLayout: (cnt: number) => { ipcRenderer.send('change-sidebar-layout', cnt) },

    //tabs
    createTab: (tabNo: number) => { ipcRenderer.send('create-tab', tabNo) },
    changeTab: (tabName: string) => { ipcRenderer.send('change-tab', tabName) },
    saveTabs: () => { ipcRenderer.send('save-tabs') },
    renameTab: (newTabName: string) => { ipcRenderer.send('rename-tab', newTabName) },

    //roll browser windows
    showPreviousBrowser: () => { ipcRenderer.send('show-previous-browser') },
    showNextBrowser: () => { ipcRenderer.send('show-next-browser') },
    showPreviousBrowser_sidebar: () => { ipcRenderer.send('show-previous-browser-sidebar') },
    showNextBrowser_sidebar: () => { ipcRenderer.send('show-next-browser-sidebar') },

    //browser headers
    toggleShowHeaders: () => { ipcRenderer.send('toggle-show-headers') },

    //zoom
    zoomBrowserView: (browserNo: number) => { ipcRenderer.send('zoom-browser-view', browserNo) },
    unzoom: () => { ipcRenderer.send('unzoom') }, 

    //page navigation
    loadURL: (browserNo: number, address: string) => { ipcRenderer.send('load-url', browserNo, address) },
    loadURL_sidebar: (browserNo: number, address: string) => { ipcRenderer.send('load-url-sidebar', browserNo, address) },
    findInPage: (text: string) => { ipcRenderer.send('find-in-page', text) },
    clearSelection: () => { ipcRenderer.send('clear-selection') },
    goBack: (browserNo: number) => { ipcRenderer.send('go-back', browserNo) },
    goForward: (browserNo: number) => { ipcRenderer.send('go-forward', browserNo) },
    reloadPage: (browserNo: number) => { ipcRenderer.send('reload-page', browserNo) },
    reloadTab: (tabId: string) => { ipcRenderer.send('reload-tab', tabId) },
    clearPage: (browserNo: number) => { ipcRenderer.send('clear-page', browserNo) },
    goBack_sidebar: (browserNo: number) => { ipcRenderer.send('go-back-sidebar', browserNo) },
    goForward_sidebar: (browserNo: number) => { ipcRenderer.send('go-forward-sidebar', browserNo) },
    reloadPage_sidebar: (browserNo: number) => { ipcRenderer.send('reload-page-sidebar', browserNo) },
    reloadTab_sidebar: (tabId: string) => { ipcRenderer.send('reload-tab-sidebar', tabId) },
    clearPage_sidebar: (browserNo: number) => { ipcRenderer.send('clear-page-sidebar', browserNo) },
    showThreeDotsMenu: (browserNo:number) => {ipcRenderer.send('show-three-dots-menu', browserNo) },

    //startup events
    topBodyLoaded: (height: number) => { ipcRenderer.send('top-body-loaded', height) },
    leftBodyLoaded: (width: number) => { ipcRenderer.send('left-body-loaded', width) },
    mainBodyLoaded: (height: number) => { ipcRenderer.send('main-body-loaded', height) },
    rightBodyLoaded: (width: number) => { ipcRenderer.send('right-body-loaded', width) },
    bottomBodyLoaded: (height: number) => { ipcRenderer.send('bottom-body-loaded', height) },

    //resize events
    leftSidebarResized: (width: number) => { ipcRenderer.send('left-sidebar-resized', width) },
    rightSidebarResized: (width: number) => { ipcRenderer.send('right-sidebar-resized', width) },
    topBarResized: (height: number) => { ipcRenderer.send('topbar-resized', height) },
    bottomBarResized: (height: number) => { ipcRenderer.send('bottombar-resized', height) },

    
    // IPC - main.ts to renderer
    onCtrlL: (callback: Function) => ipcRenderer.on('focus-addressbar', (_event, value) => callback(value)),
    onSetLayout: (callback: Function) => ipcRenderer.on('set-layout', (_event, value) => callback(value)),
    onSetSidebarLayout: (callback: Function) => ipcRenderer.on('set-sidebar-layout', (_event, value) => callback(value)),
    onCtrlTab: (callback: Function) => ipcRenderer.on('switch-tab', (_event, value) => callback(value)),
    onSetNextTabName: (callback: Function) => ipcRenderer.on('set-next-tab-name', (_event, value) => callback(value)),
    onLoadTab: (callback: Function) => ipcRenderer.on('load-tab', (_event, value) => callback(value)),
    onActivateTab: (callback: Function) => ipcRenderer.on('activate-tab', (_event, value) => callback(value)),
    onCreateBrowserHeader: (callback: Function) => ipcRenderer.on('create-browser-header', (_event, browserNo, left, top, browser_width) => callback(browserNo, left, top, browser_width)),
    onCreateSidebarBrowserHeader: (callback: Function) => ipcRenderer.on('create-sidebar-browser-header', (_event, browserNo, left, top) => callback(browserNo, left, top)),
    onDeleteAllBrowserHeaders: (callback: Function) => ipcRenderer.on('delete-all-browser-headers', () => callback()),
    onDeleteAllBrowserHeadersSidebar: (callback: Function) => ipcRenderer.on('delete-all-browser-headers-sidebar', () => callback()),
    onUpdateRollingBrowsersText: (callback: Function) => ipcRenderer.on('update-rolling-browsers-text', (_event, value) => callback(value)),
    onUpdateRollingBrowsersText_sidebar: (callback: Function) => ipcRenderer.on('update-rolling-browsers-text-sidebar', (_event, value) => callback(value)),
    onUpdateUrl: (callback: Function) => ipcRenderer.on('update-url', (_event, browserNo, uri) => callback(browserNo, uri)), 
    onShowSearchbar: (callback: Function) => ipcRenderer.on('show-searchbar', () => callback()), 
    onSetLayoutButtons: (callback: Function) => ipcRenderer.on('set-layout-buttons', (_event, value) => callback(value)), 
    onSetBrowserHeaderButtons: (callback: Function) => ipcRenderer.on('set-browser-header-buttons', (_event, value) => callback(value)), 
})
