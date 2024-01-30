/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

var windowBottom = window.parent.parent;

//-------------------------------------------------
// BROWSER HEADERS
//-------------------------------------------------

//------------------- BODY ONLOAD -----------------------

// body onLoad()
window.addEventListener('load', function () {
    (windowBottom as any).electronAPI.bottomBodyLoaded(window.innerHeight);
});
