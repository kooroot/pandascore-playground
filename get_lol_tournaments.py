import os
from collections import defaultdict
from datetime import date

from dotenv import load_dotenv
import requests

load_dotenv()

API_TOKEN = os.environ.get("PANDASCORE_TOKEN", "")
API_BASE = "https://api.pandascore.co/lol"


def api_get(path, params=None):
    headers = {"Authorization": f"Bearer {API_TOKEN}"}
    response = requests.get(f"{API_BASE}/{path}", headers=headers, params=params or {})
    response.raise_for_status()
    return response.json()


def fetch_series(tier="a", page=1, per_page=100):
    return api_get("series", {
        "filter[tier]": tier,
        "page[number]": page,
        "page[size]": per_page,
    })


def fetch_tournaments(tier="a", page=1, per_page=100):
    return api_get("tournaments", {
        "filter[tier]": tier,
        "page[number]": page,
        "page[size]": per_page,
    })


def fmt_date(raw):
    if not raw:
        return "TBD"
    return raw[:10]


def status_label(begin, end, today):
    if end and end < today:
        return "완료"
    if begin and begin <= today:
        return "진행 중"
    return "예정"


def build_tree(series_list, tournaments, today):
    """리그 > 시리즈 > 대회 트리 구조를 만든다."""
    # 시리즈 ID -> 대회 목록 매핑
    tourn_by_serie = defaultdict(list)
    for t in tournaments:
        sid = t.get("serie_id")
        if sid:
            tourn_by_serie[sid].append(t)

    # 리그 > 시리즈 그룹핑 (활성 시리즈만)
    tree = defaultdict(list)
    for s in series_list:
        end = s.get("end_at") or ""
        begin = s.get("begin_at") or ""
        if end and end[:10] < today and begin[:10] < today:
            # 완전히 끝난 시리즈는 제외
            continue
        league_name = s.get("league", {}).get("name", "N/A")
        tree[league_name].append(s)

    return tree, tourn_by_serie


def print_tree(tree, tourn_by_serie, today):
    for league in sorted(tree.keys()):
        series_list = sorted(tree[league], key=lambda s: s.get("begin_at") or "")

        print(f"\n  ┌{'─' * 55}┐")
        print(f"  │  {league:<53} │")
        print(f"  └{'─' * 55}┘")

        for s in series_list:
            s_begin = fmt_date(s.get("begin_at"))
            s_end = fmt_date(s.get("end_at"))
            s_status = status_label(s_begin, s_end, today)
            full_name = s.get("full_name") or s.get("name") or "N/A"

            print(f"\n    ▸ {full_name}  [{s_status}]")
            print(f"      기간: {s_begin} ~ {s_end}")

            tourneys = tourn_by_serie.get(s.get("id"), [])
            tourneys = sorted(tourneys, key=lambda t: t.get("begin_at") or "")

            if not tourneys:
                print(f"      (대회 정보 없음)")
                continue

            for t in tourneys:
                t_begin = fmt_date(t.get("begin_at"))
                t_end = fmt_date(t.get("end_at"))
                t_status = status_label(t_begin, t_end, today)
                t_name = t.get("name", "N/A")

                print(f"      │  {t_name:<35} [{t_status}]")
                print(f"      │    기간: {t_begin} ~ {t_end}")

            print(f"      └{'─' * 42}")


if __name__ == "__main__":
    if not API_TOKEN:
        print("PANDASCORE_TOKEN 환경변수를 설정해주세요.")
        print("  export PANDASCORE_TOKEN='your-token-here'")
        raise SystemExit(1)

    today = date.today().isoformat()

    for tier in ["a", "b"]:
        series = fetch_series(tier=tier)
        tournaments = fetch_tournaments(tier=tier)
        tree, tourn_by_serie = build_tree(series, tournaments, today)

        print()
        print(f"  ╔{'═' * 56}╗")
        print(f"  ║  Tier {tier.upper():<51}║")
        print(f"  ╚{'═' * 56}╝")

        if not tree:
            print("\n    (활성 시리즈 없음)")
            continue

        print_tree(tree, tourn_by_serie, today)

    print()
