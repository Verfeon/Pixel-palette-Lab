export type ColorKind = "main" | "shade";

export interface ColorEntry {
  id: string;
  hex: string;
  order: number;
  kind: ColorKind;
  /** For shade colors, the ID of the main color they belong to. Null for main colors. */
  mainColorId: string | null;
}

export interface Palette {
  id: string;
  name: string;
  colors: ColorEntry[];
  createdAt: number;
  updatedAt: number;
}
