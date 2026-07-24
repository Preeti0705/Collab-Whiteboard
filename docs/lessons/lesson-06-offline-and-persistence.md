# Lesson 6: Offline Support & Persistence

> **What you'll learn**: How to make a collaborative app work offline and persist data to survive server restarts.

---

## ELI12

Imagine you're drawing on a shared whiteboard but your WiFi goes out. With a regular app, you'd lose everything. But with our app:

1. You keep drawing â€” everything works locally
2. Your drawings are saved in a secret notebook (IndexedDB)
3. When WiFi comes back, the app automatically sends everything you drew to the server
4. Because of CRDTs, nothing conflicts â€” it all merges perfectly!

And on the server side, everything is saved to a database file. If the server restarts, all your drawings are still there.

---

## Two Problems, Two Solutions

### Problem 1: Client goes offline
**Solution**: IndexedDB offline queue

### Problem 2: Server restarts and loses all state
**Solution**: SQLite persistence

---

## IndexedDB Offline Queue

### Why IndexedDB?

| Storage | Max Size | Sync/Async | Structured Data |
|---|---|---|---|
| localStorage | ~5MB | Synchronous | Strings only |
| **IndexedDB** | **Hundreds of MB** | **Asynchronous** | **Objects, arrays** |
| Cookies | ~4KB | Synchronous | Strings only |

IndexedDB is the only browser storage API powerful enough for our needs.

### How it works

```
User draws offline
       â†“
WebSocketClient.sendMessage()
       â†“
ws.readyState !== OPEN?
       â†“ yes
OfflineQueue.enqueue(operation)
       â†“
[stored in IndexedDB]
       â†“
... time passes, WiFi returns ...
       â†“
WebSocket reconnects
       â†“
OfflineQueue.drain() â†’ returns all pending ops
       â†“
Send each operation to server
       â†“
CRDTs merge everything correctly
```

### Why this is safe

CRDTs have a critical property: **operations are idempotent and commutative**. This means:
- Applying the same operation twice is the same as applying it once
- The order of operations doesn't matter

So even if we replay operations from 10 minutes ago, the CRDT state will converge to the correct result.

---

## Auto-Reconnect with Exponential Backoff

When the WebSocket disconnects, we don't immediately try to reconnect (the server might be down). Instead, we use **exponential backoff**:

```
Attempt 1: wait 1 second
Attempt 2: wait 2 seconds
Attempt 3: wait 4 seconds
Attempt 4: wait 8 seconds
...
Max: 30 seconds
```

This prevents "thundering herd" â€” if the server goes down and 1000 clients all try to reconnect simultaneously, exponential backoff spreads out the load.

```typescript
const delay = Math.min(
  BASE_DELAY * Math.pow(2, reconnectAttempts),
  MAX_DELAY
);
```

---

## SQLite Persistence

### Why SQLite?

- **Zero setup** â€” `npm install better-sqlite3`, no server to install
- **ACID transactions** â€” crash-safe writes
- **Single file** â€” `collab.db` can be backed up by copying one file
- **Fast enough** â€” handles thousands of reads/writes per second
- **Synchronous** â€” `better-sqlite3` is synchronous, making code simple

### Schema

```sql
CREATE TABLE rooms (
  roomId TEXT PRIMARY KEY,
  state TEXT NOT NULL,       -- JSON-serialized LWWElementSet
  updated_at INTEGER NOT NULL -- Unix timestamp
);
```

### Debounced Writes

Freehand drawing generates 60+ operations per second. Writing to SQLite on every operation would be wasteful. Instead, we **debounce**:

```
Shape changed â†’ start 5-second timer
Another change â†’ restart timer
No changes for 5 seconds â†’ write to SQLite
```

This means we write at most once every 5 seconds, regardless of how fast the user draws.

### Room Lifecycle with Persistence

```
User joins "room-A"
       â†“
RoomManager.joinRoom()
       â†“
Room exists in memory? â†’ YES â†’ use it
       â†“ NO
SQLiteStore.loadRoom("room-A")
       â†“
Found in DB? â†’ YES â†’ deserialize & use
       â†“ NO
Create fresh LWWElementSet
       â†“
...
       â†“
All users leave "room-A"
       â†“
SQLiteStore.saveRoom() â†’ persist final state
       â†“
Clean up in-memory structures
```

---

## Key Takeaways

1. **IndexedDB** is the right tool for offline storage in browsers â€” it's async, large, and supports structured data.
2. **Exponential backoff** prevents thundering herd on reconnect.
3. **CRDTs make offline-first trivial** â€” just replay operations, convergence is guaranteed.
4. **SQLite** gives you real database capabilities with zero infrastructure overhead.
5. **Debounced writes** protect the database from excessive I/O during rapid input.

