# M04 — Skin Spine Fullart Asset Admission

## Scope

This migration admits one transparent Spine fullart WebP for each M01 Skin Identity 102–105. It does not change Skin Identity, ownership, source order, Generated Consumer semantics, Frontend, Build publication paths, or the M04-A work in PR #155.

The Asset Manifest references the existing generated/skin-consumer.v1.json only to check exact SkinID, HeroID, and Source Order parity. The M01–M03 Canonical owners remain the sole semantic authority. Unity client provenance is recorded separately from the historical ConfigData semantic snapshot.

## Source and locator resolution

The read-only Legacy main ref used for frozen locator evidence was 57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff. The source inventory is data/generated/skin-stage3-1-asset-inventory.v1.json (Git blob a5713e1f9574013b124033bbe70c7e8201b910cd). It identifies these exact Skin-specific paths:

| SkinID | Frozen Spine locator | Unity runtime container path |
| --- | --- | --- |
| 102 | Spine/Char/Mathew_ABS/Mathew_Skin01_Prefab.prefab | assets/gameproject/runtimeassets/spine/char/mathew_abs/mathew_skin01_prefab.prefab |
| 103 | Spine/Char/Mathew_ABS/Mathew_Skin02_Prefab.prefab | assets/gameproject/runtimeassets/spine/char/mathew_abs/mathew_skin02_prefab.prefab |
| 104 | Spine/Char/Mathew_ABS/Mathew_Skin03_Prefab.prefab | assets/gameproject/runtimeassets/spine/char/mathew_abs/mathew_skin03_prefab.prefab |
| 105 | Spine/Char/Mathew_ABS/Mathew_Skin04_Prefab.prefab | assets/gameproject/runtimeassets/spine/char/mathew_abs/mathew_skin04_prefab.prefab |

The exact internal container path was case-normalized and matched once per locator. The resolution did not use the similar Mathew_Skin01_Range_Prefab.

## Official Unity source and dependency chain

The selected official installer package is version 1.1.113, InstallPage_1.1.113_25.zip, 113,075,694 bytes, SHA-256 2d2aceb0c5f3b53742e794cc2e37784f3d07814c935093dc4e631d2c72b65740. The package contains Client/Langrisser_Data/StreamingAssets/ExportAssetBundle/begin_spine_char_mathew_abs.b, 4,651,863 bytes, SHA-256 8d2525638331fe5b0e4af8801e32548a11d29de717d52cdf0471a0590b6cc5d3.

All four exact Prefabs were found in that bundle and their raw Unity serialized Prefab hashes are recorded per Skin in evidence/assets/skin-fullart-m04.v1.json. Each Prefab's SkeletonAnimation.skeletonDataAsset points to its Skin-specific SkeletonData asset. That asset points to a Skin-specific binary skeleton and Atlas asset. The Atlas asset points to its atlas TextAsset and Material; the Material's _MainTex points to the matching Skin-specific Texture2D. The manifest records each object path ID, payload hash, and texture dimensions. Each binary skeleton reports Spine 3.3.05.

The original game build number and installer publication date were not established. Installer version 1.1.113 describes the fixed official Asset Source used here; it does not establish the ConfigData Semantic Snapshot version.

## Rendering and review

Rendering reused the geometry renderer from Legacy commit ab1bed2c and the version-matched EsotericSoftware Spine C# runtime at commit 1c1936532527900f74cfb58f7002998bf157b254. UnityPy 1.25.3 extracted the Unity object chain. Each Prefab configured idle_Normal; the same animation was found in and applied to each Spine 3.3.05 skeleton at time 0.

| SkinID | Prefab acquired | Dependencies complete | Geometry render | Attachments / triangles | WebP dimensions |
| --- | --- | --- | --- | ---: | ---: |
| 102 | PASS | PASS | PASS | 37 / 1,068 | 813 × 1,600 |
| 103 | PASS | PASS | PASS | 33 / 899 | 884 × 1,600 |
| 104 | PASS | PASS | PASS | 43 / 916 | 1,600 × 1,540 |
| 105 | PASS | PASS | PASS | 33 / 1,268 | 634 × 1,600 |

All outputs use transparent RGBA WebP, Pillow 13.0.0, quality 90, method 6, and maximum dimension 1,600. Mechanical validation opens and decodes every WebP, checks transparency, exact dimensions, file size, and SHA-256. Direct visual inspection found the full character visible, no card frame, transparent background, and no missing major attachment in all four renders. Skin 105's decorative lettering is part of the Spine artwork.

The output hashes and render geometry details are in the Asset Manifest. The manifest is an Asset provenance record; it does not admit any new Skin semantic or publication permission.

## Admission and verification

Assets are stored at:

- assets/skins/skin-102.webp
- assets/skins/skin-103.webp
- assets/skins/skin-104.webp
- assets/skins/skin-105.webp

tools/validate-skin-fullart-m04.py independently checks exact M03 consumer parity, frozen source locators, official package and bundle digests, acquired Prefab hashes, required Skeleton/Atlas/Texture provenance, the pinned renderer chain, distinct WebP files, alpha, visual review record, and exact admitted paths. tools/test-skin-fullart-m04.py contains 20 tests: a valid baseline and 19 failure controls for cases including wrong/nearby Prefab, incomplete dependencies, resolution without render, flattening alpha, card art, hash tampering, duplicate Skin assets, and accidental promotion of Asset Source version into semantic scope.

The CI workflow runs the validator and negative tests with pinned Pillow 13.0.0. This Asset admission does not add the Skin images to the Build or Pages publication allowlist and does not modify app.js, index.html, or styles.css.

## Gate result

| Gate | Result |
| --- | --- |
| LOCATOR_RESOLVED | PASS for 102–105 |
| PREFAB_ACQUIRED | PASS for 102–105 |
| SPINE_DEPENDENCIES_COMPLETE | PASS for 102–105 |
| FULLART_RENDER_PASS | PASS for 102–105 |
| Mechanical WebP integrity | PASS |
| Visual review | PASS |
| Asset admission validator | PASS |
| Negative tests | PASS |
| Main integration / Frontend / deployment | Not part of this branch |

No M01–M03 Canonical, Evidence, or Generated file is changed.
