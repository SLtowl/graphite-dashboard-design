# Optional updates

Updates are off by default. Run these commands from the installed skill folder with Node.js 20 or newer. No dependencies are installed.

```sh
node scripts/update.mjs status
node scripts/update.mjs check
node scripts/update.mjs enable
node scripts/update.mjs auto
node scripts/update.mjs disable
node scripts/update.mjs rollback
node --test tests/update.test.mjs
```

`enable` is explicit one-time consent to replace unmodified, managed skill files with compatible stable upstream releases. Ask the user before enabling; installation or using the skill alone is not consent. After consent, the agent may run `auto` at skill invocation. This installs no scheduler, background process, startup hook, or cron job. It does not run without an invocation. `auto` attempts at most one network check per 24 hours, including failed attempts. `disable` withdraws consent. `check` queries availability without writing package files or updater state; it does not apply updates or authorize later application.

Only the latest stable GitHub Release of `SLtowl/graphite-dashboard-design` is accepted. Tags resolve to a full commit SHA before fetching the release manifest and every file from that immutable commit. Requests use HTTPS with fixed GitHub hosts, no redirects, a 15-second request deadline, and bounded payloads. No project/user files, secrets, telemetry payloads, or credentials are sent. GitHub receives normal request metadata, including IP address and user agent.

The release manifest is `release-manifest.json`: an object with `protocol: 1`, `repository: "SLtowl/graphite-dashboard-design"`, a stable `version` such as `1.1.0`, and `files` mapping relative managed paths to `{ "sha256": "64 lowercase hexadecimal characters", "size": 123 }`. Maximum file size is 16 MiB; total listed size is 64 MiB. The manifest excludes itself to avoid a circular hash. Releases must keep the same managed file set; additions/removals, protocol changes, major-version changes, downgrades, modified same-version releases, or changes to `scripts/update.mjs` require manual review and installation. Automatic updates never replace the updater with changed code and never execute downloaded content. Compatible releases may replace skill instructions and templates: enabling updates trusts the named upstream maintainers. Hashes protect integrity, not compromise of the upstream account; manifests are not independently signed.

Every managed local file is checked against the installed baseline before enabling or updating, including files the release did not change. Local modifications stop the update. Git checkouts, linked roots, symlinks, hardlinks, special files and unsafe paths are rejected. Unlisted local files are preserved. Use a standalone copy for automatic updates; update a development checkout manually. Keep generated projects outside the skill installation.

Staged downloads, backups, consent state, and a transaction journal live under `.graphite-update/`, ignored by Git. Downloads are verified before replacement. An application failure triggers restoration; an interrupted transaction is detected and restored on the next mutating command. A leftover exclusive lock stops subsequent writers: first confirm no updater is running, then remove only `.graphite-update/lock` and retry. Never delete a pending journal to bypass recovery. If recovery reports an edited or corrupt file, preserve the installation and backups and resolve it manually.

`rollback` restores the most recent successful update only after confirming managed files have not been edited since it. It disables automatic updates to avoid immediately reinstalling that release. Backups are retained, not recursively deleted. Failed download staging is also retained for inspection. Disk usage therefore grows over time; inspect and archive old transaction folders manually only when there is no pending transaction or running updater.

Limits: replacement is per-file, not an atomic directory swap. Do not use the skill while an update runs. Filesystem journal recovery covers ordinary process interruption, but is not a power-loss durability guarantee (no fsync protocol). Do not run against directories concurrently edited by other processes or untrusted local users; validation is not a defense against a hostile filesystem race. A hard process termination requires the manual lock check above. Tests use isolated temporary fixtures and mocked network responses; they do not claim live GitHub release or power-loss testing.
