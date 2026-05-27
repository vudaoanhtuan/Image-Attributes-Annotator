import { useState } from "react";
import {
  CategorySelect,
  CATEGORY_UNSET,
  isCategorySet,
  type CategoryValue,
} from "../../CategorySelect";

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
