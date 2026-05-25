import type { DatasetConfig } from "@/types/label";

export const KEY_ROWS: string[][] = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

export type HotkeyAction =
  | { type: "single"; attrKey: string; value: string }
  | { type: "multi"; attrKey: string; value: string };

export function buildHotkeyMap(
  config: DatasetConfig | null
): Map<string, HotkeyAction> {
  const map = new Map<string, HotkeyAction>();
  if (!config) return map;
  let slot = 0;
  for (const attr of config.attributes) {
    if (attr.type !== "single" && attr.type !== "multi") continue;
    if (slot >= KEY_ROWS.length) break;
    const row = KEY_ROWS[slot];
    attr.options.slice(0, row.length).forEach((opt, i) => {
      map.set(row[i], { type: attr.type, attrKey: attr.key, value: opt.value });
    });
    slot++;
  }
  return map;
}

export function hotkeyFor(
  attrSlot: number,
  optionIndex: number
): string | null {
  const row = KEY_ROWS[attrSlot];
  if (!row) return null;
  const k = row[optionIndex];
  return k ? k.toUpperCase() : null;
}
