import { useEffect, useRef } from "react";
import { useTrackDataStore } from "../../store/useTrackDataStore";
import "./TrackCanvas.css";

const TRAIL_LENGTH = 18; // frames of fading ghost trail per driver
const DOT_RADIUS = 5;

// Shared by the resize handler and the data-load effect so `fitRef` is
// always recomputed from whatever (canvas size, track data) is current,
// instead of only reacting to one of the two.
function computeFit(canvas, track, dpr) {
  if (!track || !track.length) return null;

  const xs = track.map((p) => p.x);
  const ys = track.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const padding = 40;
  const w = canvas.width / dpr - padding * 2;
  const h = canvas.height / dpr - padding * 2;
  const dataW = maxX - minX || 1;
  const dataH = maxY - minY || 1;
  const scale = Math.min(w / dataW, h / dataH);

  const offsetX = padding + (w - dataW * scale) / 2 - minX * scale;
  const offsetY = padding + (h - dataH * scale) / 2 - minY * scale;

  return { toPixel: (x, y) => [x * scale + offsetX, y * scale + offsetY] };
}

export default function TrackCanvas() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const lastTickRef = useRef(null);

  const status = useTrackDataStore((s) => s.status);
  const data = useTrackDataStore((s) => s.data);

  const store = useTrackDataStore;

  const fitRef = useRef(null);

  // Resize canvas to fill its container, and recompute the fit using
  // whatever track data currently exists (if any) — resizing must never
  // leave fitRef stale or null while data is loaded.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const currentData = store.getState().data;
      fitRef.current = currentData ? computeFit(canvas, currentData.track, dpr) : null;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [store]);

  // Recompute fit whenever new track data arrives (canvas size unchanged).
  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    fitRef.current = computeFit(canvas, data.track, dpr);
  }, [data]);

  // The draw + animation loop
  useEffect(() => {
    if (!data) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function drawTrack() {
      const fit = fitRef.current;
      if (!fit) return;
      ctx.beginPath();
      data.track.forEach((p, i) => {
        const [x, y] = fit.toPixel(p.x, p.y);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      // Two-pass "racing line" stroke
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#333333";
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(233, 231, 225, 0.7)";
      ctx.stroke();
    }

    function drawDrivers(frame) {
      const fit = fitRef.current;
      if (!fit) return;
      const { hiddenDrivers } = store.getState();

      for (const driver of data.drivers) {
        if (hiddenDrivers.has(driver.driver_number)) continue;
        const positions = driver.positions;
        if (!positions.length) continue;
        const idx = Math.min(frame, positions.length - 1);

        const trailStart = Math.max(0, idx - TRAIL_LENGTH);
        if (idx > trailStart) {
          ctx.beginPath();
          for (let i = trailStart; i <= idx; i++) {
            const [tx, ty] = fit.toPixel(positions[i].x, positions[i].y);
            if (i === trailStart) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
          }
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.lineWidth = 3;
          ctx.strokeStyle = hexToRgba(driver.color, 0.35);
          ctx.stroke();
        }

        // Current position + label
        const [x, y] = fit.toPixel(positions[idx].x, positions[idx].y);
        ctx.beginPath();
        ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = driver.color;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#0b0d10";
        ctx.stroke();

        ctx.font = "700 11px 'JetBrains Mono', monospace";
        ctx.fillStyle = "#e9e7e1";
        ctx.fillText(driver.name_acronym, x + DOT_RADIUS + 4, y + 4);
      }
    }

    function render() {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      drawTrack();
      drawDrivers(store.getState().currentFrame);
    }

    function tick(timestamp) {
      const state = store.getState();
      if (state.isPlaying && state.data) {
        if (lastTickRef.current == null) lastTickRef.current = timestamp;
        const elapsedSec = (timestamp - lastTickRef.current) / 1000;
        const hz = state.data.resample_hz || 10;
        const framesToAdvance = elapsedSec * hz * state.speed;

        if (framesToAdvance >= 1) {
          const nextFrame = state.currentFrame + Math.floor(framesToAdvance);
          lastTickRef.current = timestamp;
          if (nextFrame >= state.data.n_frames - 1) {
            store.setState({ currentFrame: state.data.n_frames - 1, isPlaying: false });
          } else {
            store.setState({ currentFrame: nextFrame });
          }
        }
      } else {
        lastTickRef.current = null;
      }
      render();
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [data, store]);

  // The canvas stays mounted across every status so canvasRef/containerRef
  // are non-null on first render.
  const error = useTrackDataStore((s) => s.error);

  return (
    <div className="track-canvas-container" ref={containerRef}>
      <canvas ref={canvasRef} />
      {status === "idle" && (
        <div className="track-canvas-overlay">
          <p className="mono-label">No replay loaded</p>
          <p className="empty-copy">Pick a race, drivers, and a lap range, then hit Visualize.</p>
        </div>
      )}
      {status === "loading" && (
        <div className="track-canvas-overlay">
          <p className="mono-label pulse">Pulling telemetry from the pit wall…</p>
        </div>
      )}
      {status === "error" && (
        <div className="track-canvas-overlay">
          <p className="mono-label" style={{ color: "var(--c-flag-red)" }}>
            Replay failed
          </p>
          <p className="empty-copy">{error}</p>
        </div>
      )}
    </div>
  );
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}