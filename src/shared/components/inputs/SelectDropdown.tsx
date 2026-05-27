import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  MinusIcon,
} from "@/shared/components/icons";

export type SelectOption<V extends string | number = string> = {
  value: V;
  label: string;
};

// Back-compat alias for callers that imported the older name.
export type MultiSelectOption<V extends string | number = string> = SelectOption<V>;

type CommonProps<V extends string | number> = {
  label?: string;
  options: SelectOption<V>[];
  placeholder?: string;
  searchPlaceholder?: string;
};

type MultiProps<V extends string | number> = CommonProps<V> & {
  selected: Set<V>;
  onChange: (next: Set<V>) => void;
};

type SingleProps<V extends string | number> = CommonProps<V> & {
  selected: V | null;
  onChange: (next: V | null) => void;
};

function useDropdownOpen(): {
  open: boolean;
  setOpen: (next: boolean | ((o: boolean) => boolean)) => void;
  rootRef: RefObject<HTMLDivElement>;
} {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, rootRef };
}

function useFilteredOptions<V extends string | number>(
  options: SelectOption<V>[],
  query: string,
): SelectOption<V>[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);
}

function Trigger({
  open,
  setOpen,
  summary,
  showClear,
  onClear,
}: {
  open: boolean;
  setOpen: (next: boolean | ((o: boolean) => boolean)) => void;
  summary: ReactNode;
  showClear: boolean;
  onClear: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setOpen((o) => !o)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((o) => !o);
        }
      }}
      className="w-full flex items-center gap-2 px-2 py-1 text-base rounded border bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100 cursor-pointer focus:outline-none focus:border-sky-500"
    >
      <span className="flex-1 min-w-0 truncate text-left">{summary}</span>
      {showClear && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          title="Clear selection"
          aria-label="Clear selection"
          className="shrink-0 inline-flex items-center justify-center text-neutral-400 hover:text-neutral-700"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      )}
      <ChevronDownIcon
        className={`w-4 h-4 shrink-0 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
      />
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 min-w-0 px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:border-sky-500"
    />
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="text-base text-neutral-700 font-medium">{children}</div>;
}

export default function MultiSelectDropdown<V extends string | number>({
  label,
  options,
  selected,
  onChange,
  placeholder = "All",
  searchPlaceholder = "Search…",
}: MultiProps<V>) {
  const { open, setOpen, rootRef } = useDropdownOpen();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const visible = useFilteredOptions(options, query);

  const summary = useMemo(() => {
    if (selected.size === 0) return placeholder;
    if (selected.size === 1) {
      for (const o of options) if (selected.has(o.value)) return o.label;
    }
    return `${selected.size} selected`;
  }, [selected, options, placeholder]);

  const toggle = (v: V) => {
    const n = new Set(selected);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    onChange(n);
  };

  const visibleSelectedCount = visible.reduce(
    (n, o) => n + (selected.has(o.value) ? 1 : 0),
    0,
  );
  const allVisibleSelected =
    visible.length > 0 && visibleSelectedCount === visible.length;
  const someVisibleSelected =
    visibleSelectedCount > 0 && !allVisibleSelected;

  const toggleAllVisible = () => {
    const n = new Set(selected);
    if (allVisibleSelected) for (const o of visible) n.delete(o.value);
    else for (const o of visible) n.add(o.value);
    onChange(n);
  };

  return (
    <div className="flex flex-col gap-1" ref={rootRef}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="relative">
        <Trigger
          open={open}
          setOpen={setOpen}
          summary={summary}
          showClear={selected.size > 0}
          onClear={() => onChange(new Set())}
        />
        {open && (
          <div className="absolute z-10 mt-1 left-0 right-0 bg-white border border-neutral-300 rounded shadow-lg flex flex-col max-h-72">
            <div className="p-2 border-b border-neutral-200 flex items-center gap-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={
                  allVisibleSelected
                    ? "true"
                    : someVisibleSelected
                      ? "mixed"
                      : "false"
                }
                onClick={toggleAllVisible}
                disabled={visible.length === 0}
                title={allVisibleSelected ? "Deselect all" : "Select all"}
                className={`inline-flex items-center justify-center w-4 h-4 rounded border shrink-0 ${
                  allVisibleSelected || someVisibleSelected
                    ? "bg-sky-500 border-sky-500"
                    : "bg-white border-neutral-400"
                } ${visible.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {allVisibleSelected ? (
                  <CheckIcon className="w-3 h-3 text-white" />
                ) : someVisibleSelected ? (
                  <MinusIcon className="w-3 h-3 text-white" />
                ) : null}
              </button>
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder={searchPlaceholder}
              />
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {visible.length === 0 ? (
                <div className="px-3 py-2 text-sm text-neutral-500">No matches</div>
              ) : (
                visible.map((o) => {
                  const on = selected.has(o.value);
                  return (
                    <button
                      key={String(o.value)}
                      type="button"
                      onClick={() => toggle(o.value)}
                      className={`w-full flex items-center gap-2 px-2 py-1 text-sm text-left ${
                        on ? "bg-sky-50 text-sky-900" : "text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-4 h-4 rounded border ${
                          on ? "bg-sky-500 border-sky-500" : "bg-white border-neutral-400"
                        }`}
                      >
                        {on && <CheckIcon className="w-3 h-3 text-white" />}
                      </span>
                      <span className="truncate">{o.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SingleSelectDropdown<V extends string | number>({
  label,
  options,
  selected,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
}: SingleProps<V>) {
  const { open, setOpen, rootRef } = useDropdownOpen();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const visible = useFilteredOptions(options, query);

  const summary = useMemo(() => {
    if (selected === null) return placeholder;
    for (const o of options) if (o.value === selected) return o.label;
    return placeholder;
  }, [selected, options, placeholder]);

  const pick = (v: V) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1" ref={rootRef}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="relative">
        <Trigger
          open={open}
          setOpen={setOpen}
          summary={summary}
          showClear={selected !== null}
          onClear={() => onChange(null)}
        />
        {open && (
          <div className="absolute z-10 mt-1 left-0 right-0 bg-white border border-neutral-300 rounded shadow-lg flex flex-col max-h-72">
            <div className="p-2 border-b border-neutral-200 flex items-center gap-2">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder={searchPlaceholder}
              />
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {visible.length === 0 ? (
                <div className="px-3 py-2 text-sm text-neutral-500">No matches</div>
              ) : (
                visible.map((o) => {
                  const on = selected === o.value;
                  return (
                    <button
                      key={String(o.value)}
                      type="button"
                      onClick={() => pick(o.value)}
                      className={`w-full flex items-center gap-2 px-2 py-1 text-sm text-left ${
                        on ? "bg-sky-50 text-sky-900" : "text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      <span className="inline-flex items-center justify-center w-4 h-4 shrink-0">
                        {on && <CheckIcon className="w-3.5 h-3.5 text-sky-600" />}
                      </span>
                      <span className="truncate">{o.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
