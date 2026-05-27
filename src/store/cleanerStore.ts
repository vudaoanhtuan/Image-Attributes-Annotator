import { create } from "zustand";
import {
  api,
  type DeleteReport,
  type MoveReport,
} from "@/lib/tauri";
import {
  EMPTY_CLEANER_FILTER_STATE,
  buildCleanerPredicate,
  type CleanerFilterState,
} from "@/features/cleaner/filter";
import { useDatasetStore } from "./datasetStore";

export type CleanerReport =
  | { kind: "delete"; report: DeleteReport }
  | { kind: "move"; report: MoveReport };

type CleanerState = {
  filters: CleanerFilterState;
  filteredIndices: number[];
  selectedSet: Set<string>;
  lastClickedIndex: number | null;
  busy: boolean;
  lastReport: CleanerReport | null;

  recompute: () => void;
  resetOnDatasetChange: () => void;
  setFilters: (f: CleanerFilterState) => void;
  toggleSelected: (
    name: string,
    index: number,
    opts: { range?: boolean },
  ) => void;
  selectAllFiltered: () => void;
  deselectAllFiltered: () => void;
  clearSelection: () => void;
  applyDelete: () => Promise<DeleteReport | null>;
  applyMove: (destSubdir: string) => Promise<MoveReport | null>;
  dismissReport: () => void;
};

function compute(filters: CleanerFilterState): number[] {
  const { images, labels, config } = useDatasetStore.getState();
  const pred = buildCleanerPredicate(filters, labels, config);
  const out: number[] = [];
  for (let i = 0; i < images.length; i++) {
    if (pred(images[i])) out.push(i);
  }
  return out;
}

export const useCleanerStore = create<CleanerState>((set, get) => ({
  filters: EMPTY_CLEANER_FILTER_STATE,
  filteredIndices: [],
  selectedSet: new Set(),
  lastClickedIndex: null,
  busy: false,
  lastReport: null,

  recompute: () => {
    set({ filteredIndices: compute(get().filters) });
  },

  resetOnDatasetChange: () => {
    set({
      filters: EMPTY_CLEANER_FILTER_STATE,
      filteredIndices: [],
      selectedSet: new Set(),
      lastClickedIndex: null,
      busy: false,
      lastReport: null,
    });
    get().recompute();
  },

  setFilters: (filters) => {
    set({ filters, filteredIndices: compute(filters) });
  },

  toggleSelected: (name, index, opts) => {
    const { selectedSet, lastClickedIndex, filteredIndices } = get();
    const next = new Set(selectedSet);

    if (opts.range && lastClickedIndex !== null) {
      const a = filteredIndices.indexOf(lastClickedIndex);
      const b = filteredIndices.indexOf(index);
      if (a >= 0 && b >= 0) {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        const images = useDatasetStore.getState().images;
        for (let k = lo; k <= hi; k++) {
          next.add(images[filteredIndices[k]]);
        }
        set({ selectedSet: next, lastClickedIndex: index });
        return;
      }
    }

    if (next.has(name)) next.delete(name);
    else next.add(name);
    set({ selectedSet: next, lastClickedIndex: index });
  },

  selectAllFiltered: () => {
    const { filteredIndices, selectedSet } = get();
    const images = useDatasetStore.getState().images;
    const next = new Set(selectedSet);
    for (const i of filteredIndices) next.add(images[i]);
    set({ selectedSet: next });
  },

  deselectAllFiltered: () => {
    const { filteredIndices, selectedSet } = get();
    const images = useDatasetStore.getState().images;
    const next = new Set(selectedSet);
    for (const i of filteredIndices) next.delete(images[i]);
    set({ selectedSet: next });
  },

  clearSelection: () => {
    set({ selectedSet: new Set(), lastClickedIndex: null });
  },

  applyDelete: async () => {
    const { selectedSet } = get();
    const path = useDatasetStore.getState().path;
    if (!path || selectedSet.size === 0) return null;
    set({ busy: true });
    try {
      const names = Array.from(selectedSet);
      const report = await api.deleteImages(path, names);
      useDatasetStore.getState().removeImages(report.moved);
      set({
        selectedSet: new Set(),
        busy: false,
        lastReport: { kind: "delete", report },
      });
      return report;
    } catch (e) {
      console.error("delete_images failed", e);
      set({ busy: false });
      throw e;
    }
  },

  applyMove: async (destSubdir) => {
    const { selectedSet } = get();
    const path = useDatasetStore.getState().path;
    if (!path || selectedSet.size === 0) return null;
    set({ busy: true });
    try {
      const names = Array.from(selectedSet);
      const report = await api.moveImages(path, names, destSubdir);
      useDatasetStore.getState().renameImages(report.moved);
      set({
        selectedSet: new Set(),
        busy: false,
        lastReport: { kind: "move", report },
      });
      return report;
    } catch (e) {
      console.error("move_images failed", e);
      set({ busy: false });
      throw e;
    }
  },

  dismissReport: () => set({ lastReport: null }),
}));

// Recompute filtered indices when dataset images/labels/viewedSet/config change.
useDatasetStore.subscribe((state, prev) => {
  if (
    state.images !== prev.images ||
    state.labels !== prev.labels ||
    state.config !== prev.config
  ) {
    if (state.path !== prev.path) {
      useCleanerStore.getState().resetOnDatasetChange();
    } else {
      useCleanerStore.getState().recompute();
    }
  }
});
