
/* This class provides various small methods called by other classes
   (logging to console, conversion between different formats, string adaptations etc)
*/

export class BarkerUtils {

/*
static log(fileLine:string, msg: string)
static getLastNumber(s: string)
static formatBytes(bytes: number, decimals = 2)
static removeLastSubString(s: string, delimiter: string): string
static sleep(ms: number)
static shiftKeyToNumber(shiftNo: string): number
static functionKeyToNumber(fkey: string): number
static getLayout(pos: number): number
getNameFromUrl(uri: string): string
*/

static log(fileLine:string, msg: string) {
    var timeStamp = new Date(Date.now()).toISOString();
    var matches = fileLine.split("\\");
    var match = matches[matches.length - 1];         //match('([^\/]+$)');
    if (match) {
        console.log(timeStamp + " " + match.slice(0, -1) + " " + msg);
    } else {
        console.log(timeStamp + " " + fileLine + " " + msg);
    }
}

static getLastNumber(s: string) {
    //all of these special characters in regex should be escaped: \ ^ $ * + ? . ( ) | { } [ ]
    var matches = s.match(/\d+$/);
    var lastNumber = -1;
    if (matches) lastNumber = parseInt(matches[0], 10);
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "getLastNumber(): s="+s+", lastNumber="+lastNumber);
    return lastNumber;
}

static formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

//remove last string after delimiter character
static removeLastSubString(s: string, delimiter: string): string {
    //return str.replace(/,[^,]*$/ , '');
    return s.substr(0, s.lastIndexOf(delimiter));
}

static sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

static shiftKeyToNumber(shiftNo: string): number {
    let result = 0;
    if (shiftNo === '!') result = 1;
    else if (shiftNo === '@') result = 2;
    else if (shiftNo === '#') result = 3;
    else if (shiftNo === '$') result = 4;
    else if (shiftNo === '%') result = 5;
    else if (shiftNo === '^') result = 6;
    else if (shiftNo === '&') result = 7;
    else if (shiftNo === '*') result = 8;
    else if (shiftNo === '(') result = 9;
    return result;
}

static functionKeyToNumber(fkey: string): number {
    let result = 0;
    if (fkey === 'F1') result = 1;
    else if (fkey === 'F2') result = 2;
    else if (fkey === 'F3') result = 3;
    else if (fkey === 'F4') result = 4;
    else if (fkey === 'F5') result = 5;
    else if (fkey === 'F6') result = 6;
    else if (fkey === 'F7') result = 7;
    else if (fkey === 'F8') result = 8;
    else if (fkey === 'F9') result = 9;
    else if (fkey === 'F10') result = 10;
    else if (fkey === 'F11') result = 11;
    else if (fkey === 'F12') result = 12;
    return result;
}

static getLayout(pos: number): number {
    if (pos == 1) return 1; else
    if (pos == 2) return 2; else
    if (pos == 3) return 4; else
    if (pos == 4) return 9; else
    if (pos == 5) return 16; else
    if (pos == 6) return 25; else
    if (pos == 7) return 36; else
    if (pos == 8) return 49;
}

static getNameFromUrl(uri: string): string {
    const parts = uri.split('/')
    var lastPart = parts[parts.length-1];
    if (lastPart) {
        lastPart = lastPart.replace(/-/g, ' ');        //replace dashes by space
        return lastPart;
    } else {
        return uri;
    }
}


}