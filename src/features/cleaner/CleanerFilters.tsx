import { useEffect, useMemo, useState } from "react";
import { useDatasetStore } from "@/store/datasetStore";
import { useCleanerStore } from "@/store/cleanerStore";
import { labelStatus, type LabelStatus } from "@/lib/status";
import TextInput from "@/shared/components/inputs/TextInput";
import { LabelStatusButtons } from "@/shared/filters/ui/StatusFilterButtons";
import NumberInput from "@/shared/components/inputs/NumberInput";
import type { AttributeSchema } from "@/types/label";
import {
  EMPTY_CLEANER_FILTER_STATE,
  initialCleanerAttrFilter,
  isCleanerAttrFilterActive,
  type CleanerAttrFilter,
  type CleanerFilterState,
} from "./filter";

type Draft = {
  query: string;
  labelStatuses: Set<LabelStatus>;
  attrs: Map<string, CleanerAttrFilter>;
};

function attrsToMap(arr: CleanerAttrFilter[]): Map<string, CleanerAttrFilter> {
  const m = new Map<string, CleanerAttrFilter>();
  for (const f of arr) m.set(f.key, f);
  return m;
}

function buildDraft(applied: CleanerFilterState, schema: AttributeSchema[]): Draft {
  const fromApplied = attrsToMap(applied.attrs);
  const attrs = new Map<string, CleanerAttrFilter>();
  for (const a of schema) {
    attrs.set(a.key, fromApplied.get(a.key) ?? initialCleanerAttrFilter(a));
  }
  return {
    query: applied.query,
    labelStatuses: new Set(applied.labelStatuses),
    attrs,
  };
}

export default function CleanerFilters() {
  const config = useDatasetStore((s) => s.config);
  const images = useDatasetStore((s) => s.images);
  const labels = useDatasetStore((s) => s.labels);
  const applied = useCleanerStore((s) => s.filters);
  const setFilters = useCleanerStore((s) => s.setFilters);

  const schema = useMemo(() => config?.attributes ?? [], [config]);
  const [draft, setDraft] = useState<Draft>(() => buildDraft(applied, schema));

  useEffect(() => {
    setDraft(buildDraft(applied, schema));
  }, [applied, schema]);

  const labelCounts = useMemo(() => {
    const lc: Record<LabelStatus, number> = { none: 0, incomplete: 0, complete: 0 };
    for (const name of images) {
      lc[labelStatus(name, labels, config)]++;
    }
    return lc;
  }, [images, labels, config]);

  const updateAttr = (key: string, next: CleanerAttrFilter) => {
    setDraft((d) => {
      const m = new Map(d.attrs);
      m.set(key, next);
      return { ...d, attrs: m };
    });
  };

  const apply = () => {
    const attrs: CleanerAttrFilter[] = [];
    for (const a of schema) {
      const f = draft.attrs.get(a.key);
      if (f) attrs.push(f);
    }
    setFilters({
      query: draft.query,
      labelStatuses: new Set(draft.labelStatuses),
      attrs,
    });
  };

  const reset = () => {
    setDraft(buildDraft(EMPTY_CLEANER_FILTER_STATE, schema));
    setFilters({ ...EMPTY_CLEANER_FILTER_STATE, labelStatuses: new Set(), attrs: [] });
  };

  const toggleLabelStatus = (s: LabelStatus) =>
    setDraft((d) => {
      const n = new Set(d.labelStatuses);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      return { ...d, labelStatuses: n };
    });

  return (
    <div className="h-full w-full border-r border-neutral-200 bg-white flex flex-col">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
        Filters
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-3">
        <TextInput
          value={draft.query}
          onChange={(v) => setDraft((d) => ({ ...d, query: v }))}
          onSubmit={apply}
          label="File name"
          placeholder="Filter by filename"
        />
        <LabelStatusButtons
          selected={draft.labelStatuses}
          onToggle={toggleLabelStatus}
          onClear={() => setDraft((d) => ({ ...d, labelStatuses: new Set() }))}
          counts={labelCounts}
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
  filter: CleanerAttrFilter;
  onChange: (f: CleanerAttrFilter) => void;
}) {
  const active = isCleanerAttrFilterActive(filter);
  return (
    <div className="flex flex-col gap-1.5 pt-2">
      <div className="flex items-center text-base text-neutral-700 font-medium">
        <span>{attr.label}</span>
        {active && (
          <button
            type="button"
            onClick={() => onChange(initialCleanerAttrFilter(attr))}
            aria-label={`Clear ${attr.label} filter`}
            title="Clear"
            className="ml-auto px-1 leading-none text-neutral-400 hover:text-neutral-700"
          >
            ✕
          </button>
        )}
      </div>
      {attr.type === "single" && filter.kind === "single" && (
        <ValueChips
          options={attr.options.map((o) => ({ value: o.value, label: o.label }))}
          selected={filter.values}
          onToggleValue={(v) => {
            const n = new Set(filter.values);
            if (n.has(v)) n.delete(v);
            else n.add(v);
            onChange({ ...filter, values: n });
          }}
        />
      )}
      {attr.type === "multi" && filter.kind === "multi" && (
        <>
          <ValueChips
            options={attr.options.map((o) => ({ value: o.value, label: o.label }))}
            selected={filter.values}
            onToggleValue={(v) => {
              const n = new Set(filter.values);
              if (n.has(v)) n.delete(v);
              else n.add(v);
              onChange({ ...filter, values: n });
            }}
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
        <NumberRangeRow
          min={filter.min}
          max={filter.max}
          subtype={attr.subtype}
          onChange={(min, max) => onChange({ ...filter, min, max })}
        />
      )}
      {attr.type === "direction" && filter.kind === "direction" && (
        <NumberRangeRow
          min={filter.minDeg}
          max={filter.maxDeg}
          subtype="int"
          hint={
            filter.minDeg !== undefined &&
            filter.maxDeg !== undefined &&
            filter.minDeg > filter.maxDeg
              ? "wraps across 360°"
              : undefined
          }
          onChange={(min, max) =>
            onChange({ ...filter, minDeg: min, maxDeg: max })
          }
        />
      )}
    </div>
  );
}

function ValueChips({
  options,
  selected,
  onToggleValue,
}: {
  options: { value: string; label: string }[];
  selected: Set<string>;
  onToggleValue: (v: string) => void;
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
    </div>
  );
}

function NumberRangeRow({
  min,
  max,
  subtype,
  hint,
  onChange,
}: {
  min: number | undefined;
  max: number | undefined;
  subtype?: "int" | "float";
  hint?: string;
  onChange: (min: number | undefined, max: number | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
          <NumberInput
            label="Min"
            value={min}
            subtype={subtype}
            onChange={(v) => onChange(v, max)}
          />
        </div>
        <div className="flex-1 min-w-0">
          <NumberInput
            label="Max"
            value={max}
            subtype={subtype}
            onChange={(v) => onChange(min, v)}
          />
        </div>
      </div>
      {hint && <div className="text-xs text-neutral-500">{hint}</div>}
    </div>
  );
}

