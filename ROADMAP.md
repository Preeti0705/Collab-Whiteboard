# 🗺️ Roadmap

## Phase 1: Foundation ✅
- [x] Project scaffolding (frontend + backend)
- [x] Documentation structure
- [x] Lesson 1: Introduction to Distributed State & CRDTs
- [x] Basic Canvas rendering (HTML5 Canvas API)
- [x] Freehand drawing on canvas

## Phase 2: Real-Time Core ✅
- [x] WebSocket server setup
- [x] Rooms — create, join, leave
- [x] Live collaboration — broadcast strokes to peers
- [x] Presence — who's online in a room
- [x] Live cursors — see other users' cursors

## Phase 3: CRDT Engine ✅
- [x] LWW-Register (Last-Writer-Wins) for simple properties
- [x] LWW-Element-Set for shape collections
- [x] State merging & conflict resolution
- [ ] Operation log & vector clocks *(future work)*
- [x] Undo / Redo (local snapshot-based)

## Phase 4: Shapes & Tools ✅
- [x] Rectangle tool
- [x] Ellipse tool
- [x] Line / Arrow tool
- [x] Text tool
- [x] Selection & transformation (move, resize, rotate)
- [x] Z-ordering

## Phase 5: Offline & Persistence ✅
- [x] Offline editing (IndexedDB queue)
- [x] Reconnection & state sync
- [x] SQLite persistence
- [ ] Version history & snapshots *(future work)*

## Phase 6: Polish ✅
- [x] Authentication (JWT)
- [x] Export (PNG, SVG, JSON)
- [x] Undo / Redo
- [x] Responsive UI
- [ ] Performance optimization (spatial indexing, dirty-rect rendering) *(future work)*
- [ ] Deployment (Vercel) *(planned)*

---
