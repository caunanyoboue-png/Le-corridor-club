import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/lib/store";
import { Role } from "@maquis/shared";

import AdminLayout from "@/layouts/AdminLayout";
import EmployeLayout from "@/layouts/EmployeLayout";
import ClientLayout from "@/layouts/ClientLayout";

import LoginPage from "@/pages/LoginPage";

// Admin
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ProduitsPage from "@/pages/admin/ProduitsPage";
import EmployesPage from "@/pages/admin/EmployesPage";
import RapportsPage from "@/pages/admin/RapportsPage";
import AdminStockPage from "@/pages/admin/AdminStockPage";

// Employé
import CaissePage from "@/pages/employe/CaissePage";
import StockPage from "@/pages/employe/StockPage";
import RapportPage from "@/pages/employe/RapportPage";

// Client
import MenuPage from "@/pages/client/MenuPage";
import CommandesClientPage from "@/pages/client/CommandesClientPage";

function RoleGuard({ allowed, children }: { allowed: Role[]; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role as Role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === Role.ADMIN) return <Navigate to="/admin" replace />;
  if (user.role === Role.EMPLOYEE) return <Navigate to="/employe" replace />;
  return <Navigate to="/client" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ── Admin ── */}
        <Route
          path="/admin"
          element={<RoleGuard allowed={[Role.ADMIN]}><AdminLayout /></RoleGuard>}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="produits" element={<ProduitsPage />} />
          <Route path="employes" element={<EmployesPage />} />
          <Route path="rapports" element={<RapportsPage />} />
          <Route path="stock" element={<AdminStockPage />} />
        </Route>

        {/* ── Employé ── */}
        <Route
          path="/employe"
          element={<RoleGuard allowed={[Role.EMPLOYEE, Role.ADMIN]}><EmployeLayout /></RoleGuard>}
        >
          <Route index element={<CaissePage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="rapport" element={<RapportPage />} />
        </Route>

        {/* ── Client ── */}
        <Route
          path="/client"
          element={<RoleGuard allowed={[Role.CLIENT, Role.EMPLOYEE, Role.ADMIN]}><ClientLayout /></RoleGuard>}
        >
          <Route index element={<MenuPage />} />
          <Route path="commandes" element={<CommandesClientPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
