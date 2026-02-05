import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LiveMatchCard } from "@/components/LiveMatchCard";
import { CompactMatchItem } from "@/components/CompactMatchItem";
import { StatCard } from "@/components/StatCard";
import { Loader, ErrorDisplay } from "@/components/Loader";
import { Zap, Calendar, Trophy, TrendingUp, ArrowRight, Radio } from "lucide-react";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
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

  const runningTournaments = useQuery({
    queryKey: ["tournaments", "running"],
    queryFn: api.getRunningTournaments,
  });

  const isLoading = live.isLoading || upcoming.isLoading;
  const error = live.error || upcoming.error;

  if (isLoading) return <Loader />;
  if (error) return <ErrorDisplay message="데이터를 불러올 수 없습니다" />;

  const liveMatches = live.data ?? [];
  const upcomingMatches = (upcoming.data ?? []).slice(0, 8);
  const pastMatches = (past.data ?? []).slice(0, 8);

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="pb-8 animate-fade-in-up">
        <h1 className="text-4xl font-bold tracking-tight gradient-text">
          Esports Dashboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          실시간 스코어와 프로 경기 일정을 한눈에 확인하세요.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <StatCard
          label="라이브"
          value={liveMatches.length}
          icon={<Zap className="h-5 w-5" />}
          accent="live"
        />
        <StatCard
          label="진행 중 대회"
          value={runningTournaments.data?.length ?? 0}
          icon={<Trophy className="h-5 w-5" />}
          accent="accent"
        />
        <StatCard
          label="예정 경기"
          value={upcoming.data?.length ?? 0}
          icon={<Calendar className="h-5 w-5" />}
          accent="upcoming"
        />
        <StatCard
          label="최근 완료"
          value={pastMatches.length}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="win"
        />
      </div>

      {/* Live Matches — full-bleed background band */}
      <div className="section-band mt-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        {liveMatches.length > 0 ? (
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="live-dot" />
              <h2 className="text-xl font-bold">Live Matches</h2>
              <span className="live-badge">{liveMatches.length}</span>
            </div>
            <div className={`grid gap-5 ${liveMatches.length === 1 ? "max-w-lg" : "sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"}`}>
              {liveMatches.map((m) => (
                <LiveMatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mb-4">
              <Radio size={28} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              현재 진행 중인 경기가 없습니다
            </p>
            <p className="mt-1 text-xs text-muted-foreground/50">
              나중에 다시 확인해주세요
            </p>
          </div>
        )}
      </div>

      {/* Upcoming + Recent side by side */}
      <div className="grid gap-6 pt-8 xl:grid-cols-2 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        {/* Upcoming */}
        <section className="panel overflow-hidden">
          <div className="panel-inner">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider">
                <Calendar size={16} className="text-amber-400" />
                예정된 경기
              </h2>
              <Link
                to="/matches"
                className="btn-secondary !py-1.5 !px-3 !text-xs"
              >
                전체 보기 <ArrowRight size={12} />
              </Link>
            </div>
            <div className="flex flex-col gap-2.5 p-4">
              {upcomingMatches.map((m) => (
                <CompactMatchItem key={m.id} match={m} />
              ))}
              {upcomingMatches.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground/50">
                  예정된 경기가 없습니다
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Recent */}
        <section className="panel overflow-hidden">
          <div className="panel-inner">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider">
                <TrendingUp size={16} className="text-emerald-400" />
                최근 결과
              </h2>
              <Link
                to="/matches"
                className="btn-secondary !py-1.5 !px-3 !text-xs"
              >
                전체 보기 <ArrowRight size={12} />
              </Link>
            </div>
            <div className="flex flex-col gap-2.5 p-4">
              {pastMatches.map((m) => (
                <CompactMatchItem key={m.id} match={m} />
              ))}
              {pastMatches.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground/50">
                  최근 결과가 없습니다
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
