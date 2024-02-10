layout: page
title: "History and next steps"
permalink: /history

# HISTORY
development started from 1.1.2024 
(first concepts were done a month or two before that time but real work started in 2024)

## 2024 week1 
* basic UI (one address input for whole tab)
* create tab, delete tab, rename tab

## 2024 week2 
* zoom one browser window to another window (replaced by better navigation strategy in week3 :)

## 2024 week3 
* UI redesign (one address for each displayed browser window, possibility to roll windows)
* save tabs / load addresses at startup
* introduced browser window header (icons back/forward, refresh, clear page)
* open link in next window
* find text in page (ctrl+f)

## 2024 week4 
* file download
* settings
* keyboard shortcuts to access individual tabs / layouts
* left sidebar

## 2024 week5 
* bookmarks
* 'more actions' button in browser header (mute, unmute, find in, save, print, bookmark)
* suggestion box for previously typed addresses
* show link on hover
* 'show development console' added to more actions button

## 2024 week6
* open all bookmarks in new tab
* find text in whole tab + left sidebar (visible windows)
* drag'n'drop for tabs (change tabs order)
* move browser window to another position (arrows in header)
* browsing history (including text content of the page)

# NEXT STEPS

## NOW
* add F12 shortcut (add to main menu)
* disable history panel when F12

## NEXT
* remove Save tabs button and put it into Menu -> File
* solve bug with navigation events from other not visible tabs
* tab context menu (rename tab, refresh whole tab, mute tab, move tab left/right) - possibly move renameDiv from topBar to main area

## LATER
* possibility to search in history pages content
* if DB does not exist in user folder, copy empty DB there
* check cookies isolation https://stackoverflow.com/questions/55061908/having-two-isolated-in-terms-of-history-cookies-localstorage-browserviews-in-t
* scrape url
* addons manager
* packager → exe (github release)

## IDEAS (not sure if will be implemented)
* download articles for offline usage
* barker console
* share my likes
* download video
* loop video
* show timer how long spent in tab name

## ADDONS IDEAS
* twitch overview

## Missing features
* edit bookmarks
* muted browser window indication
* set proxy server

-------------- BUILD WIN PACKAGE HINTS -------------
Make sure you have build tools installed. You can install them by running this command as administrator:
$ npm i -g windows-build-tools
$ yarn # Install needed depedencies.
$ yarn rebuild # Rebuild native modules using Electron headers.
$ yarn dev # Run Wexond in development mode
More commands
$ yarn compile-win32 # Package Wexond for Windows
$ yarn compile-linux # Package Wexond for Linux
$ yarn compile-darwin # Package Wexond for macOS
$ yarn lint # Runs linter
$ yarn lint-fix # Runs linter and automatically applies fixes


"C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvarsall.bat" x86 10.0.19041.0
