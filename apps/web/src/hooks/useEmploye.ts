import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────

export interface Category { id: string; name: string; icon: string | null }
export interface StockItemInline { id: string; quantity: number }
export interface Product {
  id: string; name: string; description: string | null;
  salePrice: number; buyPrice: number; unit: string;
  imageUrl: string | null; visible: boolean; stockAlertThreshold: number;
  categoryId: string; category: Category; stockItem: StockItemInline | null;
}

export interface OrderItem {
  id: string; productId: string; quantity: number; unitPrice: number;
  note: string | null; product: Product;
}
export interface Order {
  id: string; orderNumber: string; status: string; note: string | null;
  createdAt: string; updatedAt: string;
  customerId: string | null; employeeId: string | null;
  items: OrderItem[];
  employee?: { id: string; name: string } | null;
  customer?: { id: string; name: string } | null;
}

export interface StockItemFull {
  id: string; productId: string; quantity: number;
  product: Product & { category: Category };
}

// ── Produits ──────────────────────────────────────────────────────────

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => api.get("/products").then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  });
}

// ── Commandes ─────────────────────────────────────────────────────────

export function useOrders(status?: string) {
  return useQuery<Order[]>({
    queryKey: ["orders", status],
    queryFn: () => api.get("/orders", { params: status ? { status } : {} }).then((r) => r.data),
    refetchInterval: 15000, // polling 15s
    staleTime: 0,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      tableLabel?: string; note?: string;
      items: { productId: string; quantity: number; note?: string }[];
    }) => api.post<Order>("/orders", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put<Order>(`/orders/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

// ── Ventes directes ───────────────────────────────────────────────────

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      customerLabel?: string;
      items: { productId: string; quantity: number }[];
    }) => api.post("/sales", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// ── Stock ─────────────────────────────────────────────────────────────

export function useStock() {
  return useQuery<StockItemFull[]>({
    queryKey: ["stock"],
    queryFn: () => api.get("/stock").then((r) => r.data),
    staleTime: 1000 * 30,
  });
}

export function useCreateStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      productId: string; type: "IN" | "OUT" | "LOSS" | "ADJUSTMENT";
      quantity: number; reason?: string;
    }) => api.post("/stock/movement", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock"] }),
  });
}

// ── Rapport journalier ────────────────────────────────────────────────

export interface DailyReport {
  id: string;
  date: string;
  employeeId?: string;
  totalSales: number;
  totalOrders: number;
  payload: {
    topProducts: Array<{ productId: string; name: string; quantity: number; saleAmount: number; costAmount: number }>;
    totalCost: number;
    grossProfit: number;
    marginPercent: number;
    submittedAt: string;
  };
  employee?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export function useSubmitDailyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => api.post<DailyReport>("/reports/daily", { date }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports", "daily-list"] });
    },
  });
}

export function useDailyReports(employeeId?: string, fromDate?: string, toDate?: string) {
  return useQuery<DailyReport[]>({
    queryKey: ["reports", "daily-list", employeeId, fromDate, toDate],
    queryFn: () => api.get("/reports/daily-list", { params: { employeeId, fromDate, toDate } }).then((r) => r.data),
  });
}
