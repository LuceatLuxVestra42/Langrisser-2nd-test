# Langrisser Hero first slice

This small static site exercises the admitted Hero presentation slice for IDs 5, 6, and 8: source identity, `Name_Eng`, base portrait provenance, explicit `HeroInfo` → `JobConnectionInfo` → `JobInfo` ID relations, and admitted Korean Job display names for those rendered relations.

Korean Hero display localization is admitted for IDs 5, 6, and 8, but rendering those labels remains deferred in this slice. Rarity and Job tree/order/recommendation semantics remain deferred.

The rendered Hero slice is limited to the explicitly selected `ConfigDataHeroInfo` records with IDs 5, 6, and 8. Their presence does not establish that all records in `ConfigDataHeroInfo` belong to a playable or public Hero population.

The repository also contains broader evidence-backed semantic owners for Hero identity and Hero→Job relations. Those owners are independent of whether a Hero is currently included in the three-Hero presentation slice.

## Local checks

```sh
node tools/validate.mjs
node tools/build.mjs
node tools/test-job-validation.mjs
node tools/test-job-localization-validation.mjs
node tools/test-sp-job-source-validation.mjs
node tools/test-sp-job-namespace-evidence.mjs
node tools/test-hero-semantic-canonicals.mjs
```

`validate` and `build` are read-only with respect to tracked repository files. After changing canonical presentation inputs, run `node tools/generate.mjs` explicitly, then rerun validation and build. Validation detects a stale generated consumer; build never repairs it.

To view the page locally, serve the repository root with any static HTTP server and open `index.html`. The page reads only `generated/hero-slice.v1.json`; it does not load ConfigData, evidence files, or Legacy files at runtime.

## Boundaries

- `evidence/` preserves source/localization material and claim-scoped provenance used by the current admitted slices. Evidence is not canonical data and is not a production runtime dependency.
- `canonical/heroes.v1.json` owns the current three-Hero presentation slice inputs: Hero ID, English name, portrait reference, selected explicit Job connection/Job IDs, and claim locators.
- `canonical/hero-identities.v1.json` owns the current evidence-backed Hero identity union within its stated scope.
- `canonical/hero-job-relations.v1.json` owns the current evidence-backed Hero→Job relation union within its stated scope.
- `canonical/job-localizations-ko.v1.json` contains admitted Korean Job display labels; status-only or otherwise unadmitted localization values remain excluded.
- `canonical/hero-localizations-ko.v1.json` contains project-qualified Korean Hero display labels for IDs 5, 6, and 8; official Korean-server provenance is unverified.
- `generated/hero-slice.v1.json` is deterministic presentation data derived from the three-Hero canonical slice plus admitted Job localization.
- The frontend displays only the generated Hero records, portrait assets, and admitted Job labels. It does not read raw source/evidence or infer new semantic relations.
- Korean Hero display names, rarity, and other unresolved semantics remain excluded from the rendered slice.
