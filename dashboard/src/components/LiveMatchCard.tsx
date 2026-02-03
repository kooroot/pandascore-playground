import type { Match } from "@/lib/api";
import { cn } from "@/lib/utils";

export function LiveMatchCard({ match }: { match: Match }) {
  const team1 = match.opponents[0]?.opponent;
  const team2 = match.opponents[1]?.opponent;
  const score1 =
    match.results?.find((r) => r.team_id === team1?.id)?.score ?? 0;
  const score2 =
    match.results?.find((r) => r.team_id === team2?.id)?.score ?? 0;

  const koStream = match.streams_list?.find((s) => s.language === "ko");

  return (
    <div className="relative overflow-hidden rounded-lg border border-live/20 bg-card shadow-xl shadow-live/5">
      {/* Red glow top border */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-live to-transparent" />

      {/* Subtle red radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,59,59,0.06),transparent_60%)] pointer-events-none" />

      <div className="relative space-y-5 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-live" />
            </span>
            <span className="rounded-md bg-live/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-live">
              LIVE
            </span>
            <span className="text-xs text-muted-foreground">
              BO{match.number_of_games}
            </span>
          </div>

          {match.league?.image_url && (
            <div className="flex items-center gap-2">
              <img
                src={match.league.image_url}
                alt={match.league.name}
                className="h-6 w-6 rounded object-contain"
              />
              <span className="text-xs text-muted-foreground hidden sm:block">
                {match.league.name}
              </span>
            </div>
          )}
        </div>

        {/* Scoreboard */}
        <div className="flex items-center justify-between gap-4">
          <TeamBlock team={team1} isWinner={score1 > score2} />

          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-4 font-mono text-4xl font-bold tabular-nums">
              <span className={cn(score1 > score2 ? "text-live" : "text-foreground")}>
                {score1}
              </span>
              <span className="text-xl text-muted-foreground/30">:</span>
              <span className={cn(score2 > score1 ? "text-live" : "text-foreground")}>
                {score2}
              </span>
            </div>
          </div>

          <TeamBlock team={team2} isWinner={score2 > score1} align="right" />
        </div>

        {/* Stream Button */}
        {koStream && (
          <a
            href={koStream.raw_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg bg-live/10 py-2.5 text-center text-xs font-semibold text-live transition-all hover:bg-live hover:text-white hover:shadow-lg hover:shadow-live/20"
          >
            한국어 중계 보기
          </a>
        )}
      </div>
    </div>
  );
}

function TeamBlock({
  team,
  isWinner,
  align = "left",
}: {
  team?: { name: string; acronym: string | null; image_url: string | null };
  isWinner: boolean;
  align?: "left" | "right";
}) {
  return (
    <div className={cn("flex flex-1 flex-col gap-3 min-w-0", align === "right" ? "items-end" : "items-start")}>
      {team?.image_url ? (
        <img
          src={team.image_url}
          alt={team.name}
          className="h-14 w-14 rounded-lg bg-secondary/80 p-2 object-contain"
        />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-secondary font-mono text-sm font-bold text-muted-foreground">
          {team?.acronym?.[0] ?? "?"}
        </div>
      )}
      <div className={cn("w-full", align === "right" && "text-right")}>
        <div className={cn("text-sm font-bold truncate", isWinner ? "text-foreground" : "text-muted-foreground")}>
          {team?.acronym ?? "TBD"}
        </div>
        <div className="text-[11px] text-muted-foreground/50 truncate hidden sm:block">
          {team?.name}
        </div>
      </div>
    </div>
  );
}
