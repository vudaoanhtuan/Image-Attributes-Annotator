export default function TextInput({
  label,
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}) {
  const input = (
    <div className="relative">
      <input
        type="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        placeholder={placeholder}
        className="w-full pl-2 pr-9 py-1 text-base border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-500"
      />
      {value !== "" && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 flex items-center justify-center w-8 text-neutral-400 hover:text-neutral-700"
          aria-label="Clear"
        >
          ✕
        </button>
      )}
    </div>
  );

  if (label === undefined) return input;
  return (
    <div className="space-y-2">
      <div className="text-base font-medium text-neutral-700">{label}</div>
      {input}
    </div>
  );
}
