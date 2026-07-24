import { LWWRegister } from '../crdt/LWWRegister';

export type Point = {
  x: number;
  y: number;
};

// ─── Presence (ephemeral) ───────────────────────────────────────────

export type UserPresence = {
  userId: string;
  displayName: string;
  color: string;
  cursor: Point | null;
  lastSeen: number;
};

export const PEER_COLORS = [
  '#f38ba8', '#a6e3a1', '#fab387', '#89dceb', '#cba6f7',
  '#f9e2af', '#94e2d5', '#eba0ac', '#74c7ec', '#b4befe',
];

// ─── Shape types ────────────────────────────────────────────────────

/**
 * All shape types the whiteboard supports.
 *
 * 'freehand' — series of points drawn with the pen tool
 * 'rectangle' — axis-aligned rect defined by two corner points
 * 'ellipse' — inscribed in the bounding box of two corner points
 * 'line' — straight line between two points
 * 'arrow' — line with an arrowhead at the end point
 * 'text' — text label at a single point
 */
export type ShapeType = 'freehand' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'text';

/**
 * Shape — The universal element on the canvas.
 *
 * Every property that can be collaboratively edited is wrapped in
 * an LWWRegister. This means each property is independently
 * conflict-resolved: changing a shape's color won't conflict with
 * someone else moving it.
 *
 * Point semantics vary by shape type:
 *   - freehand: array of all pen stroke points
 *   - rectangle/ellipse: [topLeft, bottomRight] bounding box
 *   - line/arrow: [start, end]
 *   - text: [position] (single point)
 */
export class Shape {
  public id: string;
  public shapeType: LWWRegister<ShapeType>;
  public points: LWWRegister<Point[]>;
  public color: LWWRegister<string>;
  public fillColor: LWWRegister<string>;
  public strokeWidth: LWWRegister<number>;
  public text: LWWRegister<string>;
  public zIndex: LWWRegister<number>;
  public isDeleted: LWWRegister<boolean>;

  constructor(
    id: string,
    shapeType: ShapeType,
    points: Point[],
    color: string,
    timestamp: number,
    clientId: string,
    options?: {
      fillColor?: string;
      strokeWidth?: number;
      text?: string;
      zIndex?: number;
    }
  ) {
    this.id = id;
    this.shapeType = new LWWRegister<ShapeType>(shapeType, timestamp, clientId);
    this.points = new LWWRegister<Point[]>(points, timestamp, clientId);
    this.color = new LWWRegister<string>(color, timestamp, clientId);
    this.fillColor = new LWWRegister<string>(options?.fillColor ?? 'transparent', timestamp, clientId);
    this.strokeWidth = new LWWRegister<number>(options?.strokeWidth ?? 3, timestamp, clientId);
    this.text = new LWWRegister<string>(options?.text ?? '', timestamp, clientId);
    this.zIndex = new LWWRegister<number>(options?.zIndex ?? 0, timestamp, clientId);
    this.isDeleted = new LWWRegister<boolean>(false, timestamp, clientId);
  }

  /**
   * Merges a remote Shape into this one.
   * Each property merges independently via LWW semantics.
   */
  public merge(remote: Shape) {
    this.shapeType.merge(remote.shapeType);
    this.points.merge(remote.points);
    this.color.merge(remote.color);
    this.fillColor.merge(remote.fillColor);
    this.strokeWidth.merge(remote.strokeWidth);
    this.text.merge(remote.text);
    this.zIndex.merge(remote.zIndex);
    this.isDeleted.merge(remote.isDeleted);
  }

  public toJSON() {
    return {
      id: this.id,
      shapeType: this.shapeType.toJSON(),
      points: this.points.toJSON(),
      color: this.color.toJSON(),
      fillColor: this.fillColor.toJSON(),
      strokeWidth: this.strokeWidth.toJSON(),
      text: this.text.toJSON(),
      zIndex: this.zIndex.toJSON(),
      isDeleted: this.isDeleted.toJSON(),
    };
  }

  public static fromJSON(json: any): Shape {
    const shape = new Shape(json.id, 'freehand', [], '', 0, '');
    shape.shapeType = LWWRegister.fromJSON<ShapeType>(json.shapeType);
    shape.points = LWWRegister.fromJSON<Point[]>(json.points);
    shape.color = LWWRegister.fromJSON<string>(json.color);
    shape.fillColor = LWWRegister.fromJSON<string>(json.fillColor);
    shape.strokeWidth = LWWRegister.fromJSON<number>(json.strokeWidth);
    shape.text = LWWRegister.fromJSON<string>(json.text);
    shape.zIndex = LWWRegister.fromJSON<number>(json.zIndex);
    shape.isDeleted = LWWRegister.fromJSON<boolean>(json.isDeleted);
    return shape;
  }

  /**
   * Returns the axis-aligned bounding box for hit-testing.
   * Used by the SelectTool to determine if a click is on this shape.
   */
  public getBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const pts = this.points.value;
    if (pts.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
  }
}

// ─── Backward compatibility alias ───────────────────────────────────
// The old `Stroke` class is now just a Shape with type 'freehand'.
// This alias prevents breaking existing code during the transition.
export const Stroke = Shape;

// ─── WebSocket messages ─────────────────────────────────────────────

export type WSMessage =
  | { type: 'join'; roomId: string; userId: string }
  | { type: 'draw_shape'; roomId: string; shape: any }
  | { type: 'cursor_move'; roomId: string; userId: string; position: Point }
  | { type: 'peer_joined'; userId: string; displayName: string; color: string; users: UserPresence[] }
  | { type: 'peer_left'; userId: string; users: UserPresence[] }
  | { type: 'peer_cursor'; userId: string; position: Point }
  | { type: 'presence_update'; users: UserPresence[] }
  | { type: 'sync_state'; state: any }
  // Legacy support — will still accept draw_stroke from old clients
  | { type: 'draw_stroke'; roomId: string; stroke: any };

// ─── Tool types ─────────────────────────────────────────────────────

export type ToolType = 'select' | 'pen' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'text';
