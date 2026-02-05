import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type Serie, type Tournament } from "@/lib/api";
import { TournamentTree } from "@/components/TournamentTree";
import { Loader, ErrorDisplay } from "@/components/Loader";
import { useState, useMemo } from "react";
import { clsx } from "clsx";
import { Filter, ChevronDown } from "lucide-react";

const TIERS = [
  { value: "all", label: "전체 티어", description: "모든 대회" },
  { value: "s", label: "S-Tier", description: "Worlds, MSI" },
  { value: "a", label: "A-Tier", description: "LCK, LEC, LPL 결승" },
  { value: "b", label: "B-Tier", description: "메이저 리그" },
  { value: "c", label: "C-Tier", description: "2부 리그, 예선" },
  { value: "d", label: "D-Tier", description: "마이너 대회" },
] as const;

type TierValue = (typeof TIERS)[number]["value"];

export const Route = createFileRoute("/tournaments")({
  component: TournamentsPage,
});

function TournamentsPage() {
  const [tab, setTab] = useState<"running" | "upcoming">("running");
  const [tier, setTier] = useState<TierValue>("all");
  const [tierDropdownOpen, setTierDropdownOpen] = useState(false);

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

  // Filter tournaments by tier
  const filterByTier = (tournaments: Tournament[]) => {
    if (tier === "all") return tournaments;
    return tournaments.filter((t) => t.tier === tier);
  };

  // Filter series to only include those with matching tournaments
  const filterSeriesByTier = (series: Serie[], tournaments: Tournament[]) => {
    if (tier === "all") return series;
    const filteredTournaments = filterByTier(tournaments);
    const serieIds = new Set(filteredTournaments.map((t) => t.serie_id));
    return series.filter((s) => serieIds.has(s.id));
  };

  const filteredRunningTournaments = useMemo(
    () => filterByTier(runningTournaments.data ?? []),
    [runningTournaments.data, tier]
  );

  const filteredRunningSeries = useMemo(
    () => filterSeriesByTier(runningSeries.data ?? [], runningTournaments.data ?? []),
    [runningSeries.data, runningTournaments.data, tier]
  );

  const filteredUpcomingTournaments = useMemo(
    () => filterByTier(upcomingTournaments.data ?? []),
    [upcomingTournaments.data, tier]
  );

  const filteredAllSeries = useMemo(
    () => filterSeriesByTier(allSeries.data ?? [], upcomingTournaments.data ?? []),
    [allSeries.data, upcomingTournaments.data, tier]
  );

  const selectedTier = TIERS.find((t) => t.value === tier)!;

  const currentTournamentCount = tab === "running"
    ? filteredRunningTournaments.length
    : filteredUpcomingTournaments.length;

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

      {/* Tabs + Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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

        {/* Tier Filter */}
        <div className="relative">
          <button
            onClick={() => setTierDropdownOpen(!tierDropdownOpen)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all",
              tier !== "all"
                ? "bg-accent/10 border-accent/30 text-accent"
                : "bg-bg-card/50 border-border-subtle text-text-muted hover:text-white hover:border-border"
            )}
          >
            <Filter size={14} />
            <span>{selectedTier.label}</span>
            <ChevronDown
              size={14}
              className={clsx(
                "transition-transform",
                tierDropdownOpen && "rotate-180"
              )}
            />
          </button>

          {tierDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setTierDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-2 z-20 w-56 py-2 bg-bg-elevated border border-border rounded-xl shadow-xl">
                {TIERS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
                      setTier(t.value);
                      setTierDropdownOpen(false);
                    }}
                    className={clsx(
                      "w-full flex flex-col items-start px-4 py-2.5 text-left transition-colors",
                      tier === t.value
                        ? "bg-accent/10 text-accent"
                        : "text-text-muted hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="text-sm font-medium">{t.label}</span>
                    <span className="text-[11px] text-text-dim">
                      {t.description}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Active filter indicator */}
        {tier !== "all" && (
          <span className="text-xs text-text-dim">
            {currentTournamentCount}개 대회
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-border-subtle bg-bg-card/50 p-6 backdrop-blur-sm">
        {tab === "running" ? (
          <TournamentTree
            series={filteredRunningSeries}
            tournaments={filteredRunningTournaments}
          />
        ) : (
          <TournamentTree
            series={filteredAllSeries}
            tournaments={filteredUpcomingTournaments}
          />
        )}
      </div>
    </div>
  );
}
