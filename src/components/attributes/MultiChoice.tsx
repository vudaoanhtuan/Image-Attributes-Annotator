import type { AttributeOption } from "@/types/label";

export default function MultiChoice({
  label,
  options,
  value,
  onToggle,
}: {
  label: string;
  options: AttributeOption[];
  value: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-neutral-700">{label}</div>
      <div className="flex flex-col gap-1.5">
        {options.map((opt) => {
          const selected = value.includes(opt.value);
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
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
