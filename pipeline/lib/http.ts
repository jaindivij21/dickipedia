import axios from 'axios';
import axiosRetry from 'axios-retry';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 dickipedia-opensource-civic-data';
const CACHE_DIR = new URL('../../data/cache/', import.meta.url);

const client = axios.create({
  headers: { 'User-Agent': UA },
  timeout: 60000,
  responseType: 'text',
  transformResponse: [(d) => d], // keep raw text; callers parse
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});
axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: () => true,
});

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function cachePath(url: string): Promise<URL> {
  const h = createHash('sha1').update(url).digest('hex').slice(0, 16);
  await mkdir(CACHE_DIR, { recursive: true });
  return new URL(`${h}.cache`, CACHE_DIR);
}

interface FetchOpts {
  headers?: Record<string, string>;
  cache?: boolean;
}

export async function fetchText(url: string, opts: FetchOpts = {}): Promise<string> {
  const { headers = {}, cache = true } = opts;
  const cp = cache ? await cachePath(url) : null;
  if (cp && existsSync(cp)) return await readFile(cp, 'utf8');
  const res = await client.get(url, { headers });
  const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
  if (cp) await writeFile(cp, text);
  return text;
}

export async function fetchJson<T = unknown>(url: string, opts?: FetchOpts): Promise<T> {
  return JSON.parse(await fetchText(url, opts)) as T;
}
