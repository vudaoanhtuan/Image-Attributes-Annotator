import { useMemo, useState } from "react";
import TagIcon from "../TagIcon";
import { NO_TAG, NO_TAG_LABEL } from "../constants";
import { BADGE_CLASS } from "./shared";

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

              return (
                <li
                  key={k}
                  className={`relative flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                    isOn
                      ? "bg-red-50 border-red-200"
                      : "bg-neutral-50 border-neutral-200 opacity-60"
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
                    {isTag ? (
                      <TagIcon tag={k} className={BADGE_CLASS} />
                    ) : (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[10px] font-medium border bg-white border-neutral-300 text-neutral-500 shrink-0">
                        N/A
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate text-neutral-700">
                        {k === NO_TAG ? NO_TAG_LABEL : `Tag ${k.toUpperCase()}`}
                      </div>
                      <div className="text-xs text-neutral-500 tabular-nums">
                        {names.length} image{names.length === 1 ? "" : "s"}
                      </div>
                    </div>
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
