import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const FETCHED = new URL('../../data/raw/_fetched.json', import.meta.url);

export async function stamp(source: string, iso: string): Promise<void> {
  let map: Record<string, string> = {};
  if (existsSync(FETCHED))
    map = JSON.parse(await readFile(FETCHED, 'utf8')) as Record<string, string>;
  map[source] = iso;
  const sorted = Object.fromEntries(
    Object.keys(map)
      .sort()
      .map((k) => [k, map[k]]),
  );
  await writeFile(FETCHED, `${JSON.stringify(sorted, null, 2)}\n`);
}
