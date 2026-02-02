import os
from collections import defaultdict

from dotenv import load_dotenv
import requests

load_dotenv()

API_TOKEN = os.environ.get("PANDASCORE_TOKEN", "")
BASE_URL = "https://api.pandascore.co/lol/matches/running"


def fetch_running_matches(page=1, per_page=100):
    headers = {"Authorization": f"Bearer {API_TOKEN}"}
    params = {
        "page[number]": page,
        "page[size]": per_page,
    }

    response = requests.get(BASE_URL, headers=headers, params=params)
    response.raise_for_status()
    return response.json()


def fmt_time(raw):
    if not raw:
        return "TBD"
    return raw.replace("T", " ")[:16]


def get_opponents(match):
    opponents = match.get("opponents", [])
    if len(opponents) >= 2:
        a = opponents[0].get("opponent", {})
        b = opponents[1].get("opponent", {})
        return a.get("acronym") or a.get("name", "?"), b.get("acronym") or b.get("name", "?")
    return "TBD", "TBD"


def get_score(match):
    results = match.get("results", [])
    if len(results) >= 2:
        return results[0].get("score", 0), results[1].get("score", 0)
    return 0, 0


def group_by_league(matches):
    groups = defaultdict(list)
    for m in matches:
        league = m.get("league", {}).get("name", "N/A")
        groups[league].append(m)
    return dict(groups)


if __name__ == "__main__":
    if not API_TOKEN:
        print("PANDASCORE_TOKEN 환경변수를 설정해주세요.")
        print("  export PANDASCORE_TOKEN='your-token-here'")
        raise SystemExit(1)

    matches = fetch_running_matches()

    print()
    print(f"  ╔{'═' * 56}╗")
    print(f"  ║  LIVE 경기{'':>46}║")
    print(f"  ╚{'═' * 56}╝")

    if not matches:
        print("\n    현재 진행 중인 경기가 없습니다.\n")
        raise SystemExit(0)

    grouped = group_by_league(matches)
    for league, items in sorted(grouped.items()):
        print(f"\n    ┌ {league}")
        for m in items:
            team_a, team_b = get_opponents(m)
            score_a, score_b = get_score(m)
            bo = m.get("number_of_games", "?")
            tournament = m.get("tournament", {}).get("name", "")
            started = fmt_time(m.get("begin_at"))

            print(f"    │")
            print(f"    │  {team_a}  {score_a} - {score_b}  {team_b}  (Bo{bo})")
            print(f"    │    대회: {tournament}")
            print(f"    │    시작: {started}")

            streams = m.get("streams_list") or []
            kr_stream = next((s for s in streams if s.get("language") == "ko"), None)
            if kr_stream:
                print(f"    │    방송: {kr_stream.get('raw_url', 'N/A')}")

        print(f"    └{'─' * 45}")

    print()
