export interface ColorEntry {
  id: string;
  hex: string;
  order: number;
}

export interface Palette {
  id: string;
  name: string;
  colors: ColorEntry[];
  createdAt: number;
  updatedAt: number;
}
