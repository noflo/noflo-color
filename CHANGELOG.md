# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Changed

- Package renamed to `@noflo/color`; the version resets to the 2.x generation (2.0.0-alpha.1) for the fresh package name. Component addressing is unchanged — library IDs derive identically from the scoped name, so component and graph names stay the same. The old `noflo-color` will be deprecated with a pointer once 2.x reaches stable
- Migrated to NoFlo 2.x: components now depend on `@noflo/noflo` ^2.0.0 instead of the unscoped `noflo` 1.x package; components export a named `getComponent`
- Package is now plain ESM with no build step; supported runtime is Node.js >= 22 (components also run under Deno and Bun); indentation normalized to spaces per the repository EditorConfig
- Replaced the `color` dependency with `culori` for parsing and conversion. The `color` package v2 semantics are preserved exactly where they matter: WCAG luminosity and contrast, YIQ dark/light checks, Sass weighted RGB mixing, multiplicative HSL/HWB adjustments, comma-syntax output strings, and integer/one-decimal rounding. Intentional divergences: hue values print cleanly (for example `215.4`) instead of the 1.x floating point artifact (`215.39999999999998`), and modern CSS Color 4 syntax is accepted in addition to 1.x syntax
- Removed the `noflo-helper-arrayable` dependency: all components now accept one color per activation and emit one result per activation. The 1.x helper's "accept one item or array" behavior is retired; collections of colors flow as streams. Per-activation port contracts are otherwise preserved (required `color`/`reference` ports, optional `weight`, fixed operation order in `Transform`)
- `color/Transform` operation ports are now control ports and operations apply in a fixed port order; 1.x applied them in data arrival order
- `color/ConvertToRGB` and `color/ConvertToHSL` no longer accept arrays of colors — the 1.x components had polymorphic one-or-array contracts

### Fixed

- `color/Transform` `clearer` operation now works: the `color` package v2 removed `clearer()`, so the 1.x component crashed when that port received data; 2.x implements the intended alpha reduction directly
- `color/Chromatose` now produces output: the 1.x component had a self-referencing `getData` call that always failed, and built colors with an invalid `{h,s,l,a}` object that the `color` package rejected. The 2.x component reimplements the intended palette design with a singular `color` input and validated `format` (`hsl`, `rgb`, `hex`)
- Unparseable colors are reported on the `error` port instead of throwing inside the process function

### Added

- `test/` suite with `node:test` covering the color space module (against `color` package v2 golden values) and every component's wiring
- `spec/` fbp-spec cases for the pure components
- Publish-time `noflo.json` component manifest
