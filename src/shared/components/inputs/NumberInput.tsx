import { useEffect, useState } from "react";
import { CloseIcon } from "@/shared/components/icons";

const toPercent = (raw: number) => Number((raw * 100).toPrecision(12));
const fromPercent = (pct: number) => Number((pct / 100).toPrecision(12));

export default function NumberInput({
  label,
  value,
  subtype,
  min,
  max,
  suffix,
  onChange,
}: {
  label?: string;
  value: number | undefined;
  subtype?: "int" | "float" | "percent";
  min?: number;
  max?: number;
  suffix?: string;
  onChange: (v: number | undefined) => void;
}) {
  const isInt = subtype === "int";
  const isPercent = subtype === "percent";
  const display = (v: number | undefined) =>
    v === undefined ? "" : String(isPercent ? toPercent(v) : v);
  const [text, setText] = useState<string>(display(value));

  useEffect(() => {
    setText(display(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    onChange(isPercent ? fromPercent(parsed) : parsed);
  };

  // For percent, compare in percent units (min/max are in percent units).
  const compareValue = isPercent && value !== undefined ? toPercent(value) : value;
  const outOfRange =
    compareValue !== undefined &&
    ((min !== undefined && compareValue < min) ||
      (max !== undefined && compareValue > max));
  const badInt = value !== undefined && isInt && !Number.isInteger(value);
  const rangeText =
    min !== undefined && max !== undefined
      ? `${min}–${max}`
      : min !== undefined
        ? `≥ ${min}`
        : max !== undefined
          ? `≤ ${max}`
          : "";
  const kindText = isInt ? "int" : isPercent ? "percent" : "float";
  const placeholder = [kindText, rangeText].filter(Boolean).join(", ");

  const invalid =
    (text !== "" && value === undefined) || outOfRange || badInt;

  const clear = () => {
    setText("");
    onChange(undefined);
  };

  const effectiveSuffix =
    suffix !== undefined ? suffix : isPercent ? "%" : undefined;
  const hasSuffix = effectiveSuffix !== undefined && effectiveSuffix !== "";
  const showSuffix = hasSuffix && text !== "";

  return (
    <div className="space-y-2">
      {label !== undefined && (
        <div className="text-base font-medium text-neutral-700">{label}</div>
      )}
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
          className={`w-full pl-3 ${hasSuffix ? "pr-14" : "pr-9"} py-1.5 rounded-md text-base border bg-white font-mono tabular-nums focus:outline-none focus:ring-1 ${
            invalid
              ? "border-red-400 text-red-600 focus:ring-red-400 focus:border-red-500"
              : "border-neutral-300 text-neutral-700 focus:ring-sky-400 focus:border-sky-500"
          }`}
        />
        {showSuffix && (
          <span className="absolute inset-y-0 right-8 flex items-center pointer-events-none text-neutral-500 font-mono tabular-nums">
            {effectiveSuffix}
          </span>
        )}
        {text !== "" && (
          <button
            type="button"
            onClick={clear}
            className="absolute inset-y-0 right-0 flex items-center justify-center w-8 text-neutral-400 hover:text-neutral-700"
            aria-label="Clear"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
