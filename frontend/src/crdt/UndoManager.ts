import { Shape } from '../types';
import { LWWRegister } from './LWWRegister';
import type { LWWElementSet } from './LWWElementSet';

/**
 * UndoManager — Local undo/redo stack for the current user.
 *
 * Design decisions:
 *   - Undo/redo is LOCAL only. It does not undo other users' actions.
 *   - We store snapshots of shapes before each operation.
 *   - Undo replays the previous snapshot; redo replays the current.
 *   - The stack is bounded to prevent unbounded memory growth.
 *
 * Why not use CRDT-based undo?
 *   CRDT undo requires operation logs and inverse operations, which
 *   adds significant complexity. Per-user local undo is simpler and
 *   matches user expectations (undo MY actions, not theirs).
 *
 * Stack structure:
 *   Each entry is a { shapeId, before, after } tuple:
 *   - before: the shape's state before the operation (null = shape didn't exist)
 *   - after: the shape's state after the operation
 */

interface UndoEntry {
  shapeId: string;
  before: ReturnType<Shape['toJSON']> | null;
  after: ReturnType<Shape['toJSON']> | null;
}

const MAX_UNDO_STACK = 50;

export class UndoManager {
  private undoStack: UndoEntry[] = [];
  private redoStack: UndoEntry[] = [];

  /**
   * Records an operation for undo.
   * Call this BEFORE (or right after) applying a shape change.
   *
   * @param shapeId - The ID of the shape being modified
   * @param before - The shape's JSON before the operation (null if new)
   * @param after - The shape's JSON after the operation
   */
  record(shapeId: string, before: ReturnType<Shape['toJSON']> | null, after: ReturnType<Shape['toJSON']> | null) {
    this.undoStack.push({ shapeId, before, after });

    // Cap the stack size
    if (this.undoStack.length > MAX_UNDO_STACK) {
      this.undoStack.shift();
    }

    // Clear redo stack — new operations invalidate redo history
    this.redoStack = [];
  }

  /**
   * Undoes the last operation.
   * Returns the shape to broadcast (or null if nothing to undo).
   */
  undo(state: LWWElementSet, userId: string): Shape | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;

    // Push to redo stack
    this.redoStack.push(entry);

    // Restore the "before" state
    if (entry.before === null) {
      // Shape was newly created → soft-delete it
      const existing = state.get(entry.shapeId);
      if (existing) {
        const ts = Date.now();
        const deleted = new Shape(
          existing.id,
          existing.shapeType.value,
          existing.points.value,
          existing.color.value,
          ts,
          userId,
          {
            fillColor: existing.fillColor.value,
            strokeWidth: existing.strokeWidth.value,
            text: existing.text.value,
            zIndex: existing.zIndex.value,
          }
        );
        deleted.isDeleted = new LWWRegister<boolean>(true, ts, userId);
        state.set(deleted);
        return deleted;
      }
    } else {
      // Restore previous shape state
      const restored = Shape.fromJSON(entry.before);
      // Bump timestamp so it wins the merge
      const ts = Date.now();
      const updated = new Shape(
        restored.id,
        restored.shapeType.value,
        restored.points.value,
        restored.color.value,
        ts,
        userId,
        {
          fillColor: restored.fillColor.value,
          strokeWidth: restored.strokeWidth.value,
          text: restored.text.value,
          zIndex: restored.zIndex.value,
        }
      );
      updated.isDeleted = new LWWRegister<boolean>(restored.isDeleted.value, ts, userId);
      state.set(updated);
      return updated;
    }

    return null;
  }

  /**
   * Redoes the last undone operation.
   * Returns the shape to broadcast (or null if nothing to redo).
   */
  redo(state: LWWElementSet, userId: string): Shape | null {
    const entry = this.redoStack.pop();
    if (!entry) return null;

    // Push back to undo stack
    this.undoStack.push(entry);

    // Apply the "after" state
    if (entry.after === null) {
      // The operation was a delete → re-delete
      const existing = state.get(entry.shapeId);
      if (existing) {
        const ts = Date.now();
        const deleted = new Shape(
          existing.id,
          existing.shapeType.value,
          existing.points.value,
          existing.color.value,
          ts,
          userId,
          {
            fillColor: existing.fillColor.value,
            strokeWidth: existing.strokeWidth.value,
            text: existing.text.value,
            zIndex: existing.zIndex.value,
          }
        );
        deleted.isDeleted = new LWWRegister<boolean>(true, ts, userId);
        state.set(deleted);
        return deleted;
      }
    } else {
      // Restore the "after" state
      const restored = Shape.fromJSON(entry.after);
      const ts = Date.now();
      const updated = new Shape(
        restored.id,
        restored.shapeType.value,
        restored.points.value,
        restored.color.value,
        ts,
        userId,
        {
          fillColor: restored.fillColor.value,
          strokeWidth: restored.strokeWidth.value,
          text: restored.text.value,
          zIndex: restored.zIndex.value,
        }
      );
      updated.isDeleted = new LWWRegister<boolean>(restored.isDeleted.value, ts, userId);
      state.set(updated);
      return updated;
    }

    return null;
  }

  /** Returns true if there are operations to undo */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /** Returns true if there are operations to redo */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
