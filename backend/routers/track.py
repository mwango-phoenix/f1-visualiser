from fastapi import APIRouter, Query
from models.schemas import SessionInfo, DriverInfo, TrackDataResponse, TrackPoint, DriverFrame
from services.openf1 import get_sessions, get_drivers, resolve_session_key, resolve_drivers, _driver_color
from services.laps import resolve_time_window
from services.positions import fetch_raw_positions, resample_positions, build_track_outline
from config import DEFAULT_RESAMPLE_HZ
 
router = APIRouter()
 


@router.get("/sessions", response_model=list[SessionInfo])
def sessions(
    year: int = Query(...),
    country: str | None = Query(None),
    session_name: str | None = Query(None),
):
    params = {"year": year}
    if country:
        params["country_name"] = country
    if session_name:
        params["session_name"] = session_name
    raw = get_sessions(**params)
    return [
        SessionInfo(
            session_key=  s["session_key"],
            session_name= s["session_name"],
            country_name= s["country_name"],
            year=         s["year"],
            date_start=   s["date_start"],
        )
        for s in raw
    ]


@router.get("/drivers", response_model=list[DriverInfo])
def drivers(
    session_key: int = Query(...),
):
    raw = get_drivers(session_key=session_key)
    return [
        DriverInfo(
            driver_number= int(d["driver_number"]),
            name_acronym=  d.get("name_acronym", ""),
            full_name=     d.get("full_name", ""),
            team_name=     d.get("team_name", ""),
            color=         _driver_color(d, i),
        )
        for i, d in enumerate(raw)
    ]

@router.get("/track-data", response_model=TrackDataResponse)
def get_track_data(
    year:         int       = Query(...),
    country:      str       = Query(...),
    session_name: str       = Query("Race"),
    drivers:      list[str] = Query(...),
    lap_start:    int       = Query(1),
    lap_end:      int       = Query(3),
    resample_hz:  int       = Query(DEFAULT_RESAMPLE_HZ),
):
    session_key = resolve_session_key(year, country, session_name)
    driver_meta = resolve_drivers(session_key, drivers)
    driver_numbers = list(driver_meta.keys())

    time_start, time_end = resolve_time_window(
        session_key, driver_numbers[0], lap_start, lap_end
    )

    raw_positions = fetch_raw_positions(session_key, driver_numbers, time_start, time_end)
    _, resampled = resample_positions(raw_positions, resample_hz)
    track_x, track_y = build_track_outline(raw_positions)

    # get frame count
    n_frames = len(next(iter(resampled.values())))

    return TrackDataResponse(
        session_key= session_key,
        lap_start = lap_start,
        lap_end = lap_end,
        resample_hz = resample_hz,
        n_frames = n_frames,
        track = [TrackPoint(x=float(x), y=float(y)) for x, y in zip(track_x, track_y)],
        drivers = [
            DriverFrame(
                driver_number= num,
                name_acronym=  driver_meta[num]["name"],
                color=         driver_meta[num]["color"],
                positions=     [TrackPoint(x=float(x), y=float(y)) for x, y in positions],
            )
            for num, positions in resampled.items()
        ],
    )