import { apiGet } from "./client";

/**
 * GET /track-data — track outline + resampled per-driver positions.
 * `drivers` is an array of name_acronym strings, e.g. ["VER", "HAM"].
 */
export function getTrackData({
  year,
  country,
  sessionName = "Race",
  drivers,
  lapStart,
  lapEnd,
  resampleHz,
}) {
  return apiGet("/track-data", {
    year,
    country,
    session_name: sessionName,
    drivers,
    lap_start: lapStart,
    lap_end: lapEnd,
    resample_hz: resampleHz,
  });
}
