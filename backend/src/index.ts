import http from 'http';
import express from 'express';
import { WebSocketServer } from './network/WebSocketServer';
import { createAuthRouter } from './auth/AuthController';
import { UserStore } from './storage/UserStore';

const PORT = Number(process.env.PORT) || 3001;

/**
 * Backend entry point.
 *
 * Architecture:
 *   1. Express handles REST API routes (health check, auth)
 *   2. WebSocket server handles real-time collaboration
 *   3. Both share the same HTTP server (port 3001)
 *
 * CORS is enabled for the frontend dev server (port 5173).
 */

const app = express();

// Parse JSON bodies for auth routes
app.use(express.json());

// CORS — Allow the frontend dev server to make requests
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'collab-whiteboard-backend' });
});

// Auth routes
const userStore = new UserStore();
app.use('/api/auth', createAuthRouter(userStore));

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize WebSocket server on top of the HTTP server
const wss = new WebSocketServer(server);

server.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server attached`);
  console.log(`🔑 Auth API at http://localhost:${PORT}/api/auth`);
});

export default server;
