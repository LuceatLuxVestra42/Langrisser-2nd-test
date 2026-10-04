# Langrisser Hero first slice

This small static site renders the admitted Hero presentation slice for IDs 5, 6, and 8 with Korean Hero display labels, base portraits, explicit `HeroInfo` → `JobConnectionInfo` → `JobInfo` ID relations, admitted Korean Job display names, and admitted exclusive equipment.

The canonical Hero Korean localization owner admits 7 project-qualified display labels, broader than the rendered presentation slice. The generated consumer selects labels by exact Hero ID from this owner for the three Heroes admitted by `canonical/heroes.v1.json`; other localization records do not add presentation Heroes. Labels are project-qualified and official Korean-server provenance remains unverified. Rarity semantics remain unconfirmed and are not displayed. Job tree/order/recommendation semantics remain deferred.

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
- `canonical/hero-localizations-ko.v1.json` owns project-qualified Korean Hero display labels; its admitted target set is declared by the localization source manifest and checked against preserved direct ConfigData records and claim-scoped evidence. The owner currently contains 7 records and is broader than the rendered three-Hero slice. Official Korean-server provenance is unverified.
- The 267-entry localization name reference is presentation lookup material only; it does not define Hero population or a migration backlog.
- `generated/hero-slice.v1.json` is deterministic presentation data derived from the three-Hero canonical slice, admitted Hero Korean localization, admitted Job localization, and admitted exclusive equipment.
- The frontend displays only the generated Hero records, portrait assets, and admitted Hero/Job labels. It does not read raw source/evidence or infer new semantic relations.
- Korean Hero display names are rendered for the selected slice. Rarity and other unresolved semantics remain excluded.
