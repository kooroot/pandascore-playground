import type { Match } from "@/lib/api";
import { Link } from "@tanstack/react-router";
import { formatShortDate, getMatchStatus, cn } from "@/lib/utils";

export function CompactMatchItem({ match }: { match: Match }) {
  const team1 = match.opponents[0]?.opponent;
  const team2 = match.opponents[1]?.opponent;
  const score1 =
    match.results?.find((r) => r.team_id === team1?.id)?.score ?? 0;
  const score2 =
    match.results?.find((r) => r.team_id === team2?.id)?.score ?? 0;

  const { label, color } = getMatchStatus(match.status);
  const isLive = match.status === "running";
  const isFinished = match.status === "finished";
  const dateStr = match.scheduled_at || match.begin_at;

  return (
    <div className="match-row group">
      {/* Date */}
      <span className="w-[80px] shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
        {formatShortDate(dateStr)}
      </span>

      {/* Status */}
      <span
        className={cn(
          "status-badge w-12 shrink-0 justify-center",
          isLive ? "live" : color === "upcoming" ? "upcoming" : "finished"
        )}
      >
        {label}
      </span>

      {/* League */}
      <div className="flex w-[130px] shrink-0 items-center gap-2.5 overflow-hidden">
        {match.league?.image_url ? (
          <img
            src={match.league.image_url}
            alt=""
            className="h-5 w-5 shrink-0 rounded object-contain"
          />
        ) : (
          <div className="h-5 w-5 shrink-0 rounded bg-secondary" />
        )}
        <span className="truncate text-[11px] font-medium text-muted-foreground">
          {match.league?.name ?? ""}
        </span>
      </div>

      {/* Matchup */}
      <div className="flex flex-1 items-center justify-center gap-3 overflow-hidden">
        <TeamBadge
          team={team1}
          align="right"
          highlight={isFinished && match.winner_id === team1?.id}
        />

        <div className="flex w-16 shrink-0 flex-col items-center">
          {isFinished || isLive ? (
            <span className="font-mono text-xs font-bold tabular-nums">
              {score1} - {score2}
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-muted-foreground/60">
              VS
            </span>
          )}
          <span className="text-[9px] leading-none text-muted-foreground/40 mt-0.5">
            BO{match.number_of_games}
          </span>
        </div>

        <TeamBadge
          team={team2}
          align="left"
          highlight={isFinished && match.winner_id === team2?.id}
        />
      </div>
    </div>
  );
}

function TeamBadge({
  team,
  align,
  highlight,
}: {
  team?: { id: number; name: string; acronym: string | null; image_url: string | null };
  align: "left" | "right";
  highlight: boolean;
}) {
  const nameEl = (
    <span
      className={cn(
        "truncate text-xs font-semibold transition-colors",
        highlight ? "text-emerald-400" : "text-muted-foreground"
      )}
    >
      {team?.acronym ?? "TBD"}
    </span>
  );

  const logoEl = (
    <div className="team-logo-sm flex items-center justify-center bg-secondary/80 border border-border">
      {team?.image_url ? (
        <img
          src={team.image_url}
          alt=""
          className="h-5 w-5 shrink-0 rounded object-contain"
        />
      ) : (
        <span className="text-[9px] font-bold text-muted-foreground">
          {team?.acronym?.[0] ?? "?"}
        </span>
      )}
    </div>
  );

  const inner = (
    <>
      {align === "right" && nameEl}
      {logoEl}
      {align === "left" && nameEl}
    </>
  );

  if (team) {
    return (
      <Link
        to="/teams/$teamId"
        params={{ teamId: String(team.id) }}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2.5 hover:opacity-80 transition-opacity",
          align === "right" ? "justify-end" : "justify-start"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2.5",
        align === "right" ? "justify-end" : "justify-start"
      )}
    >
      {inner}
    </div>
  );
}
