import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────

export interface Category { id: string; name: string; icon: string | null }

export interface Product {
  id: string; name: string; description: string | null;
  salePrice: number; buyPrice: number; unit: string;
  imageUrl: string | null; visible: boolean;
  stockAlertThreshold: number; categoryId: string;
  category: Category;
  stockItem: { id: string; quantity: number } | null;
}

export interface AdminUser {
  id: string; name: string; email: string | null; phone: string | null;
  role: string; active: boolean; createdAt: string;
}

export interface AdminStats {
  totalSalesToday: number; transactionsToday: number;
  activeOrders: number; activeProducts: number; activeEmployees: number;
  costToday: number; profitToday: number; profitPercent: number;
}

export interface TopProduct {
  productId: string; name: string; quantity: number;
  saleAmount: number; costAmount: number; profit: number;
}
export interface ReportSummary {
  period: string; totalSales: number; costTotal: number; grossProfit: number; profitPercent: number;
  transactions: number; orders: number; avgCart: number; topProducts: TopProduct[];
}

// ── Produits ──────────────────────────────────────────────────────────

export function useAdminProducts() {
  return useQuery<Product[]>({
    queryKey: ["admin", "products"],
    queryFn: () => api.get("/products").then((r) => r.data),
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/products/categories").then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Product> & { initialStock?: number }) =>
      api.post<Product>("/products", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Product> & { id: string }) =>
      api.put<Product>(`/products/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useToggleProductVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) =>
      api.patch<Product>(`/products/${id}/visibility`, { visible }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

// ── Utilisateurs ──────────────────────────────────────────────────────

export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: () => api.get("/admin/users").then((r) => r.data),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email?: string; phone?: string; password: string; role: string }) =>
      api.post<AdminUser>("/admin/users", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; email?: string; phone?: string; role?: string }) =>
      api.put<AdminUser>(`/admin/users/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch<AdminUser>(`/admin/users/${id}/status`, { active }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.patch(`/admin/users/${id}/password`, { password }).then((r) => r.data),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

// ── Stats & Rapports ──────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get("/admin/stats").then((r) => r.data),
    refetchInterval: 30000,
  });
}

export function useReportSummary(period: "today" | "week" | "month") {
  return useQuery<ReportSummary>({
    queryKey: ["reports", "summary", period],
    queryFn: () => api.get("/reports/summary", { params: { period } }).then((r) => r.data),
  });
}

// ── Historique mouvements stock ──────────────────────────────────────

export interface StockMovement {
  id: string;
  productId: string;
  userId: string;
  type: "IN" | "OUT" | "LOSS" | "ADJUSTMENT";
  quantity: number;
  reason?: string;
  reference?: string;
  createdAt: string;
  product: { id: string; name: string; unit: string };
  user: { id: string; name: string };
}

export function useStockMovements() {
  return useQuery<StockMovement[]>({
    queryKey: ["stock", "movements"],
    queryFn: () => api.get<StockMovement[]>("/stock/movements").then((r) => r.data),
    staleTime: 1000 * 60,
  });
}
