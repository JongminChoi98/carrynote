import * as SQLite from "expo-sqlite";

const DB_NAME = "carrynote.db";
const SCHEMA_VERSION = 1;

// 1) DB 인스턴스 (신규 API)
const db = SQLite.openDatabaseSync(DB_NAME);

/**
 * 2) DB 초기화
 * - meta(schemaVersion) : 스키마 버전 관리
 * - settings(k,v)       : 간단한 Key-Value 저장 (온보딩, 단위 등)
 */
export async function initDb(): Promise<void> {
  // 테이블 생성
  await db.runAsync(`CREATE TABLE IF NOT EXISTS meta (schemaVersion INTEGER);`);
  await db.runAsync(
    `CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT);`
  );

  // 스키마 버전 존재 확인 후 없으면 삽입
  const row = await db.getFirstAsync<{ schemaVersion: number }>(
    `SELECT schemaVersion FROM meta LIMIT 1;`
  );
  if (!row) {
    await db.runAsync(`INSERT INTO meta(schemaVersion) VALUES (?);`, [
      SCHEMA_VERSION,
    ]);
  }
}

/** 3) Key-Value 유틸 */
export async function getSetting(key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ v: string }>(
    `SELECT v FROM settings WHERE k=? LIMIT 1;`,
    [key]
  );
  return row?.v ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  // SQLite의 UPSERT 문법 사용 (키 충돌 시 v를 갱신)
  await db.runAsync(
    `INSERT INTO settings(k, v) VALUES (?, ?)
     ON CONFLICT(k) DO UPDATE SET v=excluded.v;`,
    [key, value]
  );
}

export async function getHasOnboarded(): Promise<boolean> {
  const v = await getSetting("hasOnboarded");
  return v === "1";
}

export async function setHasOnboarded(done: boolean): Promise<void> {
  await setSetting("hasOnboarded", done ? "1" : "0");
}

export type DistanceUnit = "yard" | "meter";
export type SpeedUnit = "mph" | "mps";

export async function setUnitPrefs(p: {
  distance: DistanceUnit;
  speed: SpeedUnit;
}) {
  await setSetting("unit.distance", p.distance);
  await setSetting("unit.speed", p.speed);
}

export async function getUnitPrefs(): Promise<{
  distance: DistanceUnit;
  speed: SpeedUnit;
}> {
  const distance = ((await getSetting("unit.distance")) ??
    "yard") as DistanceUnit;
  const speed = ((await getSetting("unit.speed")) ?? "mph") as SpeedUnit;
  return { distance, speed };
}
