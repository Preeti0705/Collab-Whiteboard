# 🗺️ Roadmap

## Phase 1: Foundation (Current)
- [x] Project scaffolding (frontend + backend)
- [x] Documentation structure
- [x] Lesson 1: Introduction to Distributed State & CRDTs
- [x] Basic Canvas rendering (HTML5 Canvas API)
- [x] Freehand drawing on canvas

## Phase 2: Real-Time Core
- [x] WebSocket server setup
- [x] Rooms — create, join, leave
- [x] Live collaboration — broadcast strokes to peers
- [ ] Presence — who's online in a room
- [ ] Live cursors — see other users' cursors

## Phase 3: CRDT Engine
- [x] LWW-Register (Last-Writer-Wins) for simple properties
- [x] LWW-Element-Set for shape collections
- [ ] Operation log & vector clocks
- [x] State merging & conflict resolution
- [ ] Undo / Redo with CRDTs

## Phase 4: Shapes & Tools
- [ ] Rectangle tool
- [ ] Ellipse tool
- [ ] Line / Arrow tool
- [ ] Text tool
- [ ] Selection & transformation (move, resize, rotate)
- [ ] Z-ordering

## Phase 5: Offline & Persistence
- [ ] Offline editing (IndexedDB queue)
- [ ] Reconnection & state sync
- [ ] PostgreSQL persistence
- [ ] Version history & snapshots

## Phase 6: Polish
- [ ] Authentication (JWT)
- [ ] Export (PNG, SVG, JSON)
- [ ] Performance optimization (spatial indexing, dirty-rect rendering)
- [ ] Responsive UI
- [ ] Deployment

---

> Each bullet becomes a lesson in [LESSONS.md](./LESSONS.md).
