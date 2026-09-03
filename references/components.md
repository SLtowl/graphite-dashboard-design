# Components

Use only the components the product needs. Do not put this whole list on one screen.

## Top metric strip

Group related metrics on one surface. Place the label above its value. Spacing or a single quiet divider is enough between metrics.

If a value gets longer, widen the cell or change its formatting. Do not shrink just one number. Abbreviations such as "M" are acceptable when the exact value and unit remain available.

Use 22-28 px for a primary KPI and 17-20 px for a supporting top-strip value. A weight around 540 gives numbers presence without making them heavy.

## Chart panel

The heading explains what is being compared. Place the period or unit nearby if it is not obvious. Let the chart use the remaining space without empty decorative margins.

The data line is lighter than the grid. A target needs a label, a calculated position, and a distinct line style. Do not place it by eye halfway up the chart.

A small chart without axes can supplement an exact value, but should not be the only source of analysis. Detailed comparisons need scales, a period, and access to values.

Bars start at zero. A line chart may use a restricted range if the scale is clear and does not exaggerate the change. Charts being compared must not silently switch scales.

Do not stretch an SVG independently along both axes just to fill space: this changes stroke widths and point shapes. Adapt the `viewBox` and plot area to the container.

## Table

Put the table on one surface, not each row in a separate card. Aim for rows around 44-52 px high, headers at 11-12 px, and values at 13-14 px.

Align numbers right and text left. Keep units in headers or beside values. Mark a selected row with a subtle fill and an accessible state, not just a thin outline.

On narrow screens, a table can scroll horizontally within its own region. Important actions should not disappear beyond the page edge.

## Sidebar navigation

Do not pad a short menu with invented sections. Give the active item a slightly lighter surface and clear text. Its icon may have a small highlight.

Collapsed menus retain accessible names and tooltips. Do not replace clear navigation with unfamiliar symbols.

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

For grouped switches, show selection through fill and text. If using an underline, place it below the text baseline. Do not strike through the active language.

Unavailable actions need a real `disabled` state or appropriate logic, not just a grayer color. Hover states do not replace keyboard focus.

## Empty, loading, and error states

An empty area explains what data is missing and what the user can do. While loading, preserve the approximate content size to prevent layout shifts. Do not disguise missing data as zero values.

An error needs a written explanation or a clear next step. A monochrome style is not a reason to make failure messages hard to notice.

## Density and responsiveness

Start by checking 1440 px and 1280 px. If the product needs mobile support, also check around 390 px. At 200% browser zoom, primary actions should remain available even if the layout changes.

On narrow screens, stacking sections usually works better than shrinking every font. Headings should not take more space than the content.

Allow for long object names, decimals, negative numbers, currencies, and translations. A demo with short English words does not establish that the Russian version will fit.
