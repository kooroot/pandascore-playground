import type { Serie, Tournament } from "@/lib/api";
import { formatDate, getSeriesStatus } from "@/lib/utils";
import { ChevronRight, Trophy, Calendar } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

interface LeagueGroup {
  league: { id: number; name: string; image_url: string | null };
  series: (Serie & { tournaments: Tournament[] })[];
}

export function TournamentTree({
  series,
  tournaments,
}: {
  series: Serie[];
  tournaments: Tournament[];
}) {
  const tournBySerie = new Map<number, Tournament[]>();
  for (const t of tournaments) {
    const existing = tournBySerie.get(t.serie_id) ?? [];
    existing.push(t);
    tournBySerie.set(t.serie_id, existing);
  }

  const leagueMap = new Map<number, LeagueGroup>();
  for (const s of series) {
    if (!leagueMap.has(s.league_id)) {
      leagueMap.set(s.league_id, {
        league: s.league,
        series: [],
      });
    }
    leagueMap.get(s.league_id)!.series.push({
      ...s,
      tournaments: tournBySerie.get(s.id) ?? [],
    });
  }

  const groups = Array.from(leagueMap.values()).sort((a, b) =>
    a.league.name.localeCompare(b.league.name),
  );

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <LeagueNode key={group.league.id} group={group} />
      ))}
      {groups.length === 0 && (
        <div className="rounded-xl border border-dashed border-border-subtle bg-bg-card p-12 text-center text-text-dim">
          진행 중인 대회가 없습니다
        </div>
      )}
    </div>
  );
}

function LeagueNode({ group }: { group: LeagueGroup }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card overflow-hidden transition-all hover:border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-bg-elevated/50"
      >
        <div className={clsx("transition-transform duration-200", open && "rotate-90")}>
          <ChevronRight size={20} className="text-text-dim" />
        </div>

        {group.league.image_url ? (
          <img
            src={group.league.image_url}
            alt=""
            className="h-10 w-10 rounded-lg object-contain bg-white/5 p-1"
          />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-bg-elevated flex items-center justify-center text-xs text-text-dim">?</div>
        )}

        <div className="flex flex-col">
          <span className="text-base font-bold text-white">{group.league.name}</span>
          <span className="text-xs text-text-muted">{group.series.length} Series</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-border-subtle bg-bg-elevated/20">
          {group.series.map((s) => (
            <SeriesNode key={s.id} series={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function SeriesNode({
  series,
}: {
  series: Serie & { tournaments: Tournament[] };
}) {
  const [open, setOpen] = useState(true);
  const { label, color } = getSeriesStatus(series.begin_at, series.end_at);

  return (
    <div className="border-b border-border-subtle last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 px-6 py-4 pl-16 text-left transition-colors hover:bg-white/5 group"
      >
        <div className={clsx("transition-transform text-text-dim group-hover:text-text", open && "rotate-90")}>
          <ChevronRight size={16} />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-text-muted group-hover:text-white transition-colors">
            {series.full_name || series.name || `${series.year} ${series.season ?? ""}`}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase",
                color === "win" ? "bg-win/10 text-win" :
                  color === "upcoming" ? "bg-upcoming/10 text-upcoming" :
                    "bg-bg-elevated text-text-dim border border-white/5"
              )}
            >
              {label}
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-text-dim">
              <Calendar size={10} />
              {formatDate(series.begin_at)}
            </span>
          </div>
        </div>
      </button>

      {open && series.tournaments.length > 0 && (
        <div className="pb-4 pt-1 space-y-1">
          {series.tournaments.map((t) => (
            <div
              key={t.id}
              className="relative flex items-center gap-3 px-6 py-2 pl-24 text-sm transition-colors hover:bg-white/5 group"
            >
              <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-border-subtle group-hover:bg-border" />
              <div className="absolute left-[5.5rem] top-1/2 w-4 h-px bg-border-subtle group-hover:bg-border" />

              <Trophy size={14} className="text-primary/50 group-hover:text-primary transition-colors" />
              <span className="text-text-muted group-hover:text-text transition-colors">{t.name}</span>
              <div className="ml-auto flex items-center gap-3">
                <span className="font-mono text-xs text-text-dim">
                  {formatDate(t.begin_at)}
                </span>
                {t.prizepool && (
                  <span className="rounded bg-accent/10 px-2 py-0.5 text-xs text-accent font-mono border border-accent/20">
                    {t.prizepool}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
