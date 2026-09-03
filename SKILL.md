---
name: graphite-dashboard-design
description: Create or restyle dashboards with layered black and graphite surfaces, restrained glow, and clear numeric typography. Use for analytics, admin panels, and work interfaces when this visual style is requested. Do not replace an established brand with a dark theme without a request.
---

# Graphite Dashboard Design

Build work interfaces with several shades of black and graphite. Data should read before effects. Light indicates selection, borders separate surfaces, and type size establishes importance.

This skill defines a visual language, not a single layout. A dashboard may contain tables, charts, a calendar, a map, a task queue, or relationships between objects. Do not add a flow map, sidebar, or KPI strip just because they are common dashboard elements.

## Getting started

For an installed release, check for updates at the start of a task if Node.js 20 or newer is already available: run `node "<skill-directory>/scripts/update.mjs" auto` using the actual location of this skill, not the project directory. Without saved opt-in, this command must remain local and do nothing. Do not install Node, enable updates, schedule jobs, or bypass network permissions automatically. If Node is unavailable, continue with the installed version.

Before enabling or managing updates, read [references/updates.md](references/updates.md). If an update succeeds, reread this file and the resources needed for the task before implementation. If the updater reports a conflict, failure, or manual upgrade requirement, report it and keep the current version; do not force replacement or retry in a loop. An incomplete update requires recovery before using the skill. Update consent covers this skill only, never generated projects.

Inspect the available data and what the user needs to do on the screen. Identify the main object of attention and the next action. For a new product, choose a reasonable structure based on the request. Do not require approval of a separate specification unless the user asks for one.

When updating an interface, preserve working flows, data, and the chosen stack. Change only what the request covers. This style does not require a component library, image generator, ESLint, or a new build system.

Before implementation, read [assets/graphite.css](assets/graphite.css) for the source tokens and base surfaces. Consult [references/components.md](references/components.md) for the components you need. [examples/index.html](examples/index.html) demonstrates materials and typography, not a mandatory composition.

## What defines the style

### Multiple shades of black

Preserve this foundation:

| Role | Value |
| --- | --- |
| Page background | `#020303` |
| Application shell | `#060707` |
| Recessed area | `#08090a` |
| Main surface | `#101214` |
| Raised surface | `rgba(25, 29, 31, .82)` |
| Active surface | `rgba(34, 38, 41, .82)` |
| Primary text | `#f3f5f6` |
| Secondary text | `#b7bdc1` |
| Labels | `#929a9f` |
| Subtle border | `rgba(231, 239, 244, .09)` |
| Visible border | `rgba(231, 239, 244, .18)` |
| Selected element | `#f7fbff` |

Black should not collapse into one flat void. Separate levels through small differences in lightness. Do not replace the foundation with navy backgrounds and purple gradients.

### Restrained glass surfaces

Use a barely visible gradient, a thin border, an inset top highlight, and a soft outer shadow for large panels. Aim for corner radii around 18 px for panels and 22 px for the shell.

A backdrop blur of 12-18 px is useful where there is something behind the surface to blur. It adds little on a flat background. Without `backdrop-filter`, the panel should still read clearly through its fill and border.

Do not turn every cell into a glass card. One shared surface with good spacing often works better than five nested frames.

### Glow as a state

Use a light outline and a small halo for the selected object, active path, or interaction point. Ordinary cards do not glow. Do not add a halo to every number and heading.

Hover changes the surface slightly. Selection should be more noticeable than hover. Keyboard focus needs a distinct outline that does not depend on glow.

## Typography and numbers

Use **Instrument Sans** for Latin text and numbers. The font and its license are included. Do not switch numbers to monospace just to make the interface feel analytical.

Use this stack:

```css
font-family: "Instrument Sans", "Segoe UI", sans-serif;
```

The bundled Instrument Sans file does not fully cover Russian text. On Windows, Cyrillic falls back to Segoe UI while Latin text and digits remain in Instrument Sans. These are separate typefaces. Segoe UI is not included.

If consistent Russian text is required across operating systems, choose an available Cyrillic web font with a suitable license first. Treat this as an adaptation, not a promise of an exact match. Explain the substitution and compare actual strings before and after it. Do not automatically copy system fonts into the project.

Starting sizes:

| Element | Size and weight |
| --- | --- |
| Page title | 24-28 px, 540-600 |
| Panel heading | 18-20 px, 540 |
| Body text | 13-14 px, 400-500 |
| Metric label | 11-12 px, 400-500 |
| Compact top-strip value | 17-20 px, 540 |
| Main metric value | 22-28 px, 540 |
| Secondary chart label | 11-12 px, 400 |

Enable `font-variant-numeric: tabular-nums` for numbers. Use slightly negative letter spacing, around `-.015em` or `-.025em`. Keep body text comfortably spaced, with a line height of 1.4-1.5.

Do not fix a cramped card by using 9 px text. Adjust width, grouping, or wording first. Keep values and their units from wrapping apart accidentally.

The metric strip wraps according to its container and content. Keep that behavior when integrating it. If an exact value is wider than the entire available area, provide a keyboard-focusable scroll region (`tabindex="0"` on the value in the example) or an accessible compact representation with the full value available. Check individual value bounds, not only page overflow.

Format numbers for the interface locale. Decimal separators, grouping, currencies, and dates should be consistent. Do not hardcode Russian-formatted values into an English interface.

## Content-driven layout

Size each area for its task. Tables need width and a steady row rhythm. Charts need readable axes and room for comparison. A short conclusion does not need a third of the screen just for symmetry.

Group related metrics. Show details in the context of the selected object. Small metrics can share a strip above their trends. If the metrics genuinely need separate charts, align each chart with its metric.

Use a 4 px spacing increment. Gaps of 12-16 px between large areas and padding of 20-24 px are useful starting points, not a requirement to squeeze every screen into one grid.

Do not fix an analytics panel's height before checking long values and translations. On narrow screens, change the structure rather than scaling down the whole interface. A wide table can scroll inside its own area without stretching the page.

## Data and state

Keep the monochrome foundation. Distinguish statuses through labels, marker shapes, and line styles, not lightness alone. If color is necessary for safe interpretation in a particular product, add a small semantic accent. Do not hide errors to preserve the palette.

Choose chart types based on the data. Do not use three different charts solely for variety. Comparing the same metric usually benefits from consistent scales and representations.

The selected line may be brighter than the others. Grids and helper lines stay in the background. Baselines, units, periods, and targets should be clear without guesswork.

Do not invent analytics when styling existing data. Label synthetic data in demos. Dates, totals, percentages, and chart endpoints must agree with displayed values. Do not present a recommendation as model output when there is no model.

## Controls

Buttons are usually 38-42 px tall with 9-11 px corner radii. Increase touch targets on touch screens. Text and icons should feel balanced in size.

Use one family of outline icons, usually 16-20 px with a stroke around 1.5 px. Do not generate raster icons for ordinary actions.

Icon-only buttons need accessible names. Do not remove every visible map control for a cleaner screenshot. Gestures and shortcuts supplement controls rather than replace the only accessible way to act.

Use `.gd-input` for text fields, selects, and textareas, with a real label. Use a native `disabled` attribute where supported. `aria-disabled` only changes semantics and appearance: the application must block activation itself. Pair `aria-invalid` with a visible explanation linked by `aria-describedby`.

## Checks before delivery

Inspect the interface in a browser with real data or a clearly labeled demo. If a browser is unavailable, say so instead of claiming visual verification.

Check that:

- Dark surfaces remain distinct without looking like a striped gray grid.
- The primary action and selected object stand out without lighting up the entire screen.
- Russian and English strings fit without clipping or unintended wrapping.
- Metrics remain readable with long numbers and browser zoom.
- Resize narrow panels inside wide pages as well as the page itself. Check around layout breakpoints, including 600/601 px and 1024 px. Chart labels should retain their intended screen-pixel size; a fixed SVG font size alone does not guarantee that.
- The font actually loads. Check Cyrillic and currency symbols separately.
- Text contrast is sufficient: aim for 4.5:1 for normal text and 3:1 for large text. Check the final surface, including transparency.
- Meaningful lines and control states remain visible. Keyboard interaction and visible focus work.
- Fixed heights do not clip lower charts or buttons.
- Optional animations are removed when reduced motion is requested.
- The result preserves the user's product rather than becoming a copy of the demo.

Briefly report changes and remaining limitations. Do not call the result perfect or fully accessible without verification.
