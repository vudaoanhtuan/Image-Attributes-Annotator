import { useDatasetStore } from "@/store/datasetStore";
import { useLabelStore } from "@/store/labelStore";
import SingleChoice from "./attributes/SingleChoice";
import MultiChoice from "./attributes/MultiChoice";
import DirectionDisplay from "./attributes/DirectionDisplay";

export default function AttributePanel() {
  const config = useDatasetStore((s) => s.config);
  const draft = useLabelStore((s) => s.draft);
  const setSingle = useLabelStore((s) => s.setSingle);
  const toggleMulti = useLabelStore((s) => s.toggleMulti);
  const setDirection = useLabelStore((s) => s.setDirection);

  if (!config) return null;

  return (
    <div className="w-80 border-l border-neutral-200 bg-white p-4 space-y-5 overflow-y-auto">
      <h2 className="text-sm uppercase tracking-wide text-neutral-500">
        Attributes
      </h2>
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
        if (attr.type === "single") {
          return (
            <SingleChoice
              key={attr.key}
              label={attr.label}
              options={attr.options}
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
            value={(draft[attr.key] as string[] | undefined) ?? []}
            onToggle={(v) => toggleMulti(attr.key, v)}
          />
        );
      })}
    </div>
  );
}
