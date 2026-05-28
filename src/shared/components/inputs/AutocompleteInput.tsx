import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/shared/components/icons";

export type AutocompleteInputProps<T> = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (item: T) => void;
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T, active: boolean) => ReactNode;
  placeholder?: string;
  emptyMessage?: string;
  footer?: ReactNode;
};

export default function AutocompleteInput<T>({
  label,
  value,
  onChange,
  onSelect,
  items,
  getKey,
  renderItem,
  placeholder,
  emptyMessage = "No matches",
  footer,
}: AutocompleteInputProps<T>) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [popupPos, setPopupPos] = useState<{
    left: number;
    top: number;
    width: number;
    placeAbove: boolean;
    maxHeight: number;
  } | null>(null);

  useEffect(() => {
    if (highlight >= items.length) setHighlight(Math.max(0, items.length - 1));
  }, [items, highlight]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setPopupPos(null);
      return;
    }
    const compute = () => {
      const el = inputRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const gap = 4;
      const desired = 280;
      const spaceBelow = vh - r.bottom - gap - 8;
      const spaceAbove = r.top - gap - 8;
      const placeAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(
        160,
        Math.min(desired, placeAbove ? spaceAbove : spaceBelow),
      );
      setPopupPos({
        left: r.left,
        width: r.width,
        top: placeAbove ? r.top - gap : r.bottom + gap,
        placeAbove,
        maxHeight,
      });
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open || highlight < 0) return;
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const pick = (it: T) => {
    onSelect(it);
    setOpen(false);
  };

  const input = (
    <div ref={wrapRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        onFocus={(e) => {
          setOpen(true);
          e.currentTarget.select();
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!open) setOpen(true);
            if (items.length > 0)
              setHighlight((h) => (h + 1) % items.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) setOpen(true);
            if (items.length > 0)
              setHighlight((h) => (h <= 0 ? items.length - 1 : h - 1));
          } else if (e.key === "Enter") {
            if (!open) return;
            e.preventDefault();
            const it = items[highlight];
            if (it) pick(it);
          } else if (e.key === "Escape") {
            if (open) {
              e.preventDefault();
              setOpen(false);
            }
          }
        }}
        className="w-full pl-2 pr-9 py-1 text-base border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-500"
      />
      {value !== "" && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute inset-y-0 right-0 flex items-center justify-center w-8 text-neutral-400 hover:text-neutral-700"
          aria-label="Clear"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      )}
      {open &&
        popupPos &&
        createPortal(
          <div
            ref={popupRef}
            style={{
              position: "fixed",
              left: popupPos.left,
              top: popupPos.placeAbove ? undefined : popupPos.top,
              bottom: popupPos.placeAbove
                ? window.innerHeight - popupPos.top
                : undefined,
              width: popupPos.width,
              maxHeight: popupPos.maxHeight,
            }}
            className="bg-white border border-neutral-200 rounded-md shadow-xl z-[60] overflow-hidden flex flex-col"
          >
            {footer && (
              <div className="px-2 py-1 border-b border-neutral-100 shrink-0">
                {footer}
              </div>
            )}
            <ul
              ref={listRef}
              role="listbox"
              className="flex-1 min-h-0 overflow-auto py-1"
            >
              {items.length === 0 ? (
                <li className="px-2 py-1 text-sm text-neutral-500 italic">
                  {emptyMessage}
                </li>
              ) : (
                items.map((it, i) => {
                  const active = i === highlight;
                  return (
                    <li
                      key={getKey(it)}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setHighlight(i)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(it);
                      }}
                      className={`px-2 py-1 text-sm cursor-pointer ${
                        active ? "bg-sky-50" : "hover:bg-neutral-50"
                      }`}
                    >
                      {renderItem(it, active)}
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body,
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
