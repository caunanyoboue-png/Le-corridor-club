import { Server } from "socket.io";
import { SOCKET_CHANNELS } from "@maquis/shared";

export function initSocket(io: Server): void {
  io.on("connection", (socket) => {
    console.log(`[Socket] Client connecté : ${socket.id}`);

    socket.on("join:orders", () => {
      socket.join(SOCKET_CHANNELS.ORDERS);
      socket.emit("joined", { channel: SOCKET_CHANNELS.ORDERS });
    });

    socket.on("join:stock-alerts", () => {
      socket.join(SOCKET_CHANNELS.STOCK_ALERTS);
      socket.emit("joined", { channel: SOCKET_CHANNELS.STOCK_ALERTS });
    });

    socket.on("join:stock-movements", () => {
      socket.join(SOCKET_CHANNELS.STOCK_MOVEMENTS);
      socket.emit("joined", { channel: SOCKET_CHANNELS.STOCK_MOVEMENTS });
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client déconnecté : ${socket.id}`);
    });
  });
}

// ── Helpers d'émission utilisés par les modules métier ────────────────

export function emitOrderUpdate(io: Server, order: Record<string, unknown>): void {
  io.to(SOCKET_CHANNELS.ORDERS).emit("order:updated", order);
}

export function emitStockAlert(io: Server, alert: { productId: string; productName: string; quantity: number }): void {
  io.to(SOCKET_CHANNELS.STOCK_ALERTS).emit("stock:alert", alert);
}

export function emitStockMovement(io: Server, movement: Record<string, unknown>): void {
  io.to(SOCKET_CHANNELS.STOCK_MOVEMENTS).emit("stock:movement", movement);
}
