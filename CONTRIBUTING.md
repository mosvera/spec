<!--
SPDX-License-Identifier: CC-BY-4.0
-->

# Contributing to Mosvera

Thanks for your interest. Mosvera is in Phase 6 public-unlock
preparation: the core surfaces are implemented, but the project is
still careful about freezing abstractions before external feedback has
tested them. Contributions are welcome.

Before contributing, please read:

- [`CLAUDE.md`](./CLAUDE.md) — the project's operating doctrines
- [`MANIFESTO.md`](./MANIFESTO.md) — the conceptual frame
- [`GOVERNANCE.md`](./GOVERNANCE.md) — how decisions get made
- [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) — Contributor
  Covenant v2.1

## How to contribute

### Open an issue first

For anything beyond a typo fix, open an issue describing the
problem or proposal before writing code. This avoids wasted work
on changes that conflict with the project's direction (see
[`ROADMAP.md`](./ROADMAP.md) and the
[ADRs](./docs/decisions/)).

### Use the right artifact type

Mosvera has two distinct documentation artifacts. Pick the one
that fits what you are proposing:

| You want to… | Use |
|--------------|-----|
| Propose a change to the public specification (new primitive, new modifier behavior, new compilation rule) | [MEP](./meps/) — Mosvera Enhancement Proposal |
| Propose a change to repo architecture, governance, license, layout, or naming | [ADR](./docs/decisions/) — Architecture Decision Record |
| Fix a bug, write a test, improve documentation, add an example | Pull request |
| Discuss a half-formed idea | GitHub issue or discussion |

The full distinction between MEPs and ADRs is in
[ADR-0003](./docs/decisions/0003-rfc-and-proposal-format.md).

### Sign your commits (DCO)

Mosvera uses the
[Developer Certificate of Origin (DCO)](https://developercertificate.org/),
not a Contributor License Agreement. Every commit must be signed
off with `git commit -s`, which appends a `Signed-off-by` trailer
attesting that you have the right to submit your contribution
under the project's license.

```bash
git commit -s -m "Your commit message"
```

A pre-merge check will reject unsigned commits.

### Follow the doctrines

Mosvera operates under six [Primary Doctrines](./CLAUDE.md#primary-doctrines).
The two most likely to affect contributions:

- **Doctrine 1 (Public-first).** Mosvera is built for strangers. No
  internal naming, no references to private platforms or in-jokes,
  no examples drawn from contributors' private context.
- **Doctrine 5 (Research-first).** For any non-trivial design or
  architecture decision, look up what comparable projects do and
  cite the sources in your ADR or MEP. At least three authoritative
  sources is the floor.

## Development workflow

### Branching

- `main` is the integration branch.
- Open a topic branch for your work: `feat/short-description`,
  `fix/short-description`, `mep/short-description`, etc.

### Pull requests

- Each PR should be focused on one change. Unrelated cleanup goes
  in a separate PR.
- The PR description should link to the issue or ADR/MEP it
  addresses.
- All commits must be DCO-signed.
- Tests are required for runtime behavior changes.
- Documentation updates that pertain to the change ride along in
  the same PR.

### Review

During the single-maintainer phase, the maintainer reviews all PRs in
public. As the maintainer pool grows, reviewer expectations will firm
up via [ADR](./docs/decisions/) updates to GOVERNANCE.md.

## Coding conventions

### Schemas and wire format

Schema field names use `snake_case` per
[ADR-0005](./docs/decisions/0005-schema-naming-conventions.md).
`$`-prefixed keys are reserved for spec directives. The conventions
are enforced by the validator and the linter.

### Runtime code

Where the conventions of the runtime's host language conflict with
the wire format, the runtime uses idiomatic accessors and bridges
them to the wire format internally — the wire format is the
contract. This split is explicit and documented in ADR-0005.

For TypeScript (the reference runtime), follow the existing code
style. ESLint and Prettier configurations live in `runtime/`.

### Commits

- Imperative present tense for the subject line ("Add modifier
  merge rule" not "Added modifier merge rule").
- Subject line under 72 characters; body wrapped at 72.
- The body explains *why*, not *what* — the diff shows what.
- Include `Signed-off-by:` (added by `git commit -s`).

### Style of writing

Mosvera's prose targets infrastructure clarity. Aim for the tone of
OpenTelemetry, GraphQL, or CloudEvents documentation: precise,
neutral, unhyped. Avoid marketing voice in any committed file.

## Reporting bugs and security issues

- **Bugs**: open a GitHub issue with a minimal reproduction.
- **Security issues**: see [`SECURITY.md`](./SECURITY.md) for the
  private disclosure process. Do not file security issues as
  public GitHub issues.

## Where to ask questions

GitHub Discussions is the preferred public venue once enabled. Specific
questions about MEP review or ADR scope can be raised on the relevant
PR or issue.

## License

By contributing to Mosvera, you agree that your contributions are
licensed under the project's licenses (Apache-2.0 for code and
schemas; CC-BY-4.0 for documentation and specification prose) as
documented in [`LICENSE`](./LICENSE) and the
[`LICENSES/`](./LICENSES/) directory. See
[ADR-0001](./docs/decisions/0001-license-choice.md) for the
licensing rationale.
