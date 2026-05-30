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

// liveness check for a hotlinked asset: 200 + image content-type. Raw axios (no retry) so a dead
// link fails fast instead of burning the retry budget. Used to drop 404 portrait URLs before record.
export async function imageOk(url: string, timeout = 12000): Promise<boolean> {
  try {
    const res = await axios.head(url, {
      timeout,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: { 'User-Agent': UA },
    });
    if (res.status !== 200) return false;
    const ct = String(res.headers['content-type'] ?? '');
    return ct === '' || ct.startsWith('image/');
  } catch {
    return false;
  }
}

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

// Graceful-degradation variants: a single dead page in a 543-MP crawl returns null instead of
// aborting the whole run. Network/parse failures and non-2xx responses resolve to null.
export async function fetchTextOrNull(url: string, opts?: FetchOpts): Promise<string | null> {
  try {
    return await fetchText(url, opts);
  } catch {
    return null;
  }
}

export async function fetchJsonOrNull<T = unknown>(
  url: string,
  opts?: FetchOpts,
): Promise<T | null> {
  const text = await fetchTextOrNull(url, opts);
  if (text == null) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// binary-safe fetch (images); caches raw bytes to disk like fetchText caches text
export async function fetchBuffer(url: string, opts: FetchOpts = {}): Promise<Buffer> {
  const { headers = {}, cache = true } = opts;
  const cp = cache ? await cachePath(url) : null;
  if (cp && existsSync(cp)) return await readFile(cp);
  const res = await client.get(url, {
    headers,
    responseType: 'arraybuffer',
    transformResponse: [(d) => d],
  });
  const buf = Buffer.from(res.data as ArrayBuffer);
  if (cp) await writeFile(cp, buf);
  return buf;
}
