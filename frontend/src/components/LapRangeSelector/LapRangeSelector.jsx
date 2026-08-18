import { useRaceStore } from "../../store/useRaceStore";
import { useTrackDataStore } from "../../store/useTrackDataStore";
import { DEFAULT_RESAMPLE_HZ } from "../../config";
import "./LapRangeSelector.css";

export default function LapRangeSelector() {
  const { year, country, sessionName, sessionKey, selectedDrivers, lapStart, lapEnd, setLapRange } =
    useRaceStore();
  const { status, fetchTrackData } = useTrackDataStore();

  const canVisualize = sessionKey && selectedDrivers.length > 0 && lapStart > 0 && lapEnd >= lapStart;
  const isLoading = status === "loading";

  const handleVisualize = () => {
    if (!canVisualize) return;
    fetchTrackData({
      year,
      country,
      sessionName,
      drivers: selectedDrivers,
      lapStart,
      lapEnd,
      resampleHz: DEFAULT_RESAMPLE_HZ,
    });
  };

  return (
    <div className="lap-range-selector">
      <div className="lap-inputs">
        <div className="field">
          <label className="mono-label" htmlFor="lap-start">
            From lap
          </label>
          <input
            id="lap-start"
            type="number"
            min={1}
            value={lapStart}
            onChange={(e) => setLapRange(Number(e.target.value), lapEnd)}
          />
        </div>
        <div className="field">
          <label className="mono-label" htmlFor="lap-end">
            To lap
          </label>
          <input
            id="lap-end"
            type="number"
            min={lapStart}
            value={lapEnd}
            onChange={(e) => setLapRange(lapStart, Number(e.target.value))}
          />
        </div>
      </div>

      <button
        type="button"
        className="visualize-btn"
        disabled={!canVisualize || isLoading}
        onClick={handleVisualize}
      >
        {isLoading ? "Fetching telemetry…" : "Visualize"}
      </button>

      {!selectedDrivers.length && sessionKey && (
        <p className="mono-label hint">Select at least one driver</p>
      )}
    </div>
  );
}
