import type { Tool } from './Tool';
import type { Point } from '../types';
import { Shape } from '../types';
import type { LWWElementSet } from '../crdt/LWWElementSet';

/**
 * TextTool — Click to place text on the canvas.
 *
 * Workflow:
 *   1. User clicks → creates a text Shape at that position
 *   2. A text input overlay appears (handled by CanvasBoard)
 *   3. User types their text and presses Enter or clicks away
 *   4. The shape's text property is updated with the entered text
 *
 * Points semantics: [position] (single point where text starts)
 */
export class TextTool implements Tool {
  name = 'text';

  /** Callback to notify the UI that a text input should appear */
  public onRequestTextInput?: (shapeId: string, position: Point) => void;

  onPointerDown(
    pos: Point,
    state: LWWElementSet,
    userId: string,
    color: string,
    _strokeWidth: number,
    zIndex: number
  ): Shape {
    const ts = Date.now();
    const shape = new Shape(
      `${userId}-${ts}`,
      'text',
      [pos],
      color,
      ts,
      userId,
      { text: '', zIndex }
    );
    state.set(shape);

    // Tell the UI to show the text input
    this.onRequestTextInput?.(shape.id, pos);

    return shape;
  }

  onPointerMove(
    _pos: Point,
    _state: LWWElementSet,
    currentShape: Shape | null
  ): Shape | null {
    // Text tool doesn't drag
    return currentShape;
  }

  onPointerUp(
    _pos: Point,
    _state: LWWElementSet,
    currentShape: Shape | null
  ): Shape | null {
    return currentShape;
  }

  /**
   * Called by the UI after the user finishes typing.
   * Updates the Shape's text register.
   */
  static commitText(state: LWWElementSet, shapeId: string, text: string, userId: string) {
    const shape = state.get(shapeId);
    if (!shape) return;

    const ts = Date.now();
    const updated = new Shape(
      shapeId,
      'text',
      shape.points.value,
      shape.color.value,
      ts,
      userId,
      {
        text,
        zIndex: shape.zIndex.value,
      }
    );
    state.set(updated);
  }
}
