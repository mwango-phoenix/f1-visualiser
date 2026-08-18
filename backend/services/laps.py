# Figures out the real-world time window for lap range.
from fastapi import HTTPException
from config import FALLBACK_LAP_DURATION_SECONDS
from services.openf1 import get_laps
import pandas as pd

"""
Returns (time_start, time_end) covering lap_start → lap_end for given driver.
    - time_start = date_start of lap_start
    - time_end   = date_start of lap_end+1 (the moment the next lap begins)
    - If lap_end+1 doesn't exist, fall back to time_start + (n_laps * lap_duration).
"""
def resolve_time_window(
    session_key: int,
    driver_number: int,
    lap_start: int,
    lap_end: int,
) -> tuple[str, str]:
    raw = get_laps(session_key=session_key, driver_number=driver_number)
    if not raw:
        raise HTTPException(404, f"No lap data found for driver {driver_number}")

    df = pd.DataFrame(raw)

    laps_in_range = (
        df[df["lap_number"].between(lap_start, lap_end)]
        .sort_values("lap_number")
    )

    if laps_in_range.empty:
        raise HTTPException(
            404,
            f"Driver {driver_number} has no data for laps {lap_start}–{lap_end}. "
            "They may have retired or not participated."
        )

    time_start = laps_in_range.iloc[0]["date_start"]

    # Try to use the start of the next lap as a clean boundary
    next_lap = df[df["lap_number"] == lap_end + 1]
    if not next_lap.empty:
        time_end = next_lap.iloc[0]["date_start"]
    else:
        # Fallback: estimate end time from lap duration
        last_lap = laps_in_range.iloc[-1]
        duration = float(last_lap.get("lap_duration") or FALLBACK_LAP_DURATION_SECONDS)
        n_laps   = lap_end - lap_start + 1
        time_end = (
            pd.Timestamp(time_start) + pd.Timedelta(seconds=duration * n_laps)
        ).isoformat()

    return time_start, time_end