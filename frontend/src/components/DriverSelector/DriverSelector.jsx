import { useEffect, useState } from "react";
import { useRaceStore } from "../../store/useRaceStore";
import { getDrivers } from "../../api/races";
import { ApiError } from "../../api/client";
import "./DriverSelector.css";

export default function DriverSelector() {
  const { sessionKey, driversAvailable, setDriversAvailable, selectedDrivers, toggleDriver } =
    useRaceStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionKey) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDrivers(sessionKey)
      .then((data) => {
        if (!cancelled) setDriversAvailable(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't load drivers.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionKey, setDriversAvailable]);

  if (!sessionKey) {
    return <p className="mono-label empty-hint">Pick a session to see the lineup</p>;
  }

  if (loading) {
    return <p className="mono-label empty-hint">Loading lineup…</p>;
  }

  if (error) {
    return <p className="field-error">{error}</p>;
  }

  return (
    <div className="driver-selector">
      {driversAvailable.map((d) => {
        const active = selectedDrivers.includes(d.name_acronym);
        return (
          <button
            key={d.driver_number}
            type="button"
            className={`driver-chip${active ? " active" : ""}`}
            style={{ "--driver-color": d.color }}
            onClick={() => toggleDriver(d.name_acronym)}
            aria-pressed={active}
            title={`${d.full_name} — ${d.team_name}`}
          >
            <span className="swatch" />
            {d.name_acronym}
          </button>
        );
      })}
    </div>
  );
}
