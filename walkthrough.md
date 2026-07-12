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

The system follows a classic client-server model but utilizes distributed state synchronization:

- **Clients (Frontend)**: React applications rendering on an HTML5 Canvas. Each client holds a local **replica** of the whiteboard state.
- **Server (Backend)**: A Node.js WebSocket server that acts as a relay and holds the authoritative server replica.
- **State Synchronization**: Uses CRDTs over WebSockets. When a user draws, the local state is updated optimistically (instantly). The operation is then sent to the server, which broadcasts it to other peers. 

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
├── frontend/          # React + Vite + Canvas client
├── backend/           # Node.js WebSocket server
├── docs/              # In-depth educational lessons
└── *.md               # Root documentation (Architecture, Design, etc.)
```

### 3.1. Root Documentation
The root directory is rich with markdown files that guide the project's development and educational journey:
- `README.md`: The entry point, explaining what the project is and how to run it.
- `ARCHITECTURE.md`: Visualizes the data flow and module boundaries using Mermaid diagrams.
- `DESIGN.md`: Outlines the UI/UX design system, including CSS variables, typography, and cursor design.
- `ROADMAP.md`: The timeline of features (currently in Phase 1: Foundation).
- `KNOWLEDGE_GRAPH.md`: A mapping of distributed systems concepts and where they are taught.
- `LESSONS.md`: The master index for the curriculum.
- `PERFORMANCE.md` & `TESTING.md`: Define the performance targets (e.g., 60fps, <50ms latency) and testing strategies (unit, integration, property-based testing).
- `INTERVIEW_PREP.md`: System design questions derived directly from building this app.

### 3.2. Frontend (`/frontend`)
A modern React application built for high performance.

- **Tooling**: Uses **Vite** for fast bundling, **TypeScript** for type safety, and **Oxlint** for ultra-fast linting.
- **Configuration**: 
  - `vite.config.ts`: Standard React Vite configuration.
  - `tsconfig.*.json`: Multiple configs splitting app logic and node logic.
- **Source Code (`/frontend/src`)**:
  - `main.tsx` / `App.tsx`: Mounts the `<CanvasBoard />` component.
  - `canvas/CanvasEngine.ts`: Manages the raw HTML5 Canvas rendering loop.
  - `network/WebSocketClient.ts`: Manages the connection to the backend.
  - `index.css`: Global design tokens.

### 3.3. Backend (`/backend`)
A lightweight Node.js server.

- **Tooling**: Uses **TypeScript** and runs via `ts-node-dev` for hot-reloading during development.
- **Source Code (`/backend/src`)**:
  - `index.ts`: Integrates an Express HTTP server with a WebSocket server (`ws`).
  - `network/WebSocketServer.ts`: Handles incoming WS connections and message parsing.
  - `rooms/RoomManager.ts`: Groups connected clients and broadcasts real-time events.

### 3.4. Lessons (`/docs/lessons`)
- `lesson-01-intro-to-crdts.md`: A massive, in-depth guide on distributed state. It breaks down the CAP theorem, consistency models, how industry leaders like Figma handle collaboration, and explains why this project uses a Last-Writer-Wins (LWW) Register approach per property.

---

## 4. Current State & Next Steps

**Current Status**: The project is at **Phase 3: CRDT Engine**. The foundational LWWRegister and LWWElementSet have been implemented, meaning the collaborative state now converges deterministically without data loss.

**What's Next (Phase 4)**:
1. **Shapes & Tools**: Abstracting the engine to support Rectangles, Ellipses, Text, and Selection tools.
2. **Offline Support**: Implementing IndexedDB persistence and reconciliation on reconnection.

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

Explore the `docs/` and root markdown files as you build to understand the *why* behind the code!
