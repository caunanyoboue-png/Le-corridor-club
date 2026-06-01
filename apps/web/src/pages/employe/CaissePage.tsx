import { useState, useMemo } from "react";
import { ShoppingCart, X, Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { useProducts, useCreateSale, type Product } from "@/hooks/useEmploye";
import { cn } from "@/lib/utils";

// ── Types panier ──────────────────────────────────────────────────────
interface CartItem { product: Product; quantity: number }

// ── Composant principal ───────────────────────────────────────────────
export default function CaissePage() {
  const { data: products = [], isLoading } = useProducts();
  const createSale = useCreateSale();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCat, setActiveCat] = useState("Tous");
  const [showCart, setShowCart] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Catégories dynamiques depuis l'API
  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category.name))].sort();
    return ["Tous", ...cats];
  }, [products]);

  const filtered = activeCat === "Tous" ? products : products.filter((p) => p.category.name === activeCat);

  // ── Panier helpers ─────────────────────────────────────────────────
  const total = cart.reduce((s, i) => s + i.product.salePrice * i.quantity, 0);
  const nbArticles = cart.reduce((s, i) => s + i.quantity, 0);

  function addItem(p: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === p.id);
      if (existing) return prev.map((i) => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product: p, quantity: 1 }];
    });
  }
  function changeQty(id: string, delta: number) {
    setCart((prev) => prev
      .map((i) => i.product.id === id ? { ...i, quantity: i.quantity + delta } : i)
      .filter((i) => i.quantity > 0)
    );
  }
  function clearCart() { setCart([]); }

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Vente directe ──────────────────────────────────────────────────
  async function handleDirectSale() {
    if (!cart.length) return;
    try {
      await createSale.mutateAsync({ items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })) });
      clearCart();
      setShowCart(false);
      showToast(`Vente enregistrée — ${formatFCFA(total)}`, "ok");
    } catch {
      showToast("Erreur lors de l'enregistrement", "err");
    }
  }


  // ── Rendu ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">
      {/* ══ GAUCHE : catalogue ══ */}
      <div className="flex-1 min-w-0 space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Caisse</h1>
            <p className="text-xs sm:text-sm text-ink/50 mt-0.5">{products.length} produits disponibles</p>
          </div>
          {/* Bouton panier mobile */}
          <button
            onClick={() => setShowCart(true)}
            className="lg:hidden relative btn-cta py-2.5 sm:py-2 px-4 sm:px-5 shrink-0"
          >
            <ShoppingCart className="w-5 h-5" />
            {nbArticles > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber text-ink text-xs font-bold rounded-full flex items-center justify-center">
                {nbArticles}
              </span>
            )}
          </button>
        </div>

        {/* Filtres catégories */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all",
                activeCat === cat
                  ? "bg-ink text-cream border-ink shadow-sm"
                  : "bg-cream-hi border-sienna/20 text-ink/70 hover:border-sienna/40"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grille produits */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-ocre" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {filtered.map((p) => {
              const inCart = cart.find((i) => i.product.id === p.id);
              const stock = p.stockItem ? Number(p.stockItem.quantity) : 0;
              const outOfStock = stock <= 0;
              return (
                <button
                  key={p.id}
                  onClick={() => !outOfStock && addItem(p)}
                  disabled={outOfStock}
                  className={cn(
                    "card text-left flex flex-col gap-2 transition-all active:scale-95",
                    outOfStock ? "opacity-50 cursor-not-allowed" : "hover:shadow-md hover:border-ocre/30 cursor-pointer",
                    inCart && "ring-2 ring-ocre ring-offset-1"
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-semibold text-ink text-sm leading-tight line-clamp-2">{p.name}</p>
                    {inCart && (
                      <span className="shrink-0 w-5 h-5 bg-ocre text-cream text-xs font-bold rounded-full flex items-center justify-center">
                        {inCart.quantity}
                      </span>
                    )}
                  </div>
                  <p className="amount font-bold text-ocre">{formatFCFA(p.salePrice)}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink/40 capitalize">{p.unit}</span>
                    <span className={cn("font-medium", stock <= p.stockAlertThreshold ? "text-amber" : "text-vert")}>
                      {outOfStock ? "Épuisé" : `${stock} en stock`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ DROITE : panier desktop (ou drawer mobile) ══ */}
      {/* Overlay mobile */}
      {showCart && (
        <div className="fixed inset-0 bg-ink/40 z-40 lg:hidden" onClick={() => setShowCart(false)} />
      )}

      <aside className={cn(
        "w-full lg:w-80 xl:w-96 flex flex-col bg-cream-hi border border-sienna/20 rounded-t-3xl lg:rounded-2xl",
        "fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] transition-transform duration-300 lg:static lg:max-h-none lg:rounded-2xl lg:translate-y-0",
        showCart ? "translate-y-0" : "translate-y-full lg:translate-y-0"
      )}>
        {/* Header panier */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-sienna/15">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-ocre" />
            <span className="font-semibold text-ink">
              Panier {nbArticles > 0 && <span className="text-ocre">({nbArticles})</span>}
            </span>
          </div>
          <div className="flex gap-2">
            {cart.length > 0 && (
              <button onClick={clearCart} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Vider">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setShowCart(false)} className="p-1.5 rounded-lg hover:bg-cream lg:hidden">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-ink/40">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Panier vide</p>
              <p className="text-xs mt-1">Sélectionne des produits</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 bg-cream rounded-xl px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{item.product.name}</p>
                  <p className="amount text-xs text-ocre">{formatFCFA(item.product.salePrice * item.quantity)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => changeQty(item.product.id, -1)} className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-cream-hi hover:bg-sienna/10 flex items-center justify-center transition-colors">
                    <Minus className="w-3.5 sm:w-3 h-3.5 sm:h-3" />
                  </button>
                  <span className="amount w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => changeQty(item.product.id, +1)} className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-cream-hi hover:bg-sienna/10 flex items-center justify-center transition-colors">
                    <Plus className="w-3.5 sm:w-3 h-3.5 sm:h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer total + actions */}
        {cart.length > 0 && (
          <div className="border-t border-sienna/15 px-4 py-4 sm:py-5 space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center gap-2">
              <span className="font-semibold text-ink">Total</span>
              <span className="amount text-xl sm:text-2xl font-bold text-ocre">{formatFCFA(total)}</span>
            </div>
            {/* Encaisser */}
            <button
              onClick={handleDirectSale}
              disabled={createSale.isPending}
              className="btn-cta w-full gap-2 py-3 sm:py-2.5 text-sm sm:text-base font-medium"
            >
              {createSale.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Encaisser
            </button>
          </div>
        )}
      </aside>

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all",
          toast.type === "ok" ? "bg-vert text-cream" : "bg-red-600 text-cream"
        )}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
