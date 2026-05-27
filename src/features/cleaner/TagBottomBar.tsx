import { useMemo } from "react";
import { useCleanerStore } from "@/store/cleanerStore";
import HorizontalScroller from "@/shared/components/HorizontalScroller";
import { tagColors } from "./tagColor";

export default function TagBottomBar() {
  const selectedSet = useCleanerStore((s) => s.selectedSet);
  const tags = useCleanerStore((s) => s.tags);
  const untagByTag = useCleanerStore((s) => s.untagByTag);

  const { untagged, perTag, hasAny } = useMemo(() => {
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
    };
  }, [selectedSet, tags]);

  return (
    <div className="h-full w-full flex items-stretch border-t border-neutral-200 bg-neutral-50 text-xs">
      <HorizontalScroller>
        <div className="h-full pl-2 pr-1 flex items-center gap-1.5 w-max whitespace-nowrap">
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
        </div>
      </HorizontalScroller>
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
  const c = tagColors(tag);
  return (
    <span className="inline-flex items-center gap-1.5 pl-0.5 pr-0.5 py-0.5 rounded border border-neutral-300 bg-white tabular-nums text-sm text-neutral-700">
      <span
        aria-label={`tag ${tag.toUpperCase()}`}
        className="w-5 h-5 rounded flex items-center justify-center text-xs font-semibold uppercase"
        style={{ backgroundColor: c.badgeBg, color: c.badgeText }}
      >
        {tag}
      </span>
      <span>{count}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove tag ${tag.toUpperCase()}`}
        title={`Untag all images in ${tag.toUpperCase()}`}
        className="w-5 h-5 leading-none flex items-center justify-center rounded text-base text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
      >
        ×
      </button>
    </span>
  );
}
