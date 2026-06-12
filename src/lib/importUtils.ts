/**
 * Import format utilities for Pixel Palette Lab.
 * Parses various format inputs into palette color data.
 */

import { isValidHex, normalizeHex } from "@/lib/colorUtils";

// ─── JSON Import ─────────────────────────────────────────────────────

export interface ImportedColorEntry {
  hex: string;
  shades: string[];
}

interface JsonPaletteData {
  name?: string;
  colors?: Array<{
    hex?: string;
    shades?: string[];
  }>;
}

/**
 * Parse a JSON string into palette color data.
 *
 * Expects the format produced by `exportJson`:
 * ```json
 * {
 *   "name": "My Palette",
 *   "colors": [
 *     { "hex": "#ff0000", "shades": ["#cc0000", "#990000"] },
 *     { "hex": "#0044ff", "shades": [] }
 *   ]
 * }
 * ```
 *
 * Returns an array of main colors with their associated shade hexes.
 */
export function importJson(json: string): { name?: string; colors: ImportedColorEntry[] } {
  const data: JsonPaletteData = JSON.parse(json);

  if (!data || !Array.isArray(data.colors)) {
    throw new Error("Invalid JSON palette format: expected an object with a 'colors' array");
  }

  const result: ImportedColorEntry[] = [];
  const seenHexes = new Set<string>();

  for (const entry of data.colors) {
    if (typeof entry.hex !== "string") continue;
    const hex = normalizeHex(entry.hex);
    if (!isValidHex(hex) || seenHexes.has(hex.toLowerCase())) continue;
    seenHexes.add(hex.toLowerCase());

    const shades: string[] = [];
    if (Array.isArray(entry.shades)) {
      for (const shadeRaw of entry.shades) {
        if (typeof shadeRaw !== "string") continue;
        const shadeHex = normalizeHex(shadeRaw);
        if (
          isValidHex(shadeHex) &&
          !seenHexes.has(shadeHex.toLowerCase()) &&
          shadeHex.toLowerCase() !== hex.toLowerCase()
        ) {
          seenHexes.add(shadeHex.toLowerCase());
          shades.push(shadeHex);
        }
      }
    }

    result.push({ hex, shades });
  }

  return { name: data.name, colors: result };
}

// ─── PNG Import ──────────────────────────────────────────────────────

/**
 * Extract dominant colors from an image file by sampling pixels.
 * Uses a simple color quantization approach.
 *
 * @param file - The image file to analyze
 * @param maxColors - Maximum number of colors to extract
 * @param tolerance - Color grouping tolerance (0-255, lower = stricter)
 */
export async function importPng(
  file: File,
  maxColors = 16,
  tolerance = 30
): Promise<string[]> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  // Scale down for performance
  const maxDim = 200;
  let width = bitmap.width;
  let height = bitmap.height;
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Sample every other pixel for performance
  const sampledColors: Array<{ r: number; g: number; b: number }> = [];
  for (let i = 0; i < pixels.length; i += 8) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    // Skip transparent pixels
    if (a < 128) continue;
    sampledColors.push({ r, g, b });
  }

  if (sampledColors.length === 0) return [];

  // Simple median-cut quantization using color grouping
  const groups = groupSimilarColors(sampledColors, tolerance);

  // Sort groups by size (most frequent first) and take top maxColors
  const sorted = groups.sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, maxColors);

  // Convert each group's average to hex
  return top.map((group) => {
    const avgR = Math.round(group.totalR / group.count);
    const avgG = Math.round(group.totalG / group.count);
    const avgB = Math.round(group.totalB / group.count);
    const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
    return `#${toHex(avgR)}${toHex(avgG)}${toHex(avgB)}`;
  });
}

interface ColorGroup {
  totalR: number;
  totalG: number;
  totalB: number;
  count: number;
}

/**
 * Group similar colors together based on Euclidean distance tolerance.
 */
function groupSimilarColors(
  colors: Array<{ r: number; g: number; b: number }>,
  tolerance: number
): ColorGroup[] {
  const groups: ColorGroup[] = [];

  for (const color of colors) {
    let found = false;
    for (const group of groups) {
      const avgR = Math.round(group.totalR / group.count);
      const avgG = Math.round(group.totalG / group.count);
      const avgB = Math.round(group.totalB / group.count);
      const dist = Math.sqrt(
        (color.r - avgR) ** 2 +
        (color.g - avgG) ** 2 +
        (color.b - avgB) ** 2
      );
      if (dist <= tolerance) {
        group.totalR += color.r;
        group.totalG += color.g;
        group.totalB += color.b;
        group.count++;
        found = true;
        break;
      }
    }
    if (!found) {
      groups.push({
        totalR: color.r,
        totalG: color.g,
        totalB: color.b,
        count: 1,
      });
    }
  }

  return groups;
}

// ─── Custom Palette Import ───────────────────────────────────────────

/**
 * Parse a custom palette text format.
 * Expected format: one hex color per line.
 * Lines starting with # are treated as hex colors.
 * Also supports "r, g, b" format lines.
 * Empty lines and lines starting with // or # (comment) are ignored.
 */
export function importCustomPalette(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const hexes: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip empty lines and comments
    if (!line || line.startsWith("//") || line.startsWith("#") && !isValidHex(line)) continue;

    // Try hex format
    let hex = line.startsWith("#") ? line : `#${line}`;
    hex = normalizeHex(hex);
    if (isValidHex(hex)) {
      if (!hexes.some((h) => h.toLowerCase() === hex.toLowerCase())) {
        hexes.push(hex);
      }
      continue;
    }

    // Try "r, g, b" format
    const rgbMatch = line.match(/^(\d{1,3})\s*[,]\s*(\d{1,3})\s*[,]\s*(\d{1,3})$/);
    if (rgbMatch) {
      const r = Number.parseInt(rgbMatch[1], 10);
      const g = Number.parseInt(rgbMatch[2], 10);
      const b = Number.parseInt(rgbMatch[3], 10);
      if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
        const toHex = (n: number) => n.toString(16).padStart(2, "0");
        const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        if (!hexes.some((h) => h.toLowerCase() === hexColor.toLowerCase())) {
          hexes.push(hexColor);
        }
      }
    }
  }

  return hexes;
}
