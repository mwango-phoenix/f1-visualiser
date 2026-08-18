import { useEffect, useState } from "react";
import { useRaceStore } from "../../store/useRaceStore";
import { getSessions } from "../../api/races";
import { ApiError } from "../../api/client";
import "./RaceSelector.css";

export default function RaceSelector() {
  const { year, setYear, sessions, setSessions, country, setCountry, sessionKey, setSession } =
    useRaceStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all sessions for the year whenever it changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSessions(year)
      .then((data) => {
        if (!cancelled) setSessions(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load sessions.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year, setSessions]);

  const countries = [...new Set(sessions.map((s) => s.country_name))].sort();
  const sessionsForCountry = sessions.filter((s) => s.country_name === country);

  return (
    <div className="race-selector">
      <div className="field">
        <label className="mono-label" htmlFor="year-input">
          Year
        </label>
        <input
          id="year-input"
          type="number"
          value={year}
          min={1950}
          max={new Date().getFullYear()}
          onChange={(e) => setYear(Number(e.target.value))}
        />
      </div>

      <div className="field">
        <label className="mono-label" htmlFor="country-select">
          Grand Prix
        </label>
        <select
          id="country-select"
          value={country ?? ""}
          disabled={loading || countries.length === 0}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="" disabled>
            {loading ? "Loading…" : "Select a country"}
          </option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="mono-label" htmlFor="session-select">
          Session
        </label>
        <select
          id="session-select"
          value={sessionKey ?? ""}
          disabled={!country}
          onChange={(e) => {
            const s = sessionsForCountry.find((s) => String(s.session_key) === e.target.value);
            if (s) setSession(s.session_key, s.session_name);
          }}
        >
          <option value="" disabled>
            {country ? "Select a session" : "Pick a Grand Prix first"}
          </option>
          {sessionsForCountry.map((s) => (
            <option key={s.session_key} value={s.session_key}>
              {s.session_name} — {s.date_start?.slice(0, 10)}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
