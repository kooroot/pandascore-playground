const BASE = "/api";

async function fetchApi<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface Team {
  id: number;
  name: string;
  acronym: string | null;
  image_url: string | null;
  location: string | null;
}

export interface Player {
  id: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  image_url: string | null;
  nationality: string | null;
  age: number | null;
}

export interface TeamDetail extends Team {
  players: Player[];
}

export interface Opponent {
  opponent: Team;
  type: string;
}

export interface MatchResult {
  team_id: number;
  score: number;
}

export interface League {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
}

export interface Serie {
  id: number;
  full_name: string;
  name: string | null;
  slug: string;
  season: string | null;
  begin_at: string | null;
  end_at: string | null;
  year: number | null;
  tier: string | null;
  league: League;
  league_id: number;
}

export interface Tournament {
  id: number;
  name: string;
  slug: string;
  begin_at: string | null;
  end_at: string | null;
  tier: string | null;
  league: League;
  league_id: number;
  serie: Serie;
  serie_id: number;
  prizepool: string | null;
  winner_id: number | null;
}

export interface Match {
  id: number;
  name: string;
  slug: string;
  status: string;
  match_type: string;
  number_of_games: number;
  begin_at: string | null;
  end_at: string | null;
  original_scheduled_at: string | null;
  scheduled_at: string | null;
  opponents: Opponent[];
  results: MatchResult[];
  league: League;
  serie: Serie;
  tournament: Tournament;
  winner: Team | null;
  winner_id: number | null;
  streams_list?: { language: string; raw_url: string }[];
}

export const api = {
  getRunningMatches: () =>
    fetchApi<Match[]>("/lol/matches/running"),

  getUpcomingMatches: (params?: Record<string, string>) =>
    fetchApi<Match[]>("/lol/matches/upcoming", {
      "page[size]": "20",
      sort: "begin_at",
      ...params,
    }),

  getPastMatches: (params?: Record<string, string>) =>
    fetchApi<Match[]>("/lol/matches/past", {
      "page[size]": "20",
      sort: "-begin_at",
      ...params,
    }),

  getSeries: (params?: Record<string, string>) =>
    fetchApi<Serie[]>("/lol/series", {
      "page[size]": "50",
      sort: "-begin_at",
      ...params,
    }),

  getRunningSeries: () =>
    fetchApi<Serie[]>("/lol/series/running", {
      "page[size]": "50",
    }),

  getTournaments: (params?: Record<string, string>) =>
    fetchApi<Tournament[]>("/lol/tournaments", {
      "page[size]": "50",
      sort: "-begin_at",
      ...params,
    }),

  getRunningTournaments: () =>
    fetchApi<Tournament[]>("/lol/tournaments/running", {
      "page[size]": "50",
    }),

  getUpcomingTournaments: () =>
    fetchApi<Tournament[]>("/lol/tournaments/upcoming", {
      "page[size]": "50",
      sort: "begin_at",
    }),

  getTeams: (params?: Record<string, string>) =>
    fetchApi<Team[]>("/lol/teams", {
      "page[size]": "50",
      ...params,
    }),

  searchTeams: (query: string) =>
    fetchApi<Team[]>("/lol/teams", {
      "page[size]": "50",
      "search[name]": query,
    }),

  getTeamById: (id: number) =>
    fetchApi<TeamDetail>(`/lol/teams/${id}`),

  getTeamMatches: (id: number) =>
    fetchApi<Match[]>("/lol/matches/past", {
      "filter[opponent_id]": String(id),
      "page[size]": "10",
      sort: "-begin_at",
    }),

  // Get active teams by extracting from recent/upcoming matches
  getActiveTeams: async (): Promise<Team[]> => {
    const [running, upcoming, past] = await Promise.all([
      fetchApi<Match[]>("/lol/matches/running"),
      fetchApi<Match[]>("/lol/matches/upcoming", { "page[size]": "50" }),
      fetchApi<Match[]>("/lol/matches/past", { "page[size]": "50" }),
    ]);

    const allMatches = [...running, ...upcoming, ...past];
    const teamsMap = new Map<number, Team>();

    for (const match of allMatches) {
      for (const { opponent } of match.opponents) {
        if (opponent && !teamsMap.has(opponent.id)) {
          teamsMap.set(opponent.id, opponent);
        }
      }
    }

    return Array.from(teamsMap.values()).sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "")
    );
  },
};
