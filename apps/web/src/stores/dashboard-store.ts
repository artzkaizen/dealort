import { create } from "zustand";

type AnalyticsDuration = "30 days" | "3 months" | "1 year";

interface DashboardState {
  analyticsDuration: AnalyticsDuration;
  setAnalyticsDuration: (option: AnalyticsDuration) => void;
  // user: {
  //   id: string;
  //   name: string;
  //   email: string;
  //   image: string,
  //   emailVerified: boolean;
  //   createdAt: string;
  //   updatedAt: string;
  // } | {};
}

export const useDashboardStore = create<DashboardState>((set) => ({
  analyticsDuration: "30 days",
  setAnalyticsDuration: (option) => set({ analyticsDuration: option }),

  // user: {},
  // setUser: (user: DashboardState['user']) => set({ user }),
}));

