# M03 — Internal Generated Skin consumer

## Scope and source owners

M03 derives an internal presentation payload from the Canonical owners already admitted by M01 and M02. It changes no Skin Identity, Skin-to-Hero ownership, or Source Order claim.

Inputs:

- `canonical/skin-identities.v1.json` — M01 Skin IDs.
- `canonical/skin-hero-relations-m02.v1.json` — M02 Hero ownership.
- `canonical/skin-source-orders-m02.v1.json` — M02 one-based positions in the pinned historical source array.
- `canonical/hero-identities.v1.json` — Hero foreign-key endpoint check.

Output: `generated/skin-consumer.v1.json`, schema version 1, with only `skinId`, `heroId`, and `sourceOrder` per record. The records are deterministically emitted by the Canonical `sourceOrder` value. The consumer does not read Legacy, raw ConfigData, names, assets, release state, or frontend state.

The current result is exactly four rows: `(102,1,1)`, `(103,1,2)`, `(104,1,3)`, `(105,1,4)`. Source Order retains the M02 fixed-snapshot meaning. The four rows are not a future population or complete-list assertion.

## Validation and generation

`tools/generate.mjs` joins records by exact `skinId` and writes the Generated consumer. It rejects malformed or duplicate owner IDs, missing relation/order claims, repeated Source Order values, and invalid Hero endpoints. It sorts output only by the admitted `sourceOrder` field.

`tools/validate-skin-generated.mjs` independently checks the exact M01/M02 input populations, current admitted owner values, foreign keys, provenance pointers, exact Generated schema, and byte-for-byte expected output. It does not call the Generator. `tools/validate.mjs` and the Build preflight call this independent validator; CI also runs its negative-test suite.

The failure controls cover missing, duplicate, and extra identities; ownership and FK changes; missing or multiple ownership; absent and changed orders; stale and malformed Generated records; simultaneous Canonical/Generated mutation; and missing owners without fallback. A separate isolated renderer fixture uses Skin IDs `[80,12,50]` with Source Order `[2,3,1]` to distinguish the admitted position from numeric SkinID ordering. The fixture is not a Canonical input or Generated artifact.

## Build and publication boundary

The Build preflight rejects a stale internal Skin Generated file. `generated/skin-consumer.v1.json` is intentionally absent from `publicSitePaths`; `tools/test-build.mjs` asserts that the file is not included in the public artifact. No Frontend, Pages workflow, or publication allowlist change is part of M03.

## Integration record

Expected and actual Changed Paths are recorded in the PR review. The M01/M02 Canonical and Evidence files must remain unchanged. Branch completion requires independent validation, negative tests, repeated generation parity, Build/publication-boundary regression, existing CI, and exact scope review. Main integration is a separate task.
