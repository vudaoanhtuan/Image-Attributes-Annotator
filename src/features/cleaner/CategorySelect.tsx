import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDatasetStore } from "@/store/datasetStore";
import { UNCATEGORIZED, collectCategories } from "./category";

const UNCATEGORIZED_LABEL = "Uncategorized";
const UNSET = "__unset__";

export type CategoryValue = string | typeof UNSET;
export const CATEGORY_UNSET: CategoryValue = UNSET;

export function isCategorySet(v: CategoryValue): v is string {
  return v !== UNSET;
}

export function categoryLabel(v: CategoryValue): string {
  if (v === UNSET) return "—";
  if (v === UNCATEGORIZED) return UNCATEGORIZED_LABEL;
  return v;
}

function validateNewCategory(s: string): string | null {
  const v = s.trim();
  if (v === "") return "name required";
  if (v.includes("/") || v.includes("\\"))
    return "must be a single folder name";
  if (v === "." || v === "..") return "invalid name";
  return null;
}

export function CategorySelect({
  value,
  onChange,
  placeholder,
  size = "md",
}: {
  value: CategoryValue;
  onChange: (v: string) => void;
  placeholder?: string;
  size?: "sm" | "md";
}) {
  const images = useDatasetStore((s) => s.images);
  const categories = useMemo(() => collectCategories(images), [images]);
  const namedCategories = useMemo(
    () => categories.filter((c) => c !== UNCATEGORIZED),
    [categories],
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [popupPos, setPopupPos] = useState<{
    left: number;
    top: number;
    width: number;
    placeAbove: boolean;
    maxHeight: number;
  } | null>(null);

  const q = query.trim().toLowerCase();
  const filteredNamed = useMemo(
    () => namedCategories.filter((c) => !q || c.toLowerCase().includes(q)),
    [namedCategories, q],
  );

  const trimmed = query.trim();
  const newErr = trimmed === "" ? null : validateNewCategory(query);
  const showCreate =
    trimmed !== "" &&
    !newErr &&
    !namedCategories.some((c) => c === trimmed);

  type Item =
    | { kind: "uncat" }
    | { kind: "named"; name: string }
    | { kind: "create"; name: string };

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    if (!q || UNCATEGORIZED_LABEL.toLowerCase().includes(q)) {
      out.push({ kind: "uncat" });
    }
    for (const c of filteredNamed) out.push({ kind: "named", name: c });
    if (showCreate) out.push({ kind: "create", name: trimmed });
    return out;
  }, [q, filteredNamed, showCreate, trimmed]);

  useEffect(() => {
    if (highlight >= items.length) setHighlight(Math.max(0, items.length - 1));
  }, [items, highlight]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHighlight(0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

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
      const el = triggerRef.current;
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

  const pickItem = (it: Item) => {
    if (it.kind === "uncat") onChange(UNCATEGORIZED);
    else if (it.kind === "named") onChange(it.name);
    else onChange(it.name);
    setOpen(false);
  };

  const triggerPad =
    size === "sm" ? "px-2.5 py-1 text-sm" : "px-3 py-2 text-sm";

  const displayLabel =
    value === UNSET
      ? (placeholder ?? "Select category…")
      : categoryLabel(value);

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full ${triggerPad} flex items-center justify-between gap-2 border border-neutral-300 rounded-md bg-white hover:bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-500 text-left ${open ? "ring-1 ring-sky-400 border-sky-500" : ""}`}
      >
        <span
          className={`truncate ${
            value === UNSET
              ? "text-neutral-400"
              : value === UNCATEGORIZED
                ? "text-neutral-600 italic"
                : "text-neutral-800"
          }`}
        >
          {displayLabel}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`shrink-0 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2 4 L6 8 L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && popupPos && createPortal(
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
          <div className="p-1.5 border-b border-neutral-100 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  if (items.length > 0)
                    setHighlight((h) => (h + 1) % items.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  if (items.length > 0)
                    setHighlight((h) => (h <= 0 ? items.length - 1 : h - 1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const it = items[highlight];
                  if (it) pickItem(it);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setOpen(false);
                }
              }}
              placeholder="Search or type new name…"
              className="w-full px-2 py-1 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-500"
            />
            {newErr && trimmed !== "" && (
              <div className="px-1 pt-1 text-xs text-red-600">{newErr}</div>
            )}
          </div>
          <ul
            ref={listRef}
            role="listbox"
            className="flex-1 min-h-0 overflow-auto py-1"
          >
            {items.length === 0 ? (
              <li className="px-2 py-1 text-sm text-neutral-500 italic">
                No matches
              </li>
            ) : (
              items.map((it, i) => {
                const active = i === highlight;
                const key =
                  it.kind === "uncat"
                    ? "__uncat__"
                    : it.kind === "create"
                      ? `__create__${it.name}`
                      : `n:${it.name}`;
                const label =
                  it.kind === "uncat"
                    ? UNCATEGORIZED_LABEL
                    : it.kind === "create"
                      ? `+ Create "${it.name}"`
                      : it.name;
                const cls =
                  it.kind === "uncat"
                    ? "italic text-neutral-600"
                    : it.kind === "create"
                      ? "text-sky-700"
                      : "text-neutral-800";
                return (
                  <li
                    key={key}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pickItem(it);
                    }}
                    className={`px-2 py-1 text-sm cursor-pointer ${cls} ${
                      active ? "bg-sky-50" : "hover:bg-neutral-50"
                    }`}
                  >
                    {label}
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
}
