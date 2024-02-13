
# NEXT STEPS

## NOW


## NEXT
* lazy loading during startup
* destroy memory structures created by new when closing app (event before-quit)
* add menu Tutorial with links to text description and video (prepare HTML description)
* sidebar layout after startup
* create logfile
* cancel existing download
* cancel existing scrape
* addons manager
* browser header in layout 4 looks bad
* daily statistics of transfer data amount
* lower statusbar text (1-2 pixels)
* log of previous status messages
* make CSS for preferences dialog

## LATER
* make addons (yt dislike, yt replay, twitch overview)
* indicate that addon is applied to browser window
* check cookies isolation https://stackoverflow.com/questions/55061908/having-two-isolated-in-terms-of-history-cookies-localstorage-browserviews-in-t
* packager → exe (github release)
* download video
* google PDF preview
* scraping (back/fwd buttons, set download folder, missing body tag in some pages causes wrong parsing of links)


## Missing features
* edit bookmarks
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
