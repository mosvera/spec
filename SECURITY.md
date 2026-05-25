<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# Security Policy

Mosvera includes a TypeScript reference runtime, a stdio MCP server,
and in-tree provider adapters. This policy describes how to report
vulnerabilities and what response to expect.

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Once the public repositories are live, the preferred channel is GitHub's
[private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
mechanism on the affected repository. Until then, report through the
private channel used to receive access to the repository.

When you report, please include:

- A description of the vulnerability.
- The affected component (specification ambiguity, runtime,
  provider adapter, MCP server, etc.) and version or commit SHA.
- Steps to reproduce, ideally with a minimal proof-of-concept.
- Your assessment of impact and severity.
- Whether you intend to disclose publicly, and on what timeline.

## What to expect

- **Acknowledgment** within 5 business days of receiving the
  report.
- **Initial assessment** within 14 business days, including
  whether we accept the report as a vulnerability and the rough
  severity.
- **Fix or mitigation** on a timeline matched to severity. Critical
  vulnerabilities in the reference runtime or MCP server are
  prioritized over other work.
- **Disclosure coordination**. We prefer coordinated disclosure
  with a 90-day default window; severe vulnerabilities may warrant
  shorter or longer windows by mutual agreement.

We credit reporters by name in the corresponding advisory and the
`CHANGELOG.md` entry unless the reporter requests anonymity.

## Scope

In scope:

- Mosvera specification ambiguities that lead to security-relevant
  divergence between conforming runtimes.
- Vulnerabilities in the reference runtime, MCP server, and
  in-tree provider adapters under `providers/`.
- Schema validation bypasses that allow malformed compositions to
  reach the compiler.
- Provider adapter implementations that leak secrets or expose
  authentication material.

Out of scope:

- Vulnerabilities in third-party provider APIs (OpenAI, Black
  Forest Labs, etc.) — report those to the provider directly.
- Vulnerabilities in third-party language SDKs we depend on —
  report to the SDK upstream and notify us so we can pin or
  mitigate.
- Issues that require physical access to a contributor's machine,
  social engineering, or compromise of the contributor's GitHub
  account.
- Denial-of-service via expensive valid compositions (covered as a
  performance issue, not a security issue).

## Supported versions

Mosvera does not yet have a stable 1.0 release. Before 1.0, supported
versions are the latest published `0.x` packages and the default branch
of each public repository. Once the specification reaches 1.0, this
section will list supported specification and runtime versions and their
security-fix windows in alignment with the project's
[governance model](./GOVERNANCE.md).

## Hardening

The reference runtime and MCP server, when they ship, will follow
the security postures appropriate to their language and ecosystem
(strict input validation at the wire-format boundary, no
trust-by-default for inbound data, supply-chain pinning for
dependencies). Specific hardening practices will be documented per
component in the relevant `README.md`.

## Acknowledgements

This security policy is informed by the
[CNCF Security TAG vulnerability handling guidance](https://github.com/cncf/tag-security/blob/main/community/resources/security-disclosures/README.md)
and patterns established by comparable open-standard projects
(OpenTelemetry, CloudEvents). It will be revised against those
sources as Mosvera matures.
