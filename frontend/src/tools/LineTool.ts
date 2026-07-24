import type { Tool } from './Tool';
import type { Point } from '../types';
import { Shape } from '../types';
import type { LWWElementSet } from '../crdt/LWWElementSet';

/**
 * LineTool — Click and drag to draw a straight line.
 *
 * Points semantics: [start, end]
 *
 * The `isArrow` flag controls whether an arrowhead is drawn at the
 * end point. When true, the shape type is 'arrow' instead of 'line'.
 */
export class LineTool implements Tool {
  name: string;
  private isArrow: boolean;

  constructor(arrow: boolean = false) {
    this.isArrow = arrow;
    this.name = arrow ? 'arrow' : 'line';
  }

  onPointerDown(
    pos: Point,
    state: LWWElementSet,
    userId: string,
    color: string,
    strokeWidth: number,
    zIndex: number
  ): Shape {
    const ts = Date.now();
    const shapeType = this.isArrow ? 'arrow' : 'line';
    const shape = new Shape(
      `${userId}-${ts}`,
      shapeType as any,
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
    if (!currentShape) return null;

    const ts = Date.now();
    const start = currentShape.points.value[0];
    const updated = new Shape(
      currentShape.id,
      currentShape.shapeType.value,
      [start, pos],
      currentShape.color.value,
      ts,
      currentShape.color.clientId,
      {
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
    return currentShape;
  }
}
