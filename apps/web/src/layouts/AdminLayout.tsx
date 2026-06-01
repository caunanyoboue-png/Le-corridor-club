import { Outlet } from "react-router-dom";
import { BarChart3, Package, Users, LayoutDashboard, Boxes } from "lucide-react";
import AppShell from "@/components/AppShell";

const adminNav = [
  { label: "Tableau de bord", to: "/admin",          icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Produits",        to: "/admin/produits",  icon: <Package className="w-5 h-5" /> },
  { label: "Employés",        to: "/admin/employes",  icon: <Users className="w-5 h-5" /> },
  { label: "Stock",           to: "/admin/stock",     icon: <Boxes className="w-5 h-5" /> },
  { label: "Rapports",        to: "/admin/rapports",  icon: <BarChart3 className="w-5 h-5" /> },
];

export default function AdminLayout() {
  return (
    <AppShell title="Administration — Le Corridor Club" nav={adminNav}>
      <Outlet />
    </AppShell>
  );
}
