![Graphite Dashboard Design](cover.png)

# Graphite Dashboard Design

A skill for designing dashboards in a black and graphite palette. It defines colors, typography, spacing, surfaces, and component states.

- [Agent instructions](SKILL.md)
- [CSS](assets/graphite.css)
- [Example screenshot](preview.png)

## What it changes

Panels get several levels of dark backgrounds, thin borders, and translucent fills. Numbers use Instrument Sans with tabular figures. Selected elements have a light outline and a subtle glow.

![Layered graphite surfaces and a selected panel](assets/readme-surfaces.png)

The layout depends on the task. Use the skill for tables, monitoring, analytics, or flow maps. It does not require you to copy the cover layout.

## Installation

Download the repository and place its contents in:

```text
~/.codex/skills/graphite-dashboard-design/
```

This folder should contain `SKILL.md`, `assets`, and the other package files. Avoid an extra nested folder when extracting the download.

Invoke the skill in your task:

```text
Use $graphite-dashboard-design for a monitoring dashboard.
Include a service list, request latency, and open incidents.
```

For an existing interface:

```text
Apply $graphite-dashboard-design to this project.
Change the styling, but preserve the structure, data, and behavior.
```

Other agents may use a different installation path or invocation syntax. They need to support `SKILL.md` and its linked files.

## Example and source files

Open [examples/index.html](examples/index.html) locally in your browser. The font loads from the package, with no external requests. Click the cards to switch the selected state.

The cover with raised panels is an illustration. The [screenshot](preview.png) shows the actual components.

- [SKILL.md](SKILL.md): style rules and workflow.
- [assets/graphite.css](assets/graphite.css): tokens and base components.
- [references/components.md](references/components.md): guidance for tables, charts, and navigation.
- [agents/openai.yaml](agents/openai.yaml): display name and suggested prompt for Codex.

You can use the CSS on its own. Copy `assets`, including the fonts folder, link the stylesheet, and add `gd-theme` to the container:

```html
<link rel="stylesheet" href="./assets/graphite.css">

<main class="gd-theme">
  <section class="gd-panel">
    <h2 class="gd-panel-title">System overview</h2>
  </section>
</main>
```

Theme tokens are scoped to the container. Component classes use the `gd-` prefix.

## Fonts

[Instrument Sans](https://github.com/Instrument/instrument-sans) is included in the package. It is used for Latin text and numbers.

![Label hierarchy and tabular figures](assets/readme-typography.png)

Cyrillic text falls back to the locally installed Segoe UI. That font is not included. On systems without Segoe UI, the browser selects another fallback, so Russian text may look different. Consistent rendering across operating systems requires a Cyrillic web font.

## License

Code and instructions: [MIT](LICENSE). Instrument Sans: [OFL](assets/fonts/OFL.txt).
