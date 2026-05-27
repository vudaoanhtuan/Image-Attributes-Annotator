import type { AttributeSchema, DatasetConfig, Label } from "@/types/label";
import { labelStatus, type LabelStatus } from "@/lib/status";
import { imageCategory } from "./category";

export type CleanerAttrFilter =
  | { kind: "single"; key: string; values: Set<string> }
  | {
      kind: "multi";
      key: string;
      values: Set<string>;
      mode: "any" | "all";
    }
  | { kind: "number"; key: string; min?: number; max?: number }
  | { kind: "direction"; key: string; minDeg?: number; maxDeg?: number };

export type CleanerFilterState = {
  query: string;
  labelStatuses: Set<LabelStatus>;
  categories: Set<string>;
  attrs: CleanerAttrFilter[];
};

export const EMPTY_CLEANER_FILTER_STATE: CleanerFilterState = {
  query: "",
  labelStatuses: new Set(),
  categories: new Set(),
  attrs: [],
};

export function isCleanerAttrFilterActive(f: CleanerAttrFilter): boolean {
  switch (f.kind) {
    case "single":
    case "multi":
      return f.values.size > 0;
    case "number":
      return f.min !== undefined || f.max !== undefined;
    case "direction":
      return f.minDeg !== undefined || f.maxDeg !== undefined;
  }
}

export function initialCleanerAttrFilter(attr: AttributeSchema): CleanerAttrFilter {
  switch (attr.type) {
    case "single":
      return { kind: "single", key: attr.key, values: new Set() };
    case "multi":
      return { kind: "multi", key: attr.key, values: new Set(), mode: "any" };
    case "number":
      return { kind: "number", key: attr.key };
    case "direction":
      return { kind: "direction", key: attr.key };
  }
}

function matchSingle(label: Label | undefined, f: Extract<CleanerAttrFilter, { kind: "single" }>): boolean {
  if (f.values.size === 0) return true;
  const v = label?.[f.key];
  if (typeof v !== "string") return false;
  return f.values.has(v);
}

function matchMulti(label: Label | undefined, f: Extract<CleanerAttrFilter, { kind: "multi" }>): boolean {
  if (f.values.size === 0) return true;
  const raw = label?.[f.key];
  const arr = Array.isArray(raw) ? raw : null;
  if (!arr || arr.length === 0) return false;
  if (f.mode === "all") {
    for (const v of f.values) if (!arr.includes(v)) return false;
    return true;
  }
  for (const v of arr) if (f.values.has(v)) return true;
  return false;
}

function matchNumber(label: Label | undefined, f: Extract<CleanerAttrFilter, { kind: "number" }>): boolean {
  if (f.min === undefined && f.max === undefined) return true;
  const v = label?.[f.key];
  if (typeof v !== "number" || !Number.isFinite(v)) return false;
  if (f.min !== undefined && v < f.min) return false;
  if (f.max !== undefined && v > f.max) return false;
  return true;
}

function normDeg(d: number) {
  return ((d % 360) + 360) % 360;
}

function matchDirection(label: Label | undefined, f: Extract<CleanerAttrFilter, { kind: "direction" }>): boolean {
  if (f.minDeg === undefined && f.maxDeg === undefined) return true;
  const v = label?.[f.key];
  if (typeof v !== "number" || !Number.isFinite(v)) return false;
  const vn = normDeg(v);
  const lo = f.minDeg !== undefined ? normDeg(f.minDeg) : 0;
  const hi = f.maxDeg !== undefined ? normDeg(f.maxDeg) : 360;
  if (f.minDeg !== undefined && f.maxDeg !== undefined) {
    if (lo <= hi) return vn >= lo && vn <= hi;
    return vn >= lo || vn <= hi;
  }
  if (f.minDeg !== undefined) return vn >= lo;
  return vn <= hi;
}

function matchAttr(label: Label | undefined, f: CleanerAttrFilter): boolean {
  switch (f.kind) {
    case "single": return matchSingle(label, f);
    case "multi": return matchMulti(label, f);
    case "number": return matchNumber(label, f);
    case "direction": return matchDirection(label, f);
  }
}

export function buildCleanerPredicate(
  state: CleanerFilterState,
  labels: Map<string, Label>,
  config: DatasetConfig | null,
): (name: string) => boolean {
  const q = state.query.trim().toLowerCase();
  return (name) => {
    if (q && !name.toLowerCase().includes(q)) return false;
    if (
      state.categories.size > 0 &&
      !state.categories.has(imageCategory(name))
    ) {
      return false;
    }
    if (
      state.labelStatuses.size > 0 &&
      !state.labelStatuses.has(labelStatus(name, labels, config))
    ) {
      return false;
    }
    if (state.attrs.length > 0) {
      const label = labels.get(name);
      for (const f of state.attrs) if (!matchAttr(label, f)) return false;
    }
    return true;
  };
}
