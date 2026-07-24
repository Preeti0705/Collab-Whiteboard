import type { Tool } from './Tool';
import type { Point } from '../types';
import { Shape } from '../types';
import { LWWRegister } from '../crdt/LWWRegister';
import type { LWWElementSet } from '../crdt/LWWElementSet';

/**
 * SelectTool — Click to select shapes, drag to move them.
 *
 * Hit-testing strategy:
 *   We iterate shapes in reverse z-order (top to bottom) and check
 *   if the click point is within each shape's bounding box.
 *   The first match wins (topmost shape).
 *
 * Supported operations:
 *   - Click → select a shape
 *   - Drag selected shape → move it
 *   - Delete key → soft-delete via CRDT isDeleted flag
 *   - Click empty area → deselect
 */
export class SelectTool implements Tool {
  name = 'select';

  /** Currently selected shape ID */
  public selectedId: string | null = null;

  /** Callback to notify the UI of selection changes */
  public onSelectionChange?: (shapeId: string | null) => void;

  /** The offset from the shape's first point to the drag origin */
  private dragOffset: Point | null = null;

  /**
   * Hit-tests all shapes at the given point.
   * Returns the topmost (highest zIndex) shape whose bounding box
   * contains the point, or null.
   */
  private hitTest(pos: Point, state: LWWElementSet): Shape | null {
    const shapes = state.values();
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      const bounds = shape.getBounds();
      const padding = Math.max(shape.strokeWidth.value, 8);

      if (
        pos.x >= bounds.minX - padding &&
        pos.x <= bounds.maxX + padding &&
        pos.y >= bounds.minY - padding &&
        pos.y <= bounds.maxY + padding
      ) {
        return shape;
      }
    }
    return null;
  }

  onPointerDown(
    pos: Point,
    state: LWWElementSet,
    _userId: string,
    _color: string,
    _strokeWidth: number,
    _zIndex: number
  ): Shape | null {
    const hit = this.hitTest(pos, state);

    if (hit) {
      this.selectedId = hit.id;
      const firstPoint = hit.points.value[0];
      this.dragOffset = {
        x: pos.x - firstPoint.x,
        y: pos.y - firstPoint.y,
      };
    } else {
      this.selectedId = null;
      this.dragOffset = null;
    }

    this.onSelectionChange?.(this.selectedId);
    return hit;
  }

  onPointerMove(
    pos: Point,
    state: LWWElementSet,
    _currentShape: Shape | null
  ): Shape | null {
    if (!this.selectedId || !this.dragOffset) return null;

    const shape = state.get(this.selectedId);
    if (!shape) return null;

    const currentFirst = shape.points.value[0];
    const targetFirst = {
      x: pos.x - this.dragOffset.x,
      y: pos.y - this.dragOffset.y,
    };
    const dx = targetFirst.x - currentFirst.x;
    const dy = targetFirst.y - currentFirst.y;

    const movedPoints = shape.points.value.map(p => ({
      x: p.x + dx,
      y: p.y + dy,
    }));

    const ts = Date.now();
    const updated = new Shape(
      shape.id,
      shape.shapeType.value,
      movedPoints,
      shape.color.value,
      ts,
      shape.color.clientId,
      {
        fillColor: shape.fillColor.value,
        strokeWidth: shape.strokeWidth.value,
        text: shape.text.value,
        zIndex: shape.zIndex.value,
      }
    );
    state.set(updated);
    return updated;
  }

  onPointerUp(
    _pos: Point,
    _state: LWWElementSet,
    currentShape: Shape | null
  ): Shape | null {
    this.dragOffset = null;
    return currentShape;
  }

  /**
   * Soft-deletes the currently selected shape.
   * Creates a new Shape with isDeleted = true, which the CRDT will merge.
   * The LWWElementSet.values() method filters out deleted shapes.
   */
  deleteSelected(state: LWWElementSet, userId: string): Shape | null {
    if (!this.selectedId) return null;

    const shape = state.get(this.selectedId);
    if (!shape) return null;

    const ts = Date.now();
    const deleted = new Shape(
      shape.id,
      shape.shapeType.value,
      shape.points.value,
      shape.color.value,
      ts,
      userId,
      {
        fillColor: shape.fillColor.value,
        strokeWidth: shape.strokeWidth.value,
        text: shape.text.value,
        zIndex: shape.zIndex.value,
      }
    );
    // Overwrite the isDeleted register with a newer timestamp
    deleted.isDeleted = new LWWRegister<boolean>(true, ts, userId);
    state.set(deleted);

    this.selectedId = null;
    this.onSelectionChange?.(null);
    return deleted;
  }
}
