import { useMemo, useState } from "react";
import {
  CategorySelect,
  CATEGORY_UNSET,
  isCategorySet,
  type CategoryValue,
} from "./CategorySelect";
import { tagColors } from "./tagColor";

const NO_TAG = "__no_tag__";

export function DeleteConfirmModal({
  count,
  onCancel,
  onConfirm,
  title,
}: {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl border border-neutral-200 max-w-md w-full mx-4">
        <div className="px-5 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            {title ?? "Delete images?"}
          </h2>
        </div>
        <div className="px-5 py-4 text-sm text-neutral-700">
          Move <span className="font-semibold">{count}</span> image file
          {count === 1 ? "" : "s"} to{" "}
          <code className="px-1 bg-neutral-100 rounded">trash/</code> and remove
          their database rows? Files can be restored manually from the trash
          folder, but database labels will be lost.
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

export function MoveModal({
  count,
  onCancel,
  onConfirm,
  title,
}: {
  count: number;
  onCancel: () => void;
  onConfirm: (destSubdir: string) => void;
  title?: string;
}) {
  const [value, setValue] = useState<CategoryValue>(CATEGORY_UNSET);

  const submit = () => {
    if (!isCategorySet(value)) return;
    onConfirm(value);
  };

  const disabled = !isCategorySet(value);

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl border border-neutral-200 max-w-md w-full mx-4">
        <div className="px-5 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            {title ?? `Move ${count} image${count === 1 ? "" : "s"}`}
          </h2>
        </div>
        <div className="px-5 py-4 text-sm text-neutral-700 flex flex-col gap-2">
          <label className="block text-sm font-medium text-neutral-700">
            Destination category:
          </label>
          <CategorySelect
            value={value}
            onChange={(v) => setValue(v)}
            placeholder="Select category…"
          />
          <div className="text-xs text-neutral-500">
            Pick an existing category folder or type a new name to create one.
            <code className="ml-1 px-1 bg-neutral-100 rounded">Uncategorized</code>{" "}
            moves images to the <code>images/</code> root.
          </div>
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
            disabled={disabled}
            className="px-3 py-1 text-sm rounded border bg-sky-600 border-sky-700 text-white hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
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
              const c = isTag ? tagColors(k) : null;
              const ready = r.checked && isCategorySet(r.dest);
              const rowBg = r.checked
                ? c
                  ? { backgroundColor: c.bg, borderColor: c.border }
                  : { backgroundColor: "#f5f5f5", borderColor: "#d4d4d4" }
                : { backgroundColor: "#fafafa", borderColor: "#e5e5e5" };

              return (
                <li
                  key={k}
                  style={rowBg}
                  className={`relative flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                    r.checked ? "" : "opacity-60"
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
                    {c ? (
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-bold border"
                        style={{
                          backgroundColor: c.badgeBg,
                          color: c.badgeText,
                          borderColor: c.activeBorder,
                        }}
                      >
                        {k.toUpperCase()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[10px] font-medium border bg-white border-neutral-300 text-neutral-500">
                        N/A
                      </span>
                    )}
                    <div className="min-w-0">
                      <div
                        className="text-sm font-medium truncate"
                        style={c ? { color: c.text } : { color: "#525252" }}
                      >
                        {k === NO_TAG ? "No tag" : `Tag ${k.toUpperCase()}`}
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

export type DeleteByTagPlan = { tag: string; names: string[] };

export function DeleteByTagModal({
  groups,
  tabKeys,
  onCancel,
  onConfirm,
}: {
  groups: Map<string, string[]>;
  tabKeys: string[];
  onCancel: () => void;
  onConfirm: (plan: DeleteByTagPlan[]) => void;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const k of tabKeys) init[k] = true;
    return init;
  });

  const plan = useMemo<DeleteByTagPlan[]>(() => {
    const out: DeleteByTagPlan[] = [];
    for (const k of tabKeys) {
      if (!checked[k]) continue;
      const names = groups.get(k) ?? [];
      if (names.length === 0) continue;
      out.push({ tag: k, names });
    }
    return out;
  }, [checked, tabKeys, groups]);

  const totalImages = plan.reduce((n, p) => n + p.names.length, 0);
  const totalAvailable = tabKeys.reduce(
    (n, k) => n + (groups.get(k)?.length ?? 0),
    0,
  );
  const checkedCount = tabKeys.filter((k) => checked[k]).length;
  const allChecked = checkedCount === tabKeys.length && tabKeys.length > 0;
  const noneChecked = checkedCount === 0;
  const disabled = plan.length === 0;

  const setAllChecked = (v: boolean) => {
    const next: Record<string, boolean> = {};
    for (const k of tabKeys) next[k] = v;
    setChecked(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-2xl w-full mx-4 flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-neutral-900">
              Delete by tag
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Pick which tags to delete. Files are moved to{" "}
              <code className="px-1 bg-neutral-100 rounded">trash/</code> and
              database rows are removed.
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
              const isOn = !!checked[k];
              const names = groups.get(k) ?? [];
              const isTag = k !== NO_TAG;
              const c = isTag ? tagColors(k) : null;
              const rowBg = isOn
                ? { backgroundColor: "#fef2f2", borderColor: "#fecaca" }
                : { backgroundColor: "#fafafa", borderColor: "#e5e5e5" };

              return (
                <li
                  key={k}
                  style={rowBg}
                  className={`relative flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                    isOn ? "" : "opacity-60"
                  }`}
                >
                  <label className="flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={(e) =>
                        setChecked((prev) => ({
                          ...prev,
                          [k]: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-red-600 cursor-pointer"
                    />
                  </label>

                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {c ? (
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-bold border shrink-0"
                        style={{
                          backgroundColor: c.badgeBg,
                          color: c.badgeText,
                          borderColor: c.activeBorder,
                        }}
                      >
                        {k.toUpperCase()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[10px] font-medium border bg-white border-neutral-300 text-neutral-500 shrink-0">
                        N/A
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-sm font-medium truncate"
                        style={c ? { color: c.text } : { color: "#525252" }}
                      >
                        {k === NO_TAG ? "No tag" : `Tag ${k.toUpperCase()}`}
                      </div>
                      <div className="text-xs text-neutral-500 tabular-nums">
                        {names.length} image{names.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isOn ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M3 4h10M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Delete
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">Skip</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 rounded-b-xl flex items-center justify-between gap-3">
          <div className="text-xs text-neutral-600">
            Deleting{" "}
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
              className="px-4 py-1.5 text-sm font-medium rounded border bg-red-600 border-red-700 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed tabular-nums"
            >
              {plan.length === 0 ? "Delete" : `Delete ${totalImages}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
