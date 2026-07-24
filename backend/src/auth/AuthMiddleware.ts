import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './AuthController';
import { IncomingMessage } from 'http';

/**
 * AuthMiddleware — JWT verification for WebSocket connections.
 *
 * WebSocket auth strategy:
 *   The client sends the JWT as a query parameter in the WS URL:
 *     ws://localhost:3001?token=<jwt>
 *
 *   Why query params instead of headers?
 *   The browser WebSocket API doesn't support custom headers.
 *   Query params are the standard workaround used by Socket.io,
 *   Pusher, and most real-time platforms.
 *
 * Token payload structure:
 *   { userId: string, displayName: string, email: string }
 */

export interface TokenPayload {
  userId: string;
  displayName: string;
  email: string;
}

/**
 * Verifies a JWT token string and returns the payload.
 * Returns null if the token is invalid or expired.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the JWT from a WebSocket upgrade request.
 * The token is expected in the URL query string: ?token=<jwt>
 *
 * Returns the decoded payload, or null if authentication fails.
 */
export function authenticateWsUpgrade(req: IncomingMessage): TokenPayload | null {
  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch {
    return null;
  }
}
