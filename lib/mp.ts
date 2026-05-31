import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { hasSlug, type Mp } from '@/lib/data';

const MP_DIR = path.join(process.cwd(), 'data', 'canonical', 'mp');

export async function loadMp(slug: string): Promise<Mp | undefined> {
  if (!hasSlug(slug)) return undefined;
  try {
    return JSON.parse(await readFile(path.join(MP_DIR, `${slug}.json`), 'utf8')) as Mp;
  } catch {
    return undefined;
  }
}
