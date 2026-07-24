import { Shape } from '../types';

/**
 * LWWElementSet — A CRDT set where each element (Shape) is
 * independently merge-able via its LWW-Register properties.
 *
 * Operations:
 *   set(shape)  — Adds or merges a shape by its ID
 *   delete(id)  — Soft-deletes a shape (sets isDeleted = true)
 *   values()    — Returns all non-deleted shapes sorted by zIndex
 *   merge(set)  — Merges another LWWElementSet into this one
 *
 * Why soft delete?
 *   In CRDTs, we can't truly delete an element because another
 *   replica might send an update for it later. Instead, we mark
 *   it as deleted (a "tombstone") and filter it out during rendering.
 *   The isDeleted flag is itself an LWW-Register, so it merges
 *   correctly with remote operations.
 */
export class LWWElementSet {
  public elements: Map<string, Shape> = new Map();

  public get(id: string): Shape | undefined {
    return this.elements.get(id);
  }

  public set(shape: Shape) {
    const existing = this.elements.get(shape.id);
    if (existing) {
      existing.merge(shape);
    } else {
      this.elements.set(shape.id, shape);
    }
  }

  /**
   * Returns all non-deleted shapes, sorted by zIndex for correct
   * rendering order (lower zIndex drawn first = appears behind).
   */
  public values(): Shape[] {
    return Array.from(this.elements.values())
      .filter(s => !s.isDeleted.value)
      .sort((a, b) => a.zIndex.value - b.zIndex.value);
  }

  /**
   * Returns ALL shapes including deleted ones.
   * Used for serialization — we must preserve tombstones.
   */
  public allValues(): Shape[] {
    return Array.from(this.elements.values());
  }

  public merge(remoteSet: LWWElementSet) {
    for (const remoteShape of remoteSet.allValues()) {
      this.set(remoteShape);
    }
  }

  /**
   * Returns the next available zIndex for new shapes.
   * New shapes go on top of everything else.
   */
  public nextZIndex(): number {
    let max = 0;
    for (const shape of this.elements.values()) {
      if (shape.zIndex.value > max) max = shape.zIndex.value;
    }
    return max + 1;
  }

  public toJSON() {
    const obj: Record<string, any> = {};
    for (const [id, shape] of this.elements.entries()) {
      obj[id] = shape.toJSON();
    }
    return obj;
  }

  public static fromJSON(json: any): LWWElementSet {
    const set = new LWWElementSet();
    for (const [id, shapeJson] of Object.entries(json)) {
      set.elements.set(id, Shape.fromJSON(shapeJson));
    }
    return set;
  }
}
