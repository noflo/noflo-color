import { Component } from "@noflo/noflo";
import {
  hexString,
  hslString,
  isDark,
  parseColor,
  rgbString,
} from "../lib/ColorSpace.js";

/**
 * Normalizes a hue angle into the 0..360 range.
 * @param {number} hue
 * @returns {number}
 */
function normalizeHue(hue) {
  return ((hue % 360) + 360) % 360;
}

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
 * The formats the palette strings can be rendered in.
 * @typedef {"hsl" | "rgb" | "hex"} PaletteFormat
 */

/**
 * Formats a color in the requested palette format.
 * @param {import("../lib/ColorSpace.js").Rgba} color
 * @param {PaletteFormat} format
 * @returns {string}
 */
function formatColor(color, format) {
  if (format === "rgb") {
    return rgbString(color);
  }
  if (format === "hex") {
    return hexString(color);
  }
  return hslString(color);
}

/**
 * Derives the palette for a dominant color: a background box color, a
 * readable text color, tone-on-tone meta colors, and a prime accent.
 *
 * This reimplements the intended 1.x design; the 1.x component had runtime
 * bugs (a self-referencing `getData` and an invalid `{h,s,l,a}` color
 * object) that prevented it from ever producing output.
 *
 * @param {import("../lib/ColorSpace.js").Rgba} dominant
 * @param {PaletteFormat} format
 * @returns {Record<string, string>}
 */
function solve(dominant, format) {
  // Convert to HSL in degrees/percent units like the original design
  const toHslDegrees = (/** @type {typeof dominant} */ c) => {
    const r = c.r;
    const g = c.g;
    const b = c.b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) {
        h = ((g - b) / d) % 6;
      } else if (max === g) {
        h = (b - r) / d + 2;
      } else {
        h = (r - g) / d + 4;
      }
      h = normalizeHue(h * 60);
    }
    const l = (max + min) / 2;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    return { h, s: s * 100, l: l * 100 };
  };

  const { h, s, l } = toHslDegrees(dominant);

  // Box background color
  const boxHue = Math.round(h / 10) * 10;
  let boxSaturation = s;
  let boxLightness = l;
  let boxAlpha = 1;
  /** @type {boolean | undefined} */
  let isDarkColor;
  /** @type {boolean | undefined} */
  let isVibrant;
  if (l <= 35 || (l <= 50 && s <= 15)) {
    isDarkColor = true;
    boxLightness = Math.min(l, 20);
    if (s >= 10) {
      boxSaturation = 50;
    }
  } else if (l >= 75 || (l >= 50 && s <= 15)) {
    boxLightness = Math.max(l, 95);
    if (s >= 10) {
      boxSaturation = 50;
    }
  } else {
    isVibrant = true;
    boxSaturation = Math.max(80, s);
    boxLightness = 60;
    boxAlpha = 0.95;
  }
  const box = parseColor({
    h: boxHue,
    s: clamp(boxSaturation, 0, 100),
    l: clamp(boxLightness, 0, 100),
    alpha: boxAlpha,
  });
  if (!box) {
    throw new Error("Unable to derive box color");
  }

  // Text color
  const textColor = isDark(box) ? parseColor("white") : parseColor("black");
  if (!textColor) {
    throw new Error("Unable to derive text color");
  }

  // Tone-on-tone meta colors
  /** @type {{ h: number, s: number, l: number }} */
  let metaColor;
  /** @type {{ h: number, s: number, l: number }} */
  let metaHighlightColor;
  if (isVibrant) {
    if (isDark(box)) {
      metaColor = { h: boxHue, s: boxSaturation - 20, l: boxLightness + 20 };
      metaHighlightColor = {
        h: boxHue,
        s: boxSaturation,
        l: boxLightness + 30,
      };
    } else {
      metaColor = { h: boxHue, s: boxSaturation - 20, l: boxLightness - 20 };
      metaHighlightColor = {
        h: boxHue,
        s: boxSaturation,
        l: boxLightness - 30,
      };
    }
  } else if (isDarkColor) {
    metaColor = { h: boxHue, s, l: boxLightness + 40 };
    metaHighlightColor = { h: boxHue, s: s + 40, l: boxLightness + 40 };
  } else {
    metaColor = { h: boxHue, s, l: boxLightness - 20 };
    metaHighlightColor = { h: boxHue, s: s + 30, l: boxLightness - 20 };
  }

  const parseMeta = (
    /** @type {{ h: number, s: number, l: number }} */ color,
  ) => {
    const parsed = parseColor({
      h: color.h,
      s: clamp(color.s, 0, 100),
      l: clamp(color.l, 0, 100),
    });
    if (!parsed) {
      throw new Error("Unable to derive meta color");
    }
    return parsed;
  };
  const meta = parseMeta(metaColor);
  const metaHighlight = parseMeta(metaHighlightColor);

  // Prime color: meta highlight with a saturation floor
  const primeHsl = toHslDegrees(metaHighlight);
  const prime = parseColor({
    h: primeHsl.h,
    s: Math.max(primeHsl.s, 80),
    l: primeHsl.l,
  });
  if (!prime) {
    throw new Error("Unable to derive prime color");
  }

  return {
    box: formatColor(box, format),
    text: formatColor(textColor, format),
    meta: formatColor(meta, format),
    meta_highlight: formatColor(metaHighlight, format),
    prime: formatColor(prime, format),
  };
}

/**
 * Generates a box/text/meta/prime palette from a dominant color.
 * @returns {import("@noflo/noflo").Component} The configured component
 */
export function getComponent() {
  const c = new Component({
    description: "Derives a color palette from a dominant color",
    icon: "tint",
    inPorts: {
      color: {
        datatype: "all",
        description: "Dominant color to derive the palette from",
        required: true,
      },
      format: {
        datatype: "string",
        description: "Palette string format: hsl, rgb, or hex",
        control: true,
        default: "hsl",
      },
    },
    outPorts: {
      palette: {
        datatype: "object",
        description: "Palette with box, text, meta, meta_highlight, prime",
      },
      error: {
        datatype: "object",
      },
    },
  });

  c.process((input, output) => {
    if (!input.hasData("color", "format")) {
      return;
    }
    const color = parseColor(input.getData("color"));
    if (!color) {
      output.error(
        new Error(`Unable to parse color: ${input.getData("color")}`),
      );
      output.done();
      return;
    }
    const format = input.getData("format");
    if (format !== "hsl" && format !== "rgb" && format !== "hex") {
      output.error(new Error(`Unknown palette format: ${format}`));
      output.done();
      return;
    }
    output.sendDone({ palette: solve(color, format) });
  });

  return c;
}
