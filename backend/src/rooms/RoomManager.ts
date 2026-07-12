import { WebSocket } from 'ws';
import { WSMessage, Stroke } from '../types';
import { LWWElementSet } from '../crdt/LWWElementSet';

export class RoomManager {
  private rooms: Map<string, Set<WebSocket>> = new Map();
  private clientRooms: Map<WebSocket, string> = new Map();
  private roomStates: Map<string, LWWElementSet> = new Map();

  joinRoom(ws: WebSocket, roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
      this.roomStates.set(roomId, new LWWElementSet());
    }
    
    this.rooms.get(roomId)!.add(ws);
    this.clientRooms.set(ws, roomId);
    
    console.log(`Client joined room: ${roomId}`);

    // Sync the current CRDT state to the new client
    const state = this.roomStates.get(roomId)!;
    ws.send(JSON.stringify({
      type: 'sync_state',
      state: state.toJSON()
    }));
  }

  leaveRoom(ws: WebSocket) {
    const roomId = this.clientRooms.get(ws);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          // In a real app, persist this to a DB before deleting
          this.rooms.delete(roomId);
          this.roomStates.delete(roomId);
        }
      }
      this.clientRooms.delete(ws);
      console.log(`Client left room: ${roomId}`);
    }
  }

  broadcast(roomId: string, message: WSMessage, exclude?: WebSocket) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Apply the operation to the Server's authoritative CRDT replica
    if (message.type === 'draw_stroke') {
      const state = this.roomStates.get(roomId)!;
      const remoteStroke = Stroke.fromJSON(message.stroke);
      state.set(remoteStroke);
    }

    const data = JSON.stringify(message);
    for (const client of room) {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }
}
