import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Loader2, X, Package } from "lucide-react";
import { formatFCFA, cn } from "@/lib/utils";
import {
  useAdminProducts, useCategories, useCreateProduct, useUpdateProduct,
  useDeleteProduct, type Product,
} from "@/hooks/useAdmin";

const UNITS = ["bouteille", "verre", "portion", "kg", "canette", "assiette", "litre"];

// ── Modal créer / modifier produit ────────────────────────────────────
function ProduitModal({ produit, onClose }: { produit?: Product; onClose: () => void }) {
  const isEdit = !!produit;

  // Fetch catégories DANS le modal (pas de dépendance externe)
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const create = useCreateProduct();
  const update = useUpdateProduct();

  // Prisma sérialise Decimal en string JSON → on force Number()
  const [form, setForm] = useState({
    name:                produit?.name ?? "",
    categoryId:          produit?.categoryId ?? "",
    salePrice:           Number(produit?.salePrice ?? 0),
    buyPrice:            Number(produit?.buyPrice ?? 0),
    unit:                produit?.unit ?? "bouteille",
    stockAlertThreshold: Number(produit?.stockAlertThreshold ?? 10),
    visible:             produit?.visible ?? true,
    description:         produit?.description ?? "",
    initialStock:        0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Dès que les catégories chargent, on sélectionne la bonne
  useEffect(() => {
    if (categories.length === 0) return;
    setForm((prev) => ({
      ...prev,
      // En édition : garder l'ID existant s'il est valide, sinon premier
      categoryId: prev.categoryId || categories[0].id,
    }));
  }, [categories]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    setError(null);
  }

  async function handleSubmit() {
    // Validation
    if (!form.name.trim())       { setError("Le nom est obligatoire"); return; }
    if (!form.categoryId)        { setError("Choisissez une catégorie"); return; }
    if (form.salePrice <= 0)     { setError("Le prix de vente doit être > 0"); return; }
    if (form.buyPrice <= 0)      { setError("Le prix d'achat doit être > 0"); return; }
    if (form.buyPrice >= form.salePrice) { setError("Le prix d'achat doit être inférieur au prix de vente"); return; }

    setSubmitting(true);
    setError(null);
    try {
      if (isEdit) {
        await update.mutateAsync({ id: produit!.id, ...form });
      } else {
        await create.mutateAsync(form);
      }
      setSuccess(true);
      setTimeout(onClose, 600);
    } catch (e: unknown) {
      console.error("[ProduitModal] Erreur sauvegarde:", e);
      const raw = (e as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      if (typeof raw === "string") {
        setError(raw);
      } else if (raw && typeof raw === "object") {
        const z = raw as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
        const msgs = [
          ...(z.formErrors ?? []),
          ...Object.entries(z.fieldErrors ?? {}).map(([k, v]) => `${k}: ${v.join(", ")}`),
        ];
        setError(msgs.length > 0 ? msgs.join(" · ") : "Données invalides");
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Erreur lors de la sauvegarde. Ouvre la console (F12) pour voir le détail.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const marge = form.salePrice > 0 && form.buyPrice > 0
    ? Math.round(((form.salePrice - form.buyPrice) / form.salePrice) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-ink/50">
      <div className="w-full max-w-lg bg-cream rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-ink text-cream px-5 py-4 flex items-center justify-between shrink-0">
          <h2 className="font-display font-semibold text-lg">
            {isEdit ? `Modifier — ${produit!.name}` : "Nouveau produit"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-cream/10 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {/* Corps */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Nom */}
          <div>
            <label className="label">Nom du produit *</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="ex : Castel Bière"
              autoFocus
            />
          </div>

          {/* Catégorie + unité */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Catégorie *</label>
              {catsLoading ? (
                <div className="input-field flex items-center gap-2 text-ink/40">
                  <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
                </div>
              ) : (
                <select
                  className="input-field"
                  value={form.categoryId}
                  onChange={(e) => set("categoryId", e.target.value)}
                >
                  <option value="" disabled>Choisir une catégorie</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="label">Unité *</label>
              <select
                className="input-field"
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prix de vente (FCFA) *</label>
              <input
                type="number" min="1" step="50"
                className="input-field"
                value={form.salePrice || ""}
                onChange={(e) => set("salePrice", Number(e.target.value))}
                placeholder="500"
              />
            </div>
            <div>
              <label className="label">Prix d'achat (FCFA) *</label>
              <input
                type="number" min="1" step="50"
                className="input-field"
                value={form.buyPrice || ""}
                onChange={(e) => set("buyPrice", Number(e.target.value))}
                placeholder="300"
              />
            </div>
          </div>

          {/* Marge preview temps réel */}
          {marge !== null && (
            <div className={cn(
              "flex items-center justify-between px-4 py-2.5 rounded-xl text-sm border",
              marge >= 40 ? "bg-vert/8 border-vert/20 text-vert" :
              marge >= 20 ? "bg-amber/8 border-amber/20 text-amber" :
                            "bg-red-50 border-red-200 text-red-600"
            )}>
              <span className="font-medium">Marge bénéficiaire</span>
              <span className="amount font-bold">
                {marge}% · {formatFCFA(form.salePrice - form.buyPrice)}
              </span>
            </div>
          )}

          {/* Seuil alerte + stock initial */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Seuil alerte stock</label>
              <input
                type="number" min="0"
                className="input-field"
                value={form.stockAlertThreshold}
                onChange={(e) => set("stockAlertThreshold", Number(e.target.value))}
              />
            </div>
            {!isEdit && (
              <div>
                <label className="label">Stock initial</label>
                <input
                  type="number" min="0"
                  className="input-field"
                  value={form.initialStock || ""}
                  onChange={(e) => set("initialStock", Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="label">Description (facultatif)</label>
            <input
              className="input-field"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Courte description du produit…"
            />
          </div>

          {/* Toggle visible */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl border border-sienna/15 cursor-pointer hover:bg-cream-hi transition-colors"
            onClick={() => set("visible", !form.visible)}
          >
            <div className={cn(
              "w-10 h-6 rounded-full transition-colors relative shrink-0",
              form.visible ? "bg-vert" : "bg-ink/20"
            )}>
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-cream shadow transition-all",
                form.visible ? "left-5" : "left-1"
              )} />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">
                {form.visible ? "Visible sur la carte client" : "Masqué de la carte"}
              </p>
              <p className="text-xs text-ink/45">
                {form.visible
                  ? "Les clients peuvent commander ce produit"
                  : "Le produit n'apparaît pas dans le menu client"}
              </p>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-500 mt-0.5">⚠</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Succès */}
          {success && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-vert/10 border border-vert/20 rounded-lg">
              <span className="text-vert">✓</span>
              <p className="text-sm text-vert font-medium">Enregistré avec succès !</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-sienna/15 flex gap-3 shrink-0 bg-cream">
          <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || catsLoading || success}
            className="btn-cta flex-1 gap-2"
          >
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</>
              : isEdit ? "Enregistrer les modifications" : "Créer le produit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dialog confirmation suppression ───────────────────────────────────
function DeleteConfirm({ produit, onConfirm, onClose, loading }: {
  produit: Product; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50">
      <div className="w-full max-w-sm bg-cream rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <Trash2 className="w-7 h-7 text-red-600" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-ink text-lg">Supprimer ce produit ?</h3>
          <p className="text-sm text-ink/60 mt-2">
            <strong className="text-ink">{produit.name}</strong> sera archivé et retiré de la carte.
            Cette action peut être annulée en contactant l'administrateur.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-cream rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Supprimer définitivement
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────
export default function ProduitsPage() {
  const { data: products = [], isLoading } = useAdminProducts();
  const { data: categories = [] } = useCategories();
  const deleteProd = useDeleteProduct();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Tous");
  const [showModal, setShowModal] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [deletingProd, setDeletingProd] = useState<Product | null>(null);

  function openNew()      { setEditingProd(null); setShowModal(true); }
  function openEdit(p: Product) { setEditingProd(p); setShowModal(true); }
  function closeModal()   { setShowModal(false); setEditingProd(null); }

  const catNames = ["Tous", ...categories.map((c) => c.name)];
  const filtered = products.filter((p) => {
    const matchCat    = catFilter === "Tous" || p.category.name === catFilter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  async function handleDelete() {
    if (!deletingProd) return;
    try {
      await deleteProd.mutateAsync(deletingProd.id);
      setDeletingProd(null);
    } catch {
      // L'erreur s'affiche dans la console — rare
    }
  }

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Produits</h1>
          <p className="text-ink/55 text-xs sm:text-sm mt-1 sm:mt-0.5">
            {products.filter((p) => p.visible).length} actifs · {products.filter((p) => !p.visible).length} masqués · {products.length} au total
          </p>
        </div>
        <button onClick={openNew} className="btn-cta w-full sm:w-auto justify-center sm:justify-start">
          <Plus className="w-4 h-4" /> <span>Ajouter un produit</span>
        </button>
      </div>

      {/* Recherche + filtres */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          <input
            type="text" placeholder="Rechercher un produit…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {catNames.map((cat) => (
            <button
              key={cat} onClick={() => setCatFilter(cat)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                catFilter === cat
                  ? "bg-ink text-cream border-ink"
                  : "bg-cream-hi border-sienna/20 text-ink/70 hover:border-sienna/50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Légende boutons */}
      <div className="flex items-center gap-4 text-xs text-ink/45 border-t border-sienna/10 pt-3">
        <span className="flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Modifier les infos</span>
        <span className="flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5 text-red-400" /> Archiver le produit</span>
      </div>

      {/* Grille */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-ocre" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <Package className="w-10 h-10 text-ink/20" />
          <p className="text-ink/50">Aucun produit trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p) => {
            const stock  = p.stockItem ? Number(p.stockItem.quantity) : 0;
            const stockBas = stock <= p.stockAlertThreshold;
            const marge  = Math.round(((p.salePrice - p.buyPrice) / p.salePrice) * 100);

            return (
              <div key={p.id} className={cn(
                "card flex flex-col gap-3 transition-all",
                !p.visible && "opacity-55 border-dashed"
              )}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink text-sm leading-tight truncate">{p.name}</p>
                    <p className="text-xs text-ink/45 mt-0.5">{p.category.name}</p>
                  </div>
                  <span className={cn(
                    "shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full",
                    p.visible ? "bg-vert/10 text-vert" : "bg-gray-100 text-gray-500"
                  )}>
                    {p.visible ? "Actif" : "Masqué"}
                  </span>
                </div>

                {/* Prix + marge */}
                <div className="flex items-center justify-between border-t border-sienna/10 pt-3">
                  <div>
                    <p className="amount text-lg font-bold text-ink">{formatFCFA(p.salePrice)}</p>
                    <p className="text-xs text-ink/40">/{p.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink/45">Marge</p>
                    <p className={cn("text-sm font-bold",
                      marge >= 40 ? "text-vert" : marge >= 20 ? "text-amber" : "text-red-500"
                    )}>
                      {marge}%
                    </p>
                  </div>
                </div>

                {/* Stock */}
                <div className={cn(
                  "flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium",
                  stock <= 0 ? "bg-red-50 text-red-600" :
                  stockBas   ? "bg-amber/10 text-amber" :
                               "bg-cream text-ink/55"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full",
                    stock <= 0 ? "bg-red-500" : stockBas ? "bg-amber" : "bg-vert"
                  )} />
                  {stock <= 0 ? "Épuisé" : stockBas ? `Stock bas : ${stock} ${p.unit}` : `${stock} ${p.unit}`}
                </div>

                {/* ── Actions ── */}
                <div className="flex gap-1.5 sm:gap-2 mt-auto">
                  {/* Modifier */}
                  <button
                    onClick={() => openEdit(p)}
                    className="btn-ghost flex-1 text-xs py-2 sm:py-2.5 gap-1"
                  >
                    <Pencil className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                    <span className="hidden sm:inline">Modifier</span>
                  </button>

                  {/* Supprimer */}
                  <button
                    onClick={() => setDeletingProd(p)}
                    title="Archiver ce produit"
                    className="p-2 sm:p-2.5 rounded-lg border border-red-200 hover:bg-red-50 hover:border-red-400 text-red-400 hover:text-red-600 transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <ProduitModal
          produit={editingProd ?? undefined}
          onClose={closeModal}
        />
      )}
      {deletingProd && (
        <DeleteConfirm
          produit={deletingProd}
          onConfirm={handleDelete}
          onClose={() => setDeletingProd(null)}
          loading={deleteProd.isPending}
        />
      )}
    </div>
  );
}
