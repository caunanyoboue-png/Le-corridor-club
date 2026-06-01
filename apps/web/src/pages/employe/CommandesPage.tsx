import { useState } from "react";
import { ClipboardList, Loader2, RefreshCw } from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { useOrders, useUpdateOrderStatus, type Order } from "@/hooks/useEmploye";
import { cn } from "@/lib/utils";

type Filtre = "TOUS" | "PENDING" | "PREPARING" | "READY" | "DELIVERED";

const STATUTS: { key: Filtre; label: string; color: string }[] = [
  { key: "TOUS",      label: "Toutes",          color: "" },
  { key: "PENDING",   label: "En attente",       color: "status-PENDING" },
  { key: "PREPARING", label: "En préparation",   color: "status-PREPARING" },
  { key: "READY",     label: "Prêtes",           color: "status-READY" },
  { key: "DELIVERED", label: "Servies",          color: "status-DELIVERED" },
];

const NEXT_STATUS: Record<string, { label: string; next: string; style: string }> = {
  PENDING:   { label: "Commencer",   next: "PREPARING", style: "btn-cta" },
  PREPARING: { label: "Prêt !",      next: "READY",     style: "btn-secondary" },
  READY:     { label: "Livrer",      next: "DELIVERED", style: "bg-vert text-cream rounded-lg px-3 py-2 text-xs font-semibold hover:bg-vert/90 transition-colors" },
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING:   "status-PENDING",
    PREPARING: "status-PREPARING",
    READY:     "status-READY",
    DELIVERED: "status-DELIVERED",
    CANCELLED: "status-CANCELLED",
  };
  const labels: Record<string, string> = {
    PENDING: "En attente", PREPARING: "En préparation",
    READY: "Prêt !", DELIVERED: "Servi", CANCELLED: "Annulé",
  };
  return <span className={`status-badge ${map[status] ?? ""}`}>{labels[status] ?? status}</span>;
}

function OrderCard({ order, onUpdate }: { order: Order; onUpdate: (id: string, status: string) => void }) {
  const updateStatus = useUpdateOrderStatus();
  const next = NEXT_STATUS[order.status];
  const itemTotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  function handleUpdate() {
    if (!next) return;
    onUpdate(order.id, next.next);
  }

  return (
    <div className={cn(
      "card hover:shadow-md transition-all",
      order.status === "READY" && "border-l-4 border-l-vert bg-vert/5",
      order.status === "PENDING" && "border-l-4 border-l-ocre/60"
    )}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <p className="font-bold text-ink">{order.orderNumber}</p>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-ink/55 mb-2.5">
            {order.note ?? "Sans note"} · {new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <ul className="space-y-1">
            {order.items.map((item) => (
              <li key={item.id} className="text-sm text-ink/75 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sienna/30 shrink-0" />
                {item.product.name} <span className="font-semibold text-ink">×{item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
          <p className="amount font-bold text-ocre text-lg">{formatFCFA(itemTotal)}</p>
          {next && (
            <button
              onClick={handleUpdate}
              disabled={updateStatus.isPending}
              className={cn(next.style, "text-xs py-2 px-4 flex items-center gap-1.5")}
            >
              {updateStatus.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : null}
              {next.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommandesPage() {
  const [filtre, setFiltre] = useState<Filtre>("TOUS");
  const { data: orders = [], isLoading, refetch, isFetching } = useOrders(filtre === "TOUS" ? undefined : filtre);
  const updateStatus = useUpdateOrderStatus();

  async function handleUpdate(id: string, status: string) {
    await updateStatus.mutateAsync({ id, status });
  }

  const pending  = orders.filter((o) => o.status === "PENDING").length;
  const ready    = orders.filter((o) => o.status === "READY").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Commandes</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-sm text-ink/55">{orders.length} commande{orders.length > 1 ? "s" : ""}</p>
            {pending > 0 && <span className="text-xs bg-ocre/15 text-ocre font-semibold px-2 py-0.5 rounded-full">{pending} en attente</span>}
            {ready > 0  && <span className="text-xs bg-vert/15 text-vert font-semibold px-2 py-0.5 rounded-full">{ready} prête{ready > 1 ? "s" : ""}</span>}
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-ghost self-start sm:self-auto gap-2 text-sm"
        >
          <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUTS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltre(key)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
              filtre === key
                ? "bg-ink text-cream border-ink"
                : "bg-cream-hi border-sienna/20 text-ink/70 hover:border-sienna/50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-ocre" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <ClipboardList className="w-10 h-10 text-ink/20" />
          <p className="text-ink/50 font-medium">Aucune commande</p>
          <p className="text-xs text-ink/35">Les nouvelles commandes apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
