import { create } from "zustand";
import { api } from "@/lib/tauri";

type DatasetState = {
  path: string | null;
  images: string[];
  currentIndex: number;
  labeledSet: Set<string>;
  open: (path: string) => Promise<void>;
  close: () => void;
  setIndex: (i: number) => void;
  markLabeled: (imageName: string, labeled: boolean) => void;
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
  labeledSet: new Set(),

  open: async (path) => {
    const { images, labeled } = await api.openDataset(path);
    set({
      path,
      images,
      labeledSet: new Set(labeled),
      currentIndex: 0,
    });
  },

  close: () => {
    set({ path: null, images: [], currentIndex: 0, labeledSet: new Set() });
  },

  setIndex: (i) => {
    const { images } = get();
    if (images.length === 0) return;
    const clamped = Math.max(0, Math.min(images.length - 1, i));
    set({ currentIndex: clamped });
  },

  markLabeled: (imageName, labeled) => {
    const s = new Set(get().labeledSet);
    const key = stem(imageName);
    if (labeled) s.add(key);
    else s.delete(key);
    set({ labeledSet: s });
  },

  currentImage: () => {
    const { images, currentIndex } = get();
    return images[currentIndex] ?? null;
  },
}));
