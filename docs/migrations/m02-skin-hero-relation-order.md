# M02 — Skin to Hero ownership and source order

## Decision

M02 admits two independent claim sets for the four Skin identities already admitted by M01:

| Skin ID | Hero ownership | Snapshot source order |
| ---: | ---: | ---: |
| 102 | Hero 1 | 1 |
| 103 | Hero 1 | 2 |
| 104 | Hero 1 | 3 |
| 105 | Hero 1 | 4 |

Ownership is the combination of explicit membership in `ConfigDataHeroInfo.ID=1.Skins_ID[]` and the matching `ConfigDataHeroSkinInfo.SpecifiedHero` value. Order is the one-based position of each ID in that source array. Both claims have Evidence A: selected records and fields were extracted from the pinned raw Source files, whose full Git blob IDs, byte sizes, and SHA-256 digests are recorded in each evidence file. The projection digest binds the exact selected fields.

The source is the historical China ConfigData snapshot at Legacy commit `6475e63ee23d18adf733756c26a14fa9e3ed662c`. Its game build number and official publication date are unknown. The fixed snapshot contains exactly `[102,103,104,105]` in Hero 1's `Skins_ID` field. This confirms that field's contents at that snapshot only; it does not establish a future population limit or UI sorting rule.

Legacy validation at `57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff` corroborates the membership, owner cross-check, and array-position interpretation. It is not the sole basis of admission. Its 540-skin validation scope is not imported into the target Canonical.

No authoritative contradiction was observed in the inspected source and validation scope. Hero 1 is already present in Target Hero Identity Canonical. M01 Skin identities and their provenance are unchanged.

## Canonical owners

- `canonical/skin-hero-relations-m02.v1.json` owns only the four Skin-to-Hero relation records.
- `canonical/skin-source-orders-m02.v1.json` owns only the four snapshot source-position claims.
- `evidence/source/skin-hero-relations-m02.v1.json` records per-Skin membership and `SpecifiedHero` evidence.
- `evidence/source/skin-source-orders-m02.v1.json` records per-Skin zero-based source offset and one-based source order.
- `evidence/source/configdata/skin-relation-order-records-m02.v1.json` is the hash-anchored source projection used by both evidence sets.

The canonical owners and their validators are separate. Neither canonical record adds a Chinese or Korean name, asset, release status, acquisition meaning, or presentation rule. The relation owner has no order field; the order owner has no Hero relation field.

## Validation

`tools/validate-skin-hero-relations-m02.mjs` checks the exact four endpoints, M01 and Hero identity foreign keys, source projection digest and locators, membership uniqueness, `SpecifiedHero` agreement, claim provenance, and canonical/evidence agreement.

`tools/validate-skin-source-orders-m02.mjs` checks the exact four endpoints, source array offsets and one-based positions, unique positions, locators, snapshot boundary, projection digest, and canonical/evidence agreement. Canonical storage order does not define source order.

The independent negative suites mutate IDs, foreign keys, membership/ownership, array offsets, source order, locators, source hashes, claim populations, evidence classes, and coordinated Canonical/evidence pairs. They also verify that record storage order is not semantic. M01 identity validation and negative tests are regression gates.

## Integration record

- Expected paths: the two Canonical files, three Evidence/projection files, two Validators, two negative-test files, this migration record, and `.github/workflows/ci.yml`.
- Actual paths and the Target base/head SHAs are recorded in the PR review and final M02 handoff.
- Branch completion requires both responsibility-specific validators and tests, M01 regression, CI, and scope/diff review to pass.
- Main integration is a separate gate and is not part of this migration branch task.

## M03 handoff boundary

After branch validation, the four ownership claims and four snapshot order claims can be reviewed for integration. A later consumer may use these admitted facts only within their recorded semantics. Do not convert the snapshot order into a release order or UI policy, and do not infer a global or future complete skin population. M01 Identity records remain the identity authority.
