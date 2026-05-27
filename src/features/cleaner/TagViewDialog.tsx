import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FixedSizeGrid, type GridChildComponentProps } from "react-window";
import { imageUrl } from "@/lib/tauri";
import { useDatasetStore } from "@/store/datasetStore";
import { useCleanerStore } from "@/store/cleanerStore";
import { DeleteConfirmModal, MoveModal } from "./modals";

const CELL_W = 140;
const CELL_H = 220;
const GAP = 8;
const SCROLLBAR_W = 16;

const NO_TAG = "__no_tag__";

export default function TagViewDialog({ onClose }: { onClose: () => void }) {
  const path = useDatasetStore((s) => s.path);
  const selectedSet = useCleanerStore((s) => s.selectedSet);
  const tags = useCleanerStore((s) => s.tags);
  const removeFromSelection = useCleanerStore((s) => s.removeFromSelection);
  const applyDelete = useCleanerStore((s) => s.applyDelete);
  const applyMove = useCleanerStore((s) => s.applyMove);
  const busy = useCleanerStore((s) => s.busy);
  const setTagDialogOpen = useCleanerStore((s) => s.setTagDialogOpen);

  useEffect(() => {
    setTagDialogOpen(true);
    return () => setTagDialogOpen(false);
  }, [setTagDialogOpen]);

  // Group: "No tag" = selectedSet minus tag-keys; each tag tab = tags.get===t.
  // Tags are independent of selectedSet.
  const { groups, tabKeys } = useMemo(() => {
    const map = new Map<string, string[]>();
    const noTag: string[] = [];
    for (const name of selectedSet) {
      if (!tags.has(name)) noTag.push(name);
    }
    noTag.sort();
    map.set(NO_TAG, noTag);
    for (const [name, t] of tags.entries()) {
      let arr = map.get(t);
      if (!arr) {
        arr = [];
        map.set(t, arr);
      }
      arr.push(name);
    }
    for (const [k, arr] of map.entries()) {
      if (k !== NO_TAG) arr.sort();
    }
    const keys: string[] = [];
    if (noTag.length > 0) keys.push(NO_TAG);
    const tagKeys = Array.from(map.keys())
      .filter((k) => k !== NO_TAG)
      .sort();
    keys.push(...tagKeys);
    return { groups: map, tabKeys: keys };
  }, [selectedSet, tags]);

  const [activeTab, setActiveTab] = useState<string>(() => tabKeys[0] ?? NO_TAG);
  const [focusedName, setFocusedName] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [movingOpen, setMovingOpen] = useState(false);

  // Keep activeTab valid as groups change
  useEffect(() => {
    if (tabKeys.length === 0) {
      onClose();
      return;
    }
    if (!tabKeys.includes(activeTab)) {
      setActiveTab(tabKeys[0]);
    }
  }, [tabKeys, activeTab, onClose]);

  const currentNames = groups.get(activeTab) ?? [];

  // Reset focused image when tab changes or focused image leaves
  useEffect(() => {
    if (focusedName && !currentNames.includes(focusedName)) {
      setFocusedName(null);
    }
  }, [currentNames, focusedName]);

  // Keyboard: Escape close, x deselect
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      if (e.key === "Escape") {
        if (confirmingDelete || movingOpen) return;
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "x" || e.key === "X") {
        if (!focusedName) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();
        const idx = currentNames.indexOf(focusedName);
        removeFromSelection(focusedName);
        const next = currentNames[idx + 1] ?? currentNames[idx - 1] ?? null;
        setFocusedName(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    focusedName,
    currentNames,
    removeFromSelection,
    onClose,
    confirmingDelete,
    movingOpen,
  ]);

  const onConfirmDelete = async () => {
    try {
      await applyDelete(currentNames);
    } finally {
      setConfirmingDelete(false);
    }
  };

  const onConfirmMove = async (destSubdir: string) => {
    try {
      await applyMove(destSubdir, currentNames);
    } finally {
      setMovingOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center">
      <div
        style={{ width: "90vw", height: "90vh" }}
        className="bg-white rounded-lg shadow-xl border border-neutral-200 flex flex-col overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-neutral-200 flex items-center">
          <h2 className="text-lg font-semibold text-neutral-900">
            Selected images by tag
          </h2>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="px-2 leading-none text-2xl text-neutral-500 hover:text-neutral-800"
          >
            ×
          </button>
        </div>
        <div className="px-3 pt-2 border-b border-neutral-200 flex items-end gap-1 overflow-x-auto">
          {tabKeys.map((k) => {
            const count = groups.get(k)?.length ?? 0;
            const active = k === activeTab;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setActiveTab(k)}
                className={`px-3 py-1.5 text-sm rounded-t border border-b-0 -mb-px ${
                  active
                    ? "bg-white border-neutral-300 text-neutral-900 font-medium"
                    : "bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {k === NO_TAG ? "No tag" : k.toUpperCase()}
                <span className="ml-1.5 text-neutral-500 tabular-nums">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex-1 min-h-0 bg-neutral-50">
          {path && (
            <TabGrid
              names={currentNames}
              path={path}
              focusedName={focusedName}
              onFocus={setFocusedName}
            />
          )}
        </div>
        <div className="px-5 py-3 border-t border-neutral-200 flex items-center justify-between gap-2 bg-white">
          <div className="text-xs text-neutral-500">
            Click an image to focus it, then press{" "}
            <kbd className="px-1 py-0.5 border border-neutral-300 rounded bg-neutral-100 text-neutral-700">
              x
            </kbd>{" "}
            to remove it from the selection.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMovingOpen(true)}
              disabled={currentNames.length === 0 || busy}
              className="px-3 py-1 text-sm rounded border bg-white border-neutral-400 text-neutral-800 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Move ({currentNames.length})
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={currentNames.length === 0 || busy}
              className="px-3 py-1 text-sm rounded border bg-red-600 border-red-700 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed tabular-nums"
            >
              {busy ? "Working…" : `Delete (${currentNames.length})`}
            </button>
          </div>
        </div>
      </div>
      {confirmingDelete && (
        <DeleteConfirmModal
          count={currentNames.length}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={onConfirmDelete}
        />
      )}
      {movingOpen && path && (
        <MoveModal
          count={currentNames.length}
          datasetPath={path}
          onCancel={() => setMovingOpen(false)}
          onConfirm={onConfirmMove}
        />
      )}
    </div>
  );
}

type CellData = {
  colCount: number;
  names: string[];
  path: string;
  focusedName: string | null;
  onClick: (name: string) => void;
};

function TabGrid({
  names,
  path,
  focusedName,
  onFocus,
}: {
  names: string[];
  path: string;
  focusedName: string | null;
  onFocus: (name: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const innerW = Math.max(0, size.w - SCROLLBAR_W);
  const colCount = Math.max(1, Math.floor((innerW + GAP) / (CELL_W + GAP)));
  const rowCount = Math.ceil(names.length / colCount);

  const itemData = useMemo<CellData>(
    () => ({
      colCount,
      names,
      path,
      focusedName,
      onClick: onFocus,
    }),
    [colCount, names, path, focusedName, onFocus],
  );

  return (
    <div ref={containerRef} className="w-full h-full min-h-0 min-w-0 relative">
      {names.length === 0 ? (
        <div className="h-full flex items-center justify-center text-neutral-500">
          No images in this tag
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

function Cell({ columnIndex, rowIndex, style, data }: GridChildComponentProps) {
  const d = data as CellData;
  const flatIndex = rowIndex * d.colCount + columnIndex;
  if (flatIndex >= d.names.length) return null;
  const name = d.names[flatIndex];
  const focused = name === d.focusedName;
  return (
    <div style={style} className="p-1">
      <div
        onClick={() => d.onClick(name)}
        className={`relative w-full h-full flex flex-col rounded border-2 cursor-pointer overflow-hidden bg-white transition ${
          focused
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
      </div>
    </div>
  );
}
