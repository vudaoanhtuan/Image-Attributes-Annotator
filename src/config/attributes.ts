import type { AttributeSchema } from "@/types/label";

export const ATTRIBUTES: AttributeSchema[] = [
  {
    key: "facing",
    label: "Facing",
    type: "direction",
    count: 8,
    startDeg: 0,
  },
  {
    key: "gender",
    label: "Gender",
    type: "single",
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  {
    key: "accessories",
    label: "Accessories",
    type: "multi",
    options: [
      { value: "glass", label: "Glasses" },
      { value: "hat", label: "Hat" },
      { value: "bag", label: "Bag" },
      { value: "mask", label: "Mask" },
    ],
  },
];
