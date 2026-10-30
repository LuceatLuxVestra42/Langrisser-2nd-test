# M05-C — SkinID 601 Semantic Admission and Internal Consumer

## Decision and scope

This change admits one historical Skin identity and its independently evidenced ownership and source-order claims into new M05-C artifacts. The frozen M01/M02 artifacts remain unchanged. The M04 public consumer, four fullart assets, presentation helper, UI, and Build allowlist remain unchanged.

The admitted tuple is SkinID 601, HeroID 6, Source Order 1. The order is a one-based position in HeroID 6's `ConfigDataHeroInfo.Skins_ID[]` array at the pinned historical snapshot. It is not release order or UI policy. The same order value on HeroID 1 is valid because position uniqueness is per Hero array.

No localized skin name, acquisition meaning, asset, or public/visible Population is admitted here.

## Source and claim evidence

- Legacy repository main: `57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff`.
- ConfigData snapshot: `6475e63ee23d18adf733756c26a14fa9e3ed662c`; game build number and official publication date are unknown.
- Identity is Evidence A: the pinned `ConfigDataHeroSkinInfo.json` was retrieved, its Git blob SHA-1 is anchored, and the unique record locator `ID=601` explicitly contains `ID=601`.
- Ownership is Evidence B: `SpecifiedHero=6` is confirmed from that source record, and the Legacy Stage 1 source metadata, Stage 2 forward relation, reverse relation, and their validations establish the same Skin-to-Hero membership with exactly-one ownership.
- Source Order is separate Evidence B: the Legacy source trace defines `ConfigDataHeroInfo.Skins_ID[]` array position as the order; the accepted Hero 6 projection places Skin 601 at zero-based position 0; the Stage 1/2 parity validations report no invalid order or mismatch. The one-based Target value is 1.
- The complete raw `ConfigDataHeroInfo.json` bytes were not retrieved during this execution. Membership and order therefore reuse the validated, claim-scoped Legacy chain and are not labeled Evidence A.
- No contradictory evidence was found in the reviewed same-snapshot claim chain.

## Target owners and artifacts

| Responsibility | Owner | Canonical / Evidence |
|---|---|---|
| Identity | M05-C Skin Identity Admission | `canonical/skin-identities-m05-c.v1.json` / `evidence/source/skin-identity-m05-c.v1.json` |
| Ownership | M05-C Skin-to-Hero Admission | `canonical/skin-hero-relations-m05-c.v1.json` / `evidence/source/skin-hero-relation-m05-c.v1.json` |
| Source Order | M05-C Snapshot Array Position Admission | `canonical/skin-source-orders-m05-c.v1.json` / `evidence/source/skin-source-order-m05-c.v1.json` |
| Composition | M05-C internal Consumer projection | `generated/skin-consumer-internal-m05.v1.json` |

The internal Consumer is the four frozen M01/M02 tuples plus Skin 601. It does not replace or expand the M04 public `generated/skin-consumer.v1.json`.

## Validation and boundaries

The independent M05-C validator checks the frozen scopes/populations, claim evidence pointers and classes, Hero 6 FK, claim values, per-Hero Source Order uniqueness, exact internal Consumer composition, and the existing four-row public Consumer/Asset/UI boundary. CI runs the validator and negative tests. Negative tests cover Frozen contract mutation, claim/provenance mutation, invalid FK/order, duplicate order within a Hero, allowed same order across Heroes, internal Consumer drift/addition, and attempted M04 public/UI/Build expansion.

### Population after this change

- Frozen M01/M02 Canonical: four existing claims, unchanged.
- M05-C new admission: one Skin Identity, one Ownership, one Source Order.
- Internal Consumer: five tuples.
- M04 public Consumer, Asset, and Visible Population: four, unchanged.
- Main integration, asset admission, Build publication, Frontend exposure, and deployment are out of scope.

## Expected changed paths

`canonical/skin-identities-m05-c.v1.json`, `canonical/skin-hero-relations-m05-c.v1.json`, `canonical/skin-source-orders-m05-c.v1.json`, `evidence/source/skin-identity-m05-c.v1.json`, `evidence/source/skin-hero-relation-m05-c.v1.json`, `evidence/source/skin-source-order-m05-c.v1.json`, `generated/skin-consumer-internal-m05.v1.json`, `tools/validate-skin-admission-m05-c.mjs`, `tools/test-skin-admission-m05-c.mjs`, `.github/workflows/ci.yml`, `docs/migrations/m05-c-skin-601-semantic-admission.md`.

## Reopen conditions

Reopen the affected claim if the pinned source snapshot or relevant claim artifacts change, the Legacy relation/order chain is contradicted, HeroID 6 is removed from Target identity, a validator reports a current-diff failure, or the M04 public/internal boundary changes. M05-D must independently re-hash and validate any reused Fullart before Target Asset Admission.
