import { Stroke } from '../types';

export class LWWElementSet {
  public elements: Map<string, Stroke> = new Map();

  public get(id: string): Stroke | undefined {
    return this.elements.get(id);
  }

  public set(stroke: Stroke) {
    const existing = this.elements.get(stroke.id);
    if (existing) {
      existing.merge(stroke);
    } else {
      this.elements.set(stroke.id, stroke);
    }
  }

  public values(): Stroke[] {
    return Array.from(this.elements.values());
  }

  public merge(remoteSet: LWWElementSet) {
    for (const remoteStroke of remoteSet.values()) {
      this.set(remoteStroke);
    }
  }

  public toJSON() {
    const obj: Record<string, any> = {};
    for (const [id, stroke] of this.elements.entries()) {
      obj[id] = stroke.toJSON();
    }
    return obj;
  }

  public static fromJSON(json: any): LWWElementSet {
    const set = new LWWElementSet();
    for (const [id, strokeJson] of Object.entries(json)) {
      set.elements.set(id, Stroke.fromJSON(strokeJson));
    }
    return set;
  }
}
