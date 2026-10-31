# M06 — HeroID 6 Skin Fullart Expansion

## Scope and Authority

This record tracks the independent M06-A through M06-E gates for SkinIDs 602–606. User-facing skin names, numeric ID labels, release information, acquisition information, and prices are out of scope. The Legacy repository is read-only.

Target Main was confirmed at `b32cbf669e30afb4c2b390a56707ed652f29a57b` when work began. Legacy Main was confirmed at `57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff`; its ConfigData snapshot is `6475e63ee23d18adf733756c26a14fa9e3ed662c`. The original workspace has no local Target checkout, so its branch and working-tree state are `UNKNOWN`. Work is prepared in an isolated temporary Target clone based on the confirmed Main commit.

## M06-A — Source Discovery

Identity and explicit Hero membership were checked against the pinned `ConfigDataHeroSkinInfo.json` and `ConfigDataHeroInfo.json` records. HeroID 6's `Skins_ID[]` explicitly contains the five SkinIDs at zero-based positions 1–5, hence one-based Source Orders 2–6. This is the source array order, not release order. The skin records independently specify `SpecifiedHero = 6`.

| SkinID | HeroID | Source Order | Frozen Spine Prefab Locator | Existing Legacy Fullart |
|---:|---:|---:|---|---|
| 602 | 6 | 2 | `Spine/Char/Leon_ABS/Leon_Skin2_Prefab.prefab` | 1195×1600, SHA-256 `6bada0ead22ef77345b4d70d6dcd61b0859346af4992a670f0d44ff5211e96c8` |
| 603 | 6 | 3 | `Spine/Char/Leon_ABS/Leon_Skin3_Prefab.prefab` | 1241×1600, SHA-256 `f332a8f40e6b18b7dca6f58d82da7f4f9aa136420695afab2f0ee59debb37eb5` |
| 604 | 6 | 4 | `Spine/Char/Leon_ABS/Leon_Skin04_Prefab.prefab` | 1296×1600, SHA-256 `88272ddd4e8728a251db143058514d8f51071ffd830f4bdba288c62d7f880689` |
| 605 | 6 | 5 | `Spine/Char/Leon_ABS/Leon_Skin5_Prefab.prefab` | 576×1600, SHA-256 `1a6d17329535c34d8e70bc1a988c669e32898643049435dbe2b5f079122b02e3` |
| 606 | 6 | 6 | `Spine/Char/Leon_ABS/Leon_Skin06_Prefab.prefab` | 1271×1600, SHA-256 `60fc6cb6b5e090ee94603b5ce140d24ede4487c493a7654665beb785893cd9b7` |

The Legacy Fullart Reference identifies the official Unity client Asset Source as installer 1.1.113 and bundle `spine_char_leon_abs.b` (11,877,076 bytes; SHA-256 `3fde9e1d477bfb8c7426e11036a7432f213237ef36944706948789a2e1c717da`). The per-Skin reference records report successful fullart rendering with `idle_Normal @ 0`; SkinID 604's record includes the previously validated uniform Atlas scale adjustment. These are reused Legacy results. This Target work does not claim to have independently reacquired the Unity bundle or rerun Unity Prefab/dependency resolution.

## M06-B — Semantic Admission

The new Canonical and claim-specific evidence files are separate from the frozen M01/M02 records and M05-C admission. They pin the source repositories, commits, artifacts, records, fields, array positions, and cross-checks. The admission registry references the new M06 Validator. M05-G's deterministic internal composition now contains the existing frozen four, M05-C SkinID 601, and these five new Semantic admissions. The public projections remain unchanged at the existing five approved Skin records; Semantic Admission alone grants no Asset or Publication status.

The M05-C frozen Validator and M01/M02 frozen Canonical files are unchanged. M05-G and M05-E compatibility checks retain their historic baseline assertions while accepting subsequently approved additions. M05-D's Asset Validator is unchanged in this Semantic unit.

### Validation

The following have passed in the isolated Target clone:

- M05-G generation and deterministic projection check
- M05-G composition and approval-intersection Validator and negative tests
- M06 Semantic Validator and 12 negative controls
- M05-E publication baseline Validator and negative tests

At the M06-B checkpoint, M06-C, M06-D, and M06-E remained pending. That checkpoint did not assert that later M06 work had been integrated or published.

## M06-B Main Integration Checkpoint

PR #162 (`codex/m06-hero6-semantic-602-606`) was merged by squash after its final head `4f11d32cbd3ca32447563aa28c7b3c4572548b53` passed the Required `validate` job and Browser Smoke. The Main merge commit is `fafa3970e2c019c613e8354e1ba28f575fcc90bd`. Main CI run `41062980962` (`push`, `main`, that exact SHA) completed with Required `validate` success. Pages Build also succeeded for this SHA; the deployment run was still in progress at the time this M06-C branch was prepared and remains a separate M06-E check.

## M06-C — Asset Admission Candidate

The five existing Legacy WebP files were fetched from their pinned raw paths and independently checked against the pinned Legacy file Git blob IDs, the fullart reference manifest, and its validation record. Actual SHA-256, WebP decode, dimensions, RGBA alpha, and transparent-pixel counts were checked. The decoded files were also visually inspected: full-body illustration, no card frame, transparent background, and no apparent body crop. These are reused rendered outputs; this work did not regenerate them or independently repeat Unity bundle extraction, Prefab resolution, or dependency acquisition.

| SkinID | Bytes | Dimensions | Transparent pixels | SHA-256 |
|---:|---:|---:|---:|---|
| 602 | 232,916 | 1195×1600 | 1,239,912 | `6bada0ead22ef77345b4d70d6dcd61b0859346af4992a670f0d44ff5211e96c8` |
| 603 | 207,196 | 1241×1600 | 1,318,323 | `f332a8f40e6b18b7dca6f58d82da7f4f9aa136420695afab2f0ee59debb37eb5` |
| 604 | 322,998 | 1296×1600 | 1,129,971 | `88272ddd4e8728a251db143058514d8f51071ffd830f4bdba288c62d7f880689` |
| 605 | 110,520 | 576×1600 | 538,435 | `1a6d17329535c34d8e70bc1a988c669e32898643049435dbe2b5f079122b02e3` |
| 606 | 324,268 | 1271×1600 | 927,874 | `60fc6cb6b5e090ee94603b5ce140d24ede4487c493a7654665beb785893cd9b7` |

The Target Asset Registry and private Asset Evidence candidate register these at `assets/skin-admissions/m06/skin-{id}.webp`. M05-D's validator retains its exact SkinID 601 checks and now allows separately validated approved rows. M06's validator and negative controls check binary integrity, per-Skin source links, Semantic admission, and Registry parity. At this stage, none of the five M06 Assets has Publication Approval; the public Consumer, URL map, and Build remain at five records/files.

Local M06-C validation passed: M05-D and M06 Asset Validators/negative tests; M05-G and M06 Semantic validators/negative tests; M05-E baseline validator/negative tests; Build and publication regression. The Asset changes are a separate branch from M06-B and require their own PR CI, Main integration, and Main Required CI before M06-E.

## M06-C — Main Integration Checkpoint

PR #163 was merged by squash after the corrected exact PR Head `ada6cbb3b8a7b6cd8e54e396afcb3b3ce5ad834a` passed Required `validate` and Browser Smoke. Main merge commit is `92d68bc70a00da7b973bcda9f37987fc2687467c`. Main CI run `41064085179` targeted that exact Main SHA and completed successfully. The M06 Asset Registry now contains ten approved private Asset records; no M06 Publication Approval was present at this checkpoint.

## M06-E — Publication Approval and HeroID 6 Fullart Projection

M06-E reuses the existing M06 Semantic and Asset Admissions. It adds explicit Publication Approval records for SkinIDs 602–606 to `canonical/skin-publication-approvals-m05-g.v1.json`, each pointing to its exact approved M06 Semantic Admission, Asset Registry row, and `assets/skin-admissions/m06/skin-<id>.webp` path. No Asset path or image bytes are changed. The existing publication path contract already accepts this constrained `skin-admissions/m06` path, and Build derives its public file set only from the generated approved URL projection; no broad directory scan or per-ID Build rule was added.

M05-G generation now produces the expected public projection from the approval intersection: the existing four HeroID 1 rows, the existing HeroID 6 row, and five M06 HeroID 6 rows. HeroID 6 Source Order is 1–6; M04 URLs and bytes remain unchanged. The public Build contains the ten approved WebPs only. Canonical, Evidence, and Asset manifests remain private.

Added `tools/validate-skin-publication-m06-e.mjs` and `tools/test-skin-publication-m06-e.mjs`. The M06 validator checks the exact five Publication approvals, Semantic and Asset pointers, exact Manifest path/URL equality, verified file hashes, the preserved M04 URLs, and the 10-row public projection. Fourteen negative controls cover traversal, absolute and external URLs, wrong extensions, unapproved paths, cross-Skin mapping, incorrect Semantic/Asset pointers, missing owner record, missing/duplicate approval, wrong order, unapproved extra rows, unapproved Asset status, digest mismatch, and deterministic generation. CI runs both.

M04 presentation regression remains scoped to the four Frozen HeroID 1 rows. Its unmapped-Asset check now verifies that a Semantic row lacking a public URL stays hidden even when other approved HeroID 6 rows exist. The Browser Smoke harness derives HeroID 6 image paths and accessible sequence labels from the generated public Consumer and URL map, and checks each image decodes with `object-fit: contain` on desktop and mobile viewports. It also checks the existing four HeroID 1 images and user-facing no-name/no-ID policy.

Local validation passed: M05-G Generator and Validator/negative tests; M06 Semantic Validator/negative tests; M06 Asset Validator/negative tests; M05-D Asset Validator/negative tests; M05-E Publication Validator/negative tests; M04 Presentation Validator/negative tests; M06-E Publication Validator/14 negative cases; Build/publication regression. PR Head `bf241ba220f9e213af5db168d3946c76f7c4983e` passed Required `validate` in Run `41064811062` and Browser Smoke in Run `41064811046`. Browser Smoke exercised desktop 1440px and mobile 390px, checking all six HeroID 6 images in Source Order, WebP decoding, aspect-ratio containment, and the no-name/no-ID display boundary. M06-E-specific names are used for the Publication Validator and its tests. This PR grants Publication Approval for the five M06 Assets but does not merge to Main or deploy Pages.
