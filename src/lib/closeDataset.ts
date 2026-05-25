import { useDatasetStore } from "@/store/datasetStore";
import { useLabelStore } from "@/store/labelStore";

export async function closeDataset() {
  if (!useDatasetStore.getState().path) return;
  await useLabelStore.getState().flush();
  useLabelStore.setState({
    draft: {},
    dirty: false,
    status: "idle",
    boundImage: null,
  });
  useDatasetStore.getState().close();
}
