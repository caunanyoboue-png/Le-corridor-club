import { useState } from "react";
import { Calendar, TrendingUp, ShoppingCart, CheckCircle, Loader2, AlertCircle, Download } from "lucide-react";
import { formatFCFA, cn } from "@/lib/utils";
import { useSubmitDailyReport, useDailyReports } from "@/hooks/useEmploye";
import { useExportPDF } from "@/hooks/useExportPDF";

export default function RapportPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [isExporting, setIsExporting] = useState(false);

  const submit = useSubmitDailyReport();
  const { data: reports = [] } = useDailyReports(undefined, selectedDate, selectedDate);
  const { exportToPDF } = useExportPDF();

  // Vérifier si un rapport existe déjà pour cette date
  const reportExists = reports.length > 0;
  const report = reports[0];

  async function handleSubmit() {
    if (reportExists) return;
    try {
      await submit.mutateAsync(selectedDate);
    } catch {
      // Erreur affichée en UI
    }
  }

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Rapport journalier</h1>
        <p className="text-ink/55 text-xs sm:text-sm mt-1 sm:mt-0.5">Bilan de votre journée de travail</p>
      </div>

      {/* Sélecteur date */}
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-ink/60 shrink-0" />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input-field flex-1 sm:flex-none sm:max-w-xs"
        />
      </div>

      {/* Si rapport soumis */}
      {reportExists && report ? (
        <div className="space-y-5">
          {/* Statut */}
          <div className="card bg-vert/10 border border-vert/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-vert shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-vert">Rapport soumis</p>
                <p className="text-xs sm:text-sm text-vert/70 truncate">{new Date(report.createdAt ?? "").toLocaleString("fr-CI")}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                setIsExporting(true);
                await exportToPDF("rapport-content", `Rapport_${selectedDate}.pdf`);
                setIsExporting(false);
              }}
              disabled={isExporting}
              className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm shrink-0"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Exporter PDF</span>
            </button>
          </div>

          {/* Contenu à exporter */}
          <div id="rapport-content" className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {[
              { label: "Chiffre d'affaires", value: formatFCFA(Number(report.totalSales ?? 0)), icon: TrendingUp, color: "text-ocre" },
              { label: "Transactions", value: String(report.totalOrders ?? 0), icon: ShoppingCart, color: "text-amber" },
              {
                label: "Coût achat",
                value: formatFCFA(Number(report.payload?.totalCost ?? 0)),
                icon: TrendingUp,
                color: "text-ink/40",
              },
              {
                label: "Bénéfice brut",
                value: formatFCFA(Number(report.payload?.grossProfit ?? 0)),
                icon: TrendingUp,
                color: "text-vert",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card flex flex-col gap-2 sm:gap-3">
                <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", color)} />
                <p className="text-xs sm:text-sm text-ink/55 truncate">{label}</p>
                <p className={cn("amount text-base sm:text-lg font-bold truncate", color)}>{value}</p>
              </div>
            ))}
          </div>

          {/* Marge */}
          {report.payload && (
            <div className="card bg-cream-hi">
              <p className="text-sm text-ink/55 mb-2">Marge bénéficiaire</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-cream overflow-hidden">
                  <div
                    className="h-full rounded-full bg-vert transition-all"
                    style={{ width: `${Math.min(100, report.payload.marginPercent ?? 0)}%` }}
                  />
                </div>
                <p className="text-xl font-bold text-vert whitespace-nowrap">{report.payload.marginPercent ?? 0}%</p>
              </div>
            </div>
          )}

          {/* Top produits */}
          <div className="card">
            <h2 className="card-title mb-4">Top produits vendus</h2>
            <div className="space-y-3">
              {report.payload.topProducts.length === 0 ? (
                <p className="text-sm text-ink/40 text-center py-4">Aucun produit vendu ce jour</p>
              ) : (
                report.payload.topProducts.map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3 pb-3 border-b border-sienna/10 last:border-0">
                    <span className="w-6 h-6 rounded-full bg-ocre/10 flex items-center justify-center text-xs font-bold text-ocre">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                      <p className="text-xs text-ink/40">
                        {p.quantity} unité{p.quantity > 1 ? "s" : ""} · Coût: {formatFCFA(p.costAmount)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="amount text-sm font-bold text-ocre">{formatFCFA(p.saleAmount)}</p>
                      <p className="text-xs text-vert font-semibold">{formatFCFA(p.saleAmount - p.costAmount)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          </div>
        </div>
      ) : (
        /* Si rapport non soumis */
        <div className="card flex flex-col items-center gap-4 py-12 text-center border-2 border-dashed">
          <AlertCircle className="w-10 h-10 text-ink/30" />
          <div>
            <p className="font-semibold text-ink">Aucun rapport pour cette date</p>
            <p className="text-sm text-ink/55 mt-1">
              {selectedDate === new Date().toISOString().split("T")[0]
                ? "Soumettez votre rapport de fin de journée"
                : "Vous ne pouvez soumettre un rapport que pour aujourd'hui"}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submit.isPending || selectedDate !== new Date().toISOString().split("T")[0]}
            className={cn(
              "px-6 py-3 rounded-xl text-sm font-semibold transition-all",
              selectedDate === new Date().toISOString().split("T")[0]
                ? "btn-cta"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            )}
          >
            {submit.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> Soumission en cours…
              </>
            ) : (
              "Soumettre mon rapport"
            )}
          </button>
          {submit.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
              {typeof submit.error === "object" && submit.error && "message" in submit.error
                ? (submit.error.message as string)
                : "Erreur lors de la soumission"}
            </p>
          )}
        </div>
      )}

      {/* Historique */}
      {reports.length > 1 && (
        <div className="card">
          <h2 className="card-title mb-4">Historique</h2>
          <div className="space-y-2">
            {reports.slice(1).map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedDate(r.date)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-sienna/20 hover:bg-cream-hi transition-colors text-left"
              >
                <Calendar className="w-4 h-4 text-ink/40 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{new Date(r.date).toLocaleDateString("fr-CI")}</p>
                  <p className="text-xs text-ink/50">
                    {formatFCFA(r.totalSales)} · {r.totalOrders} transaction{r.totalOrders > 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-xs font-semibold text-vert px-2 py-1 rounded-full bg-vert/10">
                  ✓ Soumis
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
