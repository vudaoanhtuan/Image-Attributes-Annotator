import { useDatasetStore } from "@/store/datasetStore";
import { useLabelStore } from "@/store/labelStore";
import type { SaveStatus } from "@/types/label";

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

export default function StatusBar() {
  const path = useDatasetStore((s) => s.path);
  const imageSize = useDatasetStore((s) => s.imageSize);
  const status = useLabelStore((s) => s.status);

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
        <span className={`px-3 w-24 text-right ${STATUS_COLOR[status]}`}>
          {STATUS_TEXT[status]}
        </span>
      </div>
    </div>
  );
}
