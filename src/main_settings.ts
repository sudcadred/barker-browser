import { app } from "electron";
import { BarkerUtils } from "./main_utils";
import { BarkerData } from "./main_data";
const path = require('node:path')
const ElectronPreferences = require('electron-preferences');

/* This class contains all possible settings needed to run the application
   Some settings are configurable via preferences and stored in file preferences.json
   other settings can be changed only in the code below
*/

export class BarkerSettings {

/*
static createPreferences(mainWindow: Electron.BrowserWindow, store: Object)
static showPreferences()
static setAppAccordingToSavedPreferences()
static getMaxBrowserViewsPerTab()
static getUserAgent()
static getFirstLayout()
static getSidebarLayout()
static getMaxStatusBarTextLength()
static getBrowserHeaderHeight()
static getShowBrowserHeaders()
static toggleShowBrowserHeaders()
static getDefautLayoutNo()
static setDefautLayoutNo(layoutNo: number)
*/

//properties configurable via user interface
static maxBrowserViewsPerTab = 25;
static userAgent: string;

//properties configurable only in the code below
static appTitle = 'Barker Browser (month1 build)';
static browserHeaderHeight = 80;
static maxStatusBarTextLength = 200;
static defaultLayout = 1;

//other properties
static showBrowserHeaders = true;       //runtime checkbox
static preferences: typeof ElectronPreferences = null;
static mainWindow: Electron.BrowserWindow = null;
static store: Object = null;

static createPreferences(mainWindow: Electron.BrowserWindow, store: Object) {
    BarkerSettings.mainWindow = mainWindow;
    BarkerSettings.store = store;
    BarkerSettings.preferences = new ElectronPreferences({
        config: {
            debounce: 150, // debounce preference save settings event; 0 to disable
            parent: mainWindow
        },
        css: 'preference-styles.css',
        dataStore: path.join(app.getPath("userData"), 'barker_browser_preferences.json'),
        defaults: { 
            mainSection: { appTitle: BarkerSettings.appTitle,
                           maxBrowsersPerTab: '25' ,
                           userAgent: 'Barker Browser'
            },
            layoutSection: { layout: [ 'layout1', 'layout2', 'layout4', 'layout9' ]},
            shortcutsSection: { shortcutTabsFirstPart: 'keyboardTabsPrefixCtrl', shortcutTabsSecondPart: 'keyboardTabsPostfixNumbers',
                                shortcutLayoutFirstPart: 'keyboardLayoutPrefixCtrl', shortcutLayoutSecondPart: 'keyboardLayoutPostFixFkeys'},
            headerSection: {headerButtons: ['btnBack', 'btnForward', 'btnRefresh', 'btnClear'] },
         },

        sections: [
            {   
                id: 'mainSection',
                label: 'Main settings',
                icon: 'spaceship',
                form: {
                    groups: [
                        {
                            fields: [
                                {
                                    label: 'App Title',
                                    key: 'appTitle',
                                    type: 'text'
                                },
                            ]
                        },
                        {
                            fields: [
                                {
                                    label: 'Maximum windows per tab (can affect performance if changed) - app has to be restarted to take it into effect',
                                    key: 'maxBrowsersPerTab',
                                    type: 'text'
                                },
                            ]
                        },
                        {
                            fields: [
                                {
                                    label: 'User agent',
                                    key: 'userAgent',
                                    type: 'text'
                                },
                            ]
                        },
                    ]   //groups
                }
            },  //section1 end
            {   //section2
                id: 'layoutSection',
                label: 'Layouts',
                icon: 'grid-45',
                form: {
                    groups: [
                        {
                            //label: 'Displayed layout buttons',
                            fields: [
                                {
                                    label: 'Displayed layout buttons',
                                    key: 'layout',
                                    type: 'checkbox',
                                    options: [
                                      { label: '1', value: 'layout1' },
                                      { label: '2', value: 'layout2' },
                                      { label: '4', value: 'layout4' },
                                      { label: '9', value: 'layout9' },
                                      { label: '16', value: 'layout16' },
                                      { label: '25', value: 'layout25' },
                                      { label: '36', value: 'layout36' },
                                      { label: '49', value: 'layout49' },
                                    ],
                                },
                            ]
                        },
                    ]
                }
            },  //section2 end
            {   //section3
                id: 'shortcutsSection',
                label: 'Keyboard shortcuts',
                icon: 'skull-2',
                form: {
                    groups: [
                        {
                            label: 'Access individual tabs',
                            fields: [
                                {
                                    label: 'First part',
                                    key: 'shortcutTabsFirstPart',
                                    type: 'dropdown',
                                    options: [
                                      { label: 'ctrl', value: 'keyboardTabsPrefixCtrl' },
                                      { label: 'alt', value: 'keyboardTabsPrefixAlt' },
                                      { label: 'shift', value: 'keyboardTabsPrefixShift' },
                                    ],
                                },
                            ]
                        },
                        {
                            fields: [
                                {
                                    label: 'Second part',
                                    key: 'shortcutTabsSecondPart',
                                    type: 'dropdown',
                                    options: [
                                      { label: 'numbers', value: 'keyboardTabsPostfixNumbers' },
                                      { label: 'function keys', value: 'keyboardTabsPostFixFkeys' },
                                    ],
                                },
                            ]
                        },
                        {
                            label: 'Switch layouts',
                            fields: [
                                {
                                    label: 'First part',
                                    key: 'shortcutLayoutFirstPart',
                                    type: 'dropdown',
                                    options: [
                                      { label: 'ctrl', value: 'keyboardLayoutPrefixCtrl' },
                                      { label: 'alt', value: 'keyboardLayoutPrefixAlt' },
                                      { label: 'shift', value: 'keyboardLayoutPrefixShift' },
                                    ],
                                },
                            ]
                        },
                        {
                            fields: [
                                {
                                    label: 'Second part',
                                    key: 'shortcutLayoutSecondPart',
                                    type: 'dropdown',
                                    options: [
                                      { label: 'numbers', value: 'keyboardLayoutPostfixNumbers' },
                                      { label: 'function keys', value: 'keyboardLayoutPostFixFkeys' },
                                    ],
                                },
                            ]
                        },
                    ]   //groups
                }
            },  //section3 end
            {   //section4
                id: 'headerSection',
                label: 'Browser window header',
                icon: 'notes',
                form: {
                    groups: [
                        {
                            fields: [
                                {
                                    label: 'Displayed buttons in browser header',
                                    key: 'headerButtons',
                                    type: 'checkbox',
                                    options: [
                                      { label: 'Back', value: 'btnBack' },
                                      { label: 'Forward', value: 'btnForward' },
                                      { label: 'Refresh', value: 'btnRefresh' },
                                      { label: 'Clear page', value: 'btnClear' },
                                    ],
                                },
                            ]
                        },
                    ]   //groups
                }
            },  //section4 end
        ]
    });    

    // Subscribing to preference changes.
    BarkerSettings.preferences.on('save', (_preferences: typeof ElectronPreferences) => {
        console.log(`Preferences were saved.`, JSON.stringify(_preferences, null, 4));
        BarkerSettings.setAppAccordingToSavedPreferences();
        BarkerSettings.mainWindow.webContents.send('set-layout-buttons', BarkerData.getLayoutString());
        BarkerSettings.mainWindow.webContents.send('set-browser-header-buttons', BarkerData.getBrowserHeaderString());
    });
}

static showPreferences() {
    BarkerSettings.preferences.show();
}

static setAppAccordingToSavedPreferences() {
    //app title
    let appTitle = BarkerSettings.preferences.value('mainSection.appTitle');
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "setAppAccordingToSavedPreferences(): appTitle=" + appTitle);
    if (appTitle == '') appTitle = BarkerSettings.appTitle;
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "setAppAccordingToSavedPreferences(): appTitle=" + appTitle);
    BarkerSettings.mainWindow.setTitle(appTitle);

    //max number of windows per tab
    const maxWindows = Number(BarkerSettings.preferences.value('mainSection.maxBrowsersPerTab'));
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "setAppAccordingToSavedPreferences(): maxWindows=" + maxWindows);
    if (maxWindows > 0) BarkerSettings.maxBrowserViewsPerTab = maxWindows;
    
    //user agent
    const userAgent = BarkerSettings.preferences.value('mainSection.userAgent');
    if (userAgent != '') BarkerSettings.userAgent = userAgent;

    //layout buttons
    const layout = BarkerSettings.preferences.value('layoutSection.layout');
    let layout1 = false; let layout2 = false; let layout4 = false; let layout9 = false; let layout16 = false; let layout25 = false; let layout36 = false; let layout49 = false;
    layout.forEach((value: string) => {
        if (value == 'layout1') layout1 = true;
        else if (value == 'layout2') layout2 = true;
        else if (value == 'layout4') layout4 = true;
        else if (value == 'layout9') layout9 = true;
        else if (value == 'layout16') layout16 = true;
        else if (value == 'layout25') layout25 = true;
        else if (value == 'layout36') layout36 = true;
        else if (value == 'layout49') layout49 = true;
    });
    //compose string to send it later to renderer process
    let layoutString = '';
    if (layout1) layoutString += '1,'; else layoutString += '0,';
    if (layout2) layoutString += '1,'; else layoutString += '0,';
    if (layout4) layoutString += '1,'; else layoutString += '0,';
    if (layout9) layoutString += '1,'; else layoutString += '0,';
    if (layout16) layoutString += '1,'; else layoutString += '0,';
    if (layout25) layoutString += '1,'; else layoutString += '0,';
    if (layout36) layoutString += '1,'; else layoutString += '0,';
    if (layout49) layoutString += '1'; else layoutString += '0';
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "setAppAccordingToSavedPreferences(): _layoutString="+layoutString);
    BarkerData.setLayoutString(layoutString);

    //browser header settings
    const browserHeaderButtons = BarkerSettings.preferences.value('headerSection.headerButtons');
    let btnBack = false; let btnForward = false; let btnRefresh = false; let btnClear = false;
    browserHeaderButtons.forEach((value: string) => {
        if (value == 'btnBack') btnBack = true;
        else if (value == 'btnForward') btnForward = true;
        else if (value == 'btnRefresh') btnRefresh = true;
        else if (value == 'btnClear') btnClear = true;
    });
    //compose string to send it later to renderer process
    let browserHeaderButtonsString = '';
    if (btnBack) browserHeaderButtonsString += '1,'; else browserHeaderButtonsString += '0,';
    if (btnForward) browserHeaderButtonsString += '1,'; else browserHeaderButtonsString += '0,';
    if (btnRefresh) browserHeaderButtonsString += '1,'; else browserHeaderButtonsString += '0,';
    if (btnClear) browserHeaderButtonsString += '1'; else browserHeaderButtonsString += '0';
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "setAppAccordingToSavedPreferences(): _browserHeaderButtonsString="+browserHeaderButtonsString);
    BarkerData.setBrowserHeaderString(browserHeaderButtonsString);
}

//getters
static getMaxBrowserViewsPerTab() { return BarkerSettings.maxBrowserViewsPerTab;}
static getUserAgent() { return BarkerSettings.userAgent;}
static getFirstLayout() {return (BarkerSettings.store as any).get('tabs.1.layout');}
static getSidebarLayout() { return (BarkerSettings.store as any).get('sidebar.layout');}
static getMaxStatusBarTextLength() {return BarkerSettings.maxStatusBarTextLength;}
static getBrowserHeaderHeight() {return BarkerSettings.browserHeaderHeight;}
static getShowBrowserHeaders() {return BarkerSettings.showBrowserHeaders;}
static toggleShowBrowserHeaders() {BarkerSettings.showBrowserHeaders = !BarkerSettings.showBrowserHeaders;}
static getDefautLayoutNo() {return BarkerSettings.defaultLayout;}
static setDefautLayoutNo(layoutNo: number) {BarkerSettings.defaultLayout = layoutNo;}


}