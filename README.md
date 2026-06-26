# 🎨 Collab Whiteboard

A **production-quality collaborative whiteboard** built from scratch with custom CRDTs, WebSockets, React Canvas, and TypeScript.

> **Purpose**: Learn distributed systems by building — not by reading. Every feature is a lesson in concurrency, replication, and conflict resolution.

---

## 🧠 What You'll Learn

| Concept | Where It Appears |
|---|---|
| CRDTs (Conflict-free Replicated Data Types) | Core state engine |
| Operational Transform vs CRDTs | Design decisions |
| Eventual Consistency | Multi-client sync |
| Conflict Resolution | Concurrent shape edits |
| Offline Editing | Local-first architecture |
| WebSockets | Real-time transport |
| Canvas Rendering | 60fps drawing engine |
| Replication & Synchronization | State convergence |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Canvas API, TypeScript |
| Backend | Node.js, TypeScript, WebSocket |
| Database | PostgreSQL (later) / In-memory (now) |
| Protocol | Custom CRDT over WebSocket |

---

## 📁 Project Structure

```
collab-whiteboard/
├── frontend/          # React + Vite + Canvas
│   └── src/
├── backend/           # Node + WebSocket server
│   └── src/
├── docs/              # Extended documentation
├── ROADMAP.md         # Feature timeline
├── ARCHITECTURE.md    # System design
├── DESIGN.md          # UI/UX design system
├── LESSONS.md         # Master lesson index
├── KNOWLEDGE_GRAPH.md # Concept dependency graph
├── TESTING.md         # Test strategy
├── PERFORMANCE.md     # Benchmarks & optimization
├── INTERVIEW_PREP.md  # System design Q&A
└── CHANGELOG.md       # Version history
```

---

## 🚀 Quick Start

```bash
# Install all dependencies
npm run install:all

# Start the backend (port 3001)
npm run dev:backend

# Start the frontend (port 5173)
npm run dev:frontend
```

---

## 📖 Learning Path

See [LESSONS.md](./LESSONS.md) for the full curriculum.  
See [ROADMAP.md](./ROADMAP.md) for the feature timeline.

---

## 🤝 Philosophy

- **No CRDT libraries** — we build our own from scratch.
- **One feature at a time** — each feature is a distributed systems lesson.
- **Explain first, code second** — theory always precedes implementation.
- **Production quality** — this is a portfolio project, not a toy.

---

## 📄 License

MIT
