import { Component } from "@noflo/noflo";
import { isLight, parseColor } from "../lib/ColorSpace.js";

/**
 * Checks whether a color appears light.
 * @returns {import("@noflo/noflo").Component} The configured component
 */
export function getComponent() {
  const c = new Component({
    description: "Check if a light color",
    icon: "tint",
    inPorts: {
      color: {
        datatype: "all",
        description: "Color to check",
        required: true,
      },
    },
    outPorts: {
      light: {
        datatype: "boolean",
        description: "Whether the color appears light",
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
    output.sendDone({ light: isLight(color) });
  });

  return c;
}
