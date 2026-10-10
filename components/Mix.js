import { Component } from "@noflo/noflo";
import { hslString, mix, parseColor } from "../lib/ColorSpace.js";

/**
 * Mixes a color with a reference color using the Sass weighted RGB
 * algorithm, matching 1.x output.
 * @returns {import("@noflo/noflo").Component} The configured component
 */
export function getComponent() {
  const c = new Component({
    description: "Mix the given colors with a reference color",
    icon: "tint",
    inPorts: {
      color: {
        datatype: "all",
        description: "Color to mix",
        required: true,
      },
      reference: {
        datatype: "all",
        description: "A reference color",
        required: true,
      },
      weight: {
        datatype: "number",
        description: "Weight (0 first, 1 second)",
        required: false,
      },
    },
    outPorts: {
      color: {
        datatype: "string",
        description: "Mixed color as CSS hsl() string",
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
    let weight;
    if (input.hasData("weight")) {
      weight = input.getData("weight");
    }
    output.sendDone({ color: hslString(mix(color, reference, weight)) });
  });

  return c;
}
