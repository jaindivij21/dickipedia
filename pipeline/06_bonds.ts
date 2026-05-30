// Pipeline step 9: electoral-bond PARTY funding (party-level only; never per-MP).
// Source: ECI/SBI disclosure (SC: ADR v Union of India, 15 Feb 2024), public-domain facts,
// ingested from community CSV mirrors. Aggregates party totals + top donors.
import { mkdir, writeFile } from "node:fs/promises";
import { fetchText } from "./lib/http.ts";
import { parseCSVObjects } from "./lib/csv.ts";
import { normParty } from "./lib/text.ts";

const ENCASH = "https://raw.githubusercontent.com/apoorv74/electoral-bonds-sbi/main/data/encashment.csv";
const MATCHED = "https://raw.githubusercontent.com/saisantoshv3/electoral_bonds/main/data/final.csv";
const RAW = new URL("../data/raw/", import.meta.url);
const rupee = (s: string): number => { const n = Number(String(s).replace(/[^0-9]/g, "")); return Number.isFinite(n) ? n : 0; };

async function main(): Promise<void> {
  console.log("Ingesting electoral-bond disclosure (party-level)...");
  const enc = parseCSVObjects(await fetchText(ENCASH));
  const matched = parseCSVObjects(await fetchText(MATCHED));

  const party = new Map<string, { total: number; count: number; full: string }>();
  for (const r of enc) {
    const p = normParty(r["politicalParty"]);
    const cur = party.get(p.short) || { total: 0, count: 0, full: p.full };
    cur.total += rupee(r["denomination"]); cur.count += 1;
    party.set(p.short, cur);
  }

  const donors = new Map<string, Map<string, number>>();
  for (const r of matched) {
    const p = normParty(r["political_party_name"]).short;
    const who = (r["purchaser_name"] || "").trim().toUpperCase();
    if (!who) continue;
    if (!donors.has(p)) donors.set(p, new Map());
    const dm = donors.get(p)!;
    dm.set(who, (dm.get(who) || 0) + rupee(r["amount"]));
  }

  const ranked = [...party.entries()]
    .map(([short, v]) => ({
      party: short, party_full: v.full, bond_total: v.total, bond_count: v.count,
      top_donors: [...(donors.get(short)?.entries() || [])].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, amount]) => ({ name, amount })),
    }))
    .sort((a, b) => b.bond_total - a.bond_total)
    .map((v, i) => ({ ...v, rank: i + 1 }));

  await mkdir(RAW, { recursive: true });
  await writeFile(new URL("electoral_bonds.json", RAW), JSON.stringify({
    _provenance: { source: "ECI/SBI electoral-bond disclosure (SC: ADR v Union of India, 15 Feb 2024)", license: "Public-domain facts", urls: [ENCASH, MATCHED] },
    parties: ranked,
  }, null, 2));

  console.log(`Parties with bond income: ${ranked.length}`);
  for (const p of ranked.slice(0, 5)) console.log(`  ${p.rank}. ${p.party}: Rs ${p.bond_total.toLocaleString("en-IN")} (${p.bond_count} bonds)`);
  console.log("Wrote data/raw/electoral_bonds.json");
}
main().catch((e) => { console.error(e); process.exit(1); });
