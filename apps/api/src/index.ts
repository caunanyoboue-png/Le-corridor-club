import "dotenv/config";
import http from "http";
import { Server as SocketServer } from "socket.io";
import { setIo } from "./lib/io";
import { initSocket } from "./modules/socket";
import app from "./app";

// ── Démarrage local avec Socket.io ─────────────────────────────────────
// Note: Socket.io ne fonctionne pas sur Vercel serverless (production)
// Cette partie est uniquement pour le développement local
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: { origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" },
});
setIo(io);
initSocket(io);

const PORT = Number(process.env.PORT ?? 4000);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";
server.listen(PORT, () => {
  console.log(`🚀 API Le Corridor Club démarrée sur http://localhost:${PORT}`);
  console.log(`📍 CORS Origin: ${corsOrigin}`);
});
