import { useTrackDataStore } from "../../store/useTrackDataStore";
import "./DriverLegend.css";

export default function DriverLegend() {
  const { status, data, hiddenDrivers, toggleDriverVisibility } = useTrackDataStore();

  if (status !== "ready" || !data) return null;

  return (
    <div className="driver-legend">
      {data.drivers.map((d) => {
        const hidden = hiddenDrivers.has(d.driver_number);
        return (
          <button
            key={d.driver_number}
            type="button"
            className={`legend-item${hidden ? " hidden" : ""}`}
            style={{ "--driver-color": d.color }}
            onClick={() => toggleDriverVisibility(d.driver_number)}
            aria-pressed={!hidden}
          >
            <span className="swatch" />
            {d.name_acronym}
          </button>
        );
      })}
    </div>
  );
}
