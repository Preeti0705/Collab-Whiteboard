# Development Guide: Collab Whiteboard

This guide outlines the step-by-step process used to build the Collab Whiteboard project from scratch. It serves as a continuous log of the commands run, code added, and project progression. We will keep this updated as we build further features.

---

## Phase 1: Project Scaffolding (Completed)

We started by setting up a monorepo structure with separated frontend and backend environments, along with comprehensive project documentation.

### 1. Root Setup
We created the root project folder and initialized a basic `package.json` to manage scripts for both the frontend and backend.

**Commands Run:**
```bash
mkdir collab-whiteboard
cd collab-whiteboard
npm init -y
```

**Added/Modified Code:**
* `package.json` at the root was updated with convenience scripts:
```json
{
  "name": "collab-whiteboard",
  "version": "0.1.0",
  "private": true,
  "description": "A collaborative whiteboard built with custom CRDTs, WebSockets, React Canvas, and TypeScript.",
  "scripts": {
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "install:all": "cd frontend && npm install && cd ../backend && npm install"
  }
}
```

### 2. Frontend Initialization
We set up a React application using Vite, configuring it for TypeScript and setting up initial styling variables for dark/light mode.

**Commands Run:**
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

**Added/Modified Code:**
* Created `frontend/src/index.css` and `frontend/src/App.tsx` with foundational styling.
* Set up standard Vite + React boilerplate.

### 3. Backend Initialization
We created a lightweight Node.js server to handle our backend logic, utilizing TypeScript.

**Commands Run:**
```bash
mkdir backend
cd backend
npm init -y
npm install typescript ts-node-dev @types/node --save-dev
npm install express
npm install @types/express --save-dev
npx tsc --init
```

**Added/Modified Code:**
* Created `backend/src/index.ts` with a basic HTTP server acting as a health check:
```typescript
import express from 'express';

const app = express();
const port = 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
```
* Configured `backend/tsconfig.json`.

### 4. Documentation Scaffold
To guide our educational journey and define the architecture, we added extensive documentation files at the root and in the `docs/` folder.

**Added Files:**
* `README.md`: Project overview and setup instructions.
* `ARCHITECTURE.md`: High-level system design.
* `DESIGN.md`: UI/UX tokens and styling rules.
* `ROADMAP.md`: Project progression timeline.
* `LESSONS.md` & `docs/lessons/lesson-01-intro-to-crdts.md`: CRDT theory and distributed systems educational material.
* `walkthrough.md`: A codebase walkthrough.

---

## Phase 2: Canvas & WebSockets (Completed)

We implemented the core real-time infrastructure by adding HTML5 Canvas rendering to the frontend and a WebSocket server to the backend.

### 1. Backend WebSocket Integration
We added the native `ws` library to handle persistent connections and room management.

**Commands Run:**
```bash
cd backend
npm install ws
npm install @types/ws --save-dev
```

**Added/Modified Code:**
* Created `backend/src/types.ts` to define shared `WSMessage` and `Stroke` types.
* Created `backend/src/rooms/RoomManager.ts` to handle grouping connections by room and broadcasting messages to peers.
* Created `backend/src/network/WebSocketServer.ts` to encapsulate the `ws` logic.
* Modified `backend/src/index.ts` to initialize `WebSocketServer` alongside the HTTP server.

### 2. Frontend Canvas Integration
We replaced the React boilerplate with a custom Canvas engine capable of drawing freehand strokes.

**Added/Modified Code:**
* Created `frontend/src/types/index.ts` matching the backend data structures.
* Created `frontend/src/network/WebSocketClient.ts` to handle connecting to the server and emitting/listening to JSON messages.
* Created `frontend/src/canvas/CanvasEngine.ts` utilizing `requestAnimationFrame` and a `CanvasRenderingContext2D` to draw the user's strokes efficiently.
* Created `frontend/src/ui/CanvasBoard.tsx` (and `.css`) as the main React component bridging pointer events, the canvas engine, and the WebSocket client.
* Modified `frontend/src/App.tsx` and `frontend/src/index.css` to render a full-screen canvas based on our design tokens.

### 3. Documentation
* Wrote `docs/lessons/lesson-02-canvas-and-websockets.md` to explain the theory behind Immediate Mode rendering and full-duplex WebSocket connections.

---

## Phase 3: CRDT Engine (Completed)

We implemented the core CRDT algorithms to ensure our collaborative state mathematically converges without conflicts.

### 1. The LWW-Register & Element Set
We created the basic CRDT classes in both `frontend/src/crdt` and `backend/src/crdt`.

**Added/Modified Code:**
* Created `LWWRegister.ts` to manage a single value with a timestamp and client ID for Last-Writer-Wins resolution.
* Created `LWWElementSet.ts` to hold a map of shapes, delegating conflict resolution down to the shape's properties.
* Updated `types.ts` so that `Stroke` uses `LWWRegister` for its `points` and `color`.

### 2. Upgrading the Real-time Engine
We moved away from raw array broadcasting to syncing CRDTs over the wire.

**Added/Modified Code:**
* Updated `CanvasEngine.ts` to render directly from an `LWWElementSet`.
* Updated `CanvasBoard.tsx` to handle `.toJSON()` and `fromJSON()` parsing of CRDT objects when sending over WebSockets.
* Updated `RoomManager.ts` on the backend so the server now acts as a true CRDT replica, maintaining authoritative state and syncing it to new clients when they connect.

### 3. Documentation
* Wrote `docs/lessons/lesson-03-crdt-implementation.md` to prove why our LWW algorithm works.

---

## Phase 4: Next Steps (Upcoming)

Our next priorities involve building a richer toolset:

1. **Shapes & Tools**: Abstracting the engine to support Rectangles, Ellipses, Text, and Selection tools.
2. **Offline Support**: Implementing IndexedDB persistence and reconciliation on reconnection.

*(This guide will be continually updated as we progress through these steps).*
