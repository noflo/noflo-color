import { Component } from "@noflo/noflo";
import { contrast, parseColor } from "../lib/ColorSpace.js";

/**
 * Computes the WCAG contrast ratio between a color and a reference color.
 * @returns {import("@noflo/noflo").Component} The configured component
 */
export function getComponent() {
  const c = new Component({
    description:
      "Get the contrast ratio to a reference color (1 close, 21 far)",
    icon: "tint",
    inPorts: {
      color: {
        datatype: "all",
        description: "Color to get contrast of",
        required: true,
      },
      reference: {
        datatype: "all",
        description: "A reference color",
        required: true,
      },
    },
    outPorts: {
      contrast: {
        datatype: "number",
        description: "WCAG contrast ratio",
      },
      error: {
        datatype: "object",
      },
    },
  });

  c.process((input, output) => {
    if (!input.hasData("color", "reference")) {
      return;
    }
    const color = parseColor(input.getData("color"));
    const reference = parseColor(input.getData("reference"));
    if (!color || !reference) {
      output.error(
        new Error(`Unable to parse color: ${!color ? "color" : "reference"}`),
      );
      output.done();
      return;
    }
    output.sendDone({ contrast: contrast(color, reference) });
  });

  return c;
}
