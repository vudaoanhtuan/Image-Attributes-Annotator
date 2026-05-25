import type { DatasetConfig, Label } from "@/types/label";

export type ImageStatus = "unviewed" | "missing" | "incomplete" | "complete";

export function imageStatus(
  stem: string,
  viewedSet: Set<string>,
  labels: Map<string, Label>,
  config: DatasetConfig | null
): ImageStatus {
  if (!viewedSet.has(stem)) return "unviewed";
  const label = labels.get(stem);
  if (!label) return "missing";
  if (!config) return "complete";
  for (const attr of config.attributes) {
    if (attr.type === "single") {
      const v = label[attr.key];
      if (typeof v !== "string" || !attr.options.some((o) => o.value === v)) {
        return "incomplete";
      }
    } else if (attr.type === "direction") {
      const v = label[attr.key];
      if (typeof v !== "number") return "incomplete";
    }
  }
  return "complete";
}

export const STATUS_BG: Record<ImageStatus, string> = {
  unviewed: "bg-neutral-400",
  missing: "bg-red-500",
  incomplete: "bg-amber-400",
  complete: "bg-emerald-500",
};

export const STATUS_LABEL: Record<ImageStatus, string> = {
  unviewed: "Unviewed",
  missing: "No label",
  incomplete: "Incomplete",
  complete: "Complete",
};
