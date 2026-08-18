import RaceSelector from "./components/RaceSelector/RaceSelector";
import DriverSelector from "./components/DriverSelector/DriverSelector";
import DriverLegend from "./components/DriverSelector/DriverLegend";
import LapRangeSelector from "./components/LapRangeSelector/LapRangeSelector";
import TrackCanvas from "./components/TrackCanvas/TrackCanvas";
import PlaybackControls from "./components/PlaybackControls/PlaybackControls";
import "./App.css";

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-mark">▲</span>
        <h1>TRACKSIDE</h1>
        <span className="mono-label header-sub">Telemetry Replay</span>
      </header>

      <div className="app-body">
        <aside className="control-rail">
          <section className="panel">
            <h2 className="panel-title mono-label">01 — Race</h2>
            <RaceSelector />
          </section>

          <section className="panel">
            <h2 className="panel-title mono-label">02 — Drivers</h2>
            <DriverSelector />
          </section>

          <section className="panel">
            <h2 className="panel-title mono-label">03 — Laps</h2>
            <LapRangeSelector />
          </section>
        </aside>

        <main className="canvas-panel">
          <DriverLegend />
          <div className="canvas-area">
            <TrackCanvas />
          </div>
          <PlaybackControls />
        </main>
      </div>
    </div>
  );
}
