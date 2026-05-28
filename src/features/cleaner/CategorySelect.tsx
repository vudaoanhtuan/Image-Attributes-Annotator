import { useEffect, useMemo, useState } from "react";
import { useDatasetStore } from "@/store/datasetStore";
import { UNCATEGORIZED } from "./category";
import AutocompleteInput from "@/shared/components/inputs/AutocompleteInput";

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

type Item =
  | { kind: "uncat" }
  | { kind: "named"; name: string }
  | { kind: "create"; name: string };

function displayText(v: CategoryValue): string {
  if (v === UNSET) return "";
  if (v === UNCATEGORIZED) return UNCATEGORIZED_LABEL;
  return v;
}

export function CategorySelect({
  value,
  onChange,
  placeholder,
}: {
  value: CategoryValue;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const categories = useDatasetStore((s) => s.categories);
  const namedCategories = useMemo(
    () => categories.filter((c) => c !== UNCATEGORIZED),
    [categories],
  );

  const [query, setQuery] = useState<string>(() => displayText(value));

  useEffect(() => {
    setQuery(displayText(value));
  }, [value]);

  const trimmed = query.trim();
  const q = trimmed.toLowerCase();
  const newErr = trimmed === "" ? null : validateNewCategory(query);
  const showCreate =
    trimmed !== "" &&
    !newErr &&
    !namedCategories.some((c) => c === trimmed) &&
    trimmed.toLowerCase() !== UNCATEGORIZED_LABEL.toLowerCase();

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    if (!q || UNCATEGORIZED_LABEL.toLowerCase().includes(q)) {
      out.push({ kind: "uncat" });
    }
    for (const c of namedCategories) {
      if (!q || c.toLowerCase().includes(q)) {
        out.push({ kind: "named", name: c });
      }
    }
    if (showCreate) out.push({ kind: "create", name: trimmed });
    return out;
  }, [q, namedCategories, showCreate, trimmed]);

  const pick = (it: Item) => {
    if (it.kind === "uncat") onChange(UNCATEGORIZED);
    else onChange(it.name);
  };

  return (
    <AutocompleteInput<Item>
      value={query}
      onChange={setQuery}
      onSelect={pick}
      items={items}
      getKey={(it) =>
        it.kind === "uncat"
          ? "__uncat__"
          : it.kind === "create"
            ? `__create__${it.name}`
            : `n:${it.name}`
      }
      renderItem={(it) =>
        it.kind === "uncat" ? (
          <span className="italic text-neutral-600">{UNCATEGORIZED_LABEL}</span>
        ) : it.kind === "create" ? (
          <span className="text-sky-700">{`+ Create "${it.name}"`}</span>
        ) : (
          <span className="text-neutral-800">{it.name}</span>
        )
      }
      placeholder={placeholder ?? "Select category…"}
      footer={
        newErr && trimmed !== "" ? (
          <div className="text-xs text-red-600">{newErr}</div>
        ) : null
      }
    />
  );
}
