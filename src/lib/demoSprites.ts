/**
 * Demo sprite definitions for Pixel Palette Lab.
 *
 * Each sprite is a grid of pixels where each cell is a color slot index.
 * - -1 = transparent
 * - 0..n = index into defaultColors / slotLabels arrays
 *
 * Sprites are stored as compact string grids for readability.
 * Convert with parseSpriteGrid() at runtime.
 */

// ─── Sprite types ───────────────────────────────────────────────────

export interface SpriteData {
  name: string;
  width: number;
  height: number;
  /** Flat array of slot indices (row-major), -1 = transparent */
  pixels: Int8Array;
  /** Default colors for each slot (hex) */
  defaultColors: string[];
  /** Human-readable labels for each slot */
  slotLabels: string[];
}

export interface SpriteSlotMap {
  /** Index of the palette color assigned to this slot, or -1 if unassigned */
  [slotIndex: number]: number;
}

// ─── Grid parser ────────────────────────────────────────────────────

/**
 * Parse a string grid into pixel data.
 *
 * Grid format:
 * - Each string is a row
 * - Each character is either '.' (transparent) or a hex digit (0-9, a-f) = slot index
 * - All rows must be the same length
 */
function parseSpriteGrid(grid: string[]): { width: number; height: number; pixels: Int8Array } {
  const height = grid.length;
  const width = grid[0].length;
  const pixels = new Int8Array(width * height);

  for (let y = 0; y < height; y++) {
    const row = grid[y];
    for (let x = 0; x < width; x++) {
      const ch = row[x];
      if (ch === ".") {
        pixels[y * width + x] = -1;
      } else {
        pixels[y * width + x] = Number.parseInt(ch, 16);
      }
    }
  }

  return { width, height, pixels };
}

// ─── Demo sprites ───────────────────────────────────────────────────

/**
 * RPG Character (16×16)
 * Slots: 0=hair, 1=skin, 2=eyes, 3=shirt, 4=pants, 5=shoes
 */
const CHARACTER_GRID = [
  "....00000000....",
  "...0000000000...",
  "..000000000000..",
  ".00000000000000.",
  ".00000000000000.",
  "..001111111100..",
  "..001111111100..",
  "..001122221100..",
  "..001122221100..",
  "..001111111100..",
  "..003333333300..",
  "..003333333300..",
  "..003333333300..",
  "..0044444400....",
  "..0044444400....",
  "...00550055.....",
];

const { pixels: characterPixels, width: charW, height: charH } = parseSpriteGrid(CHARACTER_GRID);

export const CHARACTER_SPRITE: SpriteData = {
  name: "RPG Character",
  width: charW,
  height: charH,
  pixels: characterPixels,
  defaultColors: ["#4a3728", "#f5cba7", "#2c2c2c", "#e74c3c", "#2c3e50", "#5d4037"],
  slotLabels: ["Hair", "Skin", "Eyes", "Shirt", "Pants", "Shoes"],
};

/**
 * Tree (12×16)
 * Slots: 0=trunk, 1=leaves dark, 2=leaves light, 3=leaves highlight
 */
const TREE_GRID = [
  "....2222....",
  "...223322...",
  "..22233222..",
  ".2223333222.",
  ".2233333322.",
  "..22333322..",
  "...223322...",
  "...222222...",
  "..22233222..",
  ".2223333222.",
  "..22333322..",
  "...111111...",
  "....1100....",
  "....1100....",
  "....1100....",
  "....1100....",
];

const { pixels: treePixels, width: treeW, height: treeH } = parseSpriteGrid(TREE_GRID);

export const TREE_SPRITE: SpriteData = {
  name: "Tree",
  width: treeW,
  height: treeH,
  pixels: treePixels,
  defaultColors: ["#8B4513", "#2d5016", "#3a7d1a", "#4fa82a"],
  slotLabels: ["Trunk", "Leaves Dark", "Leaves", "Leaves Highlight"],
};

/**
 * House (16×14)
 * Slots: 0=walls, 1=roof, 2=roof dark, 3=door, 4=window, 5=chimney
 */
const HOUSE_GRID = [
  "....11111111....",
  "...1111111111...",
  "..111111111111..",
  ".11111111111111.",
  "1111111111111111",
  "..000000000000..",
  "..000044440000..",
  "..000044440000..",
  "..000000000000..",
  "..000033330000..",
  "..000033330000..",
  "..000000000000..",
  "..000000000000..",
  "..0000..0000....",
];

const { pixels: housePixels, width: houseW, height: houseH } = parseSpriteGrid(HOUSE_GRID);

export const HOUSE_SPRITE: SpriteData = {
  name: "House",
  width: houseW,
  height: houseH,
  pixels: housePixels,
  defaultColors: ["#d4a574", "#c0392b", "#922b21", "#5d4037", "#f1c40f", "#7f8c8d"],
  slotLabels: ["Walls", "Roof", "Roof Dark", "Door", "Window", "Chimney"],
};

/**
 * Chest (12×8)
 * Slots: 0=wood body, 1=metal bands, 2=lock/gem, 3=wood highlight, 4=wood dark
 */
const CHEST_GRID = [
  "..1111111111..",
  ".110000000011.",
  "10002200220001",
  "10000000000001",
  "10000000000001",
  ".110000000011.",
  "..1111111111..",
  "...11111111...",
];

const { pixels: chestPixels, width: chestW, height: chestH } = parseSpriteGrid(CHEST_GRID);

export const CHEST_SPRITE: SpriteData = {
  name: "Chest",
  width: chestW,
  height: chestH,
  pixels: chestPixels,
  defaultColors: ["#8B5E3C", "#b8860b", "#f1c40f", "#a0714f", "#5c3a21"],
  slotLabels: ["Wood", "Metal", "Gem", "Wood Highlight", "Wood Dark"],
};

/**
 * Monster (14×12)
 * Slots: 0=body, 1=belly, 2=eyes, 3=teeth, 4=horns
 */
const MONSTER_GRID = [
  "..4444..4444..",
  ".444444444444.",
  ".400000000004.",
  "40000000000004",
  "40022200220004",
  "40000000000004",
  "40001111110004",
  "40001111110004",
  "40000000000004",
  ".400000000004.",
  "..4000000004..",
  "...44444444...",
];

const { pixels: monsterPixels, width: monsterW, height: monsterH } = parseSpriteGrid(MONSTER_GRID);

export const MONSTER_SPRITE: SpriteData = {
  name: "Monster",
  width: monsterW,
  height: monsterH,
  pixels: monsterPixels,
  defaultColors: ["#6b3a2a", "#8BC34A", "#ff4444", "#ffffff", "#4a3728"],
  slotLabels: ["Body", "Belly", "Eyes", "Teeth", "Horns"],
};

// ─── All sprites ────────────────────────────────────────────────────

export const ALL_DEMO_SPRITES: SpriteData[] = [
  CHARACTER_SPRITE,
  TREE_SPRITE,
  HOUSE_SPRITE,
  CHEST_SPRITE,
  MONSTER_SPRITE,
];
