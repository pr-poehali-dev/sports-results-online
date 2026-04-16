"""
Получение матчей российских лиг через api-sport.ru.
Поддерживает футбол (РПЛ, ФНЛ), хоккей (КХЛ), баскетбол (Единая лига ВТБ), волейбол.
v2 — вчерашние результаты + сегодня
"""
import os
import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone


BASE_URL = "https://v3.football.api-sports.io"
BASE_URL_HOCKEY = "https://v1.hockey.api-sports.io"
BASE_URL_BASKETBALL = "https://v1.basketball.api-sports.io"
BASE_URL_VOLLEYBALL = "https://v1.volleyball.api-sports.io"

# Российские лиги (league_id из api-sports.io)
# Football: РПЛ=235, ФНЛ=238
# Hockey: КХЛ=50
# Basketball: Единая лига ВТБ=121
# Volleyball: Суперлига Россия=72 (мужская), 73 (женская)

LEAGUES = [
    {"sport": "football", "id": 235, "name": "🇷🇺 РПЛ", "emoji": "⚽"},
    {"sport": "football", "id": 238, "name": "🇷🇺 ФНЛ", "emoji": "⚽"},
    {"sport": "hockey", "id": 50, "name": "🇷🇺 КХЛ", "emoji": "🏒"},
    {"sport": "basketball", "id": 121, "name": "🇷🇺 ВТБ", "emoji": "🏀"},
    {"sport": "volleyball", "id": 72, "name": "🇷🇺 Суперлига", "emoji": "🏐"},
]

SPORT_BASE_URLS = {
    "football": "https://v3.football.api-sports.io",
    "hockey": "https://v1.hockey.api-sports.io",
    "basketball": "https://v1.basketball.api-sports.io",
    "volleyball": "https://v1.volleyball.api-sports.io",
}

STATUS_MAP = {
    # Football
    "NS": "scheduled", "TBD": "scheduled",
    "1H": "live", "HT": "live", "2H": "live", "ET": "live", "P": "live", "LIVE": "live",
    "FT": "finished", "AET": "finished", "PEN": "finished",
    "PST": "postponed", "CANC": "postponed", "ABD": "postponed", "SUSP": "postponed",
    # Hockey / Basketball / Volleyball
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
    req = urllib.request.Request(url, headers={
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": url.split("/")[2],
        "x-apisports-key": api_key,
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except Exception:
        return {}


def date_label(dt_str: str) -> tuple:
    """Возвращает (date_label, time_str) по ISO datetime строке"""
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


def get_dates() -> tuple:
    """Возвращает (вчера, сегодня) в московском времени"""
    now_moscow = datetime.now(timezone.utc) + timedelta(hours=3)
    today = now_moscow.strftime("%Y-%m-%d")
    yesterday = (now_moscow - timedelta(days=1)).strftime("%Y-%m-%d")
    return yesterday, today


def fetch_football(league_id: int, league_name: str, api_key: str) -> list:
    yesterday, today = get_dates()
    base = SPORT_BASE_URLS["football"]
    results = []
    seen_ids = set()

    for date in [yesterday, today]:
        url = f"{base}/fixtures?league={league_id}&season=2025&date={date}"
        data = api_request(url, api_key)
        for fix in data.get("response", []):
            f = fix.get("fixture", {})
            fid = f"football_{f.get('id')}"
            if fid in seen_ids:
                continue
            seen_ids.add(fid)

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
                "id": fid,
                "home": teams.get("home", {}).get("name", "—"),
                "away": teams.get("away", {}).get("name", "—"),
                "scoreHome": goals.get("home"),
                "scoreAway": goals.get("away"),
                "status": status,
                "time": tm,
                "date": dl,
                "league": league_name,
                "sport": "⚽",
                "utcDate": f.get("date", ""),
            })
    return results


def fetch_other_sport(sport: str, league_id: int, league_name: str, emoji: str, api_key: str) -> list:
    yesterday, today = get_dates()
    base = SPORT_BASE_URLS[sport]
    results = []
    seen_ids = set()

    for date in [yesterday, today]:
        url = f"{base}/games?league={league_id}&season=2024-2025&date={date}"
        data = api_request(url, api_key)
        for game in data.get("response", []):
            gid = f"{sport}_{game.get('id')}"
            if gid in seen_ids:
                continue
            seen_ids.add(gid)

            teams = game.get("teams", {})
            scores = game.get("scores", {})
            status_raw = game.get("status", {}).get("short", "NS")
            status = STATUS_MAP.get(status_raw, "scheduled")

            home_score = None
            away_score = None
            if status in ("live", "finished"):
                home_score = scores.get("home", {}).get("total") if isinstance(scores.get("home"), dict) else scores.get("home")
                away_score = scores.get("away", {}).get("total") if isinstance(scores.get("away"), dict) else scores.get("away")

            date_str = game.get("date", "")
            dl, tm = date_label(date_str)
            if status == "finished":
                tm = "ФТ"
            elif status == "live":
                period = game.get("status", {}).get("long", "")
                tm = period[:6] if period else "LIVE"

            results.append({
                "id": gid,
                "home": teams.get("home", {}).get("name", "—"),
                "away": teams.get("away", {}).get("name", "—"),
                "scoreHome": home_score,
                "scoreAway": away_score,
                "status": status,
                "time": tm,
                "date": dl,
                "league": league_name,
                "sport": emoji,
                "utcDate": date_str,
            })
    return results


def handler(event: dict, context) -> dict:
    """Матчи российских лиг: РПЛ, ФНЛ, КХЛ, ВТБ, волейбол"""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    api_key = os.environ.get("APISPORT_KEY", "")
    if not api_key:
        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps({"matches": [], "error": "no_api_key"}),
        }

    all_matches = []

    for league in LEAGUES:
        sport = league["sport"]
        if sport == "football":
            matches = fetch_football(league["id"], league["name"], api_key)
        else:
            matches = fetch_other_sport(sport, league["id"], league["name"], league["emoji"], api_key)
        all_matches.extend(matches)

    def sort_key(m):
        order = {"live": 0, "scheduled": 1, "finished": 2, "postponed": 3}
        return (order.get(m["status"], 9), m.get("utcDate", ""))

    all_matches.sort(key=sort_key)

    return {
        "statusCode": 200,
        "headers": {**cors, "Content-Type": "application/json"},
        "body": json.dumps({"matches": all_matches}),
    }