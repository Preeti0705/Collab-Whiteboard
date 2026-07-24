# 🗺️ Codebase Walkthrough: Collab Whiteboard

Welcome to the comprehensive walkthrough of the **Collab Whiteboard** codebase. This document explains the project from scratch, covering its architecture, directory structure, core concepts, and educational goals.

---

## 1. Project Overview & Philosophy

The Collab Whiteboard is not just an application; it is an educational tool designed to teach **distributed systems** by building a production-quality collaborative whiteboard. 

Instead of relying on external libraries for complex synchronization, this project builds custom **CRDTs (Conflict-free Replicated Data Types)** from scratch to handle real-time collaboration.

**Key Philosophies:**
- **Build from scratch**: No CRDT libraries.
- **Educational first**: Theory precedes implementation (documented in `LESSONS.md`).
- **Production quality**: Designed to be a robust portfolio piece.

---

## 2. High-Level Architecture

The system follows a client-server model with distributed state synchronization:

- **Clients (Frontend)**: React applications rendering on an HTML5 Canvas. Each client holds a local **replica** of the whiteboard state.
- **Server (Backend)**: A Node.js WebSocket + REST server that acts as a relay, holds the authoritative CRDT replica, and persists state to SQLite.
- **State Synchronization**: Uses CRDTs over WebSockets. When a user draws, the local state is updated optimistically (instantly). The operation is then sent to the server, which broadcasts it to other peers.
- **Authentication**: JWT-based stateless auth. Users register/login via REST API, and the JWT is passed to the WebSocket connection.

### Why CRDTs?
As detailed in `docs/lessons/lesson-01-intro-to-crdts.md`, the system chooses Eventual Consistency (AP in the CAP theorem). CRDTs are chosen over Operational Transform (OT) because:
1. They naturally support **offline editing**.
2. They do not require a central server to dictate the order of operations for conflict resolution.
3. They provide mathematical guarantees for convergence (Commutativity, Associativity, Idempotency).

---

## 3. Codebase Structure

The project is structured as a monorepo containing the frontend, backend, and extensive documentation.

```text
collab-whiteboard/
├── frontend/              # React + Vite + Canvas client
│   └── src/
│       ├── canvas/        # CanvasEngine — rendering loop
│       ├── crdt/          # LWWRegister, LWWElementSet, UndoManager
│       ├── hooks/         # usePresence — live cursor hook
│       ├── network/       # WebSocketClient with offline queue
│       ├── storage/       # OfflineQueue (IndexedDB)
│       ├── tools/         # Tool interface + 7 tools (Strategy pattern)
│       ├── types/         # Shape, WSMessage, ToolType definitions
│       └── ui/            # React components (Canvas, Toolbar, Auth, Export, Presence)
├── backend/               # Node.js WebSocket + REST server
│   └── src/
│       ├── auth/          # AuthController (JWT), AuthMiddleware
│       ├── crdt/          # Server-side LWWRegister, LWWElementSet
│       ├── network/       # WebSocketServer
│       ├── rooms/         # RoomManager (presence, broadcast, state)
│       ├── storage/       # SQLiteStore (rooms), UserStore (auth)
│       └── types.ts       # Server-side Shape, WSMessage types
├── docs/                  # In-depth educational lessons
│   └── lessons/           # 7 lessons covering CRDTs → Auth
└── *.md                   # Root documentation (Architecture, Design, etc.)
```

### 3.1. Root Documentation
The root directory is rich with markdown files that guide the project's development and educational journey:
- `README.md`: The entry point, explaining what the project is and how to run it.
- `ARCHITECTURE.md`: Visualizes the data flow and module boundaries using Mermaid diagrams.
- `DESIGN.md`: Outlines the UI/UX design system, including CSS variables, typography, and cursor design.
- `ROADMAP.md`: The timeline of features across 6 phases.
- `KNOWLEDGE_GRAPH.md`: A mapping of distributed systems concepts and where they are taught.
- `LESSONS.md`: The master index for the curriculum (7 lessons).
- `PERFORMANCE.md` & `TESTING.md`: Define the performance targets and testing strategies.
- `INTERVIEW_PREP.md`: System design questions derived directly from building this app.
- `guide.md`: This file — the step-by-step build log.

### 3.2. Frontend (`/frontend`)
A modern React application built for high performance.

- **Tooling**: Uses **Vite** for fast bundling, **TypeScript** for type safety, and **Oxlint** for ultra-fast linting.
- **Configuration**: 
  - `vite.config.ts`: Standard React Vite configuration.
  - `tsconfig.*.json`: Multiple configs splitting app logic and node logic.
- **Source Code (`/frontend/src`)**:
  - `main.tsx` / `App.tsx`: Mounts the app, routes between `AuthScreen` and `CanvasBoard`.
  - `canvas/CanvasEngine.ts`: Manages the raw HTML5 Canvas rendering loop with 5 rendering layers (background, dot grid, shapes, selection handles, cursors).
  - `crdt/LWWRegister.ts`: The fundamental CRDT — a single value with timestamp + clientId for conflict resolution.
  - `crdt/LWWElementSet.ts`: A CRDT map of shapes, each independently mergeable.
  - `crdt/UndoManager.ts`: Local undo/redo stack using before/after snapshots.
  - `hooks/usePresence.ts`: React hook for live presence and cursor tracking.
  - `network/WebSocketClient.ts`: WebSocket connection with auto-reconnect, exponential backoff, and offline queue integration.
  - `storage/OfflineQueue.ts`: IndexedDB-based operation queue for offline support.
  - `tools/`: 7 tool classes implementing the Strategy pattern (Pen, Rectangle, Ellipse, Line, Text, Select, plus Tool interface).
  - `ui/`: React components — `AuthScreen`, `CanvasBoard`, `Toolbar`, `PresenceBar`, `ExportMenu`.
  - `index.css`: Global design tokens (CSS variables).

### 3.3. Backend (`/backend`)
A Node.js server combining REST API and WebSocket.

- **Tooling**: Uses **TypeScript** and runs via `ts-node-dev` for hot-reloading during development.
- **Source Code (`/backend/src`)**:
  - `index.ts`: Express app with CORS, JSON parsing, auth routes, and WebSocket attachment.
  - `auth/AuthController.ts`: REST endpoints for `/api/auth/register` and `/api/auth/login`.
  - `auth/AuthMiddleware.ts`: JWT verification for WebSocket upgrade requests.
  - `network/WebSocketServer.ts`: Handles incoming WS connections, authenticates via JWT, and routes messages.
  - `rooms/RoomManager.ts`: Groups connected clients, manages CRDT state, tracks presence, and persists to SQLite.
  - `storage/SQLiteStore.ts`: Persists room CRDT state to SQLite with debounced writes.
  - `storage/UserStore.ts`: Persists user accounts to SQLite (email, bcrypt hash).
  - `crdt/`: Server-side LWWRegister and LWWElementSet (mirrors frontend).

### 3.4. Lessons (`/docs/lessons`)
- `lesson-01-intro-to-crdts.md`: Distributed state, CAP theorem, CRDTs vs OT.
- `lesson-02-canvas-and-websockets.md`: Immediate Mode rendering, WebSockets.
- `lesson-03-crdt-implementation.md`: LWWRegister, LWWElementSet, convergence proofs.
- `lesson-04-presence-and-cursors.md`: Ephemeral state, cursor throttling.
- `lesson-05-shapes-and-tools.md`: Strategy pattern, hit testing, z-ordering.
- `lesson-06-offline-and-persistence.md`: IndexedDB, exponential backoff, SQLite.
- `lesson-07-auth-and-export.md`: JWT, bcrypt, WebSocket auth, export formats.

---

## 4. Current State & Next Steps

**Current Status**: The project is **feature-complete through Phase 6**. All core features are implemented: CRDT-based collaboration, multi-shape tools, offline support, persistence, authentication, export, and undo/redo.

**What's Next (Future Work)**:
1. **Operation Log & Vector Clocks** — Replace timestamps with vector clocks for causal ordering.
2. **Version History** — Time-travel through board snapshots.
3. **Performance Optimization** — Spatial indexing, dirty-rect rendering.
4. **Deployment** — Vercel (frontend) + Railway/Render (backend).

---

## 5. Development Workflow

To work on this codebase, you can use the convenience scripts defined in the root `package.json`:

1. Install all dependencies across both workspaces:
   ```bash
   npm run install:all
   ```
2. Start the backend (Port 3001):
   ```bash
   npm run dev:backend
   ```
3. Start the frontend (Port 5173):
   ```bash
   npm run dev:frontend
   ```
4. Open http://localhost:5173 — you'll see the login screen.
5. Register an account or click "Continue as Guest" to enter the whiteboard.

Explore the `docs/` and root markdown files as you build to understand the *why* behind the code!
