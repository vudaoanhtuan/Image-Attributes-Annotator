import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useCleanerStore } from "@/store/cleanerStore";
import { tagColors } from "./tagColor";

const SCROLL_STEP = 160;

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

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const recompute = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useLayoutEffect(() => {
    recompute();
  }, [perTag.length, untagged]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => recompute();
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      ro.disconnect();
    };
  }, []);

  const scrollBy = (delta: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="h-full w-full flex items-stretch border-t border-neutral-200 bg-neutral-50 text-xs">
      <ArrowButton
        direction="left"
        visible={canLeft}
        onClick={() => scrollBy(-SCROLL_STEP)}
      />
      <div
        ref={scrollRef}
        className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden hide-scrollbar"
      >
        <div
          ref={innerRef}
          className="h-full pl-2 pr-1 flex items-center gap-1.5 w-max whitespace-nowrap"
        >
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
      </div>
      <ArrowButton
        direction="right"
        visible={canRight}
        onClick={() => scrollBy(SCROLL_STEP)}
      />
    </div>
  );
}

function ArrowButton({
  direction,
  visible,
  onClick,
}: {
  direction: "left" | "right";
  visible: boolean;
  onClick: () => void;
}) {
  const side = direction === "left" ? "border-r" : "border-l";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      tabIndex={visible ? 0 : -1}
      className={`shrink-0 w-7 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 ${side} border-neutral-200 transition-opacity ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {direction === "left" ? "‹" : "›"}
    </button>
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
