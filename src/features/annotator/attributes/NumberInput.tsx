import { useEffect, useState } from "react";

export default function NumberInput({
  label,
  value,
  subtype,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number | undefined;
  subtype?: "int" | "float";
  min?: number;
  max?: number;
  onChange: (v: number | undefined) => void;
}) {
  const isInt = subtype === "int";
  const [text, setText] = useState<string>(value === undefined ? "" : String(value));

  useEffect(() => {
    setText(value === undefined ? "" : String(value));
  }, [value]);

  const sanitize = (raw: string) => {
    const neg = raw.startsWith("-");
    const allowed = isInt ? /[^0-9]/g : /[^0-9.]/g;
    let s = raw.replace(allowed, "");
    if (!isInt) {
      const i = s.indexOf(".");
      if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, "");
    }
    return neg ? "-" + s : s;
  };

  const commit = (raw: string) => {
    const s = sanitize(raw);
    setText(s);
    if (s === "" || s === "." || s === "-" || s === "-.") {
      onChange(undefined);
      return;
    }
    const parsed = Number(s);
    if (!Number.isFinite(parsed)) {
      onChange(undefined);
      return;
    }
    if (isInt && !Number.isInteger(parsed)) {
      onChange(undefined);
      return;
    }
    onChange(parsed);
  };

  const outOfRange =
    value !== undefined &&
    ((min !== undefined && value < min) || (max !== undefined && value > max));
  const badInt = value !== undefined && isInt && !Number.isInteger(value);
  const rangeText =
    min !== undefined && max !== undefined
      ? `${min}–${max}`
      : min !== undefined
        ? `≥ ${min}`
        : max !== undefined
          ? `≤ ${max}`
          : "";
  const placeholder = [isInt ? "int" : "float", rangeText]
    .filter(Boolean)
    .join(", ");

  const invalid =
    (text !== "" && value === undefined) || outOfRange || badInt;

  const clear = () => {
    setText("");
    onChange(undefined);
  };

  return (
    <div className="space-y-2">
      <div className="text-base font-medium text-neutral-700">{label}</div>
      <div className="relative">
        <input
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode={isInt ? "numeric" : "decimal"}
          value={text}
          placeholder={placeholder}
          onChange={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className={`w-full pl-3 pr-9 py-1.5 rounded-md text-base border bg-white focus:outline-none focus:ring-1 ${
            invalid
              ? "border-red-400 text-red-600 focus:ring-red-400 focus:border-red-500"
              : "border-neutral-300 text-neutral-700 focus:ring-sky-400 focus:border-sky-500"
          }`}
        />
        {text !== "" && (
          <button
            type="button"
            onClick={clear}
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
