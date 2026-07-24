import type { Point, Shape } from '../types';
import type { LWWElementSet } from '../crdt/LWWElementSet';

/**
 * Tool — The abstract interface that all drawing tools implement.
 *
 * This is the Strategy Pattern: the CanvasBoard holds a reference to
 * the currently active Tool, and delegates all pointer events to it.
 * Switching tools just swaps the strategy object.
 *
 * Lifecycle:
 *   onPointerDown → onPointerMove (repeated) → onPointerUp
 *   Each cycle produces one Shape (or modifies an existing one).
 *
 * The `preview` concept:
 *   While the user is dragging (between down and up), the tool may
 *   want to show a preview (e.g., the rectangle outline before it's
 *   committed). The tool adds/updates the shape in the state directly,
 *   and the engine renders it on the next frame.
 */
export interface Tool {
  /** Unique name of the tool */
  name: string;

  /**
   * Called when the user presses down on the canvas.
   * @returns The Shape being created/modified, or null
   */
  onPointerDown(
    pos: Point,
    state: LWWElementSet,
    userId: string,
    color: string,
    strokeWidth: number,
    zIndex: number
  ): Shape | null;

  /**
   * Called repeatedly as the user drags.
   * @returns The Shape being updated, or null
   */
  onPointerMove(
    pos: Point,
    state: LWWElementSet,
    currentShape: Shape | null
  ): Shape | null;

  /**
   * Called when the user releases the pointer.
   * @returns The finalized Shape, or null
   */
  onPointerUp(
    pos: Point,
    state: LWWElementSet,
    currentShape: Shape | null
  ): Shape | null;
}
