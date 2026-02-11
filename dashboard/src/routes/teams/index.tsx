import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type Team } from "@/lib/api";
import { Loader, ErrorDisplay } from "@/components/Loader";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Users } from "lucide-react";
import { useState, useDeferredValue } from "react";

export const Route = createFileRoute("/teams/")({
  component: TeamsPage,
});

function TeamsPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  // Fetch active teams (from recent/upcoming matches) when no search
  const activeTeams = useQuery({
    queryKey: ["teams", "active"],
    queryFn: api.getActiveTeams,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch search results when searching
  const searchResults = useQuery({
    queryKey: ["teams", "search", deferredSearch],
    queryFn: () => api.searchTeams(deferredSearch),
    enabled: deferredSearch.length > 0,
  });

  const isSearching = deferredSearch.length > 0;
  const teams = isSearching ? searchResults : activeTeams;
  const teamList = (teams.data ?? []) as Team[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Teams</h1>
        <p className="text-text-muted">LoL Esports Teams Global Database</p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative max-w-lg flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-text-dim">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="팀 이름 검색 (예: T1, Gen.G, DRX...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-bg-card/50 backdrop-blur-sm py-3.5 pl-12 pr-4 text-sm text-text placeholder:text-text-dim/50 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm"
          />
        </div>

        {!isSearching && (
          <div className="flex items-center gap-2 text-xs text-text-dim">
            <Users size={14} />
            <span>현재 활성 팀 {teamList.length}개 표시 중</span>
          </div>
        )}
      </div>

      {teams.isLoading ? (
        <Loader />
      ) : teams.error ? (
        <ErrorDisplay message="팀 정보를 불러올 수 없습니다" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
          {teamList.map((team) => (
            <Link
              key={team.id}
              to="/teams/$teamId"
              params={{ teamId: String(team.id) }}
              className="block"
            >
              <Card
                className="group items-center transition-all hover:-translate-y-1 hover:border-primary/50 cursor-pointer"
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
            </Link>
          ))}
          {teamList.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border-subtle bg-bg-card/30 p-16 text-center text-text-dim">
              {search ? `"${search}" 검색 결과가 없습니다` : "팀 정보가 없습니다"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
