import React from 'react';
import type { UserPresence } from '../types';
import './PresenceBar.css';

/**
 * PresenceBar — Displays the list of online users in the current room.
 *
 * Each user is shown as a colored circle with their initial.
 * On hover, a tooltip shows their full display name.
 * Shows connection status (green dot = connected, red = disconnected).
 * Includes a logout button.
 *
 * Design inspired by Figma's avatar bar — minimal, colorful, and
 * informative at a glance.
 */

interface PresenceBarProps {
  /** The current user's ID */
  currentUserId: string;
  /** The current user's display name */
  displayName: string;
  /** Map of peer userId → UserPresence from the usePresence hook */
  peers: Map<string, UserPresence>;
  /** The current room ID */
  roomId: string;
  /** Whether the WebSocket is currently connected */
  isConnected: boolean;
  /** Callback to log out */
  onLogout: () => void;
}

export const PresenceBar: React.FC<PresenceBarProps> = ({
  currentUserId,
  displayName,
  peers,
  roomId,
  isConnected,
  onLogout,
}) => {
  const peerList = Array.from(peers.values());

  return (
    <div className="presence-bar" id="presence-bar">
      {/* Connection status */}
      <div className="presence-bar__room">
        <span className={`presence-bar__room-dot ${isConnected ? '' : 'presence-bar__room-dot--offline'}`} />
        <span>{isConnected ? roomId : 'Offline'}</span>
      </div>

      <div className="presence-bar__divider" />

      <div className="presence-bar__users">
        {/* Current user (always first) */}
        <div
          className="presence-bar__avatar presence-bar__avatar--self"
          title={`${displayName} (you)`}
          style={{ '--avatar-color': '#89b4fa' } as React.CSSProperties}
        >
          <span>{displayName.charAt(0).toUpperCase()}</span>
        </div>

        {/* Remote peers */}
        {peerList.map((peer) => (
          <div
            key={peer.userId}
            className="presence-bar__avatar"
            title={peer.displayName || peer.userId}
            style={{ '--avatar-color': peer.color } as React.CSSProperties}
          >
            <span>{(peer.displayName || peer.userId).charAt(0).toUpperCase()}</span>
          </div>
        ))}
      </div>

      <div className="presence-bar__divider" />

      <div className="presence-bar__count">
        {peerList.length + 1} online
      </div>

      <div className="presence-bar__divider" />

      <button className="presence-bar__logout" onClick={onLogout} title="Logout">
        ↗ Logout
      </button>
    </div>
  );
};
