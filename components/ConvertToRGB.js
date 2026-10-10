import { Component } from "@noflo/noflo";
import { parseColor, rgbString } from "../lib/ColorSpace.js";

/**
 * Converts a color to a CSS `rgb()`/`rgba()` string.
 * @returns {import("@noflo/noflo").Component} The configured component
 */
export function getComponent() {
  const c = new Component({
    description: "Converts a given color to RGB",
    icon: "tint",
    inPorts: {
      color: {
        datatype: "all",
        description: "Color to convert",
        required: true,
      },
    },
    outPorts: {
      color: {
        datatype: "string",
        description: "CSS rgb() color string",
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
    output.sendDone({ color: rgbString(color) });
  });

  return c;
}
