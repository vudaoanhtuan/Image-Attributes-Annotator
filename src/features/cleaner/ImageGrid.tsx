import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FixedSizeGrid, type GridChildComponentProps } from "react-window";
import { imageUrl } from "@/lib/tauri";
import {
  labelStatus,
  LABEL_STATUS_BG,
  LABEL_STATUS_LABEL,
} from "@/lib/status";
import { useDatasetStore } from "@/store/datasetStore";
import { useCleanerStore } from "@/store/cleanerStore";
import type { DatasetConfig, Label } from "@/types/label";
import ImageAttributesTooltip from "./ImageAttributesTooltip";
import TagIcon from "./tags/TagIcon";

const CELL_W = 140;
const CELL_H = 220;
const GAP = 8;
const SCROLLBAR_W = 16;

export default function ImageGrid() {
  const path = useDatasetStore((s) => s.path)!;
  const images = useDatasetStore((s) => s.images);
  const labels = useDatasetStore((s) => s.labels);
  const config = useDatasetStore((s) => s.config);

  const filteredIndices = useCleanerStore((s) => s.filteredIndices);
  const selectedSet = useCleanerStore((s) => s.selectedSet);
  const tags = useCleanerStore((s) => s.tags);
  const toggleSelected = useCleanerStore((s) => s.toggleSelected);
  const deselectAllFiltered = useCleanerStore((s) => s.deselectAllFiltered);
  const assignTagToSelected = useCleanerStore((s) => s.assignTagToSelected);

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [altHeld, setAltHeld] = useState(false);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => setAltHeld(e.altKey);
    const onBlur = () => setAltHeld(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      if (e.key.length !== 1) return;
      const k = e.key.toLowerCase();
      if (!/^[a-z0-9]$/.test(k)) return;
      const state = useCleanerStore.getState();
      if (state.tagDialogOpen) return;
      if (state.selectedSet.size === 0) return;
      e.preventDefault();
      assignTagToSelected(k);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assignTagToSelected]);

  const innerW = Math.max(0, size.w - SCROLLBAR_W);
  const colCount = Math.max(1, Math.floor((innerW + GAP) / (CELL_W + GAP)));
  const rowCount = Math.ceil(filteredIndices.length / colCount);

  const itemData = useMemo(
    () => ({
      colCount,
      filteredIndices,
      images,
      labels,
      config,
      selectedSet,
      tags,
      path,
      altHeld,
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
      tags,
      path,
      altHeld,
      toggleSelected,
    ],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      deselectAllFiltered();
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="flex-1 min-h-0 min-w-0 outline-none relative"
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
            style={{ overflowX: "hidden" }}
            itemData={itemData}
          >
            {Cell}
          </FixedSizeGrid>
        )
      )}
    </div>
  );
}

type CellData = {
  colCount: number;
  filteredIndices: number[];
  images: string[];
  labels: Map<string, Label>;
  config: DatasetConfig | null;
  selectedSet: Set<string>;
  tags: Map<string, string>;
  path: string;
  altHeld: boolean;
  onClick: (e: React.MouseEvent, name: string, idx: number) => void;
};

function Cell({ columnIndex, rowIndex, style, data }: GridChildComponentProps) {
  const d = data as CellData;

  const flatIndex = rowIndex * d.colCount + columnIndex;
  if (flatIndex >= d.filteredIndices.length) return null;
  const origIndex = d.filteredIndices[flatIndex];
  const name = d.images[origIndex];
  const selected = d.selectedSet.has(name);
  const tag = d.tags.get(name);
  const ls = labelStatus(name, d.labels, d.config);

  return (
    <div style={style} className="p-1">
      <ImageAttributesTooltip
        name={name}
        status={ls}
        label={d.labels.get(name)}
        config={d.config}
        altHeld={d.altHeld}
      >
        {(setReference, referenceProps) => (
          <div
            ref={setReference}
            {...referenceProps}
            onClick={(e) => d.onClick(e, name, origIndex)}
            className={`relative w-full h-full flex flex-col rounded border-2 cursor-pointer overflow-hidden bg-white transition ${
              selected
                ? "border-sky-600 ring-2 ring-inset ring-sky-500"
                : "border-neutral-300 hover:border-neutral-400"
            }`}
          >
            <img
              src={imageUrl(d.path, name)}
              alt={name}
              loading="lazy"
              draggable={false}
              className="flex-1 min-h-0 w-full h-full object-contain bg-neutral-100 p-0.5"
            />
            <span
              aria-label={LABEL_STATUS_LABEL[ls]}
              className={`absolute top-1 left-1 inline-block w-2 h-2 rounded-full ${LABEL_STATUS_BG[ls]}`}
            />
            {selected && (
              <span
                aria-hidden
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shadow"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3,8.5 7,12 13,4.5" />
                </svg>
              </span>
            )}
            {tag && (
              <TagIcon
                tag={tag}
                className="absolute bottom-1 right-1 min-w-5 h-5 px-1 rounded text-xs font-semibold flex items-center justify-center shadow uppercase"
              />
            )}
          </div>
        )}
      </ImageAttributesTooltip>
    </div>
  );
}
