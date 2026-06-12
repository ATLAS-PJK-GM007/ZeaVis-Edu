import { create } from "zustand";

type UiState = {
  dashboardCompact: boolean;
  toggleDashboardCompact: () => void;

  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  dashboardCompact: false,
  toggleDashboardCompact: () =>
    set((state) => ({ dashboardCompact: !state.dashboardCompact })),

  isSidebarOpen: false,
  setIsSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
}));
