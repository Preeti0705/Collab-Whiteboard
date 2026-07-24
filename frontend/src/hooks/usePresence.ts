import { useEffect, useRef, useCallback, useState } from 'react';
import { WebSocketClient } from '../network/WebSocketClient';
import type { UserPresence, Point } from '../types';

/**
 * usePresence — A React hook that manages live presence state.
 *
 * What it does:
 *   1. Listens to WebSocket messages for presence_update, peer_joined,
 *      peer_left, and peer_cursor events.
 *   2. Maintains a Map<userId, UserPresence> of all online users.
 *   3. Emits local cursor position on pointer move (throttled to ~30ms).
 *
 * Why throttle cursor emissions?
 *   Without throttling, we'd send 60+ messages/second per user.
 *   30ms (~33fps) is enough for smooth cursor movement while
 *   keeping bandwidth reasonable.
 *
 * Design decision: Presence is ephemeral (not CRDT-managed).
 *   Cursor positions don't need conflict resolution — the latest
 *   value always wins by definition. This is different from shape
 *   data which MUST use CRDTs for convergence.
 */

const CURSOR_THROTTLE_MS = 30;

export function usePresence(
  wsClient: WebSocketClient | null,
  roomId: string,
  userId: string
) {
  const [peers, setPeers] = useState<Map<string, UserPresence>>(new Map());
  const lastEmitRef = useRef<number>(0);

  // Listen for presence-related WebSocket messages
  useEffect(() => {
    if (!wsClient) return;

    const unsubscribe = wsClient.onMessage((msg) => {
      switch (msg.type) {
        case 'presence_update':
        case 'peer_joined': {
          // Full user list received — rebuild the map
          const newMap = new Map<string, UserPresence>();
          for (const user of msg.users) {
            // Don't include ourselves in the "peers" map
            if (user.userId !== userId) {
              newMap.set(user.userId, user);
            }
          }
          setPeers(newMap);
          break;
        }

        case 'peer_left': {
          const newMap = new Map<string, UserPresence>();
          for (const user of msg.users) {
            if (user.userId !== userId) {
              newMap.set(user.userId, user);
            }
          }
          setPeers(newMap);
          break;
        }

        case 'peer_cursor': {
          // Update only the cursor position for one peer
          setPeers(prev => {
            const next = new Map(prev);
            const existing = next.get(msg.userId);
            if (existing) {
              next.set(msg.userId, {
                ...existing,
                cursor: msg.position,
                lastSeen: Date.now(),
              });
            }
            return next;
          });
          break;
        }
      }
    });

    return unsubscribe;
  }, [wsClient, userId]);

  /**
   * Call this on pointer move to emit the local cursor to peers.
   * Throttled to prevent flooding the WebSocket.
   */
  const emitCursor = useCallback(
    (position: Point) => {
      const now = Date.now();
      if (now - lastEmitRef.current < CURSOR_THROTTLE_MS) return;
      lastEmitRef.current = now;

      wsClient?.sendMessage({
        type: 'cursor_move',
        roomId,
        userId,
        position,
      });
    },
    [wsClient, roomId, userId]
  );

  return { peers, emitCursor };
}
