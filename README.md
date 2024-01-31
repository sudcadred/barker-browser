
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

# NEXT STEPS

## NOW
... actions

## NEXT
* fix 'find in page'
* fix sidebar open link in next window
* sidebar add bookmark
* address completion based on URL history
* add tab context menu (rename tab, refresh whole tab, mute tab)

## LATER
* muted browser window indication
* F12 * display dev console (right bar probably)
* packager → exe
* reddit channel
* show page source code (maybe not necessary when F12 is working)
* move tabs (change tab order)
* restore zoom browser window functionality
* use right sidebar (for zoom and/or dev console)
* add menu item to open all bookmarks from current menu in new tab

## IDEAS (not sure if will be implemented)
* scrape url
* console
* share my views
* download video
* loop video
* addons (edit page (insertText(), replaceText(), apply transformation))

# HISTORY
development started from 1.1.2024 
(first concepts were done a month or two before that time but real work started in 2024)

## week1: 
* basic UI (one address input for whole tab)
* create tab, delete tab, rename tab
## week2: 
* context menu to zoom / unzoom window (disabled by changes in week4 :)
## week3: 
* UI redesign (one address for each displayed browser window, possibility to roll windows)
* save tabs / load addresses at startup
* introduced browser window header (icons * back/forward, refresh, clear page)
* open link in next window
* find text in page (ctrl+f)
## week4: 
* file download
* settings
* keyboard shortcuts to access individual tabs / layouts
* left sidebar
## week5: 
* bookmarks
* 'more actions' button in browser header (mute, unmute, find in, save, print, bookmark)

# KNOWN BUGS
* show link on hover (in statusbar)
* address input click should select address text
* clear page => delete also address
* clear page + back => bug
* address navigation does not always change
* delete tab does not work
* test big layouts how behave
* test closing all tabs
* ctrl+f in sidebar does not work
* ctrl+f in main area works only if some browser window is clicked (activated) before

# RECOMMENDED MINIMAL TEST SET BEFORE COMMIT
* start app, see if tabs are loaded
* create new tab, close tab, rename tab, switch tab
* set address (enter + go button) in main aread but also left sidebar
* change layouts (main window, sidebar)
* file download (direct, indirect)
* show preferences
* test keyboard shortcuts (eg ctrl+1, ctrl+f1)

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
Settings are stored in file preferences.json in app folder.

## Saved history
Saved addresses and tabs with history are stored in user folder in file barker_browser.json
Both files use JSON format.
Please be careful when manualy editing these files, every missing or additional comma 
can lead to error at application start.


# HOW TO RUN APP FROM SOURCE CODE

* git clone https://github.com/sudcadred/barker-browser
* npm install
* npm start
