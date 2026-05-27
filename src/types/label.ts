export type AttributeValue = string | string[] | number;

export type Label = Record<string, AttributeValue | undefined>;

export type AttributeOption = { value: string; label: string };

export type AttributeSchema =
  | { key: string; label: string; type: "single"; options: AttributeOption[] }
  | { key: string; label: string; type: "multi"; options: AttributeOption[] }
  | {
      key: string;
      label: string;
      type: "direction";
      count?: number;
      startDeg?: number;
    }
  | {
      key: string;
      label: string;
      type: "number";
      subtype?: "int" | "float" | "percent";
      min?: number;
      max?: number;
      step?: number;
    };

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export type DatasetConfig = { attributes: AttributeSchema[] };
