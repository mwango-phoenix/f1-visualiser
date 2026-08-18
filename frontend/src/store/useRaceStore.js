import { create } from "zustand";

const currentYear = new Date().getFullYear();

export const useRaceStore = create((set) => ({
  year: currentYear,
  country: null,
  sessionKey: null,
  sessionName: "Race",

  sessions: [],
  driversAvailable: [],
  selectedDrivers: [], // array of name_acronym strings

  lapStart: 1,
  lapEnd: 3,

  setYear: (year) => set({ year, country: null, sessionKey: null, sessions: [] }),
  setSessions: (sessions) => set({ sessions }),
  setCountry: (country) => set({ country, sessionKey: null }),
  setSession: (sessionKey, sessionName) => set({ sessionKey, sessionName, selectedDrivers: [] }),

  setDriversAvailable: (driversAvailable) => set({ driversAvailable }),
  toggleDriver: (acronym) =>
    set((state) => ({
      selectedDrivers: state.selectedDrivers.includes(acronym)
        ? state.selectedDrivers.filter((d) => d !== acronym)
        : [...state.selectedDrivers, acronym],
    })),

  setLapRange: (lapStart, lapEnd) => set({ lapStart, lapEnd }),
}));
