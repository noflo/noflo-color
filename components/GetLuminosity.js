import { Component } from "@noflo/noflo";
import { luminance, parseColor } from "../lib/ColorSpace.js";

/**
 * Computes the WCAG relative luminosity of a color.
 * @returns {import("@noflo/noflo").Component} The configured component
 */
export function getComponent() {
  const c = new Component({
    description: "Get the relative luminosity of a given color",
    icon: "tint",
    inPorts: {
      color: {
        datatype: "all",
        description: "Color to get luminosity of",
        required: true,
      },
    },
    outPorts: {
      luminosity: {
        datatype: "number",
        description: "Relative luminosity, 0..1",
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
    output.sendDone({ luminosity: luminance(color) });
  });

  return c;
}
