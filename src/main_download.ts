import { BrowserWindow, dialog } from "electron";
import { BarkerUtils } from "./main_utils";
import { BarkerStatusBar } from "./main_statusbar";
import { BarkerData } from "./main_data";
import { BarkerSettings } from "./main_settings";
import fs from "fs";

/* This class provides methods for file downloads
*/

export class BarkerDownload {

/*
constructor (mainWindow: Electron.BrowserWindow)
static async download(sourceUrl: string, targetFile: string, progressCallback: Function)
static async streamWithProgress(length: number, reader: ReadableStreamDefaultReader<Uint8Array>, writer: fs.WriteStream, progressCallback: Function)
static downloadFile(url: string)
static addToDownloadedItems(s: string)
static addToDownloadFailedItems(s: string)
static updateDownloadProgress()
static createDownloadEventCatcher()
*/

static mainWindow: Electron.BrowserWindow = null;

//ctor    
constructor (mainWindow: Electron.BrowserWindow) {
    BarkerDownload.mainWindow = mainWindow;
}

static async download(sourceUrl: string, targetFile: string, progressCallback: Function) {

    const request = new Request(sourceUrl, {
    headers: new Headers({ "Content-Type": "application/octet-stream" }),
    });

    const response = await fetch(request);
    if (!response.ok) {
    throw Error(
      `Unable to download, server returned ${response.status} ${response.statusText}`
    );
    }

    const body = response.body;
    if (body == null) {
    throw Error("No response body");
    }

    const finalLength = parseInt(response.headers.get("Content-Length" || "0"), 10);
    const reader = body.getReader();
    const writer = fs.createWriteStream(targetFile);

    await BarkerDownload.streamWithProgress(finalLength, reader, writer, progressCallback);
    writer.end();
}

static async streamWithProgress(length: number, reader: ReadableStreamDefaultReader<Uint8Array>, writer: fs.WriteStream, progressCallback: Function) {
  let bytesDone = 0;

  while (true) {
    const result = await reader.read();
    if (result.done) {
      if (progressCallback != null) {
        progressCallback(length, 100);
      }
      return;
    }

    const chunk = result.value;
    if (chunk == null) {
      throw Error("Empty chunk received during download");
    } else {
      writer.write(Buffer.from(chunk));
      if (progressCallback != null) {
        bytesDone += chunk.byteLength;
        const percent =
          length === 0 ? null : Math.floor((bytesDone / length) * 100);
        progressCallback(bytesDone, percent);
      }
    }
  }
}

static downloadFile(url: string) {
    var filenameFromUrl = url.substring(url.lastIndexOf('/')+1);
    dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
        title: 'Download to File…',
        defaultPath: filenameFromUrl, 
        filters: [
        { name: 'All Files', extensions: ['*'] }
        ]
    }).then(result => {
        console.log(result);
        if (!result.canceled) {
            BarkerDownload.download( url, result.filePath, (bytes: number, percent: number) => {
                    BarkerStatusBar.updateStatusBarText(result.filePath + ': ' + BarkerUtils.formatBytes(bytes));
                }).then( () => {
                    BarkerStatusBar.updateStatusBarText(result.filePath + ' download finished');
                });
        } else {
            BarkerStatusBar.updateStatusBarText(result.filePath + ' download canceled');
        }
    });
}

static addToDownloadedItems(s: string) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "addToDownloadedItems()");
    if (BarkerData.getDownloadedItemsString() == '') {
        BarkerData.setDownloadedItemsString(s);
    } else {
        BarkerData.setDownloadedItemsString(BarkerData.getDownloadedItemsString() + ', ' + s);
    }
}

static addToDownloadFailedItems(s: string) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "addToDownloadFailedItems()");
    if (BarkerData.getDownloadFailedItemsString() == '') {
        BarkerData.setDownloadFailedItemsString(s);
    } else {
        BarkerData.setDownloadFailedItemsString(BarkerData.getDownloadFailedItemsString() + ', ' + s);
    }
}

static updateDownloadProgress() {
    //BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "updateDownloadProgress()");
    var result = '';
    
    BarkerData.getDownloadProgressMap().forEach((value,key) => {
        if (result == '') result = key + ': ' + BarkerUtils.formatBytes(value) + ' downloaded so far...';
        else result += ', ' + key + ': ' + BarkerUtils.formatBytes(value) + ' downloaded so far...';
    });
    
    if (result.length + BarkerData.getDownloadFailedItemsString().length + BarkerData.getDownloadFailedItemsString().length < BarkerSettings.getMaxStatusBarTextLength()) {
        if (BarkerData.getDownloadFailedItemsString()) result += ' Downloaded files: ' + BarkerData.getDownloadFailedItemsString() + '. ';
        if (BarkerData.getDownloadFailedItemsString()) result += ' Download failed files: ' + BarkerData.getDownloadFailedItemsString() + '. ';
    } else if (result.length + BarkerData.getDownloadFailedItemsString().length < BarkerSettings.getMaxStatusBarTextLength()) {
        BarkerData.setDownloadFailedItemsString('');
        if (BarkerData.getDownloadFailedItemsString()) result += ' Downloaded files: ' + BarkerData.getDownloadFailedItemsString() + '. ';
    } else if (result.length < BarkerSettings.getMaxStatusBarTextLength()) {
        BarkerData.setDownloadedItemsString('');
        BarkerData.setDownloadFailedItemsString('');
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "updateDownloadProgress(): result="+result);
        result = BarkerUtils.removeLastSubString(result, ',');
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "updateDownloadProgress(): result="+result);
    }
    BarkerStatusBar.updateStatusBarText(result);
}

//since DownloadItem is an EventEmitter on class-level (not instance event),
//1 browserview catcher is enough to catch download events from all browserviews
static createDownloadEventCatcher() {
    //statusbar download progress
    const firstBrowserViewNo = BarkerData.getTabFirstBrowserViewNo('NewTab1');
    let browserViews = BarkerDownload.mainWindow.getBrowserViews();
    let browser = browserViews[0];
    if (browser) {
        var session = browser.webContents.session;
        session.on('will-download', (event, item, webContents) => {

            var fileName = item.getFilename()
            var url = item.getURL()

            //item.setSavePath(store.get('myFolder') + '/' + fileName)
            item.on('updated', (event, state) => {
                if (state === 'interrupted') {
                console.log('Download is interrupted but can be resumed')
                } else if (state === 'progressing') {
                    if (item.isPaused()) {
                        console.log('Download is paused')
                    } else {
                        const bytes = item.getReceivedBytes();
                        BarkerData.setDownloadProgressMap(fileName, bytes);
                        BarkerDownload.updateDownloadProgress();
                    }
                }
            })
            item.once('done', (event, state) => {
                BarkerData.getDownloadProgressMap().delete(fileName);
                if (state === 'completed') {
                    BarkerDownload.addToDownloadedItems(fileName);
                    BarkerDownload.updateDownloadProgress();
                } else {
                    BarkerDownload.addToDownloadFailedItems(fileName+' ${state}');
                    BarkerDownload.updateDownloadProgress();
                }
            });
        });
    } else {
        BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "createDownloadEventCatcher() ERROR browser undefined! firstBrowserViewNo="+firstBrowserViewNo+", browserViews.length="+browserViews.length);
    }
}

}