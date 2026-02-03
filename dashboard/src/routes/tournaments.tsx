import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TournamentTree } from "@/components/TournamentTree";
import { Loader, ErrorDisplay } from "@/components/Loader";
import { useState } from "react";
import { clsx } from "clsx";

export const Route = createFileRoute("/tournaments")({
  component: TournamentsPage,
});

function TournamentsPage() {
  const [tab, setTab] = useState<"running" | "upcoming">("running");

  const runningSeries = useQuery({
    queryKey: ["series", "running"],
    queryFn: api.getRunningSeries,
  });

  const runningTournaments = useQuery({
    queryKey: ["tournaments", "running"],
    queryFn: api.getRunningTournaments,
  });

  const upcomingTournaments = useQuery({
    queryKey: ["tournaments", "upcoming"],
    queryFn: api.getUpcomingTournaments,
  });

  const allSeries = useQuery({
    queryKey: ["series", "all"],
    queryFn: () => api.getSeries(),
  });

  const isLoading =
    runningSeries.isLoading || runningTournaments.isLoading;
  const error = runningSeries.error || runningTournaments.error;

  if (isLoading) return <Loader />;
  if (error) return <ErrorDisplay message="대회 정보를 불러올 수 없습니다" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Tournaments</h1>
        <p className="text-text-muted">
          리그 {">"} 시리즈 {">"} 토너먼트
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 gap-1 bg-bg-card/50 backdrop-blur-sm rounded-xl border border-border-subtle w-fit">
        {(["running", "upcoming"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "relative px-6 py-2.5 text-sm font-semibold rounded-lg transition-all",
              tab === t
                ? "bg-bg-elevated text-white shadow-sm ring-1 ring-white/10"
                : "text-text-muted hover:text-white hover:bg-white/5"
            )}
          >
            {t === "running" ? "Running" : "Upcoming"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border-subtle bg-bg-card/50 p-6 backdrop-blur-sm">
        {tab === "running" ? (
          <TournamentTree
            series={runningSeries.data ?? []}
            tournaments={runningTournaments.data ?? []}
          />
        ) : (
          <TournamentTree
            series={allSeries.data ?? []}
            tournaments={upcomingTournaments.data ?? []}
          />
        )}
      </div>
    </div>
  );
}
