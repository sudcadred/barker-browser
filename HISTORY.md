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
* introduced browser window header (icons back/forward, refresh, clear page)
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
* suggestion box for previously typed addresses
* show link on hover
* 'show development console' added to more actions button

# NEXT STEPS

## NOW

## NEXT
* fix 'find in page'
* during change layout seems that page is loaded again
* add tab context menu (rename tab, refresh whole tab, mute tab)

## LATER
* think about down-arrow+Enter during suggestion box
* think how to hide suggestion box when clicked elsewhere
* muted browser window indication
* scrape url
* addons support
* packager → exe (github release)
* move tabs (change tab order)
* add menu item to open all bookmarks from current menu in new tab

## KNOWN BUGS
* clear page => delete also address
* clear page + back => bug
* address navigation does not always change
* delete tab
* test big layouts how behave
* test closing all tabs
* what happens if BarkerBrowser.showBrowsersIfBodyFullyLoaded() is called more times?

## IDEAS (not sure if will be implemented)
* barker console
* share my likes
* download video
* loop video
