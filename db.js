import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbDriver = 'sqlite';
let pgPool = null;
let sqliteDb = null;
let dbConnected = false;

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const SQLITE_FILE = path.join(DATA_DIR, 'squaddraft.db');

export async function initDatabase() {
  const isProd = process.env.NODE_ENV === 'production';
  const databaseUrl = process.env.DATABASE_URL;

  // SAFEGUARD 1: PostgreSQL is strictly required in production.
  // Fail startup clearly if NODE_ENV=production and DATABASE_URL is missing.
  if (isProd) {
    if (!databaseUrl || (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://'))) {
      console.error('❌ FATAL: Production environment detected (NODE_ENV=production) but PostgreSQL DATABASE_URL is missing or invalid.');
      console.error('❌ SQLite fallback is strictly prohibited in production.');
      throw new Error('FATAL: Startup aborted. PostgreSQL DATABASE_URL is required in production.');
    }
  }

  if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
    try {
      const { default: pg } = await import('pg');
      const { Pool } = pg;
      pgPool = new Pool({
        connectionString: databaseUrl,
        ssl: isProd ? { rejectUnauthorized: false } : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      });
      const client = await pgPool.connect();
      client.release();
      dbDriver = 'postgres';
      dbConnected = true;
      console.log('✅ Connected to PostgreSQL production database successfully.');
    } catch (err) {
      if (isProd) {
        console.error('❌ FATAL: Could not connect to PostgreSQL database in production:', err.message);
        throw err;
      }
      console.warn('⚠️ Could not connect to PostgreSQL in local dev, falling back to embedded SQLite:', err.message);
      dbDriver = 'sqlite';
    }
  }

  if (dbDriver === 'sqlite') {
    const { DatabaseSync } = await import('node:sqlite');
    sqliteDb = new DatabaseSync(SQLITE_FILE);
    dbConnected = true;
    console.log('✅ Initialized native embedded SQLite database for local development at', SQLITE_FILE);
  }

  await createTables();
  await migrateFromLegacyJson();
}

export function getDatabaseStatus() {
  return {
    database: dbConnected ? 'connected' : 'disconnected',
    databaseType: dbDriver === 'postgres' ? 'postgresql' : 'sqlite'
  };
}

export async function query(sql, params = []) {
  const sanitizedParams = (params || []).map(p => (p === undefined ? null : p));
  if (dbDriver === 'postgres') {
    const res = await pgPool.query(sql, sanitizedParams);
    return res.rows;
  } else {
    // Convert $1, $2, $3 to ? for SQLite
    const sqliteSql = sql.replace(/\$(\d+)/g, '?');
    const trimmed = sqliteSql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
      const stmt = sqliteDb.prepare(sqliteSql);
      return stmt.all(...sanitizedParams);
    } else {
      const stmt = sqliteDb.prepare(sqliteSql);
      const info = stmt.run(...sanitizedParams);
      return [{ changes: info.changes, lastInsertRowid: info.lastInsertRowid }];
    }
  }
}

async function createTables() {
  const isPg = dbDriver === 'postgres';

  // 1. Players (Unique name constraint)
  await query(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      position TEXT NOT NULL,
      secondary_position TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      rating INTEGER DEFAULT 4,
      created_at TEXT NOT NULL
    )
  `);

  // 2. Matches
  await query(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      venue TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT '8v8',
      status TEXT NOT NULL DEFAULT 'PLAYERS_SETUP',
      team1_name TEXT DEFAULT 'Team White',
      team2_name TEXT DEFAULT 'Team Black',
      team1_kit TEXT DEFAULT 'white',
      team2_kit TEXT DEFAULT 'black',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // 3. Match Players
  await query(`
    CREATE TABLE IF NOT EXISTS match_players (
      match_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      position TEXT NOT NULL DEFAULT 'MID',
      is_captain INTEGER DEFAULT 0,
      team_number INTEGER DEFAULT 0,
      PRIMARY KEY (match_id, player_id)
    )
  `);

  // 4. Captains (Match scoped, unique tokens, revocable)
  await query(`
    CREATE TABLE IF NOT EXISTS captains (
      match_id TEXT NOT NULL,
      captain_number INTEGER NOT NULL,
      player_id TEXT,
      kit_color TEXT,
      access_token TEXT NOT NULL UNIQUE,
      is_revoked INTEGER DEFAULT 0,
      assigned_at TEXT NOT NULL,
      PRIMARY KEY (match_id, captain_number)
    )
  `);

  // 5. Coin Toss
  await query(`
    CREATE TABLE IF NOT EXISTS coin_toss (
      match_id TEXT PRIMARY KEY,
      caller_choice TEXT,
      outcome TEXT,
      winner_id TEXT,
      flipped_by TEXT,
      flipped_at TEXT
    )
  `);

  // 6. Draft State
  await query(`
    CREATE TABLE IF NOT EXISTS draft_state (
      match_id TEXT PRIMARY KEY,
      current_turn INTEGER DEFAULT 1,
      pick_number INTEGER DEFAULT 1,
      turn_started_at INTEGER,
      turn_ends_at INTEGER,
      is_paused INTEGER DEFAULT 0,
      paused_remaining_ms INTEGER DEFAULT 90000
    )
  `);

  // 7. Draft Picks (Strict constraints: player can only be drafted ONCE per match)
  await query(`
    CREATE TABLE IF NOT EXISTS draft_picks (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      pick_number INTEGER NOT NULL,
      team_number INTEGER NOT NULL,
      player_id TEXT NOT NULL,
      picked_by_role TEXT NOT NULL,
      is_auto_gk INTEGER DEFAULT 0,
      picked_at TEXT NOT NULL,
      UNIQUE (match_id, player_id)
    )
  `);

  // 8. Match Results (Final Score)
  await query(`
    CREATE TABLE IF NOT EXISTS match_results (
      match_id TEXT PRIMARY KEY,
      team1_score INTEGER NOT NULL DEFAULT 0,
      team2_score INTEGER NOT NULL DEFAULT 0,
      winner TEXT,
      is_draw INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL
    )
  `);

  // 9. Match Archive (Unique match_id)
  await query(`
    CREATE TABLE IF NOT EXISTS match_archive (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      venue TEXT NOT NULL,
      format TEXT NOT NULL,
      team1_name TEXT NOT NULL,
      team2_name TEXT NOT NULL,
      team1_score INTEGER,
      team2_score INTEGER,
      winner TEXT,
      archived_payload TEXT NOT NULL,
      archived_at TEXT NOT NULL
    )
  `);

  // 10. Admin Sessions
  await query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )
  `);

  // Migration safeguard: Ensure is_revoked column exists in captains table
  try {
    if (isPg) {
      await query(`ALTER TABLE captains ADD COLUMN IF NOT EXISTS is_revoked INTEGER DEFAULT 0`);
    } else {
      const cols = await query(`PRAGMA table_info(captains)`);
      if (!cols.some(c => c.name === 'is_revoked')) {
        await query(`ALTER TABLE captains ADD COLUMN is_revoked INTEGER DEFAULT 0`);
      }
    }
  } catch (e) {}

  console.log('✅ All relational tables and constraints verified in database.');
}

// SAFEGUARD 2: Idempotent Migration from match_state.json
export async function migrateFromLegacyJson() {
  const jsonPath = path.join(DATA_DIR, 'match_state.json');
  if (!fs.existsSync(jsonPath)) return;

  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const legacy = JSON.parse(raw);

    // Migrate Directory Players (Idempotent upsert via ON CONFLICT / ignore)
    const dir = legacy.playerDirectory || legacy.players || [];
    for (const p of dir) {
      if (!p.id || !p.name) continue;
      const existing = await query('SELECT id FROM players WHERE id = $1 OR name = $2', [p.id, p.name.trim()]);
      if (existing.length === 0) {
        await query(
          'INSERT INTO players (id, name, position, secondary_position, active, rating, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [p.id, p.name.trim(), p.position || 'MID', p.secondaryPosition || '', 1, p.rating || 4, new Date().toISOString()]
        ).catch(() => {});
      }
    }

    // Migrate Match Archive (Idempotent via unique match_id check)
    if (Array.isArray(legacy.matchArchive) && legacy.matchArchive.length > 0) {
      for (const m of legacy.matchArchive) {
        const matchId = m.matchId || m.id || ('arch_' + Date.now());
        const existingArch = await query('SELECT id FROM match_archive WHERE match_id = $1 OR id = $2', [matchId, m.id || matchId]);
        if (existingArch.length === 0) {
          await query(
            `INSERT INTO match_archive 
             (id, match_id, name, date, venue, format, team1_name, team2_name, team1_score, team2_score, winner, archived_payload, archived_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              m.id || matchId,
              matchId,
              m.name || 'Sunday Match',
              m.date || '',
              m.venue || 'Turf',
              m.format || '8v8',
              m.team1Name || 'Team White',
              m.team2Name || 'Team Black',
              m.team1Score !== undefined ? m.team1Score : null,
              m.team2Score !== undefined ? m.team2Score : null,
              m.winner || null,
              JSON.stringify(m),
              m.archivedAt || new Date().toISOString()
            ]
          ).catch(() => {});
        }
      }
    }

    console.log('✅ Idempotent migration from match_state.json verified.');
  } catch (err) {
    console.error('⚠️ Error during migration check:', err);
  }
}

export function generateSecureToken() {
  return crypto.randomBytes(16).toString('hex');
}

// --- Player Operations ---
export async function dbGetAllPlayers() {
  return await query('SELECT * FROM players ORDER BY name ASC');
}

export async function dbUpsertPlayer(player) {
  const existing = await query('SELECT id FROM players WHERE id = $1 OR name = $2', [player.id, player.name.trim()]);
  if (existing.length > 0) {
    await query(
      'UPDATE players SET name = $1, position = $2, secondary_position = $3, rating = $4 WHERE id = $5',
      [player.name.trim(), player.position, player.secondaryPosition || '', player.rating || 4, existing[0].id]
    );
  } else {
    await query(
      'INSERT INTO players (id, name, position, secondary_position, active, rating, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [player.id, player.name.trim(), player.position, player.secondaryPosition || '', 1, player.rating || 4, new Date().toISOString()]
    );
  }
}

export async function dbDeletePlayer(id) {
  await query('DELETE FROM players WHERE id = $1', [id]);
}

// --- Captain Tokens & Revocation (SAFEGUARD 6) ---
export async function dbSetCaptainToken(matchId, captainNumber, playerId, kitColor, token) {
  // Revoke any previous token for this captain slot
  await query('UPDATE captains SET is_revoked = 1 WHERE match_id = $1 AND captain_number = $2', [matchId, captainNumber]);

  // Insert or update active captain credentials
  const existing = await query('SELECT match_id FROM captains WHERE match_id = $1 AND captain_number = $2', [matchId, captainNumber]);
  if (existing.length > 0) {
    await query(`
      UPDATE captains SET player_id = $1, kit_color = $2, access_token = $3, is_revoked = 0, assigned_at = $4
      WHERE match_id = $5 AND captain_number = $6
    `, [playerId, kitColor, token, new Date().toISOString(), matchId, captainNumber]);
  } else {
    await query(`
      INSERT INTO captains (match_id, captain_number, player_id, kit_color, access_token, is_revoked, assigned_at)
      VALUES ($1, $2, $3, $4, $5, 0, $6)
    `, [matchId, captainNumber, playerId, kitColor, token, new Date().toISOString()]);
  }
}

export async function dbGetCaptainByToken(matchId, token) {
  if (!token) return null;
  const rows = await query(
    'SELECT captain_number, player_id, kit_color FROM captains WHERE match_id = $1 AND access_token = $2 AND is_revoked = 0',
    [matchId, token]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

export async function dbGetCaptains(matchId) {
  return await query('SELECT captain_number, player_id, kit_color, access_token, is_revoked FROM captains WHERE match_id = $1', [matchId]);
}

export async function dbRevokeCaptainTokens(matchId) {
  await query('UPDATE captains SET is_revoked = 1 WHERE match_id = $1', [matchId]);
}

// --- Admin Session Auth (SAFEGUARD 5) ---
export async function dbCreateAdminSession(token, durationMs = 24 * 60 * 60 * 1000) {
  const expiresAt = new Date(Date.now() + durationMs).toISOString();
  await query('INSERT INTO admin_sessions (token, created_at, expires_at) VALUES ($1, $2, $3)', [
    token,
    new Date().toISOString(),
    expiresAt
  ]);
  return { token, expiresAt };
}

export async function dbValidateAdminSession(token) {
  if (!token) return false;
  const rows = await query('SELECT token, expires_at FROM admin_sessions WHERE token = $1', [token]);
  if (rows.length === 0) return false;
  const expires = new Date(rows[0].expires_at).getTime();
  if (Date.now() > expires) {
    await query('DELETE FROM admin_sessions WHERE token = $1', [token]);
    return false;
  }
  return true;
}

// --- Match Results (Final Score) ---
export async function dbSaveMatchScore(matchId, team1Score, team2Score, team1Name = 'Team 1', team2Name = 'Team 2') {
  const t1 = Math.max(0, parseInt(team1Score, 10) || 0);
  const t2 = Math.max(0, parseInt(team2Score, 10) || 0);
  const isDraw = t1 === t2 ? 1 : 0;
  const winner = t1 > t2 ? team1Name : t2 > t1 ? team2Name : 'Draw';

  const existing = await query('SELECT match_id FROM match_results WHERE match_id = $1', [matchId]);
  if (existing.length > 0) {
    await query(`
      UPDATE match_results 
      SET team1_score = $1, team2_score = $2, winner = $3, is_draw = $4, updated_at = $5
      WHERE match_id = $6
    `, [t1, t2, winner, isDraw, new Date().toISOString(), matchId]);
  } else {
    await query(`
      INSERT INTO match_results (match_id, team1_score, team2_score, winner, is_draw, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [matchId, t1, t2, winner, isDraw, new Date().toISOString()]);
  }

  return { team1Score: t1, team2Score: t2, winner, isDraw: isDraw === 1 };
}

export async function dbGetMatchScore(matchId) {
  const rows = await query('SELECT * FROM match_results WHERE match_id = $1', [matchId]);
  return rows[0] || null;
}

// --- Match Archive & History (SAFEGUARD 8: ONLY Public Information Exposed) ---
export async function dbArchiveMatch(archivedData) {
  const id = archivedData.id || ('arch_' + Date.now());
  const matchId = archivedData.matchId || id;
  
  // Revoke captain tokens when match is archived
  await dbRevokeCaptainTokens(matchId);

  // Sanitize payload: Strip tokens and credentials
  const sanitizedPayload = { ...archivedData };
  delete sanitizedPayload.cap1Token;
  delete sanitizedPayload.cap2Token;
  delete sanitizedPayload.adminToken;

  const existing = await query('SELECT id FROM match_archive WHERE match_id = $1 OR id = $2', [matchId, id]);
  if (existing.length > 0) {
    await query(`
      UPDATE match_archive SET
        name = $1, date = $2, venue = $3, format = $4, team1_name = $5, team2_name = $6,
        team1_score = $7, team2_score = $8, winner = $9, archived_payload = $10, archived_at = $11
      WHERE match_id = $12
    `, [
      archivedData.name || 'Sunday Turf Match',
      archivedData.date || new Date().toLocaleDateString('en-GB'),
      archivedData.venue || 'ABC Turf',
      archivedData.format || '8v8',
      archivedData.team1Name || 'Team White',
      archivedData.team2Name || 'Team Black',
      archivedData.team1Score !== undefined ? archivedData.team1Score : null,
      archivedData.team2Score !== undefined ? archivedData.team2Score : null,
      archivedData.winner || null,
      JSON.stringify(sanitizedPayload),
      new Date().toISOString(),
      matchId
    ]);
  } else {
    await query(`
      INSERT INTO match_archive (id, match_id, name, date, venue, format, team1_name, team2_name, team1_score, team2_score, winner, archived_payload, archived_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      id,
      matchId,
      archivedData.name || 'Sunday Turf Match',
      archivedData.date || new Date().toLocaleDateString('en-GB'),
      archivedData.venue || 'ABC Turf',
      archivedData.format || '8v8',
      archivedData.team1Name || 'Team White',
      archivedData.team2Name || 'Team Black',
      archivedData.team1Score !== undefined ? archivedData.team1Score : null,
      archivedData.team2Score !== undefined ? archivedData.team2Score : null,
      archivedData.winner || null,
      JSON.stringify(sanitizedPayload),
      new Date().toISOString()
    ]);
  }

  return id;
}

// SAFEGUARD 8: Public History ONLY exposes public match info
export async function dbGetPublicHistory() {
  const rows = await query('SELECT id, match_id, name, date, venue, format, team1_name, team2_name, team1_score, team2_score, winner, archived_payload, archived_at FROM match_archive ORDER BY archived_at DESC');
  return rows.map(r => {
    let parsedPayload = {};
    try { parsedPayload = JSON.parse(r.archived_payload); } catch (e) {}
    return {
      id: r.id,
      matchId: r.match_id,
      name: r.name,
      date: r.date,
      venue: r.venue,
      format: r.format,
      team1Name: r.team1_name,
      team2Name: r.team2_name,
      team1Score: r.team1_score,
      team2Score: r.team2_score,
      winner: r.winner,
      archivedAt: r.archived_at,
      captain1: parsedPayload.captain1 ? { name: parsedPayload.captain1.name } : null,
      captain2: parsedPayload.captain2 ? { name: parsedPayload.captain2.name } : null,
      finalTeam1: (parsedPayload.finalTeam1 || []).map(p => ({ name: p.name, position: p.position })),
      finalTeam2: (parsedPayload.finalTeam2 || []).map(p => ({ name: p.name, position: p.position }))
    };
  });
}
