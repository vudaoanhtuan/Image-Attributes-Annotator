import { useLayoutEffect, useRef, useState } from "react";
import { useLabelStore } from "@/store/labelStore";
import ImageViewer from "./ImageViewer";

const STAGE = 640;
const ARROW_LEN = 280;
const DEAD_ZONE = 8;

function norm(deg: number) {
  // Normalize to [-180, 180)
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function snap(deg: number, count: number, startDeg: number) {
  const step = 360 / count;
  const k = Math.round((deg - startDeg) / step);
  return norm(startDeg + k * step);
}

export default function DirectionPicker({
  datasetPath,
  imageName,
  attrKey,
  count,
  startDeg = 0,
}: {
  datasetPath: string;
  imageName: string;
  attrKey: string;
  count?: number;
  startDeg?: number;
}) {
  const raw = useLabelStore((s) => s.draft[attrKey]);
  const setDirection = useLabelStore((s) => s.setDirection);
  const value = typeof raw === "number" ? raw : undefined;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const parent = wrapperRef.current?.parentElement;
    if (!parent) return;
    const update = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w === 0 || h === 0) return;
      setScale(Math.min(1, w / STAGE, h / STAGE));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  const cx = STAGE / 2;
  const cy = STAGE / 2;

  const arrowEnd =
    value === undefined
      ? null
      : {
          x: cx + ARROW_LEN * Math.cos((value * Math.PI) / 180),
          y: cy + ARROW_LEN * Math.sin((value * Math.PI) / 180),
        };

  const angleFromEvent = (e: React.PointerEvent<HTMLDivElement>): number | null => {
    const el = stageRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) < DEAD_ZONE * scale) return null;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    deg = norm(deg);
    if (count && count > 0) deg = snap(deg, count, startDeg);
    return round1(deg);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const deg = angleFromEvent(e);
    if (deg !== null) setDirection(attrKey, deg);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLElement;
    if (!el.hasPointerCapture(e.pointerId)) return;
    const deg = angleFromEvent(e);
    if (deg !== null) setDirection(attrKey, deg);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={wrapperRef}
      style={{ width: STAGE * scale, height: STAGE * scale }}
    >
      <div
        ref={stageRef}
        className="relative cursor-crosshair touch-none select-none"
        style={{
          width: STAGE,
          height: STAGE,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <ImageViewer datasetPath={datasetPath} imageName={imageName} />
        </div>
        {arrowEnd && (
          <svg
            className="absolute inset-0 pointer-events-none"
            width={STAGE}
            height={STAGE}
            viewBox={`0 0 ${STAGE} ${STAGE}`}
          >
            <defs>
              <marker
                id="dir-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill="#2563eb" />
              </marker>
            </defs>
            <line
              x1={cx}
              y1={cy}
              x2={arrowEnd.x}
              y2={arrowEnd.y}
              stroke="#2563eb"
              strokeWidth={3}
              strokeLinecap="round"
              markerEnd="url(#dir-arrow)"
            />
            <circle cx={cx} cy={cy} r={4} fill="#2563eb" />
          </svg>
        )}
      </div>
    </div>
  );
}
