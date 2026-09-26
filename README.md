# Langrisser Hero first slice

This small static site exercises the admitted Hero slice for IDs 5, 6, and 8: source identity, `Name_Eng`, base portrait provenance, and the explicit `HeroInfo` → `JobConnectionInfo` → `JobInfo` ID relation. KR display names, KR Job names, rarity, and Job tree/order/recommendation semantics remain deferred.

The identity scope is limited to the explicitly selected `ConfigDataHeroInfo` records with IDs 5, 6, and 8. Their presence does not establish that all records in `ConfigDataHeroInfo` belong to a playable or public Hero population.

## Local checks

```sh
node tools/validate.mjs
node tools/build.mjs
node tools/test-job-validation.mjs
```

`validate` and `build` are read-only with respect to tracked repository files. After changing canonical data, run `node tools/generate.mjs` explicitly, then rerun validation and build. Validation detects a stale generated consumer; build never repairs it.

To view the page locally, serve the repository root with any static HTTP server and open `index.html`. The page reads only `generated/hero-slice.v1.json`; it does not load ConfigData or Legacy files.

## Boundaries

- `evidence/source/` preserves the three Hero rows, selected JobConnection and JobInfo rows, relation interpretation provenance, and portrait chain. Evidence is not canonical data and is not a production runtime dependency.
- `canonical/heroes.v1.json` contains Hero ID, English name, portrait reference, selected explicit Job connection/Job IDs, and claim locators.
- `generated/hero-slice.v1.json` is deterministic presentation data derived from canonical.
- The frontend displays the generated Hero records, portrait assets, and source-identified `connectionId → jobId` pairs only. It does not assign job names or path/order meaning.
- Korean display names, rarity, and other unresolved semantics are excluded.
