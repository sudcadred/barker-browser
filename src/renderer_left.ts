/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

var windowLeft = window.parent.parent;
var _leftSidebarWidth: number;

//-------------------------------------------------
// LAYOUTS
//-------------------------------------------------

const layout1Button_sidebar = document.getElementById('layout1button_sidebar');
const layout2Button_sidebar = document.getElementById('layout2button_sidebar');
const layout3Button_sidebar = document.getElementById('layout3button_sidebar');
var activeLayoutNo_sidebar: number

function clearLayoutButtons_sidebar() {
    layout1Button_sidebar.style.background='ButtonFace';
    layout2Button_sidebar.style.background='ButtonFace';
    layout3Button_sidebar.style.background='ButtonFace';
};

layout1Button_sidebar.addEventListener('click', () => {
    clearLayoutButtons_sidebar();
    layout1Button_sidebar.style.background='lightblue';
    (windowLeft as any).electronAPI.changeSidebarLayout(1);
    activeLayoutNo_sidebar=1;
});

layout2Button_sidebar.addEventListener('click', () => {
    clearLayoutButtons_sidebar();
    layout2Button_sidebar.style.background='lightblue';
    (windowLeft as any).electronAPI.changeSidebarLayout(2);
    activeLayoutNo_sidebar=2;
});

layout3Button_sidebar.addEventListener('click', () => {
    clearLayoutButtons_sidebar();
    layout3Button_sidebar.style.background='lightblue';
    (windowLeft as any).electronAPI.changeSidebarLayout(3);
    activeLayoutNo_sidebar=3;
});

(windowLeft as any).electronAPI.onSetSidebarLayout((layoutNo: number) => {
    clearLayoutButtons_sidebar();
    if (layoutNo == 1) layout1Button_sidebar.style.background='lightblue'
    else if (layoutNo == 2) layout2Button_sidebar.style.background='lightblue'
    else if (layoutNo == 3) layout3Button_sidebar.style.background='lightblue';
});

const previousBrowserButton_sidebar = document.getElementById('previousBrowserButton_sidebar');
previousBrowserButton_sidebar.addEventListener('click', () => {
    (windowLeft as any).electronAPI.showPreviousBrowser_sidebar();
});

const nextBrowserButton_sidebar = document.getElementById('nextBrowserButton_sidebar');
nextBrowserButton_sidebar.addEventListener('click', () => {
    (windowLeft as any).electronAPI.showNextBrowser_sidebar();
});

(windowLeft as any).electronAPI.onUpdateRollingBrowsersText_sidebar((rollingText: string) => {
    const rollingLabel = document.getElementById('labelBrowserRollingNumber_sidebar');
    rollingLabel.innerText = rollingText;
});

//-------------------------------------------------
// BROWSER HEADERS
//-------------------------------------------------

function loadURLSidebar(browserNo: number, uri: string) {
    (windowLeft as any).electronAPI.loadURL_sidebar(browserNo, uri)
};

(windowLeft as any).electronAPI.onCreateSidebarBrowserHeader((browserNo: number, left: number, top: number) => {
    //alert('onCreateSidebarBrowserHeader() browserNo=' + browserNo + ", left=" + left + ", top=" + top);

    var divHeader = document.createElement('div');
    divHeader.id =  'divBrowserHeader_sidebar' + browserNo;
    divHeader.style.cssText = ' white-space:nowrap;width:'+_leftSidebarWidth+'px; overflow-x: scroll;position:absolute;left:' + left + 'px;top:' + top + 'px;opacity:0.3;z-index:100;background:#000';
    document.body.appendChild(divHeader);

    //create label 'Window no:'
    //var labelWindowNo = document.createElement('label');
    //labelWindowNo.innerHTML = browserNo.toString();
    //labelWindowNo.id = 'labelWindowNo_sidebar' + browserNo;
    //labelWindowNo.className += 'tabButton';
    //divHeader.appendChild(labelWindowNo);

    //create back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.id = 'backButton_sidebar' + browserNo;
    backButton.className += 'tabButton';
    backButton.innerHTML = '<img src="../img/back1.png" width=20px height=20px />';
    divHeader.appendChild(backButton);

    //Back button click
    backButton.addEventListener('click', () => {
      console.log('Go back');
      (window as any).electronAPI.goBack_sidebar(browserNo);
    });

    //create forward button
    const forwardButton = document.createElement('button');
    forwardButton.textContent = 'Forward';
    forwardButton.id = 'forwardButton_sidebar' + browserNo;
    forwardButton.className += 'tabButton';
    forwardButton.innerHTML = '<img src="../img/forward1.png" width=20px height=20px />';
    divHeader.appendChild(forwardButton);

    forwardButton.addEventListener('click', () => {
      console.log('Go forward');
      (window as any).electronAPI.goForward_sidebar(browserNo);
    });
    
    //create refresh button
    const refreshButton = document.createElement('button');
    //refreshButton.textContent = 'Refresh';
    refreshButton.id = 'refreshButton_sidebar' + browserNo;
    refreshButton.className += 'tabButton';
    refreshButton.innerHTML = '<img src="../img/refresh.png" width=20px height=20px />';
    divHeader.appendChild(refreshButton);

    //Refresh button click
    refreshButton.addEventListener('click', () => {
      console.log('Refresh browser');
      (window as any).electronAPI.reloadPage_sidebar(browserNo);
    });

    //create ClearPage button
    const clearPageButton = document.createElement('button');
    //clearPageButton.textContent = 'Clear page';
    clearPageButton.id = 'clearPageButton_sidebar' + browserNo;
    clearPageButton.className += 'tabButton';
    clearPageButton.innerHTML = '<img src="../img/clear.png" width=20px height=20px />';
    divHeader.appendChild(clearPageButton);

    //ClearPage button click
    clearPageButton.addEventListener('click', () => {
      console.log('Clear page');
      (window as any).electronAPI.clearPage_sidebar(browserNo);
    });

    //create label 'URL address'
    //var labelUrlAddress = document.createElement('label');
    //labelUrlAddress.innerHTML = "URL";
    //labelUrlAddress.id = 'labelUrlAddress_sidebar' + browserNo;
    //labelUrlAddress.className += 'tabButton';
    //divHeader.appendChild(labelUrlAddress);

    //create input for 'URL address'
    var inputUrlAddress = document.createElement('input');
    inputUrlAddress.id = 'inputUrlAddress_sidebar' + browserNo;
    //alert('createBrowserHeader(): inputUrlAddress.id=' + inputUrlAddress.id);
    inputUrlAddress.className += 'headerUrlInput';
    inputUrlAddress.style.width = (_leftSidebarWidth-100).toString+'px';
    inputUrlAddress.onkeydown = setUrlSidebar;
    divHeader.appendChild(inputUrlAddress);

    //create button Go
    const goButton = document.createElement('button');
    goButton.textContent = 'Go';
    goButton.id = 'goButton_sidebar' + browserNo;
    goButton.className += 'tabButton';
    divHeader.appendChild(goButton);

    //----------------------------
    // ---- click events ---------
    //----------------------------

    function setUrlSidebar(event:KeyboardEvent) {
        if(event.key === 'Enter') {
            const address = inputUrlAddress.value;
            loadURLSidebar(browserNo, address);
        }
    }

    //Go button click
    goButton.addEventListener('click', () => {
      console.log('Go to address');
      const address = inputUrlAddress.value;
      loadURLSidebar(browserNo, address);
    });

});


(windowLeft as any).electronAPI.onDeleteAllBrowserHeaders(() => {
    for (let i=1; i<=108; i++) {
        const divHeader = document.getElementById('divBrowserHeader_sidebar'+i.toString());
        if (divHeader) divHeader.remove();
    }
});

(windowLeft as any).electronAPI.onUpdateUrl((browserNo: number, uri: string) => {
    const urlInput = document.getElementById('inputUrlAddress_sidebar' + browserNo);
    if (urlInput) {
        //alert('onUpdateUrl(): browserNo='+browserNo+', uri='+uri+', urlInput='+urlInput);
        (urlInput as any).value= uri;
    }
});

window.addEventListener('resize', function() {
    _leftSidebarWidth = window.innerWidth;
    (windowLeft as any).electronAPI.leftSidebarResized(_leftSidebarWidth);
}, true);

//------------------- BODY ONLOAD -----------------------

// body onLoad()
window.addEventListener('load', function () {
    _leftSidebarWidth = window.innerWidth;
    (windowLeft as any).electronAPI.leftBodyLoaded(_leftSidebarWidth);
});