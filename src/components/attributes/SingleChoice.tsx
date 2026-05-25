import type { AttributeOption } from "@/types/label";

export default function SingleChoice({
  label,
  options,
  hotkeys,
  value,
  onChange,
}: {
  label: string;
  options: AttributeOption[];
  hotkeys?: (string | null)[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-neutral-700">{label}</div>
      <div className="flex flex-col gap-1.5">
        {options.map((opt, i) => {
          const selected = value === opt.value;
          const key = hotkeys?.[i] ?? null;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(selected ? undefined : opt.value)}
              className={`w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-md text-sm border transition ${
                selected
                  ? "bg-sky-100 border-sky-500 text-sky-900 shadow-sm ring-1 ring-sky-400"
                  : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100"
              }`}
              aria-pressed={selected}
            >
              <span
                className={`inline-flex items-center justify-center w-4 h-4 rounded-full border-2 shrink-0 ${
                  selected
                    ? "border-sky-600 bg-sky-600"
                    : "border-neutral-400 bg-white"
                }`}
              >
                {selected && (
                  <span className="block w-1.5 h-1.5 rounded-full bg-white" />
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
