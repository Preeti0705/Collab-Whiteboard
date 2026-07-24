import { WebSocketServer as WSS, WebSocket } from 'ws';
import { Server } from 'http';
import { RoomManager } from '../rooms/RoomManager';
import { SQLiteStore } from '../storage/SQLiteStore';
import { WSMessage } from '../types';
import { authenticateWsUpgrade } from '../auth/AuthMiddleware';
import type { TokenPayload } from '../auth/AuthMiddleware';

/**
 * WebSocketServer — Wraps the `ws` library and routes incoming messages
 * to the RoomManager.
 *
 * Authentication:
 *   Clients can optionally send a JWT via query param: ws://host?token=<jwt>
 *   If a valid token is present, the userId and displayName come from the token.
 *   If no token is provided, anonymous access is still allowed (for development).
 *
 * Now creates and owns the SQLiteStore instance, passing it to RoomManager
 * for persistence.
 */
export class WebSocketServer {
  private wss: WSS;
  private roomManager: RoomManager;
  private store: SQLiteStore;

  /** Map from WebSocket → authenticated user info (if any) */
  private authInfo: Map<WebSocket, TokenPayload> = new Map();

  constructor(server: Server) {
    this.wss = new WSS({ server });
    this.store = new SQLiteStore();
    this.roomManager = new RoomManager(this.store);

    this.wss.on('connection', (ws: WebSocket, req) => {
      // Try to authenticate via JWT in query params
      const payload = authenticateWsUpgrade(req);
      if (payload) {
        this.authInfo.set(ws, payload);
        console.log(`🔑 Authenticated WS: ${payload.displayName}`);
      } else {
        console.log('🔌 Anonymous WebSocket connection');
      }

      ws.on('message', (message: string) => {
        try {
          const parsed: WSMessage = JSON.parse(message.toString());
          this.handleMessage(ws, parsed);
        } catch (e) {
          console.error('Invalid message format', e);
        }
      });

      ws.on('close', () => {
        this.roomManager.leaveRoom(ws);
        this.authInfo.delete(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: WSMessage) {
    switch (message.type) {
      case 'join': {
        // If authenticated, override the userId/displayName from the JWT
        const auth = this.authInfo.get(ws);
        const userId = auth?.userId || message.userId;
        this.roomManager.joinRoom(ws, message.roomId, userId, auth?.displayName);
        break;
      }

      case 'draw_shape':
        this.roomManager.broadcast(message.roomId, message, ws);
        break;

      case 'draw_stroke':
        // Legacy support
        this.roomManager.broadcast(message.roomId, message, ws);
        break;

      case 'cursor_move': {
        const auth = this.authInfo.get(ws);
        const userId = auth?.userId || message.userId;
        this.roomManager.updateCursor(
          message.roomId,
          userId,
          message.position,
          ws
        );
        break;
      }

      default:
        console.warn('Unknown message type', message);
    }
  }
}
