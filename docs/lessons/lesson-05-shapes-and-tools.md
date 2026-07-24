# Lesson 5: Shapes & Tools â€” The Strategy Pattern

> **What you'll learn**: How to extend a drawing app beyond freehand strokes to support rectangles, ellipses, lines, arrows, and text â€” all backed by CRDTs.

---

## ELI12

Imagine a toolbox. Right now our whiteboard only has a pencil. But we want scissors, a ruler, a protractor, and a highlighter too. The trick is: **each tool works the same way** (click, drag, release) but **produces different results**.

So we build a system where the whiteboard says: "I don't care WHAT tool you are. Just tell me what shape to draw when the user clicks and drags." This is called the **Strategy Pattern**.

---

## University Level: The Strategy Pattern

The Strategy Pattern is a behavioral design pattern where you define a family of algorithms, encapsulate each one in a class, and make them interchangeable at runtime.

```typescript
interface Tool {
  onPointerDown(pos, state, userId, color, strokeWidth, zIndex): Shape | null;
  onPointerMove(pos, state, currentShape): Shape | null;
  onPointerUp(pos, state, currentShape): Shape | null;
}
```

Each tool (PenTool, RectangleTool, EllipseTool, etc.) implements this interface. The `CanvasBoard` component holds a reference to the active tool and delegates all pointer events to it:

```typescript
const tool = toolMap[activeTool]; // e.g., toolMap['rectangle']
tool.onPointerDown(pos, state, ...);
```

Switching tools is just changing a pointer â€” no complex conditional logic.

---

## The Shape Model

We replaced the old `Stroke` class with a generic `Shape`:

```typescript
class Shape {
  id: string;
  shapeType: LWWRegister<ShapeType>;      // 'freehand' | 'rectangle' | 'ellipse' | ...
  points: LWWRegister<Point[]>;           // semantics vary by type
  color: LWWRegister<string>;
  fillColor: LWWRegister<string>;
  strokeWidth: LWWRegister<number>;
  text: LWWRegister<string>;              // only for 'text' shapes
  zIndex: LWWRegister<number>;            // rendering order
  isDeleted: LWWRegister<boolean>;        // CRDT tombstone
}
```

### Why every property is an LWWRegister

Each property merges **independently**. If User A changes a rectangle's color while User B moves it, neither operation is lost â€” the color register and points register merge separately.

### Point semantics by shape type

| Shape Type | Points Array Meaning |
|---|---|
| freehand | All pen stroke points `[p1, p2, p3, ...]` |
| rectangle | Bounding box `[topLeft, bottomRight]` |
| ellipse | Bounding box `[topLeft, bottomRight]` |
| line | `[start, end]` |
| arrow | `[start, end]` |
| text | `[position]` (single point) |

---

## Hit Testing

The SelectTool needs to determine which shape the user clicked on. We use **bounding box hit testing**:

```typescript
const bounds = shape.getBounds();
const padding = Math.max(shape.strokeWidth.value, 8);

if (
  pos.x >= bounds.minX - padding &&
  pos.x <= bounds.maxX + padding &&
  pos.y >= bounds.minY - padding &&
  pos.y <= bounds.maxY + padding
) {
  return shape; // HIT!
}
```

We iterate shapes in **reverse z-order** (top to bottom) so the topmost shape under the cursor is selected first.

---

## Z-Ordering

Every shape has a `zIndex: LWWRegister<number>`. Shapes with lower z-index are drawn first (appear behind). New shapes get `zIndex = max + 1` so they appear on top.

The CRDT handles z-index conflicts: if two users create shapes simultaneously, the LWW-Register ensures a deterministic order.

---

## Soft Delete (Tombstones)

In CRDTs, you can't truly delete elements because remote replicas might still have pending updates for them. Instead, we **soft delete**: set `isDeleted = true`.

```typescript
// LWWElementSet.values() filters out deleted shapes:
public values(): Shape[] {
  return Array.from(this.elements.values())
    .filter(s => !s.isDeleted.value)
    .sort((a, b) => a.zIndex.value - b.zIndex.value);
}
```

The `isDeleted` flag is itself an LWWRegister, so it merges correctly â€” even if a user deletes a shape while another user is editing it, the conflict resolves deterministically.

---

## Key Takeaways

1. **Strategy Pattern** makes tool switching trivial â€” swap the handler, not the logic.
2. **Generic Shape model** with per-property CRDTs enables fine-grained conflict resolution.
3. **Bounding box hit testing** is simple and fast (O(n) per click).
4. **Soft delete** via tombstones is the only safe way to remove elements in a CRDT system.
5. **Z-ordering** with LWW-Register ensures deterministic rendering across all replicas.

