import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { SOCKET_CHANNELS } from "@maquis/shared";

export interface StockMovementNotification {
  id: string;
  type: "IN" | "OUT" | "LOSS" | "ADJUSTMENT";
  quantity: number;
  productName: string;
  productUnit: string;
  userName: string;
  newQuantity: number;
  reason?: string;
  createdAt: string;
}

export function useStockMovementNotifications() {
  const [notification, setNotification] = useState<StockMovementNotification | null>(null);

  useEffect(() => {
    socket.emit("join:stock-movements");

    const handleMovement = (movement: StockMovementNotification) => {
      setNotification(movement);
      setTimeout(() => setNotification(null), 5000);
    };

    socket.on("stock:movement", handleMovement);

    return () => {
      socket.off("stock:movement", handleMovement);
    };
  }, []);

  return { notification };
}
