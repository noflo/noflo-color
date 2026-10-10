import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as noflo from "@noflo/noflo";

import { getComponent as getChromatose } from "../components/Chromatose.js";
import { getComponent as getConvertToHSL } from "../components/ConvertToHSL.js";
import { getComponent as getConvertToRGB } from "../components/ConvertToRGB.js";
import { getComponent as getContrast } from "../components/GetContrast.js";
import { getComponent as getLuminosity } from "../components/GetLuminosity.js";
import { getComponent as getIsDark } from "../components/IsDark.js";
import { getComponent as getIsLight } from "../components/IsLight.js";
import { getComponent as getMix } from "../components/Mix.js";
import { getComponent as getTransform } from "../components/Transform.js";

/**
 * Waits for the next IP on a socket matching the predicate.
 *
 * Attach the returned promise before sending any IPs: the activation can
 * complete synchronously inside the post that completes preconditions.
 * @param {import("@noflo/noflo").internalSocket.InternalSocket} socket
 * @param {(ip: import("@noflo/noflo").IP) => boolean} predicate
 * @returns {Promise<import("@noflo/noflo").IP>}
 */
const waitUntil = (socket, predicate) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for IP"));
    }, 2000);
    /** @param {CustomEvent} event */
    const listener = (event) => {
      const ip = event.detail;
      if (predicate(ip)) {
        cleanup();
        resolve(ip);
      }
    };
    const cleanup = () => {
      clearTimeout(timer);
      socket.removeEventListener("ip", listener);
    };
    socket.addEventListener("ip", listener);
  });

/**
 * Sends a data IP and waits for the next data IP on the out socket.
 * @param {import("@noflo/noflo").internalSocket.InternalSocket} inSocket
 * @param {import("@noflo/noflo").internalSocket.InternalSocket} outSocket
 * @param {unknown} value
 * @param {string} [port]
 * @returns {Promise<unknown>}
 */
const sendAndExpect = async (inSocket, outSocket, value, port = "in") => {
  const received = waitUntil(outSocket, (ip) => ip.type === "data");
  inSocket.post(new noflo.IP("data", value));
  const ip = await received;
  return ip.data?.[port] ?? ip.data;
};

describe("ConvertToRGB component", () => {
  it("converts a color to an rgb string", async () => {
    const c = getConvertToRGB();
    const inSocket = noflo.internalSocket.createSocket();
    const outSocket = noflo.internalSocket.createSocket();
    c.inPorts.color.attach(inSocket);
    c.outPorts.color.attach(outSocket);
    try {
      assert.equal(
        await sendAndExpect(inSocket, outSocket, "#ff0000", "color"),
        "rgb(255, 0, 0)",
      );
      assert.equal(
        await sendAndExpect(inSocket, outSocket, "papayawhip", "color"),
        "rgb(255, 239, 213)",
      );
    } finally {
      await c.shutdown();
    }
  });
  it("sends a parse failure to the error port", async () => {
    const c = getConvertToRGB();
    const inSocket = noflo.internalSocket.createSocket();
    const errorSocket = noflo.internalSocket.createSocket();
    c.inPorts.color.attach(inSocket);
    c.outPorts.error.attach(errorSocket);
    try {
      const errored = waitUntil(errorSocket, (ip) => ip.type === "data");
      inSocket.post(new noflo.IP("data", "not-a-color"));
      const ip = await errored;
      assert.ok(ip.data instanceof Error);
    } finally {
      await c.shutdown();
    }
  });
});

describe("ConvertToHSL component", () => {
  it("converts a color to an hsl string", async () => {
    const c = getConvertToHSL();
    const inSocket = noflo.internalSocket.createSocket();
    const outSocket = noflo.internalSocket.createSocket();
    c.inPorts.color.attach(inSocket);
    c.outPorts.color.attach(outSocket);
    try {
      assert.equal(
        await sendAndExpect(inSocket, outSocket, "#ff0000", "color"),
        "hsl(0, 100%, 50%)",
      );
    } finally {
      await c.shutdown();
    }
  });
});

describe("IsDark component", () => {
  it("detects dark and light colors", async () => {
    const c = getIsDark();
    const inSocket = noflo.internalSocket.createSocket();
    const outSocket = noflo.internalSocket.createSocket();
    c.inPorts.color.attach(inSocket);
    c.outPorts.dark.attach(outSocket);
    try {
      assert.equal(
        await sendAndExpect(inSocket, outSocket, "#333333", "dark"),
        true,
      );
      assert.equal(
        await sendAndExpect(inSocket, outSocket, "#cccccc", "dark"),
        false,
      );
    } finally {
      await c.shutdown();
    }
  });
});

describe("IsLight component", () => {
  it("detects light and dark colors", async () => {
    const c = getIsLight();
    const inSocket = noflo.internalSocket.createSocket();
    const outSocket = noflo.internalSocket.createSocket();
    c.inPorts.color.attach(inSocket);
    c.outPorts.light.attach(outSocket);
    try {
      assert.equal(
        await sendAndExpect(inSocket, outSocket, "#cccccc", "light"),
        true,
      );
      assert.equal(
        await sendAndExpect(inSocket, outSocket, "#333333", "light"),
        false,
      );
    } finally {
      await c.shutdown();
    }
  });
});

describe("GetLuminosity component", () => {
  it("computes relative luminosity", async () => {
    const c = getLuminosity();
    const inSocket = noflo.internalSocket.createSocket();
    const outSocket = noflo.internalSocket.createSocket();
    c.inPorts.color.attach(inSocket);
    c.outPorts.luminosity.attach(outSocket);
    try {
      assert.equal(
        await sendAndExpect(inSocket, outSocket, "#ffffff", "luminosity"),
        1,
      );
      assert.equal(
        await sendAndExpect(inSocket, outSocket, "#000000", "luminosity"),
        0,
      );
    } finally {
      await c.shutdown();
    }
  });
});

describe("GetContrast component", () => {
  it("computes the WCAG contrast ratio", async () => {
    const c = getContrast();
    const colorSocket = noflo.internalSocket.createSocket();
    const referenceSocket = noflo.internalSocket.createSocket();
    const outSocket = noflo.internalSocket.createSocket();
    c.inPorts.color.attach(colorSocket);
    c.inPorts.reference.attach(referenceSocket);
    c.outPorts.contrast.attach(outSocket);
    try {
      const received = waitUntil(outSocket, (ip) => ip.type === "data");
      referenceSocket.post(new noflo.IP("data", "#ffffff"));
      colorSocket.post(new noflo.IP("data", "#000000"));
      const ip = await received;
      assert.equal(ip.data, 21);
    } finally {
      await c.shutdown();
    }
  });
});

describe("Mix component", () => {
  it("mixes colors with a reference", async () => {
    const c = getMix();
    const colorSocket = noflo.internalSocket.createSocket();
    const referenceSocket = noflo.internalSocket.createSocket();
    const outSocket = noflo.internalSocket.createSocket();
    c.inPorts.color.attach(colorSocket);
    c.inPorts.reference.attach(referenceSocket);
    c.outPorts.color.attach(outSocket);
    try {
      const received = waitUntil(outSocket, (ip) => ip.type === "data");
      referenceSocket.post(new noflo.IP("data", "#0000ff"));
      colorSocket.post(new noflo.IP("data", "#ff0000"));
      const ip = await received;
      assert.equal(ip.data, "hsl(300, 100%, 25%)");
    } finally {
      await c.shutdown();
    }
  });
  it("honors an optional weight", async () => {
    const c = getMix();
    const colorSocket = noflo.internalSocket.createSocket();
    const referenceSocket = noflo.internalSocket.createSocket();
    const weightSocket = noflo.internalSocket.createSocket();
    const outSocket = noflo.internalSocket.createSocket();
    c.inPorts.color.attach(colorSocket);
    c.inPorts.reference.attach(referenceSocket);
    c.inPorts.weight.attach(weightSocket);
    c.outPorts.color.attach(outSocket);
    try {
      const received = waitUntil(outSocket, (ip) => ip.type === "data");
      referenceSocket.post(new noflo.IP("data", "#0000ff"));
      weightSocket.post(new noflo.IP("data", 0.25));
      colorSocket.post(new noflo.IP("data", "#ff0000"));
      const ip = await received;
      assert.equal(ip.data, "hsl(340, 100%, 37.5%)");
    } finally {
      await c.shutdown();
    }
  });
});

describe("Transform component", () => {
  it("applies received operations in port order", async () => {
    const c = getTransform();
    const colorSocket = noflo.internalSocket.createSocket();
    const lightenSocket = noflo.internalSocket.createSocket();
    const rotateSocket = noflo.internalSocket.createSocket();
    const outSocket = noflo.internalSocket.createSocket();
    c.inPorts.color.attach(colorSocket);
    c.inPorts.lighten.attach(lightenSocket);
    c.inPorts.rotate.attach(rotateSocket);
    c.outPorts.color.attach(outSocket);
    try {
      const received = waitUntil(outSocket, (ip) => ip.type === "data");
      // Operations are control ports: send them before the color, like
      // network-delivered controls would arrive
      lightenSocket.post(new noflo.IP("data", 0.3));
      rotateSocket.post(new noflo.IP("data", 60));
      colorSocket.post(new noflo.IP("data", "#64748b"));
      const ip = await received;
      // 1.x applied operations in arrival order; 2.x applies them in a
      // fixed port order: lighten first, then rotate
      assert.equal(ip.data, "hsl(275.4, 16.3%, 60.9%)");
    } finally {
      await c.shutdown();
    }
  });
  it("does not send a color without any operation", async () => {
    const c = getTransform();
    const inSocket = noflo.internalSocket.createSocket();
    const outSocket = noflo.internalSocket.createSocket();
    c.inPorts.color.attach(inSocket);
    c.outPorts.color.attach(outSocket);
    try {
      const silence = waitUntil(outSocket, () => true).then(
        () => {
          throw new Error("Should not have sent");
        },
        () => "timed-out",
      );
      inSocket.post(new noflo.IP("data", "#64748b"));
      assert.equal(await silence, "timed-out");
    } finally {
      await c.shutdown();
    }
  });
});

describe("Chromatose component", () => {
  it("derives a palette from a dominant color", async () => {
    const c = getChromatose();
    const colorSocket = noflo.internalSocket.createSocket();
    const formatSocket = noflo.internalSocket.createSocket();
    const outSocket = noflo.internalSocket.createSocket();
    c.inPorts.color.attach(colorSocket);
    c.inPorts.format.attach(formatSocket);
    c.outPorts.palette.attach(outSocket);
    try {
      const received = waitUntil(outSocket, (ip) => ip.type === "data");
      formatSocket.post(new noflo.IP("data", "hsl"));
      colorSocket.post(new noflo.IP("data", "#64748b"));
      const ip = await received;
      const palette = ip.data;
      assert.deepEqual(Object.keys(palette).sort(), [
        "box",
        "meta",
        "meta_highlight",
        "prime",
        "text",
      ]);
      // #64748b lands in the vibrant branch: box at hue 220, 80%, 60%
      assert.equal(palette.box, "hsla(220, 80%, 60%, 0.95)");
      assert.ok(
        palette.text === "hsl(0, 0%, 0%)" ||
          palette.text === "hsl(0, 0%, 100%)",
      );
      assert.equal(typeof palette.prime, "string");
    } finally {
      await c.shutdown();
    }
  });
  it("renders palettes in the requested format", async () => {
    const c = getChromatose();
    const colorSocket = noflo.internalSocket.createSocket();
    const formatSocket = noflo.internalSocket.createSocket();
    const outSocket = noflo.internalSocket.createSocket();
    c.inPorts.color.attach(colorSocket);
    c.inPorts.format.attach(formatSocket);
    c.outPorts.palette.attach(outSocket);
    try {
      const received = waitUntil(outSocket, (ip) => ip.type === "data");
      formatSocket.post(new noflo.IP("data", "hex"));
      colorSocket.post(new noflo.IP("data", "#64748b"));
      const ip = await received;
      const palette = ip.data;
      for (const value of Object.values(palette)) {
        assert.match(value, /^#[0-9A-F]{6}$/);
      }
    } finally {
      await c.shutdown();
    }
  });
});
