import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const accentStyles: Record<string, { gradient: string; text: string; icon: string }> = {
  live: {
    gradient: "from-red-500/20 via-red-500/5 to-transparent",
    text: "text-red-400",
    icon: "bg-red-500/15 text-red-400 shadow-red-500/20",
  },
  upcoming: {
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    text: "text-amber-400",
    icon: "bg-amber-500/15 text-amber-400 shadow-amber-500/20",
  },
  accent: {
    gradient: "from-violet-500/20 via-violet-500/5 to-transparent",
    text: "text-violet-400",
    icon: "bg-violet-500/15 text-violet-400 shadow-violet-500/20",
  },
  win: {
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    text: "text-emerald-400",
    icon: "bg-emerald-500/15 text-emerald-400 shadow-emerald-500/20",
  },
};

export function StatCard({
  label,
  value,
  icon,
  accent = "accent",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: string;
}) {
  const style = accentStyles[accent] ?? accentStyles.accent;

  return (
    <div className="stat-card group">
      {/* Top gradient */}
      <div className={cn("absolute inset-0 bg-gradient-to-b", style.gradient, "pointer-events-none")} />

      {/* Inner gradient highlight on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative flex items-center justify-between gap-4 p-5">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className={cn("text-3xl font-bold tabular-nums tracking-tight", style.text)}>
            {value}
          </p>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-110", style.icon)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
