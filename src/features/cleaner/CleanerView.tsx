import { useEffect, useRef, useState } from "react";
import { useDatasetStore } from "@/store/datasetStore";
import { useCleanerStore, type CleanerReport } from "@/store/cleanerStore";
import { api } from "@/lib/tauri";
import CleanerFilters from "./CleanerFilters";
import ImageGrid from "./ImageGrid";
import WorkspaceLayout from "@/shared/components/WorkspaceLayout";

export default function CleanerView() {
  const path = useDatasetStore((s) => s.path);
  const images = useDatasetStore((s) => s.images);

  const filteredIndices = useCleanerStore((s) => s.filteredIndices);
  const selectedSet = useCleanerStore((s) => s.selectedSet);
  const selectAllFiltered = useCleanerStore((s) => s.selectAllFiltered);
  const unselectAll = useCleanerStore((s) => s.unselectAll);
  const applyDelete = useCleanerStore((s) => s.applyDelete);
  const applyMove = useCleanerStore((s) => s.applyMove);
  const busy = useCleanerStore((s) => s.busy);
  const lastReport = useCleanerStore((s) => s.lastReport);
  const dismissReport = useCleanerStore((s) => s.dismissReport);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [movingOpen, setMovingOpen] = useState(false);

  const onConfirmDelete = async () => {
    try {
      await applyDelete();
    } finally {
      setConfirmingDelete(false);
    }
  };

  const onConfirmMove = async (destSubdir: string) => {
    try {
      await applyMove(destSubdir);
    } finally {
      setMovingOpen(false);
    }
  };

  const selCount = selectedSet.size;
  const noSelection = selCount === 0;

  return (
    <>
      <WorkspaceLayout
        className="border-t border-neutral-200"
        storageKey="cleaner-layout"
      >
        <WorkspaceLayout.LeftSideBar defaultSize={288}>
          <CleanerFilters />
        </WorkspaceLayout.LeftSideBar>
        <WorkspaceLayout.Main>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-3 py-2 flex items-center gap-2 border-b border-neutral-200 bg-white text-sm">
              <div className="flex items-center gap-3 text-neutral-700 tabular-nums">
                <Counter label="Total" value={images.length} />
                <span className="text-neutral-400">·</span>
                <Counter label="Filtered" value={filteredIndices.length} />
                <span className="text-neutral-400">·</span>
                <Counter label="Selected" value={selCount} />
              </div>
              <button
                type="button"
                onClick={selectAllFiltered}
                disabled={filteredIndices.length === 0}
                className="ml-2 px-2 py-1 text-sm rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Select all visible
              </button>
              <button
                type="button"
                onClick={unselectAll}
                disabled={noSelection}
                className="px-2 py-1 text-sm rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Deselect all visible
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setMovingOpen(true)}
                disabled={noSelection || busy}
                className="px-3 py-1 text-sm rounded border bg-white border-neutral-400 text-neutral-800 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Move
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                disabled={noSelection || busy}
                className="px-3 py-1 text-sm rounded border bg-red-600 border-red-700 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed tabular-nums"
              >
                {busy ? "Working…" : "Delete"}
              </button>
            </div>
            <ImageGrid />
          </div>
        </WorkspaceLayout.Main>
        <WorkspaceLayout.StatusBar>
          <div className="h-7 px-3 flex items-center text-xs border-t border-neutral-200 bg-neutral-100 text-neutral-600">
            <span className="truncate" title={path ?? ""}>{path}</span>
          </div>
        </WorkspaceLayout.StatusBar>
      </WorkspaceLayout>
      {confirmingDelete && (
        <DeleteConfirmModal
          count={selCount}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={onConfirmDelete}
        />
      )}
      {movingOpen && path && (
        <MoveModal
          count={selCount}
          datasetPath={path}
          onCancel={() => setMovingOpen(false)}
          onConfirm={onConfirmMove}
        />
      )}
      {lastReport && (
        <ReportSnackbar item={lastReport} onDismiss={dismissReport} />
      )}
    </>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-neutral-500">{label}:</span>
      <span className="inline-block min-w-[3ch] text-right font-medium text-neutral-800">
        {value}
      </span>
    </span>
  );
}

function DeleteConfirmModal({
  count,
  onCancel,
  onConfirm,
}: {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl border border-neutral-200 max-w-md w-full mx-4">
        <div className="px-5 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Delete images?</h2>
        </div>
        <div className="px-5 py-4 text-sm text-neutral-700">
          Move <span className="font-semibold">{count}</span> image file
          {count === 1 ? "" : "s"} to <code className="px-1 bg-neutral-100 rounded">.trash/</code> and remove their database rows? Files can be restored manually from the trash folder, but database labels will be lost.
        </div>
        <div className="px-5 py-3 border-t border-neutral-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-sm rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1 text-sm rounded border bg-red-600 border-red-700 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function validateSubdir(s: string): string | null {
  const v = s.trim().replace(/^\/+|\/+$/g, "");
  if (v === "") return null;
  if (v.includes("\\")) return "use forward slashes";
  for (const part of v.split("/")) {
    if (part === "" || part === "." || part === "..")
      return "contains an invalid path segment";
  }
  return null;
}

function SubdirCombobox({
  value,
  onChange,
  onSubmit,
  options,
  loading,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  options: string[];
  loading: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const query = value.trim().toLowerCase();
  const filtered = query
    ? options.filter((d) => d.toLowerCase().includes(query))
    : options;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHighlight(-1);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (highlight < 0) return;
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  useEffect(() => {
    setHighlight(-1);
  }, [value]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setHighlight(-1);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          autoFocus
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (!open) setOpen(true);
              setHighlight((h) =>
                filtered.length === 0 ? -1 : (h + 1) % filtered.length,
              );
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              if (!open) setOpen(true);
              setHighlight((h) =>
                filtered.length === 0
                  ? -1
                  : (h <= 0 ? filtered.length : h) - 1,
              );
            } else if (e.key === "Enter") {
              if (open && highlight >= 0 && filtered[highlight] !== undefined) {
                e.preventDefault();
                pick(filtered[highlight]);
              } else if (open) {
                e.preventDefault();
                setOpen(false);
                setHighlight(-1);
              } else {
                e.preventDefault();
                onSubmit();
              }
            } else if (e.key === "Escape") {
              if (open) {
                e.preventDefault();
                setOpen(false);
                setHighlight(-1);
              }
            } else if (e.key === "Tab") {
              setOpen(false);
              setHighlight(-1);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-2 pr-8 py-1 border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-500"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Toggle suggestions"
          onMouseDown={(e) => {
            e.preventDefault();
            setOpen((o) => !o);
          }}
          className="absolute inset-y-0 right-0 px-2 flex items-center text-neutral-500 hover:text-neutral-700"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              d="M2 4 L6 8 L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 mt-1 max-h-56 overflow-auto bg-white border border-neutral-200 rounded shadow-lg z-50 py-1"
        >
          {loading ? (
            <li className="px-2 py-1 text-sm text-neutral-500 italic">
              Loading sub-dirs…
            </li>
          ) : filtered.length === 0 ? (
            <li className="px-2 py-1 text-sm text-neutral-500 italic">
              {query ? (
                <>
                  No matching sub-dir — a new one will be created:{" "}
                  <code className="not-italic px-1 bg-neutral-100 rounded text-neutral-700">
                    {value.trim().replace(/^\/+|\/+$/g, "")}
                  </code>
                </>
              ) : (
                "No sub-dirs found"
              )}
            </li>
          ) : (
            filtered.map((d, i) => (
              <li
                key={d}
                role="option"
                aria-selected={i === highlight}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(d);
                }}
                className={`px-2 py-1 text-sm cursor-pointer ${
                  i === highlight
                    ? "bg-sky-50 text-sky-900"
                    : "text-neutral-800 hover:bg-neutral-50"
                }`}
              >
                {d}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function MoveModal({
  count,
  datasetPath,
  onCancel,
  onConfirm,
}: {
  count: number;
  datasetPath: string;
  onCancel: () => void;
  onConfirm: (destSubdir: string) => void;
}) {
  const [value, setValue] = useState("");
  const [subdirs, setSubdirs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listImageSubdirs(datasetPath)
      .then((list) => {
        if (!cancelled) setSubdirs(list);
      })
      .catch((e) => {
        console.error("listImageSubdirs failed", e);
        if (!cancelled) setSubdirs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [datasetPath]);

  const err = validateSubdir(value);
  const normalized = value.trim().replace(/^\/+|\/+$/g, "");

  const submit = () => {
    if (err) return;
    onConfirm(normalized);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl border border-neutral-200 max-w-md w-full mx-4">
        <div className="px-5 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            Move {count} image{count === 1 ? "" : "s"}
          </h2>
        </div>
        <div className="px-5 py-4 text-sm text-neutral-700 flex flex-col gap-2">
          <label className="block text-sm font-medium text-neutral-700">
            Destination sub-dir (under <code className="px-1 bg-neutral-100 rounded">images/</code>):
          </label>
          <SubdirCombobox
            value={value}
            onChange={setValue}
            onSubmit={() => {
              if (!err) submit();
            }}
            options={subdirs}
            loading={loading}
            placeholder={
              loading
                ? "Loading sub-dirs…"
                : "Type or pick (blank for images/ root)"
            }
          />
          <div className="text-xs text-neutral-500">
            Leave blank to move to the <code>images/</code> root. Images already at the destination are no-ops; same-named files at the destination are skipped.
          </div>
          {err && (
            <div className="text-xs text-red-600">Invalid path: {err}</div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-neutral-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-sm rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!!err}
            className="px-3 py-1 text-sm rounded border bg-sky-600 border-sky-700 text-white hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportSnackbar({
  item,
  onDismiss,
}: {
  item: CleanerReport;
  onDismiss: () => void;
}) {
  const failed = item.report.failed;
  const movedCount = item.report.moved.length;
  const hasFailures = failed.length > 0;
  const verb = item.kind === "delete" ? "Deleted" : "Moved";

  const timerRef = useRef<number | null>(null);
  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  const startTimer = () => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      onDismiss();
    }, 5000);
  };

  useEffect(() => {
    startTimer();
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  return (
    <div
      role="status"
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
      className={`fixed bottom-10 right-4 z-50 max-w-sm w-[22rem] rounded-lg shadow-lg border text-sm flex items-start gap-2 px-3 py-2 ${
        hasFailures
          ? "bg-amber-50 border-amber-200 text-amber-900"
          : "bg-emerald-50 border-emerald-200 text-emerald-900"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium">
          {verb} {movedCount} · {failed.length} failed
        </div>
        {hasFailures && (
          <ul className="mt-1 text-xs list-disc list-inside">
            {failed.slice(0, 5).map((f) => (
              <li key={f.image_name} className="truncate">
                <span className="font-mono">{f.image_name}</span>: {f.reason}
              </li>
            ))}
            {failed.length > 5 && <li>… and {failed.length - 5} more</li>}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className={`shrink-0 -mr-1 px-1 leading-none text-lg ${
          hasFailures
            ? "text-amber-700 hover:text-amber-900"
            : "text-emerald-700 hover:text-emerald-900"
        }`}
      >
        ×
      </button>
    </div>
  );
}
