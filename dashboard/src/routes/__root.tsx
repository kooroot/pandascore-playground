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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Top navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-6 md:px-10 2xl:px-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
              <span className="font-mono text-xs font-bold text-white">PS</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
              PandaScore<span className="text-primary">.gg</span>
            </span>
          </Link>

          <nav className="flex shrink-0 items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-secondary [&.active]:bg-secondary [&.active]:text-foreground"
                activeProps={{ className: "active" }}
              >
                <Icon size={14} />
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
    </div>
  );
}
