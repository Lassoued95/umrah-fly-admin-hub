import { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, Landmark, Sparkles, Bell, LogOut, Menu, X, CalendarRange,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/users", label: "Utilisateurs", icon: Users },
  { to: "/plannings", label: "Plannings", icon: CalendarRange },
  { to: "/duas", label: "Douaas", icon: BookOpen },
  { to: "/rituals", label: "Rituels", icon: Landmark },
  { to: "/dhikr", label: "Dhikr", icon: Sparkles },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-muted/40">
      {open && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="px-6 py-6 border-b border-sidebar-border flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold">
            U
          </div>
          <div>
            <div className="font-bold text-sidebar-foreground tracking-tight">Umrah Fly</div>
            <div className="text-xs text-sidebar-foreground/60">Panneau d'administration</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <l.icon size={18} />
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-sidebar-foreground/60">Connecté en tant que</div>
            <div className="text-sm font-medium truncate">
              {user?.prenom || ""} {user?.nom || user?.email || "Admin"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive-foreground transition-colors"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-20 bg-background border-b h-14 flex items-center px-4 justify-between">
          <button onClick={() => setOpen((o) => !o)} className="p-2 -ml-2">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="font-semibold">Umrah Fly</div>
          <div className="w-8" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
