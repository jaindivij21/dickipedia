import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runSources, runStages } from './runner.ts';
import { SOURCES, BUILD, sourcesForCadence, sourceNames } from './registry.ts';
import type { SourceDef } from './types.ts';

const mock = (name: string, run: () => Promise<void>, stampAs?: string): SourceDef => ({
  name,
  volume: 'mp',
  cadence: 'monthly',
  feedsScore: false,
  run,
  stampAs,
});

test('runSources: continue-on-error, stamps only successes, honours stampAs', async () => {
  const ran: string[] = [];
  const stamped: string[] = [];
  const sources = [
    mock('a', async () => void ran.push('a')),
    mock('b', async () => {
      ran.push('b');
      throw new Error('boom');
    }),
    mock('c', async () => void ran.push('c'), 'cc'),
  ];
  const r = await runSources(sources, { stamp: async (n) => void stamped.push(n), now: () => 'T' });
  assert.deepEqual(ran, ['a', 'b', 'c'], 'a failure does not halt later sources');
  assert.deepEqual(r.ok, ['a', 'c']);
  assert.deepEqual(r.failed, ['b']);
  assert.deepEqual(
    stamped,
    ['a', 'cc'],
    'only successes stamped; stampAs honoured; failure not stamped',
  );
});

test('runStages: runs every stage in order', async () => {
  const order: string[] = [];
  await runStages([
    { name: 'x', run: async () => void order.push('x') },
    { name: 'y', run: async () => void order.push('y') },
  ]);
  assert.deepEqual(order, ['x', 'y']);
});

test('registry: names unique, every source + stage has a run fn', () => {
  const names = sourceNames();
  assert.equal(new Set(names).size, names.length, 'source names are unique');
  for (const s of SOURCES) assert.equal(typeof s.run, 'function', `${s.name} exports run()`);
  for (const b of BUILD) assert.equal(typeof b.run, 'function', `build:${b.name} exports run()`);
});

test('registry: cadence buckets resolve as the workflows expect', () => {
  assert.deepEqual(
    sourcesForCadence('monthly').map((s) => s.name),
    ['prs', 'prs_mptrack', 'latest_news'],
    'monthly = PRS activity + news',
  );
  assert.equal(sourcesForCadence('semiannual').length, SOURCES.length, 'semiannual = every source');
});
