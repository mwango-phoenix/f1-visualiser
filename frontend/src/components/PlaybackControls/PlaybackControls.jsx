import { useTrackDataStore } from "../../store/useTrackDataStore";
import "./PlaybackControls.css";

const SPEEDS = [0.5, 1, 2, 4];

export default function PlaybackControls() {
  const { status, data, currentFrame, isPlaying, speed, togglePlay, setSpeed, setCurrentFrame } =
    useTrackDataStore();

  if (status !== "ready" || !data) return null;

  const { n_frames, resample_hz, lap_start, lap_end } = data;
  const elapsedSec = currentFrame / resample_hz;
  const totalSec = (n_frames - 1) / resample_hz;

  return (
    <div className="playback-controls">
      <button
        type="button"
        className="play-btn"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "❚❚" : "▶"}
      </button>

      <div className="scrub-wrap">
        <div className="scrub-strip">
          <input
            type="range"
            min={0}
            max={n_frames - 1}
            value={currentFrame}
            onChange={(e) => setCurrentFrame(Number(e.target.value))}
            aria-label="Scrub replay"
          />
          {/* Signature element: a telemetry-strip readout under the scrub
              handle, evoking an oscilloscope / timing-tower trace rather
              than a generic progress bar. */}
          <div className="strip-trace" aria-hidden="true">
            {Array.from({ length: 40 }).map((_, i) => (
              <span key={i} style={{ height: `${20 + Math.abs(Math.sin(i * 0.7)) * 60}%` }} />
            ))}
          </div>
        </div>
        <div className="scrub-readout mono-label">
          <span>
            LAP {lap_start}–{lap_end}
          </span>
          <span>
            {formatTime(elapsedSec)} / {formatTime(totalSec)}
          </span>
          <span>FRAME {currentFrame}/{n_frames - 1}</span>
        </div>
      </div>

      <div className="speed-group" role="group" aria-label="Playback speed">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            className={`speed-btn${speed === s ? " active" : ""}`}
            onClick={() => setSpeed(s)}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = (totalSeconds % 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
}
