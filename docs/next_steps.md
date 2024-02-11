
# NEXT STEPS

## NOW
* if DB does not exist in user folder, copy empty DB there

## NEXT
* scrape url
* show scraped webs (right sidebar)
* destroy memory structures created by new when closing app
* addons manager
* add menu Tutorial with links to text description and video (prepare HTML description)

## LATER
* make addons (yt dislike, yt replay, twitch overview)
* indicate that addon is applied to browser window
* check cookies isolation https://stackoverflow.com/questions/55061908/having-two-isolated-in-terms-of-history-cookies-localstorage-browserviews-in-t
* packager → exe (github release)
* download video

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
