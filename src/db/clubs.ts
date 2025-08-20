import * as SQLite from "expo-sqlite";
const db = SQLite.openDatabaseSync("carrynote.db");

export type ClubRow = {
  id: number;
  label: string; // UI 표시명
  type: string; // DRIVER / 7I / PW 등
  sort: number; // 정렬 우선순위
  loft?: number | null;
};

export async function initClubs() {
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS clubs (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      type  TEXT NOT NULL,
      sort  INTEGER NOT NULL DEFAULT 0,
      loft  REAL NULL
    );
  `);

  // 비었으면 기본 시드
  const count = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM clubs;`
  );
  if (!count || count.c === 0) {
    const presets: Array<Omit<ClubRow, "id">> = [
      { label: "Driver", type: "DRIVER", sort: 1, loft: null },
      { label: "7 Iron", type: "7I", sort: 2, loft: 34 },
      { label: "PW", type: "PW", sort: 3, loft: 46 },
    ];
    for (const p of presets) {
      await db.runAsync(
        `INSERT INTO clubs(label, type, sort, loft) VALUES (?, ?, ?, ?);`,
        [p.label, p.type, p.sort, p.loft ?? null]
      );
    }
  }
}

export async function getAllClubs(): Promise<ClubRow[]> {
  const rows = await db.getAllAsync<ClubRow>(
    `SELECT * FROM clubs ORDER BY sort, id;`
  );
  return rows;
}
