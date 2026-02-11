import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type Player } from "@/lib/api";
import { Loader, ErrorDisplay } from "@/components/Loader";
import { CompactMatchItem } from "@/components/CompactMatchItem";
import { ArrowLeft, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teams/$teamId")({
  component: TeamDetailPage,
});

const ROLE_ORDER = ["top", "jun", "mid", "adc", "sup"] as const;
const ROLE_LABELS: Record<string, string> = {
  top: "TOP",
  jun: "JUN",
  mid: "MID",
  adc: "ADC",
  sup: "SUP",
};
const ROLE_COLORS: Record<string, string> = {
  top: "bg-red-500/15 text-red-400 border-red-500/30",
  jun: "bg-green-500/15 text-green-400 border-green-500/30",
  mid: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  adc: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  sup: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

function TeamDetailPage() {
  const { teamId } = Route.useParams();
  const id = Number(teamId);

  const team = useQuery({
    queryKey: ["team", id],
    queryFn: () => api.getTeamById(id),
  });

  const matches = useQuery({
    queryKey: ["team", id, "matches"],
    queryFn: () => api.getTeamMatches(id),
  });

  if (team.isLoading) return <Loader />;
  if (team.error || !team.data)
    return <ErrorDisplay message="팀 정보를 불러올 수 없습니다" />;

  const t = team.data;
  const players = sortPlayersByRole(t.players ?? []);

  return (
    <div className="space-y-10">
      {/* Back nav */}
      <Link
        to="/teams"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        팀 목록으로 돌아가기
      </Link>

      {/* Team Header */}
      <div className="flex items-center gap-6">
        {t.image_url ? (
          <div className="h-24 w-24 shrink-0 rounded-2xl bg-secondary/50 p-3">
            <img
              src={t.image_url}
              alt={t.name}
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-secondary font-mono text-3xl font-bold text-muted-foreground">
            {t.acronym?.[0] ?? "?"}
          </div>
        )}
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            {t.name}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            {t.acronym && (
              <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-bold">
                {t.acronym}
              </span>
            )}
            {t.location && (
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {t.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Player Roster */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">선수 로스터</h2>
        {players.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-10 text-center text-muted-foreground">
            등록된 선수 정보가 없습니다
          </div>
        )}
      </section>

      {/* Recent Matches */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">최근 경기</h2>
        {matches.isLoading ? (
          <Loader />
        ) : matches.error ? (
          <ErrorDisplay message="경기 정보를 불러올 수 없습니다" />
        ) : matches.data && matches.data.length > 0 ? (
          <div className="space-y-2">
            {matches.data.map((match) => (
              <CompactMatchItem key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-10 text-center text-muted-foreground">
            최근 경기 기록이 없습니다
          </div>
        )}
      </section>
    </div>
  );
}

function sortPlayersByRole(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    const aIdx = ROLE_ORDER.indexOf(
      (a.role ?? "").toLowerCase() as (typeof ROLE_ORDER)[number],
    );
    const bIdx = ROLE_ORDER.indexOf(
      (b.role ?? "").toLowerCase() as (typeof ROLE_ORDER)[number],
    );
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });
}

function PlayerCard({ player }: { player: Player }) {
  const role = (player.role ?? "").toLowerCase();
  const roleLabel = ROLE_LABELS[role] ?? player.role ?? "—";
  const roleColor = ROLE_COLORS[role] ?? "bg-secondary text-muted-foreground border-border";

  return (
    <div className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-border hover:shadow-lg hover:shadow-black/20">
      {/* Player Image */}
      {player.image_url ? (
        <img
          src={player.image_url}
          alt={player.name}
          className="h-20 w-20 rounded-full object-cover bg-secondary"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <User size={28} className="text-muted-foreground" />
        </div>
      )}

      {/* Role Badge */}
      <span
        className={cn(
          "rounded-md border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          roleColor,
        )}
      >
        {roleLabel}
      </span>

      {/* Name */}
      <div className="text-center">
        <div className="text-sm font-bold">{player.name}</div>
        {(player.first_name || player.last_name) && (
          <div className="text-[11px] text-muted-foreground">
            {[player.first_name, player.last_name].filter(Boolean).join(" ")}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        {player.nationality && <span>{player.nationality}</span>}
        {player.age && <span>{player.age}세</span>}
      </div>
    </div>
  );
}
