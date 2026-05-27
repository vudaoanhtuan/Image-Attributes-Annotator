import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  MinusIcon,
} from "@/shared/components/icons";

export type MultiSelectOption<V extends string | number = string> = {
  value: V;
  label: string;
};

type Props<V extends string | number> = {
  label?: string;
  options: MultiSelectOption<V>[];
  selected: Set<V>;
  onChange: (next: Set<V>) => void;
  placeholder?: string;
  searchPlaceholder?: string;
};

export default function MultiSelectDropdown<V extends string | number>({
  label,
  options,
  selected,
  onChange,
  placeholder = "All",
  searchPlaceholder = "Search…",
}: Props<V>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

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
      {label && (
        <div className="text-base text-neutral-700 font-medium">{label}</div>
      )}
      <div className="relative">
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
          {selected.size > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(new Set());
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
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 min-w-0 px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:border-sky-500"
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
