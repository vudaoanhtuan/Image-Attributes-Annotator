import { useEffect, useMemo, useState } from "react";
import { useDatasetStore, EMPTY_FILTERS } from "@/store/datasetStore";
import {
  labelStatus,
  viewStatus,
  type LabelStatus,
  type ViewStatus,
} from "@/lib/status";
import TextInput from "@/shared/components/inputs/TextInput";
import {
  LabelStatusFilter,
  ViewStatusFilter,
} from "@/shared/filters/ui/StatusFilter";

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
      lc[labelStatus(name, labels, config)]++;
      vc[viewStatus(name, viewedSet)]++;
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
      attrs: applied.attrs,
    });
  };

  const reset = () => {
    setQuery("");
    setLabelStatuses(new Set());
    setViewStatuses(new Set());
    setFilters(EMPTY_FILTERS);
  };

  return (
    <div className="flex flex-col border-b border-r border-neutral-200 bg-white">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
        Filters
      </div>
      <div className="px-3 py-2 flex flex-col gap-3">
        <TextInput
          value={query}
          onChange={setQuery}
          onSubmit={apply}
          label="File name"
          placeholder="Filter by filename"
        />
        <LabelStatusFilter
          selected={labelStatuses}
          onToggle={toggleLabelStatus}
          onClear={() => setLabelStatuses(new Set())}
          counts={labelCounts}
        />
        <ViewStatusFilter
          selected={viewStatuses}
          onToggle={toggleViewStatus}
          onClear={() => setViewStatuses(new Set())}
          counts={viewCounts}
        />
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
