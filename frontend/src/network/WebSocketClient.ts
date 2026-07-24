import type { WSMessage } from '../types';
import { OfflineQueue } from '../storage/OfflineQueue';

type MessageHandler = (msg: WSMessage) => void;
type ConnectionHandler = (connected: boolean) => void;

/**
 * WebSocketClient — Manages the WebSocket connection to the server.
 *
 * Features:
 *   - Auto-reconnect with exponential backoff
 *   - Offline queue (IndexedDB) for operations made while disconnected
 *   - On reconnect: drains offline queue and sends buffered operations
 *   - Connection status callbacks for UI updates
 *
 * Exponential backoff:
 *   Attempt 1: wait 1s
 *   Attempt 2: wait 2s
 *   Attempt 3: wait 4s
 *   ... up to max 30s
 *
 *   This prevents hammering the server when it's down.
 */

const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const BASE_RECONNECT_DELAY = 1000; // 1 second

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private isConnected = false;
  private offlineQueue = new OfflineQueue();

  // Reconnection state
  private shouldReconnect = true;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private roomId: string | null = null;
  private userId: string | null = null;

  constructor(url: string) {
    this.url = url;
    // Initialize the offline queue (async, but we don't block on it)
    this.offlineQueue.init().catch(console.error);
  }

  /**
   * Connects to the WebSocket server and joins a room.
   */
  connect(roomId: string, userId: string) {
    this.roomId = roomId;
    this.userId = userId;
    this.shouldReconnect = true;
    this.doConnect();
  }

  private doConnect() {
    if (!this.roomId || !this.userId) return;

    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      console.error('Failed to create WebSocket', e);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('✅ Connected to WebSocket server');
      this.isConnected = true;
      this.reconnectAttempts = 0; // Reset backoff on successful connect
      this.notifyConnectionChange(true);

      // Join the room
      this.sendMessage({ type: 'join', roomId: this.roomId!, userId: this.userId! });

      // Drain the offline queue — send all buffered operations
      this.drainOfflineQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        for (const handler of this.handlers) {
          handler(msg);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    this.ws.onclose = () => {
      console.log('🔌 Disconnected from WebSocket server');
      this.isConnected = false;
      this.notifyConnectionChange(false);

      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error', err);
      // onclose will fire after this, triggering reconnect
    };
  }

  /**
   * Schedules a reconnection attempt with exponential backoff.
   */
  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY
    );

    console.log(`🔄 Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.doConnect();
    }, delay);
  }

  /**
   * Drains the IndexedDB offline queue and sends all buffered operations.
   * Safe because CRDTs guarantee convergence regardless of operation order.
   */
  private async drainOfflineQueue() {
    try {
      const ops = await this.offlineQueue.drain();
      if (ops.length > 0) {
        console.log(`📤 Draining ${ops.length} offline operations`);
        for (const op of ops) {
          this.sendMessage(op.payload as WSMessage);
        }
      }
    } catch (err) {
      console.error('Failed to drain offline queue', err);
    }
  }

  /**
   * Sends a message if connected, otherwise queues it for later.
   */
  sendMessage(msg: WSMessage) {
    if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      // Queue for offline delivery
      this.offlineQueue.enqueue({
        type: msg.type,
        payload: msg,
        timestamp: Date.now(),
      }).catch(console.error);
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Subscribe to connection status changes.
   * Useful for showing "Offline" indicators in the UI.
   */
  onConnectionChange(handler: ConnectionHandler) {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  private notifyConnectionChange(connected: boolean) {
    for (const handler of this.connectionHandlers) {
      handler(connected);
    }
  }

  /**
   * Returns whether the client is currently connected.
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
