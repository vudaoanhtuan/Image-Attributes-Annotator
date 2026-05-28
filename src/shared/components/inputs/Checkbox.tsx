import { CheckIcon, MinusIcon } from "@/shared/components/icons";

type Tone = "sky" | "red" | "emerald";

const TONE_FILLED: Record<Tone, string> = {
  sky: "bg-sky-500 border-sky-500",
  red: "bg-red-600 border-red-600",
  emerald: "bg-emerald-600 border-emerald-600",
};

type BaseProps = {
  checked: boolean | "mixed";
  tone?: Tone;
  disabled?: boolean;
  title?: string;
  "aria-label"?: string;
};

export type CheckboxProps =
  | (BaseProps & { onChange: (next: boolean) => void; asIndicator?: false })
  | (BaseProps & { onChange?: never; asIndicator: true });

export default function Checkbox({
  checked,
  onChange,
  tone = "sky",
  disabled = false,
  title,
  asIndicator = false,
  "aria-label": ariaLabel,
}: CheckboxProps) {
  const isOn = checked === true;
  const isMixed = checked === "mixed";
  const filled = isOn || isMixed;

  const boxClass = `inline-flex items-center justify-center w-4 h-4 rounded border shrink-0 ${
    filled ? TONE_FILLED[tone] : "bg-white border-neutral-400"
  } ${disabled && !asIndicator ? "opacity-50 cursor-not-allowed" : ""} ${
    !asIndicator && !disabled ? "cursor-pointer" : ""
  }`;

  const inner = isOn ? (
    <CheckIcon className="w-3 h-3 text-white" />
  ) : isMixed ? (
    <MinusIcon className="w-3 h-3 text-white" />
  ) : null;

  if (asIndicator) {
    return (
      <span aria-hidden="true" className={boxClass}>
        {inner}
      </span>
    );
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isMixed ? "mixed" : isOn}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={() => onChange!(!isOn)}
      className={boxClass}
    >
      {inner}
    </button>
  );
}
