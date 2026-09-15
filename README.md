# CoCanvas - Collab Whiteboard

A **production-quality collaborative whiteboard** built from scratch with custom CRDTs, WebSockets, React Canvas, and TypeScript.

> **Purpose**: Learn distributed systems by building — not by reading. Every feature is a lesson in concurrency, replication, and conflict resolution.

---

## Features

- **Real-time collaboration** — Draw together with live cursor tracking
- **Custom CRDTs** — LWW-Register & LWW-Element-Set built from scratch
- **Multi-shape tools** — Pen, Rectangle, Ellipse, Line, Arrow, Text
- **Select & transform** — Click to select, drag to move, Delete to remove
- **Offline support** — IndexedDB queue with auto-reconnect & exponential backoff
- **SQLite persistence** — Room state survives server restarts
- **JWT authentication** — Register/login with bcrypt password hashing
- **Undo/Redo** — Ctrl+Z / Ctrl+Shift+Z with local snapshot stack
- **Export** — Download your board as PNG, SVG, or JSON
- **Live presence** — See who's online with colored cursors and name badges
- **Responsive UI** — Adapts to mobile and desktop screens

---

## What You'll Learn

| Concept | Where It Appears |
|---|---|
| CRDTs (Conflict-free Replicated Data Types) | Core state engine |
| Operational Transform vs CRDTs | Design decisions |
| Eventual Consistency | Multi-client sync |
| Conflict Resolution | Concurrent shape edits |
| Offline Editing | IndexedDB queue + CRDT replay |
| WebSockets | Real-time transport |
| Canvas Rendering | 60fps drawing engine |
| Replication & Synchronization | State convergence |
| JWT Authentication | Stateless session management |
| Strategy Pattern | Tool system architecture |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Canvas API, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript, `ws` |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Protocol | Custom CRDT over WebSocket |
| Offline | IndexedDB |

---

## Project Structure

```
collab-whiteboard/
├── frontend/              # React + Vite + Canvas
│   └── src/
│       ├── canvas/        # Rendering engine
│       ├── crdt/          # LWWRegister, LWWElementSet, UndoManager
│       ├── hooks/         # usePresence
│       ├── network/       # WebSocketClient
│       ├── storage/       # OfflineQueue (IndexedDB)
│       ├── tools/         # 7 drawing tools (Strategy pattern)
│       ├── types/         # Shape, WSMessage types
│       └── ui/            # AuthScreen, CanvasBoard, Toolbar, ExportMenu, PresenceBar
├── backend/               # Node + WebSocket + REST
│   └── src/
│       ├── auth/          # AuthController, AuthMiddleware (JWT)
│       ├── crdt/          # Server-side CRDT
│       ├── network/       # WebSocketServer
│       ├── rooms/         # RoomManager
│       └── storage/       # SQLiteStore, UserStore
├── docs/                  # 7 educational lessons
├── guide.md               # Step-by-step build log
├── ROADMAP.md             # Feature timeline
├── ARCHITECTURE.md        # System design diagrams
├── DESIGN.md              # UI/UX design system
├── LESSONS.md             # Master lesson index
├── KNOWLEDGE_GRAPH.md     # Concept dependency graph
├── TESTING.md             # Test strategy
├── PERFORMANCE.md         # Benchmarks & optimization
├── INTERVIEW_PREP.md      # System design Q&A
└── CHANGELOG.md           # Version history
```

---

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start the backend (port 3001)
npm run dev:backend

# Start the frontend (port 5173)
npm run dev:frontend
```

Open http://localhost:5173 — register an account or continue as a guest.

---

## Learning Path

See [ROADMAP.md](./ROADMAP.md) for the feature timeline.  
See [guide.md](./guide.md) for the step-by-step build log with every command and code change.

---

## Philosophy

- **No CRDT libraries** — we build our own from scratch.
- **One feature at a time** — each feature is a distributed systems lesson.
- **Explain first, code second** — theory always precedes implementation.
- **Production quality** — this is a portfolio project, not a toy.

---

