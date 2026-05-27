import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FixedSizeList as List, type ListChildComponentProps } from "react-window";
import { useDatasetStore } from "@/store/datasetStore";
import {
  labelStatus,
  viewStatus,
  LABEL_STATUS_BG,
  LABEL_STATUS_LABEL,
  VIEW_STATUS_LABEL,
} from "@/lib/status";

const ROW_HEIGHT = 32;

type RowData = {
  filteredIndices: number[];
  images: ReturnType<typeof useDatasetStore.getState>["images"];
  labels: ReturnType<typeof useDatasetStore.getState>["labels"];
  viewedSet: ReturnType<typeof useDatasetStore.getState>["viewedSet"];
  config: ReturnType<typeof useDatasetStore.getState>["config"];
  currentIndex: number;
  setIndex: (i: number) => void;
};

function Row({ index, style, data }: ListChildComponentProps<RowData>) {
  const { filteredIndices, images, labels, viewedSet, config, currentIndex, setIndex } = data;
  const originalIndex = filteredIndices[index];
  const name = images[originalIndex];
  const ls = labelStatus(name, labels, config);
  const vs = viewStatus(name, viewedSet);
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
}

export default function ImageList() {
  const images = useDatasetStore((s) => s.images);
  const currentIndex = useDatasetStore((s) => s.currentIndex);
  const setIndex = useDatasetStore((s) => s.setIndex);
  const labels = useDatasetStore((s) => s.labels);
  const viewedSet = useDatasetStore((s) => s.viewedSet);
  const config = useDatasetStore((s) => s.config);
  const filteredIndices = useDatasetStore((s) => s.filteredIndices);

  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const pos = filteredIndices.indexOf(currentIndex);
    if (pos >= 0) listRef.current?.scrollToItem(pos, "smart");
  }, [currentIndex, filteredIndices]);

  const itemData: RowData = {
    filteredIndices,
    images,
    labels,
    viewedSet,
    config,
    currentIndex,
    setIndex,
  };

  return (
    <div className="flex-1 min-h-0 w-full border-r border-neutral-200 bg-white flex flex-col">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
        Images ({filteredIndices.length} / {images.length})
      </div>
      <div ref={containerRef} className="flex-1 min-h-0">
        {filteredIndices.length === 0 ? (
          <div className="px-3 py-4 text-sm text-neutral-500">No matches</div>
        ) : size.height > 0 ? (
          <List
            ref={listRef}
            height={size.height}
            width={size.width}
            itemCount={filteredIndices.length}
            itemSize={ROW_HEIGHT}
            itemData={itemData}
            overscanCount={8}
          >
            {Row}
          </List>
        ) : null}
      </div>
    </div>
  );
}
