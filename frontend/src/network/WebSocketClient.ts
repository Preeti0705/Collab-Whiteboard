import type { WSMessage } from '../types';

type MessageHandler = (msg: WSMessage) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Set<MessageHandler> = new Set();
  private isConnected = false;

  constructor(url: string) {
    this.url = url;
  }

  connect(roomId: string, userId: string) {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('Connected to WebSocket server');
      this.isConnected = true;
      this.sendMessage({ type: 'join', roomId, userId });
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
      console.log('Disconnected from WebSocket server');
      this.isConnected = false;
      // Implement basic reconnection logic later
    };
  }

  sendMessage(msg: WSMessage) {
    if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler); // Return unsubscribe function
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
