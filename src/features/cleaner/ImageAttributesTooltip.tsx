import { useRef, useState, type ReactNode } from "react";
import {
  FloatingArrow,
  FloatingPortal,
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  useHover,
  useInteractions,
} from "@floating-ui/react";
import { type LabelStatus, LABEL_STATUS_LABEL } from "@/lib/status";
import type { AttributeSchema, DatasetConfig, Label } from "@/types/label";

type Props = {
  name: string;
  status: LabelStatus;
  label: Label | undefined;
  config: DatasetConfig | null;
  altHeld: boolean;
  children: (
    setReference: (node: HTMLElement | null) => void,
    referenceProps: Record<string, unknown>,
  ) => ReactNode;
};

export default function ImageAttributesTooltip({
  name,
  status,
  label,
  config,
  altHeld,
  children,
}: Props) {
  const [hovering, setHovering] = useState(false);
  const open = altHeld && hovering;
  const arrowRef = useRef<SVGSVGElement | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setHovering,
    placement: "right",
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });
  const hover = useHover(context, { move: false });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <>
      {children(refs.setReference, getReferenceProps())}
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 pointer-events-none max-w-xs rounded-md bg-neutral-900 text-white text-xs shadow-lg px-3 py-2"
          >
            <TooltipBody
              name={name}
              status={status}
              label={label}
              config={config}
            />
            <FloatingArrow
              ref={arrowRef}
              context={context}
              className="fill-neutral-900"
            />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

function TooltipBody({
  name,
  status,
  label,
  config,
}: {
  name: string;
  status: LabelStatus;
  label: Label | undefined;
  config: DatasetConfig | null;
}) {
  const rows = formatAttributes(label, config);
  return (
    <div>
      <div className="font-medium break-all">{name}</div>
      <div className="text-neutral-300 mb-1">{LABEL_STATUS_LABEL[status]}</div>
      {rows.length > 0 && (
        <div className="border-t border-neutral-700 pt-1 space-y-0.5">
          {rows.map((r) => (
            <div key={r.key} className="flex gap-2">
              <span className="text-neutral-400">{r.label}:</span>
              <span className="text-neutral-100 break-words">{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatAttributes(
  label: Label | undefined,
  config: DatasetConfig | null,
): { key: string; label: string; value: string }[] {
  if (!config) return [];
  return config.attributes.map((attr) => ({
    key: attr.key,
    label: attr.label,
    value: formatAttrValue(attr, label?.[attr.key]),
  }));
}

function formatAttrValue(attr: AttributeSchema, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (attr.type === "single") {
    const opt = attr.options.find((o) => o.value === value);
    return opt?.label ?? String(value);
  }
  if (attr.type === "multi") {
    if (!Array.isArray(value) || value.length === 0) return "—";
    return value
      .map((v) => attr.options.find((o) => o.value === v)?.label ?? String(v))
      .join(", ");
  }
  if (attr.type === "direction") {
    return typeof value === "number" ? `${value}°` : String(value);
  }
  return String(value);
}
