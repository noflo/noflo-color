import { Component } from "@noflo/noflo";
import {
  blacken,
  clearer,
  darken,
  desaturate,
  hslString,
  lighten,
  opaquer,
  parseColor,
  rotate,
  saturate,
  whiten,
} from "../lib/ColorSpace.js";

/**
 * Applies the transformation operations that received data, in fixed port
 * order. Each operation takes a 0..1 ratio (rotate takes degrees).
 * @param {import("../lib/ColorSpace.js").Rgba} color
 * @param {Record<string, number>} operations Values received on the operation ports
 * @returns {import("../lib/ColorSpace.js").Rgba}
 */
function transform(color, operations) {
  let result = color;
  if (operations.lighten !== undefined) {
    result = lighten(result, operations.lighten);
  }
  if (operations.darken !== undefined) {
    result = darken(result, operations.darken);
  }
  if (operations.saturate !== undefined) {
    result = saturate(result, operations.saturate);
  }
  if (operations.desaturate !== undefined) {
    result = desaturate(result, operations.desaturate);
  }
  if (operations.whiten !== undefined) {
    result = whiten(result, operations.whiten);
  }
  if (operations.blacken !== undefined) {
    result = blacken(result, operations.blacken);
  }
  if (operations.clearer !== undefined) {
    result = clearer(result, operations.clearer);
  }
  if (operations.opaquer !== undefined) {
    result = opaquer(result, operations.opaquer);
  }
  if (operations.rotate !== undefined) {
    result = rotate(result, operations.rotate);
  }
  return result;
}

const operations = [
  "lighten",
  "darken",
  "saturate",
  "desaturate",
  "whiten",
  "blacken",
  "clearer",
  "opaquer",
  "rotate",
];

/**
 * Transforms a color by applying the given operation parameters.
 * @returns {import("@noflo/noflo").Component} The configured component
 */
export function getComponent() {
  const c = new Component({
    description: "Transforms a color applying the given parameters",
    icon: "tint",
    inPorts: {
      color: {
        datatype: "all",
        description: "Color to transform",
        required: true,
      },
      ...Object.fromEntries(
        operations.map((name) => [
          name,
          {
            datatype: "number",
            description:
              name === "rotate"
                ? "Angle in degrees (0..360)"
                : "Intensity (0..1)",
            required: false,
            control: true,
          },
        ]),
      ),
    },
    outPorts: {
      color: {
        datatype: "string",
        description: "Transformed color as CSS hsl() string",
      },
      error: {
        datatype: "object",
      },
    },
  });

  c.process((input, output) => {
    if (!input.hasData("color")) {
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
    /** @type {Record<string, number>} */
    const values = {};
    for (const name of operations) {
      if (input.hasData(name)) {
        values[name] = input.getData(name);
      }
    }
    // Like the 1.x helper contract, a color without any operation does
    // not produce output
    if (Object.keys(values).length === 0) {
      output.done();
      return;
    }
    output.sendDone({ color: hslString(transform(color, values)) });
  });

  return c;
}
