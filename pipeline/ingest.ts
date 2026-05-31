import { runSources, runStages } from './engine/runner.ts';
import { SOURCES, sourcesForCadence, BUILD } from './engine/registry.ts';
import type { Cadence, SourceDef } from './engine/types.ts';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const has = (name: string): boolean => process.argv.includes(`--${name}`);

const cadence = arg('cadence') as Cadence | undefined;
const only = arg('sources')
  ?.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const stages = arg('stages')
  ?.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function resolve(): SourceDef[] {
  if (only?.length) return SOURCES.filter((s) => only.includes(s.name));
  if (cadence === 'monthly' || cadence === 'semiannual') return sourcesForCadence(cadence);
  return SOURCES;
}

async function main(): Promise<void> {
  if (has('plan')) {
    const names = SOURCES.map((s) => s.name);
    const dupes = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];
    const noRun = SOURCES.filter((s) => typeof s.run !== 'function').map((s) => s.name);
    if (dupes.length || noRun.length) {
      console.error(`registry invalid — duplicate names: [${dupes}] · missing run: [${noRun}]`);
      process.exit(1);
    }
    const list = resolve();
    console.log(
      `plan (${list.length} source${list.length === 1 ? '' : 's'}): ${list.map((s) => s.name).join(', ')}`,
    );
    console.log(`build stages: ${BUILD.map((b) => b.name).join(' → ')}`);
    return;
  }

  if (has('build') || stages?.length) {
    await runStages(stages?.length ? BUILD.filter((s) => stages.includes(s.name)) : BUILD);
    return;
  }

  let list: SourceDef[];
  if (only?.length) list = SOURCES.filter((s) => only.includes(s.name));
  else if (cadence === 'monthly' || cadence === 'semiannual') list = sourcesForCadence(cadence);
  else {
    console.error(
      'usage: tsx pipeline/ingest.ts --cadence monthly|semiannual | --sources a,b | --build | --stages canonical,merge',
    );
    process.exit(2);
  }
  if (!list.length) {
    console.error('no matching sources');
    process.exit(2);
  }

  const r = await runSources(list);
  console.log(`\ningest summary — ok (${r.ok.length}): ${r.ok.join(', ') || 'none'}`);
  if (r.failed.length) console.log(`failed (${r.failed.length}): ${r.failed.join(', ')}`);
  // explicit --sources runs surface failures; bulk --cadence runs defer to the rebuild+assert gate
  if (only?.length && r.failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
