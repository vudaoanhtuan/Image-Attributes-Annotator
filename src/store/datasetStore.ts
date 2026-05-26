import { create } from "zustand";
import { api } from "@/lib/tauri";
import { parseDatasetConfig } from "@/lib/config";
import type { DatasetConfig, Label } from "@/types/label";

type DatasetState = {
  path: string | null;
  images: string[];
  currentIndex: number;
  labels: Map<string, Label>;
  viewedSet: Set<string>;
  config: DatasetConfig | null;
  imageSize: { width: number; height: number } | null;
  open: (path: string) => Promise<void>;
  close: () => void;
  setIndex: (i: number) => void;
  markViewed: (imageName: string) => void;
  setLabel: (imageName: string, label: Label | null) => void;
  setImageSize: (size: { width: number; height: number } | null) => void;
  currentImage: () => string | null;
};

function stem(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(0, i) : name;
}

export const useDatasetStore = create<DatasetState>((set, get) => ({
  path: null,
  images: [],
  currentIndex: 0,
  labels: new Map(),
  viewedSet: new Set(),
  config: null,
  imageSize: null,

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
    });
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
    });
  },

  setIndex: (i) => {
    const { images, currentIndex } = get();
    if (images.length === 0) return;
    const clamped = Math.max(0, Math.min(images.length - 1, i));
    if (clamped === currentIndex) return;
    set({ currentIndex: clamped, imageSize: null });
  },

  markViewed: (imageName) => {
    const key = stem(imageName);
    const current = get().viewedSet;
    if (current.has(key)) return;
    const next = new Set(current);
    next.add(key);
    set({ viewedSet: next });
  },

  setLabel: (imageName, label) => {
    const key = stem(imageName);
    const next = new Map(get().labels);
    if (label === null) next.delete(key);
    else next.set(key, label);
    set({ labels: next });
  },

  setImageSize: (size) => {
    set({ imageSize: size });
  },

  currentImage: () => {
    const { images, currentIndex } = get();
    return images[currentIndex] ?? null;
  },
}));
