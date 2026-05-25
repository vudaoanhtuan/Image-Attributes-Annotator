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
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={`px-3 py-1.5 rounded-md text-sm border transition ${
                selected
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100"
              }`}
              aria-pressed={selected}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
