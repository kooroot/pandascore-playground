import os
from datetime import date

from dotenv import load_dotenv
import requests

load_dotenv()

API_TOKEN = os.environ.get("PANDASCORE_TOKEN", "")
BASE_URL = "https://api.pandascore.co/lol/tournaments"


def fetch_tournaments(status=None, tier="a", page=1, per_page=100):
    url = BASE_URL
    if status:
        url = f"{BASE_URL}/{status}"

    headers = {"Authorization": f"Bearer {API_TOKEN}"}
    params = {
        "filter[tier]": tier,
        "page[number]": page,
        "page[size]": per_page,
    }

    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()


def fmt_date(raw):
    if not raw:
        return "TBD"
    return raw[:10]


def print_tournaments(tournaments):
    if not tournaments:
        print("  (없음)\n")
        return
    for i, t in enumerate(tournaments, 1):
        league = t.get("league", {}).get("name", "N/A")
        serie = t.get("serie", {}).get("full_name", "N/A")
        begin = fmt_date(t.get("begin_at"))
        end = fmt_date(t.get("end_at"))

        print(f"  {i}. {t['name']}")
        print(f"     | 리그: {league}")
        print(f"     | 시리즈: {serie}")
        print(f"     | 기간: {begin} ~ {end}")
        print(f"     | ID: {t['id']}")
        print()


if __name__ == "__main__":
    if not API_TOKEN:
        print("PANDASCORE_TOKEN 환경변수를 설정해주세요.")
        print("  export PANDASCORE_TOKEN='your-token-here'")
        raise SystemExit(1)

    today = date.today().isoformat()

    for tier in ["a", "b"]:
        all_tournaments = fetch_tournaments(tier=tier)
        active = [
            t for t in all_tournaments
            if (t.get("end_at") or "") >= today or t.get("end_at") is None
        ]
        running = [t for t in active if t.get("begin_at") and t["begin_at"][:10] <= today]
        upcoming = [t for t in active if t.get("begin_at") and t["begin_at"][:10] > today]

        print()
        print(f"  ╔{'═' * 56}╗")
        print(f"  ║  Tier {tier.upper():<51}║")
        print(f"  ╚{'═' * 56}╝")

        print(f"\n  ▸ 진행 중 ({len(running)}개)")
        print(f"  {'─' * 40}")
        print_tournaments(running)

        print(f"  ▸ 예정 ({len(upcoming)}개)")
        print(f"  {'─' * 40}")
        print_tournaments(upcoming)
