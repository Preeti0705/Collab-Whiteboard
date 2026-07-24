import type { Tool } from './Tool';
import type { Point } from '../types';
import { Shape } from '../types';
import type { LWWElementSet } from '../crdt/LWWElementSet';

/**
 * EllipseTool — Click and drag to draw an ellipse.
 *
 * Points semantics: [topLeft, bottomRight] of bounding box.
 * The ellipse is inscribed in this bounding box.
 * Rendering uses ctx.ellipse() with radiusX/radiusY calculated
 * from the bounding box dimensions.
 */
export class EllipseTool implements Tool {
  name = 'ellipse';
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
      'ellipse',
      [pos, pos],
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
      'ellipse',
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
