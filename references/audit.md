# Dashboard audit

Use this mode when the user asks for a review, diagnosis, or improvement list. Inspect the supplied interface and relevant code without rewriting it, installing dependencies, changing preferences, or applying updates. A review does not authorize implementation.

Start with the user's main task: what must they notice, compare, or act on? Review the provided screens, not an invented product roadmap. If only a screenshot is available, distinguish visible findings from behavior that cannot be verified.

## Inspect the working states

- Hierarchy: can the primary value, selected object, and next action be identified without reading every panel?
- Materials: are working areas, panels, overlays, and selection visibly distinct? Is glow reserved for a state? Are custom overrides drifting from the shared tokens?
- Numbers and charts: do units, periods, totals, scales, and target positions agree? Check long and negative values and narrow containers. Do not infer a wrong calculation from rounded numbers alone.
- Controls: open menus and dialogs, navigate with the keyboard, test Escape, validation, disabled states, and focus return. Check the opened state near viewport edges.
- Data states: distinguish missing data from zero and filtered emptiness from a loading failure. Check whether stale or partial results could be mistaken for current complete results.
- Density and fit: inspect the real working content, not only an empty example. Check compact spacing, long labels, internal scrolling, and the product's supported viewport sizes.

Compare changes against the existing product's requirements. The graphite style is not permission to replace a brand, remove a meaningful status, add localization, or change workflows.

## Report findings

For each actionable issue, give the location and state, visible evidence, user impact, and smallest useful correction. Use three priorities: blocks a task, causes confusion, or visual polish. Keep optional enhancements separate from defects. Avoid a numeric design score or a long generic checklist.

Name what was tested and what was not. A screenshot does not prove keyboard support; a passing layout check does not prove readability. Do not claim accessibility certification, browser parity, or zero defects from a small sample.

Finish with the few fixes that matter most. Wait for implementation authority if the user requested only an audit.
