import { app } from "electron";
import { BarkerUtils } from "./main_utils";
import { BarkerBrowser } from "./main_browser";
const Database = require("better-sqlite3");
const path = require('node:path')
const dbPath = path.join(app.getPath("userData"), 'barker_browser.db');

export class BarkerDb {

    static db: typeof Database = null;

//ctor    
constructor () {
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    BarkerDb.db = db;
}

static readAllHistory = () => {
    try {
        const query = `SELECT * FROM history`
        const readQuery = BarkerDb.db.prepare(query)
        const rowList = readQuery.all()
        return rowList
    } catch (err) {
        console.error(err)
        throw err
    }
}

static addHistoryEntry = (uri: string, innerText: string) => {
    try {
        const domain = BarkerUtils.getDomain(uri);
        let insertQuery = BarkerDb.db.prepare(
            `INSERT OR IGNORE INTO history (domain, uri, innerText) VALUES ('${domain}', '${uri}', '${innerText}');`
        );
        let transaction = BarkerDb.db.transaction(() => {
            const info = insertQuery.run();
            console.log(`Inserted ${info.changes} rows with last ID ${info.lastInsertRowid} into history`);
        });
        transaction();

        insertQuery = BarkerDb.db.prepare(
            `UPDATE history SET timestamp = CURRENT_TIMESTAMP WHERE uri='${uri}';`
        )
        transaction = BarkerDb.db.transaction(() => {
            const info = insertQuery.run();
           // console.log(`Inserted ${info.changes} rows with last ID ${info.lastInsertRowid} into history`);
        });
        transaction();
    } catch (err) {
        console.error(err)
        throw err
    }
}

static readHistoryAllDates = () => {
    try {
        const query = `select distinct visitedDate from history`
        const readQuery = BarkerDb.db.prepare(query)
        const rowList = readQuery.all()
        return rowList
    } catch (err) {
        console.error(err)
        throw err
    }
}

static readHistoryDomainsForSpecificDate = (date: string) => {
    try {
        const query = `SELECT DISTINCT domain FROM history WHERE visitedDate='${date}'`
        const readQuery = BarkerDb.db.prepare(query)
        const rowList = readQuery.all()
        return rowList
    } catch (err) {
        console.error(err)
        throw err
    }
}

static readHistoryDomainsForToday = () => {
    try {
        const query = `SELECT DISTINCT domain FROM history WHERE visitedDate=DATE(CURRENT_TIMESTAMP)`
        const readQuery = BarkerDb.db.prepare(query)
        const rowList = readQuery.all()
        return rowList
    } catch (err) {
        console.error(err)
        throw err
    }
}

static readHistoryUrisForToday = () => {
    try {
        const query = `SELECT domain, uri, innerText FROM history WHERE visitedDate=DATE(CURRENT_TIMESTAMP)`
        const readQuery = BarkerDb.db.prepare(query)
        const rowList = readQuery.all()
        return rowList
    } catch (err) {
        console.error(err)
        throw err
    }
}

static readHistoryUrisForSpecificDate = (date: string) => {
    try {
        const query = `SELECT domain, uri, innerText FROM history WHERE visitedDate='${date}'`
        const readQuery = BarkerDb.db.prepare(query)
        const rowList = readQuery.all()
        return rowList
    } catch (err) {
        console.error(err)
        throw err
    }
}

static getAllDomains(date: string) {
    if (date) {
        const datesList = BarkerDb.readHistoryAllDates();
        const domainsList = BarkerDb.readHistoryDomainsForSpecificDate(date);
        const uriList = BarkerDb.readHistoryUrisForSpecificDate(date);
        BarkerBrowser.mainWindow.webContents.send('history-domains-list-set', date, JSON.stringify(datesList), JSON.stringify(domainsList), JSON.stringify(uriList));
    } else {
        const datesList = BarkerDb.readHistoryAllDates();
        const todayDomainsList = BarkerDb.readHistoryDomainsForToday();
        const todayUriList = BarkerDb.readHistoryUrisForToday();
        BarkerBrowser.mainWindow.webContents.send('history-domains-list-set', 'Today', JSON.stringify(datesList), JSON.stringify(todayDomainsList), JSON.stringify(todayUriList));
    }
}

static readHistorySearchString_domains = (searchedString: string) => {
    try {
        const query = `SELECT DISTINCT domain FROM history WHERE innerText LIKE '%${searchedString}%'`
        const readQuery = BarkerDb.db.prepare(query)
        const rowList = readQuery.all()
        return rowList
    } catch (err) {
        console.error(err)
        throw err
    }
}

static readHistorySearchString_uris = (searchedString: string) => {
    try {
        const query = `SELECT domain, uri, innerText FROM history WHERE innerText LIKE '%${searchedString}%'`
        const readQuery = BarkerDb.db.prepare(query)
        const rowList = readQuery.all()
        return rowList
    } catch (err) {
        console.error(err)
        throw err
    }
}

static searchAllHistory(searchedString: string) {
    BarkerUtils.log((new Error().stack.split("at ")[1]).trim(), "searchAllHistory(): searchedString="+searchedString);
    const datesList = BarkerDb.readHistoryAllDates();
    const domainsList = BarkerDb.readHistorySearchString_domains(searchedString);
    const uriList = BarkerDb.readHistorySearchString_uris(searchedString);
    BarkerBrowser.mainWindow.webContents.send('history-domains-list-set', 'Found pages', JSON.stringify(datesList), JSON.stringify(domainsList), JSON.stringify(uriList));
}

}
