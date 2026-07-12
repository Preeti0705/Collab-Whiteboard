import http from 'http';
import { WebSocketServer } from './network/WebSocketServer';

const PORT = Number(process.env.PORT) || 3001;

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', service: 'collab-whiteboard-backend' }));
});

// Initialize WebSocket server on top of the HTTP server
const wss = new WebSocketServer(server);

server.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server attached`);
});

export default server;
