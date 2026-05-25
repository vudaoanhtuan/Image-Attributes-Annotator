import { useEffect } from "react";
import { useDatasetStore } from "@/store/datasetStore";
import { pickAndOpenDataset } from "./openDataset";

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

export function useArrowHotkeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const { currentIndex, setIndex } = useDatasetStore.getState();
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex(currentIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex(currentIndex + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
