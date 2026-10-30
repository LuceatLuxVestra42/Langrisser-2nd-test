# M04-B — Skin Fullart Frontend Integration

## Decision

The existing Hero card for HeroID 1 consumes the M03 Generated Skin consumer and displays the four admitted transparent Fullart WebP assets in the consumer's `sourceOrder`. The interface displays no Skin names, SkinID values, release data, acquisition information, or Asset provenance. The only accessible image descriptions are generic sequence labels.

The internal Asset Manifest remains private. The Build publishes only the four approved WebP files and a small presentation module that maps the four admitted IDs to their public asset paths. The Build checks each published asset's bytes against the SHA-256 recorded in the private Manifest. The Frontend obtains Hero ownership and source order only from `generated/skin-consumer.v1.json`.

The image layout uses `object-fit: contain`, preserves transparency, and reports a failed image request without substituting another asset. No Skin section is rendered for other Heroes. The UI does not claim that these four images are the complete game population or that source order represents release chronology.

## Fixed integration inputs

| Input | Ref | SHA |
|---|---|---|
| Target Main base | `main` | `0b2949cd7ec2526e4c576095c2f632d5e81f2bd3` |
| PR #155 | `codex/m04-skin-consumer-build` | `faef398e7fc156a34b9f6171c9025b7c6582ac31` |
| PR #156 | `codex/m04-skin-fullart-assets` | `9eecca42996d3486c372e115cd608b5a35712885` |
| Application order | #155, then #156 | — |
| Combined integration head | `codex/m04b-integration-exact` | `f1f32a9853a82041693e7b08917fca3e7eb3b638` |

The combined head is formed by merging the exact PR head commits in the listed order. M04-B is built on this isolated integration branch. A change to either predecessor head requires a new integration head and rerunning the affected Build, asset, semantic, and Browser checks. This integration result is not a Main merge.

## Expected changed paths

- `.github/workflows/ci.yml`
- `.github/workflows/browser-qa.yml`
- `app.js`
- `index.html`
- `skin-fullart-presentation.mjs`
- `styles.css`
- `tools/build.mjs`
- `tools/test-build.mjs`
- `tools/test-browser-smoke.mjs`
- `tools/validate-skin-fullart-presentation-m04.mjs`
- `tools/test-skin-fullart-presentation-m04.mjs`
- `tools/test-hero-soldier-navigation.mjs` (existing regression harness updated to pass an empty Skin map)
- `tools/test-soldier-search-presentation.mjs` (existing regression harness updated to pass an empty Skin map)
- `tools/test-exclusive-equipment-presentation.mjs` (existing Hero card harness updated to pass an empty Skin map)
- `docs/migrations/m04b-skin-fullart-frontend.md`

## Validation record

The M01 identity, M02 relation and source-order, M03 consumer, and PR #156 Asset validators and negative tests pass against the fixed integration tree. The M04-B consumer/asset presentation validator and its 18 failure controls pass. The static Build publishes 46 files, including the four approved WebPs and the M03 JSON; it excludes `evidence/` and verifies the asset byte digests. Build/publication negatives and cache-key validation pass. The broader Hero validator passes. PR CI exposed fixture-isolation dependencies in existing Hero→Soldier navigation, Soldier search, and Hero Equipment presentation tests; those harnesses now supply an empty Skin map. All three pass locally.

The extended Chromium Browser Smoke checks the four decoded images at desktop and mobile viewports, Hero isolation, sequence labels, no horizontal overflow, and absence of Skin names or IDs in the visible Skin section. Its first hosted run found that the QA static server did not assign a JavaScript MIME type to `.mjs`; the harness now serves `.mjs` as JavaScript. The exact-head Browser QA rerun is pending. Local Chromium is unavailable in the current environment.

## Status and continuation

Status before CI: `M04_B_PUBLICATION_COMPLETE` is locally verified. Frontend Preflight and UI contract checks pass; `M04_B_UI_COMPLETE` and `M04_B_BRANCH_COMPLETE` await the exact-head Browser QA and PR CI. PR #155 and #156 remain open and unmodified. No Main merge or deployment is performed here.

This dependent PR targets `codex/m04b-integration-exact`. Merge #155 and #156 through their own reviews first; then retarget or rebase this work against the resulting Main and rerun checks for the final combined Main head. Main Pages and Hosted Browser QA remain a later gate.
