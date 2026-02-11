import type { Match } from "@/lib/api";
import { Link } from "@tanstack/react-router";
import { formatShortDate, getMatchStatus, cn } from "@/lib/utils";

export function MatchRow({ match }: { match: Match }) {
  const team1 = match.opponents[0]?.opponent;
  const team2 = match.opponents[1]?.opponent;
  const score1 =
    match.results?.find((r) => r.team_id === team1?.id)?.score ?? 0;
  const score2 =
    match.results?.find((r) => r.team_id === team2?.id)?.score ?? 0;

  const { label, color } = getMatchStatus(match.status);
  const isLive = match.status === "running";
  const isFinished = match.status === "finished";

  return (
    <div className="group flex items-center gap-5 rounded-lg border border-border/60 bg-card px-5 py-4 transition-all hover:border-border hover:bg-card/80 hover:shadow-lg hover:shadow-black/20">
      {/* Date */}
      <span className="w-20 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
        {formatShortDate(match.scheduled_at || match.begin_at)}
      </span>

      {/* Status */}
      <span
        className={cn(
          "w-14 shrink-0 rounded-md px-1.5 py-1 text-center font-mono text-[10px] font-bold uppercase leading-tight",
          isLive
            ? "bg-live/15 text-live"
            : color === "upcoming"
              ? "bg-upcoming/15 text-upcoming"
              : "bg-secondary text-muted-foreground",
        )}
      >
        {label}
      </span>

      {/* League */}
      <div className="flex w-48 shrink-0 items-center gap-3 overflow-hidden">
        {match.league?.image_url ? (
          <img
            src={match.league.image_url}
            alt=""
            className="h-8 w-8 shrink-0 rounded-lg object-contain bg-secondary p-0.5"
          />
        ) : (
          <div className="h-8 w-8 shrink-0 rounded-lg bg-secondary" />
        )}
        <div className="flex min-w-0 flex-col overflow-hidden">
          <span className="truncate text-sm font-semibold">
            {match.league?.name}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {match.tournament?.name}
          </span>
        </div>
      </div>

      {/* Matchup */}
      <div className="flex flex-1 items-center justify-center gap-5">
        {team1 ? (
          <Link
            to="/teams/$teamId"
            params={{ teamId: String(team1.id) }}
            className="flex min-w-0 flex-1 items-center justify-end gap-3 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className={cn(
                "truncate text-sm font-bold hover:text-primary transition-colors",
                isFinished && match.winner_id === team1.id
                  ? "text-win"
                  : "text-muted-foreground",
              )}
            >
              {team1.acronym ?? "TBD"}
            </span>
            {team1.image_url ? (
              <img
                src={team1.image_url}
                alt=""
                className="h-9 w-9 shrink-0 rounded-lg object-contain bg-secondary p-0.5"
              />
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-lg bg-secondary" />
            )}
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <span className="truncate text-sm font-bold text-muted-foreground">TBD</span>
            <div className="h-9 w-9 shrink-0 rounded-lg bg-secondary" />
          </div>
        )}

        <div className="flex w-20 shrink-0 flex-col items-center">
          {isFinished || isLive ? (
            <span className="font-mono text-lg font-bold tabular-nums">
              {score1} - {score2}
            </span>
          ) : (
            <span className="rounded-lg bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
              VS
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/50">
            BO{match.number_of_games}
          </span>
        </div>

        {team2 ? (
          <Link
            to="/teams/$teamId"
            params={{ teamId: String(team2.id) }}
            className="flex min-w-0 flex-1 items-center justify-start gap-3 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {team2.image_url ? (
              <img
                src={team2.image_url}
                alt=""
                className="h-9 w-9 shrink-0 rounded-lg object-contain bg-secondary p-0.5"
              />
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-lg bg-secondary" />
            )}
            <span
              className={cn(
                "truncate text-sm font-bold hover:text-primary transition-colors",
                isFinished && match.winner_id === team2.id
                  ? "text-win"
                  : "text-muted-foreground",
              )}
            >
              {team2.acronym ?? "TBD"}
            </span>
          </Link>
        ) : (
          <div className="flex min-w-0 flex-1 items-center justify-start gap-3">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-secondary" />
            <span className="truncate text-sm font-bold text-muted-foreground">TBD</span>
          </div>
        )}
      </div>
    </div>
  );
}
