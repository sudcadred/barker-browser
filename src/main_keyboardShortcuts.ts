import { BrowserWindow, BrowserView  } from "electron";
import { BarkerUtils } from './main_utils';
import { BarkerSettings } from "./main_settings";
import { BarkerData } from "./main_data";
import { BarkerBrowser } from "./main_browser";

/* This class handles keyboard shortcuts to activate fast tab-switching or layout-switching
*/

export class BarkerKeyboardShortcuts {

/*
constructor(mainWindow: Electron.BrowserWindow)
static showTab(tabNo: number)
static showTabIfNumberPressed(input: Object)
static showTabIfShiftNumberPressed(input: Object)
static showTabIfFkeyPressed(input: Object)
static evaluateKeyboardShortcutsForSwitchTab(input: Object)
static changeLayout(pressedNo: number)
static changeLayoutIfNumberPressed(input: Object)
static changeLayoutIfFkeyPressed(input: Object)
static changeLayoutIfShiftNumberPressed(input: Object)
static evaluateKeyboardShortcutsForSwitchLayout(input: Object)
*/

static mainWindow: Electron.BrowserWindow = null;

constructor(mainWindow: Electron.BrowserWindow) {
    BarkerKeyboardShortcuts.mainWindow = mainWindow;
}

static showTab(tabNo: number) {
    if (BarkerData.getOrderedTabIdName(tabNo-1)) {
        BarkerKeyboardShortcuts.mainWindow.webContents.send('switch-tab', BarkerData.getOrderedTabIdName(tabNo-1));
    } else {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showTab() tab not found: tabNo="+tabNo+", _orderedTabIds[tabNo-1]="+BarkerData.getOrderedTabIdName(tabNo-1));
    }
}

static showTabIfNumberPressed(input: Object) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showTabIfNumberPressed()");
    const inputKey = Number((input as any).key.toLowerCase());
    if ((inputKey>=1)&&(inputKey<=9)) {
        BarkerKeyboardShortcuts.showTab(inputKey); 
    }
}

static showTabIfShiftNumberPressed(input: Object) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showTabIfNumberPressed()");
    const inputKey = (input as any).key;
    const tabNo = BarkerUtils.shiftKeyToNumber(inputKey);
    if ((tabNo>=1)&&(tabNo<=9)) { 
        BarkerKeyboardShortcuts.showTab(tabNo);
    }
}

static showTabIfFkeyPressed(input: Object) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "showTabIfFkeyPressed()");
    const inputKey = (input as any).key;
    const tabNo = BarkerUtils.functionKeyToNumber(inputKey);
    if ((tabNo>=1)&&(tabNo<=9)) { 
        BarkerKeyboardShortcuts.showTab(tabNo);
    }
}

static evaluateKeyboardShortcutsForSwitchTab(input: Object) {
    const shortcutTabsFirstPart = BarkerSettings.preferences.value('shortcutsSection.shortcutTabsFirstPart');
    const shortcutTabsSecondPart = BarkerSettings.preferences.value('shortcutsSection.shortcutTabsSecondPart');

    if (shortcutTabsFirstPart == 'keyboardTabsPrefixCtrl') {
        if ((input as any).control) {
            if (shortcutTabsSecondPart == 'keyboardTabsPostfixNumbers') { BarkerKeyboardShortcuts.showTabIfNumberPressed(input); }     //ctrl+1..9
            else if (shortcutTabsSecondPart == 'keyboardTabsPostFixFkeys') { BarkerKeyboardShortcuts.showTabIfFkeyPressed(input); }  //ctrl+F1..F9
        }
    } else if (shortcutTabsFirstPart == 'keyboardTabsPrefixShift') {
        if ((input as any).shift) {
            if (shortcutTabsSecondPart == 'keyboardTabsPostfixNumbers') { BarkerKeyboardShortcuts.showTabIfShiftNumberPressed(input); }     //shift+1..9
            else if (shortcutTabsSecondPart == 'keyboardTabsPostFixFkeys') { BarkerKeyboardShortcuts.showTabIfFkeyPressed(input); }  //shift+F1..F9
        }
    } else if (shortcutTabsFirstPart == 'keyboardTabsPrefixAlt') {
        if ((input as any).alt) {
            if (shortcutTabsSecondPart == 'keyboardTabsPostfixNumbers') { BarkerKeyboardShortcuts.showTabIfNumberPressed(input); }     //alt+1..9
            else if (shortcutTabsSecondPart == 'keyboardTabsPostFixFkeys') { BarkerKeyboardShortcuts.showTabIfFkeyPressed(input); }  //alt+F1..F9
        }
    }
}

static changeLayout(pressedNo: number) {
    const layoutButtons = BarkerData.getLayoutString().split(',');
    let layoutPos = 1;
    let activeLayouts = [];
    for (let i=0; i< layoutButtons.length; i++) {
        if (layoutButtons[i] == '1') {
            activeLayouts.push(BarkerUtils.getLayout(i+1));
            layoutPos++;
        }
    }
    if (pressedNo <= activeLayouts.length) {
        const pressedLayout = activeLayouts[pressedNo-1];
        const actualTabIdNo = BarkerData.getActualTabIdNo();
        BarkerData.setTabLayoutNo(actualTabIdNo, pressedLayout);
        BarkerBrowser.showBrowsers(pressedLayout, actualTabIdNo, BarkerData.getTabBrowserOffset(actualTabIdNo));
        BarkerKeyboardShortcuts.mainWindow.webContents.send('set-layout', pressedLayout);
    }
}

static changeLayoutIfNumberPressed(input: Object) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "changeLayoutIfNumberPressed()");
    const inputKey = Number((input as any).key.toLowerCase());
    BarkerKeyboardShortcuts.changeLayout(inputKey);
}

static changeLayoutIfFkeyPressed(input: Object) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "changeLayoutIfFkeyPressed()");
    const inputKey = (input as any).key;
    const pressedKey = BarkerUtils.functionKeyToNumber(inputKey);
    if ((pressedKey>=1)&&(pressedKey<=9)) { 
        BarkerKeyboardShortcuts.changeLayout(pressedKey);
    }
}

static changeLayoutIfShiftNumberPressed(input: Object) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "changeLayoutIfShiftNumberPressed()");
    const inputKey = (input as any).key;
    const pressedKey = BarkerUtils.shiftKeyToNumber(inputKey);
    if ((pressedKey>=1)&&(pressedKey<=9)) { 
        BarkerKeyboardShortcuts.changeLayout(pressedKey);
    }
}

static evaluateKeyboardShortcutsForSwitchLayout(input: Object) {
    const shortcutFirstPart = BarkerSettings.preferences.value('shortcutsSection.shortcutLayoutFirstPart');
    const shortcutSecondPart = BarkerSettings.preferences.value('shortcutsSection.shortcutLayoutSecondPart');

    if (shortcutFirstPart == 'keyboardLayoutPrefixCtrl') {
        if ((input as any).control) {
            if (shortcutSecondPart == 'keyboardLayoutPostfixNumbers') { BarkerKeyboardShortcuts.changeLayoutIfNumberPressed(input); }     //ctrl+1..9
            else if (shortcutSecondPart == 'keyboardLayoutPostFixFkeys') { BarkerKeyboardShortcuts.changeLayoutIfFkeyPressed(input); }  //ctrl+F1..F9
        }
    } else if (shortcutFirstPart == 'keyboardLayoutPrefixShift') {
        if ((input as any).shift) {
            if (shortcutSecondPart == 'keyboardLayoutPostfixNumbers') { BarkerKeyboardShortcuts.changeLayoutIfShiftNumberPressed(input); }     //shift+1..9
            else if (shortcutSecondPart == 'keyboardLayoutPostFixFkeys') { BarkerKeyboardShortcuts.changeLayoutIfFkeyPressed(input); }  //shift+F1..F9
        }
    } else if (shortcutFirstPart == 'keyboardLayoutPrefixAlt') {
        if ((input as any).alt) {
            if (shortcutSecondPart == 'keyboardLayoutPostfixNumbers') { BarkerKeyboardShortcuts.changeLayoutIfNumberPressed(input); }     //alt+1..9
            else if (shortcutSecondPart == 'keyboardLayoutPostFixFkeys') { BarkerKeyboardShortcuts.changeLayoutIfFkeyPressed(input); }  //alt+F1..F9
        }
    }
}


}
