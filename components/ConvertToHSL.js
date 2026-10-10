import { Component } from "@noflo/noflo";
import { hslString, parseColor } from "../lib/ColorSpace.js";

/**
 * Converts a color to a CSS `hsl()`/`hsla()` string.
 * @returns {import("@noflo/noflo").Component} The configured component
 */
export function getComponent() {
  const c = new Component({
    description: "Converts a given color to HSL",
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
        description: "CSS hsl() color string",
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
    output.sendDone({ color: hslString(color) });
  });

  return c;
}
