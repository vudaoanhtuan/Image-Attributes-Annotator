import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import type { Label } from "@/types/label";

export type OpenedDataset = {
  images: string[];
  labels: Record<string, Label>;
  config: unknown;
};

export type DeleteFailure = { image_name: string; reason: string };
export type DeleteReport = { moved: string[]; failed: DeleteFailure[] };

export type MoveFailure = { image_name: string; reason: string };
export type MovedItem = { from: string; to: string };
export type MoveReport = { moved: MovedItem[]; failed: MoveFailure[] };

export const api = {
  openDataset: (path: string) =>
    invoke<OpenedDataset>("open_dataset", { path }),
  readLabel: (path: string, imageName: string) =>
    invoke<Label | null>("read_label", { path, imageName }),
  writeLabel: (path: string, imageName: string, data: Label) =>
    invoke<void>("write_label", { path, imageName, data }),
  deleteImages: (path: string, imageNames: string[]) =>
    invoke<DeleteReport>("delete_images", { path, imageNames }),
  moveImages: (path: string, imageNames: string[], destSubdir: string) =>
    invoke<MoveReport>("move_images", { path, imageNames, destSubdir }),
  listImageSubdirs: (path: string) =>
    invoke<string[]>("list_image_subdirs", { path }),
};

export function imageUrl(datasetPath: string, imageName: string): string {
  // Backend emits image_file with forward slashes; normalize to the dataset's
  // separator so Windows paths stay consistent end-to-end.
  const sep = datasetPath.includes("\\") ? "\\" : "/";
  const name = sep === "\\" ? imageName.replace(/\//g, "\\") : imageName;
  return convertFileSrc(`${datasetPath}${sep}images${sep}${name}`);
}
