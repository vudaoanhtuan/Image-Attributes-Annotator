import { useDatasetStore, type ViewMode } from "@/store/datasetStore";
import { useLabelStore } from "@/store/labelStore";

export async function switchViewMode(mode: ViewMode) {
  const { path, viewMode, setViewMode } = useDatasetStore.getState();
  if (!path) return;
  if (viewMode === mode) return;
  await useLabelStore.getState().flush();
  setViewMode(mode);
}
