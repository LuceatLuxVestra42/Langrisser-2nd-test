# M05-G — Skin Dynamic Expansion

## Decision and scope

M05-G adds a data-driven path for composing explicitly approved Skin admissions, admitted Fullart assets, and separate publication approvals. M01 and M02 frozen Canonicals, their validators, the M03 four-record Consumer, the M04 Asset Manifest, and the M04 user-facing policy remain fixed.

The integration base is PR #158 Head `5d77262f8b19ffbc4997d65d7c6d225087353771`, based on Target `main` `d9b880511edca2427373c77b571c2eaf4ecbfeeb`. PR #158 was OPEN at integration start and remains a separate, unmerged dependency. The M05-G branch is based directly on that exact PR Head; the M05-G PR targets `codex/m05-c-skin-601-semantic-admission` so its diff contains only M05-G paths.

## Owners and outputs

- `canonical/skin-admission-registry-m05-g.v1.json` explicitly lists admissions eligible for internal composition. Registry membership alone is not admission; claim Canonicals, A/B Evidence, and the Admission Owner validator are checked.
- `tools/generate-skin-m05-g.mjs` deterministically composes the frozen M01/M02 rows and registered approved admissions. It emits an internal five-row Consumer and separate public Consumer and public Asset URL projections.
- `canonical/skin-asset-registry-m05-g.v1.json` points to each admitted Asset Evidence record and its Owner validator. M04's four-record validator and source manifest remain frozen.
- `canonical/skin-publication-approvals-m05-g.v1.json` records Publication approval independently. Public rows are the intersection of Semantic, Asset, and Publication approvals. SkinID 601 remains internal because no Asset or Publication approval exists for it.
- `tools/validate-skin-m05-g.mjs` independently reads each owner, checks claim pointers and A/B classes, per-Hero Source Order uniqueness, Asset bytes and digests, and exact generated parity.
- `tools/build.mjs` publishes only URLs in the generated approved public mapping, verifies their source hashes, and rejects unlisted public files. It does not scan the Asset directory to decide what to publish.
- `skin-fullart-presentation.mjs` filters by the generated `heroId`, retains `sourceOrder`, and omits rows without a published Asset URL. No Skin name or SkinID is rendered.
- `tools/classify-skin-source-diff-m05-g.mjs` produces read-only new, changed, missing, unverifiable, and snapshot-change classifications. It does not update Canonical, Generated, Asset, or Publication files.

## Frozen and current populations

| Population | Records | Meaning |
|---|---:|---|
| M01/M02 frozen Semantic | 4 | SkinIDs 102–105; unchanged |
| Registered new Semantic | 1 | SkinID 601 from PR #158; internal composition only |
| Internal composed Consumer | 5 | 102–105 plus 601 |
| Asset admitted | 4 | M04 Fullart 102–105 |
| Publication approved | 4 | M04 publication approval 102–105 |
| Public Consumer / URL map | 4 | Semantic ∩ Asset ∩ Publication |
| Visible M04 population | 4 | Existing Hero UI behavior; 601 has no Asset or Publication approval |

Source Order uniqueness is enforced per Hero, so Hero 1 and Hero 6 may each have Source Order 1.

## Validation and boundaries

M05-C remains the Owner for SkinID 601 Claim Evidence and is run independently. M01/M02/M03 and M04 Asset checks remain unchanged. M05-G tests composition, deterministic output, approval intersection, digest parity, publication exclusion, generic Hero presentation, and read-only Source Snapshot classification. The public Build still excludes internal Evidence and Canonical files.

The Browser QA workflow now includes the exact M05-C dependent base branch and checks that the two new public projections load while the four approved M04 images remain visible. A local Browser run could not start because this environment has no Playwright Chromium binary; the attempted browser download returned an invalid empty archive. The PR Browser QA run is therefore required before declaring branch completion.

## Integration baseline and state

- Target main at start: `d9b880511edca2427373c77b571c2eaf4ecbfeeb`
- PR #158 Head / M05-G base: `5d77262f8b19ffbc4997d65d7c6d225087353771`
- Branch: `codex/m05-g-skin-dynamic-expansion`
- Merge and deployment: not performed
- Branch completion: pending exact-head CI and Browser QA

## Expected changed paths

The approved M05-G diff is limited to:

- `.github/workflows/browser-qa.yml`
- `.github/workflows/ci.yml`
- `app.js`
- `canonical/skin-admission-registry-m05-g.v1.json`
- `canonical/skin-asset-registry-m05-g.v1.json`
- `canonical/skin-publication-approvals-m05-g.v1.json`
- `docs/migrations/m05-g-skin-dynamic-expansion.md`
- `generated/skin-assets-public-m05-g.v1.json`
- `generated/skin-consumer-composed-m05-g.v1.json`
- `generated/skin-consumer-public-m05-g.v1.json`
- `index.html`
- `skin-fullart-presentation.mjs`
- `tools/build.mjs`
- `tools/classify-skin-source-diff-m05-g.mjs`
- `tools/fixtures/skin-source-diff-m05-g.v1.json`
- `tools/generate-skin-m05-g.mjs`
- `tools/test-build.mjs`
- `tools/test-browser-smoke.mjs`
- `tools/test-skin-fullart-presentation-m04.mjs`
- `tools/test-skin-m05-g.mjs`
- `tools/test-skin-source-diff-m05-g.mjs`
- `tools/validate-skin-fullart-presentation-m04.mjs`
- `tools/validate-skin-m05-g.mjs`

No M01–M04 Canonical, Evidence, WebP, CSS, Pages workflow, or legacy Source path is changed.
