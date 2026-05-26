import { useMemo } from "react";
import { useDatasetStore } from "@/store/datasetStore";
import { useLabelStore } from "@/store/labelStore";
import type { SaveStatus } from "@/types/label";
import {
  labelStatus,
  viewStatus,
  LABEL_STATUS_BG,
  LABEL_STATUS_LABEL,
  LABEL_STATUS_ORDER,
  VIEW_STATUS_BG,
  VIEW_STATUS_LABEL,
  VIEW_STATUS_ORDER,
  type LabelStatus,
  type ViewStatus,
} from "@/lib/status";

const STATUS_TEXT: Record<SaveStatus, string> = {
  idle: "—",
  dirty: "Unsaved",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

const STATUS_COLOR: Record<SaveStatus, string> = {
  idle: "text-neutral-500",
  dirty: "text-amber-600",
  saving: "text-blue-600",
  saved: "text-emerald-600",
  error: "text-red-600",
};

function stem(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(0, i) : name;
}

export default function StatusBar() {
  const path = useDatasetStore((s) => s.path);
  const images = useDatasetStore((s) => s.images);
  const labels = useDatasetStore((s) => s.labels);
  const viewedSet = useDatasetStore((s) => s.viewedSet);
  const config = useDatasetStore((s) => s.config);
  const imageSize = useDatasetStore((s) => s.imageSize);
  const status = useLabelStore((s) => s.status);

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
  }, [images, viewedSet, labels, config]);

  return (
    <div className="h-7 px-3 flex items-center justify-between text-xs border-t border-neutral-200 bg-neutral-100">
      <div className="flex items-center gap-4 min-w-0">
        <span className="truncate text-neutral-600" title={path ?? ""}>
          {path}
        </span>
      </div>
      <div className="flex items-center shrink-0 divide-x divide-neutral-300">
        <span className="px-3 text-neutral-700 tabular-nums text-right w-24">
          {imageSize ? `${imageSize.width} × ${imageSize.height}` : "—"}
        </span>
        {LABEL_STATUS_ORDER.map((s) => (
          <span
            key={s}
            className="flex items-center gap-1 px-3 text-neutral-700"
            title={LABEL_STATUS_LABEL[s]}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${LABEL_STATUS_BG[s]}`}
            />
            <span className="tabular-nums text-right w-10">
              {labelCounts[s]}
            </span>
          </span>
        ))}
        {VIEW_STATUS_ORDER.map((s) => (
          <span
            key={s}
            className="flex items-center gap-1 px-3 text-neutral-700"
            title={VIEW_STATUS_LABEL[s]}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${VIEW_STATUS_BG[s]}`}
            />
            <span className="tabular-nums text-right w-10">
              {viewCounts[s]}
            </span>
          </span>
        ))}
        <span className={`px-3 w-24 text-right ${STATUS_COLOR[status]}`}>
          {STATUS_TEXT[status]}
        </span>
      </div>
    </div>
  );
}
