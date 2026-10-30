# M05-E — Skin 601 Publication Approval and Hero Fullart

## Scope

M05-E reuses the M05-C Semantic Admission and M05-D Asset Admission for Skin 601. It adds a separate Publication Approval and connects that approved row through the existing M05-G Generated projections, static Build, and generic Hero presentation. It does not change Skin Semantic, Asset bytes or provenance, localization, names, or the M04 Asset files.

## Predecessor integration

PR #160 was reviewed at Base `9d549ff33811a51df5d0a1b21cb399a6ae36502e`, Head `5bbffba8bb8859b826a38da8114ed19975101564`, with nine expected changed paths and successful `validate` and Browser Smoke checks. It was squash-merged as `8c8fb2cddcf773354a18742e962703d882a0eb42`. Required Main CI Run `41051611539` passed on that exact Main commit. On the same commit, local M05-C, M05-G, M04, M05-D, Build, and publication boundary checks passed before M05-E changes began.

## Path contract

M05-D's asset remains at `assets/skin-admissions/m05-d/skin-601.webp`; it is not moved or copied. The shared `skin-asset-publication-contract.mjs` accepts only WebP paths rooted at `assets/skins/` or at one direct, slug-named `assets/skin-admissions/<scope>/` directory. URL paths must use the relative `./` form. Traversal, absolute paths, external URLs, arbitrary roots, nested private directories, and non-WebP extensions are rejected.

Build does not scan Asset directories. It copies only unique paths from the generated public Asset URL map, which is produced from Semantic ∩ Asset ∩ Publication approvals. The mapped URL must equal the admitted Asset Manifest's exact output path, and existing M05-G validation verifies the corresponding file digest. The shared URL contract is included in the static artifact because the presentation helper imports it at runtime.

## Publication decision

`canonical/skin-publication-approvals-m05-g.v1.json` retains existing approvals and URLs for SkinIDs 102–105. It adds a separate Skin 601 approval with references to `M05-C-SKIN-601`, the M05-G Asset Registry record, and this migration record. The approved URL is `./assets/skin-admissions/m05-d/skin-601.webp`.

M05-G generation then produces five public Consumer rows and five public Asset URL rows. HeroID 1 retains the original four tuples and URLs. HeroID 6 receives Skin 601 at Source Order 1. The general Hero UI uses these generated artifacts and the existing generic presentation function; no SkinID or HeroID is added to common Frontend or Build code.

Names, user-facing SkinID values, release status, acquisition information, and price remain absent from the UI. Accessibility text is a generic sequence label. Internal Evidence and Unity source files remain outside the Build.

## Validation ownership

- M05-C continues to own Semantic Admission and the internal Consumer.
- M05-D continues to own the 601 Asset bytes, digest, dimensions, alpha, provenance, and Asset Registry record.
- M05-G continues to own composition, approval intersection, generated outputs, exact path parity, and deterministic generation.
- The M04 presentation regression continues to assert the four existing Hero 1 records and image bytes. The M05-E Validator separately verifies the Hero 6 publication row and its exact Asset path.
- Build regression verifies all five approved image files are packaged from their approved paths; unapproved paths and internal Evidence are excluded.
- Browser Smoke covers desktop 1440px and mobile 390px for Hero 1's four images, Hero 6's one image, generic sequence labels, image decoding, aspect ratio, no name/ID text, and no other-Hero Skin sections.

## M05-E expected changed paths

- `.github/workflows/ci.yml`
- `canonical/skin-publication-approvals-m05-g.v1.json`
- `generated/skin-consumer-public-m05-g.v1.json`
- `generated/skin-assets-public-m05-g.v1.json`
- `skin-asset-publication-contract.mjs`
- `skin-fullart-presentation.mjs`
- `tools/build.mjs`
- `tools/generate-skin-m05-g.mjs`
- `tools/validate-skin-m05-g.mjs`
- `tools/test-build.mjs`
- `tools/test-skin-m05-g.mjs`
- `tools/validate-skin-fullart-m05-d.py`
- `tools/test-skin-fullart-m05-d.py`
- `tools/validate-skin-fullart-presentation-m04.mjs`
- `tools/test-skin-fullart-presentation-m04.mjs`
- `tools/test-browser-smoke.mjs`
- `tools/validate-skin-publication-m05-e.mjs`
- `tools/test-skin-publication-m05-e.mjs`
- `docs/migrations/m05-e-skin601-publication.md`
- `docs/migrations/m05-g-skin-dynamic-expansion.md`

Main integration and Pages deployment are outside this branch task. M05-I's previously unverified Hosted Mobile and cache-transition QA remain separate and are not represented as completed here.
