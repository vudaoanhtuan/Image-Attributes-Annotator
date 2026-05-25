import { open } from "@tauri-apps/plugin-dialog";
import { useDatasetStore } from "@/store/datasetStore";
import { useLabelStore } from "@/store/labelStore";

export async function pickAndOpenDataset(): Promise<string | null> {
  const selected = await open({ directory: true, multiple: false });
  if (!selected || typeof selected !== "string") return null;
  // Flush any pending edits from the current dataset before switching.
  await useLabelStore.getState().flush();
  useLabelStore.setState({
    draft: {},
    dirty: false,
    status: "idle",
    boundImage: null,
  });
  await useDatasetStore.getState().open(selected);
  return null;
}
