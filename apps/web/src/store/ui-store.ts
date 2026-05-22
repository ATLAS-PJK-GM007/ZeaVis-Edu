import { create } from 'zustand';

type UiState = {
  dashboardCompact: boolean;
  toggleDashboardCompact: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  dashboardCompact: false,
  toggleDashboardCompact: () =>
    set((state) => ({ dashboardCompact: !state.dashboardCompact })),
}));
