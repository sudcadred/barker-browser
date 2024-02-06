/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

var windowTop = window.parent.parent;
const _maxLayoutNo = 49;
var _topBarHeight: number;

const layout1Button = document.getElementById('layout1button');
const layout2Button = document.getElementById('layout2button');
const layout4Button = document.getElementById('layout4button');
const layout9Button = document.getElementById('layout9button');
const layout16Button = document.getElementById('layout16button');
const layout25Button = document.getElementById('layout25button');
const layout36Button = document.getElementById('layout36button');
const layout49Button = document.getElementById('layout49button');
var activeLayoutNo: number

function clearLayoutButtons() {
    layout1Button.style.background='ButtonFace'
    layout2Button.style.background='ButtonFace'
    layout4Button.style.background='ButtonFace'
    layout9Button.style.background='ButtonFace'
    layout16Button.style.background='ButtonFace'
    layout25Button.style.background='ButtonFace'
    layout36Button.style.background='ButtonFace'
    layout49Button.style.background='ButtonFace'
};

layout1Button.addEventListener('click', () => {
    clearLayoutButtons();
    layout1Button.style.background='lightblue';
    (windowTop as any).electronAPI.changeLayout(1);
    activeLayoutNo=1;
});

layout2Button.addEventListener('click', () => {
    clearLayoutButtons();
    layout2Button.style.background='lightblue';
    (windowTop as any).electronAPI.changeLayout(2);
    activeLayoutNo=2;
});

layout4Button.addEventListener('click', () => {
    clearLayoutButtons();
    layout4Button.style.background='lightblue';
    (windowTop as any).electronAPI.changeLayout(4);
    activeLayoutNo=4;
});

layout9Button.addEventListener('click', () => {
    clearLayoutButtons();
    layout9Button.style.background='lightblue';
    (windowTop as any).electronAPI.changeLayout(9);
    activeLayoutNo=9;
});

layout16Button.addEventListener('click', () => {
    clearLayoutButtons();
    layout16Button.style.background='lightblue';
    (windowTop as any).electronAPI.changeLayout(16);
    activeLayoutNo=16;
});

layout25Button.addEventListener('click', () => {
    clearLayoutButtons();
    layout25Button.style.background='lightblue';
    (windowTop as any).electronAPI.changeLayout(25);
    activeLayoutNo=25;
});

layout36Button.addEventListener('click', () => {
    clearLayoutButtons();
    layout36Button.style.background='lightblue';
    (windowTop as any).electronAPI.changeLayout(36);
    activeLayoutNo=36;
});

layout49Button.addEventListener('click', () => {
    clearLayoutButtons();
    layout49Button.style.background='lightblue';
    (windowTop as any).electronAPI.changeLayout(49);
    activeLayoutNo=49;
});

const buttonSaveTabs = document.getElementById('saveTabsButton')
buttonSaveTabs.addEventListener('click', () => {
    (windowTop as any).electronAPI.saveTabs();
});

const previousBrowserButton = document.getElementById('previousBrowserButton');
previousBrowserButton.addEventListener('click', () => {
    (windowTop as any).electronAPI.showPreviousBrowser();
});

const nextBrowserButton = document.getElementById('nextBrowserButton');
nextBrowserButton.addEventListener('click', () => {
    (windowTop as any).electronAPI.showNextBrowser();
});

(windowTop as any).electronAPI.onUpdateRollingBrowsersText((rollingText: string) => {
    const rollingLabel = document.getElementById('labelBrowserRollingNumber');
    rollingLabel.innerText = rollingText;
});

const showHeadersCheckbox = document.getElementById('showHeadersCheckbox');
showHeadersCheckbox.addEventListener('change', () => {
    (windowTop as any).electronAPI.toggleShowHeaders();
});

(windowTop as any).electronAPI.onSetLayout((layoutNo: number) => {
    clearLayoutButtons();
    if (layoutNo == 1) layout1Button.style.background='lightblue'
    else if (layoutNo == 2) layout2Button.style.background='lightblue'
    else if (layoutNo == 4) layout4Button.style.background='lightblue'
    else if (layoutNo == 9) layout9Button.style.background='lightblue'
    else if (layoutNo == 16) layout16Button.style.background='lightblue'
    else if (layoutNo == 25) layout25Button.style.background='lightblue'
    else if (layoutNo == 36) layout36Button.style.background='lightblue'
    else if (layoutNo == 49) layout49Button.style.background='lightblue'
});

(windowTop as any).electronAPI.onSetLayoutButtons((value: string) => {
    //alert(value);
    const layoutButtons = value.split(',');
    if (layoutButtons[0] == '1') layout1Button.style.display = 'block'; else layout1Button.style.display = 'none';
    if (layoutButtons[1] == '1') layout2Button.style.display = 'block'; else layout2Button.style.display = 'none';
    if (layoutButtons[2] == '1') layout4Button.style.display = 'block'; else layout4Button.style.display = 'none';
    if (layoutButtons[3] == '1') layout9Button.style.display = 'block'; else layout9Button.style.display = 'none';
    if (layoutButtons[4] == '1') layout16Button.style.display = 'block'; else layout16Button.style.display = 'none';
    if (layoutButtons[5] == '1') layout25Button.style.display = 'block'; else layout25Button.style.display = 'none';
    if (layoutButtons[6] == '1') layout36Button.style.display = 'block'; else layout36Button.style.display = 'none';
    if (layoutButtons[7] == '1') layout49Button.style.display = 'block'; else layout49Button.style.display = 'none';
});

var browserHeader_back = false;
var browserHeader_forward = false;
var browserHeader_refresh = false;
var browserHeader_clear = false;
(windowTop as any).electronAPI.onSetBrowserHeaderButtons((value: string) => {
    //alert(value);
    browserHeader_back = false;
    browserHeader_forward = false;
    browserHeader_refresh = false;
    browserHeader_clear = false;
    
    const headerButtons = value.split(',');
    if (headerButtons[0] == '1') browserHeader_back = true;
    if (headerButtons[1] == '1') browserHeader_forward = true;
    if (headerButtons[2] == '1') browserHeader_refresh = true;
    if (headerButtons[3] == '1') browserHeader_clear = true;

    for (let i=1; i<=_maxLayoutNo; i++) {
        const backButton = document.getElementById('backButton' + i);
        if (backButton) {
            if (browserHeader_back) {
                backButton.style.display = 'block';
            } else {
                backButton.style.display = 'none';
            }
        }
        const forwardButton = document.getElementById('forwardButton' + i);
        if (forwardButton) {
            if (browserHeader_forward) {
                forwardButton.style.display = 'block';
            } else {
                forwardButton.style.display = 'none';
            }
        }
        const refreshButton = document.getElementById('refreshButton' + i);
        if (refreshButton) {
            if (browserHeader_refresh) {
                refreshButton.style.display = 'block';
            } else {
                refreshButton.style.display = 'none';
            }
        }
        const clearPageButton = document.getElementById('clearPageButton' + i);
        if (clearPageButton) {
            if (browserHeader_clear) {
                clearPageButton.style.display = 'block';
            } else {
                clearPageButton.style.display = 'none';
            }
        }
    }
});


//--------------------------------------------------------
//TABS
//--------------------------------------------------------

const addNewTabButton = document.getElementById('addNewTabButton');
var nextTabNo = 1;
var savedRenamedTabId: string;
var lastActiveTabId: string;
var nextTabName: string;

function hideRenameTab() {
    const renameTabDiv = document.getElementById('renameTabDiv');
    renameTabDiv.style.display = 'none';
}

function renameTab() {
    //alert('clicked_id:'+savedRenamedTabId+', value:'+document.getElementById('renameTabInput').value);
    const newTabName = (<HTMLInputElement>document.getElementById('renameTabInput')).value;
    document.getElementById(savedRenamedTabId).textContent = newTabName;
    hideRenameTab();
    (windowTop as any).electronAPI.renameTab(newTabName); 
}

function clearFocusedTabButton() {
    for (let i=1; i<=nextTabNo; i++) {
        const tabButton = document.getElementById('NewTab'+i);
        if (tabButton) {
            tabButton.className = 'tabButton';
        }
    }
}

function getLastNumber(s: string) {
    var matches = s.match(/\d+$/);
    var lastNumber = -1;
    if (matches) lastNumber = parseInt(matches[0], 10);
    return lastNumber;
}

let _draggedButtonId: string;

function createTab(tabName: string) {
    hideRenameTab();

    //create tab button
    const tabDiv = document.getElementById('tabDiv')
    const newButtonTab = document.createElement('button');
    newButtonTab.textContent = tabName;
    newButtonTab.id = 'NewTab' + nextTabNo;
    newButtonTab.className += 'tabButton';
    newButtonTab.draggable = true;
    tabDiv.appendChild(newButtonTab);
    
    //To turn an element into a valid drop target, you can override the default behavior of both dragenter and dragover 
    //events by calling the event.preventDefault() method in their corresponding event handlers
    newButtonTab.addEventListener("dragenter", (e: MouseEvent) => {e.preventDefault();});
    newButtonTab.addEventListener("dragover", (e: MouseEvent) => {e.preventDefault();});

    //drag listener
    newButtonTab.addEventListener("dragstart", (e: MouseEvent) => {
        _draggedButtonId = newButtonTab.id;
    });
    newButtonTab.addEventListener("drop", (e: MouseEvent) => {
        const draggedTab = document.getElementById(_draggedButtonId);
        const sourceTabNo = getLastNumber(_draggedButtonId);
        const sourceCloseButton = document.getElementById('CloseTab' + sourceTabNo);
        const targetTabNo = getLastNumber((e.target as any).id);
        const targetCloseButton = document.getElementById('CloseTab' + targetTabNo);
        targetCloseButton.after(draggedTab);
        draggedTab.after(sourceCloseButton);
    });

    
    //create X button
    const newButtonCloseTab = document.createElement('button');
    newButtonCloseTab.textContent = 'X';
    newButtonCloseTab.id = 'CloseTab' + nextTabNo
    newButtonCloseTab.className += 'tabButton';
    tabDiv.appendChild(newButtonCloseTab);

    // "close tab" button
    newButtonCloseTab.addEventListener('click', () => {
        hideRenameTab();
        console.log('newButtonCloseTab.id = '+newButtonCloseTab.id)
        var closingTabNo =  newButtonCloseTab.id.match(/\d+$/);
        console.log('closingTabNo = '+closingTabNo)
        const tabDiv = document.getElementById('tabDiv')
        const closingTabButton = document.getElementById('NewTab' + closingTabNo)
        tabDiv.removeChild(newButtonCloseTab);
        tabDiv.removeChild(closingTabButton);
    });
    
    //rename tab
    newButtonTab.addEventListener('dblclick', (e) => {
        //save rename tab id
        savedRenamedTabId = newButtonTab.id;

        //create Rename button
        const renameTabDiv = document.getElementById('renameTabDiv');
        renameTabDiv.style.display = 'block';
        renameTabDiv.style.position = 'fixed';
        renameTabDiv.style.left = e.pageX + "px";
        renameTabDiv.style.top = e.pageY + "px";
        const renameTabInput = document.getElementById('renameTabInput');
        renameTabInput.focus();                
    });

    //switch tab
    newButtonTab.addEventListener('click', () => {
      console.log('switch tab');
      clearFocusedTabButton();
      newButtonTab.className = 'focusedTabButton';
      lastActiveTabId = newButtonTab.id;
      (windowTop as any).electronAPI.changeTab(getLastNumber(newButtonTab.id)); 
    });

    nextTabNo++;
}

//create tab started from main process
(windowTop as any).electronAPI.onCreateTab((tabName: string) => {
    createTab(tabName);
});

//change tab started from main process
(windowTop as any).electronAPI.onActivateTab((tabId: string) => {
    //alert('onActivateTab()');

    const tab1 = document.getElementById(tabId);
    tab1.className = 'focusedTabButton';
    lastActiveTabId = tabId;
});

// create tab
addNewTabButton.addEventListener('click', () => {
    createTab('New tab' + nextTabNo);
});

(windowTop as any).electronAPI.onSetNextTabName((tabName: string) => {
    nextTabName = tabName;
});

(windowTop as any).electronAPI.onCtrlTab((tabName: string) => {
    console.log('switch tab');
    clearFocusedTabButton();
    var nextTabButton = null;
    if (tabName == 'next') {
        nextTabButton = document.getElementById(nextTabName);
    } else {
        nextTabButton = document.getElementById(tabName);
    }
    lastActiveTabId = nextTabButton.id;
    nextTabButton.className = 'focusedTabButton';
    (windowTop as any).electronAPI.changeTab(getLastNumber(nextTabButton.id));
});

window.addEventListener('resize', function() {
    _topBarHeight = window.innerHeight;
    (windowTop as any).electronAPI.topBarResized(_topBarHeight);
}, true);

//------------------- DRAG TABS -----------------------

function tabButtonDrag(e: MouseEvent, buttonId: string) {
    const btn = document.getElementById(buttonId);
    btn.style.transform = `translate(${e.pageX - 20}px, ${e.pageY - 20}px)`;
}

//------------------- BODY ONLOAD -----------------------

// body onLoad()
window.addEventListener('load', function () {
    _topBarHeight = window.innerHeight;
    (windowTop as any).electronAPI.topBodyLoaded(_topBarHeight);
});
