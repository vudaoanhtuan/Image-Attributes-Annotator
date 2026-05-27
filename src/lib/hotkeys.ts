import { useEffect, useMemo } from "react";
import { useDatasetStore } from "@/store/datasetStore";
import { useLabelStore } from "@/store/labelStore";
import { pickAndOpenDataset } from "./openDataset";
import { switchViewMode } from "./switchViewMode";
import { buildHotkeyMap } from "./attrHotkeys";
function nextFilteredIndex(
  filtered: number[],
  current: number,
  direction: 1 | -1,
): number | null {
  if (filtered.length === 0) return null;
  const pos = filtered.indexOf(current);
  if (pos >= 0) {
    const nextPos = Math.max(0, Math.min(filtered.length - 1, pos + direction));
    return filtered[nextPos];
  }
  if (direction > 0) {
    for (const i of filtered) if (i > current) return i;
    return filtered[filtered.length - 1];
  } else {
    for (let k = filtered.length - 1; k >= 0; k--) {
      if (filtered[k] < current) return filtered[k];
    }
    return filtered[0];
  }
}

export function useOpenDatasetHotkey() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        void pickAndOpenDataset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export function useAttributeHotkeys() {
  const config = useDatasetStore((s) => s.config);
  const map = useMemo(() => buildHotkeyMap(config), [config]);

  useEffect(() => {
    if (map.size === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (useDatasetStore.getState().viewMode !== "annotator") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const action = map.get(e.key.toLowerCase());
      if (!action) return;
      e.preventDefault();
      const { draft, setSingle, toggleMulti } = useLabelStore.getState();
      if (action.type === "single") {
        const current = draft[action.attrKey];
        setSingle(action.attrKey, current === action.value ? undefined : action.value);
      } else {
        toggleMulti(action.attrKey, action.value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [map]);
}

export function useViewModeHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return;
      if (!useDatasetStore.getState().path) return;
      if (e.key === "1") {
        e.preventDefault();
        void switchViewMode("annotator");
      } else if (e.key === "2") {
        e.preventDefault();
        void switchViewMode("cleaner");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export function useArrowHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const { currentIndex, setIndex, filteredIndices } =
        useDatasetStore.getState();
      let direction: 1 | -1 | 0 = 0;
      if (e.key === " ") {
        direction = e.shiftKey ? -1 : 1;
      } else if (!e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowUp")) {
        direction = -1;
      } else if (
        !e.shiftKey &&
        (e.key === "ArrowRight" || e.key === "ArrowDown")
      ) {
        direction = 1;
      }
      if (direction === 0) return;
      e.preventDefault();
      const target = nextFilteredIndex(filteredIndices, currentIndex, direction);
      if (target !== null) setIndex(target);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
