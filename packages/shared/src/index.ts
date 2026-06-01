// ── Rôles ────────────────────────────────────────────────────────────
export enum Role {
  CLIENT = "CLIENT",
  EMPLOYEE = "EMPLOYEE",
  ADMIN = "ADMIN",
}

// ── Statuts commande ──────────────────────────────────────────────────
export enum OrderStatus {
  PENDING = "PENDING",
  PREPARING = "PREPARING",
  READY = "READY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

// ── Types mouvements stock ────────────────────────────────────────────
export enum StockType {
  IN = "IN",
  OUT = "OUT",
  LOSS = "LOSS",
  ADJUSTMENT = "ADJUSTMENT",
}

// ── Types notification ────────────────────────────────────────────────
export enum NotifType {
  ORDER_READY = "ORDER_READY",
  STOCK_LOW = "STOCK_LOW",
  ORDER_UPDATE = "ORDER_UPDATE",
  SYSTEM = "SYSTEM",
}

// ── Devise FCFA ───────────────────────────────────────────────────────
export function formatFCFA(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "0 FCFA";
  const n = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (isNaN(n)) return "0 FCFA";
  return Math.round(n).toLocaleString("fr-FR") + " FCFA";
}

// ── Couleurs statut commande (CSS class suffixes) ─────────────────────
export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "ocre",
  [OrderStatus.PREPARING]: "amber",
  [OrderStatus.READY]: "vert",
  [OrderStatus.DELIVERED]: "ink",
  [OrderStatus.CANCELLED]: "muted",
};

// ── Labels FR ────────────────────────────────────────────────────────
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "En attente",
  [OrderStatus.PREPARING]: "En préparation",
  [OrderStatus.READY]: "Prêt",
  [OrderStatus.DELIVERED]: "Livré",
  [OrderStatus.CANCELLED]: "Annulé",
};

export const ROLE_LABEL: Record<Role, string> = {
  [Role.CLIENT]: "Client",
  [Role.EMPLOYEE]: "Employé",
  [Role.ADMIN]: "Administrateur",
};

// ── Canaux Socket.io ──────────────────────────────────────────────────
export const SOCKET_CHANNELS = {
  ORDERS: "orders",
  STOCK_ALERTS: "stock-alerts",
  STOCK_MOVEMENTS: "stock-movements",
} as const;

// ── Seuil stock bas par défaut ────────────────────────────────────────
export const DEFAULT_STOCK_ALERT_THRESHOLD = 10;
