import type { Match } from "@/lib/api";
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
    <div className="group flex items-center gap-4 rounded-lg border border-[#333346] bg-[#12121a] px-5 py-4 transition-all hover:border-[#444460] hover:bg-[#181824]">
      {/* Date */}
      <span className="w-[78px] shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
        {formatShortDate(dateStr)}
      </span>

      {/* Status */}
      <span
        className={cn(
          "w-12 shrink-0 rounded-md px-1.5 py-0.5 text-center font-mono text-[10px] font-bold uppercase leading-tight",
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
      <div className="flex w-[120px] shrink-0 items-center gap-2 overflow-hidden">
        {match.league?.image_url ? (
          <img
            src={match.league.image_url}
            alt=""
            className="h-5 w-5 shrink-0 rounded object-contain"
          />
        ) : (
          <div className="h-5 w-5 shrink-0 rounded bg-secondary" />
        )}
        <span className="truncate text-[11px] text-muted-foreground">
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
          <span className="text-[9px] leading-none text-muted-foreground/40">
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
  team?: { name: string; acronym: string | null; image_url: string | null };
  align: "left" | "right";
  highlight: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2",
        align === "right" ? "justify-end" : "justify-start",
      )}
    >
      {align === "right" && (
        <span
          className={cn(
            "truncate text-xs font-semibold",
            highlight ? "text-win" : "text-muted-foreground",
          )}
        >
          {team?.acronym ?? "TBD"}
        </span>
      )}
      {team?.image_url ? (
        <img
          src={team.image_url}
          alt=""
          className="h-6 w-6 shrink-0 rounded object-contain"
        />
      ) : (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-secondary text-[8px] font-bold text-muted-foreground">
          {team?.acronym?.[0] ?? "?"}
        </div>
      )}
      {align === "left" && (
        <span
          className={cn(
            "truncate text-xs font-semibold",
            highlight ? "text-win" : "text-muted-foreground",
          )}
        >
          {team?.acronym ?? "TBD"}
        </span>
      )}
    </div>
  );
}
