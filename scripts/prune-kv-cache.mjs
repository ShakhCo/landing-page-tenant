#!/usr/bin/env node
// Delete ISR cache entries left behind by earlier builds.
//
// OpenNext keys the incremental cache as `incremental-cache/<BUILD_ID>/<hash>`
// and writes it with NO expiry (their source: "TODO: Figure out how to best
// leverage KV's TTL"). The build id changes on every deploy, so each deploy
// orphans the previous build's entries forever — 89 dead builds had piled up
// before this script existed, ~15 keys each, none of them ever read again.
//
// Runs right after a deploy, when .open-next/assets/BUILD_ID is the build that
// just went live. Keeps that build and the one before it (so a rollback still
// has a warm cache) and deletes the rest.
//
// Cleanup must never break a good deploy: every failure here is a warning and
// an exit 0.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const NAMESPACE_ID = 'f9bd480ec36643d4ab414928c1c39e3a'; // NEXT_INC_CACHE_KV
const PREFIX = 'incremental-cache/';
const MARKER = '_meta/last-build'; // remembers the previous build id
const CHUNK = 1000; // keys per bulk delete request
// `--dry-run` reports what it would delete and touches nothing.
const DRY_RUN = process.argv.includes('--dry-run');

const warn = (msg) => console.warn(`prune-kv-cache: ${msg}`);

const wrangler = (args, { capture = false } = {}) =>
  execFileSync('npx', ['wrangler', ...args], {
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    maxBuffer: 64 * 1024 * 1024,
  });

const kv = (args, opts) =>
  wrangler([...args, '--namespace-id', NAMESPACE_ID, '--remote'], opts);

let currentBuild;
try {
  currentBuild = readFileSync('.open-next/assets/BUILD_ID', 'utf8').trim();
} catch {
  warn('no .open-next/assets/BUILD_ID — run this straight after a build. Skipping.');
  process.exit(0);
}
if (!currentBuild) {
  warn('empty BUILD_ID. Skipping.');
  process.exit(0);
}

// The build that was live before this deploy, recorded by the previous run.
let previousBuild = null;
try {
  previousBuild = kv(['kv', 'key', 'get', MARKER], { capture: true }).trim() || null;
} catch {
  // No marker yet (first run) — then we only know about the current build.
}

let keys;
try {
  keys = JSON.parse(kv(['kv', 'key', 'list'], { capture: true }));
} catch (e) {
  warn(`could not list keys (${e.message}). Skipping.`);
  process.exit(0);
}

// Safety rail: the current build's entries must already be in KV. If they
// aren't, this isn't running right after that build's deploy (e.g. someone ran
// it from a laptop holding a stale .open-next), and "everything that isn't the
// current build" would include the LIVE build. Refuse rather than cold-start
// production's cache.
const buildsInKv = new Set(
  keys.filter((k) => k.name.startsWith(PREFIX)).map((k) => k.name.split('/')[1])
);
if (!buildsInKv.has(currentBuild)) {
  warn(
    `build ${currentBuild} has no entries in KV — not running against the ` +
      `deploy that produced it. Skipping (nothing deleted).`
  );
  process.exit(0);
}

const keep = new Set([currentBuild, previousBuild].filter(Boolean));
const stale = keys
  .map((k) => k.name)
  .filter((name) => name.startsWith(PREFIX) && !keep.has(name.split('/')[1]));

console.log(
  `prune-kv-cache: ${keys.length} keys across ${buildsInKv.size} builds; ` +
    `keeping ${[...keep].join(', ')}; deleting ${stale.length}`
);

if (DRY_RUN) {
  console.log('prune-kv-cache: dry run — nothing deleted');
  process.exit(0);
}

if (stale.length > 0) {
  for (let i = 0; i < stale.length; i += CHUNK) {
    const batch = stale.slice(i, i + CHUNK);
    const file = `/tmp/kv-prune-${i}.json`;
    writeFileSync(file, JSON.stringify(batch));
    try {
      kv(['kv', 'bulk', 'delete', file, '--force']);
      console.log(`prune-kv-cache: deleted ${batch.length} keys`);
    } catch (e) {
      // A partial sweep is fine — the next deploy picks up whatever is left.
      warn(`batch delete failed (${e.message}); the next run will retry it`);
      break;
    }
  }
}

// Record this build so the next run keeps it as the rollback copy.
try {
  kv(['kv', 'key', 'put', MARKER, currentBuild]);
} catch (e) {
  warn(`could not update the ${MARKER} marker (${e.message})`);
}
