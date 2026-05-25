import { useEffect, useMemo } from "react";
import { useDatasetStore } from "@/store/datasetStore";
import { useLabelStore } from "@/store/labelStore";
import { pickAndOpenDataset } from "./openDataset";
import { buildHotkeyMap } from "./attrHotkeys";

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

export function useArrowHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const { currentIndex, setIndex } = useDatasetStore.getState();
      if (e.key === " ") {
        e.preventDefault();
        setIndex(currentIndex + (e.shiftKey ? -1 : 1));
        return;
      }
      if (e.shiftKey) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setIndex(currentIndex - 1);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setIndex(currentIndex + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
