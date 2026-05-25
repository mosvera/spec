# ADR-0007: Reference Runtime Language

**Status:** Accepted
**Date:** 2026-05-24
**Doctrines invoked:** Public-first, Adoption-over-convenience, Comparable-class framing, Research-first

## Context

Mosvera will ship a reference runtime that parses schemas, resolves inheritance, merges modifiers, composes primitives, validates structures, and compiles provider outputs. The runtime is *not* the spec — the spec is language-agnostic — but the reference runtime sets a strong precedent for which audience is closest to the standard and which language ecosystem the early MCP server, validators, and provider adapters will live in.

The provisional pick was **TypeScript**, justified by: (a) MCP ecosystem is TS-native (Anthropic's reference SDK), (b) JSON Schema tooling is mature in TS, (c) AI-app-dev audience skews JS/TS. This ADR validates or revises that pick against how comparable open-standard projects sequenced their reference implementations.

## Research

**Comparable-class sequencing patterns:**

- **GraphQL (Facebook, 2015).** When Facebook open-sourced GraphQL to support Relay's launch, they released the spec *plus a single reference implementation in JavaScript* (`graphql-js`). Per the Engineering at Meta announcement, this was deliberate — the team needed to ship Relay, which was JS — and other languages (Ruby, Scala, Java, .NET, Python, Go) were built by the community over the following years. Single-language reference, audience-aligned.

- **OpenTelemetry (2019).** The CNCF announcement deliberately committed to *parity across five languages* (C#, Go, Java, Node.js, Python) by September 2019, only four months after the OpenTracing/OpenCensus merger announcement. The Java prototype landed April 2019. OTel chose multi-language-from-day-one because its predecessors had *already* shipped per-language SDKs and any single-language reference would have been a regression for existing users. This pattern only works when you inherit a multi-language userbase.

- **CloudEvents (CNCF, v1.0 2019).** Currently ships SDKs in nine languages (C#, Go, Java, JavaScript, PHP, PowerShell, Python, Ruby, Rust). Go was the first reference SDK (the `cloudevents/sdk-go` repository pre-dates the others), reflecting CNCF's Go-heavy ecosystem center of gravity. The other SDKs followed once spec v0.3/1.0 stabilized.

- **OpenAPI / Swagger.** Tony Tam built Swagger in 2010 with a Scala-based codegen toolchain, but the *specification* became language-agnostic and the ecosystem grew through Swagger Codegen / OpenAPI Generator, which now emits clients in 50+ languages. There was no "reference runtime" in the Mosvera sense — OpenAPI is descriptive metadata, not an executable runtime.

- **MCP (Anthropic, 2024–2026).** The TypeScript SDK is the reference implementation with the most active conformance work, with Python tracking close behind. Both SDKs together exceeded 97M monthly downloads by March 2026. The TS SDK shipped first, but the Python SDK has approached parity rapidly via FastMCP and v1.26. Stainless and others now compare TS, Python, and Go as roughly first-tier citizens, with Java/Kotlin/C#/Rust/Swift as official-but-secondary.

**MCP ecosystem in 2026, specifically:**

- 2,000+ community implementations in the official registry by Q1 2026; ~1,200 published on npm by Q2 2026.
- Python now has FastMCP 3.0 (January 2026) which "dramatically simplifies" server authoring; community sentiment increasingly treats Python as co-equal to TS for server-side work, especially for ML-adjacent teams.
- TS still wins for clients-in-the-browser and for IDE/editor MCP servers (VS Code, Cursor).
- Per the Stainless comparison, the practical answer in 2026 is "use whichever language your team and consumers are already in" — neither dominates.

**Audience analysis for Mosvera specifically.** Mosvera's target consumers split across two camps: AI-native application developers (TS/JS dominant), and ML researchers / generative pipeline builders (Python dominant). Provider SDKs (OpenAI, Anthropic, Black Forest Labs, Stability, Runway) all ship first-class Python *and* TS clients. There is no clean audience win for either language.

## Decision

**Ship the reference runtime in TypeScript first, with a documented commitment to a Python port no later than the second minor release of the runtime.**

Reasoning:

1. **MCP-native start.** The MCP TS SDK was the first published, has the most active conformance work, and powers the editor/client surface where Mosvera will land its first interactive demos. Starting in TS lets the reference MCP server share types with the runtime in one repo.
2. **Single-language reference matches the GraphQL pattern**, not the OpenTelemetry pattern. Mosvera is not inheriting a multi-language userbase; it is being born. GraphQL's "spec + one reference + community ports" sequence is the appropriate analog.
3. **JSON Schema + JSON-LD tooling parity is genuine but no longer one-sided** — `pydantic` v2 / `jsonschema` cover Python, `ajv` / `zod` cover TS. This argument has weakened since 2024 but still slightly favors TS.
4. **Python parity is required for credibility**, not optional. The ML/generative audience cannot be treated as second-class. The runtime architecture must be designed for portability (pure semantic logic separable from TS-idiomatic glue) so the Python port is a translation, not a rewrite. We will write a portability test suite *in JSON*, runnable against any conforming runtime, before the TS implementation freezes its API.
5. **Defer Go, Rust, Java, etc. to community contributions** post-1.0 — same pattern as GraphQL.

The provisional TS pick **survives research**, but with two binding constraints not in the original framing: (a) Python is committed-to, not optional; (b) the reference runtime must be architected for cross-language portability from day one via a JSON-defined conformance suite.

## Consequences

- The runtime repository must structure semantic logic (schema parser, inheritance resolver, composition engine, validator, compiler) as pure functions with TS-idiomatic but logic-portable code. No clever TS-only patterns in the semantic core.
- A `conformance/` directory of JSON test cases (input schema, expected resolved composition, expected compiled provider payload) must exist before the runtime reaches 1.0.
- The MCP server in the first release should be TS-native and live in the same monorepo as the runtime.
- We will publish a Python runtime port in parallel with or shortly after Mosvera 1.0; if we cannot fund this, we should narrow Mosvera's claim or recruit a maintainer before locking the spec.
- We will explicitly *not* claim multi-language SDKs in the README before they exist. Public-first doctrine: no aspirational marketing.

## Sources

1. [GraphQL: A data query language (Engineering at Meta, Sept 2015)](https://engineering.fb.com/2015/09/14/core-infra/graphql-a-data-query-language/) — historical record that Facebook released spec + JS reference together; ports came later from community.
2. [graphql/graphql-js (GitHub)](https://github.com/graphql/graphql-js) — the canonical "reference implementation in one language" precedent for an open-standard project.
3. [Announcing OpenTelemetry: the merger of OpenCensus and OpenTracing (May 2019)](https://opensource.googleblog.com/2019/05/opentelemetry-merger-of-opencensus-and.html) — confirms OTel committed to multi-language parity at launch because it inherited two existing multi-language userbases (a condition Mosvera does not share).
4. [MCP TypeScript SDK (GitHub)](https://github.com/modelcontextprotocol/typescript-sdk) and [MCP Python SDK (GitHub)](https://github.com/modelcontextprotocol/python-sdk) — confirm both are official, both are first-class, with TS as the original reference and Python at near-parity by 2026.
5. [MCP SDK Comparison: Python vs TypeScript vs Go (Stainless, 2026)](https://www.stainless.com/mcp/mcp-sdk-comparison-python-vs-typescript-vs-go-implementations/) — current ecosystem analysis: Python and TS roughly equivalent in 2026, choice should follow audience.
6. [MCP Ecosystem in 2026 — v1.27 release notes (Context Studios)](https://www.contextstudios.ai/blog/mcp-ecosystem-in-2026-what-the-v127-release-actually-tells-us) — current ecosystem signal: TS SDK v1.27 conformance leadership, Python v1.26 close behind, 97M monthly downloads aggregate.
7. [CloudEvents Go SDK (GitHub)](https://github.com/cloudevents/sdk-go) — the Go-first CNCF pattern, included for contrast: CloudEvents prioritized Go because its consumer base (Knative, Kubernetes events) was Go-dominant; Mosvera has no equivalent center of gravity in any language.
