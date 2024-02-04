
# WHY THIS PROJECT?  

BARKER BROWSER is a project to make my own internet browsing more easy. 
I am type of person who likes to open a lot of tabs and websites at once. 
Sometimes I just procrastinate but more often I prefer to open a lot of links 
during my research (eg when I was looking how to implement inter process
communications in Electron), I typicaly open 5-20 different tabs just for one topic. 
After reading each tabs I close it but sometimes I am interrupted 
with other activity and tabs remain opened.

So naturaly occured an idea for a split screen functionality. 
Although major browsers dare to offer max 2 browser windows at one time, 
Barker Browser offers more layouts (1, 2, 4, 9, 16, 25 and optionaly also more). 
This opens new possibilities of usecases like watching more TV channels at the same time 
and reading news in other windows on one screen.

# CURRENT FEATURES
* different screen layouts for each tab
* rolling browser windows (navigation inside of one tab)
* left sidebar as a storage for permanently visible websites
* browser navigation (back, forward, refresh, clear page)
* file download
* open link in next browser window, open link in next empty window
* settings
* keyboard shortcuts
* add bookmarks (editing available only manualy in barker_browser.json)

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

## Why frames? 
I know it is controversial topic and not recommended for modern websites but  
Electron framework does not really offer any good possibility to handle resize 
of internal page parts like sidebar (handling it via standard Electron API is 
very slow and not practical).

## Settings
Settings are stored in file barker_browser_preferences.json.json in user folder.

## Saved history
Saved addresses and tabs with history are stored in user folder in file barker_browser.json
Both files use JSON format.
Please be careful when manualy editing these files, every missing or additional comma 
can lead to error at application start.


# HOW TO RUN APP FROM SOURCE CODE

* git clone https://github.com/sudcadred/barker-browser
* npm install
* npm start
