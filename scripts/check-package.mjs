#!/usr/bin/env node
// Maintenance only. No network, dependency installation, or external writes.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { ALLOWED, validateManifest } from './update.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'release-manifest.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => { if (!condition) throw new Error(message); };
const mode = process.argv[2];
check(!mode || mode === '--write-manifest', 'Usage: node scripts/check-package.mjs [--write-manifest]');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
let bytesTotal = 0;
let localLinks = 0;
const files = {};

for (const name of [...ALLOWED].sort()) {
  const absolute = path.join(root, name);
  const stat = await fs.lstat(absolute);
  check(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1, `Not an ordinary package file: ${name}`);
  const bytes = await fs.readFile(absolute);
  bytesTotal += bytes.length;
  files[name] = { sha256: digest(bytes), size: bytes.length };
  if (!/\.(md|css|html|yaml|mjs|js|json)$/.test(name)) continue;
  const content = bytes.toString('utf8');
  check(!content.includes('\r'), `Use LF line endings: ${name}`);
  // Basic release hygiene, not a comprehensive secret scanner.
  check(!/(?:[A-Z]:[/\\]Users[/\\]|\/Users\/|\/home\/)[^\s"'<>]+/i.test(content), `Machine-local path: ${name}`);
  check(!/(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/.test(content), `Possible credential: ${name}`);
  if (name.endsWith('.md')) {
    for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
      const link = match[1];
      if (/^(?:https?:|#)/.test(link)) continue;
      const target = path.resolve(path.dirname(absolute), decodeURIComponent(link.split('#')[0]));
      const relative = path.relative(root, target);
      check(relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative), `Link escapes package: ${name}`);
      await fs.access(target);
      localLinks++;
    }
  }
}

const skill = await fs.readFile(path.join(root, 'SKILL.md'), 'utf8');
check(/^---\nname: graphite-dashboard-design\ndescription: [^\n]+\n---\n/.test(skill), 'Invalid skill identity/frontmatter');
check(!/\b(?:TODO|PLACEHOLDER)\b/.test(skill), 'Unfinished skill instructions');
const next = validateManifest({ ...manifest, files });
if (mode === '--write-manifest') {
  // Explicit build step; do not use this command to conceal a broken installed package.
  await fs.writeFile(manifestPath, JSON.stringify(next, null, 2) + '\n');
} else {
  validateManifest(manifest);
  check(JSON.stringify(Object.keys(manifest.files).sort()) === JSON.stringify(Object.keys(files)), 'Managed file set differs from fixed allowlist');
  for (const [name, entry] of Object.entries(files)) {
    check(manifest.files[name].sha256 === entry.sha256 && manifest.files[name].size === entry.size, `Hash or size mismatch: ${name}`);
  }
}
console.log(JSON.stringify({ version: manifest.version, managedFiles: Object.keys(files).length, bytes: bytesTotal, localLinks, result: mode ? 'manifest refreshed' : 'pass', scope: 'integrity, links, frontmatter and basic private-marker scan; not a full security audit' }, null, 2));
