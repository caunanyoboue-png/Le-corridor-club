import { useState } from "react";
import { Plus, Search, User, Mail, Phone, Pencil, Power, KeyRound, Loader2, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAdminUsers, useCreateUser, useUpdateUser,
  useToggleUserStatus, useResetPassword, useDeleteUser, type AdminUser,
} from "@/hooks/useAdmin";

const ROLE_LABEL: Record<string, string> = { ADMIN: "Administrateur", EMPLOYEE: "Employé", CLIENT: "Client" };
const ROLE_STYLE: Record<string, string> = {
  ADMIN:    "bg-ocre/10 text-ocre",
  EMPLOYEE: "bg-vert/10 text-vert",
  CLIENT:   "bg-amber/10 text-amber",
};

// ── Modal créer / modifier employé ────────────────────────────────────
function UserModal({ user, onClose }: { user?: AdminUser; onClose: () => void }) {
  const isEdit = !!user;
  const create = useCreateUser();
  const update = useUpdateUser();

  const [form, setForm] = useState({
    name:     user?.name ?? "",
    email:    user?.email ?? "",
    phone:    user?.phone ?? "",
    password: "",
    role:     user?.role ?? "EMPLOYEE",
  });
  const [error, setError] = useState<string | null>(null);

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSubmit() {
    if (!form.name.trim()) { setError("Le nom est requis"); return; }
    if (!isEdit && !form.email && !form.phone) { setError("Email ou téléphone requis"); return; }
    if (!isEdit && form.password.length < 8) { setError("Mot de passe min. 8 caractères"); return; }
    try {
      if (isEdit) {
        await update.mutateAsync({
          id: user!.id,
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          role: form.role,
        });
      } else {
        await create.mutateAsync({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          password: form.password,
          role: form.role,
        });
      }
      onClose();
    } catch (e: unknown) {
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
      } else {
        setError("Erreur lors de la sauvegarde");
      }
    }
  }

  const mut = isEdit ? update : create;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-ink/50">
      <div className="w-full max-w-md bg-cream rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-ink text-cream px-5 py-4 flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">
            {isEdit ? "Modifier le compte" : "Nouvel employé"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-cream/10 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Nom complet *</label>
            <input className="input-field" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Aya Koné" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="aya@corridorclub.ci" />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input type="tel" className="input-field" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07 XX XX XX XX" />
            </div>
          </div>
          <div>
            <label className="label">Rôle *</label>
            <select className="input-field" value={form.role} onChange={(e) => set("role", e.target.value)}>
              <option value="EMPLOYEE">Employé</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>
          {!isEdit && (
            <div>
              <label className="label">Mot de passe *</label>
              <input type="password" className="input-field" value={form.password}
                onChange={(e) => set("password", e.target.value)} placeholder="Min. 8 caractères" />
            </div>
          )}
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
            <button onClick={handleSubmit} disabled={mut.isPending} className="btn-cta flex-1">
              {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Enregistrer" : "Créer le compte"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal réinitialiser mot de passe ──────────────────────────────────
function ResetPwdModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const resetPwd = useResetPassword();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (pwd.length < 8) { setError("Min. 8 caractères"); return; }
    if (pwd !== confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    try {
      await resetPwd.mutateAsync({ id: user.id, password: pwd });
      setDone(true);
    } catch { setError("Erreur lors de la mise à jour"); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50">
      <div className="w-full max-w-sm bg-cream rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-ink text-cream px-5 py-4 flex items-center justify-between">
          <h2 className="font-semibold">Réinitialiser le mot de passe</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-cream/10 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {done ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-vert/10 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6 text-vert" />
              </div>
              <p className="font-medium text-ink">Mot de passe mis à jour !</p>
              <p className="text-sm text-ink/55">Le compte de <strong>{user.name}</strong> a été mis à jour.</p>
              <button onClick={onClose} className="btn-cta w-full">Fermer</button>
            </div>
          ) : (
            <>
              <p className="text-sm text-ink/60">Nouveau mot de passe pour <strong>{user.name}</strong></p>
              <div>
                <label className="label">Nouveau mot de passe</label>
                <input type="password" className="input-field" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Min. 8 caractères" />
              </div>
              <div>
                <label className="label">Confirmer</label>
                <input type="password" className="input-field" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Répéter le mot de passe" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
                <button onClick={handleSubmit} disabled={resetPwd.isPending} className="btn-cta flex-1">
                  {resetPwd.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal confirmation suppression ────────────────────────────────────
function DeleteUserConfirm({ user, onConfirm, onClose, loading }: {
  user: AdminUser; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50">
      <div className="w-full max-w-sm bg-cream rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <Trash2 className="w-7 h-7 text-red-600" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-ink text-lg">Supprimer cet employé ?</h3>
          <p className="text-sm text-ink/60 mt-2">
            <strong className="text-ink">{user.name}</strong> sera supprimé définitivement.
            Cette action est irréversible.
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
export default function EmployesPage() {
  const { data: users = [], isLoading } = useAdminUsers();
  const toggleStatus = useToggleUserStatus();
  const deleteUser = useDeleteUser();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  function openNew() { setEditingUser(null); setShowModal(true); }
  function openEdit(u: AdminUser) { setEditingUser(u); setShowModal(true); }
  function closeModal() { setShowModal(false); setEditingUser(null); }

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const actifs   = users.filter((u) => u.active).length;
  const employes = users.filter((u) => u.role === "EMPLOYEE").length;

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Employés</h1>
          <p className="text-ink/55 text-xs sm:text-sm mt-1 sm:mt-0.5">{actifs} actifs · {employes} employés · {users.length} comptes au total</p>
        </div>
        <button onClick={openNew} className="btn-cta w-full sm:w-auto justify-center sm:justify-start">
          <Plus className="w-4 h-4" /> <span>Ajouter un employé</span>
        </button>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
        <input type="text" placeholder="Rechercher par nom ou email…"
          value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-ocre" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="card flex flex-col items-center gap-3 py-16 text-center">
              <User className="w-10 h-10 text-ink/20" />
              <p className="text-ink/50">Aucun résultat</p>
            </div>
          )}
          {filtered.map((u) => (
            <div key={u.id} className={cn("card flex flex-col sm:flex-row sm:items-center gap-4", !u.active && "opacity-60")}>
              {/* Avatar */}
              <div className={cn("w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                u.active ? "bg-ink text-cream" : "bg-ink/20 text-ink/50"
              )}>
                {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink">{u.name}</p>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", ROLE_STYLE[u.role])}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold",
                    u.active ? "bg-vert/10 text-vert" : "bg-gray-100 text-gray-500"
                  )}>
                    {u.active ? "Actif" : "Inactif"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-ink/55">
                  {u.email && <span className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 shrink-0" />{u.email}</span>}
                  {u.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" />{u.phone}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 shrink-0">
                <button onClick={() => openEdit(u)} className="btn-ghost text-xs sm:py-2.5 py-2 px-2 sm:px-3 gap-1 sm:gap-1.5 flex-1 sm:flex-none">
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Modifier</span>
                </button>
                <button onClick={() => setResetUser(u)} className="btn-ghost text-xs sm:py-2.5 py-2 px-2 sm:px-3 gap-1 sm:gap-1.5 flex-1 sm:flex-none">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mot de passe</span>
                </button>
                <button
                  onClick={() => toggleStatus.mutate({ id: u.id, active: !u.active })}
                  disabled={toggleStatus.isPending}
                  className={cn(
                    "text-xs sm:py-2.5 py-2 px-2 sm:px-3 rounded-lg border font-medium gap-1 sm:gap-1.5 flex items-center justify-center sm:justify-start transition-colors flex-1 sm:flex-none",
                    u.active
                      ? "border-red-200 text-red-500 hover:bg-red-50"
                      : "border-vert/30 text-vert hover:bg-vert/5"
                  )}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{u.active ? "Désactiver" : "Activer"}</span>
                </button>
                <button
                  onClick={() => setDeletingUser(u)}
                  title="Supprimer cet employé"
                  className="p-2 sm:p-2.5 rounded-lg border border-red-200 hover:bg-red-50 hover:border-red-400 text-red-400 hover:text-red-600 transition-all shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <UserModal user={editingUser ?? undefined} onClose={closeModal} />
      )}
      {resetUser && <ResetPwdModal user={resetUser} onClose={() => setResetUser(null)} />}
      {deletingUser && (
        <DeleteUserConfirm
          user={deletingUser}
          onConfirm={async () => {
            try {
              await deleteUser.mutateAsync(deletingUser.id);
              setDeletingUser(null);
            } catch {
              // Erreur gérée par la mutation
            }
          }}
          onClose={() => setDeletingUser(null)}
          loading={deleteUser.isPending}
        />
      )}
    </div>
  );
}
