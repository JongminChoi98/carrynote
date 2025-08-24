import * as SQLite from "expo-sqlite";
const db = SQLite.openDatabaseSync("carrynote.db");

export type ClubRow = {
  id: number;
  label: string; // 표시명
  type: string; // DRIVER / IRON7 ...
  sort: number; // 작은 값이 위로
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
  const count = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM clubs;`
  );
  if (!count || count.c === 0) {
    const presets: Array<Omit<ClubRow, "id">> = [
      { label: "Driver", type: "DRIVER", sort: 1, loft: null },
      { label: "7 Iron", type: "IRON7", sort: 2, loft: 34 },
      { label: "PW", type: "WEDGE_PW", sort: 3, loft: 46 },
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
  return await db.getAllAsync<ClubRow>(
    `SELECT * FROM clubs ORDER BY sort ASC, id ASC;`
  );
}

export async function getClubById(id: number): Promise<ClubRow | null> {
  const row = await db.getFirstAsync<ClubRow>(
    `SELECT * FROM clubs WHERE id = ?;`,
    [id]
  );
  return row ?? null;
}

export async function insertClub(input: {
  label: string;
  type: string;
  sort?: number;
  loft?: number | null;
}) {
  const sort = input.sort ?? 999;
  await db.runAsync(
    `INSERT INTO clubs(label, type, sort, loft) VALUES (?, ?, ?, ?);`,
    [input.label.trim(), input.type, sort, input.loft ?? null]
  );
}

export async function updateClub(
  id: number,
  input: { label?: string; type?: string; sort?: number; loft?: number | null }
) {
  const current = await db.getFirstAsync<ClubRow>(
    `SELECT * FROM clubs WHERE id = ?;`,
    [id]
  );
  if (!current) return;
  await db.runAsync(
    `UPDATE clubs SET label = ?, type = ?, sort = ?, loft = ? WHERE id = ?;`,
    [
      input.label?.trim() ?? current.label,
      input.type ?? current.type,
      input.sort ?? current.sort,
      input.loft ?? current.loft ?? null,
      id,
    ]
  );
}

export async function deleteClub(id: number) {
  await db.runAsync(`DELETE FROM clubs WHERE id = ?;`, [id]);
}
