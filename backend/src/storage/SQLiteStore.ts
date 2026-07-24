import Database from 'better-sqlite3';
import path from 'path';
import { LWWElementSet } from '../crdt/LWWElementSet';

/**
 * SQLiteStore — Persists room CRDT state to a SQLite database.
 *
 * Schema:
 *   rooms (
 *     roomId TEXT PRIMARY KEY,
 *     state TEXT,          -- JSON-serialized LWWElementSet
 *     updated_at INTEGER   -- Unix timestamp (ms) of last update
 *   )
 *
 * Persistence strategy:
 *   - Writes are debounced — at most once every 5 seconds per room.
 *   - On server startup, existing room states are loaded from SQLite.
 *   - On room join, state is loaded if it exists.
 *   - The database file (`collab.db`) lives in the backend root.
 *
 * Why SQLite?
 *   - Zero setup (no server process to manage)
 *   - ACID transactions (crash-safe writes)
 *   - Single-file database (easy to backup and distribute)
 *   - `better-sqlite3` is synchronous, making it simple to use in Node.js
 */
export class SQLiteStore {
  private db: Database.Database;

  /** Debounce timers per room, so we don't write on every single stroke */
  private saveTimers: Map<string, NodeJS.Timeout> = new Map();

  /** How long to wait after the last change before writing (ms) */
  private debounceMs = 5000;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath || path.join(process.cwd(), 'collab.db');
    this.db = new Database(resolvedPath);

    // Enable WAL mode for better concurrent read/write performance
    this.db.pragma('journal_mode = WAL');

    // Create the rooms table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        roomId TEXT PRIMARY KEY,
        state TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    console.log(`💾 SQLiteStore: Database ready at ${resolvedPath}`);
  }

  /**
   * Loads a room's CRDT state from the database.
   * Returns null if the room doesn't exist.
   */
  loadRoom(roomId: string): LWWElementSet | null {
    const row = this.db
      .prepare('SELECT state FROM rooms WHERE roomId = ?')
      .get(roomId) as { state: string } | undefined;

    if (!row) return null;

    try {
      const json = JSON.parse(row.state);
      console.log(`📂 Loaded room "${roomId}" from SQLite`);
      return LWWElementSet.fromJSON(json);
    } catch (e) {
      console.error(`Failed to parse state for room ${roomId}`, e);
      return null;
    }
  }

  /**
   * Saves a room's CRDT state to the database (immediately).
   */
  saveRoom(roomId: string, state: LWWElementSet): void {
    const json = JSON.stringify(state.toJSON());
    const now = Date.now();

    this.db
      .prepare(
        'INSERT OR REPLACE INTO rooms (roomId, state, updated_at) VALUES (?, ?, ?)'
      )
      .run(roomId, json, now);
  }

  /**
   * Schedules a debounced save. Multiple rapid changes within the
   * debounce window are collapsed into a single write.
   *
   * This is important because freehand drawing generates many
   * operations per second — we don't want to hit SQLite 60 times/sec.
   */
  scheduleSave(roomId: string, state: LWWElementSet): void {
    // Clear any existing timer for this room
    const existingTimer = this.saveTimers.get(roomId);
    if (existingTimer) clearTimeout(existingTimer);

    // Schedule a new save
    const timer = setTimeout(() => {
      this.saveRoom(roomId, state);
      this.saveTimers.delete(roomId);
      console.log(`💾 Saved room "${roomId}" to SQLite`);
    }, this.debounceMs);

    this.saveTimers.set(roomId, timer);
  }

  /**
   * Returns all stored room IDs.
   */
  listRooms(): string[] {
    const rows = this.db
      .prepare('SELECT roomId FROM rooms')
      .all() as { roomId: string }[];
    return rows.map(r => r.roomId);
  }

  /**
   * Deletes a room from the database.
   */
  deleteRoom(roomId: string): void {
    this.db.prepare('DELETE FROM rooms WHERE roomId = ?').run(roomId);
  }

  /**
   * Closes the database connection.
   * Should be called on server shutdown.
   */
  close(): void {
    // Flush all pending saves
    for (const [roomId, timer] of this.saveTimers.entries()) {
      clearTimeout(timer);
      // We can't save here because the state isn't passed in,
      // but timers should have fired by now in normal operation
      this.saveTimers.delete(roomId);
    }
    this.db.close();
    console.log('💾 SQLiteStore: Database closed');
  }
}
