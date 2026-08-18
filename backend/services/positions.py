# Fetches X/Y position telemetry from OpenF1 and resamples all drivers
# onto a shared time axis so every frame is in sync.

import numpy as np
import pandas as pd
from scipy.ndimage import uniform_filter1d
from fastapi import HTTPException
from services.openf1 import get_location

"""Convert OpenF1 (x, y) to screen (x, y) with correct map orientation."""
def _transform(x: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    return -y, x

"""
Fetches raw position data from OpenF1 for each driver within the time window.
Returns a dict of { driver_number: DataFrame(date, x, y) }.
"""
def fetch_raw_positions(
    session_key: int,
    driver_numbers: list[int],
    time_start: str,
    time_end: str,
) -> dict[int, pd.DataFrame]:

    raw_positions = {}

    for num in driver_numbers:
        data = get_location(
            session_key=session_key,
            driver_number=num,
            time_start=time_start,
            time_end=time_end,
        )
        if not data:
            print(f"Warning: no position data for driver {num}, skipping.")
            continue
        # Convert to DataFrame, drop duplicates, sort by time
        df = (
            pd.DataFrame(data)[["date", "x", "y"]]
            # overwrite date and convert to proper datetime object from UTC ISO string
            .assign(date=lambda d: pd.to_datetime(d["date"], utc=True))
            .drop_duplicates("date")
            .sort_values("date")
        )
        raw_positions[num] = df

    if not raw_positions:
        raise HTTPException(404, "No position data found for any driver in this window.")

    return raw_positions


"""
    Interpolates all drivers onto a shared, evenly-spaced time axis.
"""
def resample_positions(
    raw_positions: dict[int, pd.DataFrame],
    resample_hz: int,
) -> tuple[np.ndarray, dict[int, np.ndarray]]:

    # Find the overlapping time window across all drivers
    all_dates    = pd.concat([df["date"] for df in raw_positions.values()])
    common_start = all_dates.min()
    common_end   = all_dates.max()

    n_frames    = max(int((common_end - common_start).total_seconds() * resample_hz), 2)

    timeline_ns = np.linspace(
        common_start.as_unit("ns").value,
        common_end.as_unit("ns").value,
        n_frames,
        dtype=np.int64,
    )

    resampled = {}
    for num, df in raw_positions.items():
        ts = df["date"].dt.as_unit("ns").astype("int64").to_numpy()

        interp_x = np.interp(timeline_ns, ts, df["x"].to_numpy())
        interp_y = np.interp(timeline_ns, ts, df["y"].to_numpy())

        screen_x, screen_y = _transform(interp_x, interp_y)
        resampled[num] = np.column_stack([screen_x, screen_y])

    return timeline_ns, resampled

"""
    Uses the driver with the most samples as the track reference.
"""
def build_track_outline(
    raw_positions: dict[int, pd.DataFrame],
    smooth_window: int = 5,
) -> tuple[np.ndarray, np.ndarray]:
    
    ref  = max(raw_positions, key=lambda n: len(raw_positions[n]))
    track_df = raw_positions[ref]

    raw_x = track_df["x"].to_numpy()
    raw_y = track_df["y"].to_numpy()

    # Smooth before transforming so we don't amplify jitter
    smooth_x = uniform_filter1d(raw_x, size=smooth_window)
    smooth_y = uniform_filter1d(raw_y, size=smooth_window)

    return _transform(smooth_x, smooth_y)