import { Shape } from '../types';

/**
 * LWWElementSet — Server-side CRDT set (mirrors frontend).
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

  public values(): Shape[] {
    return Array.from(this.elements.values())
      .filter(s => !s.isDeleted.value);
  }

  public allValues(): Shape[] {
    return Array.from(this.elements.values());
  }

  public merge(remoteSet: LWWElementSet) {
    for (const remoteShape of remoteSet.allValues()) {
      this.set(remoteShape);
    }
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
