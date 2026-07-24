import { LWWRegister } from './crdt/LWWRegister';

export type Point = {
  x: number;
  y: number;
};

// ─── Presence ───────────────────────────────────────────────────────

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

// ─── Shape ──────────────────────────────────────────────────────────

export type ShapeType = 'freehand' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'text';

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
    // Handle legacy Stroke format (no shapeType field)
    if (!json.shapeType) {
      const shape = new Shape(json.id, 'freehand', [], '', 0, '');
      shape.points = LWWRegister.fromJSON<Point[]>(json.points);
      shape.color = LWWRegister.fromJSON<string>(json.color);
      return shape;
    }

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
}

// Backward compatibility alias
export const Stroke = Shape;

// ─── Messages ───────────────────────────────────────────────────────

export type WSMessage =
  | { type: 'join'; roomId: string; userId: string }
  | { type: 'draw_shape'; roomId: string; shape: any }
  | { type: 'draw_stroke'; roomId: string; stroke: any } // legacy
  | { type: 'cursor_move'; roomId: string; userId: string; position: Point }
  | { type: 'peer_joined'; userId: string; displayName: string; color: string; users: UserPresence[] }
  | { type: 'peer_left'; userId: string; users: UserPresence[] }
  | { type: 'peer_cursor'; userId: string; position: Point }
  | { type: 'presence_update'; users: UserPresence[] }
  | { type: 'sync_state'; state: any };
