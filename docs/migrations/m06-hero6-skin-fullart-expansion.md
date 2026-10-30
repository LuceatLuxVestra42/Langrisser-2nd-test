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

M06-C, M06-D, and M06-E remain pending. This checkpoint does not assert that any M06 change has been integrated or published.
