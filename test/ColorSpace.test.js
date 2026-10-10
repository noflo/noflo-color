import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  blacken,
  clearer,
  contrast,
  darken,
  desaturate,
  hexString,
  hslString,
  isDark,
  isLight,
  lighten,
  luminance,
  mix,
  opaquer,
  parseColor,
  rgbString,
  rotate,
  saturate,
  whiten,
} from "../lib/ColorSpace.js";

/**
 * Parses a color, asserting the input is valid.
 * @param {string | number | Record<string, number | undefined>} value
 * @returns {import("../lib/ColorSpace.js").Rgba}
 */
const color = (value) => {
  const parsed = parseColor(value);
  assert.ok(parsed);
  return parsed;
};

// Expected values are golden values generated with the `color` package
// v2, whose semantics this module preserves. One intentional divergence:
// hue values print cleanly (215.4) instead of the 1.x floating point
// artifact (215.39999999999998) caused by the `color` package re-applying
// hue normalization after rounding.

describe("parseColor", () => {
  it("parses hex strings", () => {
    assert.deepEqual(color("#ff0000"), { r: 1, g: 0, b: 0, alpha: 1 });
  });
  it("parses rgb() strings", () => {
    const parsed = color("rgb(20, 30, 90)");
    assert.ok(parsed);
    assert.equal(Math.round(parsed.r * 255), 20);
    assert.equal(Math.round(parsed.g * 255), 30);
    assert.equal(Math.round(parsed.b * 255), 90);
  });
  it("parses hsl() strings", () => {
    const parsed = color("hsl(180, 50%, 40%)");
    assert.ok(parsed);
    assert.equal(hslString(parsed), "hsl(180, 50%, 40%)");
  });
  it("parses named colors", () => {
    const parsed = color("papayawhip");
    assert.ok(parsed);
    assert.equal(rgbString(parsed), "rgb(255, 239, 213)");
  });
  it("parses transparent", () => {
    const parsed = color("transparent");
    assert.ok(parsed);
    assert.equal(parsed.alpha, 0);
  });
  it("parses 24-bit numbers", () => {
    const parsed = color(0x3366ff);
    assert.ok(parsed);
    assert.equal(rgbString(parsed), "rgb(51, 102, 255)");
  });
  it("parses {r,g,b} objects in 0..255 units", () => {
    const parsed = color({ r: 20, g: 30, b: 90 });
    assert.ok(parsed);
    assert.equal(rgbString(parsed), "rgb(20, 30, 90)");
  });
  it("parses {h,s,l} objects in legacy units", () => {
    const parsed = color({ h: 120, s: 50, l: 40 });
    assert.ok(parsed);
    assert.equal(hslString(parsed), "hsl(120, 50%, 40%)");
  });
  it("parses {h,s,v} objects in legacy units", () => {
    const parsed = color({ h: 0, s: 100, v: 100 });
    assert.ok(parsed);
    assert.equal(rgbString(parsed), "rgb(255, 0, 0)");
  });
  it("reads the alpha key on objects", () => {
    const parsed = color({ h: 120, s: 50, l: 40, alpha: 0.5 });
    assert.ok(parsed);
    assert.equal(parsed.alpha, 0.5);
  });
  it("rejects arrays and garbage", () => {
    assert.equal(parseColor(["ff", "00", "00"]), null);
    assert.equal(parseColor("not-a-color"), null);
    assert.equal(parseColor({ foo: 1 }), null);
    assert.equal(parseColor(null), null);
  });
});

describe("formatting", () => {
  it("formats rgb strings like the color package", () => {
    assert.equal(rgbString(color("#ff0000")), "rgb(255, 0, 0)");
    assert.equal(
      rgbString(color("rgba(100, 150, 200, 0.5)")),
      "rgba(100, 150, 200, 0.5)",
    );
  });
  it("formats hsl strings like the color package", () => {
    assert.equal(hslString(color("#ff0000")), "hsl(0, 100%, 50%)");
    assert.equal(hslString(color("#64748b")), "hsl(215.4, 16.3%, 46.9%)");
    assert.equal(
      hslString(color("rgba(100, 150, 200, 0.5)")),
      "hsla(210, 47.6%, 58.8%, 0.5)",
    );
  });
  it("formats hex strings like the color package", () => {
    assert.equal(hexString(color("#64748b")), "#64748B");
    // The color package's hex() drops alpha; we match that
    assert.equal(hexString(color("rgba(100, 150, 200, 0.5)")), "#6496C8");
  });
});

describe("luminance and contrast", () => {
  it("computes WCAG luminosity", () => {
    assert.equal(luminance(color("#ffffff")), 1);
    assert.equal(luminance(color("#000000")), 0);
    assert.equal(luminance(color("#64748b")), 0.17064187593603225);
  });
  it("computes WCAG contrast ratios", () => {
    assert.equal(contrast(color("#000000"), color("#ffffff")), 21);
    assert.equal(
      contrast(color("#64748b"), color("#ffffff")),
      4.758842787868666,
    );
  });
});

describe("dark and light", () => {
  it("uses the YIQ equation", () => {
    assert.equal(isDark(color("#333333")), true);
    assert.equal(isDark(color("#cccccc")), false);
    assert.equal(isDark(color("#64748b")), true);
    assert.equal(isLight(color("#333333")), false);
    assert.equal(isLight(color("#cccccc")), true);
  });
});

describe("transform operations", () => {
  /** @param {import("../lib/ColorSpace.js").Rgba} color */
  const hsl = (color) => hslString(color);

  it("lightens multiplicatively", () => {
    assert.equal(
      hsl(lighten(color("#64748b"), 0.3)),
      "hsl(215.4, 16.3%, 60.9%)",
    );
  });
  it("darkens multiplicatively", () => {
    assert.equal(
      hsl(darken(color("#64748b"), 0.3)),
      "hsl(215.4, 16.3%, 32.8%)",
    );
  });
  it("saturates multiplicatively", () => {
    assert.equal(
      hsl(saturate(color("#64748b"), 0.5)),
      "hsl(215.4, 24.5%, 46.9%)",
    );
  });
  it("desaturates multiplicatively", () => {
    assert.equal(
      hsl(desaturate(color("#64748b"), 0.5)),
      "hsl(215.4, 8.2%, 46.9%)",
    );
  });
  it("whitens via the HWB white channel", () => {
    assert.equal(hsl(whiten(color("#64748b"), 0.4)), "hsl(0, 0%, 54.7%)");
  });
  it("blackens via the HWB black channel", () => {
    assert.equal(hsl(blacken(color("#64748b"), 0.4)), "hsl(60, 0%, 38.1%)");
  });
  it("reduces opacity like fade", () => {
    const faded = clearer(color("rgba(100, 150, 200, 0.5)"), 0.5);
    assert.equal(rgbString(faded), "rgba(100, 150, 200, 0.25)");
  });
  it("increases opacity", () => {
    const opaque = opaquer(color("rgba(100, 150, 200, 0.5)"), 0.5);
    assert.equal(rgbString(opaque), "rgba(100, 150, 200, 0.75)");
  });
  it("rotates hue, wrapping negatives", () => {
    assert.equal(hsl(rotate(color("#64748b"), 60)), "hsl(275.4, 16.3%, 46.9%)");
    assert.equal(
      hsl(rotate(color("#64748b"), -60)),
      "hsl(155.4, 16.3%, 46.9%)",
    );
    assert.equal(
      hsl(rotate(color("#64748b"), 300)),
      "hsl(155.4, 16.3%, 46.9%)",
    );
  });
});

describe("mix", () => {
  it("matches the Sass weighted algorithm", () => {
    assert.equal(
      hslString(mix(color("#ff0000"), color("#0000ff"))),
      "hsl(300, 100%, 25%)",
    );
    assert.equal(
      hslString(mix(color("#ff0000"), color("#0000ff"), 0.25)),
      "hsl(340, 100%, 37.5%)",
    );
    assert.equal(
      hslString(mix(color("#ff0000"), color("#0000ff"), 0.75)),
      "hsl(260, 100%, 37.5%)",
    );
  });
  it("weights alpha like the color package", () => {
    assert.equal(
      rgbString(mix(color("rgba(255, 0, 0, 0.8)"), color("#0000ff"))),
      "rgba(102, 0, 153, 0.9)",
    );
  });
});
