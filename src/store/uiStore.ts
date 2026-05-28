import { create } from "zustand";

type UiState = {
  leftSidebarVisible: boolean;
  toggleLeftSidebar: () => void;
  setLeftSidebarVisible: (v: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  leftSidebarVisible: true,
  toggleLeftSidebar: () =>
    set((s) => ({ leftSidebarVisible: !s.leftSidebarVisible })),
  setLeftSidebarVisible: (v) => set({ leftSidebarVisible: v }),
}));
