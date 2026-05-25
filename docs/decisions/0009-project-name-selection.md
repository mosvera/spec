# ADR-0009: Project Name Selection — Mosvera

**Status:** Accepted
**Date:** 2026-05-24
**Doctrines invoked:** Public-first, Adoption-over-convenience, Comparable-class framing, Research-first

## Context

The project began under the name **Tessera** (Latin for a mosaic tile —
the concept of small pieces composing a larger whole). That name was
adopted before any availability research. Subsequent investigation found
it unusable for an open standard: every relevant domain TLD was taken
(`tessera.com` redirect, `tessera.io` parked, `.dev`/`.org`/`.ai`/`.run`
all registered), `github.com/tessera` was taken, and "Tessera" is a real
English/Latin word already used as a brand across many industries
(Tessera Technologies, real-estate, jewelry, consulting, manufacturing).

This surfaced a methodology failure worth recording so it is not
repeated: **availability was checked with a domain DNS lookup only, after
substantial work had already been built on the name.** Doctrine 5
(Research-first) explicitly covers "choices that already feel obvious" —
and a project's name is the most consequential and most obvious decision
of all. The correct check order is brand-collision search first, then
trademark, then social handles, then domains — not domains alone, and not
after the fact.

This ADR records the corrected process and the name selected.

## Research

A multi-round search evaluated 80+ candidates across several naming
traditions, each filtered through the full availability surface. The
key findings:

- **The short-single-word namespace is exhausted in 2026.** Real Latin/
  Greek words (Velum, Limen, Tela, Cella, Tabula, Stoichia, Aestheia,
  Aedicule, Volutum) are each held by one or more active tech companies.
  The 2018–2024 startup naming wave absorbed essentially the entire
  short-word space.
- **The "aesthetic*" and "Open*" compound spaces are saturated.**
  OpenAesthetic (Shopify store), OpenStyle (active project), OpenPalette
  (NFT project + ZTE platform), AestheticIntent, AestheticFabric,
  AestheticLayer — all collide.
- **Coined-classical names (Aestheton, Aestharium, Tessellum) are
  brand-clean but fail the legibility test** — they read as invented
  incantations a stranger cannot decode or confidently pronounce, and the
  "Aest-" stem space is itself crowded with real aesthetic businesses
  (Aestheia medical imaging, Aedicule framemaking).
- **The hard filter that broke the deadlock**: require `.com` **and** the
  bare GitHub org to be free, applied to *coined* (non-dictionary) names.
  This is the only filter that reliably finds clean, ownable identities
  in 2026. Four candidates passed across `.com` + `.io` + `.dev` + GitHub:
  `vesturi`, `tesvera`, `khromix`, `mosvera`.
- **Brand-collision search on the four survivors**: `vesturi` is one vowel
  off the saturated "Vesture" apparel root; `khromix` collides with
  CHROMiX Inc in the same content-production vertical and is color-narrow;
  `tesvera` is phonetically adjacent to Tevera (edtech software) — a
  same-vertical spoken-confusion risk; **`mosvera` is clean** — no
  commercial brand, no close phonetic neighbor in any vertical.

## Decision

The project name is **Mosvera**.

Verified clean across the full surface (web search + domains + org + npm +
social), each checked, not assumed:

| Surface | Status |
|---------|--------|
| `mosvera.com` | free |
| `mosvera.io` / `.dev` / `.org` / `.ai` | free |
| `github.com/mosvera` (org) | free |
| `@mosvera` npm scope | free |
| `mosvera.bsky.social` | free |
| Commercial brand collision | none found |

The name carries faint, non-load-bearing conceptual resonance — *mos-*
(mosaic, the composing-pieces idea inherited from Tessera) and *vera*
(Latin "true") — but its primary justifications are that it is
**distinctive, ownable, pronounceable on first encounter, spellable, and
reads with spec/standard gravity rather than product/app gravity**.

Consequent renames applied across the repository:

- All prose, schema titles/descriptions, and identifiers: Tessera →
  Mosvera.
- Schema `$id` URNs: `urn:tessera:` → `urn:mosvera:`.
- The enhancement-proposal series: **TEP → MEP** (Tessera Enhancement
  Proposal → Mosvera Enhancement Proposal); directory `spec/teps/` →
  `spec/meps/`; conformance-vector field `tep` → `mep`.
- The GitHub repository: renamed to `mosvera`.

## Consequences

**Enables:**
- A clean, ownable identity across every surface a public open standard
  needs — the strongest acquisition position of any candidate evaluated,
  and far better than Tessera ever had.
- No `.com`/org/social asterisks to explain to future contributors or
  adopters.

**Precludes / accepts:**
- The literal "mosaic tile" meaning of Tessera is lost; Mosvera only
  gestures at it via *mos-*. Accepted — distinctiveness and
  availability outweigh a literal etymology a stranger would not decode
  anyway.
- A one-time rename cost across the repository (~65 files), already paid.

**Process correction (the durable lesson):**
- Name and other high-stakes identity decisions MUST run the full
  brand-availability process **before** work is built on them:
  (1) web search for commercial collisions, (2) trademark check,
  (3) social-handle check, (4) domain + org + package-registry check.
  A domain DNS lookup alone is insufficient and checking after the fact
  is a Doctrine 5 violation. This ADR is the record of why.

**Still incubation:**
- Selecting the name does not change the incubation posture. Public
  launch remains deferred to Phase 6 per [`ROADMAP.md`](../../ROADMAP.md);
  the name is simply settled rather than provisional.

## Sources

This decision is grounded in primary availability data (DNS, GitHub API,
npm registry, Bluesky handle resolution) gathered during the search, and
web-search brand-collision results for each finalist. Representative
collision findings for the rejected finalists:

1. [Tevera (edtech software)](https://www.crunchbase.com/organization/tevera) — phonetic adjacency that ruled out `tesvera`.
2. [Vesture Group (apparel)](https://vesturegroupinc.com/) — the saturated root that ruled out `vesturi`.
3. [CHROMiX, Inc. (content production)](https://www.linkedin.com/company/chromix) — same-vertical collision that ruled out `khromix`.
4. [Tessera Technologies](https://www.cbinsights.com/company/tessera-technologies) — representative of the brand saturation that ruled out the original "Tessera".

No commercial brand collision was found for "Mosvera" in any vertical at
the time of this decision.
