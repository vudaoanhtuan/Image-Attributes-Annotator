import { create } from "zustand";
import { api } from "@/lib/tauri";
import { parseDatasetConfig } from "@/lib/config";
import { computeFilteredIndices } from "@/shared/filters/predicates";
import { EMPTY_FILTER_STATE, type FilterState } from "@/shared/filters/types";
import type { DatasetConfig, Label } from "@/types/label";

export type ViewMode = "annotator" | "cleaner";

export type DatasetFilters = FilterState;
export const EMPTY_FILTERS: DatasetFilters = EMPTY_FILTER_STATE;

type DatasetState = {
  path: string | null;
  images: string[];
  currentIndex: number;
  labels: Map<string, Label>;
  viewedSet: Set<string>;
  config: DatasetConfig | null;
  imageSize: { width: number; height: number } | null;
  filters: DatasetFilters;
  filteredIndices: number[];
  viewMode: ViewMode;
  categories: string[];
  open: (path: string) => Promise<void>;
  close: () => void;
  refreshCategories: () => Promise<void>;
  setIndex: (i: number) => void;
  markViewed: (imageName: string) => void;
  setLabel: (imageName: string, label: Label | null) => void;
  setImageSize: (size: { width: number; height: number } | null) => void;
  setFilters: (f: DatasetFilters) => void;
  setViewMode: (m: ViewMode) => void;
  removeImages: (names: string[]) => void;
  renameImages: (renames: { from: string; to: string }[]) => void;
  currentImage: () => string | null;
};

export const useDatasetStore = create<DatasetState>((set, get) => ({
  path: null,
  images: [],
  currentIndex: 0,
  labels: new Map(),
  viewedSet: new Set(),
  config: null,
  imageSize: null,
  filters: EMPTY_FILTERS,
  filteredIndices: [],
  viewMode: "annotator",
  categories: [],

  open: async (path) => {
    const { images, labels, config } = await api.openDataset(path);
    set({
      path,
      images,
      labels: new Map(Object.entries(labels)),
      viewedSet: new Set(),
      currentIndex: 0,
      config: parseDatasetConfig(config),
      imageSize: null,
      filters: EMPTY_FILTERS,
      filteredIndices: images.map((_, i) => i),
      viewMode: "annotator",
      categories: [],
    });
    await get().refreshCategories();
  },

  close: () => {
    set({
      path: null,
      images: [],
      currentIndex: 0,
      labels: new Map(),
      viewedSet: new Set(),
      config: null,
      imageSize: null,
      filters: EMPTY_FILTERS,
      filteredIndices: [],
      viewMode: "annotator",
      categories: [],
    });
  },

  refreshCategories: async () => {
    const { path } = get();
    if (!path) {
      set({ categories: [] });
      return;
    }
    const categories = await api.listImageCategories(path);
    set({ categories });
  },

  setIndex: (i) => {
    const { images, currentIndex } = get();
    if (images.length === 0) return;
    const clamped = Math.max(0, Math.min(images.length - 1, i));
    if (clamped === currentIndex) return;
    set({ currentIndex: clamped, imageSize: null });
  },

  markViewed: (imageName) => {
    const current = get().viewedSet;
    if (current.has(imageName)) return;
    const next = new Set(current);
    next.add(imageName);
    set({ viewedSet: next });
  },

  setLabel: (imageName, label) => {
    const next = new Map(get().labels);
    if (label === null) next.delete(imageName);
    else next.set(imageName, label);
    set({ labels: next });
  },

  setImageSize: (size) => {
    set({ imageSize: size });
  },

  setFilters: (filters) => {
    const { images, labels, viewedSet, config } = get();
    const filteredIndices = computeFilteredIndices({
      images,
      labels,
      viewedSet,
      config,
      filters,
    });
    set({ filters, filteredIndices });
  },

  setViewMode: (m) => {
    set({ viewMode: m });
  },

  removeImages: (names) => {
    if (names.length === 0) return;
    const drop = new Set(names);
    const {
      images,
      labels,
      viewedSet,
      currentIndex,
      filters,
      config,
    } = get();
    const nextImages = images.filter((n) => !drop.has(n));
    const nextLabels = new Map(labels);
    const nextViewed = new Set(viewedSet);
    for (const n of names) {
      nextLabels.delete(n);
      nextViewed.delete(n);
    }
    const currentName = images[currentIndex];
    let nextIndex = currentIndex;
    if (currentName !== undefined && drop.has(currentName)) {
      // Pick the closest non-deleted index.
      nextIndex = Math.min(nextImages.length - 1, currentIndex);
      if (nextIndex < 0) nextIndex = 0;
    } else if (currentName !== undefined) {
      const newPos = nextImages.indexOf(currentName);
      nextIndex = newPos >= 0 ? newPos : 0;
    }
    const filteredIndices = computeFilteredIndices({
      images: nextImages,
      labels: nextLabels,
      viewedSet: nextViewed,
      config,
      filters,
    });
    set({
      images: nextImages,
      labels: nextLabels,
      viewedSet: nextViewed,
      currentIndex: nextIndex,
      filteredIndices,
    });
  },

  renameImages: (renames) => {
    const effective = renames.filter((r) => r.from !== r.to);
    if (effective.length === 0) return;
    const map = new Map(effective.map((r) => [r.from, r.to]));
    const {
      images,
      labels,
      viewedSet,
      currentIndex,
      filters,
      config,
    } = get();
    const nextImages = images.map((n) => map.get(n) ?? n);
    nextImages.sort();
    const nextLabels = new Map<string, Label>();
    for (const [k, v] of labels) {
      nextLabels.set(map.get(k) ?? k, v);
    }
    const nextViewed = new Set<string>();
    for (const n of viewedSet) nextViewed.add(map.get(n) ?? n);
    const currentName = images[currentIndex];
    let nextIndex = currentIndex;
    if (currentName !== undefined) {
      const target = map.get(currentName) ?? currentName;
      const pos = nextImages.indexOf(target);
      nextIndex = pos >= 0 ? pos : Math.min(currentIndex, Math.max(0, nextImages.length - 1));
    }
    const filteredIndices = computeFilteredIndices({
      images: nextImages,
      labels: nextLabels,
      viewedSet: nextViewed,
      config,
      filters,
    });
    set({
      images: nextImages,
      labels: nextLabels,
      viewedSet: nextViewed,
      currentIndex: nextIndex,
      filteredIndices,
    });
  },

  currentImage: () => {
    const { images, currentIndex } = get();
    return images[currentIndex] ?? null;
  },
}));
