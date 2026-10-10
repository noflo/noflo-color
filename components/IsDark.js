import { Component } from "@noflo/noflo";
import { isDark, parseColor } from "../lib/ColorSpace.js";

/**
 * Checks whether a color appears dark, using the YIQ equation.
 * @returns {import("@noflo/noflo").Component} The configured component
 */
export function getComponent() {
  const c = new Component({
    description: "Check if a dark color",
    icon: "tint",
    inPorts: {
      color: {
        datatype: "all",
        description: "Color to check",
        required: true,
      },
    },
    outPorts: {
      dark: {
        datatype: "boolean",
        description: "Whether the color appears dark",
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
    output.sendDone({ dark: isDark(color) });
  });

  return c;
}
