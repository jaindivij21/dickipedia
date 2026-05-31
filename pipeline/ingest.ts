import { spawnSync } from 'node:child_process';
import { SOURCES, sourcesForCadence, type Cadence, type Source } from './registry.ts';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const cadence = arg('cadence') as Cadence | undefined;
const only = arg('sources')
  ?.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

let list: Source[];
if (only?.length) list = SOURCES.filter((s) => only.includes(s.name));
else if (cadence === 'monthly' || cadence === 'semiannual') list = sourcesForCadence(cadence);
else {
  console.error('usage: tsx pipeline/ingest.ts --cadence monthly|semiannual | --sources a,b,c');
  process.exit(2);
}

if (!list.length) {
  console.error('no matching sources');
  process.exit(2);
}

console.log(`ingest: ${list.length} source(s) — ${list.map((s) => s.name).join(', ')}`);
const ok: string[] = [];
const failed: string[] = [];
for (const s of list) {
  console.log(`\n▶ ${s.name} (pipeline/${s.script})`);
  const r = spawnSync('npm', ['run', s.name], { stdio: 'inherit' });
  if (r.status === 0) ok.push(s.name);
  else {
    failed.push(s.name);
    console.error(`✖ ${s.name} failed (status ${r.status ?? 'null'}) — continuing`);
  }
}
console.log(`\ningest summary — ok (${ok.length}): ${ok.join(', ') || 'none'}`);
if (failed.length) console.log(`           failed (${failed.length}): ${failed.join(', ')}`);
