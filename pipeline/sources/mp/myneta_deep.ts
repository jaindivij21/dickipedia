import { mkdir, writeFile } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { fetchTextOrNull, sleep } from '../../lib/http.ts';
import { parseRupees, parseInt0 } from '../../lib/money.ts';
import type { Provenance } from '../../lib/types.ts';
import { RAW, CANON } from '../../lib/paths.ts';

const MYNETA_BASE = 'https://myneta.info';
const CANDIDATE = (id: number): string =>
  `https://myneta.info/LokSabha2024/candidate.php?candidate_id=${id}`;
const CURRENT_YEAR = 2024;
const SLEEP_MS = 1100;
const FLUSH_EVERY = 40;
const PROVENANCE: Provenance = {
  source: 'ADR / MyNeta.info (from ECI sworn affidavits)',
  license: 'Non-commercial; display + attribution',
  url: 'https://myneta.info/LokSabha2024/',
};

interface CrosswalkRow {
  pc_id: string;
  myneta: { matched: boolean; candidate_id: number | null };
}
interface CriminalCase {
  serial: number | null;
  fir_no: string | null;
  case_no: string | null;
  court: string | null;
  sections: string[];
  other_acts: string | null;
  charges_framed: boolean;
  status: 'pending' | 'convicted';
}
interface IpcCharge {
  count: number;
  description: string;
  section: string;
}
interface ValueLine {
  category: string;
  value: number | null;
}
interface ItrRow {
  person: string;
  fy: string;
  income: number | null;
}
interface IncomeSource {
  person: string;
  source: string;
}
interface Contract {
  party: string;
  detail: string;
}
interface PriorAffidavit {
  label: string;
  body: string;
  year: number;
  total_assets: number | null;
  declared_cases: number;
}
interface MynetaDeepRow {
  pc_id: string;
  candidate_id: number;
  total_assets: number | null;
  total_liabilities: number | null;
  criminal: {
    count: number;
    ipc_summary: IpcCharge[];
    pending: CriminalCase[];
    convicted: CriminalCase[];
  };
  assets: {
    movable_total: number | null;
    immovable_total: number | null;
    movable: ValueLine[];
    immovable: ValueLine[];
  };
  liabilities: { total: number | null; lines: ValueLine[] };
  income: { sources: IncomeSource[]; itr: ItrRow[] };
  contracts: Contract[];
  prior_affidavits: PriorAffidavit[];
  compare_url: string | null;
  source_url: string;
  _provenance: Provenance;
}

const clean = (s: string): string => s.replace(/\s+/g, ' ').trim();
const yes = (s: string): boolean => /^\s*y(es)?\s*$/i.test(clean(s));
const parseSections = (raw: string): string[] => {
  const out: string[] = [];
  for (const tok of raw.split(/[,\s]+/).filter(Boolean)) {
    if (out.length && /^\(/.test(tok)) out[out.length - 1] += tok;
    else out.push(tok);
  }
  return out;
};

function summaryRupees($: CheerioAPI, label: RegExp): number | null {
  let out: number | null = null;
  $('tr').each((_, tr) => {
    if (out != null) return;
    const tds = $(tr).find('td');
    if (tds.length >= 2 && label.test(clean($(tds[0]).text()))) out = parseRupees($(tds[1]).text());
  });
  return out;
}

function criminalCount($: CheerioAPI): number {
  const m = clean($.root().text()).match(/Number of Criminal Cases:\s*(\d+)/i);
  return m ? Number(m[1]) : 0;
}

function ipcSummary($: CheerioAPI): IpcCharge[] {
  const out: IpcCharge[] = [];
  $('h4:contains("Brief Details of IPC")')
    .closest('.w3-panel')
    .nextAll('.w3-small')
    .first()
    .find('li')
    .each((_, li) => {
      const t = clean($(li).text());
      const m = t.match(/^(\d+)\s+charges?\s+related to\s+(.*?)\s*\(IPC Section-([^)]+)\)/i);
      if (m) out.push({ count: Number(m[1]), description: m[2].trim(), section: m[3].trim() });
    });
  return out;
}

function casesUnder(
  $: CheerioAPI,
  headingText: string,
  status: 'pending' | 'convicted',
): CriminalCase[] {
  const table = $(`h3:contains("${headingText}")`)
    .closest('.w3-panel')
    .nextAll('.w3-responsive')
    .first()
    .find('table');
  const out: CriminalCase[] = [];
  table.find('tr').each((i, tr) => {
    const tds = $(tr).find('td');
    if (i === 0 || tds.length < 6) return; // header / "No Cases" colspan row
    const cell = (n: number): string => clean($(tds[n]).text());
    if (status === 'pending') {
      out.push({
        serial: parseInt0(cell(0)) || null,
        fir_no: cell(1) || null,
        case_no: cell(2) || null,
        court: cell(3) || null,
        sections: cell(4) ? parseSections(cell(4)) : [],
        other_acts: cell(5) || null,
        charges_framed: yes(cell(6)),
        status,
      });
    } else {
      out.push({
        serial: parseInt0(cell(0)) || null,
        fir_no: null,
        case_no: cell(1) || null,
        court: cell(2) || null,
        sections: cell(3) ? parseSections(cell(3)) : [],
        other_acts: cell(4) || null,
        charges_framed: true,
        status,
      });
    }
  });
  return out;
}

function assetLines($: CheerioAPI, tableId: string): { total: number | null; lines: ValueLine[] } {
  const table = $(`table#${tableId}`);
  const lines: ValueLine[] = [];
  let total: number | null = null;
  table.find('tr').each((i, tr) => {
    const tds = $(tr).find('td');
    if (i === 0 || tds.length < 2) return;
    const first = clean($(tds[0]).text());
    const desc = clean($(tds[1]).text()) || first;
    const last = clean($(tds[tds.length - 1]).text());
    if (/total|gross/i.test(first) || /total|gross/i.test(desc)) {
      const v = parseRupees(last);
      if (v != null && (total == null || v > total)) total = v;
      return;
    }
    const value = parseRupees(last);
    const category = desc.replace(/^\([a-z]\)\s*/i, '').slice(0, 80);
    if (category && !/^sr\s*no/i.test(category)) lines.push({ category, value });
  });
  return { total, lines };
}

function incomeSources($: CheerioAPI): IncomeSource[] {
  const out: IncomeSource[] = [];
  $('table#incomesource tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 2) return;
    const person = clean($(tds[0]).text());
    const source = clean($(tds[1]).text());
    if (/^(self|spouse|dependent)$/i.test(person) && source && !/^nil$/i.test(source))
      out.push({ person, source });
  });
  return out;
}

function itrRows($: CheerioAPI): ItrRow[] {
  const out: ItrRow[] = [];
  $('table#income_tax')
    .find('tr')
    .each((i, tr) => {
      if (i === 0) return;
      const tds = $(tr).find('td');
      if (tds.length < 4) return;
      const person = clean($(tds[0]).text());
      const cellHtml = $(tds[3]).html() ?? '';
      for (const part of cellHtml.split(/<br\s*\/?>/i)) {
        const m = clean(cheerio.load(`<i>${part}</i>`)('i').text()).match(
          /(\d{4}\s*-\s*\d{4})\s*\*\*\s*Rs?\.?\s*([\d,]+)/i,
        );
        if (m) {
          const income = parseRupees(m[2]);
          if (income != null && income > 0)
            out.push({ person, fy: m[1].replace(/\s+/g, ''), income });
        }
      }
    });
  return out;
}

function contracts($: CheerioAPI): Contract[] {
  const out: Contract[] = [];
  $('tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length !== 2) return;
    const label = clean($(tds[0]).text());
    if (!/^details of contracts entered/i.test(label)) return;
    const detail = clean($(tds[1]).text());
    if (detail && !/^(na|nil|not applicable|none|-)$/i.test(detail))
      out.push({
        party:
          label.replace(/^details of contracts entered (into )?by\s*/i, '').trim() || 'candidate',
        detail,
      });
  });
  return out;
}

function otherElections($: CheerioAPI): { prior: PriorAffidavit[]; compare_url: string | null } {
  const table = $('th:contains("Other Elections")').first().closest('table');
  const prior: PriorAffidavit[] = [];
  table.find('tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length !== 3) return;
    const label = clean($(tds[0]).text());
    const ym = label.match(/(\d{4})/);
    if (!ym) return;
    const year = Number(ym[1]);
    if (!Number.isFinite(year) || year === CURRENT_YEAR) return;
    const total_assets = parseRupees($(tds[1]).text());
    if (total_assets == null) return;
    prior.push({
      label,
      body: label.replace(/\s*\d{4}.*$/, '').trim(),
      year,
      total_assets,
      declared_cases: parseInt0($(tds[2]).text()),
    });
  });
  const href = table.find("a[href*='compare_profile.php']").attr('href');
  return { prior, compare_url: href ? new URL(href, MYNETA_BASE).href : null };
}

function parse(html: string, pc_id: string, candidate_id: number): MynetaDeepRow {
  const $ = cheerio.load(html);
  const { prior, compare_url } = otherElections($);
  const movable = assetLines($, 'movable_assets');
  const immovable = assetLines($, 'immovable_assets');
  const liabilities = assetLines($, 'liabilities');
  return {
    pc_id,
    candidate_id,
    total_assets: summaryRupees($, /^assets:?$/i),
    total_liabilities: summaryRupees($, /^liabilities:?$/i),
    criminal: {
      count: criminalCount($),
      ipc_summary: ipcSummary($),
      pending: casesUnder($, 'Cases where Pending', 'pending'),
      convicted: casesUnder($, 'Cases where Convicted', 'convicted'),
    },
    assets: {
      movable_total: movable.total,
      immovable_total: immovable.total,
      movable: movable.lines,
      immovable: immovable.lines,
    },
    liabilities: { total: liabilities.total, lines: liabilities.lines },
    income: { sources: incomeSources($), itr: itrRows($) },
    contracts: contracts($),
    prior_affidavits: prior,
    compare_url,
    source_url: CANDIDATE(candidate_id),
    _provenance: PROVENANCE,
  };
}

export async function run(): Promise<void> {
  const crosswalk = JSON.parse(
    await readFile(new URL('crosswalk.json', CANON), 'utf8'),
  ) as CrosswalkRow[];
  const only = process.argv[2] ? Number(process.argv[2]) : null;
  const targets = crosswalk
    .filter((r) => r.myneta.candidate_id != null)
    .filter((r) => only == null || r.myneta.candidate_id === only);
  console.log(`Deep MyNeta affidavits to fetch: ${targets.length}`);

  await mkdir(RAW, { recursive: true });
  const out: MynetaDeepRow[] = [];
  let i = 0;
  for (const r of targets) {
    const id = r.myneta.candidate_id as number;
    const html = await fetchTextOrNull(CANDIDATE(id));
    await sleep(SLEEP_MS);
    if (!html) continue;
    out.push(parse(html, r.pc_id, id));
    if (++i % FLUSH_EVERY === 0) {
      await writeFile(new URL('myneta_deep.json', RAW), JSON.stringify(out, null, 2));
      console.log(`  ${i}/${targets.length} parsed`);
    }
  }
  await writeFile(new URL('myneta_deep.json', RAW), JSON.stringify(out, null, 2));
  const withCrim = out.filter((r) => r.criminal.count > 0).length;
  const withContracts = out.filter((r) => r.contracts.length > 0).length;
  const withPrior = out.filter((r) => r.prior_affidavits.length > 0).length;
  console.log(
    `Deep MyNeta parsed: ${out.length} (with criminal cases ${withCrim} · with contracts ${withContracts} · with prior affidavits ${withPrior})`,
  );
  console.log('Wrote data/raw/myneta_deep.json');
}
