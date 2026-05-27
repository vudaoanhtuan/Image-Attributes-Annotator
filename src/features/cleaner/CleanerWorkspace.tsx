import { useEffect, useRef, useState } from "react";
import { useDatasetStore } from "@/store/datasetStore";
import { useCleanerStore, type CleanerReport } from "@/store/cleanerStore";
import CleanerFilters from "./CleanerFilters";
import ImageGrid from "./ImageGrid";
import TagBottomBar from "./TagBottomBar";
import TagViewDialog from "./TagViewDialog";
import WorkspaceLayout from "@/shared/components/WorkspaceLayout";

export default function CleanerWorkspace() {
  const path = useDatasetStore((s) => s.path);
  const images = useDatasetStore((s) => s.images);

  const filteredIndices = useCleanerStore((s) => s.filteredIndices);
  const selectedSet = useCleanerStore((s) => s.selectedSet);
  const tags = useCleanerStore((s) => s.tags);
  const selectAllFiltered = useCleanerStore((s) => s.selectAllFiltered);
  const deselectAllFiltered = useCleanerStore((s) => s.deselectAllFiltered);
  const clearSelection = useCleanerStore((s) => s.clearSelection);
  const lastReport = useCleanerStore((s) => s.lastReport);
  const dismissReport = useCleanerStore((s) => s.dismissReport);

  const [viewOpen, setViewOpen] = useState(false);

  const selCount = selectedSet.size;
  const noSelection = selCount === 0;
  const showBottom = selCount > 0 || tags.size > 0;

  return (
    <>
      <WorkspaceLayout className="border-t border-neutral-200">
        <WorkspaceLayout.LeftSideBar>
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
                onClick={deselectAllFiltered}
                disabled={noSelection}
                className="px-2 py-1 text-sm rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Deselect all visible
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={noSelection}
                title="Clear all selected images, including those hidden by current filters"
                className="px-2 py-1 text-sm rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear selection
              </button>
            </div>
            <ImageGrid />
          </div>
        </WorkspaceLayout.Main>
        {showBottom && (
          <WorkspaceLayout.BottomSideBar
            defaultSize={52}
            minSize={52}
            maxSize={52}
          >
            <TagBottomBar onView={() => setViewOpen(true)} />
          </WorkspaceLayout.BottomSideBar>
        )}
        <WorkspaceLayout.StatusBar>
          <div className="h-7 px-3 flex items-center text-xs border-t border-neutral-200 bg-neutral-100 text-neutral-600">
            <span className="truncate" title={path ?? ""}>{path}</span>
          </div>
        </WorkspaceLayout.StatusBar>
      </WorkspaceLayout>
      {viewOpen && <TagViewDialog onClose={() => setViewOpen(false)} />}
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
