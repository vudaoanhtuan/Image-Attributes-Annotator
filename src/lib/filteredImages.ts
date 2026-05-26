import type { DatasetConfig, Label } from "@/types/label";
import type { LabelStatus, ViewStatus } from "@/lib/status";
import { labelStatus, viewStatus } from "@/lib/status";

function stem(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(0, i) : name;
}

export function computeFilteredIndices(input: {
  images: string[];
  labels: Map<string, Label>;
  viewedSet: Set<string>;
  config: DatasetConfig | null;
  filters: {
    query: string;
    labelStatuses: Set<LabelStatus>;
    viewStatuses: Set<ViewStatus>;
  };
}): number[] {
  const { images, labels, viewedSet, config, filters } = input;
  const q = filters.query.trim().toLowerCase();
  const out: number[] = [];
  for (let i = 0; i < images.length; i++) {
    const name = images[i];
    const st = stem(name);
    if (filters.labelStatuses.size > 0) {
      if (!filters.labelStatuses.has(labelStatus(st, labels, config))) continue;
    }
    if (filters.viewStatuses.size > 0) {
      if (!filters.viewStatuses.has(viewStatus(st, viewedSet))) continue;
    }
    if (q && !name.toLowerCase().includes(q)) continue;
    out.push(i);
  }
  return out;
}
