import type { Tool } from './Tool';
import type { Point } from '../types';
import { Shape } from '../types';
import type { LWWElementSet } from '../crdt/LWWElementSet';

/**
 * PenTool — Freehand drawing.
 *
 * Creates a 'freehand' Shape whose points array grows as the user drags.
 * This is the original drawing behavior, now encapsulated in the Tool pattern.
 */
export class PenTool implements Tool {
  name = 'pen';

  onPointerDown(
    pos: Point,
    state: LWWElementSet,
    userId: string,
    color: string,
    strokeWidth: number,
    zIndex: number
  ): Shape {
    const ts = Date.now();
    const shape = new Shape(
      `${userId}-${ts}`,
      'freehand',
      [pos],
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
    const updated = new Shape(
      currentShape.id,
      'freehand',
      [...currentShape.points.value, pos],
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
