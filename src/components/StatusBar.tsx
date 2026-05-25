import { useMemo } from "react";
import { useDatasetStore } from "@/store/datasetStore";
import { useLabelStore } from "@/store/labelStore";
import type { SaveStatus } from "@/types/label";
import {
  imageStatus,
  STATUS_BG,
  STATUS_LABEL,
  type ImageStatus,
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

const STATUS_ORDER: ImageStatus[] = [
  "unviewed",
  "missing",
  "incomplete",
  "complete",
];

function stem(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(0, i) : name;
}

export default function StatusBar({ onClose }: { onClose: () => void }) {
  const path = useDatasetStore((s) => s.path);
  const images = useDatasetStore((s) => s.images);
  const currentIndex = useDatasetStore((s) => s.currentIndex);
  const labels = useDatasetStore((s) => s.labels);
  const viewedSet = useDatasetStore((s) => s.viewedSet);
  const config = useDatasetStore((s) => s.config);
  const status = useLabelStore((s) => s.status);

  const counts = useMemo(() => {
    const c: Record<ImageStatus, number> = {
      unviewed: 0,
      missing: 0,
      incomplete: 0,
      complete: 0,
    };
    for (const name of images) {
      c[imageStatus(stem(name), viewedSet, labels, config)]++;
    }
    return c;
  }, [images, viewedSet, labels, config]);

  return (
    <div className="h-7 px-3 flex items-center justify-between text-xs border-t border-neutral-200 bg-neutral-100">
      <div className="flex items-center gap-4 min-w-0">
        <span className="truncate text-neutral-600" title={path ?? ""}>
          {path}
        </span>
        <button
          onClick={onClose}
          className="text-neutral-600 hover:text-neutral-900 underline-offset-2 hover:underline"
        >
          Close dataset
        </button>
      </div>
      <div className="flex items-center shrink-0 divide-x divide-neutral-300">
        {STATUS_ORDER.map((s) => (
          <span
            key={s}
            className="flex items-center gap-1 px-3 text-neutral-700"
            title={STATUS_LABEL[s]}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${STATUS_BG[s]}`}
            />
            <span className="tabular-nums text-right w-10">{counts[s]}</span>
          </span>
        ))}
        <span className="px-3 text-neutral-800 tabular-nums text-right w-[7.5rem]">
          {images.length ? currentIndex + 1 : 0} / {images.length}
        </span>
        <span className={`px-3 w-24 text-right ${STATUS_COLOR[status]}`}>
          {STATUS_TEXT[status]}
        </span>
      </div>
    </div>
  );
}
