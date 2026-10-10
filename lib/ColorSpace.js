import { converter, parse } from "culori";

const toRgb = converter("rgb");
const toHsl = converter("hsl");
const toHwb = converter("hwb");

/**
 * A normalized RGBA color: channels in the 0..1 range.
 * @typedef {object} Rgba
 * @property {number} r Red, 0..1
 * @property {number} g Green, 0..1
 * @property {number} b Blue, 0..1
 * @property {number} alpha Opacity, 0..1
 */

/**
 * Clamps a number into a range.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Normalizes a hue angle into the 0..360 range.
 * @param {number} hue
 * @returns {number}
 */
function normalizeHue(hue) {
  return ((hue % 360) + 360) % 360;
}

/**
 * Rounds to one decimal place, matching the `color` package's `string()`
 * precision so 2.x output stays compatible with 1.x consumers.
 * @param {number} value
 * @returns {number}
 */
function round1(value) {
  return Number(value.toFixed(1));
}

/**
 * Converts a culori color object to normalized RGBA.
 * @param {import("culori").Color} color
 * @returns {Rgba}
 */
function toRgba(color) {
  const rgb = /** @type {import("culori").Rgb | undefined} */ (
    /** @type {unknown} */ (toRgb(color))
  );
  return {
    r: rgb?.r ?? 0,
    g: rgb?.g ?? 0,
    b: rgb?.b ?? 0,
    alpha: rgb?.alpha ?? 1,
  };
}

/**
 * Parses a color from a CSS string (hex, rgb(), hsl(), hwb(), named colors
 * and other CSS Color 4 syntax), a 24-bit integer, or a plain object in the
 * legacy `color` package units ({r,g,b} in 0..255, {h,s,l} or {h,s,v} with
 * 0..360 hue and 0..100 percentages), with optional `alpha`.
 *
 * Unlike the `color` package, arrays are not accepted: a color is a single
 * value, and collections of colors are streams.
 *
 * @param {unknown} input
 * @returns {Rgba | null} Normalized color, or null when unparseable
 */
export function parseColor(input) {
  if (typeof input === "string") {
    const parsed = parse(input.trim());
    return parsed ? toRgba(parsed) : null;
  }
  if (typeof input === "number") {
    const value = input & 0xffffff;
    return {
      r: ((value >> 16) & 0xff) / 255,
      g: ((value >> 8) & 0xff) / 255,
      b: (value & 0xff) / 255,
      alpha: 1,
    };
  }
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const obj = /** @type {Record<string, number | undefined>} */ (input);
    const { alpha } = obj;
    /** @type {import("culori").Color | null} */
    let color = null;
    if (typeof obj.r === "number") {
      color = {
        mode: "rgb",
        r: clamp(obj.r ?? 0, 0, 255) / 255,
        g: clamp(obj.g ?? 0, 0, 255) / 255,
        b: clamp(obj.b ?? 0, 0, 255) / 255,
      };
    } else if (
      typeof obj.h === "number" &&
      typeof obj.s === "number" &&
      typeof obj.l === "number"
    ) {
      color = {
        mode: "hsl",
        h: normalizeHue(obj.h),
        s: clamp(obj.s ?? 0, 0, 100) / 100,
        l: clamp(obj.l ?? 0, 0, 100) / 100,
      };
    } else if (
      typeof obj.h === "number" &&
      typeof obj.s === "number" &&
      typeof obj.v === "number"
    ) {
      color = {
        mode: "hsv",
        h: normalizeHue(obj.h),
        s: clamp(obj.s ?? 0, 0, 100) / 100,
        v: clamp(obj.v ?? 0, 0, 100) / 100,
      };
    }
    if (!color) {
      return null;
    }
    const rgba = toRgba(color);
    return {
      ...rgba,
      alpha: typeof alpha === "number" ? clamp(alpha, 0, 1) : (rgba.alpha ?? 1),
    };
  }
  return null;
}

/**
 * Formats a color as a CSS rgb()/rgba() string, matching the `color`
 * package's comma syntax and integer channel rounding.
 * @param {Rgba} color
 * @returns {string}
 */
export function rgbString(color) {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return color.alpha < 1
    ? `rgba(${r}, ${g}, ${b}, ${color.alpha})`
    : `rgb(${r}, ${g}, ${b})`;
}

/**
 * Formats a color as a CSS hsl()/hsla() string, matching the `color`
 * package's comma syntax, percentage saturation/lightness, and one-decimal
 * channel precision.
 * @param {Rgba} color
 * @returns {string}
 */
export function hslString(color) {
  const hsl = toHsl({ mode: "rgb", ...color });
  const hue = round1(normalizeHue(hsl?.h ?? 0));
  const saturation = round1((hsl?.s ?? 0) * 100);
  const lightness = round1((hsl?.l ?? 0) * 100);
  return color.alpha < 1
    ? `hsla(${hue}, ${saturation}%, ${lightness}%, ${color.alpha})`
    : `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Formats a color as a CSS hex string, matching the `color` package's
 * uppercase two-digit-per-channel syntax. Like the `color` package's
 * `hex()`, alpha is not included in the output.
 * @param {Rgba} color
 * @returns {string}
 */
export function hexString(color) {
  /** @param {number} value */
  const byte = (value) =>
    Math.round(clamp(value, 0, 1) * 255)
      .toString(16)
      .toUpperCase()
      .padStart(2, "0");
  return `#${byte(color.r)}${byte(color.g)}${byte(color.b)}`;
}

/**
 * WCAG 2.0 relative luminance, matching the `color` package's `luminosity()`.
 * @param {Rgba} color
 * @returns {number} 0..1
 */
export function luminance(color) {
  const channel = (/** @type {number} */ v) => {
    const c = clamp(v, 0, 1);
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(color.r) +
    0.7152 * channel(color.g) +
    0.0722 * channel(color.b)
  );
}

/**
 * WCAG contrast ratio between two colors.
 * @param {Rgba} color
 * @param {Rgba} reference
 * @returns {number} 1 (identical) to 21 (black vs white)
 */
export function contrast(color, reference) {
  const luminanceA = luminance(color);
  const luminanceB = luminance(reference);
  return luminanceA > luminanceB
    ? (luminanceA + 0.05) / (luminanceB + 0.05)
    : (luminanceB + 0.05) / (luminanceA + 0.05);
}

/**
 * Whether a color appears dark, using the YIQ equation the `color` package
 * uses for `dark()`.
 * @param {Rgba} color
 * @returns {boolean}
 */
export function isDark(color) {
  const yiq =
    (color.r * 255 * 299 + color.g * 255 * 587 + color.b * 255 * 114) / 1000;
  return yiq < 128;
}

/**
 * Whether a color appears light.
 * @param {Rgba} color
 * @returns {boolean}
 */
export function isLight(color) {
  return !isDark(color);
}

/**
 * Applies an operation to a color in a given color space, returning
 * normalized RGBA. The callback receives the converted color in 0..1
 * channel units and mutates it in place.
 * @param {Rgba} color
 * @param {"hsl" | "hwb"} space
 * @param {(converted: Record<string, number | undefined>) => void} apply
 * @returns {Rgba}
 */
function inSpace(color, space, apply) {
  /** @type {(c: import("culori").Color) => Record<string, number | undefined>} */
  const convert =
    /** @type {(c: import("culori").Color) => Record<string, number | undefined>} */ (
      /** @type {unknown} */ (space === "hsl" ? toHsl : toHwb)
    );
  const converted = convert({ mode: "rgb", ...color });
  apply(converted);
  return {
    ...toRgba(
      /** @type {import("culori").Color} */ (
        /** @type {unknown} */ (converted)
      ),
    ),
    alpha: color.alpha,
  };
}

/**
 * Lightens by a ratio of the current lightness (`color` package `lighten`).
 * @param {Rgba} color
 * @param {number} ratio
 * @returns {Rgba}
 */
export function lighten(color, ratio) {
  return inSpace(color, "hsl", (hsl) => {
    hsl.l = (hsl.l ?? 0) + (hsl.l ?? 0) * ratio;
  });
}

/**
 * Darkens by a ratio of the current lightness (`color` package `darken`).
 * @param {Rgba} color
 * @param {number} ratio
 * @returns {Rgba}
 */
export function darken(color, ratio) {
  return inSpace(color, "hsl", (hsl) => {
    hsl.l = (hsl.l ?? 0) - (hsl.l ?? 0) * ratio;
  });
}

/**
 * Increases saturation by a ratio (`color` package `saturate`).
 * @param {Rgba} color
 * @param {number} ratio
 * @returns {Rgba}
 */
export function saturate(color, ratio) {
  return inSpace(color, "hsl", (hsl) => {
    hsl.s = (hsl.s ?? 0) + (hsl.s ?? 0) * ratio;
  });
}

/**
 * Decreases saturation by a ratio (`color` package `desaturate`).
 * @param {Rgba} color
 * @param {number} ratio
 * @returns {Rgba}
 */
export function desaturate(color, ratio) {
  return inSpace(color, "hsl", (hsl) => {
    hsl.s = (hsl.s ?? 0) - (hsl.s ?? 0) * ratio;
  });
}

/**
 * Increases the HWB white channel by a ratio (`color` package `whiten`).
 * @param {Rgba} color
 * @param {number} ratio
 * @returns {Rgba}
 */
export function whiten(color, ratio) {
  return inSpace(color, "hwb", (hwb) => {
    hwb.w = (hwb.w ?? 0) + (hwb.w ?? 0) * ratio;
  });
}

/**
 * Increases the HWB black channel by a ratio (`color` package `blacken`).
 * @param {Rgba} color
 * @param {number} ratio
 * @returns {Rgba}
 */
export function blacken(color, ratio) {
  return inSpace(color, "hwb", (hwb) => {
    hwb.b = (hwb.b ?? 0) + (hwb.b ?? 0) * ratio;
  });
}

/**
 * Reduces opacity by a ratio of the current alpha (`color` package `fade`).
 * @param {Rgba} color
 * @param {number} ratio
 * @returns {Rgba}
 */
export function clearer(color, ratio) {
  return { ...color, alpha: clamp(color.alpha - color.alpha * ratio, 0, 1) };
}

/**
 * Increases opacity by a ratio of the current alpha (`color` package
 * `opaquer`).
 * @param {Rgba} color
 * @param {number} ratio
 * @returns {Rgba}
 */
export function opaquer(color, ratio) {
  return { ...color, alpha: clamp(color.alpha + color.alpha * ratio, 0, 1) };
}

/**
 * Rotates the hue by degrees (`color` package `rotate`).
 * @param {Rgba} color
 * @param {number} degrees
 * @returns {Rgba}
 */
export function rotate(color, degrees) {
  return inSpace(color, "hsl", (hsl) => {
    hsl.h = normalizeHue((hsl.h ?? 0) + degrees);
  });
}

/**
 * Mixes two colors in RGB space with the Sass weighted algorithm the
 * `color` package uses for `mix()`, keeping 1.x output compatible.
 *
 * @param {Rgba} color The base color (the `color` package's `this`)
 * @param {Rgba} mixin The color to mix in (the `color` package's argument)
 * @param {number} [weight] Mix weight, 0 = all mixin, 1 = all
 *   base; defaults to 0.5
 * @returns {Rgba}
 */
export function mix(color, mixin, weight) {
  const p = weight === undefined ? 0.5 : weight;
  const w = 2 * p - 1;
  const alphaDifference = mixin.alpha - color.alpha;
  const w1 =
    ((w * alphaDifference === -1
      ? w
      : (w + alphaDifference) / (1 + w * alphaDifference)) +
      1) /
    2;
  const w2 = 1 - w1;
  return {
    r: w1 * mixin.r + w2 * color.r,
    g: w1 * mixin.g + w2 * color.g,
    b: w1 * mixin.b + w2 * color.b,
    alpha: mixin.alpha * p + color.alpha * (1 - p),
  };
}
