import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type Match } from "@/lib/api";
import { MatchRow } from "@/components/MatchRow";
import { LiveMatchCard } from "@/components/LiveMatchCard";
import { Loader, ErrorDisplay } from "@/components/Loader";
import { useState, useMemo } from "react";
import { clsx } from "clsx";
import { Filter, ChevronDown } from "lucide-react";

const TIERS = [
  { value: "all", label: "전체 티어", description: "모든 경기" },
  { value: "s", label: "S-Tier", description: "Worlds, MSI" },
  { value: "a", label: "A-Tier", description: "LCK, LEC, LPL 결승" },
  { value: "b", label: "B-Tier", description: "메이저 리그" },
  { value: "c", label: "C-Tier", description: "2부 리그, 예선" },
  { value: "d", label: "D-Tier", description: "마이너 대회" },
] as const;

type TierValue = (typeof TIERS)[number]["value"];

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
});

function MatchesPage() {
  const [tab, setTab] = useState<"live" | "upcoming" | "past">("upcoming");
  const [tier, setTier] = useState<TierValue>("all");
  const [tierDropdownOpen, setTierDropdownOpen] = useState(false);

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
  const allMatches = current.data ?? [];

  const matches = useMemo(() => {
    if (tier === "all") return allMatches;
    return allMatches.filter((m: Match) => m.tournament?.tier === tier);
  }, [allMatches, tier]);

  const selectedTier = TIERS.find((t) => t.value === tier)!;

  if (current.isLoading) return <Loader />;
  if (current.error)
    return <ErrorDisplay message="경기 정보를 불러올 수 없습니다" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Matches</h1>
        <p className="text-text-muted">
          LoL 프로 경기 일정 및 결과
        </p>
      </div>

      {/* Tabs + Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
            {matches.length}개 경기
          </span>
        )}
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
