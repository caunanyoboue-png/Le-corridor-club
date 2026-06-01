import { Outlet } from "react-router-dom";
import { UtensilsCrossed, ClipboardList } from "lucide-react";
import AppShell from "@/components/AppShell";

const clientNav = [
  { label: "Commander",      to: "/client",           icon: <UtensilsCrossed className="w-5 h-5" /> },
  { label: "Mes commandes",  to: "/client/commandes", icon: <ClipboardList className="w-5 h-5" /> },
];

export default function ClientLayout() {
  return (
    <AppShell title="Le Corridor Club" nav={clientNav}>
      <Outlet />
    </AppShell>
  );
}
