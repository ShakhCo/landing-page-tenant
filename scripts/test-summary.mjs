#!/usr/bin/env node
// Render every test that ran into the GitHub job summary, not just the totals.
// Reads vitest's JSON report and appends grouped markdown to
// $GITHUB_STEP_SUMMARY. Missing input is skipped rather than fatal, so a run
// that died before the suite still summarises whatever did run.

import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const REPORT = '.artifacts/vitest.json';
const OUT = process.env.GITHUB_STEP_SUMMARY;
const write = (md) => (OUT ? appendFileSync(OUT, md) : process.stdout.write(md));

const mark = (ok) => (ok ? '✅' : '❌');
const secs = (n) => `${(n / 1000).toFixed(1)}s`;
const ms = (n) => (n == null ? '' : ` \`${Math.round(n)}ms\``);
const short = (p) => String(p ?? '').replace(`${process.cwd()}/`, '');
// Vitest colours its failure output; the codes would render as noise here.
// eslint-disable-next-line no-control-regex
const plain = (s) => String(s ?? '').replace(/\[[0-9;]*m/g, '');

// Which part of the app a file belongs to, for the at-a-glance table.
const AREAS = [
  ['middleware', 'Edge routing'],
  ['app/', 'Server actions & pages'],
  ['lib/', 'Library'],
  ['components/', 'Components'],
];
const areaOf = (file) => AREAS.find(([prefix]) => short(file).startsWith(prefix))?.[1] ?? 'Other';

let report = null;
try {
  report = existsSync(REPORT) ? JSON.parse(readFileSync(REPORT, 'utf8')) : null;
} catch {
  report = null;
}

if (!report?.testResults) {
  write(`# Test report\n\nNo test report was produced — the suite did not get far enough to write one.\n`);
  process.exit(0);
}

const files = report.testResults;
const cases = files.flatMap((f) =>
  (f.assertionResults ?? []).map((t) => ({
    file: f.name,
    title: [...(t.ancestorTitles ?? []), t.title].filter(Boolean).join(' › '),
    ok: t.status !== 'failed',
    skipped: t.status === 'pending' || t.status === 'skipped',
    duration: t.duration,
    error: t.failureMessages?.[0],
  }))
);

const failed = cases.filter((c) => !c.ok);
const duration = files.reduce((sum, f) => sum + ((f.endTime ?? 0) - (f.startTime ?? 0)), 0);

// ---- header ------------------------------------------------------------
write(`# Test report — ${mark(!failed.length)} ${cases.length - failed.length}/${cases.length} passed\n\n`);
write(
  `\`${process.env.GITHUB_REF_NAME ?? 'local'}\` @ \`${(process.env.GITHUB_SHA ?? '').slice(0, 7)}\`` +
    ` · triggered by \`${process.env.GITHUB_EVENT_NAME ?? 'manual'}\`\n\n`
);
write(
  `${files.length} files in ${secs(duration)}. Server actions and edge routing run on node with the\n` +
    `network layer stubbed; component tests opt into a real DOM (jsdom) per file. Nothing here\n` +
    `touches production or the live API.\n\n`
);

// ---- by area -----------------------------------------------------------
const areas = new Map();
for (const c of cases) {
  const area = areaOf(c.file);
  const row = areas.get(area) ?? { total: 0, failed: 0, files: new Set() };
  row.total += 1;
  if (!c.ok) row.failed += 1;
  row.files.add(c.file);
  areas.set(area, row);
}

write(`| Area | Files | Tests | |\n| --- | ---: | ---: | :-: |\n`);
for (const [area, row] of [...areas].sort((a, b) => b[1].total - a[1].total)) {
  write(`| ${area} | ${row.files.size} | ${row.total - row.failed}/${row.total} | ${mark(!row.failed)} |\n`);
}
write(`\n`);

// ---- failures first ----------------------------------------------------
if (failed.length) {
  write(`## Failures\n\n`);
  for (const c of failed) {
    write(`**${short(c.file)}** — ${c.title}\n\n`);
    write(`\`\`\`\n${plain(c.error).split('\n').slice(0, 12).join('\n')}\n\`\`\`\n\n`);
  }
}

// ---- every test, by file ----------------------------------------------
write(`## Every test that ran\n\n`);
const byFile = new Map();
for (const c of cases) byFile.set(c.file, [...(byFile.get(c.file) ?? []), c]);

for (const [file, list] of [...byFile].sort((a, b) => short(a[0]).localeCompare(short(b[0])))) {
  const bad = list.filter((c) => !c.ok).length;
  write(
    `<details${bad ? ' open' : ''}><summary>${mark(!bad)} <code>${short(file)}</code> — ${list.length - bad}/${list.length}</summary>\n\n`
  );
  for (const c of list) {
    write(`- ${c.skipped ? '⏭' : mark(c.ok)} ${c.title}${ms(c.duration)}\n`);
  }
  write(`\n</details>\n\n`);
}

// ---- slowest -----------------------------------------------------------
const slow = [...cases].sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0)).slice(0, 5).filter((c) => c.duration);
if (slow.length) {
  write(`<details><summary>⏱ Slowest tests</summary>\n\n`);
  for (const c of slow) write(`- \`${Math.round(c.duration)}ms\` ${c.title}\n`);
  write(`\n</details>\n\n`);
}
