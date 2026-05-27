import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

const DEFAULT_STEP = 160;

export default function HorizontalScroller({
  children,
  scrollStep = DEFAULT_STEP,
}: {
  children: React.ReactNode;
  scrollStep?: number;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
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
  });

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
    const inner = el.firstElementChild;
    if (inner) ro.observe(inner);
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      ro.disconnect();
    };
  }, []);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="flex-1 min-w-0 flex items-stretch relative">
      <div
        ref={scrollRef}
        className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden hide-scrollbar"
      >
        {children}
      </div>
      <ArrowButton
        direction="left"
        visible={canLeft}
        onClick={() => scrollBy(-scrollStep)}
      />
      <ArrowButton
        direction="right"
        visible={canRight}
        onClick={() => scrollBy(scrollStep)}
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
  const sidePos = direction === "left" ? "left-0" : "right-0";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      tabIndex={visible ? 0 : -1}
      className={`absolute ${sidePos} top-0 bottom-0 w-7 flex items-center justify-center bg-white text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 transition-opacity ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {direction === "left" ? (
        <ChevronLeftIcon className="w-4 h-4" />
      ) : (
        <ChevronRightIcon className="w-4 h-4" />
      )}
    </button>
  );
}
