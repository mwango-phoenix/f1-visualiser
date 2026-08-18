import { create } from "zustand";
import { getTrackData } from "../api/trackData";
import { ApiError } from "../api/client";

export const useTrackDataStore = create((set, get) => ({
  status: "idle", // idle | loading | ready | error
  error: null,
  data: null, // raw TrackDataResponse from the API

  // Playback state
  currentFrame: 0,
  isPlaying: false,
  speed: 1,
  hiddenDrivers: new Set(), // driver_numbers toggled off in the legend

  async fetchTrackData({ year, country, sessionName, drivers, lapStart, lapEnd, resampleHz }) {
    set({ status: "loading", error: null, isPlaying: false, currentFrame: 0 });
    try {
      const data = await getTrackData({
        year,
        country,
        sessionName,
        drivers,
        lapStart,
        lapEnd,
        resampleHz,
      });
      set({ status: "ready", data, hiddenDrivers: new Set() });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong fetching the replay.";
      set({ status: "error", error: message });
    }
  },

  reset: () => set({ status: "idle", error: null, data: null, currentFrame: 0, isPlaying: false }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSpeed: (speed) => set({ speed }),
  setCurrentFrame: (frame) => {
    const total = get().data?.n_frames ?? 1;
    const clamped = Math.max(0, Math.min(frame, total - 1));
    set({ currentFrame: clamped });
  },
  toggleDriverVisibility: (driverNumber) =>
    set((state) => {
      const next = new Set(state.hiddenDrivers);
      if (next.has(driverNumber)) next.delete(driverNumber);
      else next.add(driverNumber);
      return { hiddenDrivers: next };
    }),
}));

// TEMP debug hook — lets you inspect store state from the browser console
// via `window.__trackStore.getState()`. Remove before shipping.
if (typeof window !== "undefined") {
  window.__trackStore = useTrackDataStore;
}