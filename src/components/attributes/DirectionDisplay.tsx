export default function DirectionDisplay({
  label,
  value,
  onClear,
}: {
  label: string;
  value: number | undefined;
  onClear: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-neutral-700">{label}</div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-base text-neutral-900 tabular-nums">
          {value === undefined ? "—" : `${value.toFixed(1)}°`}
        </span>
        {value !== undefined && (
          <button
            type="button"
            onClick={onClear}
            className="px-2 py-0.5 rounded text-xs border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
