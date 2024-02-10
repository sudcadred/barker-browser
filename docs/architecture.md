# ARCHITECTURE

Main process is started by main.ts which creates BrowserWindow object.
BrowserWindow loads local HTML file index_frames.html which refers to other HTML frames. 
These other frames files contain reference to different renderers, see map below

* frame_topbar.html   -> renderer_topbar.js
* frame_sidebar.html  -> renderer_left.js
* frame_main.html     -> renderer_main.js
* frame_right.html    -> renderer_right.js
* frame_bottom.html   -> renderer_bottom.js

HTML files creates fixed user interface elements but many elements are created 
dynamicaly by javascript/typescript(tabs, browser headers) or Electron framework 
(browser windows) during runtime as needed.

## Filenames naming convention
* main processes start with prefix 'main_'
* renderer processes start with parefix 'renderer_' (second part is usually identification of HTML frame)
* images and HTML files are stored in separated folders

## Start of application looks like this
* main.ts createMainWindow() loads HTML and starts renderer process
* different HTML files are loaded as frames
* when page loading is finished, renderer method onLoad is started 
  (last method in each renderer) and sends back info to main process 
  using Electron IPC API (see also preload.ts)
* these info messages are handled in main_ipc.ts by methods like ipcMainBodyLoaded()
* when all 5 info messages arrive, BarkerBrowser.showBrowsersIfBodyFullyLoaded() 
  starts method BarkerBrowser.showBrowsers which displays individual browser windows 
  both in sidebar and main area
* BrowserView objects are responsible for webpage navigation and as such are independent 
  from HTML elements, therefore resize events have to be handled in a such way that 
  BrowserView elements are always displayed inside of corresponding HTML frames

## Settings
Settings are stored in file barker_browser_preferences.json.json in user folder.

## Saved history
Saved addresses and tabs with history are stored in user folder in file barker_browser.json
Both files use JSON format.
Please be careful when manualy editing these files, every missing or additional comma 
can lead to error at application start.

## Sqlite DB
Sqlite database is used for browsing history and in the future will probably replace barker_browser.json completely 
which is now used mainly for bookmarks and history of typed addresses.
