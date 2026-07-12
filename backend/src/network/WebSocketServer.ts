import { WebSocketServer as WSS, WebSocket } from 'ws';
import { Server } from 'http';
import { RoomManager } from '../rooms/RoomManager';
import { WSMessage } from '../types';

export class WebSocketServer {
  private wss: WSS;
  private roomManager: RoomManager;

  constructor(server: Server) {
    this.wss = new WSS({ server });
    this.roomManager = new RoomManager();

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection');

      ws.on('message', (message: string) => {
        try {
          const parsed: WSMessage = JSON.parse(message);
          this.handleMessage(ws, parsed);
        } catch (e) {
          console.error('Invalid message format', e);
        }
      });

      ws.on('close', () => {
        this.roomManager.leaveRoom(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: WSMessage) {
    switch (message.type) {
      case 'join':
        this.roomManager.joinRoom(ws, message.roomId);
        break;
      
      case 'draw_stroke':
        this.roomManager.broadcast(message.roomId, message, ws);
        break;

      case 'cursor_move':
        this.roomManager.broadcast(message.roomId, message, ws);
        break;

      default:
        console.warn('Unknown message type', message);
    }
  }
}
