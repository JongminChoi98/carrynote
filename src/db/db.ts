import * as SQLite from "expo-sqlite";

const DB_NAME = "carrynote.db";
const SCHEMA_VERSION = 1;

function open() {
  // Classic WebSQL-like API for wide compatibility
  return SQLite.openDatabase(DB_NAME);
}

export async function initDb(): Promise<void> {
  const db = open();
  await new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      // meta table
      tx.executeSql(`CREATE TABLE IF NOT EXISTS meta (schemaVersion INTEGER);`);
      tx.executeSql(`SELECT schemaVersion FROM meta LIMIT 1;`, [], (_tx, res) => {
        if (res.rows.length === 0) {
          tx.executeSql(`INSERT INTO meta(schemaVersion) VALUES (?);`, [SCHEMA_VERSION]);
        }
      });

      // bags
      tx.executeSql(`CREATE TABLE IF NOT EXISTS bags (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        name TEXT,
        isDefault INTEGER,
        createdAt INTEGER,
        updatedAt INTEGER
      );`);

      // clubs
      tx.executeSql(`CREATE TABLE IF NOT EXISTS clubs (
        id TEXT PRIMARY KEY NOT NULL,
        bagId TEXT NOT NULL,
        type TEXT NOT NULL,   -- e.g., DRIVER, 7I, PW, SW
        loft REAL,
        shaft TEXT,
        flex TEXT,
        notes TEXT,
        createdAt INTEGER,
        updatedAt INTEGER
      );`);

      // sessions
      tx.executeSql(`CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY NOT NULL,
        startedAt INTEGER,
        location TEXT,
        notes TEXT,
        createdAt INTEGER,
        updatedAt INTEGER
      );`);

      // shots
      tx.executeSql(`CREATE TABLE IF NOT EXISTS shots (
        id TEXT PRIMARY KEY NOT NULL,
        sessionId TEXT,
        clubId TEXT,
        carry_m REAL NOT NULL,
        total_m REAL NOT NULL,
        ballSpeed_mps REAL,
        clubSpeed_mps REAL,
        backspin_rpm REAL,
        launch_deg REAL,
        createdAt INTEGER,
        updatedAt INTEGER
      );`);

    }, reject, resolve);
  });
}

function uuid(): string {
  // simple UUID v4-ish
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function setUnitPrefs(prefs: { distance: "yard"|"meter"; speed: "mph"|"mps" }) {
  const db = open();
  await new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(`CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT);`);
      tx.executeSql(`REPLACE INTO settings(k, v) VALUES (?, ?);`, ["unit.distance", prefs.distance]);
      tx.executeSql(`REPLACE INTO settings(k, v) VALUES (?, ?);`, ["unit.speed", prefs.speed]);
    }, reject, resolve);
  });
}

export async function createDefaultBagAndClubs() {
  const db = open();
  const bagId = uuid();
  const now = Date.now();
  const clubs = ["DRIVER","3W","5W","4I","5I","6I","7I","8I","9I","PW","AW","SW"].map(type => ({
    id: uuid(), bagId, type, createdAt: now, updatedAt: now
  }));

  await new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(`INSERT INTO bags(id,userId,name,isDefault,createdAt,updatedAt) VALUES (?,?,?,?,?,?)`,
        [bagId, null, "My Bag", 1, now, now]);
      clubs.forEach(c => {
        tx.executeSql(`INSERT INTO clubs(id,bagId,type,createdAt,updatedAt) VALUES (?,?,?,?,?)`,
          [c.id, c.bagId, c.type, c.createdAt, c.updatedAt]);
      });
    }, reject, resolve);
  });
}

export async function insertQuickShot(input: { clubType: string; carry_m: number; total_m: number }) {
  const db = open();
  const now = Date.now();
  const id = uuid();

  // pick first club with matching type
  const club = await new Promise<any>((resolve, reject) => {
    db.readTransaction(tx => {
      tx.executeSql(`SELECT id FROM clubs WHERE type = ? LIMIT 1`, [input.clubType], (_tx, res) => {
        resolve(res.rows.item(0));
      });
    }, reject);
  });

  const clubId = club?.id ?? null;

  await new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(`INSERT INTO shots(id, sessionId, clubId, carry_m, total_m, createdAt, updatedAt)
                     VALUES (?,?,?,?,?,?,?)`,
        [id, null, clubId, input.carry_m, input.total_m, now, now]);
    }, reject, resolve);
  });
}

export async function getDbInfo() {
  const db = open();
  const info: any = {};
  await new Promise<void>((resolve, reject) => {
    db.readTransaction(tx => {
      tx.executeSql(`SELECT schemaVersion FROM meta LIMIT 1`, [], (_t, r) => {
        info.schemaVersion = r.rows.item(0)?.schemaVersion ?? null;
      });
      tx.executeSql(`SELECT COUNT(*) as c FROM clubs`, [], (_t, r) => { info.clubCount = r.rows.item(0)?.c ?? 0; });
      tx.executeSql(`SELECT COUNT(*) as c FROM shots`, [], (_t, r) => { info.shotCount = r.rows.item(0)?.c ?? 0; });
    }, reject, resolve);
  });
  return info;
}
