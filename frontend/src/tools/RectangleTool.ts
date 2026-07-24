import type { Tool } from './Tool';
import type { Point } from '../types';
import { Shape } from '../types';
import type { LWWElementSet } from '../crdt/LWWElementSet';

/**
 * RectangleTool — Click and drag to draw a rectangle.
 *
 * Points semantics: [topLeft, bottomRight]
 * The bounding box is defined by the initial click (anchor) and the
 * current drag position. We always normalize so topLeft ≤ bottomRight.
 */
export class RectangleTool implements Tool {
  name = 'rectangle';
  private anchor: Point | null = null;

  onPointerDown(
    pos: Point,
    state: LWWElementSet,
    userId: string,
    color: string,
    strokeWidth: number,
    zIndex: number
  ): Shape {
    this.anchor = pos;
    const ts = Date.now();
    const shape = new Shape(
      `${userId}-${ts}`,
      'rectangle',
      [pos, pos], // starts as zero-size rect
      color,
      ts,
      userId,
      { strokeWidth, zIndex }
    );
    state.set(shape);
    return shape;
  }

  onPointerMove(
    pos: Point,
    state: LWWElementSet,
    currentShape: Shape | null
  ): Shape | null {
    if (!currentShape || !this.anchor) return null;

    const ts = Date.now();
    // Normalize so point[0] is always topLeft and point[1] is bottomRight
    const topLeft: Point = {
      x: Math.min(this.anchor.x, pos.x),
      y: Math.min(this.anchor.y, pos.y),
    };
    const bottomRight: Point = {
      x: Math.max(this.anchor.x, pos.x),
      y: Math.max(this.anchor.y, pos.y),
    };

    const updated = new Shape(
      currentShape.id,
      'rectangle',
      [topLeft, bottomRight],
      currentShape.color.value,
      ts,
      currentShape.color.clientId,
      {
        fillColor: currentShape.fillColor.value,
        strokeWidth: currentShape.strokeWidth.value,
        zIndex: currentShape.zIndex.value,
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
    this.anchor = null;
    return currentShape;
  }
}
