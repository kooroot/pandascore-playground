import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { Zap, Trophy, Swords, Users } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: Zap },
  { to: "/tournaments", label: "Tournaments", icon: Trophy },
  { to: "/matches", label: "Matches", icon: Swords },
  { to: "/teams", label: "Teams", icon: Users },
] as const;

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Ambient gradient orb */}
      <div className="gradient-orb" style={{ top: "-200px", left: "50%", transform: "translateX(-50%)" }} />

      {/* Top navigation */}
      <header className="glass sticky top-0 z-50">
        <div className="flex h-14 items-center justify-between px-6 md:px-10 2xl:px-16">
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25 transition-all group-hover:shadow-primary/40 group-hover:scale-105">
              <span className="font-mono text-xs font-bold text-white">PS</span>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                PandaScore<span className="gradient-text-purple">.gg</span>
              </span>
              <span className="text-[10px] text-muted-foreground -mt-0.5">LoL Esports Tracker</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="header-nav-item"
                activeProps={{ className: "active" }}
              >
                <Icon size={15} strokeWidth={2} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="page-main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by <a href="https://pandascore.co" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PandaScore API</a>
        </p>
      </footer>
    </div>
  );
}
