import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const accentStyles: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  live: { border: "border-live/25", bg: "bg-live/10", text: "text-live", glow: "shadow-live/5" },
  upcoming: { border: "border-upcoming/25", bg: "bg-upcoming/10", text: "text-upcoming", glow: "shadow-upcoming/5" },
  accent: { border: "border-primary/25", bg: "bg-primary/10", text: "text-primary", glow: "shadow-primary/5" },
  win: { border: "border-win/25", bg: "bg-win/10", text: "text-win", glow: "shadow-win/5" },
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
    <div className={cn(
      "relative overflow-hidden rounded-lg border bg-card p-5",
      "shadow-lg shadow-black/20",
      style.border,
    )}>
      {/* Top accent line */}
      <div className={cn("absolute inset-x-0 top-0 h-[2px]", style.bg)} />

      {/* Inner gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight">
            {value}
          </p>
        </div>
        <div className={cn("rounded-xl p-3", style.bg, style.text)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
