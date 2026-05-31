import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fetchBuffer, fetchJson, sleep } from './lib/http.ts';
import { stripDiacritics } from './lib/text.ts';

const RAW = new URL('../data/raw/', import.meta.url);
const PUBLIC = new URL('../public/parties/', import.meta.url);
const COMMONS_FILE = (f: string): string => `https://commons.wikimedia.org/wiki/${encodeURI(f)}`;
const IMAGEINFO = (files: string[]): string =>
  `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=${encodeURIComponent('url|extmetadata')}&titles=${encodeURIComponent(files.join('|'))}`;
const DOWNLOAD_SLEEP_MS = 1200;
const WIKIMEDIA_UA =
  'dickipedia/0.1 (open-source civic data; https://github.com/dickipedia) tsx-pipeline';
const OPEN_LICENSE = /^(cc0|cc by|public domain|godl)/i;

const SYMBOL_OVERRIDES: Record<string, string> = {
  BJP: 'File:BJP Election Symbol.svg',
  INC: 'File:Indian National Congress hand logo.svg',
  SP: 'File:Indian Election Symbol Cycle.png',
  AITC: 'File:All India Trinamool Congress symbol.svg',
  DMK: 'File:Indian Election Symbol Rising Sun.png',
  TDP: 'File:Indian Election Symbol Cycle.png',
  'JD(U)': 'File:Indian Election Symbol Arrow.svg',
  'SHIV SENA (UDDHAV BALASAHEB THACKREY)': 'File:Indian Election Symbol Flaming Torch.png',
  'NATIONALIST CONGRESS PARTY - SHARADCHANDRA PAWAR':
    'File:Indian Election Symbol Man Blowing Turha.png',
  SHS: 'File:Indian Election Symbol Bow And Arrow.svg',
  'LOK JANSHAKTI PARTY(RAM VILAS)': 'File:Indian Election Symbol Helicopter.png',
  YSRCP: 'File:Indian Election Symbol Ceiling Fan.svg',
  'RASHTRIYA JANATA DAL': 'File:Indian Election Symbol Hurricane Lamp.png',
  'COMMUNIST PARTY OF INDIA (MARXIST)': 'File:Indian Election Symbol Hammer Sickle and Star.png',
  'INDIAN UNION MUSLIM LEAGUE': 'File:Indian Election Symbol Lader.svg',
  AAP: 'File:AAP Symbol.png',
  'JHARKHAND MUKTI MORCHA': 'File:Indian Election Symbol Bow And Arrow.svg',
  'JANASENA PARTY': 'File:Indian election symbol glass tumbler.svg',
  'COMMUNIST PARTY OF INDIA (MARXIST-LENINIST) (LIBERATION)':
    'File:Indian Election Symbol Flag with three stars.png',
  'JANATA DAL (SECULAR)': 'File:Indian Election Symbol Lady Farmer.png',
  'COMMUNIST PARTY OF INDIA': 'File:CPI symbol.svg',
  'JAMMU & KASHMIR NATIONAL CONFERENCE': 'File:Indian Election Symbol Plough.png',
  'ASOM GANA PARISHAD': 'File:Indian Election Symbol Elephant.png',
  'REVOLUTIONARY SOCIALIST PARTY': 'File:Indian Election Symbol Spade and Stoker.png',
  'KERALA CONGRESS': 'File:Indian Election Symbol Two Leaves.svg',
  'NATIONALIST CONGRESS PARTY': 'File:Indian Election Symbol Clock (old version).jpg',
  'SHIROMANI AKALI DAL': 'File:Indian Election Symbol Scale.png',
  'SIKKIM KRANTIKARI MORCHA': 'File:Symbol SKM.png',
  'APNA DAL (SONEYLAL)': 'File:Indian Election Symbol Cup and Saucer.jpg',
  'AJSU PARTY': 'File:Indian Election Symbol Banana.svg',
  'ALL INDIA MAJLIS-E-ITTEHADUL MUSLIMEEN': 'File:Indian Election Symbol Kite.svg',
};

interface PartyRow {
  code: string;
  full: string;
}
interface SymbolEntry {
  symbol: string;
  symbol_file: string;
  symbol_source_url: string;
  symbol_license: string | null;
  symbol_author: string | null;
}
interface ImageInfo {
  url: string;
  license: string | null;
  author: string | null;
}

const codeKey = (c: string): string =>
  stripDiacritics(c)
    .toUpperCase()
    .replace(/[–—]/g, '-')
    .replace(/[‘’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const titleKey = (t: string): string => t.replace(/_/g, ' ').trim();
const stripHtml = (s: string): string =>
  s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const sanitizeSvg = (svg: string): string =>
  svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/(href|xlink:href)\s*=\s*("|')javascript:[^"']*\2/gi, '');

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

async function resolveImageInfo(files: string[]): Promise<Map<string, ImageInfo>> {
  const out = new Map<string, ImageInfo>();
  const data = await fetchJson<{
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          missing?: string;
          imageinfo?: { url?: string; extmetadata?: Record<string, { value?: unknown }> }[];
        }
      >;
    };
  }>(IMAGEINFO(files));
  const pages = data.query?.pages ?? {};
  for (const p of Object.values(pages)) {
    if (p.missing !== undefined || !p.title) continue;
    const ii = p.imageinfo?.[0];
    if (!ii?.url) continue;
    const ext = ii.extmetadata ?? {};
    out.set(titleKey(p.title), {
      url: ii.url,
      license: str(ext.LicenseShortName?.value) || null,
      author: stripHtml(str(ext.Artist?.value)) || null,
    });
  }
  return out;
}

async function main(): Promise<void> {
  const spine = JSON.parse(await readFile(new URL('eci_spine.json', RAW), 'utf8')) as {
    winner_party: string;
    winner_party_full: string;
  }[];
  const byCode = new Map<string, PartyRow>();
  for (const s of spine)
    if (!byCode.has(s.winner_party))
      byCode.set(s.winner_party, { code: s.winner_party, full: s.winner_party_full });
  const parties = [...byCode.values()];
  const wanted = parties
    .map((p) => ({ p, file: SYMBOL_OVERRIDES[codeKey(p.code)] }))
    .filter((x): x is { p: PartyRow; file: string } => Boolean(x.file));

  const uniqueFiles = [...new Set(wanted.map((x) => x.file))];
  console.log(
    `Resolving ${uniqueFiles.length} Commons files for ${wanted.length}/${parties.length} parties...`,
  );
  const info = await resolveImageInfo(uniqueFiles);

  await mkdir(PUBLIC, { recursive: true });
  const symbols: Record<string, SymbolEntry> = {};
  const gaps: string[] = [];
  for (const { p, file } of wanted) {
    const ii = info.get(titleKey(file));
    if (!ii) {
      gaps.push(`${p.code} (file missing: ${file})`);
      continue;
    }
    if (!ii.license || !OPEN_LICENSE.test(ii.license)) {
      gaps.push(`${p.code} (non-open licence: ${ii.license})`);
      continue;
    }
    const ext = (ii.url.split('.').pop() || 'svg').toLowerCase();
    const slug = slugify(p.code);
    const rel = `/parties/${slug}.${ext}`;
    const buf = await fetchBuffer(ii.url, { headers: { 'User-Agent': WIKIMEDIA_UA } });
    await sleep(DOWNLOAD_SLEEP_MS);
    const bytes = ext === 'svg' ? Buffer.from(sanitizeSvg(buf.toString('utf8')), 'utf8') : buf;
    await writeFile(new URL(`${slug}.${ext}`, PUBLIC), bytes);
    symbols[p.code] = {
      symbol: rel,
      symbol_file: file,
      symbol_source_url: COMMONS_FILE(file),
      symbol_license: ii.license,
      symbol_author: ii.author,
    };
  }

  await mkdir(RAW, { recursive: true });
  await writeFile(
    new URL('party_symbols.json', RAW),
    JSON.stringify(
      {
        symbols,
        _provenance: {
          source:
            'Wikimedia Commons (per-file open licence: CC0 / CC BY-SA / Public domain / GODL-India)',
          license: 'Open; re-hosted with per-file attribution (see ATTRIBUTIONS.md)',
          url: 'https://commons.wikimedia.org/wiki/Category:Symbols_of_political_parties_in_India',
        },
      },
      null,
      2,
    ),
  );

  const have = Object.keys(symbols).length;
  console.log(`Downloaded ${have} party symbols to public/parties/`);
  if (gaps.length) console.log(`No symbol (${gaps.length}): ${gaps.join(', ')}`);
  console.log(`Without a mapping (initials fallback): ${parties.length - wanted.length} parties`);
  console.log('\nAttribution (paste into ATTRIBUTIONS.md):');
  for (const [code, s] of Object.entries(symbols))
    console.log(
      `- ${code}: ${s.symbol_file} — ${s.symbol_license}${s.symbol_author ? ` — ${s.symbol_author}` : ''} — ${s.symbol_source_url}`,
    );
  console.log(`\nWrote data/raw/party_symbols.json`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
