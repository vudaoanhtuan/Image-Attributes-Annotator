import { useEffect, useMemo, useState } from "react";
import { useDatasetStore, EMPTY_FILTERS } from "@/store/datasetStore";
import {
  labelStatus,
  viewStatus,
  LABEL_STATUS_BG,
  LABEL_STATUS_LABEL,
  LABEL_STATUS_ORDER,
  VIEW_STATUS_LABEL,
  VIEW_STATUS_ORDER,
  type LabelStatus,
  type ViewStatus,
} from "@/lib/status";

function stem(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(0, i) : name;
}

function setsEqual<T>(a: Set<T>, b: Set<T>) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export default function ImageFilters() {
  const images = useDatasetStore((s) => s.images);
  const labels = useDatasetStore((s) => s.labels);
  const viewedSet = useDatasetStore((s) => s.viewedSet);
  const config = useDatasetStore((s) => s.config);
  const applied = useDatasetStore((s) => s.filters);
  const setFilters = useDatasetStore((s) => s.setFilters);

  const [query, setQuery] = useState(applied.query);
  const [labelStatuses, setLabelStatuses] = useState<Set<LabelStatus>>(
    () => new Set(applied.labelStatuses),
  );
  const [viewStatuses, setViewStatuses] = useState<Set<ViewStatus>>(
    () => new Set(applied.viewStatuses),
  );

  useEffect(() => {
    setQuery(applied.query);
    setLabelStatuses(new Set(applied.labelStatuses));
    setViewStatuses(new Set(applied.viewStatuses));
  }, [applied]);

  const { labelCounts, viewCounts } = useMemo(() => {
    const lc: Record<LabelStatus, number> = {
      none: 0,
      incomplete: 0,
      complete: 0,
    };
    const vc: Record<ViewStatus, number> = { unviewed: 0, viewed: 0 };
    for (const name of images) {
      const st = stem(name);
      lc[labelStatus(st, labels, config)]++;
      vc[viewStatus(st, viewedSet)]++;
    }
    return { labelCounts: lc, viewCounts: vc };
  }, [images, labels, viewedSet, config]);

  const dirty =
    query !== applied.query ||
    !setsEqual(labelStatuses, applied.labelStatuses) ||
    !setsEqual(viewStatuses, applied.viewStatuses);

  const toggleLabelStatus = (s: LabelStatus) => {
    setLabelStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const toggleViewStatus = (s: ViewStatus) => {
    setViewStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const apply = () => {
    setFilters({
      query,
      labelStatuses: new Set(labelStatuses),
      viewStatuses: new Set(viewStatuses),
    });
  };

  const reset = () => {
    setQuery("");
    setLabelStatuses(new Set());
    setViewStatuses(new Set());
    setFilters(EMPTY_FILTERS);
  };

  return (
    <div className="flex flex-col border-b border-neutral-200">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
        Filters
      </div>
      <div className="px-3 py-2 flex flex-col gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          }
        }}
        placeholder="Filter by filename…"
        className="w-full px-2 py-1 text-base border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-500"
      />
      <div className="flex flex-col gap-1">
        <div className="text-base text-neutral-600">
          Label status
        </div>
        <div className="grid grid-cols-1 gap-1">
          {LABEL_STATUS_ORDER.map((s) => {
            const enabled = labelStatuses.has(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleLabelStatus(s)}
                title={LABEL_STATUS_LABEL[s]}
                className={`flex items-center gap-1.5 px-2 py-1 text-base border rounded transition-colors ${
                  enabled
                    ? "bg-sky-100 border-sky-500 text-sky-900 ring-1 ring-sky-400"
                    : "bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full shrink-0 ${LABEL_STATUS_BG[s]}`}
                />
                <span className="truncate">{LABEL_STATUS_LABEL[s]}</span>
                <span className="ml-auto tabular-nums text-neutral-500">
                  {labelCounts[s]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-base text-neutral-600">
          View status
        </div>
        <div className="grid grid-cols-1 gap-1">
          {VIEW_STATUS_ORDER.map((s) => {
            const enabled = viewStatuses.has(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleViewStatus(s)}
                title={VIEW_STATUS_LABEL[s]}
                className={`flex items-center gap-1.5 px-2 py-1 text-base border rounded transition-colors ${
                  enabled
                    ? "bg-sky-100 border-sky-500 text-sky-900 ring-1 ring-sky-400"
                    : "bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <span className="truncate">{VIEW_STATUS_LABEL[s]}</span>
                <span className="ml-auto tabular-nums text-neutral-500">
                  {viewCounts[s]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={apply}
          className={`flex-[2] px-2 py-1 text-base rounded border bg-sky-600 border-sky-600 text-white hover:bg-sky-700 ${
            dirty ? "font-bold" : ""
          }`}
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
    </div>
  );
}
