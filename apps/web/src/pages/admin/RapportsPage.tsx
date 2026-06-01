import { useState } from "react";
import { Download, TrendingUp, ShoppingCart, Package, Loader2, RefreshCw, Zap, Calendar } from "lucide-react";
import { formatFCFA, cn } from "@/lib/utils";
import { useReportSummary } from "@/hooks/useAdmin";
import { useDailyReports } from "@/hooks/useEmploye";
import { useExportPDF } from "@/hooks/useExportPDF";

type Period = "today" | "week" | "month";
const PERIOD_LABELS: Record<Period, string> = { today: "Aujourd'hui", week: "Cette semaine", month: "Ce mois" };

export default function RapportsPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [tab, setTab] = useState<"summary" | "daily">("summary");
  const [exportingId, setExportingId] = useState<string | null>(null);
  const { data, isLoading, refetch, isFetching } = useReportSummary(period);
  const { data: dailyReports = [], isLoading: dailyLoading } = useDailyReports();
  const { exportToPDF } = useExportPDF();

  const maxSaleAmount = Math.max(...(data?.topProducts.map((p) => p.saleAmount) ?? [1]), 1);

  function handlePrint() { window.print(); }

  return (
    <div className="space-y-5 print:space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 print:hidden">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Rapports</h1>
          <p className="text-ink/55 text-xs sm:text-sm mt-1 sm:mt-0.5">Analyses des performances — Le Corridor Club</p>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <button onClick={() => refetch()} disabled={isFetching} className="btn-ghost gap-2 text-xs sm:text-sm flex-1 sm:flex-none">
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button onClick={handlePrint} className="btn-ghost gap-2 text-xs sm:text-sm flex-1 sm:flex-none">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimer</span>
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b border-sienna/15 print:hidden">
        <button
          onClick={() => setTab("summary")}
          className={cn("px-4 py-2.5 font-medium text-sm border-b-2 transition-colors",
            tab === "summary"
              ? "border-ocre text-ocre"
              : "border-transparent text-ink/60 hover:text-ink"
          )}
        >
          Résumé
        </button>
        <button
          onClick={() => setTab("daily")}
          className={cn("px-4 py-2.5 font-medium text-sm border-b-2 transition-colors",
            tab === "daily"
              ? "border-ocre text-ocre"
              : "border-transparent text-ink/60 hover:text-ink"
          )}
        >
          Rapports journaliers
        </button>
      </div>

      {/* ── TAB RÉSUMÉ ── */}
      {tab === "summary" ? (
        <>
          {/* Sélecteur période */}
          <div className="flex gap-2 p-1 bg-cream-hi border border-sienna/15 rounded-xl w-full sm:w-fit print:hidden overflow-x-auto">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn("shrink-0 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  period === p ? "bg-ink text-cream shadow-sm" : "text-ink/60 hover:text-ink"
                )}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ocre" /></div>
          ) : !data ? null : (
            <>
              {/* KPIs — CA, coût, bénéfice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                {[
                  { icon: TrendingUp,   label: "Chiffre d'affaires", value: formatFCFA(data.totalSales),   color: "text-ocre",   bg: "bg-ocre/10" },
                  { icon: ShoppingCart, label: "Transactions",        value: String(data.transactions),     color: "text-amber",  bg: "bg-amber/10" },
                  { icon: Package,      label: "Coût d'achat",        value: formatFCFA(data.costTotal),    color: "text-ink/50", bg: "bg-cream" },
                  { icon: Zap,          label: "Bénéfice brut",       value: formatFCFA(data.grossProfit),  color: "text-vert",   bg: "bg-vert/10" },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                  <div key={label} className="card flex flex-col gap-3 sm:gap-4">
                    <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center", bg)}>
                      <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-ink/55 font-medium truncate">{label}</p>
                      <p className={cn("amount text-lg sm:text-xl font-bold mt-0.5 sm:mt-1 truncate", color)}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Marge % */}
              <div className="card bg-cream-hi">
                <p className="text-sm text-ink/55 mb-3">Marge bénéficiaire</p>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 h-4 rounded-full bg-cream overflow-hidden">
                    <div
                      className="h-full rounded-full bg-vert transition-all"
                      style={{ width: `${Math.min(100, data.profitPercent)}%` }}
                    />
                  </div>
                  <p className="text-2xl font-bold text-vert whitespace-nowrap">{data.profitPercent}%</p>
                </div>
              </div>

              {/* Top produits */}
              <div className="card">
                <h2 className="card-title mb-5">Top produits — {PERIOD_LABELS[period]}</h2>
                {data.topProducts.length === 0 ? (
                  <div className="text-center py-10 text-ink/40">
                    <p className="text-sm">Aucune vente sur cette période</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.topProducts.map((p, i) => (
                      <div key={p.productId} className="flex items-center gap-3">
                        <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                          i === 0 ? "bg-amber text-ink" : "bg-cream-hi text-ink/50"
                        )}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                            <p className="amount text-sm font-semibold text-ocre shrink-0">{formatFCFA(p.saleAmount)}</p>
                          </div>
                          <div className="h-2 rounded-full bg-cream overflow-hidden">
                            <div className="h-full rounded-full bg-ocre transition-all duration-700"
                              style={{ width: `${(p.saleAmount / maxSaleAmount) * 100}%` }} />
                          </div>
                          <div className="flex items-center justify-between mt-1.5 text-xs text-ink/40">
                            <span>{p.quantity} unités</span>
                            <span className="text-vert font-semibold">Profit: {formatFCFA(p.profit)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        /* ── TAB RAPPORTS JOURNALIERS ── */
        <div className="space-y-3">
          {dailyLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ocre" /></div>
          ) : dailyReports.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-16 text-center">
              <Calendar className="w-10 h-10 text-ink/20" />
              <p className="text-ink/50">Aucun rapport journalier soumis</p>
            </div>
          ) : (
            dailyReports.map((report) => (
              <div key={report.id} className="card">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink text-sm sm:text-base truncate">
                        {new Date(report.date).toLocaleDateString("fr-CI", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </p>
                      <p className="text-xs sm:text-sm text-ink/55">{report.employee?.name ?? "Employé inconnu"}</p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-vert/10 text-vert text-xs font-semibold">
                      ✓ Soumis
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      setExportingId(report.id);
                      await exportToPDF(`rapport-${report.id}`, `Rapport_${report.date}.pdf`);
                      setExportingId(null);
                    }}
                    disabled={exportingId === report.id}
                    className="btn-secondary w-full sm:w-auto px-3 py-2 text-xs gap-2 justify-center"
                  >
                    {exportingId === report.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    <span>Exporter PDF</span>
                  </button>
                </div>

                {/* Contenu à exporter */}
                <div id={`rapport-${report.id}`}>
                {/* Stats du rapport */}
                {report.payload && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-cream-hi rounded-lg">
                      {[
                        { label: "CA",           value: formatFCFA(Number(report.totalSales ?? 0)),                 icon: "📈" },
                        { label: "Transactions", value: String(report.totalOrders ?? 0),                             icon: "🛒" },
                        { label: "Coût",         value: formatFCFA(Number(report.payload.totalCost ?? 0)),           icon: "📦" },
                        { label: "Bénéfice",     value: formatFCFA(Number(report.payload.grossProfit ?? 0)),         icon: "⚡" },
                      ].map(({ label, value, icon }) => (
                        <div key={label} className="text-center">
                          <p className="text-lg mb-1">{icon}</p>
                          <p className="text-xs text-ink/55">{label}</p>
                          <p className="text-sm font-bold text-ink">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Marge */}
                    <div className="mt-3 p-3 rounded-lg bg-vert/5 border border-vert/20 flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">Marge bénéficiaire</span>
                      <span className="text-lg font-bold text-vert">{report.payload.marginPercent ?? 0}%</span>
                    </div>
                  </>
                )}

                {/* Top produits */}
                {report.payload?.topProducts && report.payload.topProducts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-sienna/15">
                    <p className="text-xs font-semibold text-ink/70 uppercase mb-2">Top produits</p>
                    <div className="space-y-1.5">
                      {report.payload.topProducts.slice(0, 3).map((p) => (
                        <div key={p.productId} className="flex items-center justify-between text-sm">
                          <span className="text-ink/70">{p.name}</span>
                          <span className="font-semibold text-ocre">{formatFCFA(Number(p.saleAmount ?? 0))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
