"""
Получение футбольных матчей через football-data.org API.
Возвращает матчи сегодня и ближайшие запланированные. v2
"""
import os
import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone


BASE_URL = "https://api.football-data.org/v4"

# Бесплатные лиги на football-data.org (Tier 1)
FREE_COMPETITIONS = [
    {"code": "PL", "name": "Премьер-лига", "country": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 АПЛ"},
    {"code": "CL", "name": "Лига чемпионов", "country": "🇪🇺 ЛЧ"},
    {"code": "PD", "name": "Ла Лига", "country": "🇪🇸 Испания"},
    {"code": "BL1", "name": "Бундеслига", "country": "🇩🇪 Германия"},
    {"code": "SA", "name": "Серия А", "country": "🇮🇹 Италия"},
    {"code": "FL1", "name": "Лига 1", "country": "🇫🇷 Франция"},
    {"code": "EC", "name": "Евро", "country": "🇪🇺 УЕФА"},
]

STATUS_MAP = {
    "SCHEDULED": "scheduled",
    "TIMED": "scheduled",
    "IN_PLAY": "live",
    "PAUSED": "live",
    "FINISHED": "finished",
    "POSTPONED": "postponed",
    "SUSPENDED": "postponed",
    "CANCELLED": "postponed",
}


def fetch_matches(competition_code: str, api_key: str) -> list:
    today = datetime.now(timezone.utc)
    date_from = today.strftime("%Y-%m-%d")
    date_to = (today + timedelta(days=3)).strftime("%Y-%m-%d")

    url = f"{BASE_URL}/competitions/{competition_code}/matches?dateFrom={date_from}&dateTo={date_to}&status=SCHEDULED,IN_PLAY,PAUSED,FINISHED"

    req = urllib.request.Request(url, headers={"X-Auth-Token": api_key})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode())
            return data.get("matches", [])
    except urllib.error.HTTPError as e:
        if e.code == 429:
            return []
        return []
    except Exception:
        return []


def format_match(match: dict, league_display: str) -> dict:
    status_raw = match.get("status", "SCHEDULED")
    status = STATUS_MAP.get(status_raw, "scheduled")

    score = match.get("score", {})
    full = score.get("fullTime", {})
    current = score.get("regularTime", {}) or score.get("extraTime", {}) or full

    home_score = None
    away_score = None

    if status == "finished":
        home_score = full.get("home")
        away_score = full.get("away")
    elif status == "live":
        home_score = current.get("home") if current else None
        away_score = current.get("away") if current else None

    # Time display
    utc_date = match.get("utcDate", "")
    time_display = ""
    if utc_date:
        try:
            dt = datetime.fromisoformat(utc_date.replace("Z", "+00:00"))
            moscow_dt = dt + timedelta(hours=3)
            if status == "scheduled":
                time_display = moscow_dt.strftime("%H:%M")
            elif status == "live":
                time_display = "LIVE"
            elif status == "finished":
                time_display = "ФТ"
        except Exception:
            time_display = ""

    # Date label
    date_label = "Сегодня"
    if utc_date:
        try:
            dt = datetime.fromisoformat(utc_date.replace("Z", "+00:00"))
            moscow_dt = dt + timedelta(hours=3)
            today_moscow = datetime.now(timezone.utc) + timedelta(hours=3)
            delta = (moscow_dt.date() - today_moscow.date()).days
            if delta == 0:
                date_label = "Сегодня"
            elif delta == 1:
                date_label = "Завтра"
            else:
                months = ["янв", "фев", "мар", "апр", "май", "июн",
                          "июл", "авг", "сен", "окт", "ноя", "дек"]
                date_label = f"{moscow_dt.day} {months[moscow_dt.month - 1]}"
        except Exception:
            pass

    return {
        "id": match.get("id"),
        "home": match.get("homeTeam", {}).get("shortName") or match.get("homeTeam", {}).get("name", "—"),
        "away": match.get("awayTeam", {}).get("shortName") or match.get("awayTeam", {}).get("name", "—"),
        "scoreHome": home_score,
        "scoreAway": away_score,
        "status": status,
        "time": time_display,
        "date": date_label,
        "league": league_display,
        "sport": "⚽",
        "utcDate": utc_date,
    }


def handler(event: dict, context) -> dict:
    """Получение актуальных футбольных матчей из football-data.org"""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    api_key = os.environ.get("FOOTBALL_API_KEY", "")
    if not api_key:
        return {
            "statusCode": 200,
            "headers": {**cors, "Content-Type": "application/json"},
            "body": json.dumps({"matches": [], "error": "no_api_key"}),
        }

    all_matches = []

    for comp in FREE_COMPETITIONS:
        raw = fetch_matches(comp["code"], api_key)
        for m in raw:
            all_matches.append(format_match(m, comp["country"]))

    # Sort: live first, then by utcDate
    def sort_key(m):
        order = {"live": 0, "scheduled": 1, "finished": 2, "postponed": 3}
        return (order.get(m["status"], 9), m.get("utcDate", ""))

    all_matches.sort(key=sort_key)

    return {
        "statusCode": 200,
        "headers": {**cors, "Content-Type": "application/json"},
        "body": json.dumps({"matches": all_matches[:60]}),
    }