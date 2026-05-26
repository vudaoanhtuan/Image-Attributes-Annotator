import type { DatasetConfig, Label } from "@/types/label";
import { labelStatus, viewStatus } from "@/lib/status";
import type { AttrFilter, FilterState } from "./types";

function matchSingle(label: Label | undefined, f: Extract<AttrFilter, { kind: "single" }>): boolean {
  const v = label?.[f.key];
  if (typeof v !== "string") return f.includeUnset || f.values.size === 0;
  if (f.values.size === 0) return true;
  return f.values.has(v);
}

function matchMulti(label: Label | undefined, f: Extract<AttrFilter, { kind: "multi" }>): boolean {
  const raw = label?.[f.key];
  const arr = Array.isArray(raw) ? raw : null;
  if (!arr || arr.length === 0) return f.includeUnset || f.values.size === 0;
  if (f.values.size === 0) return true;
  if (f.mode === "all") {
    for (const v of f.values) if (!arr.includes(v)) return false;
    return true;
  }
  for (const v of arr) if (f.values.has(v)) return true;
  return false;
}

function matchNumber(label: Label | undefined, f: Extract<AttrFilter, { kind: "number" }>): boolean {
  const v = label?.[f.key];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    return f.includeUnset || (f.min === undefined && f.max === undefined);
  }
  if (f.min !== undefined && v < f.min) return false;
  if (f.max !== undefined && v > f.max) return false;
  return true;
}

function normDeg(d: number) {
  // Normalize to [0, 360)
  const m = ((d % 360) + 360) % 360;
  return m;
}

function matchDirection(label: Label | undefined, f: Extract<AttrFilter, { kind: "direction" }>): boolean {
  const v = label?.[f.key];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    return f.includeUnset || (f.minDeg === undefined && f.maxDeg === undefined);
  }
  if (f.minDeg === undefined && f.maxDeg === undefined) return true;
  const vn = normDeg(v);
  const lo = f.minDeg !== undefined ? normDeg(f.minDeg) : 0;
  const hi = f.maxDeg !== undefined ? normDeg(f.maxDeg) : 360;
  if (f.minDeg !== undefined && f.maxDeg !== undefined) {
    if (lo <= hi) return vn >= lo && vn <= hi;
    // wrap: e.g. [350, 10] → match [350,360) or [0,10]
    return vn >= lo || vn <= hi;
  }
  if (f.minDeg !== undefined) return vn >= lo;
  return vn <= hi;
}

function matchAttr(label: Label | undefined, f: AttrFilter): boolean {
  switch (f.kind) {
    case "single": return matchSingle(label, f);
    case "multi": return matchMulti(label, f);
    case "number": return matchNumber(label, f);
    case "direction": return matchDirection(label, f);
  }
}

export function buildPredicate(
  state: FilterState,
  labels: Map<string, Label>,
  viewedSet: Set<string>,
  config: DatasetConfig | null,
): (name: string) => boolean {
  const q = state.query.trim().toLowerCase();
  return (name) => {
    if (q && !name.toLowerCase().includes(q)) return false;
    if (state.labelStatuses.size > 0) {
      if (!state.labelStatuses.has(labelStatus(name, labels, config))) return false;
    }
    if (state.viewStatuses.size > 0) {
      if (!state.viewStatuses.has(viewStatus(name, viewedSet))) return false;
    }
    if (state.attrs.length > 0) {
      const label = labels.get(name);
      for (const f of state.attrs) if (!matchAttr(label, f)) return false;
    }
    return true;
  };
}

export function computeFilteredIndices(input: {
  images: string[];
  labels: Map<string, Label>;
  viewedSet: Set<string>;
  config: DatasetConfig | null;
  filters: FilterState;
}): number[] {
  const pred = buildPredicate(input.filters, input.labels, input.viewedSet, input.config);
  const out: number[] = [];
  for (let i = 0; i < input.images.length; i++) {
    if (pred(input.images[i])) out.push(i);
  }
  return out;
}
