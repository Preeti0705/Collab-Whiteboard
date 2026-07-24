# 📋 Changelog

All notable changes to this project will be documented in this file.

## [0.6.0] - 2026-07-24

### Added
- **Authentication**: JWT-based login/register with bcrypt password hashing
- **Auth Screen**: Glassmorphism login/register form with guest access
- **Export Menu**: Download canvas as PNG, SVG, or JSON
- **Undo/Redo**: Local undo/redo stack with Ctrl+Z / Ctrl+Shift+Z shortcuts
- **Connection Status**: Live green/red dot in presence bar
- **Logout**: Logout button in presence bar, clears session
- **Responsive UI**: Toolbar and presence bar adapt to small screens
- **Google Fonts**: Inter font loaded from Google Fonts CDN
- **Lesson 7**: Authentication & Export educational material

### Changed
- `App.tsx` now routes between AuthScreen and CanvasBoard
- `CanvasBoard.tsx` receives auth props instead of generating random user IDs
- `WebSocketServer.ts` authenticates via JWT query parameter
- `RoomManager.ts` uses display name from JWT token
- `PresenceBar` shows display name, connection status, and logout
- `Toolbar` includes undo/redo buttons with disabled state
- `index.html` has SEO meta tags, proper title, font preconnect
- Backend `index.ts` replaced with Express app (CORS, JSON parsing, auth routes)

## [0.5.0] - 2026-07-20

### Added
- **Offline Queue**: IndexedDB-based operation buffering when disconnected
- **Auto-Reconnect**: Exponential backoff (1s → 30s max) on WebSocket disconnect
- **SQLite Persistence**: Room CRDT state persisted to `collab.db`
- **Debounced Writes**: SQLite writes batched at 5-second intervals
- Lesson 6: Offline & Persistence

## [0.4.0] - 2026-07-15

### Added
- **Shape Tools**: Rectangle, Ellipse, Line/Arrow, Text tools
- **Select Tool**: Click to select, drag to move, Delete to remove
- **Tool Interface**: Strategy pattern for tool switching
- **Toolbar**: Floating glassmorphism bar with tool buttons, color picker, stroke width slider
- **Z-ordering**: Shapes rendered in z-order, new shapes go on top
- **Hit-testing**: Bounding box collision detection for selection
- **Presence System**: Live cursors with colored pointers and name badges
- **Presence Bar**: Bottom bar showing online users
- Lessons 4–5: Presence & Cursors, Shapes & Tools

### Changed
- `Shape` class generalized from `Stroke` (backward-compatible alias kept)
- `CanvasEngine` now renders 6 shape types + selection handles + cursors
- Backend types mirror frontend Shape model

## [0.3.0] - 2026-07-10

### Added
- **CRDT Engine**: LWWRegister and LWWElementSet implementations
- Shape properties wrapped in LWW-Registers for per-property conflict resolution
- Server acts as authoritative CRDT replica
- New client sync: full state sent on join
- Lesson 3: CRDT Implementation

## [0.2.0] - 2026-07-05

### Added
- **Canvas Engine**: HTML5 Canvas with requestAnimationFrame render loop
- **WebSocket Server**: `ws` library with room-based broadcasting
- **Room Manager**: Join/leave rooms, broadcast to peers
- **WebSocket Client**: Frontend connection manager
- Lesson 2: Canvas & WebSockets

## [0.1.0] - 2026-06-26

### Added
- Project scaffolding: frontend (React + Vite + TypeScript) and backend (Node + TypeScript)
- Root convenience scripts (`dev:frontend`, `dev:backend`, `install:all`)
- Documentation structure: README, ROADMAP, ARCHITECTURE, DESIGN, LESSONS, KNOWLEDGE_GRAPH, TESTING, PERFORMANCE, INTERVIEW_PREP
- Lesson 1: Introduction to Distributed State & CRDTs
