import type { AttributeOption } from "@/types/label";
import Checkbox from "./Checkbox";

export default function MultiChoice({
  label,
  options,
  hotkeys,
  value,
  onToggle,
}: {
  label?: string;
  options: AttributeOption[];
  hotkeys?: (string | null)[];
  value: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {label !== undefined && (
        <div className="text-base font-medium text-neutral-700">{label}</div>
      )}
      <div className="flex flex-col gap-1.5">
        {options.map((opt, i) => {
          const selected = value.includes(opt.value);
          const key = hotkeys?.[i] ?? null;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={`w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-md text-base border transition ${
                selected
                  ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm ring-1 ring-emerald-400"
                  : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100"
              }`}
              aria-pressed={selected}
            >
              <Checkbox asIndicator checked={selected} tone="emerald" />
              <span className="flex-1">{opt.label}</span>
              {key && (
                <kbd className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded border border-neutral-300 bg-neutral-50 text-sm font-mono text-neutral-600">
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
