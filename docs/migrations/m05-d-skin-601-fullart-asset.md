# M05-D — Skin 601 Fullart Asset Admission

## Scope and decision

This migration admits the already rendered SkinID 601 Spine Fullart as a private Target Asset. It reuses M05-C's approved Semantic Admission (HeroID 6, Source Order 1) and M05-G's Asset Registry. Asset Admission does not create Publication Approval. No Frontend, public mapping, Build allowlist, Pages, or Semantic artifact is changed.

## Source and acquired bytes

The source record is SkinID 601 in `data/generated/skin-fullart-reference.v1.json` at Legacy commit `57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff`. The Legacy validator reports `PASS_SKIN_FULLART_REFERENCE_ASSETS`. Its pinned official Unity client asset source is installer version `1.1.113`, bundle `spine_char_leon_abs.b`, 11,877,076 bytes, SHA-256 `3fde9e1d477bfb8c7426e11036a7432f213237ef36944706948789a2e1c717da`, with exact prefab locator `Spine/Char/Leon_ABS/Leon_Skin_Prefab.prefab`.

The existing validated WebP was fetched from the exact pinned Legacy commit and path `public/images/skin-fullart/601.webp` (HTTP 200). The copied Target file has Git blob SHA-1 `ff1e239aba0d523fe76baf1cb7df17d2ef78d264`, SHA-256 `a3a311f273b5ca02faff592204a69c454dcb75ae591c9cb9d7cc1b5950d22298`, and size 159,980 bytes. The semantic ConfigData snapshot and Unity asset source version remain separate provenance streams.

Decoded output is WebP RGBA, 737×1600, with alpha extrema 0–255 and 746,967 fully transparent pixels. The image was directly inspected: full-body character is visible, proportions are retained, background is transparent, and no card frame or apparent body crop is present. This reuses the Legacy render result `PASS_LEON_REFERENCE_FULLART_RENDER`, pose `idle_Normal @ 0`; no re-render or image modification was performed.

## Admission and publication boundary

`assets/skin-admissions/m05-d/skin-601.webp` is registered in `canonical/skin-asset-registry-m05-g.v1.json` with `APPROVED` Asset Admission and points to the private record in `evidence/assets/skin-fullart-m05-d.v1.json`. The M05-D validator independently checks the source locator and bundle provenance, the M05-C Semantic FK and order, acquired file identity, WebP decode, dimensions, alpha, transparent pixels, and Registry linkage.

M05-G generation includes the new Asset in the internal admitted Asset population (five). The public Consumer, public URL map, Publication Approval, and published image population remain the existing four (102–105). Skin 601 is not published. Internal Asset Evidence remains outside the public Build.

## Validation

- M05-D Asset validator and isolated failure controls cover output digest, size, dimensions, source locator/provenance, duplicate Registry entry, Semantic ownership, publication leakage, and corrupt bytes.
- M05-G generation is run and its three generated projections are required to remain byte-identical; M05-G validation checks five admitted Assets and four published records.
- Existing M04 Fullart validator and failure tests remain the owner for frozen IDs 102–105.
- Build regression verifies the 601 WebP and private M05-D Evidence are absent from the public artifact and return HTTP 404 in the fixture server.
- No M04 asset, M05-C Semantic, publication approval, Frontend, or Build allowlist changes are included.

This branch/PR is Asset Admission only. Main integration and Pages/Hosted QA are separate. The previously pending M05-I Hosted Mobile/cache gates are not requirements of this Asset Admission.
