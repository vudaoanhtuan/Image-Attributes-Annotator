import {
  LABEL_STATUS_BG,
  LABEL_STATUS_LABEL,
  LABEL_STATUS_ORDER,
  VIEW_STATUS_LABEL,
  VIEW_STATUS_ORDER,
  type LabelStatus,
  type ViewStatus,
} from "@/lib/status";

function StatusFilter<T extends string>({
  title,
  order,
  labels,
  dotColors,
  selected,
  onToggle,
  onClear,
  counts,
  clearAriaLabel,
}: {
  title?: string;
  order: readonly T[];
  labels: Record<T, string>;
  dotColors?: Record<T, string>;
  selected: Set<T>;
  onToggle: (s: T) => void;
  onClear?: () => void;
  counts?: Record<T, number>;
  clearAriaLabel?: string;
}) {
  const showHeader = title !== undefined || (onClear && selected.size > 0);
  return (
    <div className="flex flex-col gap-1">
      {showHeader && (
        <div className="flex items-center text-base font-medium text-neutral-700">
          {title !== undefined && <span>{title}</span>}
          {onClear && selected.size > 0 && (
            <button
              type="button"
              onClick={onClear}
              aria-label={clearAriaLabel ?? `Clear ${title ?? ""} filter`.trim()}
              title="Clear"
              className="ml-auto px-1 leading-none text-neutral-400 hover:text-neutral-700"
            >
              ✕
            </button>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-1">
        {order.map((s) => {
          const enabled = selected.has(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => onToggle(s)}
              title={labels[s]}
              className={`flex items-center gap-1.5 px-2 py-1 text-base border rounded transition-colors ${
                enabled
                  ? "bg-sky-100 border-sky-500 text-sky-900 ring-1 ring-sky-400"
                  : "bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {dotColors && (
                <span
                  className={`inline-block w-2 h-2 rounded-full shrink-0 ${dotColors[s]}`}
                />
              )}
              <span className="truncate">{labels[s]}</span>
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

export function LabelStatusFilter(props: {
  selected: Set<LabelStatus>;
  onToggle: (s: LabelStatus) => void;
  onClear?: () => void;
  counts?: Record<LabelStatus, number>;
}) {
  return (
    <StatusFilter
      title="Label status"
      order={LABEL_STATUS_ORDER}
      labels={LABEL_STATUS_LABEL}
      dotColors={LABEL_STATUS_BG}
      clearAriaLabel="Clear label status filter"
      {...props}
    />
  );
}

export function ViewStatusFilter(props: {
  selected: Set<ViewStatus>;
  onToggle: (s: ViewStatus) => void;
  onClear?: () => void;
  counts?: Record<ViewStatus, number>;
}) {
  return (
    <StatusFilter
      title="View status"
      order={VIEW_STATUS_ORDER}
      labels={VIEW_STATUS_LABEL}
      clearAriaLabel="Clear view status filter"
      {...props}
    />
  );
}
