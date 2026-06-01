import { ReactNode, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  to: string;
  icon?: ReactNode;
}

interface AppShellProps {
  title: string;
  nav: NavItem[];
  children: ReactNode;
}

export default function AppShell({ title, nav, children }: AppShellProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // fermer le drawer sur resize vers desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setDrawerOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // empêcher le scroll du body quand drawer ouvert
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
      isActive
        ? "bg-ocre text-cream"
        : "text-cream/75 hover:text-cream hover:bg-cream/10"
    );

  const drawerLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-colors",
      isActive
        ? "bg-ocre text-cream"
        : "text-ink hover:bg-sienna/10"
    );

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-ink text-cream shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Logo + titre */}
          <img
            src="/corridor_club.jpg"
            alt="Le Corridor Club"
            className="w-10 h-10 object-contain shrink-0 rounded-lg"
          />
          <span className="font-display font-semibold text-base md:text-lg flex-1 truncate">
            {title}
          </span>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to.split("/").length <= 2} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User + logout desktop */}
          <div className="hidden md:flex items-center gap-3 ml-2">
            <span className="text-xs text-cream/60 truncate max-w-[120px]">{user?.name}</span>
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className="p-2 rounded-md hover:bg-cream/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Hamburger mobile */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-2 rounded-md hover:bg-cream/10 transition-colors ml-auto"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Drawer mobile ──────────────────────────────────────── */}
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-ink/50 z-50 md:hidden transition-opacity duration-300",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Panel */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-72 bg-cream z-50 md:hidden shadow-2xl",
          "flex flex-col transition-transform duration-300 ease-in-out",
          drawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header drawer */}
        <div className="flex items-center justify-between px-5 py-4 bg-ink text-cream">
          <div>
            <p className="font-display font-semibold text-base">{user?.name}</p>
            <p className="text-xs text-cream/50 mt-0.5">{user?.email ?? user?.phone}</p>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-md hover:bg-cream/10"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split("/").length <= 2}
              className={drawerLinkClass}
              onClick={() => setDrawerOpen(false)}
            >
              {item.icon && <span className="w-5 h-5 shrink-0">{item.icon}</span>}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-sienna/20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Contenu ────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-5 md:py-7">
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-sienna/20 py-4 text-center text-xs text-ink/35">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/corridor_club.jpg" alt="Le Corridor Club" className="w-6 h-6 object-contain rounded" />
          <span>Le Corridor Club © {new Date().getFullYear()}</span>
        </div>
        <p className="text-ink/25 text-xs">Powered by Maquis Manager</p>
      </footer>
    </div>
  );
}
