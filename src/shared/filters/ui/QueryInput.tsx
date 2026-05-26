export default function QueryInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Filter by filename…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}) {
  return (
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
      className="w-full px-2 py-1 text-base border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-500"
    />
  );
}
