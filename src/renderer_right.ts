/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

var windowRight = window.parent.parent;
var _rightSidebarWidth: number;

window.addEventListener('resize', function() {
    _rightSidebarWidth = window.innerWidth;
    (windowRight as any).electronAPI.rightSidebarResized(_rightSidebarWidth);
}, true);

//------------------- BODY ONLOAD -----------------------

// body onLoad()
window.addEventListener('load', function () {
    _rightSidebarWidth = window.innerWidth;
    (windowRight as any).electronAPI.rightBodyLoaded(_rightSidebarWidth);
});
