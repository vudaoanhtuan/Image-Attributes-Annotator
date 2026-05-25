import { create } from "zustand";
import { api } from "@/lib/tauri";
import type { Label, SaveStatus } from "@/types/label";
import { useDatasetStore } from "./datasetStore";

const AUTOSAVE_MS = 5000;

type LabelState = {
  draft: Label;
  dirty: boolean;
  status: SaveStatus;
  // The image the draft belongs to. Used to ensure flushes save under the correct name.
  boundImage: string | null;
  loadFor: (imageName: string) => Promise<void>;
  setDirection: (key: string, value: number | undefined) => void;
  setSingle: (key: string, value: string | undefined) => void;
  toggleMulti: (key: string, value: string) => void;
  flush: () => Promise<void>;
  scheduleSave: () => void;
  cancelScheduled: () => void;
};

let saveTimer: number | null = null;

function isEmpty(label: Label) {
  return Object.keys(label).every((k) => {
    const v = label[k];
    if (v === undefined) return true;
    if (Array.isArray(v)) return v.length === 0;
    return v === "";
  });
}

export const useLabelStore = create<LabelState>((set, get) => ({
  draft: {},
  dirty: false,
  status: "idle",
  boundImage: null,

  loadFor: async (imageName) => {
    get().cancelScheduled();
    const path = useDatasetStore.getState().path;
    if (!path) return;
    set({ status: "idle", dirty: false, draft: {}, boundImage: imageName });
    useDatasetStore.getState().markViewed(imageName);
    try {
      const data = await api.readLabel(path, imageName);
      // Guard: only apply if still the bound image.
      if (get().boundImage !== imageName) return;
      set({ draft: data ?? {}, dirty: false, status: data ? "saved" : "idle" });
    } catch (e) {
      console.error("readLabel failed", e);
      set({ status: "error" });
    }
  },

  setDirection: (key, value) => {
    const draft = { ...get().draft };
    if (value === undefined) delete draft[key];
    else draft[key] = value;
    set({ draft, dirty: true, status: "dirty" });
    get().scheduleSave();
  },

  setSingle: (key, value) => {
    const draft = { ...get().draft };
    if (value === undefined) delete draft[key];
    else draft[key] = value;
    set({ draft, dirty: true, status: "dirty" });
    get().scheduleSave();
  },

  toggleMulti: (key, value) => {
    const draft = { ...get().draft };
    const current = Array.isArray(draft[key]) ? (draft[key] as string[]) : [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    if (next.length === 0) delete draft[key];
    else draft[key] = next;
    set({ draft, dirty: true, status: "dirty" });
    get().scheduleSave();
  },

  scheduleSave: () => {
    get().cancelScheduled();
    saveTimer = window.setTimeout(() => {
      void get().flush();
    }, AUTOSAVE_MS);
  },

  cancelScheduled: () => {
    if (saveTimer !== null) {
      window.clearTimeout(saveTimer);
      saveTimer = null;
    }
  },

  flush: async () => {
    const { dirty, draft, boundImage } = get();
    const path = useDatasetStore.getState().path;
    if (!dirty || !path || !boundImage) return;
    get().cancelScheduled();
    set({ status: "saving" });
    try {
      await api.writeLabel(path, boundImage, draft);
      useDatasetStore
        .getState()
        .setLabel(boundImage, isEmpty(draft) ? null : draft);
      // Only clear dirty if the bound image is still the same one we saved.
      if (get().boundImage === boundImage) {
        set({ dirty: false, status: "saved" });
      }
    } catch (e) {
      console.error("writeLabel failed", e);
      set({ status: "error" });
    }
  },
}));
