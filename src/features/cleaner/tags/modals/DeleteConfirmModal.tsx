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
