import * as SQLite from "expo-sqlite";
const db = SQLite.openDatabaseSync("carrynote.db");

// 단위 변환 (저장은 SI 고정: m, m/s)
const yd_to_m = (yd: number) => yd * 0.9144;
const mph_to_mps = (mph: number) => mph * 0.44704;

export type InsertShotInput = {
  clubId: number;
  carry: number; // 사용자가 입력한 거리 (현재 단위)
  total: number; // "
  distanceUnit: "yard" | "meter";
  ballSpeed?: number | null; // 사용자가 입력한 속도 (현재 단위)
  clubSpeed?: number | null; // "
  speedUnit: "mph" | "mps";
};

export async function initShots() {
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS shots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clubId INTEGER NOT NULL,
      carry_m REAL NOT NULL,
      total_m REAL NOT NULL,
      ball_mps REAL NULL,
      club_mps REAL NULL,
      smash REAL NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (clubId) REFERENCES clubs(id)
    );
  `);
}

export async function insertShot(input: InsertShotInput) {
  const carry_m =
    input.distanceUnit === "yard" ? yd_to_m(input.carry) : input.carry;
  const total_m =
    input.distanceUnit === "yard" ? yd_to_m(input.total) : input.total;
  const ball_mps =
    input.ballSpeed == null
      ? null
      : input.speedUnit === "mph"
      ? mph_to_mps(input.ballSpeed)
      : input.ballSpeed;
  const club_mps =
    input.clubSpeed == null
      ? null
      : input.speedUnit === "mph"
      ? mph_to_mps(input.clubSpeed)
      : input.clubSpeed;

  const smash =
    ball_mps != null && club_mps != null && club_mps > 0
      ? Math.round((ball_mps / club_mps) * 100) / 100
      : null;

  const createdAt = Date.now();

  await db.runAsync(
    `INSERT INTO shots(clubId, carry_m, total_m, ball_mps, club_mps, smash, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [input.clubId, carry_m, total_m, ball_mps, club_mps, smash, createdAt]
  );

  return { createdAt, smash };
}

export type ShotRow = {
  id: number;
  clubId: number;
  carry_m: number;
  total_m: number;
  ball_mps: number | null;
  club_mps: number | null;
  smash: number | null;
  createdAt: number;
  clubLabel: string; // JOIN 결과
};

export async function getRecentShots(limit = 30): Promise<ShotRow[]> {
  const rows = await db.getAllAsync<ShotRow>(
    `
      SELECT s.id, s.clubId, s.carry_m, s.total_m, s.ball_mps, s.club_mps, s.smash, s.createdAt,
             c.label as clubLabel
      FROM shots s
      JOIN clubs c ON c.id = s.clubId
      ORDER BY s.createdAt DESC
      LIMIT ?;
      `,
    [limit]
  );
  return rows;
}

export async function getShots(params: {
  limit: number;
  offset?: number;
  clubId?: number | null;
}): Promise<ShotRow[]> {
  const { limit, offset = 0, clubId = null } = params;

  if (clubId == null) {
    // 전체
    return await db.getAllAsync<ShotRow>(
      `
        SELECT s.id, s.clubId, s.carry_m, s.total_m, s.ball_mps, s.club_mps, s.smash, s.createdAt,
               c.label as clubLabel
        FROM shots s
        JOIN clubs c ON c.id = s.clubId
        ORDER BY s.createdAt DESC
        LIMIT ? OFFSET ?;
        `,
      [limit, offset]
    );
  } else {
    // 특정 클럽만
    return await db.getAllAsync<ShotRow>(
      `
        SELECT s.id, s.clubId, s.carry_m, s.total_m, s.ball_mps, s.club_mps, s.smash, s.createdAt,
               c.label as clubLabel
        FROM shots s
        JOIN clubs c ON c.id = s.clubId
        WHERE s.clubId = ?
        ORDER BY s.createdAt DESC
        LIMIT ? OFFSET ?;
        `,
      [clubId, limit, offset]
    );
  }
}

export async function deleteShot(id: number): Promise<void> {
  await db.runAsync(`DELETE FROM shots WHERE id = ?;`, [id]);
}
