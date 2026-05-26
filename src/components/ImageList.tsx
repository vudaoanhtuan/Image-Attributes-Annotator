import { FixedSizeList as List } from "react-window";
import { useEffect, useMemo, useRef } from "react";
import { useDatasetStore } from "@/store/datasetStore";
import {
  labelStatus,
  viewStatus,
  LABEL_STATUS_BG,
  LABEL_STATUS_LABEL,
  VIEW_STATUS_LABEL,
} from "@/lib/status";
import ImageFilters from "./ImageFilters";

const ROW_HEIGHT = 32;

function stem(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(0, i) : name;
}

export default function ImageList() {
  const images = useDatasetStore((s) => s.images);
  const currentIndex = useDatasetStore((s) => s.currentIndex);
  const setIndex = useDatasetStore((s) => s.setIndex);
  const labels = useDatasetStore((s) => s.labels);
  const viewedSet = useDatasetStore((s) => s.viewedSet);
  const config = useDatasetStore((s) => s.config);
  const listRef = useRef<List>(null);

  const filteredIndices = useDatasetStore((s) => s.filteredIndices);

  const visibleIdx = useMemo(
    () => filteredIndices.indexOf(currentIndex),
    [filteredIndices, currentIndex],
  );

  useEffect(() => {
    if (visibleIdx >= 0) {
      listRef.current?.scrollToItem(visibleIdx, "smart");
    }
  }, [visibleIdx]);

  return (
    <div className="h-full w-64 border-r border-neutral-200 bg-white flex flex-col">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
        Images ({filteredIndices.length} / {images.length})
      </div>
      <ImageFilters />
      <div className="flex-1">
        {filteredIndices.length === 0 ? (
          <div className="px-3 py-4 text-sm text-neutral-500">No matches</div>
        ) : (
          <List
            ref={listRef}
            height={window.innerHeight - 80}
            width={256}
            itemCount={filteredIndices.length}
            itemSize={ROW_HEIGHT}
          >
            {({ index, style }) => {
              const originalIndex = filteredIndices[index];
              const name = images[originalIndex];
              const st = stem(name);
              const ls = labelStatus(st, labels, config);
              const vs = viewStatus(st, viewedSet);
              const isCurrent = originalIndex === currentIndex;
              const dim = vs === "unviewed" && !isCurrent;
              return (
                <div
                  style={style}
                  onClick={() => setIndex(originalIndex)}
                  className={`flex items-center gap-2 px-3 cursor-pointer text-sm truncate ${
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
            }}
          </List>
        )}
      </div>
    </div>
  );
}
