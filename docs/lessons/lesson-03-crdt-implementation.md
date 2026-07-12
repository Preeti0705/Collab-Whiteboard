# Lesson 3: Building the CRDT Engine

> **Goal**: Replace simple arrays with Conflict-free Replicated Data Types to mathematically guarantee that our whiteboard state converges perfectly across all clients, regardless of network delays or offline edits.

---

## The Need for CRDTs

In Phase 2, we built a real-time drawing engine. When you draw, it broadcasts an array of points to everyone else.
This works fine for a simple "pen" tool where every stroke is immutable. 

But what happens when we introduce a "Select" tool?
Imagine a rectangle on the screen.
- **Alice** selects it and changes its color to **Red** at timestamp 100.
- **Bob** (who is offline on a train) selects it and changes its color to **Blue** at timestamp 100.
- Bob reconnects. The server receives both operations. 

Who wins? Without a CRDT, the state becomes corrupted. Alice might see Red, Bob might see Blue, and new users might see Red. The system diverges.

## 1. The LWW-Register (Last Writer Wins)

A Register is the simplest CRDT. It holds a single value.
To resolve conflicts, we attach a **timestamp** and a **client ID** to the value.

```typescript
export class LWWRegister<T> {
  public value: T;
  public timestamp: number;
  public clientId: string;

  public merge(remote: LWWRegister<T>): void {
    if (remote.timestamp > this.timestamp) {
      // Remote is newer, it wins
      this.value = remote.value;
      this.timestamp = remote.timestamp;
      this.clientId = remote.clientId;
    } else if (remote.timestamp === this.timestamp) {
      // Tie breaker: string comparison on clientId
      if (remote.clientId > this.clientId) {
        this.value = remote.value;
        this.timestamp = remote.timestamp;
        this.clientId = remote.clientId;
      }
    }
  }
}
```

### Proving Correctness (The Math)
A CRDT merge function must be:
1. **Commutative** `merge(A, B) == merge(B, A)`
2. **Associative** `merge(merge(A, B), C) == merge(A, merge(B, C))`
3. **Idempotent** `merge(A, A) == A`

Because standard mathematical comparisons (`>`) and deterministic tie-breakers (string sorting) are transitive and commutative, our `LWWRegister` perfectly satisfies these requirements!

## 2. Granularity: Per-Property vs Per-Object

If Alice moves the rectangle (changes X/Y) and Bob changes its color, we want **both** changes to survive.
If we put an LWW-Register on the *entire* shape, then whoever clicked last would overwrite the other person's work (e.g., Alice's move would undo Bob's color change).

Therefore, we place the `LWWRegister` on *every single property*:

```typescript
export class Stroke {
  public id: string;
  public points: LWWRegister<Point[]>;
  public color: LWWRegister<string>;
  
  public merge(remote: Stroke) {
    this.points.merge(remote.points);
    this.color.merge(remote.color);
  }
}
```

Now, the `points` and the `color` resolve conflicts completely independently!

## 3. The LWW-Element-Set

The whiteboard itself is just a collection of shapes. We manage this using an `LWWElementSet`.
It is essentially a Map of `Shape ID -> Shape`.

When we receive an update from the network:
1. We check if the Shape ID exists.
2. If it does not exist, we add it.
3. If it DOES exist, we call `.merge()` on it, which delegates down to the `LWWRegister`s.

## 4. Server as a Replica

In Phase 2, the server was just a dumb relay (a router). It took messages and blindly forwarded them.
In Phase 3, the server now maintains an authoritative `LWWElementSet` for every room.
When a user connects, the server sends them the full synchronized CRDT state. This allows late-joiners to see the entire whiteboard instantly.

---

## Next Steps
With the CRDT foundation laid, we can safely introduce offline queues and more complex shapes (Rectangles, Text) knowing our data architecture is rock solid!
