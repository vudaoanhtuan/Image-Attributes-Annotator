export const DIRECTIONS = [
  "N", "NE", "E", "SE", "S", "SW", "W", "NW",
] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const FACING_KEY = "facing";

export type AttributeValue = string | string[];

export type Label = {
  [FACING_KEY]?: Direction;
  [key: string]: AttributeValue | undefined;
};

export type AttributeOption = { value: string; label: string };

export type AttributeSchema =
  | { key: string; label: string; type: "single"; options: AttributeOption[] }
  | { key: string; label: string; type: "multi"; options: AttributeOption[] };

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";
