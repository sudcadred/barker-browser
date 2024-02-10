/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

var windowMain = window.parent.parent;
const _maxLayoutNo_main = 49;

//-------------------------------------------------
// BROWSER HEADERS
//-------------------------------------------------

var browserHeader_back = false;
var browserHeader_forward = false;
var browserHeader_refresh = false;
(windowMain as any).electronAPI.onSetBrowserHeaderButtons((value: string) => {
    //alert(value);
    browserHeader_back = false;
    browserHeader_forward = false;
    browserHeader_refresh = false;
    
    const headerButtons = value.split(',');
    if (headerButtons[0] == '1') browserHeader_back = true;
    if (headerButtons[1] == '1') browserHeader_forward = true;
    if (headerButtons[2] == '1') browserHeader_refresh = true;

    for (let i=1; i<=_maxLayoutNo_main; i++) {
        const backButton = document.getElementById('backButton' + i);
        if (backButton) {
            if (browserHeader_back) {
                backButton.style.display = 'inline-block';
            } else {
                backButton.style.display = 'none';
            }
        }
        const forwardButton = document.getElementById('forwardButton' + i);
        if (forwardButton) {
            if (browserHeader_forward) {
                forwardButton.style.display = 'inline-block';
            } else {
                forwardButton.style.display = 'none';
            }
        }
        const refreshButton = document.getElementById('refreshButton' + i);
        if (refreshButton) {
            if (browserHeader_refresh) {
                refreshButton.style.display = 'inline-block';
            } else {
                refreshButton.style.display = 'none';
            }
        }
    }
}); 

function loadURL(browserNo: number, uri: string) {
    (windowMain as any).electronAPI.loadURL(browserNo, uri)
};

function hideMatchedAddresses() {
    var divMatchedAddresses = document.getElementById("divMatchedAddresses");
    divMatchedAddresses.style.display = 'none';
}

(windowMain as any).electronAPI.onCreateBrowserHeader((browserNo: number, left: number, top: number, browser_width: number) => {

    var divHeader = document.createElement('div');
    divHeader.id =  'divBrowserHeader' + browserNo;
    divHeader.style.cssText = 'display:inline-block;width:'+browser_width+'px;white-space:nowrap; overflow-x: scroll;position:absolute;left:' + left + 'px;top:' + top + 'px;opacity:0.3;z-index:100;background:#000; border: 1px solid black; cursor:pointer;';
    document.body.appendChild(divHeader);

    //create indication button
    const indicationButton = document.createElement('button');
    indicationButton.textContent = '!';
    indicationButton.id = 'browserIndicationButton' + browserNo;
    indicationButton.className += 'headerButton';
    indicationButton.style.backgroundColor = 'yellow';
    indicationButton.style.color = 'black';
    indicationButton.style.width = '15px';
    indicationButton.style.display = 'none';
    divHeader.appendChild(indicationButton);

    //create back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.title = 'Back';
    backButton.id = 'backButton' + browserNo;
    backButton.className += 'headerButton';
    backButton.innerHTML = '<img src="../img/back1.png" width=20px height=20px />';
    divHeader.appendChild(backButton);

    //Back button click
    backButton.addEventListener('click', () => {
      console.log('Go back');
      (windowMain as any).electronAPI.goBack(browserNo);
    });
    if (browserHeader_back) {
        backButton.style.display = 'inline-block';
    } else {
        backButton.style.display = 'none';
    }

    //create forward button
    const forwardButton = document.createElement('button');
    forwardButton.textContent = 'Forward';
    forwardButton.title = 'Forward';
    forwardButton.id = 'forwardButton' + browserNo;
    forwardButton.className += 'headerButton';
    forwardButton.innerHTML = '<img src="../img/forward1.png" width=20px height=20px />';
    divHeader.appendChild(forwardButton);

    forwardButton.addEventListener('click', () => {
      console.log('Go forward');
      (windowMain as any).electronAPI.goForward(browserNo);
    });
    
    if (browserHeader_forward) {
        forwardButton.style.display = 'inline-block';
    } else {
        forwardButton.style.display = 'none';
    }

    //create refresh button
    const refreshButton = document.createElement('button');
    refreshButton.id = 'refreshButton' + browserNo;
    refreshButton.title = 'Reload page';
    refreshButton.className += 'headerButton';
    refreshButton.innerHTML = '<img src="../img/refresh.png" width=20px height=20px />';
    divHeader.appendChild(refreshButton);

    //Refresh button click
    refreshButton.addEventListener('click', () => {
      console.log('Refresh browser');
      (windowMain as any).electronAPI.reloadPage(browserNo);
    });

    if (browserHeader_refresh) {
        refreshButton.style.display = 'inline-block';
    } else {
        refreshButton.style.display = 'none';
    }

    //create input for 'URL address'
    var inputUrlAddress = document.createElement('input');
    inputUrlAddress.id = 'inputUrlAddress' + browserNo;
    inputUrlAddress.className += 'headerUrlInput';
    inputUrlAddress.onkeydown = setUrl;
    divHeader.appendChild(inputUrlAddress);
    inputUrlAddress.addEventListener('click', () => {
        inputUrlAddress.select();
    });

    //create button Go
    const goButton = document.createElement('button');
    goButton.textContent = 'Go ('+browserNo+')';
    goButton.id = 'goButton' + browserNo;
    goButton.className += 'headerButton';
    divHeader.appendChild(goButton);

    function setUrl(event:KeyboardEvent) {
        if(event.key === 'Enter') {
            const address = inputUrlAddress.value;
            loadURL(browserNo, address);
        } else {
            (windowMain as any).electronAPI.addressKeyPressed(browserNo, inputUrlAddress.value);
        }
    }
    //Go button click
    goButton.addEventListener('click', () => {
      console.log('Go to address');
      const address = inputUrlAddress.value;
      loadURL(browserNo, address);
    });

    // create 'Move left' button
    const moveLeftButton = document.createElement('button');
    moveLeftButton.id = 'moveLeftButton' + browserNo;
    moveLeftButton.title = 'Move window left';
    moveLeftButton.className += 'moveButton';
    moveLeftButton.style.cssText = 'display:inline-block;float: left;line-height: 36px;';
    moveLeftButton.innerHTML = '<img src="../img/left.png" width=10px height=10px />';
    moveLeftButton.style.height = '50px';
    divHeader.appendChild(moveLeftButton);
    moveLeftButton.addEventListener('click', () => {
        (windowMain as any).electronAPI.moveWindowLeft(browserNo);
    });

    var divUpDownButtons = document.createElement('span');
    divUpDownButtons.id =  'divUpDownButtons' + browserNo;
    divUpDownButtons.style.cssText = 'display:inline-block;float: left;width: 25px; height:50px;white-space:wrap';
    divHeader.appendChild(divUpDownButtons);

    // create 'Move up' button
    const moveUpButton = document.createElement('button');
    moveUpButton.id = 'moveUpButton' + browserNo;
    moveUpButton.title = 'Move window up';
    moveUpButton.innerHTML = '<img src="../img/up.png" width=10px height=10px />';
    moveUpButton.style.height = '25px';
    divUpDownButtons.appendChild(moveUpButton);
    moveUpButton.addEventListener('click', () => {
        (windowMain as any).electronAPI.moveWindowUp(browserNo);
    });

    // create 'Move down' button
    const moveDownButton = document.createElement('button');
    moveDownButton.id = 'moveDownButton' + browserNo;
    moveDownButton.title = 'Move window down';
    moveDownButton.style.cssText = 'padding 20px 0px';
    moveDownButton.innerHTML = '<img src="../img/down.png" width=10px height=10px />';
    moveDownButton.style.height = '25px';
    divUpDownButtons.appendChild(moveDownButton);
    moveDownButton.addEventListener('click', () => {
        (windowMain as any).electronAPI.moveWindowDown(browserNo);
    });

    // create 'Move right' button
    const moveRightButton = document.createElement('button');
    moveRightButton.id = 'moveRightButton' + browserNo;
    moveRightButton.title = 'Move window right';
    moveRightButton.className += 'moveButton';
    moveRightButton.style.cssText = 'display:inline-block;float: left;line-height: 36px;';
    moveRightButton.innerHTML = '<img src="../img/right.png" width=10px height=10px />';
    moveRightButton.style.height = '50px';
    divHeader.appendChild(moveRightButton);
    moveRightButton.addEventListener('click', () => {
        (windowMain as any).electronAPI.moveWindowRight(browserNo);
    });

    //create ... button
    const threeDotsButton = document.createElement('button');
    threeDotsButton.id = 'threeDotsButton' + browserNo;
    threeDotsButton.title = 'More actions';
    threeDotsButton.className += 'headerButton';
    threeDotsButton.style.cssText = 'display:block;float: left;';
    threeDotsButton.innerHTML = '<img src="../img/dots.png" width=20px height=20px />';
    divHeader.appendChild(threeDotsButton);
    threeDotsButton.addEventListener('click', () => {
        (windowMain as any).electronAPI.showThreeDotsMenu(browserNo);
    });
});

(windowMain as any).electronAPI.onDeleteAllBrowserHeaders(() => {
    for (let i=1; i<=108; i++) {
        const divHeader = document.getElementById('divBrowserHeader'+i.toString());
        if (divHeader) divHeader.remove();
    }
});

(windowMain as any).electronAPI.onUpdateUrl((browserNo: number, uri: string) => {
    const urlInput = document.getElementById('inputUrlAddress' + browserNo);
    if (urlInput) {
        (urlInput as any).value= uri;
        hideMatchedAddresses();
    }
});

(windowMain as any).electronAPI.onCtrlL((browserNo: number) => {
    const addressBar = document.getElementById('inputUrlAddress' + browserNo);
    if (addressBar) {
        addressBar.focus();
    }
});

(windowMain as any).electronAPI.onShowMatchedAddresses((uri: string, left: number, top: number) => {
    var matchedAddressesButton = document.getElementById("matchedAddressesButton");
    matchedAddressesButton.innerText = uri;

    var divMatchedAddresses = document.getElementById("divMatchedAddresses");
    divMatchedAddresses.style.cssText = 'display:inline-block;position:absolute;left:' + left + 'px;top:' + top + 'px;background:yellow; border: 1px solid black; cursor:pointer;';
});

var matchedAddressesButton = document.getElementById("matchedAddressesButton");
matchedAddressesButton.addEventListener("click",function() {
    (windowMain as any).electronAPI.matchedAddressSelected(matchedAddressesButton.innerText);
    hideMatchedAddresses();
});

(windowMain as any).electronAPI.onBrowserWindowIndication((browserNo: number, tooltip: string) => {
    var browserIndicationButton = document.getElementById("browserIndicationButton"+browserNo);
    browserIndicationButton.style.display = 'inline-block';
    browserIndicationButton.title = tooltip;
});

(windowMain as any).electronAPI.onClearBrowserWindowIndication((browserNo: number) => {
    var browserIndicationButton = document.getElementById("browserIndicationButton"+browserNo);
    browserIndicationButton.style.display = 'none';
});

//------------------- BODY ONLOAD -----------------------

// body onLoad()
window.addEventListener('load', function () {
    (windowMain as any).electronAPI.mainBodyLoaded(window.innerHeight);
});
