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

## Phase 4: Shapes & Tools (Completed)

We generalized the canvas from freehand-only to supporting multiple shape types using the **Strategy Pattern** for tools.

### 1. Tool Interface & Strategy Pattern
We defined an abstract `Tool` interface that all drawing tools implement, allowing the `CanvasBoard` to delegate pointer events to the active tool.

**Added/Modified Code:**
* Created `frontend/src/tools/Tool.ts` — The abstract interface defining `onPointerDown`, `onPointerMove`, `onPointerUp`.
* Created `frontend/src/tools/PenTool.ts` — The original freehand drawing, refactored into the tool pattern.

### 2. Shape Tools
Each shape tool creates shapes with different `shapeType` values and point semantics.

**Added/Modified Code:**
* Created `frontend/src/tools/RectangleTool.ts` — Click-and-drag rectangle with bounding box normalization.
* Created `frontend/src/tools/EllipseTool.ts` — Ellipse inscribed in a bounding box.
* Created `frontend/src/tools/LineTool.ts` — Straight line and arrow (reused with a `isArrow` flag).
* Created `frontend/src/tools/TextTool.ts` — Click to place text, triggers a text input overlay in the UI.

### 3. Select Tool & Hit-Testing
The select tool allows users to click on shapes, move them, and delete them.

**Added/Modified Code:**
* Created `frontend/src/tools/SelectTool.ts` — Hit-tests shapes by bounding box (reverse z-order), supports drag-to-move, and soft-delete via the CRDT `isDeleted` flag.

### 4. Generalizing the Shape Model
We extended the `Shape` class and `CanvasEngine` to support all shape types.

**Added/Modified Code:**
* Updated `frontend/src/types/index.ts`:
  - Added `ShapeType` union: `'freehand' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'text'`
  - Added `ToolType` union for the toolbar
  - Added `fillColor`, `strokeWidth`, `text`, `zIndex`, `isDeleted` LWW-Register properties to `Shape`
  - Added `getBounds()` method for hit-testing
  - Added backward compatibility alias `Stroke = Shape`
* Updated `backend/src/types.ts` to mirror the frontend shape model exactly.
* Updated `frontend/src/canvas/CanvasEngine.ts`:
  - Added rendering methods for each shape type: `drawRectangle`, `drawEllipse`, `drawLine`, `drawArrow`, `drawText`
  - Added `drawSelectionHandles()` for the dashed border + corner handles
  - Added z-order sorting in `drawShapes()`

### 5. Toolbar UI
A floating glassmorphism toolbar with tool buttons, color picker, and stroke width slider.

**Added/Modified Code:**
* Created `frontend/src/ui/Toolbar.tsx` — Tool buttons with keyboard shortcuts, color palette, stroke width slider, conditional delete button.
* Created `frontend/src/ui/Toolbar.css` — Glassmorphism styling with hover/active states.
* Updated `frontend/src/ui/CanvasBoard.tsx`:
  - Integrated the `Toolbar` component
  - Added tool switching via `toolMapRef` (Strategy pattern)
  - Added keyboard shortcuts: V=select, P=pen, R=rect, O=ellipse, L=line, A=arrow, T=text
  - Added text input overlay for the TextTool
  - Added delete handling via Delete/Backspace keys

### 6. Presence System
We added live cursor tracking and an online users bar.

**Added/Modified Code:**
* Created `frontend/src/hooks/usePresence.ts` — React hook managing presence state, cursor throttling (30ms), and WebSocket message handling for `presence_update`, `peer_joined`, `peer_left`, `peer_cursor`.
* Created `frontend/src/ui/PresenceBar.tsx` (and `.css`) — Bottom bar showing room name, online user avatars, and user count.
* Updated `frontend/src/canvas/CanvasEngine.ts` — Added `drawCursors()` with colored pointer arrows and name badges.
* Updated `backend/src/rooms/RoomManager.ts`:
  - Added `roomPresence` map tracking `UserPresence` objects
  - Added `colorCounters` for rotating cursor colors from `PEER_COLORS` palette
  - Added `updateCursor()` for relaying cursor positions
  - Added presence broadcasts on join/leave

### 7. Documentation
* Wrote `docs/lessons/lesson-04-presence-and-cursors.md` — Ephemeral vs persistent state, cursor throttling.
* Wrote `docs/lessons/lesson-05-shapes-and-tools.md` — Strategy pattern, generic shape model, hit testing.

---

## Phase 5: Offline & Persistence (Completed)

We added offline support on the frontend and database persistence on the backend.

### 1. Frontend: IndexedDB Offline Queue
When the WebSocket disconnects, operations are buffered in IndexedDB and replayed on reconnect.

**Added/Modified Code:**
* Created `frontend/src/storage/OfflineQueue.ts`:
  - Opens an IndexedDB database `collab_whiteboard` with store `pending_ops`
  - `enqueue(op)` — stores operations when offline
  - `drain()` — returns and clears all buffered operations on reconnect
  - `count()` — returns the number of pending operations

### 2. Frontend: WebSocket Auto-Reconnect
Exponential backoff prevents hammering the server when it's down.

**Added/Modified Code:**
* Updated `frontend/src/network/WebSocketClient.ts`:
  - Added `OfflineQueue` integration: messages go to the queue when disconnected
  - Added exponential backoff reconnection: 1s → 2s → 4s → ... → max 30s
  - Added `drainOfflineQueue()` on reconnect — replays all buffered operations
  - Added `onConnectionChange()` callback for UI status indicators
  - Added `getConnectionStatus()` method

### 3. Backend: SQLite Persistence
Room state is persisted to a SQLite database so data survives server restarts.

**Commands Run:**
```bash
cd backend
npm install better-sqlite3
npm install @types/better-sqlite3 --save-dev
```

**Added/Modified Code:**
* Created `backend/src/storage/SQLiteStore.ts`:
  - SQLite database at `backend/collab.db`
  - Schema: `rooms (roomId TEXT PK, state TEXT, updated_at INTEGER)`
  - `saveRoom()` — immediate write
  - `scheduleSave()` — debounced write (5 second window to batch rapid changes)
  - `loadRoom()` — restores LWWElementSet from JSON
  - WAL mode enabled for better concurrent read/write performance
* Updated `backend/src/network/WebSocketServer.ts`:
  - Creates and owns the `SQLiteStore` instance
  - Passes it to `RoomManager`
* Updated `backend/src/rooms/RoomManager.ts`:
  - Loads persisted state from SQLite on room creation
  - Calls `store.scheduleSave()` after every `draw_shape` broadcast
  - Calls `store.saveRoom()` when the last user leaves (full persist before cleanup)

### 4. Documentation
* Wrote `docs/lessons/lesson-06-offline-and-persistence.md` — IndexedDB, exponential backoff, SQLite, debounced writes.

---

## Phase 6: Polish & Authentication (Completed)

We added user authentication, canvas export, undo/redo, and responsive UI.

### 1. Backend: JWT Authentication

**Commands Run:**
```bash
cd backend
npm install @types/bcrypt @types/jsonwebtoken @types/express --save-dev
```
(Note: `bcrypt`, `jsonwebtoken`, and `express` were already installed as dependencies.)

**Added/Modified Code:**
* Created `backend/src/storage/UserStore.ts`:
  - SQLite table: `users (id TEXT PK, email TEXT UNIQUE, displayName TEXT, passwordHash TEXT, created_at INTEGER)`
  - `createUser()` — inserts a new user with bcrypt hash
  - `findByEmail()` — looks up user by email (for login)
  - `findById()` — looks up user by ID (for JWT validation)
* Created `backend/src/auth/AuthController.ts`:
  - `POST /api/auth/register` — validates input, hashes password with bcrypt (12 rounds), creates user, returns JWT
  - `POST /api/auth/login` — verifies credentials, returns JWT
  - JWT payload: `{ userId, displayName, email }`, expires in 7 days
  - JWT secret configurable via `JWT_SECRET` env var
* Created `backend/src/auth/AuthMiddleware.ts`:
  - `verifyToken(token)` — verifies JWT and returns payload
  - `authenticateWsUpgrade(req)` — extracts JWT from `?token=` query parameter on WebSocket upgrade
* Modified `backend/src/index.ts`:
  - Replaced raw `http.createServer` with Express app
  - Added `express.json()` middleware for POST body parsing
  - Added CORS headers (allows frontend at port 5173)
  - Mounted auth router at `/api/auth`
  - Created `UserStore` instance at startup
* Modified `backend/src/network/WebSocketServer.ts`:
  - Imports `authenticateWsUpgrade` from auth middleware
  - On connection, extracts JWT from upgrade request
  - Maps `WebSocket → TokenPayload` for authenticated users
  - On `join` message, overrides userId/displayName from JWT if authenticated
  - Anonymous connections still work (for development/guest access)
* Modified `backend/src/rooms/RoomManager.ts`:
  - `joinRoom()` now accepts optional `displayName` parameter
  - Uses JWT display name if provided, falls back to userId

### 2. Frontend: Auth Screen

**Added/Modified Code:**
* Created `frontend/src/ui/AuthScreen.tsx`:
  - Two-tab layout: Login / Register
  - Form fields: email, display name (register only), password
  - Calls `POST /api/auth/register` or `/api/auth/login`
  - Stores JWT and user info in `localStorage`
  - "Continue as Guest" button for development convenience
  - Error handling with inline error messages
* Created `frontend/src/ui/AuthScreen.css`:
  - Glassmorphism card design matching the overall dark theme
  - Gradient accent button, smooth fade-in animation
  - Focus states with accent-colored glow
  - Responsive tab switching
* Modified `frontend/src/App.tsx`:
  - Now acts as an auth router: shows `AuthScreen` when not logged in, `CanvasBoard` when authenticated
  - Restores session from `localStorage` on mount
  - Passes `userId`, `displayName`, `token`, and `onLogout` to `CanvasBoard`
* Modified `frontend/src/ui/CanvasBoard.tsx`:
  - Now receives `userId`, `displayName`, `token`, and `onLogout` as props (no more random user IDs)
  - Appends `?token=jwt` to WebSocket URL when authenticated
  - Passes `displayName` and `onLogout` to `PresenceBar`
  - Tracks `isConnected` state via `wsClient.onConnectionChange()`
* Updated `frontend/index.html`:
  - Added Google Fonts (Inter) preconnect and stylesheet link
  - Updated title to "Collab Whiteboard"
  - Added meta description for SEO

### 3. Export (PNG, SVG, JSON)

**Added/Modified Code:**
* Created `frontend/src/ui/ExportMenu.tsx`:
  - Dropdown menu triggered by a floating button (top-right)
  - **PNG Export**: `canvas.toBlob()` → triggers browser download
  - **SVG Export**: Iterates all shapes, converts each to SVG elements (path, rect, ellipse, line, polygon, text), wraps in `<svg>` document
  - **JSON Export**: `state.toJSON()` → prettified JSON download
  - Closes on outside click
* Created `frontend/src/ui/ExportMenu.css`:
  - Glassmorphism dropdown matching toolbar design
  - Smooth slide-in animation
* Modified `frontend/src/ui/CanvasBoard.tsx`:
  - Added `ExportMenu` component, passing `canvasRef` and current CRDT state

### 4. Undo/Redo

**Added/Modified Code:**
* Created `frontend/src/crdt/UndoManager.ts`:
  - Local undo/redo stack (per-user, not CRDT-managed)
  - Each entry stores `{ shapeId, before, after }` — snapshots of the shape before and after the operation
  - `record()` — captures an operation (clears redo stack)
  - `undo()` — pops from undo stack, pushes to redo, restores "before" state
  - `redo()` — pops from redo stack, pushes to undo, restores "after" state
  - Stack capped at 50 entries to prevent unbounded memory growth
  - Undo of a new shape → soft-deletes it; undo of a move → restores previous position
* Modified `frontend/src/ui/CanvasBoard.tsx`:
  - Integrated `UndoManager` with pointer event lifecycle
  - Records shape state before and after each operation
  - Keyboard shortcuts: `Ctrl+Z` for undo, `Ctrl+Shift+Z` / `Ctrl+Y` for redo
  - Broadcasts undone/redone shapes to peers via WebSocket
* Modified `frontend/src/ui/Toolbar.tsx`:
  - Added undo (↩) and redo (↪) buttons with disabled state
  - New props: `onUndo`, `onRedo`, `canUndo`, `canRedo`

### 5. Responsive UI & Polish

**Added/Modified Code:**
* Updated `frontend/src/ui/Toolbar.css`:
  - Added disabled button style (`.toolbar__btn--disabled`, `.toolbar__btn:disabled`)
  - Added `@media (max-width: 768px)` breakpoint: smaller buttons, compact color picker
  - Added `@media (max-width: 480px)` breakpoint: hides color picker and width slider entirely
* Updated `frontend/src/ui/PresenceBar.tsx`:
  - Added `isConnected` prop → green/red dot for connection status
  - Added `displayName` prop → shows real name instead of user ID
  - Added logout button with hover-to-red styling
* Updated `frontend/src/ui/PresenceBar.css`:
  - Added `.presence-bar__room-dot--offline` (red dot, no pulse animation)
  - Added `.presence-bar__logout` button styling
  - Added `@media (max-width: 600px)` breakpoint: hides count, smaller avatars

### 6. Documentation
* Wrote `docs/lessons/lesson-07-auth-and-export.md` — JWT theory, bcrypt hashing, WebSocket auth patterns, export formats.

---

## Phase 7: Future Work

The following items are marked for future implementation:

1. **Operation Log & Vector Clocks** — Replace timestamps with vector clocks for more precise causal ordering.
2. **Version History & Snapshots** — Allow users to view and restore previous board states.
3. **Performance Optimization** — Spatial indexing (quadtree), dirty-rect rendering, operation batching.
4. **Deployment** — Deploy frontend to Vercel, backend to Railway/Render.

*(This guide will be continually updated as we progress through these steps).*
