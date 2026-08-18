import { apiGet } from "./client";

/** GET /sessions — list of races/sessions for a given year (optionally filtered by country). */
export function getSessions(year, country) {
  return apiGet("/sessions", { year, country });
}

/** GET /drivers — drivers who took part in a given session. */
export function getDrivers(sessionKey) {
  return apiGet("/drivers", { session_key: sessionKey });
}
