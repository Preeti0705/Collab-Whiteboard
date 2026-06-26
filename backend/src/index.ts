import http from 'http';

const PORT = Number(process.env.PORT) || 3001;

/**
 * Minimal HTTP server — we will layer WebSocket on top of this
 * in the next lesson when we implement Rooms & Live Collaboration.
 */
const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', service: 'collab-whiteboard-backend' }));
});

server.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});

export default server;
