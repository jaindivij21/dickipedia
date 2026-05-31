import { readFile } from 'node:fs/promises';
import { CANON } from '../lib/paths.ts';

const EXPECTED_MPS = 543;
const SCORE_COVERAGE_FLOOR = 0.9;
const ATTENDANCE_COVERAGE_FLOOR = 0.5;

interface SlimMp {
  slug?: string;
  name?: string;
  pc_id?: string;
  score?: number | null;
  attendance?: number | null;
}
interface Index {
  mps?: SlimMp[];
  aggregates?: { total?: number };
}
interface Manifest {
  generated_at?: string;
  sources?: Record<string, { as_of?: string }>;
}

async function main(): Promise<void> {
  const index = JSON.parse(await readFile(new URL('index.json', CANON), 'utf8')) as Index;
  const manifest = JSON.parse(await readFile(new URL('manifest.json', CANON), 'utf8')) as Manifest;
  const mps = index.mps ?? [];
  const errors: string[] = [];

  if (mps.length !== EXPECTED_MPS) errors.push(`expected ${EXPECTED_MPS} MPs, got ${mps.length}`);
  const missingId = mps.filter((m) => !m.slug || !m.name || !m.pc_id).length;
  if (missingId) errors.push(`${missingId} MP(s) missing slug/name/pc_id`);
  if (!index.aggregates?.total) errors.push('index missing aggregates.total');
  if (!manifest.generated_at) errors.push('manifest missing generated_at');

  const scored = mps.filter((m) => m.score != null).length;
  if (mps.length && scored < mps.length * SCORE_COVERAGE_FLOOR)
    errors.push(`score coverage too low: ${scored}/${mps.length}`);
  const attended = mps.filter((m) => m.attendance != null).length;
  if (mps.length && attended < mps.length * ATTENDANCE_COVERAGE_FLOOR)
    errors.push(`attendance coverage too low: ${attended}/${mps.length} (broken PRS scrape?)`);

  if (errors.length) {
    console.error(`assert:canonical FAILED:\n - ${errors.join('\n - ')}`);
    process.exit(1);
  }
  console.log(
    `assert:canonical OK — ${mps.length} MPs · ${scored} scored · ${attended} with attendance · as_of ${manifest.generated_at}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
