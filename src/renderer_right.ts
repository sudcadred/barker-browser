/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

var windowRight = window.parent.parent;
var _rightSidebarWidth: number;

(windowRight as any).electronAPI.onHistoryDomainsSet( (date: string, datesList: string, todayDomainsList: string, todayUriList: string) => {
    const divHistoryPanel = document.getElementById('divHistoryPanel');
    let historyDomains = JSON.parse(todayDomainsList);
    let historyUris = JSON.parse(todayUriList);
    let historyDates = JSON.parse(datesList);

    //clear previous content
    divHistoryPanel.innerHTML = "";
    let h1 = document.createElement("h1");
    let textNode = document.createTextNode("History of visited websites");
    h1.appendChild(textNode);
    divHistoryPanel.append(h1);
    
    let h2 = document.createElement("h2");
    textNode = document.createTextNode(date);
    h2.appendChild(textNode);
    divHistoryPanel.append(h2);

    let hr = document.createElement("hr");
    divHistoryPanel.append(hr);

    //today (full info)
    for (let i=0; i< historyDomains.length; i++) {

        //create Domain button
        let  btn = document.createElement('button');
        btn.id = 'buttonHistoryDomain' + i;
        btn.textContent = historyDomains[i].domain;
        btn.className += 'collapsible';
        divHistoryPanel.appendChild(btn);

        //add click listener to expand
        btn.addEventListener('click', (e) => {
            (e.currentTarget as any).classList.toggle("active");
            var content = (e.currentTarget as any).nextElementSibling;
            if ((content as any).style.display === "block") {
              (content as any).style.display = "none";
            } else {
              (content as any).style.display = "block";
            }
          });
    
        //create div for list of URIs
        const divUris = document.createElement('div');
        divUris.className += 'collapsed-content';
        divHistoryPanel.appendChild(divUris);

        for (let j=0; j< historyUris.length; j++) {
            if (historyDomains[i].domain == historyUris[j].domain) {
                //create URI button
                let btnUri = document.createElement('button');
                btnUri.textContent = historyUris[j].uri;
                btnUri.className += 'collapsible';
                divUris.appendChild(btnUri);

                //click listener
                btnUri.addEventListener('click', (e) => {
                    (e.currentTarget as any).classList.toggle("active");
                    var content = (e.currentTarget as any).nextElementSibling;
                    if ((content as any).style.display === "block") {
                      (content as any).style.display = "none";
                    } else {
                      (content as any).style.display = "block";
                    }
                  });

                //create div for page text
                const divPageText = document.createElement('div');
                divPageText.className += 'collapsed-content';
                divPageText.textContent = historyUris[j].innerText;
                divUris.appendChild(divPageText);

            }
        }
    }

    //all days
    h2 = document.createElement("h2");
    textNode = document.createTextNode('Show other day');
    h2.appendChild(textNode);
    divHistoryPanel.append(h2);

    hr = document.createElement("hr");
    divHistoryPanel.append(hr);

    for (let i=0; i< historyDates.length; i++) {

        //create Day button
        let btn = document.createElement('button');
        btn.textContent = historyDates[i].visitedDate;
        btn.className += 'collapsible';
        divHistoryPanel.appendChild(btn);

        //add click listener 
        btn.addEventListener('click', (e) => {
            (windowRight as any).electronAPI.getAllDomains(btn.textContent);
        });
    }

});

(windowRight as any).electronAPI.onClearHistoryPanel( () => {
    const divHistoryPanel = document.getElementById('divHistoryPanel');
    divHistoryPanel.innerHTML = "";
});

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
