import {
  LABEL_STATUS_BG,
  LABEL_STATUS_LABEL,
  LABEL_STATUS_ORDER,
  VIEW_STATUS_LABEL,
  VIEW_STATUS_ORDER,
  type LabelStatus,
  type ViewStatus,
} from "@/lib/status";

export function LabelStatusButtons({
  selected,
  onToggle,
  counts,
}: {
  selected: Set<LabelStatus>;
  onToggle: (s: LabelStatus) => void;
  counts?: Record<LabelStatus, number>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-base text-neutral-600">Label status</div>
      <div className="grid grid-cols-1 gap-1">
        {LABEL_STATUS_ORDER.map((s) => {
          const enabled = selected.has(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => onToggle(s)}
              title={LABEL_STATUS_LABEL[s]}
              className={`flex items-center gap-1.5 px-2 py-1 text-base border rounded transition-colors ${
                enabled
                  ? "bg-sky-100 border-sky-500 text-sky-900 ring-1 ring-sky-400"
                  : "bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full shrink-0 ${LABEL_STATUS_BG[s]}`}
              />
              <span className="truncate">{LABEL_STATUS_LABEL[s]}</span>
              {counts && (
                <span className="ml-auto tabular-nums text-neutral-500">
                  {counts[s]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ViewStatusButtons({
  selected,
  onToggle,
  counts,
}: {
  selected: Set<ViewStatus>;
  onToggle: (s: ViewStatus) => void;
  counts?: Record<ViewStatus, number>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-base text-neutral-600">View status</div>
      <div className="grid grid-cols-1 gap-1">
        {VIEW_STATUS_ORDER.map((s) => {
          const enabled = selected.has(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => onToggle(s)}
              title={VIEW_STATUS_LABEL[s]}
              className={`flex items-center gap-1.5 px-2 py-1 text-base border rounded transition-colors ${
                enabled
                  ? "bg-sky-100 border-sky-500 text-sky-900 ring-1 ring-sky-400"
                  : "bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span className="truncate">{VIEW_STATUS_LABEL[s]}</span>
              {counts && (
                <span className="ml-auto tabular-nums text-neutral-500">
                  {counts[s]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
