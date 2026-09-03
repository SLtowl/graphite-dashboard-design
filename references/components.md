# Components

Use only the components the product needs. Do not put this whole list on one screen.

## Top metric strip

Group related metrics on one surface. Place the label above its value. Spacing or a single quiet divider is enough between metrics.

If a value gets longer, widen the cell or change its formatting. Do not shrink just one number. Abbreviations such as "M" are acceptable when the exact value and unit remain available.

The provided strip uses wrapping flex items and a shared one-pixel gap for dividers. Do not add left borders to every item: they become incorrect when an item starts a new row. Test a narrow container on a wide viewport. Very long exact values can scroll inside the value element; keep that region keyboard-focusable or provide a readable full-value alternative. Do not rely only on the absence of page-level horizontal scrolling.

Use 22-28 px for a primary KPI and 17-20 px for a supporting top-strip value. A weight around 540 gives numbers presence without making them heavy.

## Chart panel

The heading explains what is being compared. Place the period or unit nearby if it is not obvious. Let the chart use the remaining space without empty decorative margins.

The data line is lighter than the grid. A target needs a label, a calculated position, and a distinct line style. Do not place it by eye halfway up the chart.

A small chart without axes can supplement an exact value, but should not be the only source of analysis. Detailed comparisons need scales, a period, and access to values.

Bars start at zero. A line chart may use a restricted range if the scale is clear and does not exaggerate the change. Charts being compared must not silently switch scales.

Do not stretch an SVG independently along both axes just to fill space: this changes stroke widths and point shapes. Adapt the `viewBox` and plot area to the container.

The example redraws coordinates with ResizeObserver and uses a viewBox width equal to the displayed width. Labels remain 12 screen pixels; fewer date ticks are shown in narrow panels. Keep an accessible description or value list when reducing labels.

## Table

Put the table on one surface, not each row in a separate card. Aim for rows around 44-52 px high, headers at 11-12 px, and values at 13-14 px.

Align numbers right and text left. Keep units in headers or beside values. Mark a selected row with a subtle fill and an accessible state, not just a thin outline.

On narrow screens, a table can scroll horizontally within its own region. Important actions should not disappear beyond the page edge.

## Sidebar navigation

Do not pad a short menu with invented sections. Give the active item a slightly lighter surface and clear text. Its icon may have a small highlight.

Collapsed menus retain accessible names and tooltips. Do not replace clear navigation with unfamiliar symbols.

## Icons

Before creating or replacing icons, obtain the user's choice of custom generation or a ready-made SVG family as described in SKILL.md. Do not generate icons just because this skill was invoked. Preserve existing icons when the request is limited to styling.

Use a restrained technical outline style. Draw on a 24 x 24 grid with balanced internal space, simple paths, small circular details where meaningful, rounded caps and joins, and a consistent stroke around 1.5-1.65 units. Display ordinary action icons at 16-20 px; navigation icons may be 20-22 px. Adjust optical alignment without stretching one axis. Avoid bulky filled silhouettes, emoji, multicolor gradients, 3D objects, and decorative detail that disappears at actual size.

Use `fill="none"`, `stroke="currentColor"`, `stroke-linecap="round"`, and `stroke-linejoin="round"` for outline SVGs. Inactive icons use the theme's muted text color. An active icon becomes near-white on a small rounded graphite backing. Any subtle highlight belongs to the selected control, not every stroke. Focus must remain distinct from selection. Familiar action meanings matter more than novel shapes; keep plus, minus, search, and close immediately recognizable. Brand logos are separate from the interface icon family and should not be invented or redrawn as generic action icons.

If the user chooses a ready-made set, use one licensed SVG family already available in the project or select a suitable one. Do not mix unrelated families or add an icon-library dependency when a few permitted SVGs suffice. Retain required license notices.

If the user chooses generation, clarify only what is still missing, such as which actions need icons. Use the available generation tool when image generation is requested; disclose if it is unavailable. A suitable brief is: "A coherent set of monochrome outline dashboard icons, 24-unit grid, thin consistent strokes, rounded caps and joins, simple geometric construction, balanced negative space, no text, no gradients, no shadows baked into the icons, transparent background. Each icon must remain recognizable at 20 px. Actions: [actual product actions]." Do not send private product data when action names are sufficient.

Generated raster artwork is a design reference, not a drop-in replacement for small UI controls. Implement approved shapes as clean SVGs where feasible and inspect them at 16, 20, and 24 px. Do not claim that an image generator produces production-ready vectors. For generated decorative illustrations, keep them separate from action icons. Sanitize externally supplied SVGs: no scripts, event handlers, or remote resources. Icon-only controls require accessible names; decorative SVGs use `aria-hidden="true"`.

## Selected object

Use one light outline and a soft halo. Keep neighboring objects visible so the selection retains context.

In a flow map, make paths from the selected node more noticeable. Explain connection types in a legend. Zooming and panning must not break node hit detection.

In a table, the same principle becomes a selected row with details nearby. Add a flow map only when the data contains actual relationships.

## Metrics and details

Do not automatically split an inspector into three equal columns. Compact numbers, charts, and written conclusions need different widths.

One option is metrics above charts on the left and a brief conclusion on the right. Another is a chart on the left and a metric list on the right. Choose based on content, not a template.

When the selected object changes, update values, charts, and explanations together. A static chart with a new title gives a false impression of working analytics.

## Buttons and switches

A button label states a clear action. Its fill is slightly lighter than the panel, and its border more visible than nearby dividers. Use a radius around 10 px and horizontal padding around 16 px.

For grouped switches, show selection through fill and text. If using an underline, place it below the text baseline. A language switch belongs here only when the user requested localization or the existing product already has it; never add one as decoration.

Unavailable actions need a real `disabled` state or appropriate logic, not just a grayer color. Hover states do not replace keyboard focus.

Test both anchors and native buttons with `.gd-button`; they should have the same typography. `.gd-selectable` includes hover, selected, and disabled appearance. A disabled selected item must not retain the active glow. CSS does not implement selection logic or prevent an `aria-disabled` link from navigating.

## Form fields

Wrap a field in a label with `.gd-field`, or connect a separate label using `for` and `id`. Add `.gd-input` to input, select, or textarea. Plain unclassed controls are not a complete styled form. Textareas inherit the same font and can resize vertically.

For an invalid value, set `aria-invalid="true"` and link a visible `.gd-field-error` explanation with `aria-describedby`. A light border alone does not communicate the error. Disabled fields use native `disabled`; keep read-only and disabled behavior distinct.

### Dropdowns and popovers

For single-choice `.gd-input` selects, the CSS progressively enhances the native control with `appearance: base-select` and `::picker(select)`. This retains native labels, form values and keyboard semantics while styling the popup. It shares `--gd-material-overlay`, `--gd-overlay-shadow` and `--gd-border-overlay` with overlay panels. The defaults are a 12 px popup radius, 6 px internal padding, 40 px option rows, a quiet checkmark and a distinct gray hover/focus state. Compact density reduces option rows to 36 px; coarse-pointer devices keep at least 44 px. Never leave a bright blue operating-system selection inside an otherwise monochrome control and claim visual parity.

The enhanced popup follows its control's width, with a viewport maximum, and long option names wrap. Check the horizontal bounds of open options themselves; document width can remain correct while a top-layer popup is clipped.

Feature-detect support and test the actual browsers in scope. Unsupported browsers retain their native popup; this is an accessibility fallback, not the same design. For cross-browser visual parity, use the project's tested accessible select/listbox implementation, including correct labeling, selection announcements, disabled options, Arrow keys, Home/End, typeahead, Enter/Space, Escape and Tab. Do not replace a select with clickable divs. In either implementation verify that the popup escapes clipped panels, stays within the viewport, scrolls for long lists, and closes on outside interaction without losing the selected value.

Checkboxes and radio buttons also need checked, unchecked, focus and disabled states. Keep their marks monochrome and the native input semantics intact. Their accent is themed, but their exact native shape is browser-dependent. Use a real enclosing label to enlarge the target without stretching the checkbox artwork; make that target at least 44 px on touch devices. Interactive table rows must account for the control's target height plus cell padding; the suggested row height is not an extra fixed constraint on top of those dimensions.

## Surface tokens and isolation

The package includes four surface roles. Use the same role for the same purpose throughout a product. Add the variant alongside `.gd-panel`; variants change materials, not layout or behavior.

| Class | Use | Material token |
| --- | --- | --- |
| `.gd-panel` | Normal content, tables and charts | `--gd-material-panel` |
| `.gd-panel.gd-panel--recessed` | A working canvas or nested data region | `--gd-material-recessed` |
| `.gd-panel.gd-panel--raised` | Contextual details or an inspector | `--gd-material-raised` |
| `.gd-panel.gd-panel--overlay` | A dialog or popover above the workspace | `--gd-material-overlay` |

Each role has an opaque base, a directional highlight and a suitable shadow. The selected object has its own material and halo, rather than borrowing the overlay's elevation. Do not stack all four roles just to show depth. A flat table inside one panel remains appropriate.

```html
<main class="gd-theme">
  <section class="gd-panel gd-panel--recessed">Working area</section>
  <aside class="gd-panel gd-panel--raised">Selected item details</aside>
</main>
```

Customize foundational colors on the theme root: `--gd-surface`, `--gd-recess`, `--gd-surface-raised`, `--gd-surface-overlay`, `--gd-raised` and `--gd-active`. They feed the material layers. Override a `--gd-material-*` token to replace an entire background. Overlay panels and select popups consume the same overlay material, border and shadow tokens. Buttons, selected items, fields and charts also use named state tokens; do not add a second private palette for them.

Common adjustment points:

- Borders: `--gd-line`, `--gd-line-soft`, `--gd-control-border`, `--gd-border-hover`, `--gd-border-selected`, `--gd-border-overlay`.
- Depth: `--gd-highlight`, `--gd-highlight-strong`, `--gd-edge-light`, `--gd-shade`, `--gd-panel-shadow`, `--gd-raised-shadow`, `--gd-overlay-shadow`.
- Selection: `--gd-material-selected`, `--gd-selected-shadow`, `--gd-state-selected`, `--gd-state-hover`.
- Charts: `--gd-chart-stroke`, `--gd-chart-target`, `--gd-chart-glow`, `--gd-selected`.
- Controls: `--gd-material-control`, `--gd-material-control-hover`, `--gd-input-shadow`, `--gd-control-shadow`.

```css
/* Load after graphite.css. Keep product-specific changes in one file. */
.gd-theme {
  --gd-surface-overlay: #1c2023;
  --gd-radius-panel: 16px;
}
```

Put foundational overrides on `.gd-theme`, not a child: composite custom properties resolve where they are defined. For a one-off descendant, override its complete material token. Keep screenshots of each material and an open menu when reviewing theme changes. A different value in a token file is not proof of a readable result.

Add `.gd-glass` to a panel only where backdrop blur has useful content behind it; without that opt-in every material has an opaque fallback. The overlay class provides appearance, not focus management, positioning or dismissal. A native `<dialog class="gd-panel gd-panel--overlay">` also receives themed text and a `--gd-backdrop` tint; open it with `showModal()`, label it, provide a close button and test focus return. Keep an existing accessible dialog implementation when the project already has one.

Component rules apply to descendants of `.gd-theme`. Use a theme wrapper around components, not a component class on the theme root itself. The font-face declaration is necessarily document-wide.

## Empty, loading, and error states

An empty area explains what data is missing and what the user can do. While loading, preserve the approximate content size to prevent layout shifts. Do not disguise missing data as zero values.

An error needs a written explanation or a clear next step. A monochrome style is not a reason to make failure messages hard to notice.

## Density and responsiveness

The default density is comfortable. Set `data-density="compact"` on `.gd-theme` or a descendant container to reduce spacing for repeated daily work. Set `data-density="comfortable"` on a nested region to reset it. No user-facing density switch is required; choose the initial mode from the task.

```html
<main class="gd-theme">
  <section class="gd-panel" data-density="compact">
    <!-- A dense table or repeated control list. -->
    <div data-density="comfortable">A less dense detail region.</div>
  </section>
</main>
```

Compact mode changes panel and cell padding, metric spacing and control dimensions. It does not reduce fonts, chart labels or icon size. Default control minimums change from 42 px to 36 px; plain table rows change from 48 px to 40 px. These are minimums, not forced heights. Wrapped text and controls may require more space. On coarse-pointer devices button, field, selectable-item and option minimums remain 44 px in either density. Density does not replace responsive layout.

Start by checking 1440 px and 1280 px. If the product needs mobile support, also check around 390 px. At 200% browser zoom, primary actions should remain available even if the layout changes.

On narrow screens, stacking sections usually works better than shrinking every font. Headings should not take more space than the content.

Allow for long object names, decimals, negative numbers, and currencies. When localization is in scope, test the supported translations too. A short English demo does not establish that longer strings will fit.
