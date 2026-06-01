import { useEffect, useState } from "react";
import { AlertTriangle, TrendingDown, Plus, X, Loader2, Search, Check, ArrowUp, ArrowDown } from "lucide-react";
import { useStock, useCreateStockMovement, type StockItemFull } from "@/hooks/useEmploye";
import { useStockMovementNotifications } from "@/hooks/useStockNotifications";
import { cn } from "@/lib/utils";

// ── Types mouvement ───────────────────────────────────────────────────
type MvtType = "IN" | "OUT" | "LOSS" | "ADJUSTMENT";

const MVT_TYPES: { key: MvtType; label: string; desc: string; color: string }[] = [
  { key: "IN",         label: "Entrée",      desc: "Réapprovisionnement",       color: "text-vert" },
  { key: "OUT",        label: "Sortie",      desc: "Retrait manuel",            color: "text-ocre" },
  { key: "LOSS",       label: "Perte",       desc: "Casse, péremption…",        color: "text-red-500" },
  { key: "ADJUSTMENT", label: "Ajustement",  desc: "Correction d'inventaire",   color: "text-amber" },
];

// ── Modal mouvement ───────────────────────────────────────────────────
function MovementModal({
  item, onClose,
}: {
  item: StockItemFull;
  onClose: () => void;
}) {
  const createMvt = useCreateStockMovement();
  const [type, setType] = useState<MvtType>("IN");
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState("");

  async function handleSubmit() {
    const q = parseFloat(qty);
    if (!q || q <= 0) return;
    await createMvt.mutateAsync({
      productId: item.productId,
      type,
      quantity: q,
      reason: reason || undefined,
    });
    onClose();
  }

  const currentQty = Number(item.quantity);
  const isOut = type === "OUT" || type === "LOSS";
  const newQty = isOut ? currentQty - parseFloat(qty || "0") : currentQty + parseFloat(qty || "0");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-ink/40">
      <div className="w-full max-w-md bg-cream rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-ink text-cream px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display font-semibold text-lg">Mouvement de stock</h2>
            <p className="text-cream/60 text-sm">{item.product.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-cream/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Stock actuel */}
          <div className="flex items-center justify-between bg-cream-hi rounded-xl px-4 py-3 border border-sienna/15">
            <span className="text-sm text-ink/60">Stock actuel</span>
            <span className="amount font-bold text-ink text-lg">{currentQty} {item.product.unit}</span>
          </div>

          {/* Type de mouvement */}
          <div>
            <label className="label">Type de mouvement</label>
            <div className="grid grid-cols-2 gap-2">
              {MVT_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    type === t.key
                      ? "border-ocre bg-ocre/5"
                      : "border-sienna/20 hover:border-sienna/40"
                  )}
                >
                  <p className={cn("font-semibold text-sm", type === t.key ? "text-ocre" : "text-ink")}>
                    {t.label}
                  </p>
                  <p className="text-xs text-ink/45 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quantité */}
          <div>
            <label className="label">Quantité ({item.product.unit})</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Raison */}
          <div>
            <label className="label">Raison (facultatif)</label>
            <input
              type="text"
              placeholder="Livraison fournisseur, inventaire…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Aperçu nouveau stock */}
          {qty && parseFloat(qty) > 0 && (
            <div className={cn(
              "flex items-center justify-between rounded-xl px-4 py-3 border",
              newQty < 0
                ? "bg-red-50 border-red-200"
                : newQty <= item.product.stockAlertThreshold
                  ? "bg-amber/10 border-amber/30"
                  : "bg-vert/5 border-vert/20"
            )}>
              <span className="text-sm text-ink/70">Nouveau stock</span>
              <span className={cn(
                "amount font-bold text-lg",
                newQty < 0 ? "text-red-600" : newQty <= item.product.stockAlertThreshold ? "text-amber" : "text-vert"
              )}>
                {Math.max(0, newQty)} {item.product.unit}
              </span>
            </div>
          )}

          {newQty < 0 && (
            <p className="text-xs text-red-600 text-center">⚠ Stock insuffisant pour cette sortie</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
            <button
              onClick={handleSubmit}
              disabled={createMvt.isPending || newQty < 0 || !qty || parseFloat(qty) <= 0}
              className="btn-cta flex-1"
            >
              {createMvt.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : "Valider"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────
function stockLevel(qty: number, threshold: number): "ok" | "low" | "critical" {
  if (qty <= 0) return "critical";
  if (qty <= threshold) return "low";
  return "ok";
}
const levelStyle = {
  ok:       { bar: "bg-vert",    text: "text-vert",    bg: "bg-vert/5",   badge: "bg-vert/10 text-vert",      label: "OK" },
  low:      { bar: "bg-amber",   text: "text-amber",   bg: "bg-amber/10", badge: "bg-amber/15 text-amber",    label: "Bas" },
  critical: { bar: "bg-red-500", text: "text-red-500", bg: "bg-red-50",   badge: "bg-red-100 text-red-600",   label: "Critique" },
};

export default function StockPage() {
  const { data: items = [], isLoading, refetch } = useStock();
  const [selectedItem, setSelectedItem] = useState<StockItemFull | null>(null);
  const [search, setSearch] = useState("");
  const { notification } = useStockMovementNotifications();

  // Recharger le stock quand une notification arrive
  useEffect(() => {
    if (notification) {
      refetch();
    }
  }, [notification, refetch]);

  const alerts = items.filter((s) => stockLevel(Number(s.quantity), s.product.stockAlertThreshold) !== "ok");

  const filtered = search
    ? items.filter((s) => s.product.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-ocre" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Notification mouvement temps réel */}
      {notification && (
        <div className="card flex items-start gap-3 border-l-4 border-vert bg-vert/5 animate-in slide-in-from-top">
          <Check className="w-5 h-5 text-vert mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink text-sm">
              Mouvement de stock · {notification.productName}
            </p>
            <p className="text-xs text-ink/60 mt-1">
              {notification.type === "IN" ? <ArrowUp className="w-3 h-3 inline mr-1" /> : <ArrowDown className="w-3 h-3 inline mr-1" />}
              <span className="font-medium">{notification.type}</span> de {notification.quantity} {notification.productUnit} par {notification.userName}
            </p>
            <p className="text-xs text-ink/50 mt-1">
              Nouveau stock: <span className="font-semibold text-ink">{notification.newQuantity} {notification.productUnit}</span>
            </p>
            {notification.reason && (
              <p className="text-xs text-ink/60 mt-1 italic">Raison: {notification.reason}</p>
            )}
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Stock</h1>
          <p className="text-ink/55 text-xs sm:text-sm mt-1 sm:mt-0.5">
            {alerts.length > 0
              ? `${alerts.length} produit${alerts.length > 1 ? "s" : ""} sous le seuil · ${items.length} au total`
              : `${items.length} produits · tous OK`}
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-ghost w-full sm:w-auto justify-center sm:justify-start gap-2">
          Actualiser
        </button>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="card border-amber/30 bg-amber/5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber shrink-0" />
            <h2 className="font-semibold text-ink">
              {alerts.length} alerte{alerts.length > 1 ? "s" : ""} stock
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {alerts.map((s) => {
              const level = stockLevel(Number(s.quantity), s.product.stockAlertThreshold);
              const style = levelStyle[level];
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedItem(s)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:shadow-sm",
                    style.bg, "border",
                    level === "critical" ? "border-red-200" : "border-amber/20"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{s.product.name}</p>
                    <p className={cn("text-xs font-semibold", style.text)}>
                      {Number(s.quantity)} {s.product.unit} · seuil {s.product.stockAlertThreshold}
                    </p>
                  </div>
                  <TrendingDown className={cn("w-4 h-4 shrink-0", style.text)} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
        <input
          type="text"
          placeholder="Rechercher un produit…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Inventaire */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-sienna/10 flex items-center justify-between">
          <h2 className="card-title">Inventaire complet</h2>
          <span className="text-xs text-ink/40">{filtered.length} produits</span>
        </div>
        <div className="divide-y divide-sienna/8">
          {filtered.map((s) => {
            const qty = Number(s.quantity);
            const level = stockLevel(qty, s.product.stockAlertThreshold);
            const style = levelStyle[level];
            const maxQty = Math.max(qty, s.product.stockAlertThreshold * 5, 1);
            const pct = Math.min(100, Math.round((qty / maxQty) * 100));

            return (
              <div
                key={s.id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-cream/60 transition-colors cursor-pointer group"
                onClick={() => setSelectedItem(s)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-sm font-medium text-ink truncate">{s.product.name}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", style.badge)}>
                        {style.label}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4 text-ocre" />
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-cream overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", style.bar)} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="amount text-xs font-semibold text-ink/60 shrink-0 text-right w-20">
                      {qty} {s.product.unit}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal mouvement */}
      {selectedItem && (
        <MovementModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
