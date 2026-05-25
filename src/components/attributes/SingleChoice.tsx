import type { AttributeOption } from "@/types/label";

export default function SingleChoice({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: AttributeOption[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-neutral-700">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(selected ? undefined : opt.value)}
              className={`px-3 py-1.5 rounded-md text-sm border transition ${
                selected
                  ? "bg-blue-600 border-blue-500 text-white"
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
