import { useEffect, useMemo, useState } from "react";
import { useDatasetStore } from "@/store/datasetStore";
import { useCleanerStore } from "@/store/cleanerStore";
import {
  labelStatus,
  viewStatus,
  type LabelStatus,
  type ViewStatus,
} from "@/lib/status";
import QueryInput from "@/shared/filters/ui/QueryInput";
import {
  LabelStatusButtons,
  ViewStatusButtons,
} from "@/shared/filters/ui/StatusFilterButtons";
import {
  EMPTY_FILTER_STATE,
  type AttrFilter,
  type FilterState,
} from "@/shared/filters/types";
import type { AttributeSchema } from "@/types/label";

type Draft = {
  query: string;
  labelStatuses: Set<LabelStatus>;
  viewStatuses: Set<ViewStatus>;
  attrs: Map<string, AttrFilter>;
};

function initialAttrFilter(attr: AttributeSchema): AttrFilter {
  switch (attr.type) {
    case "single":
      return { kind: "single", key: attr.key, values: new Set(), includeUnset: false };
    case "multi":
      return {
        kind: "multi",
        key: attr.key,
        values: new Set(),
        mode: "any",
        includeUnset: false,
      };
    case "number":
      return { kind: "number", key: attr.key, includeUnset: false };
    case "direction":
      return { kind: "direction", key: attr.key, includeUnset: false };
  }
}

function attrsToMap(arr: AttrFilter[]): Map<string, AttrFilter> {
  const m = new Map<string, AttrFilter>();
  for (const f of arr) m.set(f.key, f);
  return m;
}

function buildDraft(applied: FilterState, schema: AttributeSchema[]): Draft {
  const fromApplied = attrsToMap(applied.attrs);
  const attrs = new Map<string, AttrFilter>();
  for (const a of schema) {
    attrs.set(a.key, fromApplied.get(a.key) ?? initialAttrFilter(a));
  }
  return {
    query: applied.query,
    labelStatuses: new Set(applied.labelStatuses),
    viewStatuses: new Set(applied.viewStatuses),
    attrs,
  };
}

export default function CleanerFilters() {
  const config = useDatasetStore((s) => s.config);
  const images = useDatasetStore((s) => s.images);
  const labels = useDatasetStore((s) => s.labels);
  const viewedSet = useDatasetStore((s) => s.viewedSet);
  const applied = useCleanerStore((s) => s.filters);
  const setFilters = useCleanerStore((s) => s.setFilters);

  const schema = useMemo(() => config?.attributes ?? [], [config]);
  const [draft, setDraft] = useState<Draft>(() => buildDraft(applied, schema));

  useEffect(() => {
    setDraft(buildDraft(applied, schema));
  }, [applied, schema]);

  const { labelCounts, viewCounts } = useMemo(() => {
    const lc: Record<LabelStatus, number> = { none: 0, incomplete: 0, complete: 0 };
    const vc: Record<ViewStatus, number> = { unviewed: 0, viewed: 0 };
    for (const name of images) {
      lc[labelStatus(name, labels, config)]++;
      vc[viewStatus(name, viewedSet)]++;
    }
    return { labelCounts: lc, viewCounts: vc };
  }, [images, labels, viewedSet, config]);

  const updateAttr = (key: string, next: AttrFilter) => {
    setDraft((d) => {
      const m = new Map(d.attrs);
      m.set(key, next);
      return { ...d, attrs: m };
    });
  };

  const apply = () => {
    const attrs: AttrFilter[] = [];
    for (const a of schema) {
      const f = draft.attrs.get(a.key);
      if (f) attrs.push(f);
    }
    setFilters({
      query: draft.query,
      labelStatuses: new Set(draft.labelStatuses),
      viewStatuses: new Set(draft.viewStatuses),
      attrs,
    });
  };

  const reset = () => {
    setDraft(buildDraft(EMPTY_FILTER_STATE, schema));
    setFilters({ ...EMPTY_FILTER_STATE, attrs: [] });
  };

  const toggleLabelStatus = (s: LabelStatus) =>
    setDraft((d) => {
      const n = new Set(d.labelStatuses);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      return { ...d, labelStatuses: n };
    });

  const toggleViewStatus = (s: ViewStatus) =>
    setDraft((d) => {
      const n = new Set(d.viewStatuses);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      return { ...d, viewStatuses: n };
    });

  return (
    <div className="w-72 border-r border-neutral-200 bg-white flex flex-col">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
        Filters
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-3">
        <QueryInput
          value={draft.query}
          onChange={(v) => setDraft((d) => ({ ...d, query: v }))}
          onSubmit={apply}
        />
        <LabelStatusButtons
          selected={draft.labelStatuses}
          onToggle={toggleLabelStatus}
          counts={labelCounts}
        />
        <ViewStatusButtons
          selected={draft.viewStatuses}
          onToggle={toggleViewStatus}
          counts={viewCounts}
        />
        {schema.length > 0 && (
          <div className="flex flex-col gap-3 pt-1 border-t border-neutral-200">
            {schema.map((attr) => {
              const f = draft.attrs.get(attr.key)!;
              return (
                <AttrFilterRow
                  key={attr.key}
                  attr={attr}
                  filter={f}
                  onChange={(n) => updateAttr(attr.key, n)}
                />
              );
            })}
          </div>
        )}
      </div>
      <div className="px-3 py-2 border-t border-neutral-200 flex items-center gap-2">
        <button
          type="button"
          onClick={apply}
          className="flex-[2] px-2 py-1 text-base rounded border bg-sky-600 border-sky-600 text-white hover:bg-sky-700"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex-1 px-2 py-1 text-base rounded border bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function AttrFilterRow({
  attr,
  filter,
  onChange,
}: {
  attr: AttributeSchema;
  filter: AttrFilter;
  onChange: (f: AttrFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 pt-2">
      <div className="text-base text-neutral-700 font-medium">{attr.label}</div>
      {attr.type === "single" && filter.kind === "single" && (
        <ValueChips
          options={attr.options.map((o) => ({ value: o.value, label: o.label }))}
          selected={filter.values}
          includeUnset={filter.includeUnset}
          onToggleValue={(v) => {
            const n = new Set(filter.values);
            if (n.has(v)) n.delete(v);
            else n.add(v);
            onChange({ ...filter, values: n });
          }}
          onToggleUnset={() =>
            onChange({ ...filter, includeUnset: !filter.includeUnset })
          }
        />
      )}
      {attr.type === "multi" && filter.kind === "multi" && (
        <>
          <ValueChips
            options={attr.options.map((o) => ({ value: o.value, label: o.label }))}
            selected={filter.values}
            includeUnset={filter.includeUnset}
            onToggleValue={(v) => {
              const n = new Set(filter.values);
              if (n.has(v)) n.delete(v);
              else n.add(v);
              onChange({ ...filter, values: n });
            }}
            onToggleUnset={() =>
              onChange({ ...filter, includeUnset: !filter.includeUnset })
            }
          />
          <div className="flex items-center gap-1 text-sm">
            <span className="text-neutral-500">Match:</span>
            {(["any", "all"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChange({ ...filter, mode: m })}
                className={`px-2 py-0.5 rounded border text-sm ${
                  filter.mode === m
                    ? "bg-sky-100 border-sky-500 text-sky-900"
                    : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </>
      )}
      {attr.type === "number" && filter.kind === "number" && (
        <RangeRow
          min={filter.min}
          max={filter.max}
          step={attr.step}
          includeUnset={filter.includeUnset}
          onChange={(min, max) => onChange({ ...filter, min, max })}
          onToggleUnset={() =>
            onChange({ ...filter, includeUnset: !filter.includeUnset })
          }
        />
      )}
      {attr.type === "direction" && filter.kind === "direction" && (
        <RangeRow
          min={filter.minDeg}
          max={filter.maxDeg}
          step={1}
          unit="°"
          hint={
            filter.minDeg !== undefined &&
            filter.maxDeg !== undefined &&
            filter.minDeg > filter.maxDeg
              ? "wraps across 360°"
              : undefined
          }
          includeUnset={filter.includeUnset}
          onChange={(min, max) =>
            onChange({ ...filter, minDeg: min, maxDeg: max })
          }
          onToggleUnset={() =>
            onChange({ ...filter, includeUnset: !filter.includeUnset })
          }
        />
      )}
    </div>
  );
}

function ValueChips({
  options,
  selected,
  includeUnset,
  onToggleValue,
  onToggleUnset,
}: {
  options: { value: string; label: string }[];
  selected: Set<string>;
  includeUnset: boolean;
  onToggleValue: (v: string) => void;
  onToggleUnset: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => {
        const on = selected.has(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggleValue(o.value)}
            className={`px-2 py-0.5 rounded border text-sm ${
              on
                ? "bg-sky-100 border-sky-500 text-sky-900"
                : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            {o.label}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onToggleUnset}
        title="Include images where this attribute is unset"
        className={`px-2 py-0.5 rounded border text-sm italic ${
          includeUnset
            ? "bg-amber-100 border-amber-500 text-amber-900"
            : "bg-white border-neutral-300 text-neutral-500 hover:bg-neutral-100"
        }`}
      >
        (unset)
      </button>
    </div>
  );
}

function RangeRow({
  min,
  max,
  step,
  unit,
  hint,
  includeUnset,
  onChange,
  onToggleUnset,
}: {
  min: number | undefined;
  max: number | undefined;
  step?: number;
  unit?: string;
  hint?: string;
  includeUnset: boolean;
  onChange: (min: number | undefined, max: number | undefined) => void;
  onToggleUnset: () => void;
}) {
  const parse = (s: string): number | undefined => {
    if (s.trim() === "") return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-sm">
        <input
          type="number"
          step={step}
          value={min ?? ""}
          onChange={(e) => onChange(parse(e.target.value), max)}
          placeholder="min"
          className="w-20 px-2 py-0.5 border border-neutral-300 rounded text-sm"
        />
        <span className="text-neutral-500">to</span>
        <input
          type="number"
          step={step}
          value={max ?? ""}
          onChange={(e) => onChange(min, parse(e.target.value))}
          placeholder="max"
          className="w-20 px-2 py-0.5 border border-neutral-300 rounded text-sm"
        />
        {unit && <span className="text-neutral-500 text-sm">{unit}</span>}
        <button
          type="button"
          onClick={onToggleUnset}
          title="Include unset"
          className={`ml-auto px-2 py-0.5 rounded border text-sm italic ${
            includeUnset
              ? "bg-amber-100 border-amber-500 text-amber-900"
              : "bg-white border-neutral-300 text-neutral-500 hover:bg-neutral-100"
          }`}
        >
          (unset)
        </button>
      </div>
      {hint && <div className="text-xs text-neutral-500">{hint}</div>}
    </div>
  );
}
