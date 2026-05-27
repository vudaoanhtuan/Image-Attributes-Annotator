import { useEffect, useMemo, useState } from "react";
import {
  CategorySelect,
  CATEGORY_UNSET,
  isCategorySet,
  type CategoryValue,
} from "../../CategorySelect";
import TagIcon from "../TagIcon";
import { NO_TAG, NO_TAG_LABEL } from "../constants";
import { BADGE_CLASS } from "./shared";
import { api } from "@/lib/tauri";
import { useDatasetStore } from "@/store/datasetStore";

const TAG_SEPARATORS = new Set([".", "_", "-"]);

function autoDetectDest(
  tag: string,
  namedCategories: string[],
): CategoryValue {
  if (tag === NO_TAG) return CATEGORY_UNSET;
  const t = tag.toLowerCase();
  let match: string | null = null;
  for (const c of namedCategories) {
    if (c.length < 2) continue;
    if (c[0].toLowerCase() !== t) continue;
    if (!TAG_SEPARATORS.has(c[1])) continue;
    if (match !== null) return CATEGORY_UNSET;
    match = c;
  }
  return match ?? CATEGORY_UNSET;
}

export type MoveByTagPlan = { tag: string; dest: string; names: string[] };

export function MoveByTagModal({
  groups,
  tabKeys,
  onCancel,
  onConfirm,
}: {
  groups: Map<string, string[]>;
  tabKeys: string[];
  onCancel: () => void;
  onConfirm: (plan: MoveByTagPlan[]) => void;
}) {
  type RowState = { checked: boolean; dest: CategoryValue };
  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const init: Record<string, RowState> = {};
    for (const k of tabKeys) {
      init[k] = { checked: true, dest: CATEGORY_UNSET };
    }
    return init;
  });

  const datasetPath = useDatasetStore((s) => s.path);

  useEffect(() => {
    if (!datasetPath) return;
    let cancelled = false;
    api
      .listImageSubdirs(datasetPath)
      .then((subdirs) => {
        if (cancelled) return;
        const namedCategories = subdirs.filter((s) => !s.includes("/"));
        setRows((prev) => {
          let changed = false;
          const next: Record<string, RowState> = { ...prev };
          for (const k of tabKeys) {
            const r = next[k];
            if (!r || isCategorySet(r.dest)) continue;
            const auto = autoDetectDest(k, namedCategories);
            if (isCategorySet(auto)) {
              next[k] = { ...r, dest: auto };
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetPath]);

  const plan = useMemo<MoveByTagPlan[]>(() => {
    const out: MoveByTagPlan[] = [];
    for (const k of tabKeys) {
      const r = rows[k];
      if (!r || !r.checked) continue;
      if (!isCategorySet(r.dest)) continue;
      const names = groups.get(k) ?? [];
      if (names.length === 0) continue;
      out.push({ tag: k, dest: r.dest, names });
    }
    return out;
  }, [rows, tabKeys, groups]);

  const totalImages = plan.reduce((n, p) => n + p.names.length, 0);
  const totalAvailable = tabKeys.reduce(
    (n, k) => n + (groups.get(k)?.length ?? 0),
    0,
  );
  const checkedCount = tabKeys.filter((k) => rows[k]?.checked).length;
  const allChecked = checkedCount === tabKeys.length && tabKeys.length > 0;
  const noneChecked = checkedCount === 0;
  const missingDest = tabKeys.some(
    (k) => rows[k]?.checked && !isCategorySet(rows[k]!.dest),
  );
  const disabled = plan.length === 0 || missingDest;

  const setAllChecked = (checked: boolean) => {
    setRows((prev) => {
      const next: Record<string, RowState> = {};
      for (const k of tabKeys) {
        next[k] = { ...(prev[k] ?? { dest: CATEGORY_UNSET, checked }), checked };
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-3xl w-full mx-4 flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-neutral-900">
              Move by tag
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Pick a destination category for each tag. Rows without a
              destination are skipped.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setAllChecked(true)}
              disabled={allChecked}
              className="px-2 py-1 rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => setAllChecked(false)}
              disabled={noneChecked}
              className="px-2 py-1 rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto px-6 py-4">
          <ul className="flex flex-col gap-2">
            {tabKeys.map((k) => {
              const r = rows[k];
              if (!r) return null;
              const names = groups.get(k) ?? [];
              const isTag = k !== NO_TAG;
              const ready = r.checked && isCategorySet(r.dest);

              return (
                <li
                  key={k}
                  className={`relative flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                    r.checked
                      ? "bg-neutral-100 border-neutral-300"
                      : "bg-neutral-50 border-neutral-200 opacity-60"
                  }`}
                >
                  <label className="flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={r.checked}
                      onChange={(e) =>
                        setRows((prev) => ({
                          ...prev,
                          [k]: { ...prev[k], checked: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-sky-600 cursor-pointer"
                    />
                  </label>

                  <div className="flex items-center gap-2 shrink-0 w-40">
                    {isTag ? (
                      <TagIcon tag={k} className={BADGE_CLASS} />
                    ) : (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[10px] font-medium border bg-white border-neutral-300 text-neutral-500">
                        N/A
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate text-neutral-700">
                        {k === NO_TAG ? NO_TAG_LABEL : `Tag ${k.toUpperCase()}`}
                      </div>
                      <div className="text-xs text-neutral-500 tabular-nums">
                        {names.length} image{names.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-neutral-400">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8h10M9 4l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div
                    className={`flex-1 min-w-0 ${
                      r.checked ? "" : "pointer-events-none"
                    }`}
                  >
                    <CategorySelect
                      value={r.dest}
                      onChange={(v) =>
                        setRows((prev) => ({
                          ...prev,
                          [k]: { ...prev[k], dest: v },
                        }))
                      }
                      placeholder="Select destination…"
                    />
                  </div>

                  <div className="shrink-0 w-5 flex justify-center">
                    {ready ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        className="text-emerald-600"
                      >
                        <path
                          d="M3 8.5l3 3 6.5-6.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : r.checked ? (
                      <span
                        className="text-amber-500"
                        title="Pick a destination"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16">
                          <circle
                            cx="8"
                            cy="8"
                            r="6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M8 5v3.5M8 11v.01"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 rounded-b-xl flex items-center justify-between gap-3">
          <div className="text-xs text-neutral-600">
            Moving{" "}
            <span className="font-semibold text-neutral-900 tabular-nums">
              {totalImages}
            </span>
            {" / "}
            <span className="tabular-nums">{totalAvailable}</span> image
            {totalAvailable === 1 ? "" : "s"} across{" "}
            <span className="font-semibold tabular-nums">{plan.length}</span> tag
            {plan.length === 1 ? "" : "s"}.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-1.5 text-sm font-medium rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(plan)}
              disabled={disabled}
              title={
                missingDest
                  ? "Pick a destination for every checked tag"
                  : undefined
              }
              className="px-4 py-1.5 text-sm font-medium rounded border bg-sky-600 border-sky-700 text-white hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed tabular-nums"
            >
              {plan.length === 0 ? "Move" : `Move ${totalImages}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
