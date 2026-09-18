import requests
from fastapi import HTTPException
from config import OPENF1_BASE_URL, FALLBACK_COLORS


def _fetch(endpoint: str, **params) -> list[dict]:
    url = f"{OPENF1_BASE_URL}/{endpoint}"
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        return r.json()
    except requests.Timeout:
        raise HTTPException(504, f"OpenF1 timed out fetching /{endpoint}")
    except requests.HTTPError as e:
        raise HTTPException(502, f"OpenF1 error: {e}")


def get_sessions(**params):  return _fetch("sessions",  **params)
def get_drivers(**params):   return _fetch("drivers",   **params)
def get_laps(**params):      return _fetch("laps",      **params)

def get_location(session_key, driver_number, time_start, time_end):
    try:
        r = requests.get(
            f"{OPENF1_BASE_URL}/location",
            params={
                "session_key": session_key,
                "driver_number": driver_number,
                "date>": time_start,
                "date<": time_end,
            },
            timeout=30,
        )
        r.raise_for_status()
        return r.json()
    except requests.Timeout:
        raise HTTPException(504, "OpenF1 timed out fetching /location")
    except requests.HTTPError as e:
        status = e.response.status_code if e.response is not None else 502
        if status == 429:
            raise HTTPException(
                503,
                "OpenF1 rate limit reached while fetching location data. Try again shortly.",
            )
        raise HTTPException(502, f"OpenF1 error fetching /location: {e}")

# ---------------------------------------------------------------------------
# Domain helpers
# ---------------------------------------------------------------------------

def _driver_color(d: dict, index: int) -> str:
    raw = d.get("team_colour")
    return f"#{raw}" if raw else FALLBACK_COLORS[index % len(FALLBACK_COLORS)]


def resolve_session_key(year: int, country: str, session_name: str) -> int:
    results = get_sessions(year=year, country_name=country, session_name=session_name)
    if not results:
        raise HTTPException(404, f"No session: {year} {country} {session_name}")
    return int(results[0]["session_key"])


def resolve_drivers(session_key: int, acronyms: list[str]) -> dict[int, dict]:
    """
    One API call for all drivers in the session; filter in Python.
    Returns {driver_number: {name, full_name, team, color}}.
    """
    all_drivers = get_drivers(session_key=session_key)
    by_acronym  = {d["name_acronym"]: d for d in all_drivers}

    meta = {}
    for i, acr in enumerate(acronyms):
        d = by_acronym.get(acr)
        if not d:
            print(f"Warning: '{acr}' not found in session, skipping.")
            continue
        meta[int(d["driver_number"])] = {
            "name":      acr,
            "full_name": d.get("full_name", acr),
            "team":      d.get("team_name", ""),
            "color":     _driver_color(d, i),
        }

    if not meta:
        raise HTTPException(404, "None of the requested drivers were found.")
    return meta