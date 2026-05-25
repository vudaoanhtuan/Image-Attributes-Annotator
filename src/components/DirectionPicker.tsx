import type { Direction } from "@/types/label";
import { DIRECTIONS } from "@/types/label";
import { useLabelStore } from "@/store/labelStore";
import ImageViewer from "./ImageViewer";

// Position each direction on a 560x560 stage. Center is (50%,50%).
// Offsets place buttons just outside the 400px image box.
const POSITIONS: Record<Direction, { top: string; left: string }> = {
  N:  { top: "0%",   left: "50%" },
  NE: { top: "10%",  left: "90%" },
  E:  { top: "50%",  left: "100%" },
  SE: { top: "90%",  left: "90%" },
  S:  { top: "100%", left: "50%" },
  SW: { top: "90%",  left: "10%" },
  W:  { top: "50%",  left: "0%" },
  NW: { top: "10%",  left: "10%" },
};

export default function DirectionPicker({
  datasetPath,
  imageName,
}: {
  datasetPath: string;
  imageName: string;
}) {
  const facing = useLabelStore((s) => s.draft.facing) as Direction | undefined;
  const setFacing = useLabelStore((s) => s.setFacing);

  return (
    <div className="relative" style={{ width: 560, height: 560 }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <ImageViewer datasetPath={datasetPath} imageName={imageName} />
      </div>
      {DIRECTIONS.map((dir) => {
        const pos = POSITIONS[dir];
        const selected = facing === dir;
        return (
          <button
            key={dir}
            type="button"
            onClick={() => setFacing(selected ? undefined : dir)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full text-sm font-semibold border-2 transition
              ${
                selected
                  ? "bg-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-300"
                  : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100 shadow-sm"
              }`}
            style={{ top: pos.top, left: pos.left }}
            aria-label={`Facing ${dir}`}
            aria-pressed={selected}
          >
            {dir}
          </button>
        );
      })}
    </div>
  );
}
