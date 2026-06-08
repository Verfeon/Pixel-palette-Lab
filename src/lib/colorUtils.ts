/**
 * Color utility functions for Pixel Palette Lab.
 * All internal color storage uses HSL for easier manipulation.
 * HEX is the primary input/output format for user interaction.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

const HEX_REGEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Validate a hex color string (with or without #, 3 or 6 digits).
 */
export function isValidHex(hex: string): boolean {
  return HEX_REGEX.test(hex.trim());
}

/**
 * Normalize a hex string to #XXXXXX format.
 */
export function normalizeHex(hex: string): string {
  let h = hex.trim();
  if (!h.startsWith("#")) h = "#" + h;
  if (h.length === 4) {
    // #RGB -> #RRGGBB
    h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  }
  return h.toLowerCase();
}

/**
 * Convert a hex string to RGB.
 * Returns null for invalid input.
 */
export function hexToRgb(hex: string): RgbColor | null {
  const normalized = normalizeHex(hex);
  if (!isValidHex(normalized)) return null;
  const result = /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(normalized);
  if (!result) return null;
  return {
    r: Number.parseInt(result[1], 16),
    g: Number.parseInt(result[2], 16),
    b: Number.parseInt(result[3], 16),
  };
}

/**
 * Convert RGB to HSL.
 * All values in ranges: h [0, 360], s [0, 100], l [0, 100].
 */
export function rgbToHsl(r: number, g: number, b: number): HslColor {
  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;
  const max = Math.max(rs, gs, bs);
  const min = Math.min(rs, gs, bs);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === rs) {
      h = ((gs - bs) / delta + (gs < bs ? 6 : 0)) * 60;
    } else if (max === gs) {
      h = ((bs - rs) / delta + 2) * 60;
    } else {
      h = ((rs - gs) / delta + 4) * 60;
    }
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/**
 * Convert HSL to RGB.
 * h [0, 360], s [0, 100], l [0, 100].
 */
export function hslToRgb(h: number, s: number, l: number): RgbColor {
  const hs = h / 360;
  const ss = s / 100;
  const ls = l / 100;

  let r: number;
  let g: number;
  let b: number;

  if (ss === 0) {
    r = g = b = ls;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };

    const q = ls < 0.5 ? ls * (1 + ss) : ls + ss - ls * ss;
    const p = 2 * ls - q;
    r = hue2rgb(p, q, hs + 1 / 3);
    g = hue2rgb(p, q, hs);
    b = hue2rgb(p, q, hs - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert RGB to a hex string (#RRGGBB).
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number): string => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convenience: hex -> HSL.
 */
export function hexToHsl(hex: string): HslColor | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

/**
 * Convenience: HSL -> hex.
 */
export function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Format an HSL color as a display string: "h s% l%"
 */
export function formatHsl(hsl: HslColor): string {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}

/**
 * Format an HSL color for CSS hsl() function.
 */
export function formatHslCss(hsl: HslColor): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * Format RGB as a display string: "r, g, b"
 */
export function formatRgb(rgb: RgbColor): string {
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

/**
 * Generate a unique color id (short random string).
 */
export function generateColorId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Generate a random hex color.
 */
export function randomHex(): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return rgbToHex(r, g, b);
}
