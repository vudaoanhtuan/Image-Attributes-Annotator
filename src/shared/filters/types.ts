import type { LabelStatus, ViewStatus } from "@/lib/status";

export type AttrFilter =
  | { kind: "single"; key: string; values: Set<string>; includeUnset: boolean }
  | {
      kind: "multi";
      key: string;
      values: Set<string>;
      mode: "any" | "all";
      includeUnset: boolean;
    }
  | { kind: "number"; key: string; min?: number; max?: number; includeUnset: boolean }
  | {
      kind: "direction";
      key: string;
      minDeg?: number;
      maxDeg?: number;
      includeUnset: boolean;
    };

export type FilterState = {
  query: string;
  labelStatuses: Set<LabelStatus>;
  viewStatuses: Set<ViewStatus>;
  attrs: AttrFilter[];
};

export const EMPTY_FILTER_STATE: FilterState = {
  query: "",
  labelStatuses: new Set(),
  viewStatuses: new Set(),
  attrs: [],
};
