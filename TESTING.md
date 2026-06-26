# 🧪 Testing Strategy

## Philosophy

Every CRDT operation, every merge, every conflict resolution path must be tested. In distributed systems, bugs hide in edge cases that only appear under concurrency.

## Test Layers

| Layer | Tool | What We Test |
|---|---|---|
| Unit | Jest | CRDT operations, merge logic, individual functions |
| Integration | Jest + ws | WebSocket message flow, room lifecycle |
| E2E | Playwright (later) | Multi-client collaboration scenarios |
| Property-Based | fast-check (later) | CRDT mathematical properties (commutativity, idempotency) |

## CRDT-Specific Tests

Every CRDT implementation must pass:

1. **Commutativity**: `merge(A, B) === merge(B, A)`
2. **Associativity**: `merge(merge(A, B), C) === merge(A, merge(B, C))`
3. **Idempotency**: `merge(A, A) === A`
4. **Convergence**: All replicas reach the same state regardless of operation order

## Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests (when added)
cd frontend && npm test
```

---

> Updated as test suites are added.
