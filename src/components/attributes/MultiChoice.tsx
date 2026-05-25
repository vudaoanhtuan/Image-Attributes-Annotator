import type { AttributeOption } from "@/types/label";

export default function MultiChoice({
  label,
  options,
  hotkeys,
  value,
  onToggle,
}: {
  label: string;
  options: AttributeOption[];
  hotkeys?: (string | null)[];
  value: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-neutral-700">{label}</div>
      <div className="flex flex-col gap-1.5">
        {options.map((opt, i) => {
          const selected = value.includes(opt.value);
          const key = hotkeys?.[i] ?? null;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={`w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-md text-sm border transition ${
                selected
                  ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm ring-1 ring-emerald-400"
                  : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100"
              }`}
              aria-pressed={selected}
            >
              <span
                className={`inline-flex items-center justify-center w-4 h-4 rounded border-2 shrink-0 ${
                  selected
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-neutral-400 bg-white"
                }`}
              >
                {selected && (
                  <svg
                    viewBox="0 0 16 16"
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 8l3.5 3.5L13 5" />
                  </svg>
                )}
              </span>
              <span className="flex-1">{opt.label}</span>
              {key && (
                <kbd className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded border border-neutral-300 bg-neutral-50 text-[10px] font-mono text-neutral-600">
                  {key}
                </kbd>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
