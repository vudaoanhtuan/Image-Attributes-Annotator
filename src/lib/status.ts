import type { DatasetConfig, Label } from "@/types/label";

export type LabelStatus = "none" | "incomplete" | "complete";
export type ViewStatus = "viewed" | "unviewed";

export function labelStatus(
  stem: string,
  labels: Map<string, Label>,
  config: DatasetConfig | null,
): LabelStatus {
  const label = labels.get(stem);
  if (!label) return "none";
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
    } else if (attr.type === "number") {
      const v = label[attr.key];
      if (typeof v !== "number" || !Number.isFinite(v)) return "incomplete";
      if (attr.min !== undefined && v < attr.min) return "incomplete";
      if (attr.max !== undefined && v > attr.max) return "incomplete";
      if (attr.subtype === "int" && !Number.isInteger(v)) return "incomplete";
    }
  }
  return "complete";
}

export function viewStatus(
  stem: string,
  viewedSet: Set<string>,
): ViewStatus {
  return viewedSet.has(stem) ? "viewed" : "unviewed";
}

export const LABEL_STATUS_ORDER: LabelStatus[] = [
  "none",
  "incomplete",
  "complete",
];

export const VIEW_STATUS_ORDER: ViewStatus[] = ["unviewed", "viewed"];

export const LABEL_STATUS_BG: Record<LabelStatus, string> = {
  none: "bg-red-500",
  incomplete: "bg-amber-400",
  complete: "bg-emerald-500",
};

export const LABEL_STATUS_LABEL: Record<LabelStatus, string> = {
  none: "No label",
  incomplete: "Incomplete",
  complete: "Complete",
};

export const VIEW_STATUS_BG: Record<ViewStatus, string> = {
  unviewed: "bg-neutral-400",
  viewed: "bg-neutral-700",
};

export const VIEW_STATUS_LABEL: Record<ViewStatus, string> = {
  unviewed: "Unviewed",
  viewed: "Viewed",
};
