import { useState } from "react";
import { Search, Loader2, RefreshCw, TrendingUp, TrendingDown, AlertCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStockMovements } from "@/hooks/useAdmin";

const MOVEMENT_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  IN:         { label: "Entrée",      icon: <TrendingUp className="w-4 h-4" />,     color: "text-vert" },
  OUT:        { label: "Sortie",      icon: <TrendingDown className="w-4 h-4" />,   color: "text-ocre" },
  LOSS:       { label: "Perte",       icon: <AlertCircle className="w-4 h-4" />,    color: "text-red-500" },
  ADJUSTMENT: { label: "Ajustement",  icon: <Zap className="w-4 h-4" />,            color: "text-amber" },
};

export default function AdminStockPage() {
  const { data: movements = [], isLoading, refetch, isFetching } = useStockMovements();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filtered = movements.filter((m) => {
    const matchType = typeFilter === "ALL" || m.type === typeFilter;
    const matchSearch = m.product.name.toLowerCase().includes(search.toLowerCase()) ||
                        m.user.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Historique Stock</h1>
          <p className="text-ink/55 text-xs sm:text-sm mt-1 sm:mt-0.5">100 derniers mouvements d'inventaire</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="btn-ghost gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center sm:justify-start">
          <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} /> <span>Actualiser</span>
        </button>
      </div>

      {/* Recherche + filtres */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          <input
            type="text"
            placeholder="Rechercher un produit ou un employé…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Filtres type */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setTypeFilter("ALL")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
              typeFilter === "ALL"
                ? "bg-ink text-cream border-ink"
                : "bg-cream-hi border-sienna/20 text-ink/70 hover:border-sienna/50"
            )}
          >
            Tous
          </button>
          {Object.entries(MOVEMENT_LABELS).map(([type, { label }]) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                typeFilter === type
                  ? "bg-ink text-cream border-ink"
                  : "bg-cream-hi border-sienna/20 text-ink/70 hover:border-sienna/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-ocre" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="w-10 h-10 text-ink/20" />
          <p className="text-ink/50">Aucun mouvement trouvé</p>
        </div>
      ) : (
        <>
          {/* Tableau desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sienna/15">
                  <th className="text-left p-3 font-semibold text-ink/70">Date</th>
                  <th className="text-left p-3 font-semibold text-ink/70">Produit</th>
                  <th className="text-left p-3 font-semibold text-ink/70">Type</th>
                  <th className="text-right p-3 font-semibold text-ink/70">Quantité</th>
                  <th className="text-left p-3 font-semibold text-ink/70">Employé</th>
                  <th className="text-left p-3 font-semibold text-ink/70">Raison</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const info = MOVEMENT_LABELS[m.type];
                  const date = new Date(m.createdAt);
                  const timeStr = date.toLocaleTimeString("fr-CI", { hour: "2-digit", minute: "2-digit" });
                  const dateStr = date.toLocaleDateString("fr-CI");

                  return (
                    <tr key={m.id} className="border-b border-sienna/10 hover:bg-cream-hi transition-colors">
                      <td className="p-3 text-ink/60">
                        <div className="text-xs">{dateStr}</div>
                        <div className="text-xs text-ink/40">{timeStr}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-ink">{m.product.name}</div>
                        <div className="text-xs text-ink/40">{m.product.unit}</div>
                      </td>
                      <td className="p-3">
                        <div className={cn("flex items-center gap-1.5 w-fit", info.color)}>
                          {info.icon}
                          <span className="text-xs font-semibold">{info.label}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-semibold text-ink">
                        <span className={m.type === "IN" || m.type === "ADJUSTMENT" ? "text-vert" : "text-ocre"}>
                          {m.type === "IN" || m.type === "ADJUSTMENT" ? "+" : "−"}{m.quantity}
                        </span>
                      </td>
                      <td className="p-3 text-ink/70">{m.user.name}</td>
                      <td className="p-3 text-ink/60 text-xs max-w-xs truncate">{m.reason ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cartes mobile */}
          <div className="md:hidden space-y-3">
            {filtered.map((m) => {
              const info = MOVEMENT_LABELS[m.type];
              const date = new Date(m.createdAt);
              const timeStr = date.toLocaleTimeString("fr-CI", { hour: "2-digit", minute: "2-digit" });
              const dateStr = date.toLocaleDateString("fr-CI");

              return (
                <div key={m.id} className="card">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-xs text-ink/55">{dateStr} · {timeStr}</p>
                      <p className="font-semibold text-ink mt-1">{m.product.name}</p>
                    </div>
                    <div className={cn("flex items-center gap-1.5 shrink-0", info.color)}>
                      {info.icon}
                      <span className="text-xs font-semibold">{info.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-ink/60">{m.product.unit}</span>
                    <span className={cn("font-bold text-base", m.type === "IN" || m.type === "ADJUSTMENT" ? "text-vert" : "text-ocre")}>
                      {m.type === "IN" || m.type === "ADJUSTMENT" ? "+" : "−"}{m.quantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-ink/55 pt-2 border-t border-sienna/10">
                    <span>{m.user.name}</span>
                    <span className="text-ink/40 truncate max-w-[150px] text-right">{m.reason ?? "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Stats */}
      {movements.length > 0 && (
        <div className="card bg-cream-hi">
          <p className="text-xs font-semibold text-ink/70 uppercase mb-3">Résumé (tous les mouvements)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { type: "IN",         label: "Entrées totales" },
              { type: "OUT",        label: "Sorties totales" },
              { type: "LOSS",       label: "Pertes totales" },
              { type: "ADJUSTMENT", label: "Ajustements" },
            ].map(({ type, label }) => {
              const total = movements
                .filter((m) => m.type === type)
                .reduce((sum, m) => sum + Number(m.quantity), 0);
              return (
                <div key={type}>
                  <p className="text-xs text-ink/55">{label}</p>
                  <p className={cn("text-lg font-bold mt-1", MOVEMENT_LABELS[type].color)}>
                    {total}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
