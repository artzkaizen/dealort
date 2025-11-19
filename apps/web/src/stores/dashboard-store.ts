import { create } from "zustand";

type AnalyticsDuration = "30 days" | "3 months" | "1 year";

interface DashboardState {
  analyticsDuration: AnalyticsDuration;
  setAnalyticsDuration: (option: AnalyticsDuration) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  analyticsDuration: "30 days",
  setAnalyticsDuration: (option) => set({ analyticsDuration: option }),
}));
