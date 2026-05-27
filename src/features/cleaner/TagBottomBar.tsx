import { useMemo } from "react";
import { useCleanerStore } from "@/store/cleanerStore";

export default function TagBottomBar({ onView }: { onView: () => void }) {
  const selectedSet = useCleanerStore((s) => s.selectedSet);
  const tags = useCleanerStore((s) => s.tags);
  const untagAll = useCleanerStore((s) => s.untagAll);
  const untagByTag = useCleanerStore((s) => s.untagByTag);

  const { untagged, perTag, hasAny, hasTags } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tags.values()) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    const sorted = Array.from(counts.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    let untaggedCount = 0;
    for (const name of selectedSet) {
      if (!tags.has(name)) untaggedCount++;
    }
    return {
      untagged: untaggedCount,
      perTag: sorted,
      hasAny: selectedSet.size > 0 || tags.size > 0,
      hasTags: tags.size > 0,
    };
  }, [selectedSet, tags]);

  return (
    <div className="h-full w-full px-2 flex items-center gap-1.5 border-t border-neutral-200 bg-neutral-50 text-xs">
      <NoTagChip count={untagged} />
      {perTag.length > 0 && <span className="text-neutral-300">·</span>}
      {perTag.length === 0
        ? hasAny && (
            <span className="text-neutral-500 italic">
              Press a–z or 0–9 to tag the current selection
            </span>
          )
        : perTag.map(([t, n]) => (
            <TagChip
              key={t}
              tag={t}
              count={n}
              onRemove={() => untagByTag(t)}
            />
          ))}
      <div className="flex-1" />
      <button
        type="button"
        onClick={untagAll}
        disabled={!hasTags}
        title="Remove tags from all images"
        className="px-2 py-0.5 text-xs rounded border bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Untag all
      </button>
      <button
        type="button"
        onClick={onView}
        disabled={!hasAny}
        className="px-2 py-0.5 text-xs rounded border bg-sky-600 border-sky-700 text-white hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        View
      </button>
    </div>
  );
}

function NoTagChip({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border tabular-nums text-sm bg-white text-neutral-700 border-neutral-300">
      <span className="font-medium">No tag</span>
      <span className="text-neutral-400">·</span>
      <span>{count}</span>
    </span>
  );
}

function TagChip({
  tag,
  count,
  onRemove,
}: {
  tag: string;
  count: number;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded border tabular-nums text-sm bg-amber-100 text-amber-900 border-amber-300">
      <span className="font-semibold">{tag.toUpperCase()}</span>
      <span className="text-amber-700/60">·</span>
      <span>{count}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove tag ${tag.toUpperCase()}`}
        title={`Untag all images in ${tag.toUpperCase()}`}
        className="ml-0.5 w-5 h-5 leading-none flex items-center justify-center rounded text-base text-amber-700 hover:bg-amber-200 hover:text-amber-900"
      >
        ×
      </button>
    </span>
  );
}
