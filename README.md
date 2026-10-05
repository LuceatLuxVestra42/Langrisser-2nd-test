# Langrisser data slices

This static site renders an admitted Hero presentation slice for IDs 5, 6, and 8, SP Soldiers, a Korean Job glossary, and 206 General SSR Equipment records.

The General SSR Equipment population owner is `canonical/general-ssr-equipment.v1.json`; its separate Korean display/effect owner is `canonical/general-ssr-equipment-localizations-ko.v1.json`. The generated presentation consumer joins these owners by exact Equipment ID and contains only the ID, project-qualified Korean name, and admitted Korean effect description. This does not assert official Korean-server provenance. IDs 265, 266, 267, 268, 288, 289, 290, and 291 are shown as separate records; their possible alias/replacement meaning remains unresolved and is not represented in the presentation.

## Local checks

```sh
node tools/generate.mjs
node tools/validate.mjs
node tools/build.mjs
node tools/test-job-validation.mjs
node tools/test-job-localization-validation.mjs
node tools/test-sp-job-source-validation.mjs
node tools/test-sp-job-namespace-evidence.mjs
node tools/test-hero-semantic-canonicals.mjs
```

Generation deterministically writes presentation consumers from canonical owners. Validation detects stale generated consumers; build packages only generated consumers, page assets, and portrait assets. The frontend does not read canonical files, raw evidence, ConfigData, or Legacy files at runtime.

To view the page locally, serve the repository root with any static HTTP server and open `index.html`.

## Boundaries

- `evidence/` preserves source and claim-scoped provenance. It is not canonical data or a production runtime dependency.
- `canonical/heroes.v1.json` owns the current three-Hero presentation slice; `canonical/hero-identities.v1.json` and `canonical/hero-job-relations.v1.json` own broader semantic responsibilities.
- `canonical/hero-localizations-ko.v1.json` owns project-qualified Korean Hero display labels. Official Korean-server provenance is unverified; the reference list does not define Hero population or a migration backlog.
- `canonical/general-ssr-equipment.v1.json` owns the 206-record General SSR Equipment population; `canonical/general-ssr-equipment-localizations-ko.v1.json` owns its Korean display names and effect descriptions.
- `generated/general-ssr-equipment.v1.json` is deterministic ID-joined presentation data, ordered by numeric Equipment ID for display only. It adds no Equipment type, category, slot, alias, replacement, Hero relation, or structured mechanics.
- The page displays each admitted General SSR Equipment ID independently. It does not resolve the eight manual-review IDs as aliases or replacements.
- Korean localization is project-qualified; official Korean-server provenance is unverified.
