# 🏛️ Architecture

## High-Level Overview

```mermaid
graph TB
    subgraph Clients
        C1["Client A (React + Canvas)"]
        C2["Client B (React + Canvas)"]
        C3["Client C (React + Canvas)"]
    end

    subgraph Server
        WS["WebSocket Server (Node.js)"]
        RM[Room Manager]
        CRDT[CRDT Engine]
        STORE["State Store (In-Memory / PostgreSQL)"]
    end

    C1 <-->|WebSocket| WS
    C2 <-->|WebSocket| WS
    C3 <-->|WebSocket| WS
    WS --> RM
    RM --> CRDT
    CRDT --> STORE
```

## Data Flow

```mermaid
sequenceDiagram
    participant User as User Input
    participant Canvas as Canvas Layer
    participant CRDT as Local CRDT
    participant WS as WebSocket
    participant Server as Server CRDT
    participant Peers as Other Clients

    User->>Canvas: Draw shape
    Canvas->>CRDT: Generate operation
    CRDT->>CRDT: Apply locally (optimistic)
    CRDT->>WS: Send operation
    WS->>Server: Relay operation
    Server->>Server: Merge into server CRDT
    Server->>Peers: Broadcast to room
    Peers->>Peers: Merge into local CRDT
    Peers->>Canvas: Re-render
```

## Key Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Sync Model | CRDT (not OT) | No central ordering required, works offline |
| Transport | WebSocket | Full-duplex, low latency |
| Rendering | HTML5 Canvas | Direct pixel control, 60fps performance |
| State Shape | Flat map of shapes by ID | Simple CRDT merge, O(1) lookups |
| Persistence | In-memory → PostgreSQL | Start simple, add durability later |

## Module Boundaries

```
frontend/
├── src/
│   ├── canvas/       # Canvas rendering engine
│   ├── crdt/         # Client-side CRDT state
│   ├── network/      # WebSocket connection manager
│   ├── tools/        # Drawing tools (pen, shapes, text)
│   ├── ui/           # React UI components
│   └── types/        # Shared TypeScript types

backend/
├── src/
│   ├── rooms/        # Room lifecycle management
│   ├── crdt/         # Server-side CRDT engine
│   ├── network/      # WebSocket handler
│   ├── storage/      # Persistence layer
│   └── types/        # Shared TypeScript types
```

---

> This document is updated as new features are added.
