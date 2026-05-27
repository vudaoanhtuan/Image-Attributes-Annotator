import { useEffect, useRef } from "react";
import { useDatasetStore } from "@/store/datasetStore";
import {
  labelStatus,
  viewStatus,
  LABEL_STATUS_BG,
  LABEL_STATUS_LABEL,
  VIEW_STATUS_LABEL,
} from "@/lib/status";
export default function ImageList() {
  const images = useDatasetStore((s) => s.images);
  const currentIndex = useDatasetStore((s) => s.currentIndex);
  const setIndex = useDatasetStore((s) => s.setIndex);
  const labels = useDatasetStore((s) => s.labels);
  const viewedSet = useDatasetStore((s) => s.viewedSet);
  const config = useDatasetStore((s) => s.config);
  const currentRowRef = useRef<HTMLDivElement>(null);

  const filteredIndices = useDatasetStore((s) => s.filteredIndices);

  useEffect(() => {
    currentRowRef.current?.scrollIntoView({ block: "nearest" });
  }, [currentIndex, filteredIndices]);

  return (
    <div className="flex-1 min-h-0 w-full border-r border-neutral-200 bg-white flex flex-col">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
        Images ({filteredIndices.length} / {images.length})
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filteredIndices.length === 0 ? (
          <div className="px-3 py-4 text-sm text-neutral-500">No matches</div>
        ) : (
          filteredIndices.map((originalIndex) => {
            const name = images[originalIndex];
            const ls = labelStatus(name, labels, config);
            const vs = viewStatus(name, viewedSet);
            const isCurrent = originalIndex === currentIndex;
            const dim = vs === "unviewed" && !isCurrent;
            return (
              <div
                key={originalIndex}
                ref={isCurrent ? currentRowRef : undefined}
                onClick={() => setIndex(originalIndex)}
                className={`flex items-center gap-2 px-3 h-8 cursor-pointer text-sm truncate ${
                  isCurrent
                    ? "bg-blue-100 text-blue-900"
                    : dim
                      ? "hover:bg-neutral-100 text-neutral-400"
                      : "hover:bg-neutral-100 text-neutral-800"
                }`}
                title={`${name} — ${LABEL_STATUS_LABEL[ls]} · ${VIEW_STATUS_LABEL[vs]}`}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full shrink-0 ${LABEL_STATUS_BG[ls]}`}
                  aria-label={LABEL_STATUS_LABEL[ls]}
                />
                <span className="truncate">{name}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
