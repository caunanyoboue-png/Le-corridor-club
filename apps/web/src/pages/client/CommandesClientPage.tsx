import { ClipboardList } from "lucide-react";
import { formatFCFA } from "@/lib/utils";

const mesCommandes = [
  {
    id: "ORD-2026-0002",
    statut: "READY",
    date: "Aujourd'hui · 14h28",
    items: ["Flag Spéciale ×1"],
    total: 500,
  },
  {
    id: "ORD-2026-0001",
    statut: "DELIVERED",
    date: "Aujourd'hui · 14h32",
    items: ["Castel Bière ×2", "Porc braisé portion ×1"],
    total: 2500,
  },
];

const statutStyle: Record<string, string> = {
  PENDING:   "status-PENDING",
  PREPARING: "status-PREPARING",
  READY:     "status-READY",
  DELIVERED: "status-DELIVERED",
  CANCELLED: "status-CANCELLED",
};
const statutLabel: Record<string, string> = {
  PENDING:   "En attente",
  PREPARING: "En préparation",
  READY:     "Prêt à récupérer !",
  DELIVERED: "Servi",
  CANCELLED: "Annulé",
};

export default function CommandesClientPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Mes commandes</h1>
        <p className="text-ink/55 text-sm">{mesCommandes.length} commande{mesCommandes.length > 1 ? "s" : ""}</p>
      </div>

      {mesCommandes.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 py-20 text-center">
          <ClipboardList className="w-12 h-12 text-ink/20" />
          <div>
            <p className="font-medium text-ink">Aucune commande</p>
            <p className="text-sm text-ink/50 mt-1">Vos commandes apparaîtront ici</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {mesCommandes.map((cmd) => (
            <div
              key={cmd.id}
              className={`card border-l-4 ${
                cmd.statut === "READY" ? "border-l-vert bg-vert/5" : "border-l-sienna/20"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="font-semibold text-ink text-sm">{cmd.id}</p>
                    <span className={`status-badge ${statutStyle[cmd.statut]}`}>
                      {statutLabel[cmd.statut]}
                    </span>
                  </div>
                  <p className="text-xs text-ink/45 mb-3">{cmd.date}</p>
                  <ul className="space-y-1">
                    {cmd.items.map((item) => (
                      <li key={item} className="text-sm text-ink/75 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-ink/30 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="amount font-bold text-ocre text-lg shrink-0">{formatFCFA(cmd.total)}</p>
              </div>

              {cmd.statut === "READY" && (
                <div className="mt-3 pt-3 border-t border-vert/20 flex items-center gap-2 text-vert text-sm font-semibold">
                  <span className="w-2 h-2 rounded-full bg-vert animate-pulse" />
                  Votre commande est prête ! Rendez-vous à la caisse.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
