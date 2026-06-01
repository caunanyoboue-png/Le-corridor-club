import { Package, TrendingUp, AlertTriangle, Loader2, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { formatFCFA } from "@/lib/utils";
import { useAdminStats } from "@/hooks/useAdmin";
import { useStock } from "@/hooks/useEmploye";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: stockItems = [] } = useStock();

  const stockAlerts = stockItems
    .filter((s) => Number(s.quantity) <= s.product.stockAlertThreshold)
    .slice(0, 4);

  const kpis = [
    {
      icon: TrendingUp,   label: "Ventes du jour",
      value: statsLoading ? "…" : formatFCFA(stats?.totalSalesToday ?? 0),
      sub: statsLoading ? "" : `${stats?.transactionsToday ?? 0} transaction${(stats?.transactionsToday ?? 0) > 1 ? "s" : ""}`,
      color: "text-ocre",   bg: "bg-ocre/10",
    },
    {
      icon: Package,      label: "Coût d'achat",
      value: statsLoading ? "…" : formatFCFA(stats?.costToday ?? 0),
      sub: "Aujourd'hui",
      color: "text-ink/50", bg: "bg-cream",
    },
    {
      icon: Zap,          label: "Bénéfice brut",
      value: statsLoading ? "…" : formatFCFA(stats?.profitToday ?? 0),
      sub: statsLoading ? "" : `${stats?.profitPercent ?? 0}% marge`,
      color: "text-vert",   bg: "bg-vert/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Tableau de bord</h1>
          <p className="text-ink/55 text-xs sm:text-sm mt-1 sm:mt-0.5">Vue d'ensemble — Le Corridor Club</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-vert/10 text-vert text-xs font-semibold shrink-0 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-vert inline-block animate-pulse" />
          Ouvert · données en direct
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
        {kpis.map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="card flex flex-col gap-3 sm:gap-4 min-w-0">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-ink/55 font-medium truncate">{label}</p>
              {statsLoading
                ? <Loader2 className="w-4 h-4 animate-spin text-ink/30 mt-1" />
                : <p className={`amount text-lg sm:text-xl font-bold ${color} truncate`}>{value}</p>}
              <p className="text-xs text-ink/40 mt-0.5 sm:mt-1 truncate">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Corps */}
      <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        {/* Alertes stock */}
        <div className="md:col-span-3 card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber shrink-0" />
            <h2 className="card-title">Alertes stock</h2>
          </div>
          {stockAlerts.length === 0 ? (
            <div className="text-center py-6 text-ink/40">
              <p className="text-sm">Tous les stocks sont suffisants ✓</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stockAlerts.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber/5 border border-amber/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{s.product.name}</p>
                    <p className="text-xs text-amber font-semibold">
                      {Number(s.quantity)} {s.product.unit} restant{Number(s.quantity) > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="w-10 h-1.5 rounded-full bg-amber/20 overflow-hidden shrink-0">
                    <div className="h-full rounded-full bg-amber"
                      style={{ width: `${Math.min(100, (Number(s.quantity) / s.product.stockAlertThreshold) * 100)}%` }} />
                  </div>
                </div>
              ))}
              <Link to="/employe/stock" className="block text-xs text-center text-ocre hover:underline pt-1">
                Gérer le stock →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Gérer les produits", to: "/admin/produits", emoji: "📦", border: "border-ocre/30 hover:border-ocre" },
          { label: "Gérer les employés", to: "/admin/employes", emoji: "👤", border: "border-vert/30 hover:border-vert" },
          { label: "Voir les rapports",  to: "/admin/rapports", emoji: "📊", border: "border-amber/30 hover:border-amber" },
        ].map((item) => (
          <Link key={item.to} to={item.to}
            className={`card flex items-center gap-4 hover:shadow-md transition-all border-2 ${item.border}`}>
            <span className="text-2xl">{item.emoji}</span>
            <span className="font-medium text-ink text-sm">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
