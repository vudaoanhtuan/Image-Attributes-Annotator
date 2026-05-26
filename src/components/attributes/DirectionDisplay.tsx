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
      <div className="text-base font-medium text-neutral-700">{label}</div>
      <div className="relative">
        <div className="w-full pl-3 pr-9 py-1.5 rounded-md text-base border border-neutral-300 bg-white text-neutral-700 font-mono tabular-nums">
          {value === undefined ? (
            <span className="text-neutral-400">—</span>
          ) : (
            `${value.toFixed(1)}°`
          )}
        </div>
        {value !== undefined && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-0 flex items-center justify-center w-8 text-neutral-400 hover:text-neutral-700"
            aria-label="Clear"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
