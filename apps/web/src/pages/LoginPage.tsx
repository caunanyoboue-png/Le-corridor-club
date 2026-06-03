import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Role } from "@maquis/shared";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface LoginPayload { email: string; password: string }
interface LoginResponse {
  user: { id: string; name: string; email: string; role: Role };
  accessToken: string;
  refreshToken: string;
}

function roleHome(role: string) {
  if (role === Role.ADMIN) return "/admin";
  if (role === Role.EMPLOYEE) return "/employe";
  return "/client";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, accessToken, setAuth, logout } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Si déjà authentifié → valider le token puis rediriger
  useEffect(() => {
    if (user && accessToken) {
      api.get("/auth/me")
        .then(() => navigate(roleHome(user.role), { replace: true }))
        .catch(() => logout()); // token expiré → vider le store
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: (data: LoginPayload) =>
      api.post<LoginResponse>("/auth/login", data).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate(roleHome(data.user.role), { replace: true });
    },
    onError: (err: { response?: { data?: { error?: string } }; message?: string }) => {
      if (!err.response) {
        setError("Impossible de joindre le serveur. Vérifiez que l'API tourne sur :4000.");
      } else {
        setError(err.response.data?.error ?? "Identifiants incorrects");
      }
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate({ email, password });
  }

  return (
    <div className="min-h-screen bg-cream bg-trame-ocre flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <img
            src="/corridor_club.jpg"
            alt="Le Corridor Club"
            className="w-24 sm:w-32 h-24 sm:h-32 mx-auto mb-3 sm:mb-4 object-contain drop-shadow-lg rounded-lg"
          />
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Le Corridor Club</h1>
          <p className="text-ink/55 text-xs sm:text-sm mt-1 sm:mt-1.5">Maquis Manager — Connexion</p>
        </div>

        {/* Formulaire */}
        <div className="card mb-4 sm:mb-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="label" htmlFor="email">Adresse e-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@corridorclub.ci"
                className="input-field"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            {error && (
              <p className="text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 sm:py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-cta w-full mt-2 sm:mt-0"
            >
              {mutation.isPending ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>

        {/* Bouton reset session si bloqué */}
        <button
          type="button"
          onClick={() => { logout(); setError(null); }}
          className="mt-4 sm:mt-6 w-full text-xs text-ink/30 hover:text-ink/60 transition-colors py-2 sm:py-3"
        >
          Problème de connexion ? Réinitialiser la session
        </button>
      </div>
    </div>
  );
}
