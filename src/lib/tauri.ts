import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import type { Label } from "@/types/label";

export type OpenedDataset = {
  images: string[];
  labels: Record<string, Label>;
  config: unknown;
};

export const api = {
  openDataset: (path: string) =>
    invoke<OpenedDataset>("open_dataset", { path }),
  readLabel: (path: string, imageName: string) =>
    invoke<Label | null>("read_label", { path, imageName }),
  writeLabel: (path: string, imageName: string, data: Label) =>
    invoke<void>("write_label", { path, imageName, data }),
  listLabeled: (path: string) =>
    invoke<string[]>("list_labeled", { path }),
};

export function imageUrl(datasetPath: string, imageName: string): string {
  // Join with platform-safe separator; Tauri's convertFileSrc handles paths.
  const sep = datasetPath.includes("\\") ? "\\" : "/";
  return convertFileSrc(`${datasetPath}${sep}images${sep}${imageName}`);
}
