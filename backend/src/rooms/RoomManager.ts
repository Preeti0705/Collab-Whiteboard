import { WebSocket } from 'ws';
import { WSMessage, Shape, UserPresence, PEER_COLORS } from '../types';
import { LWWElementSet } from '../crdt/LWWElementSet';
import { SQLiteStore } from '../storage/SQLiteStore';

/**
 * RoomManager — Manages the lifecycle of collaboration rooms.
 *
 * Responsibilities:
 *   1. Track which WebSocket connections belong to which room
 *   2. Maintain the authoritative CRDT state per room
 *   3. Track user presence (who's online, their cursor positions)
 *   4. Broadcast messages to peers within a room
 *
 * Design decisions:
 *   - We separate "CRDT state" (persistent, convergent) from "presence" (ephemeral).
 *   - Cursor positions are NOT stored in CRDTs because they're transient data
 *     that doesn't need conflict resolution.
 *   - Each new user gets a deterministic color from the PEER_COLORS palette.
 */
export class RoomManager {
  /** roomId → set of connected WebSocket clients */
  private rooms: Map<string, Set<WebSocket>> = new Map();

  /** ws → { roomId, userId } mapping for cleanup on disconnect */
  private clientInfo: Map<WebSocket, { roomId: string; userId: string }> = new Map();

  /** roomId → authoritative CRDT state */
  private roomStates: Map<string, LWWElementSet> = new Map();

  /** roomId → Map<userId, UserPresence> */
  private roomPresence: Map<string, Map<string, UserPresence>> = new Map();

  /** roomId → next color index (rotating) */
  private colorCounters: Map<string, number> = new Map();

  /** SQLite persistence layer */
  private store: SQLiteStore;

  constructor(store: SQLiteStore) {
    this.store = store;
  }

  /**
   * Assigns the next color from the palette in rotation.
   */
  private getNextColor(roomId: string): string {
    const idx = this.colorCounters.get(roomId) || 0;
    const color = PEER_COLORS[idx % PEER_COLORS.length];
    this.colorCounters.set(roomId, idx + 1);
    return color;
  }

  /**
   * Called when a client sends a 'join' message.
   * - Creates the room if it doesn't exist
   * - Assigns a cursor color to the user
   * - Sends current CRDT state to the new client
   * - Broadcasts 'peer_joined' to all existing members
   */
  joinRoom(ws: WebSocket, roomId: string, userId: string, displayName?: string) {
    // Create room structures if this is the first user
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
      // Try loading persisted state from SQLite first
      const persisted = this.store.loadRoom(roomId);
      this.roomStates.set(roomId, persisted ?? new LWWElementSet());
      this.roomPresence.set(roomId, new Map());
      this.colorCounters.set(roomId, 0);
    }

    this.rooms.get(roomId)!.add(ws);
    this.clientInfo.set(ws, { roomId, userId });

    // Assign presence
    const color = this.getNextColor(roomId);
    const presence: UserPresence = {
      userId,
      displayName: displayName || userId, // Use JWT display name or fallback to userId
      color,
      cursor: null,
      lastSeen: Date.now(),
    };
    this.roomPresence.get(roomId)!.set(userId, presence);

    console.log(`👤 ${userId} joined room: ${roomId} (color: ${color})`);

    // 1. Send full CRDT state to the new client
    const state = this.roomStates.get(roomId)!;
    ws.send(JSON.stringify({
      type: 'sync_state',
      state: state.toJSON(),
    }));

    // 2. Send current presence list to the new client
    const users = this.getUserList(roomId);
    ws.send(JSON.stringify({
      type: 'presence_update',
      users,
    }));

    // 3. Broadcast 'peer_joined' to everyone else
    this.broadcast(roomId, {
      type: 'peer_joined',
      userId,
      displayName: presence.displayName,
      color: presence.color,
      users,
    }, ws);
  }

  /**
   * Called when a WebSocket connection closes.
   * - Removes the client from the room
   * - Broadcasts 'peer_left' to remaining members
   * - Cleans up empty rooms
   */
  leaveRoom(ws: WebSocket) {
    const info = this.clientInfo.get(ws);
    if (!info) return;

    const { roomId, userId } = info;
    const room = this.rooms.get(roomId);

    if (room) {
      room.delete(ws);

      // Remove from presence
      const presenceMap = this.roomPresence.get(roomId);
      if (presenceMap) presenceMap.delete(userId);

      if (room.size === 0) {
        // Persist final state to SQLite before cleaning up in-memory
        const state = this.roomStates.get(roomId);
        if (state) this.store.saveRoom(roomId, state);
        this.rooms.delete(roomId);
        this.roomStates.delete(roomId);
        this.roomPresence.delete(roomId);
        this.colorCounters.delete(roomId);
        console.log(`🗑️  Room ${roomId} persisted & cleaned up (empty)`);
      } else {
        // Notify remaining peers
        const users = this.getUserList(roomId);
        this.broadcast(roomId, {
          type: 'peer_left',
          userId,
          users,
        });
      }
    }

    this.clientInfo.delete(ws);
    console.log(`👋 ${userId} left room: ${roomId}`);
  }

  /**
   * Updates a user's cursor position and relays it to peers.
   * Cursor data is ephemeral — not persisted in CRDTs.
   */
  updateCursor(roomId: string, userId: string, position: { x: number; y: number }, sender: WebSocket) {
    const presenceMap = this.roomPresence.get(roomId);
    if (presenceMap) {
      const presence = presenceMap.get(userId);
      if (presence) {
        presence.cursor = position;
        presence.lastSeen = Date.now();
      }
    }

    // Relay to all peers except the sender
    this.broadcast(roomId, {
      type: 'peer_cursor',
      userId,
      position,
    }, sender);
  }

  /**
   * Broadcasts a message to all clients in a room, optionally excluding one.
   * For 'draw_stroke' messages, also applies the operation to the server's
   * authoritative CRDT replica.
   */
  broadcast(roomId: string, message: WSMessage, exclude?: WebSocket) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Apply CRDT operations to the server's authoritative state
    if (message.type === 'draw_shape') {
      const state = this.roomStates.get(roomId)!;
      const remoteShape = Shape.fromJSON(message.shape);
      state.set(remoteShape);
      // Debounced persist to SQLite
      this.store.scheduleSave(roomId, state);
    } else if (message.type === 'draw_stroke') {
      // Legacy support
      const state = this.roomStates.get(roomId)!;
      const remoteStroke = Shape.fromJSON(message.stroke);
      state.set(remoteStroke);
    }

    const data = JSON.stringify(message);
    for (const client of room) {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  /**
   * Returns the current list of UserPresence objects for a room.
   */
  private getUserList(roomId: string): UserPresence[] {
    const presenceMap = this.roomPresence.get(roomId);
    if (!presenceMap) return [];
    return Array.from(presenceMap.values());
  }
}
