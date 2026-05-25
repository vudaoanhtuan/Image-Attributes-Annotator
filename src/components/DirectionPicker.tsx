import { useLabelStore } from "@/store/labelStore";
import ImageViewer from "./ImageViewer";

const STAGE = 640;
const R = 300;
const BUTTON_RADIUS = 10; // half of w-5/h-5 (20px)

function norm(deg: number) {
  return ((deg % 360) + 360) % 360;
}

function angularDist(a: number, b: number) {
  const d = Math.abs(norm(a) - norm(b));
  return Math.min(d, 360 - d);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default function DirectionPicker({
  datasetPath,
  imageName,
  attrKey,
  count = 16,
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

  const step = 360 / count;
  const tolerance = step / 2;

  const angles = Array.from({ length: count }, (_, i) => norm(startDeg + i * step));

  const selectedIndex =
    value === undefined
      ? -1
      : angles.reduce(
          (best, a, i) => {
            const d = angularDist(a, value);
            if (d < best.d && d < tolerance) return { i, d };
            return best;
          },
          { i: -1, d: Infinity }
        ).i;

  const cx = STAGE / 2;
  const cy = STAGE / 2;

  const toXY = (deg: number) => {
    const r = (deg * Math.PI) / 180;
    return { x: cx + R * Math.sin(r), y: cy - R * Math.cos(r) };
  };

  let arrowEnd: { x: number; y: number } | null = null;
  if (value !== undefined) {
    const p = toXY(value);
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy);
    const k = (len - BUTTON_RADIUS - 2) / len;
    arrowEnd = { x: cx + dx * k, y: cy + dy * k };
  }

  return (
    <div className="relative" style={{ width: STAGE, height: STAGE }}>
      <div className="absolute inset-0 flex items-center justify-center">
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
      {angles.map((deg, i) => {
        const p = toXY(deg);
        const selected = i === selectedIndex;
        const stored = round1(deg);
        return (
          <button
            key={i}
            type="button"
            onClick={() =>
              setDirection(attrKey, selected ? undefined : stored)
            }
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 transition
              ${
                selected
                  ? "bg-blue-600 border-blue-400 ring-2 ring-blue-300"
                  : "bg-white border-neutral-400 hover:bg-neutral-100"
              }`}
            style={{ top: p.y, left: p.x }}
            aria-label={`${deg}°`}
            aria-pressed={selected}
            title={`${stored}°`}
          />
        );
      })}
    </div>
  );
}
