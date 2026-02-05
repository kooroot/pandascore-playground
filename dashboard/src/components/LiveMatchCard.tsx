import type { Match } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

export function LiveMatchCard({ match }: { match: Match }) {
  const team1 = match.opponents[0]?.opponent;
  const team2 = match.opponents[1]?.opponent;
  const score1 =
    match.results?.find((r) => r.team_id === team1?.id)?.score ?? 0;
  const score2 =
    match.results?.find((r) => r.team_id === team2?.id)?.score ?? 0;

  const koStream = match.streams_list?.find((s) => s.language === "ko");

  return (
    <div className="match-card live group">
      <div className="relative space-y-5 p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="live-dot" />
            <span className="live-badge">LIVE</span>
            <span className="text-xs font-medium text-muted-foreground">
              BO{match.number_of_games}
            </span>
          </div>

          {match.league?.image_url && (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-secondary/50">
              <img
                src={match.league.image_url}
                alt={match.league.name}
                className="h-5 w-5 rounded object-contain"
              />
              <span className="text-[11px] font-medium text-muted-foreground hidden sm:block max-w-[120px] truncate">
                {match.league.name}
              </span>
            </div>
          )}
        </div>

        {/* Scoreboard */}
        <div className="flex items-center justify-between gap-4">
          <TeamBlock team={team1} isWinner={score1 > score2} />

          <div className="flex flex-col items-center gap-2">
            <div className="score-display">
              <span className={cn(score1 > score2 && "score-winning")}>
                {score1}
              </span>
              <span className="separator">:</span>
              <span className={cn(score2 > score1 && "score-winning")}>
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
            className="stream-btn"
          >
            <Play size={14} fill="currentColor" />
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
      <div className="team-logo">
        {team?.image_url ? (
          <img
            src={team.image_url}
            alt={team.name}
            className="object-contain"
          />
        ) : (
          <span className="font-mono text-sm font-bold text-muted-foreground">
            {team?.acronym?.[0] ?? "?"}
          </span>
        )}
      </div>
      <div className={cn("w-full", align === "right" && "text-right")}>
        <div className={cn(
          "text-sm font-semibold truncate transition-colors",
          isWinner ? "text-foreground" : "text-muted-foreground"
        )}>
          {team?.acronym ?? "TBD"}
        </div>
        <div className="text-[10px] text-muted-foreground/60 truncate hidden sm:block">
          {team?.name}
        </div>
      </div>
    </div>
  );
}
