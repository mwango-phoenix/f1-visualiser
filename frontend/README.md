# Trackside — F1 Telemetry Replay (frontend)

React + Vite frontend for the F1 Track Visualizer API.

## Setup

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies any request to
`/api/*` through to `http://localhost:8000` (your FastAPI backend — adjust
the target in `vite.config.js` if it runs elsewhere). Run the backend with
`uvicorn main:app --reload` alongside this.

For a production build, set `VITE_API_BASE_URL` to your deployed API's
origin (e.g. in a `.env` file) and run `npm run build`.

## Flow

1. **Race** — pick a year, then a Grand Prix (country) and session, sourced
   from `GET /sessions`.
2. **Drivers** — multi-select chips from `GET /drivers?session_key=`.
3. **Laps** — a from/to lap range, then "Visualize" calls
   `GET /track-data` with everything selected.
4. **Replay** — the response (track outline + resampled per-driver
   positions) is drawn on a `<canvas>` and animated with
   `requestAnimationFrame`, synced to real time using the response's
   `resample_hz`. Play/pause, scrub, and speed controls live in the bottom
   strip; the legend at the top of the canvas toggles individual drivers
   on/off without refetching.

## Structure

```
src/
  api/            fetch wrappers per endpoint, shared error handling
  store/          zustand stores: selections vs. fetched data/playback
  components/     one folder per UI piece, colocated CSS
  App.jsx         layout: control rail + canvas panel
```

## Notes / next steps

- No caching layer yet — switching years/sessions refetches `/sessions` and
  `/drivers` each time. Worth adding a simple in-memory cache keyed by
  year/session_key if that becomes noticeable.
- Lap range isn't validated against a real max — the backend's 404 message
  ("Driver X has no data for laps...") is surfaced as-is in the UI.
- URL query params for shareable replays would be a nice follow-up.
