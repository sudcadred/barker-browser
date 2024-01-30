import { Menu, MenuItem  } from "electron";
import { BarkerUtils } from './main_utils';
import { BarkerData } from "./main_data";
import { BarkerSettings } from "./main_settings";
import { BarkerBrowser } from "./main_browser";

/* This class creates main menu
*/

//wrapper methods for menu items (I have not found other way to call cmethods from dynamic menu template )
function _showPreferences() {
    BarkerSettings.showPreferences();
}

function _openBookmark(uri: string) {
    BarkerBrowser.openLinkInFirstEmptyWindow(uri);
}

export class BarkerMenu {

static menu: Menu = null;

//template is dynamicaly created, here only first part is set but later bookmarks are added
static templateFirstPart = '[{label: \'File\',submenu: [{label: \'Preferences\',accelerator: \'CmdOrCtrl+P\', click: () => {_showPreferences();}}]},';

static createMainMenu() {
    let category: string;

    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createMainMenu()");
    var template = BarkerMenu.templateFirstPart;
    for (let i=0; i< BarkerData.bookmarkTopics.length; i++) {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createMainMenu(): bookmarkTopic="+BarkerData.bookmarkTopics[i]);
        template += '{label: \''+BarkerData.bookmarkTopics[i]+'\',';
        template += 'submenu: [';
        for (let j=0; j< BarkerData.bookmarks.length; j++) {
            const bookmarkItem = BarkerData.bookmarks[j]; 
            category = bookmarkItem['category'];
            BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createMainMenu(): bookmarkItem="+String(bookmarkItem)+", category="+category+", BarkerData.bookmarkTopics[i]="+BarkerData.bookmarkTopics[i]+", i="+i);
            if (category == BarkerData.bookmarkTopics[i]) {
                template += '{label: \''+bookmarkItem['name']+'\',';
                template += 'click: () => {_openBookmark(\''+ bookmarkItem['uri'] +'\')}},';
            }
        }
        template += ']';    //end submenu
        template += '}';    //end item
    }
    template += ']';
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createMainMenu(): template="+template);
    const templateObj = eval(template);
    BarkerMenu.menu = Menu.buildFromTemplate(templateObj);
    Menu.setApplicationMenu(BarkerMenu.menu);
}

}
