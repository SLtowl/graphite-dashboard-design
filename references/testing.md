# Testing

The examples work locally without a build step. Node.js and Playwright are optional developer tools for checking changes to this package, not dependencies of a dashboard made with the skill.

## Run the checks

Use Node.js 20 or newer from the repository root:

```sh
npm ci --ignore-scripts
npm test
npx playwright install chromium
npm run test:ui
```

`npm test` checks the updater with isolated fixtures and mocked downloads, then verifies the package manifest, local links and basic release hygiene. `npm run test:ui` serves the local examples on a temporary loopback port, runs Chromium, saves screenshots, and closes its own browser and server. The UI checks block requests outside that local server. Dependency and browser installation do require internet access.

Integrity and updater checks need only Node, without installing dependencies:

```sh
node --test tests/update.test.mjs
node scripts/check-package.mjs
```

Maintainers can run `node scripts/check-package.mjs --write-manifest` after reviewing intended source changes and the release version. This explicitly refreshes hashes for the fixed managed file list. Do not use it to conceal unexpected modifications in an installed package.

For other engines, install them explicitly and run each suite:

```sh
npx playwright install firefox webkit
npm run test:ui:firefox
npm run test:ui:webkit
```

On supported Linux hosts, Playwright may need system libraries. Follow its setup output or use `npx playwright install --with-deps` when authorized to install system packages. A missing dependency or browser fails the run. It is never counted as a passed or silently skipped browser check.

Screenshots are written under `test-results/<engine>/`, which Git ignores. The tests never replace the README images or `preview.png`. Review the screenshots separately; passing geometry and interaction assertions does not establish visual quality.

## Coverage

| Area | Automated check |
| --- | --- |
| Responsive examples | Both pages at 320, 390, 600, 601, 1024 and 1440 px |
| Assets | Local font loads; failed or external requests fail the run |
| Typography | Numeric values stay contained; SVG labels retain 12 screen pixels |
| Selection | Keyboard activation, state reversal and visible focus |
| Materials | Distinct shell, recessed area and raised inspector |
| Density | Compact spacing without smaller text; reversible switch |
| Fields | Linked error message, valid save, editing invalidates saved state |
| Menus | Open state, keyboard selection, Escape and outside dismissal |
| Dialog | Focus entry, Tab containment, Escape and focus restoration |
| Data | Empty search, reset, loading, stale/partial/denied/error states and retry |
| CSS contract | No component styling outside the theme; token overrides; reduced motion |

Synthetic data is used throughout. These checks cover the public examples and a small CSS fixture, not every possible product integration.

## Browser boundaries

Native single-choice selects are progressively styled with `appearance: base-select`. In an engine that does not support it, the suite checks native interaction and reports that the popup is a native fallback. This does not count as matching graphite popup appearance. Use a tested accessible select from the host project when identical popup styling across its supported browsers is a requirement.

Record the browser name and version printed by each run. Passing Chromium does not establish Firefox or Safari support. Playwright WebKit is a useful separate engine check, but is not a substitute for testing the actual Safari and operating-system versions your product supports.

The 1.2.0 candidate was checked locally on Windows with Chrome 152.0.7977.65, Firefox 153.0 and Playwright WebKit 26.5. Each engine passed 20 UI checks, including both examples at six widths. Firefox used the native select fallback. This is a tested snapshot, not a promise of visual equivalence on every browser or operating system.

The automated suite does not certify accessibility. Add manual screen-reader, contrast-on-composited-surfaces, forced-colors, actual browser zoom at 200%, and touch checks for the product. A narrow viewport is not the same test as browser zoom. Open long menus near viewport edges and inspect their scrolling and selected, hovered and disabled states in the actual target environment.

## Existing local runtime

Normal runs resolve the pinned `playwright` development dependency. If a controlled environment already supplies the runtime, these optional environment variables avoid reinstalling it:

- `GD_BROWSER`: `chromium`, `firefox` or `webkit`; an explicit `--browser` argument takes precedence.
- `GD_BROWSER_EXECUTABLE`: an absolute path to a compatible local browser executable. Leave unset to use Playwright's matching bundled browser.
- `GD_PLAYWRIGHT_MODULE`: a `file:` URL to an explicitly trusted local Playwright module. Remote module URLs are rejected. Leave unset for normal package resolution.

Do not commit machine-specific paths or test-output folders. Alternate executables can differ from Playwright's bundled version; keep that distinction in the test report.
