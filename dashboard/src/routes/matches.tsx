import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MatchRow } from "@/components/MatchRow";
import { LiveMatchCard } from "@/components/LiveMatchCard";
import { Loader, ErrorDisplay } from "@/components/Loader";
import { useState } from "react";
import { clsx } from "clsx";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
});

function MatchesPage() {
  const [tab, setTab] = useState<"live" | "upcoming" | "past">("upcoming");

  const live = useQuery({
    queryKey: ["matches", "running"],
    queryFn: api.getRunningMatches,
    refetchInterval: 15_000,
  });

  const upcoming = useQuery({
    queryKey: ["matches", "upcoming"],
    queryFn: () => api.getUpcomingMatches(),
  });

  const past = useQuery({
    queryKey: ["matches", "past"],
    queryFn: () => api.getPastMatches(),
  });

  const current = tab === "live" ? live : tab === "upcoming" ? upcoming : past;

  if (current.isLoading) return <Loader />;
  if (current.error)
    return <ErrorDisplay message="경기 정보를 불러올 수 없습니다" />;

  const matches = current.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Matches</h1>
        <p className="text-text-muted">
          LoL 프로 경기 일정 및 결과
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 gap-1 bg-bg-card/50 backdrop-blur-sm rounded-xl border border-border-subtle w-fit">
        {(
          [
            { key: "live", label: "Live Matches", count: live.data?.length ?? 0 },
            { key: "upcoming", label: "Upcoming" },
            { key: "past", label: "Results" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "relative flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all",
              tab === t.key
                ? "bg-bg-elevated text-white shadow-sm ring-1 ring-white/10"
                : "text-text-muted hover:text-white hover:bg-white/5"
            )}
          >
            {t.key === "live" && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
              </span>
            )}
            {t.label}
            {"count" in t && t.count > 0 && (
              <span className="bg-live/20 text-live text-[10px] px-1.5 py-0.5 rounded ml-1">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "live" && matches.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {matches.map((m) => (
            <LiveMatchCard key={m.id} match={m} />
          ))}
        </div>
      ) : tab === "live" ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-bg-card/30 p-16 text-center">
          <span className="text-4xl mb-4">💤</span>
          <p className="text-text-muted text-lg font-medium">현재 진행 중인 경기가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m) => (
            <MatchRow key={m.id} match={m} />
          ))}
          {matches.length === 0 && (
            <div className="rounded-xl border border-dashed border-border-subtle bg-bg-card/30 p-12 text-center text-text-dim">
              경기가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}
