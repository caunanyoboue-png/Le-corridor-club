import { Outlet } from "react-router-dom";
import { ShoppingCart, Package, FileText } from "lucide-react";
import AppShell from "@/components/AppShell";

const employeNav = [
  { label: "Caisse",   to: "/employe",        icon: <ShoppingCart className="w-5 h-5" /> },
  { label: "Stock",    to: "/employe/stock",  icon: <Package className="w-5 h-5" /> },
  { label: "Rapport",  to: "/employe/rapport", icon: <FileText className="w-5 h-5" /> },
];

export default function EmployeLayout() {
  return (
    <AppShell title="Caisse — Le Corridor Club" nav={employeNav}>
      <Outlet />
    </AppShell>
  );
}
