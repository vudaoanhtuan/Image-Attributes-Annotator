import { useDatasetStore } from "@/store/datasetStore";
import { useLabelStore } from "@/store/labelStore";
import { hotkeyFor, KEY_ROWS } from "@/lib/attrHotkeys";
import SingleChoice from "./attributes/SingleChoice";
import MultiChoice from "./attributes/MultiChoice";
import DirectionDisplay from "./attributes/DirectionDisplay";
import NumberInput from "./attributes/NumberInput";

export default function AttributePanel() {
  const config = useDatasetStore((s) => s.config);
  const draft = useLabelStore((s) => s.draft);
  const setSingle = useLabelStore((s) => s.setSingle);
  const toggleMulti = useLabelStore((s) => s.toggleMulti);
  const setDirection = useLabelStore((s) => s.setDirection);
  const setNumber = useLabelStore((s) => s.setNumber);

  if (!config) return null;

  let slot = 0;

  return (
    <div className="w-80 border-l border-neutral-200 bg-white flex flex-col overflow-hidden">
      <div className="px-3 py-2 text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-200">
        Attributes
      </div>
      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
      {config.attributes.map((attr) => {
        if (attr.type === "direction") {
          const v = draft[attr.key];
          return (
            <DirectionDisplay
              key={attr.key}
              label={attr.label}
              value={typeof v === "number" ? v : undefined}
              onClear={() => setDirection(attr.key, undefined)}
            />
          );
        }
        if (attr.type === "number") {
          const v = draft[attr.key];
          return (
            <NumberInput
              key={attr.key}
              label={attr.label}
              value={typeof v === "number" ? v : undefined}
              subtype={attr.subtype}
              min={attr.min}
              max={attr.max}
              onChange={(nv) => setNumber(attr.key, nv)}
            />
          );
        }
        const currentSlot = slot < KEY_ROWS.length ? slot : -1;
        slot++;
        const hotkeys = attr.options.map((_, i) =>
          currentSlot >= 0 ? hotkeyFor(currentSlot, i) : null
        );
        if (attr.type === "single") {
          return (
            <SingleChoice
              key={attr.key}
              label={attr.label}
              options={attr.options}
              hotkeys={hotkeys}
              value={draft[attr.key] as string | undefined}
              onChange={(v) => setSingle(attr.key, v)}
            />
          );
        }
        return (
          <MultiChoice
            key={attr.key}
            label={attr.label}
            options={attr.options}
            hotkeys={hotkeys}
            value={(draft[attr.key] as string[] | undefined) ?? []}
            onToggle={(v) => toggleMulti(attr.key, v)}
          />
        );
      })}
      </div>
    </div>
  );
}
