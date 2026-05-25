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

export default function StatusBar({ onClose }: { onClose: () => void }) {
  const path = useDatasetStore((s) => s.path);
  const images = useDatasetStore((s) => s.images);
  const currentIndex = useDatasetStore((s) => s.currentIndex);
  const labeledSet = useDatasetStore((s) => s.labeledSet);
  const status = useLabelStore((s) => s.status);

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
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-neutral-800">
          {images.length ? currentIndex + 1 : 0} / {images.length}
        </span>
        <span className="text-neutral-500">
          Labeled {labeledSet.size}/{images.length}
        </span>
        <span className={STATUS_COLOR[status]}>{STATUS_TEXT[status]}</span>
      </div>
    </div>
  );
}
