# Agent Guidance

This repo is the canonical Mosvera contract: schemas, compliance vectors,
glossary, MEPs, strategy notes, guides, and contribution rules.

## Safety Rules

- Do not commit secrets, `.env*`, local config, vault references, generated
  media, caches, private notes, or local machine paths.
- Preserve unrelated user changes and keep edits narrow.
- Use DCO-signed commits when committing.
- Do not publish packages, rotate credentials, change repo visibility, or
  trigger releases unless explicitly asked.

## Repo Boundaries

- Put schema, compliance, glossary, MEP, and cross-runtime contract work here.
- Keep large example galleries, thumbnails, and generated pack collections in
  `mosvera/examples`, not this repo.
- Treat historical ADRs as records; add status notes instead of rewriting old
  decision context.

## Verification

- Run `npm run ci` for spec validation.
- Run `git diff --check` before committing.
