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
var browserHeader_clear = false;
(windowMain as any).electronAPI.onSetBrowserHeaderButtons((value: string) => {
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
        const clearPageButton = document.getElementById('clearPageButton' + i);
        if (clearPageButton) {
            if (browserHeader_clear) {
                clearPageButton.style.display = 'inline-block';
            } else {
                clearPageButton.style.display = 'none';
            }
        }
    }
}); 

function loadURL(browserNo: number, uri: string) {
    (windowMain as any).electronAPI.loadURL(browserNo, uri)
};

(windowMain as any).electronAPI.onCreateBrowserHeader((browserNo: number, left: number, top: number, browser_width: number) => {

    var divHeader = document.createElement('div');
    divHeader.id =  'divBrowserHeader' + browserNo;
    divHeader.style.cssText = 'display:inline-block;width:'+browser_width+'px;white-space:nowrap; overflow-x: scroll;position:absolute;left:' + left + 'px;top:' + top + 'px;opacity:0.3;z-index:100;background:#000; border: 1px solid black; cursor:pointer;';
    document.body.appendChild(divHeader);

    //create back button
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    backButton.id = 'backButton' + browserNo;
    backButton.className += 'tabButton';
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
    forwardButton.id = 'forwardButton' + browserNo;
    forwardButton.className += 'tabButton';
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
    refreshButton.className += 'tabButton';
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

    //create ClearPage button
    const clearPageButton = document.createElement('button');
    clearPageButton.id = 'clearPageButton' + browserNo;
    clearPageButton.className += 'tabButton';
    clearPageButton.innerHTML = '<img src="../img/clear.png" width=20px height=20px />';
    divHeader.appendChild(clearPageButton);

    //ClearPage button click
    clearPageButton.addEventListener('click', () => {
      console.log('Clear page');
      (windowMain as any).electronAPI.clearPage(browserNo);
    });

    if (browserHeader_clear) {
        clearPageButton.style.display = 'inline-block';
    } else {
        clearPageButton.style.display = 'none';
    }

    //create input for 'URL address'
    var inputUrlAddress = document.createElement('input');
    inputUrlAddress.id = 'inputUrlAddress' + browserNo;
    inputUrlAddress.className += 'headerUrlInput';
    inputUrlAddress.onkeydown = setUrl;
    divHeader.appendChild(inputUrlAddress);

    //create button Go
    const goButton = document.createElement('button');
    goButton.textContent = 'Go';
    goButton.id = 'goButton' + browserNo;
    goButton.className += 'tabButton';
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

    //create ... button
    const threeDotsButton = document.createElement('button');
    threeDotsButton.id = 'threeDotsButton' + browserNo;
    threeDotsButton.className += 'tabButton';
    threeDotsButton.innerHTML = '<img src="../img/dots.png" width=20px height=20px />';
    divHeader.appendChild(threeDotsButton);

    //... dots button click
    threeDotsButton.addEventListener('click', () => {
        showThreeDotsMenu(browserNo);
      });
  
    if (browserHeader_refresh) {
    threeDotsButton.style.display = 'inline-block';
    } else {
    threeDotsButton.style.display = 'none';
    }
  
  
});

function showThreeDotsMenu(browserNo: number) {
    //alert('left='+left+', top='+top);
    (windowMain as any).electronAPI.showThreeDotsMenu(browserNo)
}

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
    }
});

(windowMain as any).electronAPI.onCtrlL((browserNo: number) => {
    const addressBar = document.getElementById('inputUrlAddress' + browserNo);
    if (addressBar) {
        addressBar.focus();
    }
});

//------------------- BODY ONLOAD -----------------------

// body onLoad()
window.addEventListener('load', function () {
    (windowMain as any).electronAPI.mainBodyLoaded(window.innerHeight);
});
