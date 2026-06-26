/**
 * Sprite rendering and recoloring utilities for Pixel Palette Lab.
 *
 * Uses HTML Canvas API for all rendering — no external image libraries.
 * Demo sprites are defined as pixel data arrays in TypeScript (see demoSprites.ts).
 */

import type { SpriteData, SpriteSlotMap } from "@/lib/demoSprites";
import { hexToRgb } from "@/lib/colorUtils";

// Re-export for consumers
export type { SpriteSlotMap };

// ─── Color distance ─────────────────────────────────────────────────

/**
 * Compute Euclidean distance between two hex colors in RGB space.
 */
export function colorDistance(hexA: string, hexB: string): number {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return Infinity;

  return Math.sqrt(
    (rgbA.r - rgbB.r) ** 2 +
    (rgbA.g - rgbB.g) ** 2 +
    (rgbA.b - rgbB.b) ** 2
  );
}

// ─── Auto slot mapping ──────────────────────────────────────────────

/**
 * Automatically map palette colors to sprite slots by finding the closest
 * palette color (by RGB distance) to each slot's default color.
 *
 * @param paletteHexes - Array of hex colors from the user's palette
 * @param sprite - The sprite to map to
 * @returns A map of slot index -> palette color index
 */
export function autoMapSlots(
  paletteHexes: string[],
  sprite: SpriteData
): SpriteSlotMap {
  const slotMap: SpriteSlotMap = {};
  const usedPaletteIndices = new Set<number>();

  for (let slot = 0; slot < sprite.defaultColors.length; slot++) {
    const defaultHex = sprite.defaultColors[slot];
    let bestDist = Infinity;
    let bestIdx = -1;

    for (let pi = 0; pi < paletteHexes.length; pi++) {
      if (usedPaletteIndices.has(pi)) continue;
      const dist = colorDistance(defaultHex, paletteHexes[pi]);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = pi;
      }
    }

    // If all colors are used, find closest among all (allow reuse)
    if (bestIdx === -1) {
      for (let pi = 0; pi < paletteHexes.length; pi++) {
        const dist = colorDistance(defaultHex, paletteHexes[pi]);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = pi;
        }
      }
    }

    if (bestIdx >= 0) {
      slotMap[slot] = bestIdx;
      usedPaletteIndices.add(bestIdx);
    }
  }

  return slotMap;
}

/**
 * Get the final color to use for a sprite slot given a slot map and palette.
 */
export function getSlotColor(
  slot: number,
  sprite: SpriteData,
  paletteHexes: string[],
  slotMap: SpriteSlotMap
): string {
  const paletteIdx = slotMap[slot];
  if (paletteIdx !== undefined && paletteIdx >= 0 && paletteIdx < paletteHexes.length) {
    return paletteHexes[paletteIdx];
  }
  // Fall back to default
  return sprite.defaultColors[slot] ?? "#000000";
}

// ─── Canvas rendering ───────────────────────────────────────────────

export interface RenderOptions {
  /** Scale factor for pixel size (default: 16) */
  pixelSize?: number;
  /** Background color hex, or null for transparent (default: null) */
  backgroundColor?: string | null;
  /** Whether to show a checkerboard for transparent areas (default: false) */
  showCheckerboard?: boolean;
}

const DEFAULT_PIXEL_SIZE = 16;

/**
 * Render a sprite onto a canvas element with the given palette colors.
 *
 * @param canvas - The canvas element to draw onto
 * @param sprite - The sprite data to render
 * @param paletteHexes - Array of hex colors from the user's palette
 * @param slotMap - Pre-computed slot-to-palette mapping (if omitted, auto-calculated)
 * @param options - Rendering options
 */
export function renderSpriteOnCanvas(
  canvas: HTMLCanvasElement,
  sprite: SpriteData,
  paletteHexes: string[],
  slotMap?: SpriteSlotMap,
  options: RenderOptions = {}
): void {
  const { pixelSize = DEFAULT_PIXEL_SIZE, backgroundColor = null, showCheckerboard = false } = options;

  const w = sprite.width * pixelSize;
  const h = sprite.height * pixelSize;

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Resolve slot map
  const resolvedMap = slotMap ?? autoMapSlots(paletteHexes, sprite);

  // Background
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, w, h);
  } else if (showCheckerboard) {
    drawCheckerboard(ctx, w, h, pixelSize);
  }

  // Draw pixels
  for (let y = 0; y < sprite.height; y++) {
    for (let x = 0; x < sprite.width; x++) {
      const slot = sprite.pixels[y * sprite.width + x];
      if (slot < 0) continue; // transparent

      const hex = getSlotColor(slot, sprite, paletteHexes, resolvedMap);
      ctx.fillStyle = hex;
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }
}

/**
 * Draw a checkerboard pattern (commonly used to indicate transparency).
 */
export function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tileSize: number
): void {
  const size = Math.max(4, Math.floor(tileSize / 4));
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      const isLight = (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0;
      ctx.fillStyle = isLight ? "#cccccc" : "#aaaaaa";
      ctx.fillRect(x, y, size, size);
    }
  }
}

/**
 * Render a sprite to a data URL for use in <img> tags or downloads.
 */
export function renderSpriteToDataUrl(
  sprite: SpriteData,
  paletteHexes: string[],
  slotMap?: SpriteSlotMap,
  options: RenderOptions = {}
): string {
  const canvas = document.createElement("canvas");
  renderSpriteOnCanvas(canvas, sprite, paletteHexes, slotMap, options);
  return canvas.toDataURL();
}

/**
 * Generate the slot-to-palette-color mapping as a list for display purposes.
 */
export function getSlotColorAssignments(
  sprite: SpriteData,
  paletteHexes: string[],
  slotMap: SpriteSlotMap
): Array<{ slot: number; label: string; defaultHex: string; assignedHex: string | null }> {
  return sprite.defaultColors.map((defaultHex, slot) => {
    const paletteIdx = slotMap[slot];
    const assignedHex =
      paletteIdx !== undefined && paletteIdx >= 0 && paletteIdx < paletteHexes.length
        ? paletteHexes[paletteIdx]
        : null;
    return {
      slot,
      label: sprite.slotLabels[slot] ?? `Slot ${slot}`,
      defaultHex,
      assignedHex,
    };
  });
}

/**
 * Check if a sprite has enough slots to meaningfully preview a palette.
 * Returns true if the sprite has at least one visible pixel.
 */
export function hasVisiblePixels(sprite: SpriteData): boolean {
  for (let i = 0; i < sprite.pixels.length; i++) {
    if (sprite.pixels[i] >= 0) return true;
  }
  return false;
}
