# ADR-0003: RFC / Specification Proposal Format

**Status:** Accepted
**Date:** 2026-05-24
**Doctrines invoked:** Public-first, Adoption-over-convenience, Comparable-class framing, Research-first

## Context

Mosvera is a declarative runtime for aesthetic intent. Its long-term center of gravity is the **specification**, not any single implementation. To attract multi-vendor implementations and stay provider-neutral, the project needs a public, repeatable proposal process *before* the spec freezes — comparable to how OpenTelemetry, GraphQL, Kubernetes, Rust, and Python evolve their specs through structured enhancement proposals.

Three questions need answers:
1. What does a proposal document look like (template / sections)?
2. What's the lifecycle (state machine)?
3. How are proposals numbered, reviewed, and merged?

This ADR also needs to distinguish **MEPs (Mosvera Enhancement Proposals)** — long-form, spec-mutating proposals — from **ADRs**, which are the immutable, retrospective decision log used inside this repository (Nygard's format). ADRs record decisions already made; MEPs propose changes the project hasn't yet committed to.

## Research

**Rust RFCs (rust-lang/rfcs)** use a single GitHub repo, PR-based review, a 10-day Final Comment Period (FCP), and a template with sections: Summary, Motivation, Detailed design, Drawbacks, Alternatives, Unresolved questions. Numbering is the PR number (assigned at merge). Lifecycle: Draft (open PR) → Active (merged) → Complete (implemented) → Inactive (failed after acceptance). [1]

**OpenTelemetry OTEPs (open-telemetry/oteps)** explicitly borrow from Rust RFCs and Kubernetes KEPs. Template: Motivation, Explanation, Internal details, Trade-offs and mitigations, Prior art and alternatives, Open questions, Future possibilities. Approval requires four reviewer approvals on the PR; once merged, a follow-up issue is opened in the spec repo to integrate. Numbering uses the PR ID. [2][3]

**Kubernetes KEPs** use a richer state machine: `provisional → implementable → implemented`, plus `deferred / rejected / withdrawn / replaced`. KEPs must be sponsored by a SIG and carry production-readiness review and graduation criteria (alpha → beta → stable). Numbering is the enhancement-issue number. [4]

**Python PEPs** use Draft / Active / Accepted / Provisional / Deferred / Rejected / Withdrawn / Final / Superseded — the most granular set. Numbered monotonically. [5]

**ADR (Nygard, 2011)** is a *different* artifact: short, immutable, retrospective. Sections: Title, Status, Context, Decision, Consequences. Numbered monotonically (`0001-`, `0002-`, …). Once accepted, never edited — only superseded. [6][7]

The dominant pattern across all four spec-class projects (Rust, OTel, Kubernetes, Python):
- PR-based review against a single proposals repo (or proposals directory)
- Long-form template with explicit Motivation / Design / Alternatives / Drawbacks sections
- Lifecycle state machine richer than ADRs'
- Numbering tied to the PR or issue number (avoids merge-conflict races on monotonic IDs)

## Decision

Mosvera adopts a **two-document system**:

**1. MEPs (Mosvera Enhancement Proposals)** — long-form, spec-mutating proposals. Modeled directly on the OTEP process, because OTEPs were themselves designed by borrowing from Rust RFCs and Kubernetes KEPs and represent the closest comparable: a vendor-neutral, multi-language, spec-first project hosted under a foundation-like posture.

Location: `spec/meps/` (path stable through eventual repo split).

Template sections (verbatim from OTEP, adapted terminology):
- Motivation
- Explanation
- Internal details
- Trade-offs and mitigations
- Prior art and alternatives
- Open questions
- Future possibilities

Lifecycle states (adapted from Kubernetes KEPs, which are richer than Rust's and clearer than Python's):
- `provisional` — open PR, under discussion
- `accepted` — PR merged, design agreed
- `implementable` — accepted and ready for runtime/provider work
- `implemented` — runtime and at least one provider ship it
- `final` — promoted into the normative spec; immutable
- `deferred` — paused, may resume
- `rejected` — declined
- `withdrawn` — author withdrew
- `superseded` — replaced by a later MEP (carries `superseded-by: MEP-NNNN`)

Numbering: the **PR number at merge time**, four-digit zero-padded (`MEP-0017`). Matches Rust/OTel; avoids the race condition that monotonic-ID schemes create.

Review: GitHub PR. Minimum **2 maintainer approvals** during incubation (raises to 4, OTel-style, when the maintainer pool is >4). FCP of 7 calendar days before merge once approvals land.

**2. ADRs (Architecture Decision Records)** — Nygard format, immutable, repository-internal. Used to record decisions already made about *this repo's* architecture (license choice, layout, naming convention, etc.), not changes to the public spec.

Location: `docs/decisions/`.
Template: Title, Status, Date, Doctrines invoked, Context, Research, Decision, Consequences, Sources.
Numbering: monotonic (`0001-`, `0002-`, …). Acceptable here because ADRs are written sequentially by a small group, not by PR contributors racing for IDs.

**Hard rule:** Spec changes go through MEPs. Repo-architecture decisions go in ADRs. The two systems do not overlap.

## Consequences

- Public contributors can propose spec changes via a clear, comparable-class process the moment Mosvera goes public. The MEP template is recognizable to anyone familiar with OTel, Rust, or Kubernetes.
- During incubation (solo author), MEPs are over-engineering for most internal changes — that's why ADRs exist for repo-level decisions. The MEP machinery sits ready but doesn't add ceremony to day-zero work.
- The rich state machine (provisional → implementable → implemented → final) creates a natural staging area for ideas that aren't ready to bind the spec, mirroring Kubernetes' alpha/beta/stable graduation in a spec-first context.
- Numbering by PR ID means there is no canonical numbering until merge — discussion PRs are referenced by descriptive slug (`teps/inheritance-resolution.md`) until they land.
- When repos eventually split (per ADR-0002), `spec/meps/` moves to the `/spec` repo unchanged. Path stability is preserved.

## Sources

1. [Rust RFC 0002 — RFC Process](https://rust-lang.github.io/rfcs/0002-rfc-process.html) — Defined the canonical "open a PR against a template, FCP, merge to mark active" loop that Mosvera's MEP review mirrors.
2. [OpenTelemetry OTEPs — Template](https://github.com/open-telemetry/oteps/blob/main/0000-template.md) — Source of the seven-section template Mosvera adopts verbatim (Motivation through Future possibilities).
3. [OpenTelemetry OTEPs — Process README](https://github.com/open-telemetry/opentelemetry-specification/blob/main/oteps/README.md) — Confirmed the OTEP process borrows from Rust RFCs and Kubernetes KEPs, validating the lineage Mosvera is plugging into.
4. [Kubernetes Enhancement Proposals](https://www.kubernetes.dev/resources/keps/) — Source of the richer lifecycle states (provisional / implementable / implemented / deferred / rejected / withdrawn / replaced) Mosvera adopts in place of Rust's simpler active/complete/inactive.
5. [PEP 1 — PEP Purpose and Guidelines](https://peps.python.org/pep-0001/) — Showed the most granular state machine in the comparable class; informed which states Mosvera kept (final, superseded) and which it dropped (active, provisional-as-distinct-from-accepted).
6. [Martin Fowler — Architecture Decision Record](https://martinfowler.com/bliki/ArchitectureDecisionRecord.html) — Anchored ADRs as the immutable, retrospective decision-log artifact, distinct from forward-looking MEPs.
7. [Joel Parker Henderson — Nygard ADR Template](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-michael-nygard/index.md) — Canonical Nygard template (Status/Context/Decision/Consequences) that the ADR side of this two-document system follows.
