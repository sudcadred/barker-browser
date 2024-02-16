import { app } from "electron";
import { BarkerStatusBar } from "./main_statusbar";
import { WriteStream } from "original-fs";
const fs = require("fs");
const path = require("path");

/* This class handles browser windows operations 
   like BrowserView creation, setting its bounds, loadURL
   core method is showBrowsers() which shows all browser windows in application
*/

export class BarkerLogger {

//static properties
static LogLevel = {
    Verbose: 1,
    Debug: 2,
    Info: 3,
    Error: 4,
}
static currentLogLevel = BarkerLogger.LogLevel.Debug;   //change to Error later
static folderPath = path.join(app.getPath("userData"), 'barker-browser/');
static fileNamePath = path.join(BarkerLogger.folderPath, 'barker-browser.log');
static logFileStream: WriteStream;

//ctor    
constructor () {
    BarkerLogger.logFileStream = fs.createWriteStream(BarkerLogger.fileNamePath, {flags:'a'});
}

static setLogLevel(logLevel: number) {
    BarkerLogger.currentLogLevel = logLevel;    
}

static writeEntryToLogFile(loggedText: string) {
    if (BarkerLogger.logFileStream) {
        BarkerLogger.logFileStream.write(loggedText + '\n');
    }
}

static log(fileLine:string, msg: string, logLevel = BarkerLogger.LogLevel.Debug) {
    if (logLevel >= BarkerLogger.currentLogLevel) {
        var timeStamp = new Date(Date.now()).toISOString();
        var matches = fileLine.split("\\");
        var match = matches[matches.length - 1];
        if (match) {
            BarkerLogger.writeEntryToLogFile(timeStamp + " " + match.slice(0, -1) + " " + msg);
        } else {
            BarkerLogger.writeEntryToLogFile(timeStamp + " " + fileLine + " " + msg);
        }
    }
}

}
