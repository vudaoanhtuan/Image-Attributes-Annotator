import { useEffect, useState } from "react";
import { useDatasetStore } from "@/store/datasetStore";
import { useCleanerStore, type CleanerReport } from "@/store/cleanerStore";
import { api } from "@/lib/tauri";
import CleanerFilters from "./CleanerFilters";
import ImageGrid from "./ImageGrid";

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
    <div className="h-full w-full flex flex-col border-t border-neutral-200">
      <div className="flex-1 flex min-h-0">
        <CleanerFilters />
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
              Move…
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
          {lastReport && <ReportBanner item={lastReport} onDismiss={dismissReport} />}
          <ImageGrid />
        </div>
      </div>
      <div className="h-7 px-3 flex items-center text-xs border-t border-neutral-200 bg-neutral-100 text-neutral-600">
        <span className="truncate" title={path ?? ""}>{path}</span>
      </div>
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
    </div>
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
          <input
            list="cleaner-subdirs"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={value}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !err) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={loading ? "Loading sub-dirs…" : "Type or pick (blank for images/ root)"}
            className="w-full px-2 py-1 border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-500"
          />
          <datalist id="cleaner-subdirs">
            {subdirs.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
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

function ReportBanner({
  item,
  onDismiss,
}: {
  item: CleanerReport;
  onDismiss: () => void;
}) {
  const failed = item.report.failed;
  const movedCount =
    item.kind === "delete" ? item.report.moved.length : item.report.moved.length;
  const hasFailures = failed.length > 0;
  const verb = item.kind === "delete" ? "Deleted" : "Moved";
  return (
    <div
      className={`px-3 py-2 border-b text-sm flex items-start gap-3 ${
        hasFailures
          ? "bg-amber-50 border-amber-200 text-amber-900"
          : "bg-emerald-50 border-emerald-200 text-emerald-900"
      }`}
    >
      <div className="flex-1">
        <div className="font-medium">
          {verb} {movedCount} · {failed.length} failed
        </div>
        {hasFailures && (
          <ul className="mt-1 text-xs list-disc list-inside">
            {failed.slice(0, 5).map((f) => (
              <li key={f.image_name}>
                <span className="font-mono">{f.image_name}</span>: {f.reason}
              </li>
            ))}
            {failed.length > 5 && (
              <li>… and {failed.length - 5} more</li>
            )}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs underline hover:no-underline"
      >
        Dismiss
      </button>
    </div>
  );
}
