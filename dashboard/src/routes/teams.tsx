import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader, ErrorDisplay } from "@/components/Loader";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/teams")({
  component: TeamsPage,
});

function TeamsPage() {
  const [search, setSearch] = useState("");

  const teams = useQuery({
    queryKey: ["teams", search],
    queryFn: () =>
      api.getTeams(search ? { "filter[name]": search } : undefined),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Teams</h1>
        <p className="text-text-muted">LoL Esports Teams Global Database</p>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-text-dim">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search by team name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border-subtle bg-bg-card/50 backdrop-blur-sm py-3.5 pl-12 pr-4 text-sm text-text placeholder:text-text-dim/50 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm"
        />
      </div>

      {teams.isLoading ? (
        <Loader />
      ) : teams.error ? (
        <ErrorDisplay message="팀 정보를 불러올 수 없습니다" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
          {(teams.data ?? []).map((team) => (
            <Card
              key={team.id}
              className="group items-center transition-all hover:-translate-y-1 hover:border-primary/50"
            >
              <CardContent className="flex flex-col items-center gap-4">
                {team.image_url ? (
                  <div className="relative h-16 w-16 transition-transform group-hover:scale-110">
                    <img
                      src={team.image_url}
                      alt={team.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted font-mono text-xl font-bold text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    {team.acronym?.[0] ?? "?"}
                  </div>
                )}

                <div className="text-center w-full">
                  <div className="text-base font-bold truncate group-hover:text-primary transition-colors">
                    {team.acronym ?? team.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {team.name}
                  </div>
                  {team.location && (
                    <span className="mt-2 inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {team.location}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {(teams.data ?? []).length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border-subtle bg-bg-card/30 p-16 text-center text-text-dim">
              {search ? `"${search}" 검색 결과가 없습니다` : "팀 정보가 없습니다"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
