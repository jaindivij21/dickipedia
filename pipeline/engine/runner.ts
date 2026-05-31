import { stamp as defaultStamp } from '../lib/stamp.ts';
import type { SourceDef, StageDef, RunResult } from './types.ts';

export interface RunDeps {
  stamp?: (source: string, iso: string) => Promise<void>;
  now?: () => string;
}

export async function runSources(list: SourceDef[], deps: RunDeps = {}): Promise<RunResult> {
  const stamp = deps.stamp ?? defaultStamp;
  const now = deps.now ?? (() => new Date().toISOString());
  const ok: string[] = [];
  const failed: string[] = [];
  for (const s of list) {
    console.log(`\n▶ ${s.name} (${s.volume})`);
    try {
      await s.run();
      await stamp(s.stampAs ?? s.name, now());
      ok.push(s.name);
    } catch (e) {
      failed.push(s.name);
      console.error(`✖ ${s.name} failed — continuing:`, e instanceof Error ? e.message : e);
    }
  }
  return { ok, failed };
}

export async function runStages(list: StageDef[]): Promise<void> {
  for (const stage of list) {
    console.log(`\n▶ [build] ${stage.name}`);
    await stage.run();
  }
}
