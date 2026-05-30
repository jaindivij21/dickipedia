---
name: Editorial
colors:
  primary: '#111111'
  secondary: '#f1f1f1'
  success: '#16A34A'
  warning: '#D97706'
  danger: '#DC2626'
  surface: '#FFFFFF'
  text: '#111827'
  neutral: '#FFFFFF'
typography:
  h1:
    fontFamily: 'Gelasio'
    fontSize: 2.5rem
  body-md:
    fontFamily: 'Gelasio'
    fontSize: 1rem
  label-caps:
    fontFamily: 'Ubuntu Mono'
    fontSize: 0.875rem
  sourceScale: '14/16/18/24/32/40'
  weights: '100, 200, 300, 400, 500, 600, 700, 800, 900'
rounded:
  sm: 4px
  md: 8px
spacing:
  sm: 8px
  md: 16px
  sourceScale: '8pt baseline grid'
---

## Overview

Magazine-inspired editorial layout with refined serif typography, structured grids, and elegant reading experiences.

## Style Foundations

- **Visual style:** modern, editorial
- **Typography scale:** 14/16/18/24/32/40
- **Typography fonts:** primary=Gelasio, display=Gelasio, mono=Ubuntu Mono
- **Typography weights:** 100, 200, 300, 400, 500, 600, 700, 800, 900
- **Color palette:** primary, secondary, neutral, success
- **Spacing scale:** 8pt baseline grid

## Colors

- **Primary (#111111):** Token from style foundations.
- **Secondary (#f1f1f1):** Token from style foundations.
- **Success (#16A34A):** Token from style foundations.
- **Warning (#D97706):** Token from style foundations.
- **Danger (#DC2626):** Token from style foundations.
- **Surface (#FFFFFF):** Token from style foundations.
- **Text (#111827):** Token from style foundations.
- **Neutral (#FFFFFF):** Derived from the surface token for official format compatibility.

## The Editorial Contract (derived from the home hero — the quality bar)

The home hero in `app/page.tsx` is the canonical reference; every surface must read as its
sibling. A "zone" = one self-contained visual unit (the hero, a feature, a section, a card,
the detail header, the margin). "must" = non-negotiable; "should" = recommended.

### 1. Issue framing

- Every zone MUST open with a mono `.eyebrow` that states what the zone is, framed as a
  periodical issue line: `VOLUME I · 18TH LOK SABHA · 543 RECORDS · 2024`,
  `Featured record · the lowest score on file`, `Record №{pc_id} · 18th Lok Sabha`,
  `Contents`, `At a glance`. Record/file ids are mono (`№{n}`, `RECORDS x–y OF n`).
- On the home and index, the eyebrow + rule IS the section header; no icon chips there.
- On the data-dense MP detail page, a section header pairs the mono `.eyebrow` kicker with a
  serif H2 title and a single hairline-framed icon tile (a lucide glyph in a `rounded-lg`
  `border-border` `bg-surface-2` tile, §6 radius scale) — an intentional richness affordance.
  Keep section icons monochrome ink, one per section; elsewhere icons stay inline in flags,
  bars, stat-tile labels, and margin rows.

### 2. The rule hangs the type (rule/eyebrow rhythm)

- A zone heading MUST hang off a 2px ink top rule: `.rule-top` + `pt-3` (eyebrow) or
  `pt-6` (oversized headline). 2px ink rules open zones; 1px `border-border` hairlines
  divide content WITHIN a zone (finding lists, info rows). On the home/index, never box a
  header in a surface-2 strip or a rounded card. On the MP detail page, section CONTENT may
  sit in `rounded-lg` `border-border` panels (charts, comparison strips) and separated
  `rounded-lg` stat tiles (`grid gap-3`, hover `bg-surface-2`) for richness — the header
  itself still hangs off the 2px rule.
- Inter-zone spacing is generous: `mt-16 sm:mt-20` (home), `mt-14` (detail sections).

### 3. The single-accent rule (accent budget)

- The editorial accent is `--color-accent` (#b91c1c) ONLY, via `text-accent`/`.mark-accent`/
  `bg-accent`. At most ONE accent element may be at REST per zone. A transient hover accent
  (`group-hover:text-accent` on a linked title) is allowed and does not count against the
  resting budget; a zone may carry at most one such hover accent.
- `colorVar('accent')` is FORBIDDEN — `colorVar` accepts only `'danger'|'warning'|'success'
|'primary'`. For the accent use the class `text-accent` or `var(--color-accent)` directly.
- The band/semantic palette (`--color-success`/`--color-warning`/`--color-danger`, always via
  `scoreBand`→`colorVar`) is a SEPARATE data-meaning system, EXEMPT from the accent budget,
  but it may render ONLY as: a ≤8px dot, a glyph (numeral) fill, a ≤2px micro-underline, an
  SVG arc (gauge/donut/bar), or a hairline-bordered tag. It MUST NOT render as a full-height
  edge rail, a large color fill, or a chip larger than the score plate.
- Never use `--color-accent` to mean "bad" — bad is `danger`; accent is editorial emphasis,
  landing on the franchise's load-bearing word (e.g. "powerful", "cites") or one defining
  figure. On home/index a zone spends at most ONE resting accent. The MP detail page also
  uses a small `bg-accent` rule tick (`h-0.5 w-10`) at the start of each section's 2px rule
  as a periodical motif (consistent with home's category/feature accent bars) plus one
  `.mark-accent` phrase in the standfirst — these structural ticks are the page's accent
  budget; data meaning still comes only from the bands.

### 4. Type ladder & weight-not-color emphasis (Gelasio display)

- Display headlines: `tracking-[-0.02em]`, `leading-[1.04–1.05]`, `text-balance`, left-
  weighted and width-capped. Home H1 `text-[2.75rem] sm:text-5xl lg:text-6xl max-w-[16ch]`;
  detail H1 `text-[2.25rem] sm:text-5xl max-w-[18ch]`; featured headline `text-[2rem]
sm:text-4xl lg:text-5xl max-w-[14ch]`.
- Headline figures and section Metrics use Gelasio display (serif = headline figure);
  per-card data points and all labels use Ubuntu Mono (`.font-mono`/`.eyebrow`)
  (mono = data point). Honor this serif/mono split — it is a meaning signal.
- In prose ledes/standfirsts, emphasis is WEIGHT (`font-medium`/`font-semibold` on
  `text-ink` vs `text-ink-soft`), NEVER color. Ledes `max-w-[42–46ch]`, `text-lg`,
  `leading-relaxed`, `text-pretty`. Reserve color for the accent (§3) and the bands.

### 5. Whitespace & left-weight discipline

- Content hugs the left; the right breathes. Headlines/ledes are width-capped (§4); do not
  stretch type to the container edge. Right-side whitespace beside a feature headline or
  the detail score gauge is intentional — keep it. 8pt grid throughout.

### 6. Surface texture (editorial, not dashboard) + score treatment

- Square corners (`rounded-none`/default) and hairline ink/`border-border` frames only. Do
  NOT use `rounded-2xl`/`rounded-3xl` container tiles, pill chips for structural elements,
  or soft shadows. Structural surfaces use inline Tailwind (`border border-border` +
  `bg-surface`/`bg-surface-2`); the legacy `.neu-*` utilities have been retired. Only
  `.eyebrow`/`.rule-top`/`.mark-accent`/`.font-mono` remain as semantic editorial helpers.
  (Exceptions, sanctioned: the `ScoreGauge` band-label pill and the `Bar` track ship
  `rounded-full` internally; leave those component-internal pills as-is.)
- A card-level score reads as a band-colored serif NUMERAL + a 7px band dot + a 2px band
  micro-underline under the numeral + a band-label eyebrow. The full `ScoreGauge` half-arc
  appears ONLY on the detail standfirst header (size 140). NEVER communicate a score with a
  full-height vertical color rail on a card edge — that motif is PROHIBITED.
- `Donut`/`Bar` appear only on genuine part-to-whole or comparison data (MPLADS split,
  questions-by-ministry) — never decoratively. No new chart primitives.

### 7. Galleries & portraits

- Index cards are type-led catalogue entries with a small ruled `h-16 w-14` ink-bordered
  portrait thumbnail — NOT full-bleed photo tiles (avoids identical-card monoculture).
- Portraits: `object-cover object-top`, `grayscale-[12–15%]` at rest → `grayscale-0` on
  `group-hover`, under `motion-reduce`. Missing portrait → `font-mono` initials in an
  ink-bordered box. `party_full` MUST wrap (`text-balance`) and is NEVER truncated.

### 8. Sourcing & honesty affordances

- Every detail data section MUST carry a footnote-style source credit in its header
  (mono `text-[10px]`, `ExternalLink size={10}`) plus a closing "Sources & method" ruled
  list. Self-declared/criminal data keeps a "pending ≠ convicted" sub; bonds stay labeled
  "party-level, not this MP". The detail margin carries a "Revision history" hook
  (Wikipedia-style versioning copy + an inert "View full history" affordance).

### Anti-patterns (prohibited)

- ❌ Full-height/left-edge color rails on cards or category rows (the removed motif).
- ❌ Identical full-bleed photo-poster card grids; dashboard sidebars; `rounded-3xl`/`rounded-2xl`
  card stacks; soft-shadow neumorphism; rounded structural pills. (Detail-page `rounded-lg`
  panels/stat tiles + the hairline icon tile are allowed; see §1–§2.)
- ❌ `--color-accent` used for data meaning, `colorVar('accent')`. On home/index, >1 resting
  accent/zone (the detail page's per-section rule tick is the sanctioned exception, §3).
- ❌ Coloring multiple masthead/metric figures decoratively (≤1 colored lead figure).
- ❌ Truncated `party_full`; centered display headlines; figures inside ring/inset boxes.

### QA checklist (run in code review)

- [ ] Every zone opens with an `.eyebrow` + (where a heading) a `.rule-top`; spacing
      `mt-16/20` (home), `mt-14` (detail). Detail section headers add a serif H2 title + a
      hairline icon tile (§1).
- [ ] ≤1 resting `--color-accent` per zone on home/index; the detail page's per-section rule
      tick is sanctioned (§3); bands carry all score/data meaning and render only as
      dot/glyph/≤2px underline/arc/hairline tag/bar fill; no `colorVar('accent')`.
- [ ] No edge color rails; score = band-ringed-NUMERAL plate (dot + numeral + underline) on
      cards/featured, `ScoreGauge` only on detail; null → gray border + "—" + warning label.
- [ ] `party_full` never truncated; long values wrap via `text-balance`.
- [ ] Display headlines left-weighted, `tracking-[-0.02em]`, `text-balance`, capped measure
      (`max-w-[14–18ch]`); ledes `max-w-[42–46ch]`; right whitespace preserved.
- [ ] Square / `rounded-lg` (≤8px) corners + hairline frames only; no `rounded-2xl`/`rounded-3xl`
      tiles, no shadows (component-internal gauge/bar pills excepted).
- [ ] Band colors come only from `scoreBand`/`colorVar`; no hardcoded band hex.
- [ ] All transitions `motion-reduce:transition-none`; focus-visible `ring-2 ring-ink/40`
      (ink, never accent); touch targets ≥44px (`h-11`); body ≥4.5:1 (ink 16.1:1,
      ink-soft 4.83:1).
- [ ] Each detail data section has a source credit; "pending ≠ convicted" + party-level
      bond disclaimers present; revision-history hook present.
