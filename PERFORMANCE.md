# ⚡ Performance

## Targets

| Metric | Target | Notes |
|---|---|---|
| Canvas render | 60 fps | No dropped frames during drawing |
| Operation latency | < 50ms | Local apply must feel instant |
| Network sync | < 200ms | Other users see changes quickly |
| Memory (1000 shapes) | < 50MB | CRDT state stays lean |
| Reconnection sync | < 2s | Fast catch-up after offline |

## Optimization Techniques (Planned)

- **Dirty-rect rendering**: Only repaint changed regions of canvas
- **Spatial indexing**: R-tree / quadtree for hit-testing and viewport culling
- **Operation batching**: Batch WebSocket messages per animation frame
- **State compaction**: Garbage-collect tombstoned CRDT entries
- **Canvas layering**: Separate layers for static shapes vs. active drawing

## Benchmarks

> Benchmarks will be recorded here as features are implemented.

| Date | Feature | Metric | Result |
|---|---|---|---|
| — | — | — | — |

---

> Updated with each performance-related change.
