# Using Graphite in a team

Use one shared copy of the assets in the product. Keep product-specific overrides in a separate stylesheet loaded after `graphite.css`, scoped to the product's theme container. Avoid copying a different gradient into every screen.

```css
.operations.gd-theme {
  --gd-radius-panel: 16px;
  --gd-space-6: 24px;
}
```

The class names are a small visual API, not a full application framework. Use `.gd-panel` with the recessed, raised, or overlay modifier according to its role. An overlay still needs accessible behavior from a native element or the project's existing component library. Keep the layout and data model in the product.

## Density

Comfortable spacing is the default. Apply `data-density="compact"` to the theme or a content container when users need to scan more rows. `data-density="comfortable"` can restore normal spacing within a compact view. Fonts remain the same size; touch controls retain adequate targets.

Choose a default based on actual work. A monitoring wall and an editable finance table need different density. Test row actions and long values before adopting compact mode. A density switch is optional, not a required dashboard feature.

## Shared decisions

Record the accepted version, token overrides, density, icon family, supported browsers, and intentional exceptions in the project's existing design documentation. Do not introduce a second design-system document when the team already has one. Preserve the project's languages, component library, and established accessibility requirements.

The CSS variables are the current source of truth. There is no bundled Figma library or automatic design-tool synchronization. Do not promise that changing a design file updates the code.

## Adopting updates

Pin a release tag and commit in the team's setup instructions. A team that needs repeatable output should leave automatic updates disabled and review upgrades together. Opt-in auto-updates are a convenience for individual installations, not a replacement for a team's approval process.

Test an upgrade in a separate copy first. Compare the package's own changed components, then the product's representative screens: a dense table, a long-value panel, an open menu or dialog, and an error or incomplete-data state. Run the product's normal checks. Keep the old shared assets until the new version is approved.

Updating an installed skill changes future agent guidance. It does not update copied CSS, fonts, or application code. Upgrading an existing product is a separate requested change; preserve local overrides and review differences before replacing its assets.

The 1.2.0 package adds maintained files and expands the updater's fixed allowlist. Older installations require a reviewed manual upgrade; their updater intentionally refuses the new file set. Extract into a separate folder, inspect and test it, preserve any local edits, and switch only after approval. A fresh copy starts with updates disabled. Do not copy updater state or bypass the old installation's safety checks. See [updates.md](updates.md) for recovery and consent details.
