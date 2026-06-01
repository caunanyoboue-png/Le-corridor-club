import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { formatFCFA } from "@/lib/utils";

const categories = [
  { key: "tous",      label: "Tout le menu",  emoji: "🍽️" },
  { key: "bieres",   label: "Bières",         emoji: "🍺" },
  { key: "vins",     label: "Vins & Spirits", emoji: "🍷" },
  { key: "softs",    label: "Softs",          emoji: "🥤" },
  { key: "grillades",label: "Porc braisé",    emoji: "🐷" },
  { key: "plats",    label: "Plats",          emoji: "🍽️" },
];

const menu = [
  { id: "1",  nom: "Castel Bière",         cat: "bieres",    prix: 500,  unite: "bouteille", emoji: "🍺", dispo: true },
  { id: "2",  nom: "Flag Spéciale",        cat: "bieres",    prix: 500,  unite: "bouteille", emoji: "🍺", dispo: true },
  { id: "3",  nom: "Beaufort",             cat: "bieres",    prix: 500,  unite: "bouteille", emoji: "🍺", dispo: true },
  { id: "4",  nom: "Bock 65cl",            cat: "bieres",    prix: 800,  unite: "bouteille", emoji: "🍺", dispo: true },
  { id: "5",  nom: "Castel Canette",       cat: "bieres",    prix: 600,  unite: "canette",   emoji: "🥫", dispo: true },
  { id: "6",  nom: "Vin Rouge (verre)",    cat: "vins",      prix: 700,  unite: "verre",     emoji: "🍷", dispo: true },
  { id: "7",  nom: "Vin Blanc (verre)",    cat: "vins",      prix: 700,  unite: "verre",     emoji: "🥂", dispo: true },
  { id: "8",  nom: "Whisky (verre)",       cat: "vins",      prix: 1500, unite: "verre",     emoji: "🥃", dispo: true },
  { id: "9",  nom: "Coca-Cola",            cat: "softs",     prix: 400,  unite: "bouteille", emoji: "🥤", dispo: true },
  { id: "10", nom: "Fanta Orange",         cat: "softs",     prix: 400,  unite: "bouteille", emoji: "🥤", dispo: true },
  { id: "11", nom: "Eau minérale 50cl",    cat: "softs",     prix: 300,  unite: "bouteille", emoji: "💧", dispo: true },
  { id: "12", nom: "Porc braisé portion",  cat: "grillades", prix: 1500, unite: "portion",   emoji: "🐷", dispo: true },
  { id: "13", nom: "Porc braisé 1 kg",    cat: "grillades", prix: 5000, unite: "kg",        emoji: "🐷", dispo: true },
  { id: "14", nom: "Attiéké",             cat: "plats",     prix: 500,  unite: "portion",   emoji: "🍽️", dispo: true },
  { id: "15", nom: "Alloco",              cat: "plats",     prix: 500,  unite: "portion",   emoji: "🍽️", dispo: true },
];

export default function MenuPage() {
  const [cat, setCat] = useState("tous");
  const [panier, setPanier] = useState<Record<string, number>>({});

  const filtered = cat === "tous" ? menu : menu.filter((p) => p.cat === cat);
  const totalPanier = Object.entries(panier).reduce((acc, [id, qty]) => {
    const prod = menu.find((p) => p.id === id);
    return acc + (prod ? prod.prix * qty : 0);
  }, 0);
  const nbArticles = Object.values(panier).reduce((a, b) => a + b, 0);

  function addToCart(id: string) {
    setPanier((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }
  function removeFromCart(id: string) {
    setPanier((prev) => {
      const next = { ...prev };
      if ((next[id] ?? 0) <= 1) delete next[id];
      else next[id]--;
      return next;
    });
  }

  return (
    <div className="space-y-5 pb-28">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Notre carte</h1>
        <p className="text-ink/55 text-sm">Le Corridor Club · {menu.length} articles</p>
      </div>

      {/* Filtres catégorie */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
              cat === c.key
                ? "bg-ink text-cream border-ink shadow-sm"
                : "bg-cream-hi border-sienna/20 text-ink/70 hover:border-sienna/40"
            }`}
          >
            <span>{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Grille menu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((produit) => {
          const qtyInCart = panier[produit.id] ?? 0;
          return (
            <div key={produit.id} className="card flex flex-col gap-3 hover:shadow-md transition-shadow">
              {/* Emoji + info */}
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center text-3xl shrink-0 border border-sienna/10">
                  {produit.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink text-sm leading-tight">{produit.nom}</p>
                  <p className="text-xs text-ink/45 mt-0.5 capitalize">{produit.unite}</p>
                  <p className="amount font-bold text-ocre text-base mt-1">{formatFCFA(produit.prix)}</p>
                </div>
              </div>

              {/* Contrôle quantité */}
              {qtyInCart === 0 ? (
                <button
                  onClick={() => addToCart(produit.id)}
                  className="btn-cta w-full text-sm py-2.5"
                >
                  Ajouter
                </button>
              ) : (
                <div className="flex items-center justify-between border border-ocre/40 rounded-xl overflow-hidden">
                  <button
                    onClick={() => removeFromCart(produit.id)}
                    className="flex-1 py-2.5 text-ocre font-bold text-xl hover:bg-ocre/10 transition-colors"
                  >
                    −
                  </button>
                  <span className="amount font-bold text-ink text-base px-4">{qtyInCart}</span>
                  <button
                    onClick={() => addToCart(produit.id)}
                    className="flex-1 py-2.5 text-ocre font-bold text-xl hover:bg-ocre/10 transition-colors"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Barre panier flottante */}
      {nbArticles > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 z-30">
          <button
            disabled
            title="Commande disponible sprint 2"
            className="btn-cta w-full shadow-xl rounded-2xl py-4 gap-3 cursor-not-allowed opacity-90"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-cream text-ocre text-xs font-bold rounded-full flex items-center justify-center">
                {nbArticles}
              </span>
            </div>
            <span className="flex-1 text-left text-base font-semibold">
              {nbArticles} article{nbArticles > 1 ? "s" : ""}
            </span>
            <span className="amount font-bold">{formatFCFA(totalPanier)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
