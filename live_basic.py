"""
PandaScore LoL 라이브 — Basic Live 플랜 전용
WebSocket 프레임 수신 (items, hp, herald, voidgrubs, paused, events 제외)

사용법:
  python3 live_basic.py [--league LPL]
"""
import os
import sys
import json
import asyncio
import argparse
from datetime import datetime

import requests

try:
    import websockets
except ImportError:
    print("websockets 패키지가 필요합니다: pip install websockets")
    sys.exit(1)

from dotenv import load_dotenv

load_dotenv()

TOKEN = os.environ.get("PANDASCORE_TOKEN", "")
BASE = "https://api.pandascore.co"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

# ── 색상 ──
R = "\033[0m"
B = "\033[1m"
DIM = "\033[2m"
RED = "\033[91m"
GRN = "\033[92m"
YEL = "\033[93m"
CYN = "\033[96m"
MAG = "\033[95m"

ROLE_ORDER = ["top", "jun", "mid", "adc", "sup"]
ROLE_LABEL = {"top": "TOP", "jun": "JNG", "mid": "MID", "adc": "ADC", "sup": "SUP"}

# ── 이벤트 아이콘 ──
EVT_KILL = "⚔"
EVT_DRAGON = "🐉"
EVT_BARON = "👑"
EVT_TOWER = "🏰"
EVT_INHIB = "💎"


# ── 골드 추정 (2026 시즌 기준) ──
# 미니언 골드: melee=20, caster=14, cannon=50+1/90s
# 웨이브 구성: 3melee+3caster(+cannon), 30분 후 caster 1감소
# 캐논 빈도: ~14분 매3웨이브, 14~25분 매2웨이브, 25분+ 매웨이브
# 패시브: 500 시작, 2.04g/s (1:05~)
# 킬: 레벨별 300~420g, 어시스트: 150g 기본

def gold_per_cs(game_sec):
    """게임 시간 기반 CS당 평균 골드 (누적 평균)"""
    m = game_sec / 60 if game_sec else 0
    # 위키 데이터 기반: 0:30→18.7, 14:00→19.2, 25:00→24.7, 30:00→27.4
    if m <= 14:
        return 18.7 + (19.2 - 18.7) * (m / 14)
    elif m <= 25:
        return 19.2 + (24.7 - 19.2) * ((m - 14) / 11)
    elif m <= 30:
        return 24.7 + (27.4 - 24.7) * ((m - 25) / 5)
    else:
        return 27.4


def kill_gold_by_level(level):
    """레벨별 킬 골드 (기본 바운티 제외)"""
    if level <= 6:
        return 300
    return 300 + (min(level, 18) - 6) * 10  # 최대 420


def estimate_player_gold(player, game_sec):
    """선수 골드 추정"""
    # 패시브 골드: 500 시작 + 2.04g/s (1:05 = 65초 이후)
    passive = 500 + max(0, (game_sec - 65)) * 2.04 if game_sec else 500

    # CS 골드
    cs = player.get("cs", 0)
    cs_gold = cs * gold_per_cs(game_sec)

    # 킬 골드 (레벨 기반 기본값, 바운티 미포함)
    kills = player.get("kills", 0)
    lvl = player.get("level", 1)
    k_gold = kills * kill_gold_by_level(lvl)

    # 어시스트 골드 (기본 150g)
    assists = player.get("assists", 0)
    a_gold = assists * 150

    return int(passive + cs_gold + k_gold + a_gold)


def api_get(path, params=None):
    r = requests.get(f"{BASE}{path}", headers=HEADERS, params=params or {})
    if r.status_code in (403, 404):
        return None
    r.raise_for_status()
    return r.json()


def fmt_time(sec):
    if sec is None:
        return "--:--"
    m, s = divmod(int(sec), 60)
    return f"{m:02d}:{s:02d}"


def fmt_gold(g):
    if not g:
        return "0"
    return f"{g/1000:.1f}k" if g >= 1000 else str(g)


def find_live_match(league_filter=None):
    matches = api_get("/lol/matches/running", {"page[size]": 50})
    if not matches:
        return None
    if league_filter:
        lf = league_filter.upper()
        matches = [m for m in matches if lf in m.get("league", {}).get("name", "").upper()]
    return matches[0] if matches else None


# ── 상태 ──
frame_count = 0
gold_history = []
prev_frame = None
event_log = []  # [(timestamp, icon, color, message), ...]
MAX_EVENTS = 15
last_log_ts = None
log_file = None
baron_detected = {"blue": False, "red": False}  # 골드 추정 바론 중복 방지

# 바론 골드: 글로벌 150g × 5명 + 슬레이어 100g = 850g 팀 합계
# 프레임당 정상 골드 증가: 패시브 ~20g + CS ~40-80g = 60-100g (2초 간격)
# → 팀 골드가 킬 없이 500g+ 급등하면 바론 의심
BARON_GOLD_THRESHOLD = 500


def _estimate_kill_gold(prev_side, curr_side):
    """프레임 간 킬/어시스트로 발생한 예상 골드"""
    gold = 0
    prev_p = prev_side.get("players", {})
    curr_p = curr_side.get("players", {})
    for role in ROLE_ORDER:
        p = curr_p.get(role, {})
        pp = prev_p.get(role, {})
        dk = p.get("kills", 0) - pp.get("kills", 0)
        da = p.get("assists", 0) - pp.get("assists", 0)
        if dk > 0:
            gold += dk * kill_gold_by_level(p.get("level", 1))
        if da > 0:
            gold += da * 150
    return gold


def detect_events(prev, curr):
    """이전/현재 프레임 비교 → 이벤트 감지"""
    events = []
    ts = curr.get("current_timestamp")

    for side in ("blue", "red"):
        opp = "red" if side == "blue" else "blue"
        team = curr.get(side, {})
        prev_team = prev.get(side, {})
        opp_team = curr.get(opp, {})
        team_name = team.get("acronym") or team.get("name", "?")
        opp_name = opp_team.get("acronym") or opp_team.get("name", "?")
        color = CYN if side == "blue" else RED

        # ── 킬 감지 (선수별) ──
        players = team.get("players", {})
        prev_players = prev_team.get("players", {})
        for role in ROLE_ORDER:
            p = players.get(role, {})
            pp = prev_players.get(role, {})
            pname = p.get("name", "?")
            champ = p.get("champion", {})
            cname = champ.get("name", "?") if isinstance(champ, dict) else "?"

            dk = p.get("kills", 0) - pp.get("kills", 0)
            dd = p.get("deaths", 0) - pp.get("deaths", 0)

            if dk > 0:
                # 누가 어시스트 했는지 찾기
                assisters = []
                for r2 in ROLE_ORDER:
                    if r2 == role:
                        continue
                    p2 = players.get(r2, {})
                    pp2 = prev_players.get(r2, {})
                    if p2.get("assists", 0) > pp2.get("assists", 0):
                        assisters.append(p2.get("name", "?"))
                assist_str = f" (+{', '.join(assisters)})" if assisters else ""
                for _ in range(dk):
                    events.append((ts, EVT_KILL, color,
                                   f"{team_name} {pname}({cname}) 킬!{assist_str}"))

            if dd > 0:
                for _ in range(dd):
                    events.append((ts, EVT_KILL, DIM,
                                   f"{team_name} {pname}({cname}) 사망"))

        # ── 타워 ──
        dt = team.get("towers", 0) - prev_team.get("towers", 0)
        if dt > 0:
            events.append((ts, EVT_TOWER, color,
                           f"{team_name} 타워 파괴 ({team.get('towers', 0)}개)"))

        # ── 억제기 ──
        di = team.get("inhibitors", 0) - prev_team.get("inhibitors", 0)
        if di > 0:
            events.append((ts, EVT_INHIB, color,
                           f"{team_name} 억제기 파괴 ({team.get('inhibitors', 0)}개)"))

        # ── 드래곤 ──
        curr_drakes = team.get("drakes", [])
        prev_drakes = prev_team.get("drakes", [])
        if isinstance(curr_drakes, list) and isinstance(prev_drakes, list):
            if len(curr_drakes) > len(prev_drakes):
                new_drake = curr_drakes[-1]
                events.append((ts, EVT_DRAGON, color,
                               f"{team_name} {new_drake} 드래곤 처치 ({len(curr_drakes)}째)"))
        elif isinstance(curr_drakes, int) and isinstance(prev_drakes, int):
            if curr_drakes > prev_drakes:
                events.append((ts, EVT_DRAGON, color,
                               f"{team_name} 드래곤 처치 ({curr_drakes}째)"))

        # ── 바론 (공식 데이터) ──
        curr_nash = team.get("nashors", [])
        prev_nash = prev_team.get("nashors", [])
        cn = len(curr_nash) if isinstance(curr_nash, list) else curr_nash
        pn = len(prev_nash) if isinstance(prev_nash, list) else prev_nash
        if cn > pn:
            baron_detected[side] = False  # 공식 확정 → 추정 플래그 리셋
            events.append((ts, EVT_BARON, color,
                           f"{team_name} 바론 처치! ({cn}째)"))

        # ── 바론 조기 감지 (골드 급등) ──
        # 20분(1200초) 이후, 킬로 설명 안 되는 팀 골드 급등 → 바론 추정
        if ts and ts >= 1200 and not baron_detected[side]:
            gold_delta = team.get("gold", 0) - prev_team.get("gold", 0)
            kill_gold = _estimate_kill_gold(prev_team, team)
            # 패시브 + CS 여유분 (~100g/2초)
            expected_normal = 100 + kill_gold
            unexplained = gold_delta - expected_normal
            if unexplained >= BARON_GOLD_THRESHOLD:
                baron_detected[side] = True
                events.append((ts, EVT_BARON, YEL,
                               f"{team_name} 바론 추정 (골드 +{gold_delta:,}g, 킬설명 {kill_gold:,}g)"))

    return events


def write_log(data, match_info):
    """10초 간격으로 raw 프레임을 JSONL에 기록 (재연용)"""
    global last_log_ts, log_file
    ts = data.get("current_timestamp") or 0

    if last_log_ts is not None and ts - last_log_ts < 10:
        return

    last_log_ts = ts

    if log_file is None:
        return

    entry = {
        "wall": datetime.now().isoformat(),
        "match_info": {
            "league": match_info.get("league", {}),
            "tournament": match_info.get("tournament", {}),
            "number_of_games": match_info.get("number_of_games"),
        },
        "frame": data,
    }

    log_file.write(json.dumps(entry, ensure_ascii=False) + "\n")
    log_file.flush()


def render(data, match_info):
    global frame_count, prev_frame
    frame_count += 1

    # ── 로그 기록 ──
    write_log(data, match_info)

    # ── 이벤트 감지 ──
    if prev_frame is not None:
        new_events = detect_events(prev_frame, data)
        event_log.extend(new_events)
        if len(event_log) > MAX_EVENTS:
            del event_log[:len(event_log) - MAX_EVENTS]
    prev_frame = data

    league = match_info.get("league", {}).get("name", "")
    tournament = match_info.get("tournament", {}).get("name", "")
    bo = match_info.get("number_of_games", "?")
    ts = data.get("current_timestamp")

    blue = data.get("blue", {})
    red = data.get("red", {})

    bn = blue.get("acronym") or blue.get("name", "?")
    rn = red.get("acronym") or red.get("name", "?")
    bs = blue.get("score", 0)
    rs = red.get("score", 0)

    bg = blue.get("gold", 0)
    rg = red.get("gold", 0)
    bk = blue.get("kills", 0)
    rk = red.get("kills", 0)
    bt = blue.get("towers", 0)
    rt = red.get("towers", 0)
    bi = blue.get("inhibitors", 0)
    ri = red.get("inhibitors", 0)

    bd = blue.get("drakes", [])
    rd = red.get("drakes", [])
    bdr = len(bd) if isinstance(bd, list) else bd
    rdr = len(rd) if isinstance(rd, list) else rd
    bd_types = " ".join(bd) if isinstance(bd, list) and bd else "—"
    rd_types = " ".join(rd) if isinstance(rd, list) and rd else "—"

    bna = blue.get("nashors", [])
    rna = red.get("nashors", [])
    bnc = len(bna) if isinstance(bna, list) else bna
    rnc = len(rna) if isinstance(rna, list) else rna

    gdiff = bg - rg
    gold_history.append((ts, bg, rg))
    if len(gold_history) > 90:
        gold_history.pop(0)

    # ── 출력 ──
    sys.stdout.write("\033[2J\033[H")
    sys.stdout.flush()

    now = datetime.now().strftime("%H:%M:%S")
    diff_color = GRN if abs(gdiff) > 3000 else YEL if abs(gdiff) > 1000 else DIM
    leader = bn if gdiff > 0 else rn

    print(f"  {MAG}⚡{R} {DIM}[{now}] 프레임 #{frame_count}{R}")
    print()
    print(f"  {B}{league}{R} — {tournament}")
    print(f"  {'━' * 56}")
    print(f"  {B}{bn:>10}  {bs} - {rs}  {rn:<10}{R}  {DIM}(Bo{bo}){R}")
    print(f"  {'━' * 56}")
    print(f"  게임 시간: {B}{fmt_time(ts)}{R}")
    print()

    # ── 팀 비교 ──
    w = 56
    print(f"  {'─' * w}")
    print(f"  {B}{'':>14} {CYN}{bn:>10}{R}      {RED}{rn:<10}{R}")
    print(f"  {'─' * w}")
    print(f"  {'골드':>14} {fmt_gold(bg):>10}      {fmt_gold(rg):<10}  {diff_color}Δ {'+' if gdiff > 0 else ''}{gdiff:,}{R}")
    print(f"  {'킬':>14} {bk:>10}      {rk:<10}")
    print(f"  {'타워':>14} {bt:>10}      {rt:<10}")
    print(f"  {'억제기':>14} {bi:>10}      {ri:<10}")
    print(f"  {'드래곤':>14} {bdr:>3} {DIM}{bd_types:<16}{R} {rdr:>3} {DIM}{rd_types}{R}")
    print(f"  {'바론':>14} {bnc:>10}      {rnc:<10}")
    print(f"  {'─' * w}")
    print()

    # ── ADC 골드 비교 ──
    b_adc = blue.get("players", {}).get("adc", {})
    r_adc = red.get("players", {}).get("adc", {})
    if b_adc and r_adc:
        b_adc_g = estimate_player_gold(b_adc, ts)
        r_adc_g = estimate_player_gold(r_adc, ts)
        adc_diff = b_adc_g - r_adc_g
        adc_color = GRN if abs(adc_diff) > 1000 else YEL if abs(adc_diff) > 500 else DIM
        b_adc_name = b_adc.get("name", "?")
        r_adc_name = r_adc.get("name", "?")
        print(f"  {B}ADC 골드 (추정){R}")
        print(f"  {'─' * w}")
        print(f"  {CYN}{bn} {b_adc_name:<10}{R} {fmt_gold(b_adc_g):>8}   vs   {fmt_gold(r_adc_g):<8} {RED}{rn} {r_adc_name}{R}  {adc_color}Δ {'+' if adc_diff > 0 else ''}{adc_diff:,}{R}")
        print(f"  {'─' * w}")
        print()

    # ── 선수 ──
    print(f"  {B}{'':>5} {'선수':<12} {'챔피언':<14} {'K/D/A':>7} {'CS':>5} {'Lv':>3} {'골드':>7}{R}")
    print(f"  {'─' * w}")

    for side_data, color, name in [(blue, CYN, bn), (red, RED, rn)]:
        players = side_data.get("players", {})
        print(f"  {color}{B}{name}{R}")
        for role in ROLE_ORDER:
            p = players.get(role)
            if not p:
                continue
            pname = p.get("name", "?")
            champ = p.get("champion", {})
            cname = champ.get("name", "?") if isinstance(champ, dict) else "?"
            k, d, a = p.get("kills", 0), p.get("deaths", 0), p.get("assists", 0)
            cs = p.get("cs", 0)
            lvl = p.get("level", 0)
            est_g = estimate_player_gold(p, ts)

            kc = GRN if d == 0 and (k + a) > 0 else RED if d > k + a else ""
            ke = R if kc else ""
            rl = ROLE_LABEL.get(role, role.upper())

            print(f"  {DIM}{rl:<5}{R} {pname:<12} {cname:<14} {kc}{k:>2}/{d}/{a:<2}{ke} {cs:>5} {lvl:>3} {DIM}{fmt_gold(est_g):>7}{R}")
        print()

    # ── 골드 그래프 ──
    if len(gold_history) >= 3:
        diffs = [b - r for (_, b, r) in gold_history]
        max_abs = max(abs(d) for d in diffs) or 1
        bar_w = 20
        step = max(1, len(diffs) // 12)

        print(f"  {B}골드 차이{R} {DIM}(← {bn}  |  {rn} →){R}")

        samples = list(range(0, len(diffs), step))
        if samples[-1] != len(diffs) - 1:
            samples.append(len(diffs) - 1)

        for i in samples:
            d = diffs[i]
            t = gold_history[i][0]
            blen = int(abs(d) / max_abs * bar_w)
            if d > 0:
                bar = " " * bar_w + "│" + GRN + "▓" * blen + R
            elif d < 0:
                pad = bar_w - blen
                bar = " " * pad + RED + "▓" * blen + R + "│"
            else:
                bar = " " * bar_w + "│"

            label = ""
            if i == len(diffs) - 1:
                label = f" {diff_color}{abs(d):,} {leader}{R}"

            print(f"  {fmt_time(t):>7} {bar}{label}")

        print()

    # ── 이벤트 로그 ──
    if event_log:
        print(f"  {B}이벤트 타임라인{R}")
        print(f"  {'─' * w}")
        for evt_ts, icon, color, msg in event_log:
            print(f"  {DIM}{fmt_time(evt_ts)}{R}  {icon}  {color}{msg}{R}")
        print()

    print(f"  {DIM}Ctrl+C 종료{R}")


# ── 리플레이 ──

def _convert_old_log(entry):
    """이전 포맷 로그 → 현재 포맷 변환"""
    # 이전 포맷: {"t": 216, "blue": {"name": "WE", "players": {"adc": {"champion": "Sivir", ...}}}, ...}
    # 현재 포맷: {"match_info": {...}, "frame": {raw ws data}}
    frame = {}
    frame["current_timestamp"] = entry.get("t", 0)

    for side in ("blue", "red"):
        sd = entry.get(side, {})
        converted = {
            "acronym": sd.get("name", "?"),
            "name": sd.get("name", "?"),
            "gold": sd.get("gold", 0),
            "kills": sd.get("kills", 0),
            "towers": sd.get("towers", 0),
            "inhibitors": sd.get("inhibitors", 0),
            "drakes": sd.get("drakes", 0),
            "nashors": sd.get("nashors", 0),
            "score": sd.get("score", 0),
            "players": {},
        }
        for role, p in sd.get("players", {}).items():
            champ = p.get("champion", "?")
            converted["players"][role] = {
                "name": p.get("name", "?"),
                "champion": {"name": champ} if isinstance(champ, str) else champ,
                "kills": p.get("kills", 0),
                "deaths": p.get("deaths", 0),
                "assists": p.get("assists", 0),
                "cs": p.get("cs", 0),
                "level": p.get("level", 0),
            }
        frame[side] = converted

    return frame


def replay(log_path, speed=1.0):
    """JSONL 로그 파일로 게임 재연"""
    import time

    with open(log_path, "r", encoding="utf-8") as f:
        lines = [l.strip() for l in f if l.strip()]

    if not lines:
        print(f"  {RED}빈 로그 파일입니다.{R}")
        return

    # 포맷 감지
    first = json.loads(lines[0])
    is_old = "frame" not in first and "t" in first

    if is_old:
        print(f"  {YEL}이전 포맷 로그 감지 — 자동 변환{R}")

    # 마지막 프레임 시간 미리 계산
    last_entry = json.loads(lines[-1])
    if is_old:
        last_ts = last_entry.get("t", 0)
    else:
        last_ts = last_entry.get("frame", last_entry).get("current_timestamp", 0)

    print(f"  {CYN}리플레이{R} — {log_path} ({len(lines)}프레임, {speed}x)")
    print(f"  {DIM}총 게임 시간: {fmt_time(last_ts)}{R}\n")

    prev_ts = None
    for i, line in enumerate(lines):
        entry = json.loads(line)

        if is_old:
            data = _convert_old_log(entry)
            match_info = {}
        else:
            data = entry.get("frame", entry)
            match_info = entry.get("match_info", {})

        ts = data.get("current_timestamp", 0)

        # 프레임 간 딜레이
        if prev_ts is not None and speed > 0:
            delay = (ts - prev_ts) / speed
            if delay > 0:
                time.sleep(min(delay, 5))  # 최대 5초 대기
        prev_ts = ts

        render(data, match_info)
        print(f"  {DIM}[{i+1}/{len(lines)}] {fmt_time(ts)} / {fmt_time(last_ts)}  (속도 {speed}x){R}")

    print(f"\n  {GRN}리플레이 종료{R}\n")


# ── WebSocket ──

async def stream(match_id, match_info):
    url = f"wss://live.pandascore.co/matches/{match_id}?token={TOKEN}"
    print(f"  {CYN}연결 중...{R} {DIM}{url[:70]}...{R}")

    try:
        async with websockets.connect(url, ping_interval=20, ping_timeout=10) as ws:
            async for msg in ws:
                data = json.loads(msg)

                if data.get("type") == "hello":
                    p = data.get("payload", {})
                    print(f"  {GRN}연결 완료{R} — game_id={p.get('game_id')}, status={p.get('status')}")
                    continue

                if "blue" in data and "red" in data:
                    render(data, match_info)

    except websockets.exceptions.ConnectionClosed as e:
        print(f"\n  {YEL}연결 종료: {e}{R}")
    except Exception as e:
        print(f"\n  {RED}에러: {e}{R}")


def main():
    parser = argparse.ArgumentParser(description="PandaScore LoL 라이브 (Basic Live)")
    parser.add_argument("--league", type=str, default=None, help="리그 필터 (예: LPL, LCK)")
    parser.add_argument("--match-id", type=int, default=None, help="매치 ID 직접 지정")
    parser.add_argument("--log", type=str, default=None, help="로그 파일 경로 (미지정 시 자동 생성)")
    parser.add_argument("--no-log", action="store_true", help="로그 비활성화")
    parser.add_argument("--replay", type=str, default=None, help="로그 파일 리플레이")
    parser.add_argument("--speed", type=float, default=2.0, help="리플레이 배속 (기본 2x)")
    args = parser.parse_args()

    # ── 리플레이 모드 ──
    if args.replay:
        try:
            replay(args.replay, args.speed)
        except KeyboardInterrupt:
            print(f"\n  {DIM}종료.{R}\n")
        return

    if not TOKEN:
        print("PANDASCORE_TOKEN 환경변수를 설정해주세요.")
        sys.exit(1)

    if args.match_id:
        matches = api_get("/lol/matches/running", {"page[size]": 50}) or []
        match_info = next((m for m in matches if m["id"] == args.match_id), None)
        if not match_info:
            match_info = api_get(f"/lol/matches/{args.match_id}")
        if not match_info:
            print(f"  매치 {args.match_id}를 찾을 수 없습니다.")
            sys.exit(1)
        match_id = args.match_id
    else:
        print(f"  라이브 매치 검색 중... (필터: {args.league or '전체'})")
        match_info = find_live_match(args.league)
        if not match_info:
            print("  진행 중인 매치가 없습니다.")
            sys.exit(0)
        match_id = match_info["id"]

    ops = match_info.get("opponents", [])
    a = ops[0]["opponent"].get("acronym", "?") if len(ops) > 0 else "?"
    b = ops[1]["opponent"].get("acronym", "?") if len(ops) > 1 else "?"
    league = match_info.get("league", {}).get("name", "")

    print(f"\n  {B}{league} — {a} vs {b}{R}  (id={match_id})\n")

    # ── 로그 파일 ──
    global log_file
    if not args.no_log:
        if args.log:
            log_path = args.log
        else:
            ts_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            log_path = f"logs/{ts_str}_{a}_vs_{b}.jsonl"
            os.makedirs("logs", exist_ok=True)
        log_file = open(log_path, "a", encoding="utf-8")
        print(f"  {DIM}로그: {log_path}{R}\n")

    try:
        asyncio.run(stream(match_id, match_info))
    except KeyboardInterrupt:
        print(f"\n  {DIM}종료.{R}\n")
    finally:
        if log_file:
            log_file.close()


if __name__ == "__main__":
    main()
