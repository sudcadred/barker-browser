# NEXT STEPS

## NOW

## NEXT
* solve bug with saving of first tab
* solve bug with navigation events from other not visible tabs
* tab context menu (rename tab, refresh whole tab, mute tab, move tab left/right) - possibly move renameDiv from topBar to main area

## LATER
* if DB does not exist in user folder, copy empty DB there
* check cookies isolation https://stackoverflow.com/questions/55061908/having-two-isolated-in-terms-of-history-cookies-localstorage-browserviews-in-t
* scrape url
* addons manager
* packager → exe (github release)

## IDEAS (not sure if will be implemented)
* like page
* share my likes
* download video
* loop video
* show timer how long spent in tab name

## ADDONS IDEAS
* twitch overview
* yt dislike
* yt replay

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
