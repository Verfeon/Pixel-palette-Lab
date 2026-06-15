/**
 * Image color extraction utilities for Pixel Palette Lab.
 * Uses median-cut quantization for dominant color extraction.
 */

import { rgbToHex } from "@/lib/colorUtils";

interface RgbPixel {
  r: number;
  g: number;
  b: number;
}

interface ColorBox {
  pixels: RgbPixel[];
  rMin: number;
  rMax: number;
  gMin: number;
  gMax: number;
  bMin: number;
  bMax: number;
}

/**
 * Compute Euclidean distance between two RGB colors.
 */
export function colorDistance(a: RgbPixel, b: RgbPixel): number {
  return Math.sqrt(
    (a.r - b.r) ** 2 +
    (a.g - b.g) ** 2 +
    (a.b - b.b) ** 2
  );
}

/**
 * Get the dimension with the largest range for a color box.
 */
function getLargestDimension(box: ColorBox): "r" | "g" | "b" {
  const rRange = box.rMax - box.rMin;
  const gRange = box.gMax - box.gMin;
  const bRange = box.bMax - box.bMin;

  if (rRange >= gRange && rRange >= bRange) return "r";
  if (gRange >= rRange && gRange >= bRange) return "g";
  return "b";
}

/**
 * Sort pixels by a given channel.
 */
function sortByChannel(pixels: RgbPixel[], channel: "r" | "g" | "b"): RgbPixel[] {
  return [...pixels].sort((a, b) => a[channel] - b[channel]);
}

/**
 * Split a color box into two boxes along the median of the largest dimension.
 * Returns [left, right] boxes.
 */
function splitBox(box: ColorBox): [ColorBox, ColorBox] | null {
  if (box.pixels.length < 2) return null;

  const dim = getLargestDimension(box);
  const sorted = sortByChannel(box.pixels, dim);
  const medianIndex = Math.floor(sorted.length / 2);

  // Ensure we don't split at the edge
  if (medianIndex === 0 || medianIndex >= sorted.length) return null;

  const left = sorted.slice(0, medianIndex);
  const right = sorted.slice(medianIndex);

  const leftBox = computeBox(left);
  const rightBox = computeBox(right);

  return [leftBox, rightBox];
}

/**
 * Compute the bounding box for a set of pixels.
 */
function computeBox(pixels: RgbPixel[]): ColorBox {
  let rMin = 255, rMax = 0;
  let gMin = 255, gMax = 0;
  let bMin = 255, bMax = 0;

  for (const p of pixels) {
    if (p.r < rMin) rMin = p.r;
    if (p.r > rMax) rMax = p.r;
    if (p.g < gMin) gMin = p.g;
    if (p.g > gMax) gMax = p.g;
    if (p.b < bMin) bMin = p.b;
    if (p.b > bMax) bMax = p.b;
  }

  return { pixels, rMin, rMax, gMin, gMax, bMin, bMax };
}

/**
 * Compute the volume (color range) of a box.
 */
function boxVolume(box: ColorBox): number {
  return (box.rMax - box.rMin + 1) *
         (box.gMax - box.gMin + 1) *
         (box.bMax - box.bMin + 1);
}

/**
 * Extract dominant colors from an array of RGB pixels using median-cut quantization.
 *
 * @param pixels - Array of RGB pixels
 * @param maxColors - Maximum number of colors to extract
 * @returns Array of hex color strings
 */
export function medianCutQuantize(pixels: RgbPixel[], maxColors: number): string[] {
  if (pixels.length === 0) return [];
  if (pixels.length <= maxColors) {
    // Fewer pixels than max colors — return each unique pixel as a color
    const seen = new Set<string>();
    const result: string[] = [];
    for (const p of pixels) {
      const hex = rgbToHex(p.r, p.g, p.b);
      if (!seen.has(hex)) {
        seen.add(hex);
        result.push(hex);
      }
    }
    return result;
  }

  // Start with one box containing all pixels
  const initialBox = computeBox(pixels);
  const boxes: ColorBox[] = [initialBox];

  // Iteratively split the box with the largest volume
  while (boxes.length < maxColors) {
    // Find the box with the largest volume
    let largestIndex = 0;
    let largestVolume = boxVolume(boxes[0]);

    for (let i = 1; i < boxes.length; i++) {
      const vol = boxVolume(boxes[i]);
      if (vol > largestVolume) {
        largestVolume = vol;
        largestIndex = i;
      }
    }

    const boxToSplit = boxes[largestIndex];
    const split = splitBox(boxToSplit);

    if (!split) break; // Can't split further

    // Replace the split box with its two halves
    boxes.splice(largestIndex, 1, split[0], split[1]);
  }

  // Compute the average color of each box
  return boxes.map((box) => {
    let totalR = 0, totalG = 0, totalB = 0;
    for (const p of box.pixels) {
      totalR += p.r;
      totalG += p.g;
      totalB += p.b;
    }
    const avgR = Math.round(totalR / box.pixels.length);
    const avgG = Math.round(totalG / box.pixels.length);
    const avgB = Math.round(totalB / box.pixels.length);
    return rgbToHex(avgR, avgG, avgB);
  });
}

/**
 * Group similar colors by merging colors within a given distance tolerance.
 * Returns the reduced set of colors (representative average of each group).
 *
 * @param hexColors - Array of hex color strings
 * @param tolerance - Max Euclidean distance for colors to be considered similar
 * @returns Reduced array of hex color strings
 */
export function reduceSimilarColors(hexColors: string[], tolerance: number): string[] {
  if (hexColors.length <= 1) return hexColors;

  // Convert hex to RGB
  const hexToRgb = (hex: string): RgbPixel | null => {
    const h = hex.replace("#", "");
    if (h.length !== 6) return null;
    return {
      r: Number.parseInt(h.substring(0, 2), 16),
      g: Number.parseInt(h.substring(2, 4), 16),
      b: Number.parseInt(h.substring(4, 6), 16),
    };
  };

  const groups: Array<{ totalR: number; totalG: number; totalB: number; count: number }> = [];

  for (const hex of hexColors) {
    const rgb = hexToRgb(hex);
    if (!rgb) continue;

    let found = false;
    for (const group of groups) {
      const avgR = Math.round(group.totalR / group.count);
      const avgG = Math.round(group.totalG / group.count);
      const avgB = Math.round(group.totalB / group.count);
      const dist = Math.sqrt(
        (rgb.r - avgR) ** 2 +
        (rgb.g - avgG) ** 2 +
        (rgb.b - avgB) ** 2
      );
      if (dist <= tolerance) {
        group.totalR += rgb.r;
        group.totalG += rgb.g;
        group.totalB += rgb.b;
        group.count++;
        found = true;
        break;
      }
    }

    if (!found) {
      groups.push({ totalR: rgb.r, totalG: rgb.g, totalB: rgb.b, count: 1 });
    }
  }

  return groups.map((g) => {
    const r = Math.round(g.totalR / g.count);
    const gv = Math.round(g.totalG / g.count);
    const b = Math.round(g.totalB / g.count);
    return rgbToHex(r, gv, b);
  });
}

/**
 * Load an image file onto a canvas and extract pixel data.
 * Scales down large images for performance.
 *
 * @param file - The image file to process
 * @param maxDimension - Maximum width or height (default 200)
 * @returns The canvas, context, ImageData, and pixel array
 */
export async function loadImagePixels(
  file: File,
  maxDimension = 200
): Promise<{
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  imageData: ImageData;
  pixels: RgbPixel[];
}> {
  const bitmap = await createImageBitmap(file);

  let width = bitmap.width;
  let height = bitmap.height;

  // Scale down if too large
  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const pixels: RgbPixel[] = [];

  // Sample every pixel but skip transparent ones
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue; // Skip transparent
    pixels.push({
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
    });
  }

  return { canvas, width, height, imageData, pixels };
}

/**
 * Extract dominant colors from an image file with full control over parameters.
 *
 * @param file - The image file to analyze
 * @param maxColors - Maximum number of colors to extract (default 16)
 * @param tolerance - Color grouping tolerance 0-100 for reducing similar colors (default 20)
 * @param autoReduce - Whether to automatically merge similar colors (default true)
 * @returns Array of hex color strings, ordered by frequency/importance
 */
export async function extractColorsFromImage(
  file: File,
  maxColors = 16,
  tolerance = 20,
  autoReduce = true
): Promise<string[]> {
  const { pixels } = await loadImagePixels(file);

  if (pixels.length === 0) return [];

  // Use median-cut quantization
  let colors = medianCutQuantize(pixels, maxColors);

  // Optionally reduce similar colors
  if (autoReduce && colors.length > 1) {
    colors = reduceSimilarColors(colors, tolerance);
  }

  // If reduction gave us too many, trim to maxColors
  if (colors.length > maxColors) {
    colors = colors.slice(0, maxColors);
  }

  return colors;
}
