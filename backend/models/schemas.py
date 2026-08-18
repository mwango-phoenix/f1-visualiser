from pydantic import BaseModel


# --- /sessions -----------------------------------------------------------

class SessionInfo(BaseModel):
    session_key: int
    session_name: str       # "Race", "Qualifying", etc.
    country_name: str
    year: int
    date_start: str


# --- /drivers ------------------------------------------------------------

class DriverInfo(BaseModel):
    driver_number: int
    name_acronym: str       # "VER", "HAM", etc.
    full_name: str
    team_name: str
    color: str


# --- /track-data ---------------------------------------------------------

class TrackPoint(BaseModel):
    x: float
    y: float


class DriverFrame(BaseModel):
    # Each driver gets a flat list of [x, y] pairs, one per frame.
    driver_number: int
    name_acronym: str
    color: str
    positions: list[TrackPoint]


class TrackDataResponse(BaseModel):
    session_key: int
    lap_start: int
    lap_end: int
    resample_hz: int
    n_frames: int
    # The track outline
    track: list[TrackPoint]
    # One entry per driver.
    drivers: list[DriverFrame]