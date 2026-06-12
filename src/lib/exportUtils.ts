/**
 * Export format utilities for Pixel Palette Lab.
 * Generates formatted strings / blobs for various palette export formats.
 */

import type { Palette } from "@/types/palette";
import { hexToRgb } from "@/lib/colorUtils";

// ─── JSON Export ─────────────────────────────────────────────────────

/**
 * Serialize a palette to pretty-printed JSON.
 *
 * Format groups shades under their main color by hex:
 * ```json
 * {
 *   "name": "My Palette",
 *   "colors": [
 *     { "hex": "#ff0000", "shades": ["#cc0000", "#990000"] },
 *     { "hex": "#0044ff", "shades": [] }
 *   ]
 * }
 * ```
 */
export function exportJson(palette: Palette): string {
  const sorted = [...palette.colors].sort((a, b) => a.order - b.order);
  const mainColors = sorted.filter((c) => c.kind === "main");

  const colors = mainColors.map((main) => {
    const shades = sorted
      .filter((c) => c.mainColorId === main.id)
      .map((c) => c.hex);
    return {
      hex: main.hex,
      shades,
    };
  });

  const data = {
    name: palette.name,
    colors,
  };

  return JSON.stringify(data, null, 2);
}

// ─── GPL (GIMP Palette) Export ───────────────────────────────────────

/**
 * Generate a GIMP Palette (.gpl) file content from a palette.
 * Columns defaults to 4.
 */
export function exportGpl(palette: Palette, columns = 4): string {
  const sorted = [...palette.colors].sort((a, b) => a.order - b.order);
  const lines: string[] = [
    "GIMP Palette",
    `Name: ${palette.name}`,
    `Columns: ${columns}`,
    "#",
  ];

  for (const color of sorted) {
    const rgb = hexToRgb(color.hex);
    if (!rgb) continue;
    const r = String(rgb.r).padStart(3);
    const g = String(rgb.g).padStart(3);
    const b = String(rgb.b).padStart(3);
    const label = color.kind === "main" ? color.hex : `  ${color.hex}`;
    lines.push(`${r} ${g} ${b}\t${label}`);
  }

  return lines.join("\n");
}

// ─── CSS Variables Export ────────────────────────────────────────────

/**
 * Generate CSS custom properties :root block from a palette.
 */
export function exportCssVariables(palette: Palette): string {
  const sorted = [...palette.colors].sort((a, b) => a.order - b.order);
  const lines: string[] = [":root {"];

  for (let i = 0; i < sorted.length; i++) {
    const color = sorted[i];
    const varName = `  --palette-${i}: ${color.hex};`;
    lines.push(varName);
  }

  lines.push("}");
  return lines.join("\n");
}

// ─── Tailwind Config Export ──────────────────────────────────────────

/**
 * Generate a Tailwind CSS config extension snippet from a palette.
 * Organizes colors by main color groups with shade numbers.
 */
export function exportTailwindConfig(palette: Palette): string {
  const sorted = [...palette.colors].sort((a, b) => a.order - b.order);
  // Build flat color entries
  const flatColors = sorted.map((c, i) => `    '${i}': '${c.hex}'`);

  const lines: string[] = [
    "// tailwind.config.js",
    "/** @type {import('tailwindcss').Config} */",
    "module.exports = {",
    "  theme: {",
    "    extend: {",
    "      colors: {",
    ...flatColors,
    "      },",
    "    },",
    "  },",
    "};",
  ];
  return lines.join("\n");
}

// ─── PNG Export ──────────────────────────────────────────────────────

const SWATCH_SIZE = 48;
const ROW_GAP = 6;
const SWATCH_GAP = 2;
const PADDING = 10;

/**
 * Render palette colors to a canvas and return as a PNG Blob.
 *
 * Layout matches the Palette Preview: one row per main color,
 * with shades split around the main color:
 *   [shadows...] [main] [highlights...]
 */
export async function exportPng(palette: Palette): Promise<Blob | null> {
  const sorted = [...palette.colors].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return null;

  const mainColors = sorted.filter((c) => c.kind === "main");

  // Build rows: each row is [first-half shades, main color, second-half shades]
  const rows: string[][] = [];

  for (const main of mainColors) {
    const shades = sorted.filter((c) => c.mainColorId === main.id);
    const mid = Math.ceil(shades.length / 2);
    const row = [
      ...shades.slice(0, mid).map((c) => c.hex),
      main.hex,
      ...shades.slice(mid).map((c) => c.hex),
    ];
    rows.push(row);
  }

  // Calculate canvas dimensions
  const maxSwatches = Math.max(...rows.map((r) => r.length), 0);
  const canvasWidth = maxSwatches * (SWATCH_SIZE + SWATCH_GAP) - SWATCH_GAP + PADDING * 2;
  const canvasHeight = rows.length * (SWATCH_SIZE + ROW_GAP) - ROW_GAP + PADDING * 2;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Draw each row (no background — transparent PNG for use in other apps)
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    const rowWidth = row.length * (SWATCH_SIZE + SWATCH_GAP) - SWATCH_GAP;
    // Center the row horizontally
    const rowOffsetX = PADDING + (canvasWidth - PADDING * 2 - rowWidth) / 2;
    const rowOffsetY = PADDING + ri * (SWATCH_SIZE + ROW_GAP);

    for (let si = 0; si < row.length; si++) {
      const x = rowOffsetX + si * (SWATCH_SIZE + SWATCH_GAP);
      const y = rowOffsetY;

      ctx.fillStyle = row[si];
      ctx.fillRect(x, y, SWATCH_SIZE, SWATCH_SIZE);
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

// ─── ASE (Adobe Swatch Exchange) Export ──────────────────────────────

/**
 * Generate a simple ASE (Adobe Swatch Exchange) binary file.
 * This is a basic implementation that creates a valid ASE v1.0 file.
 *
 * ASE format structure:
 * - 4 bytes: "ASEF" signature
 * - 4 bytes: big-endian version (1)
 * - 4 bytes: big-endian number of blocks
 * - For each block:
 *   - 2 bytes: block type (0x0001 = color entry)
 *   - 4 bytes: big-endian block length (remaining after this field)
 *   - 2 bytes: color model (0x0000 = RGB)
 *   - 2 bytes: color name length (+ 1 for null terminator)
 *   - N bytes: color name (UTF-16 BE)
 *   - 2 bytes: null terminator for name
 *   - 4 bytes: R (float32 big-endian, 0..1)
 *   - 4 bytes: G (float32 big-endian, 0..1)
 *   - 4 bytes: B (float32 big-endian, 0..1)
 *   - 2 bytes: color type (0x0000 = Global)
 */
export function exportAse(palette: Palette): Blob {
  const sorted = [...palette.colors].sort((a, b) => a.order - b.order);

  // Helper: write a float32 as big-endian
  const float32ToBe = (val: number): ArrayBuffer => {
    const buf = new ArrayBuffer(4);
    const view = new DataView(buf);
    view.setFloat32(0, val, false); // false = big-endian
    return buf;
  };

  // Helper: encode string as UTF-16 BE with null terminator
  const encodeName = (str: string): ArrayBuffer => {
    // Include null terminator (2 bytes)
    // Convert to UTF-16 BE by going through char codes
    const buf = new ArrayBuffer((str.length + 1) * 2);
    const view = new DataView(buf);
    for (let i = 0; i < str.length; i++) {
      view.setUint16(i * 2, str.charCodeAt(i), false);
    }
    // Last 2 bytes are already 0 (null terminator)
    return buf;
  };

  // Calculate total size
  const blocks: ArrayBuffer[] = [];

  for (const color of sorted) {
    const rgb = hexToRgb(color.hex);
    if (!rgb) continue;

    const name = color.hex;
    const nameBuf = encodeName(name);
    const rBuf = float32ToBe(rgb.r / 255);
    const gBuf = float32ToBe(rgb.g / 255);
    const bBuf = float32ToBe(rgb.b / 255);

    // Block type (2) + block length (4) + color model (2) + name length (2) + name + R (4) + G (4) + B (4) + color type (2)
    // Block length includes everything after the length field
    const blockLength = 2 + 2 + nameBuf.byteLength + 4 + 4 + 4 + 2;

    const blockBuf = new ArrayBuffer(2 + 4 + blockLength);
    const blockView = new DataView(blockBuf);
    let offset = 0;

    // Block type: 0x0001 = color entry
    blockView.setUint16(offset, 0x0001, false);
    offset += 2;

    // Block length
    blockView.setUint32(offset, blockLength, false);
    offset += 4;

    // Color model: 0x0000 = RGB
    blockView.setUint16(offset, 0x0000, false);
    offset += 2;

    // Name length (including null terminator) in characters
    blockView.setUint16(offset, name.length + 1, false);
    offset += 2;

    // Name (UTF-16 BE)
    new Uint8Array(blockBuf).set(new Uint8Array(nameBuf), offset);
    offset += nameBuf.byteLength;

    // R, G, B as float32 big-endian
    new Uint8Array(blockBuf).set(new Uint8Array(rBuf), offset);
    offset += 4;
    new Uint8Array(blockBuf).set(new Uint8Array(gBuf), offset);
    offset += 4;
    new Uint8Array(blockBuf).set(new Uint8Array(bBuf), offset);
    offset += 4;

    // Color type: 0x0000 = Global
    blockView.setUint16(offset, 0x0000, false);

    blocks.push(blockBuf);
  }

  // Header: "ASEF" + version (1) + number of blocks
  const headerSize = 4 + 4 + 4;
  const totalSize = headerSize + blocks.reduce((s, b) => s + b.byteLength, 0);
  const fileBuf = new ArrayBuffer(totalSize);
  const fileView = new DataView(fileBuf);

  // "ASEF" signature
  const asef = new TextEncoder().encode("ASEF");
  new Uint8Array(fileBuf).set(asef, 0);

  // Version (big-endian uint32: 1)
  fileView.setUint32(4, 1, false);

  // Number of blocks (big-endian uint32)
  fileView.setUint32(8, blocks.length, false);

  // Write blocks
  let fileOffset = headerSize;
  for (const block of blocks) {
    new Uint8Array(fileBuf).set(new Uint8Array(block), fileOffset);
    fileOffset += block.byteLength;
  }

  return new Blob([fileBuf], { type: "application/octet-stream" });
}
