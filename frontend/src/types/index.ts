import { LWWRegister } from '../crdt/LWWRegister';

export type Point = {
  x: number;
  y: number;
};

export class Stroke {
  public id: string;
  public points: LWWRegister<Point[]>;
  public color: LWWRegister<string>;

  constructor(id: string, points: Point[], color: string, timestamp: number, clientId: string) {
    this.id = id;
    this.points = new LWWRegister<Point[]>(points, timestamp, clientId);
    this.color = new LWWRegister<string>(color, timestamp, clientId);
  }

  public merge(remote: Stroke) {
    this.points.merge(remote.points);
    this.color.merge(remote.color);
  }

  public toJSON() {
    return {
      id: this.id,
      points: this.points.toJSON(),
      color: this.color.toJSON()
    };
  }

  public static fromJSON(json: any): Stroke {
    const stroke = new Stroke(json.id, [], '', 0, ''); // dummy init
    stroke.points = LWWRegister.fromJSON<Point[]>(json.points);
    stroke.color = LWWRegister.fromJSON<string>(json.color);
    return stroke;
  }
}

export type WSMessage =
  | { type: 'join'; roomId: string; userId: string }
  | { type: 'draw_stroke'; roomId: string; stroke: any } // JSON payload
  | { type: 'cursor_move'; roomId: string; userId: string; position: Point }
  | { type: 'peer_joined'; userId: string }
  | { type: 'peer_left'; userId: string }
  | { type: 'sync_state'; state: any }; // JSON payload for LWWElementSet
