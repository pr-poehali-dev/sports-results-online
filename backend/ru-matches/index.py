"""
Получение матчей российских лиг через api-sport.ru.
Поддерживает футбол (РПЛ, ФНЛ), хоккей (КХЛ), баскетбол (Единая лига ВТБ), волейбол.
v4 — диапазон: вчера + 7 дней вперёд, параллельные запросы
"""
import os
import json
import urllib.request
from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed

LEAGUES = [
    {"sport": "football", "id": 235, "name": "🇷🇺 РПЛ", "emoji": "⚽"},
    {"sport": "football", "id": 238, "name": "🇷🇺 ФНЛ", "emoji": "⚽"},
    {"sport": "hockey",   "id": 50,  "name": "🇷🇺 КХЛ", "emoji": "🏒"},
    {"sport": "basketball","id": 121, "name": "🇷🇺 ВТБ", "emoji": "🏀"},
    {"sport": "volleyball","id": 72,  "name": "🇷🇺 Суперлига", "emoji": "🏐"},
]

SPORT_BASE_URLS = {
    "football":   "https://api-football-v1.p.rapidapi.com/v3",
    "hockey":     "https://api-hockey.p.rapidapi.com",
    "basketball": "https://api-basketball.p.rapidapi.com",
    "volleyball": "https://api-volleyball.p.rapidapi.com",
}

RAPIDAPI_HOSTS = {
    "football":   "api-football-v1.p.rapidapi.com",
    "hockey":     "api-hockey.p.rapidapi.com",
    "basketball": "api-basketball.p.rapidapi.com",
    "volleyball": "api-volleyball.p.rapidapi.com",
}

STATUS_MAP = {
    "NS": "scheduled", "TBD": "scheduled",
    "1H": "live", "HT": "live", "2H": "live", "ET": "live", "P": "live", "LIVE": "live",
    "FT": "finished", "AET": "finished", "PEN": "finished",
    "PST": "postponed", "CANC": "postponed", "ABD": "postponed", "SUSP": "postponed",
    "NOT_STARTED": "scheduled",
    "IN_PROGRESS": "live", "INPROGRESS": "live",
    "FINISHED": "finished", "AFTER_OVERTIME": "finished", "AFTER_PENALTIES": "finished",
    "POSTPONED": "postponed", "CANCELLED": "postponed",
    "Q1": "live", "Q2": "live", "Q3": "live", "Q4": "live",
    "OT": "live", "P1": "live", "P2": "live", "P3": "live",
    "S1": "live", "S2": "live", "S3": "live", "S4": "live", "S5": "live",
}

MONTHS_RU = ["янв", "фев", "мар", "апр", "май", "июн",
             "июл", "авг", "сен", "окт", "ноя", "дек"]


def api_request(url: str, api_key: str) -> dict:
    host = url.split("/")[2]
    req = urllib.request.Request(url, headers={
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": host,
    })
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            raw = resp.read().decode()
            data = json.loads(raw)
            print(f"[OK] {url} -> {len(data.get('response', []))} results, errors={data.get('errors')}")
            return data
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:300]
        print(f"[HTTP {e.code}] {url} -> {body}")
        return {}
    except Exception as e:
        print(f"[ERR] {url} -> {type(e).__name__}: {e}")
        return {}


def date_label(dt_str: str) -> tuple:
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        moscow = dt + timedelta(hours=3)
        today = datetime.now(timezone.utc) + timedelta(hours=3)
        delta = (moscow.date() - today.date()).days
        if delta == 0:
            label = "Сегодня"
        elif delta == 1:
            label = "Завтра"
        elif delta == -1:
            label = "Вчера"
        else:
            label = f"{moscow.day} {MONTHS_RU[moscow.month - 1]}"
        return label, moscow.strftime("%H:%M")
    except Exception:
        return "Сегодня", ""


def get_range() -> tuple:
    now = datetime.now(timezone.utc) + timedelta(hours=3)
    return (
        (now - timedelta(days=1)).strftime("%Y-%m-%d"),
        (now + timedelta(days=7)).strftime("%Y-%m-%d"),
    )


def fetch_football(league_id: int, league_name: str, api_key: str) -> list:
    date_from, date_to = get_range()
    url = f"{SPORT_BASE_URLS['football']}/fixtures?league={league_id}&season=2025&from={date_from}&to={date_to}"
    data = api_request(url, api_key)
    results = []
    for fix in data.get("response", []):
        f = fix.get("fixture", {})
        teams = fix.get("teams", {})
        goals = fix.get("goals", {})
        status_raw = f.get("status", {}).get("short", "NS")
        status = STATUS_MAP.get(status_raw, "scheduled")
        elapsed = f.get("status", {}).get("elapsed")
        dl, tm = date_label(f.get("date", ""))
        if status == "live" and elapsed:
            tm = f"{elapsed}'"
        elif status == "finished":
            tm = "ФТ"
        results.append({
            "id": f"football_{f.get('id')}",
            "home": teams.get("home", {}).get("name", "—"),
            "away": teams.get("away", {}).get("name", "—"),
            "scoreHome": goals.get("home"),
            "scoreAway": goals.get("away"),
            "status": status, "time": tm, "date": dl,
            "league": league_name, "sport": "⚽",
            "utcDate": f.get("date", ""),
        })
    return results


def fetch_one_day(sport: str, league_id: int, league_name: str, emoji: str,
                  api_key: str, date: str, seen_ids: set) -> list:
    base = SPORT_BASE_URLS[sport]
    season = "2024-2025"
    url = f"{base}/games?league={league_id}&season={season}&date={date}"
    data = api_request(url, api_key)
    results = []
    for game in data.get("response", []):
        gid = f"{sport}_{game.get('id')}"
        if gid in seen_ids:
            continue
        seen_ids.add(gid)
        teams = game.get("teams", {})
        scores = game.get("scores", {})
        status_raw = game.get("status", {}).get("short", "NS")
        status = STATUS_MAP.get(status_raw, "scheduled")
        home_score = away_score = None
        if status in ("live", "finished"):
            h = scores.get("home", {})
            a = scores.get("away", {})
            home_score = h.get("total") if isinstance(h, dict) else h
            away_score = a.get("total") if isinstance(a, dict) else a
        date_str = game.get("date", "")
        dl, tm = date_label(date_str)
        if status == "finished":
            tm = "ФТ"
        elif status == "live":
            tm = (game.get("status", {}).get("long", "") or "LIVE")[:8]
        results.append({
            "id": gid,
            "home": teams.get("home", {}).get("name", "—"),
            "away": teams.get("away", {}).get("name", "—"),
            "scoreHome": home_score, "scoreAway": away_score,
            "status": status, "time": tm, "date": dl,
            "league": league_name, "sport": emoji,
            "utcDate": date_str,
        })
    return results


def fetch_other_sport(sport: str, league_id: int, league_name: str, emoji: str, api_key: str) -> list:
    now = datetime.now(timezone.utc) + timedelta(hours=3)
    dates = [(now + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(-1, 8)]
    seen_ids: set = set()
    results = []
    # Параллельно по дням
    with ThreadPoolExecutor(max_workers=9) as ex:
        futs = [ex.submit(fetch_one_day, sport, league_id, league_name, emoji, api_key, d, seen_ids)
                for d in dates]
        for fut in as_completed(futs):
            try:
                results.extend(fut.result())
            except Exception:
                pass
    return results


def fetch_league(league: dict, api_key: str) -> list:
    if league["sport"] == "football":
        return fetch_football(league["id"], league["name"], api_key)
    return fetch_other_sport(league["sport"], league["id"], league["name"], league["emoji"], api_key)


def handler(event: dict, context) -> dict:
    """Матчи российских лиг: вчера + 7 дней вперёд. РПЛ, ФНЛ, КХЛ, ВТБ, Суперлига."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    api_key = os.environ.get("RAPIDAPI_KEY", "") or os.environ.get("APISPORT_KEY", "")
    if not api_key:
        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps({"matches": [], "error": "no_api_key"}),
        }

    all_matches = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fetch_league, league, api_key): league for league in LEAGUES}
        for future in as_completed(futures):
            try:
                all_matches.extend(future.result())
            except Exception:
                pass

    order = {"live": 0, "scheduled": 1, "finished": 2, "postponed": 3}
    all_matches.sort(key=lambda m: (order.get(m["status"], 9), m.get("utcDate", "")))

    return {
        "statusCode": 200,
        "headers": {**cors, "Content-Type": "application/json"},
        "body": json.dumps({"matches": all_matches}),
    }