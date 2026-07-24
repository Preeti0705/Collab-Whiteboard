/**
 * OfflineQueue — Persists pending operations in IndexedDB.
 *
 * Why IndexedDB?
 *   localStorage is synchronous and limited to ~5MB.
 *   IndexedDB is asynchronous, can store much more data, and supports
 *   structured data (not just strings).
 *
 * How it works:
 *   1. When the WebSocket is disconnected, operations are queued here
 *   2. Each operation is stored as a JSON record in IndexedDB
 *   3. On reconnect, the queue is drained and all ops are sent to the server
 *   4. Because our CRDT guarantees convergence, replaying old operations
 *      is always safe — they'll simply merge into the current state
 *
 * Database schema:
 *   Store: 'pending_ops'
 *   Key: auto-incrementing integer
 *   Value: { type: string, payload: any, timestamp: number }
 */

const DB_NAME = 'collab_whiteboard';
const DB_VERSION = 1;
const STORE_NAME = 'pending_ops';

export interface QueuedOperation {
  type: string;
  payload: any;
  timestamp: number;
}

export class OfflineQueue {
  private db: IDBDatabase | null = null;

  /**
   * Opens the IndexedDB database, creating the object store if needed.
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('📦 OfflineQueue: IndexedDB ready');
        resolve();
      };

      request.onerror = () => {
        console.error('❌ OfflineQueue: Failed to open IndexedDB');
        reject(request.error);
      };
    });
  }

  /**
   * Enqueues an operation for later delivery.
   * Called when the WebSocket is disconnected and the user makes changes.
   */
  async enqueue(op: QueuedOperation): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.add(op);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Drains the queue — returns all pending operations and deletes them.
   * Called on reconnect to replay buffered operations.
   */
  async drain(): Promise<QueuedOperation[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getAll = store.getAll();

      getAll.onsuccess = () => {
        const ops = getAll.result as QueuedOperation[];
        // Clear the store after reading
        store.clear();
        resolve(ops);
      };

      getAll.onerror = () => reject(getAll.error);
    });
  }

  /**
   * Returns the number of pending operations.
   */
  async count(): Promise<number> {
    if (!this.db) return 0;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const count = store.count();

      count.onsuccess = () => resolve(count.result);
      count.onerror = () => reject(count.error);
    });
  }
}
