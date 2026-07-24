import Database from 'better-sqlite3';
import path from 'path';

/**
 * UserStore — Persists user accounts in a SQLite database.
 *
 * Schema:
 *   users (
 *     id TEXT PRIMARY KEY,       -- UUID-style identifier
 *     email TEXT UNIQUE,         -- User's email (login key)
 *     displayName TEXT,          -- Shown on cursor badges and presence bar
 *     passwordHash TEXT,         -- bcrypt hash of the password
 *     created_at INTEGER         -- Unix timestamp (ms) of account creation
 *   )
 *
 * Why a separate table from rooms?
 *   Users and rooms have different lifecycles. A user persists across
 *   sessions and rooms. Rooms may be created/destroyed dynamically.
 *   Keeping them separate follows the Single Responsibility Principle.
 */

export interface User {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  created_at: number;
}

export class UserStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath || path.join(process.cwd(), 'collab.db');
    this.db = new Database(resolvedPath);

    // Enable WAL mode for better concurrent read/write performance
    this.db.pragma('journal_mode = WAL');

    // Create the users table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        displayName TEXT NOT NULL,
        passwordHash TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    console.log('👤 UserStore: Users table ready');
  }

  /**
   * Creates a new user. Returns the created user or null if email already exists.
   */
  createUser(id: string, email: string, displayName: string, passwordHash: string): User | null {
    try {
      const now = Date.now();
      this.db
        .prepare('INSERT INTO users (id, email, displayName, passwordHash, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(id, email, displayName, passwordHash, now);

      return { id, email, displayName, passwordHash, created_at: now };
    } catch (e: any) {
      // UNIQUE constraint violation = email already exists
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return null;
      }
      throw e;
    }
  }

  /**
   * Finds a user by email. Used during login.
   */
  findByEmail(email: string): User | null {
    const row = this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as User | undefined;

    return row ?? null;
  }

  /**
   * Finds a user by ID. Used for JWT token validation.
   */
  findById(id: string): User | null {
    const row = this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id) as User | undefined;

    return row ?? null;
  }

  /**
   * Closes the database connection.
   */
  close(): void {
    this.db.close();
    console.log('👤 UserStore: Database closed');
  }
}
