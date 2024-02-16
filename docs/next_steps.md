
# NEXT STEPS

## SMALL FIXES (not visible to user)
* solve sqlite errors in logs during startup

## SMALL IMPROVEMENTS
* browser header in layout 4 looks bad
* make CSS for preferences dialog
* show previous status messages (right sidebar)
* create separate Folder in user folder for this app

## FEATURES
* cancel existing download
* cancel existing scrape
* daily statistics of transfer data amount
* scraped webs actions (find text, back/fwd buttons, set download folder}
* organize bookmarks
* set proxy server
* keyboard shortcut to jump to another browser window

## BIG FEATURES
* addons manager
* make addons (yt dislike, yt replay, twitch overview)
* indicate that addon is applied to browser window
* check cookies isolation https://stackoverflow.com/questions/55061908/having-two-isolated-in-terms-of-history-cookies-localstorage-browserviews-in-t
* packager → exe (github release)
* download video


# NOTES FOR BUILDING THE PACKAGE
-------------- BUILD WIN PACKAGE HINTS -------------
npm run package-win

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
