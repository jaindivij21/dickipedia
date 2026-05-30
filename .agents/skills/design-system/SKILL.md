---
name: editorial
description: Magazine-inspired editorial layout with refined serif typography, structured grids, and elegant reading experiences.
license: MIT
metadata:
  author: typeui.sh
---

<!-- TYPEUI_SH_MANAGED_START -->

# Editorial Design System Skill (Universal)

## Mission

You are an expert design-system guideline author for Editorial.
Create practical, implementation-ready guidance that can be directly used by engineers and designers.

## Brand

## Style Foundations

- Visual style: modern, editorial
- Typography scale: 14/16/18/24/32/40 | Fonts: primary=Gelasio, display=Gelasio, mono=Ubuntu Mono | weights=100, 200, 300, 400, 500, 600, 700, 800, 900
- Color palette: primary, secondary, neutral, success | Tokens: primary=#111111, secondary=#f1f1f1, success=#16A34A, warning=#D97706, danger=#DC2626, surface=#FFFFFF, text=#111827
- Spacing scale: 8pt baseline grid

## Accessibility

WCAG 2.2 AA, keyboard-first interactions, visible focus states, semantic HTML before ARIA, screen-reader tested labels, reduced-motion support, 44px+ touch targets, high-contrast support

## Writing Tone

concise, confident, helpful, clear, friendly, professional, action-oriented, low-jargon

## Rules: Do

- prefer semantic tokens over raw values
- preserve visual hierarchy
- keep interaction states explicit
- design for empty/loading/error states
- ensure responsive behavior by default
- document accessibility rationale

## Rules: Don't

- avoid low contrast text
- avoid inconsistent spacing rhythm
- avoid ambiguous labels

## Expected Behavior

- Follow the foundations first, then component consistency.
- When uncertain, prioritize accessibility and clarity over novelty.
- Provide concrete defaults and explain trade-offs when alternatives are possible.
- Keep guidance opinionated, concise, and implementation-focused.

## Guideline Authoring Workflow

1. Restate the design intent in one sentence before proposing rules.
2. Define tokens and foundational constraints before component-level guidance.
3. Specify component anatomy, states, variants, and interaction behavior.
4. Include accessibility acceptance criteria and content-writing expectations.
5. Add anti-patterns and migration notes for existing inconsistent UI.
6. End with a QA checklist that can be executed in code review.

## Required Output Structure

When generating design-system guidance, use this structure:

- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations

- Define required states: default, hover, focus-visible, active, disabled, loading, error (as relevant).
- Describe interaction behavior for keyboard, pointer, and touch.
- State spacing, typography, and color-token usage explicitly.
- Include responsive behavior and edge cases (long labels, empty states, overflow).

## Quality Gates

- No rule should depend on ambiguous adjectives alone; anchor each rule to a token, threshold, or example.
- Every accessibility statement must be testable in implementation.
- Prefer system consistency over one-off local optimizations.
- Flag conflicts between aesthetics and accessibility, then prioritize accessibility.

## Example Constraint Language

- Use "must" for non-negotiable rules and "should" for recommendations.
- Pair every do-rule with at least one concrete don't-example.
- If introducing a new pattern, include migration guidance for existing components.

<!-- TYPEUI_SH_MANAGED_END -->

## The Editorial Contract (derived from the home hero — the quality bar)

The home hero in `app/page.tsx` is the canonical reference; every surface must read as its
sibling. A "zone" = one self-contained visual unit (the hero, a feature, a section, a card,
the detail header, the margin). "must" = non-negotiable; "should" = recommended.

### 1. Issue framing

- Every zone MUST open with a mono `.eyebrow` that states what the zone is, framed as a
  periodical issue line: `VOLUME I · 18TH LOK SABHA · 543 RECORDS · 2024`,
  `Featured record · the lowest score on file`, `Record №{pc_id} · 18th Lok Sabha`,
  `Contents`, `At a glance`. Record/file ids are mono (`№{n}`, `RECORDS x–y OF n`).
- The eyebrow + rule IS the section header. Do NOT use icon-in-a-chip headers
  (a lucide glyph in a rounded box beside a title); icons survive only inline in flags,
  bars, and margin rows.

### 2. The rule hangs the type (rule/eyebrow rhythm)

- A zone heading MUST hang off a 2px ink top rule: `.rule-top` + `pt-3` (eyebrow) or
  `pt-6` (oversized headline). 2px ink rules open zones; 1px `border-border` hairlines
  divide content WITHIN a zone (stat strips, finding lists, info rows, and grid mortar via
  `gap-px` on `bg-border`). Never mix the weights; never box a header in a surface-2 strip
  or a rounded card.
- Inter-zone spacing is generous: `mt-16 sm:mt-20` (home), `mt-10` (detail sections).

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
  figure. Data-dense surfaces (the MP detail page) SHOULD spend at most ONE resting accent.

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
  or soft shadows. The `.neu-*` utilities are hairline-border editorial — keep them so.
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
- ❌ Identical full-bleed photo-poster card grids; dashboard sidebars; `rounded-3xl` card
  stacks; soft-shadow neumorphism; rounded structural pills.
- ❌ Icon-in-rounded-chip section headers.
- ❌ `--color-accent` used for data meaning, `colorVar('accent')`, or >1 resting accent/zone.
- ❌ Coloring multiple masthead/metric figures decoratively (≤1 colored lead figure).
- ❌ Truncated `party_full`; centered display headlines; figures inside ring/inset boxes.

### QA checklist (run in code review)

- [ ] Every zone opens with an `.eyebrow` + (where a heading) a `.rule-top`; spacing
      `mt-16/20` (home), `mt-10` (detail).
- [ ] ≤1 resting `--color-accent` per zone; bands carry all score/data meaning and render
      only as dot/glyph/≤2px underline/arc/hairline tag; no `colorVar('accent')`.
- [ ] No edge color rails; score = band-ringed-NUMERAL plate (dot + numeral + underline) on
      cards/featured, `ScoreGauge` only on detail; null → gray border + "—" + warning label.
- [ ] `party_full` never truncated; long values wrap via `text-balance`.
- [ ] Display headlines left-weighted, `tracking-[-0.02em]`, `text-balance`, capped measure
      (`max-w-[14–18ch]`); ledes `max-w-[42–46ch]`; right whitespace preserved.
- [ ] Square corners + hairline frames only; no `rounded-3xl` tiles, no shadows (component-
      internal gauge/bar pills excepted).
- [ ] Band colors come only from `scoreBand`/`colorVar`; no hardcoded band hex.
- [ ] All transitions `motion-reduce:transition-none`; focus-visible `ring-2 ring-ink/40`
      (ink, never accent); touch targets ≥44px (`h-11`); body ≥4.5:1 (ink 16.1:1,
      ink-soft 4.83:1).
- [ ] Each detail data section has a source credit; "pending ≠ convicted" + party-level
      bond disclaimers present; revision-history hook present.
