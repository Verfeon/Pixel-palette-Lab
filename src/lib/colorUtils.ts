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

// ─── Shade Generation ────────────────────────────────────────────────

export interface ShadeParams {
  /** Number of shadow steps (below base) */
  shadowCount: number;
  /** Number of highlight steps (above base) */
  highlightCount: number;
  /** Intensity multiplier on lightness deltas (0.1 - 2.0) */
  intensity: number;
  /** Shadow temperature: -1 (cool/blue) to 1 (warm/red), 0 = neutral */
  shadowTemperature: number;
  /** Highlight temperature: -1 (cool/blue) to 1 (warm/red), 0 = neutral */
  highlightTemperature: number;
}

export interface ShadeResult {
  hex: string;
  label: string;
  /** Positive = highlight, negative = shadow, 0 = base */
  level: number;
}

const DEFAULT_SHADE_PARAMS: ShadeParams = {
  shadowCount: 3,
  highlightCount: 3,
  intensity: 1.0,
  shadowTemperature: -0.3,
  highlightTemperature: 0.3,
};

/**
 * Get default shade generation parameters.
 */
export function getDefaultShadeParams(): ShadeParams {
  return { ...DEFAULT_SHADE_PARAMS };
}

/**
 * Apply a temperature-based hue shift to a base hue.
 * @param baseHue - Base hue in degrees (0-360)
 * @param temperature - -1 (cool/blue) to 1 (warm/red)
 * @param amount - How much shift to apply (0-1), proportional to lightness change
 */
function shiftHueByTemperature(baseHue: number, temperature: number, amount: number): number {
  if (temperature === 0 || amount === 0) return baseHue;

  // Target hues: warm ≈ 30° (orange-red), cool ≈ 210° (blue-cyan)
  const warmTarget = 30;
  const coolTarget = 210;

  // Determine target based on temperature direction
  const targetHue = temperature > 0 ? warmTarget : coolTarget;

  // Calculate shortest path around the hue circle
  let diff = targetHue - baseHue;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  // Apply shift proportional to amount and temperature magnitude
  const shift = diff * Math.abs(temperature) * amount;

  let newHue = baseHue + shift;
  if (newHue < 0) newHue += 360;
  if (newHue >= 360) newHue -= 360;

  return Math.round(newHue);
}

/**
 * Generate a full set of shades (shadows + highlights) from a base hex color.
 *
 * The base color is placed in the middle. Shadows descend in lightness
 * with a hue shift toward cool/warm. Highlights ascend in lightness
 * with a hue shift toward cool/warm.
 *
 * Returns an array of colors ordered from darkest shadow to brightest highlight.
 */
export function generateShades(
  baseHex: string,
  params: Partial<ShadeParams> = {}
): ShadeResult[] {
  const hsl = hexToHsl(baseHex);
  if (!hsl) return [];

  const {
    shadowCount,
    highlightCount,
    intensity,
    shadowTemperature,
    highlightTemperature,
  } = { ...DEFAULT_SHADE_PARAMS, ...params };

  const results: ShadeResult[] = [];

  // Generate shadows (descending from base)
  for (let i = shadowCount; i >= 1; i--) {
    const t = i / (shadowCount + 1); // 0..1, higher = darker
    const lightnessDelta = hsl.l * t * intensity;

    const newL = Math.max(0, Math.round(hsl.l - lightnessDelta));
    const newH = shiftHueByTemperature(hsl.h, shadowTemperature, t);

    // Reduce saturation slightly for darker shades
    const newS = Math.max(0, hsl.s - Math.round(t * 15));

    const hex = hslToHex(newH, newS, newL);
    results.push({
      hex,
      label: `Shadow ${i}`,
      level: -i,
    });
  }

  // Base color
  results.push({
    hex: baseHex,
    label: "Base",
    level: 0,
  });

  // Generate highlights (ascending from base)
  for (let i = 1; i <= highlightCount; i++) {
    const t = i / (highlightCount + 1); // 0..1, higher = brighter
    const lightnessDelta = (100 - hsl.l) * t * intensity;

    const newL = Math.min(100, Math.round(hsl.l + lightnessDelta));
    const newH = shiftHueByTemperature(hsl.h, highlightTemperature, t);

    // Increase saturation slightly for brighter shades
    const newS = Math.min(100, hsl.s + Math.round(t * 10));

    const hex = hslToHex(newH, newS, newL);
    results.push({
      hex,
      label: `Highlight ${i}`,
      level: i,
    });
  }

  return results;
}
