# noflo-color — Color manipulation for NoFlo

Color manipulation components for [NoFlo](https://noflojs.org): conversion, WCAG luminosity and contrast, dark/light checks, Sass-compatible mixing, hue and channel transforms, and palette generation.

Part of the NoFlo 2.x component library family. Requires Node.js >= 22, and runs on Deno and Bun as well. All components are isomorphic: they run unmodified in browsers and use no Node.js-specific APIs.

## Usage

    npm install @noflo/color

Component identifiers in graphs are `color/<Component>`, for example `color/Mix`. See `noflo.json` for the machine-readable component manifest.

## Components

All components accept a single color per input packet; collections of colors flow as streams. Colors can be given as CSS strings (hex, `rgb()`, `hsl()`, named colors and other CSS Color 4 syntax), 24-bit integers, or objects in the legacy `{r,g,b}` / `{h,s,l}` / `{h,s,v}` units. Invalid colors are sent to the `error` port.

- **color/ConvertToRGB** — converts a color to a CSS `rgb()`/`rgba()` string
- **color/ConvertToHSL** — converts a color to a CSS `hsl()`/`hsla()` string
- **color/IsDark** — whether a color appears dark (YIQ equation)
- **color/IsLight** — whether a color appears light
- **color/GetLuminosity** — WCAG relative luminosity (0..1)
- **color/GetContrast** — WCAG contrast ratio between a color and a `reference` color (1 close, 21 far)
- **color/Mix** — mixes a color with a `reference` color using the Sass weighted RGB algorithm; optional `weight` (0 = reference, 1 = color)
- **color/Transform** — applies any of the `lighten`, `darken`, `saturate`, `desaturate`, `whiten`, `blacken`, `clearer`, `opaquer` (0..1 ratios) and `rotate` (degrees) operations to a color, in that fixed order. Operations are control ports; a color without any operation produces no output
- **color/Chromatose** — derives a palette (`box`, `text`, `meta`, `meta_highlight`, `prime`) from a dominant color, rendered in the `format` (`hsl`, `rgb`, or `hex`)

## Development

    npm test

The test suite runs TypeScript checks, Biome lint, fbp-spec cases from `spec/`, and `node:test` suites from `test/`.

## License

MIT
