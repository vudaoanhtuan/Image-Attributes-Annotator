import type {
  AttributeOption,
  AttributeSchema,
  DatasetConfig,
} from "@/types/label";

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.length > 0;
}

function parseOptions(raw: unknown): AttributeOption[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: AttributeOption[] = [];
  for (const o of raw) {
    if (
      isObject(o) &&
      isNonEmptyString(o.value) &&
      isNonEmptyString(o.label)
    ) {
      out.push({ value: o.value, label: o.label });
    } else {
      return null;
    }
  }
  return out;
}

function parseAttribute(raw: unknown): AttributeSchema | null {
  if (!isObject(raw)) return null;
  const { key, label, type } = raw;
  if (!isNonEmptyString(key) || !isNonEmptyString(label)) return null;
  if (type === "single" || type === "multi") {
    const options = parseOptions(raw.options);
    if (!options) return null;
    return { key, label, type, options };
  }
  if (type === "direction") {
    const count =
      typeof raw.count === "number" && raw.count > 0 ? raw.count : undefined;
    const startDeg =
      typeof raw.startDeg === "number" ? raw.startDeg : undefined;
    return { key, label, type, count, startDeg };
  }
  return null;
}

export function parseDatasetConfig(raw: unknown): DatasetConfig | null {
  if (!isObject(raw) || !Array.isArray(raw.attributes)) return null;
  const attributes: AttributeSchema[] = [];
  for (const entry of raw.attributes) {
    const parsed = parseAttribute(entry);
    if (parsed) attributes.push(parsed);
    else console.warn("config.json: skipping invalid attribute", entry);
  }
  if (attributes.length === 0) return null;
  return { attributes };
}
