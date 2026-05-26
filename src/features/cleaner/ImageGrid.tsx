import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { FixedSizeGrid, type GridChildComponentProps } from "react-window";
import { imageUrl } from "@/lib/tauri";
import {
  labelStatus,
  LABEL_STATUS_BG,
  LABEL_STATUS_LABEL,
} from "@/lib/status";
import { useDatasetStore } from "@/store/datasetStore";
import { useCleanerStore } from "@/store/cleanerStore";

const CELL_W = 160;
const CELL_H = 180;
const GAP = 8;

export default function ImageGrid() {
  const path = useDatasetStore((s) => s.path)!;
  const images = useDatasetStore((s) => s.images);
  const labels = useDatasetStore((s) => s.labels);
  const config = useDatasetStore((s) => s.config);

  const filteredIndices = useCleanerStore((s) => s.filteredIndices);
  const selectedSet = useCleanerStore((s) => s.selectedSet);
  const toggleSelected = useCleanerStore((s) => s.toggleSelected);
  const unselectAll = useCleanerStore((s) => s.unselectAll);

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const colCount = Math.max(1, Math.floor((size.w + GAP) / (CELL_W + GAP)));
  const rowCount = Math.ceil(filteredIndices.length / colCount);

  const itemData = useMemo(
    () => ({
      colCount,
      filteredIndices,
      images,
      labels,
      config,
      selectedSet,
      path,
      onClick: (e: React.MouseEvent, name: string, idx: number) => {
        toggleSelected(name, idx, { range: e.shiftKey });
      },
    }),
    [
      colCount,
      filteredIndices,
      images,
      labels,
      config,
      selectedSet,
      path,
      toggleSelected,
    ],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      unselectAll();
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="flex-1 min-h-0 min-w-0 outline-none focus:ring-1 focus:ring-sky-300 relative"
    >
      {filteredIndices.length === 0 ? (
        <div className="h-full flex items-center justify-center text-neutral-500">
          No matches
        </div>
      ) : (
        size.w > 0 &&
        size.h > 0 && (
          <FixedSizeGrid
            columnCount={colCount}
            rowCount={rowCount}
            columnWidth={CELL_W + GAP}
            rowHeight={CELL_H + GAP}
            width={size.w}
            height={size.h}
            itemData={itemData}
          >
            {Cell}
          </FixedSizeGrid>
        )
      )}
    </div>
  );
}

function Cell({ columnIndex, rowIndex, style, data }: GridChildComponentProps) {
  const d = data as {
    colCount: number;
    filteredIndices: number[];
    images: string[];
    labels: Map<string, import("@/types/label").Label>;
    config: import("@/types/label").DatasetConfig | null;
    selectedSet: Set<string>;
    path: string;
    onClick: (e: React.MouseEvent, name: string, idx: number) => void;
  };

  const flatIndex = rowIndex * d.colCount + columnIndex;
  if (flatIndex >= d.filteredIndices.length) return null;
  const origIndex = d.filteredIndices[flatIndex];
  const name = d.images[origIndex];
  const selected = d.selectedSet.has(name);
  const ls = labelStatus(name, d.labels, d.config);

  return (
    <div style={style} className="p-1">
      <div
        onClick={(e) => d.onClick(e, name, origIndex)}
        title={`${name} — ${LABEL_STATUS_LABEL[ls]}`}
        className={`relative w-full h-full flex flex-col rounded border cursor-pointer overflow-hidden bg-white transition ${
          selected
            ? "border-sky-500 ring-2 ring-sky-300"
            : "border-neutral-300 hover:border-neutral-400"
        }`}
      >
        <div className="flex-1 min-h-0 bg-neutral-100 flex items-center justify-center">
          <img
            src={imageUrl(d.path, name)}
            alt={name}
            loading="lazy"
            draggable={false}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <div className="px-1.5 py-0.5 flex items-center gap-1 text-[11px] border-t border-neutral-200 text-neutral-700">
          <span
            className={`inline-block w-2 h-2 rounded-full shrink-0 ${LABEL_STATUS_BG[ls]}`}
            aria-label={LABEL_STATUS_LABEL[ls]}
          />
          <span className="truncate">{name}</span>
        </div>
      </div>
    </div>
  );
}
