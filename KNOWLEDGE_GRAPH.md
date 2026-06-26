# 🧬 Knowledge Graph

> Maps how distributed systems concepts connect and which lessons cover them.

```mermaid
graph TD
    DS["Distributed Systems"] --> CAP["CAP Theorem"]
    DS --> CONS["Consistency Models"]
    DS --> REP["Replication"]

    CAP --> EC["Eventual Consistency"]
    CONS --> SC["Strong Consistency"]
    CONS --> EC

    EC --> CRDT["CRDTs"]
    EC --> OT["Operational Transform"]

    CRDT --> SB["State-Based CRDTs"]
    CRDT --> OB["Op-Based CRDTs"]

    SB --> LWW["LWW-Register"]
    SB --> GSET["G-Set"]
    SB --> LWWSET["LWW-Element-Set"]
    OB --> COUNTER["G-Counter / PN-Counter"]

    REP --> SYNC["Synchronization"]
    SYNC --> VC["Vector Clocks"]
    SYNC --> LL["Lamport Timestamps"]

    CRDT --> MERGE["State Merging"]
    MERGE --> CONFLICT["Conflict Resolution"]

    DS --> OFFLINE["Offline Editing"]
    OFFLINE --> QUEUE["Operation Queue"]
    OFFLINE --> RECON["Reconnection Sync"]

    DS --> TRANSPORT["Transport Layer"]
    TRANSPORT --> WS["WebSockets"]
    WS --> ROOMS["Rooms / Channels"]
    WS --> PRESENCE["Presence"]
    WS --> CURSORS["Live Cursors"]

    style CRDT fill:#89b4fa,stroke:#333,color:#1e1e2e
    style CAP fill:#f38ba8,stroke:#333,color:#1e1e2e
    style EC fill:#a6e3a1,stroke:#333,color:#1e1e2e
    style WS fill:#fab387,stroke:#333,color:#1e1e2e
```

## Concept → Lesson Mapping

| Concept | Lesson | Status |
|---|---|---|
| CAP Theorem | Lesson 1 | 📖 In Progress |
| Eventual Consistency | Lesson 1 | 📖 In Progress |
| CRDTs vs OT | Lesson 1 | 📖 In Progress |
| State-Based CRDTs | Lesson 3 (planned) | ⏳ Planned |
| Op-Based CRDTs | Lesson 3 (planned) | ⏳ Planned |
| WebSockets | Lesson 2 (planned) | ⏳ Planned |
| Rooms | Lesson 2 (planned) | ⏳ Planned |
| Vector Clocks | Lesson 3 (planned) | ⏳ Planned |
| Offline Editing | Lesson 5 (planned) | ⏳ Planned |

---

> Updated as new concepts are introduced.
