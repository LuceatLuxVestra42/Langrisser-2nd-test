# M01 — four Skin identities

## Admission boundary

M01 admits the source-native Skin identifiers 102, 103, 104 and 105. Each has direct A evidence. This is an explicit four-ID slice, not a Skin population census. Canonical rows contain only `skinId` and their claim-scoped evidence pointer.

| Skin ID | Source Name (inspection only) | Evidence | Decision |
| --- | --- | --- | --- |
| 102 | 执事美酒 | A | Admit identity only |
| 103 | 灵魂指挥 | A | Admit identity only |
| 104 | 铸剑的英雄 | A | Admit identity only |
| 105 | 妙想假日 | A | Admit identity only |

There are no deferred C/D identities within this requested set. Names are retained in source evidence, not canonical localization. Hero ownership, source order, release information, acquisition, assets, generated consumers and frontend behavior are outside this admission.

## Authority and source inspection

- Target was cloned from `LuceatLuxVestra42/Langrisser-2nd-test`, `main` at `18e138a142cde61411037e816ca0d53d73bd1982`. The initial local checkout was clean (no staged, unstaged or untracked changes). Work branch: `codex/m01-skin-identities`.
- Source was inspected remotely at `LuceatLuxVestra42/langrisser-future-guide`, `main` at `57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff`. Source local branch/working-tree/staged/unstaged/untracked state: `UNKNOWN`; no source checkout or source mutation.
- Read Target `ARCHITECTURE_PRINCIPLES`, `SOURCE_PROVENANCE`, `MIGRATION_POLICY`, current identity owners/validators and CI. Target had no existing Skin owner/schema. The new local owner follows the existing `schemaVersion`, `scope`, `sourceEvidence`, `records` pattern.
- Inspected all six requested Legacy artifacts, plus the source trace and two builders. All nine recorded blob identifiers match the pinned Source commit tree. Historical validation applies to its own 540-skin scope and is corroboration only.
- Retrieved `ConfigDataHeroSkinInfo.json` at historical commit `6475e63ee23d18adf733756c26a14fa9e3ed662c`. Verified its full 563343 bytes against Git blob `f6bd2611114ae8ae8aec24d8f304b94f2c314dc9` and SHA-256 `6fe685622a57a6546f4cce73ff788057605fca215eba6327eff66c3b5d4847c7`. Each requested ID occurs once; all four source names match the inspected Legacy records.
- Preserved only the four source-native `ID`/`Name` field projections, source anchors, locators, source interpretation, transformation history and limitations. No full Legacy file or operational system was imported. The original snapshot's exact game build is unknown; it is not asserted to be the exact input version of the later Legacy projections.
- No authoritative contradiction was found in the inspected scope. This does not assert an exhaustive live-server contradiction search.

The source record projections and source interpretation survive in Target. Normal owner validation requires neither Legacy nor a network request nor the full raw snapshot. External original source retrieval remains a re-verification operation.

## Expected and actual change scope

The approved implementation path set is the following seven files. Final diff review must confirm exactly this set before remote mutation.

| Path | Responsibility |
| --- | --- |
| `canonical/skin-identities.v1.json` | Four identities and provenance only |
| `evidence/source/configdata/ConfigDataHeroSkinInfo.records-identity-m01.v1.json` | Four raw ID/Name field projections |
| `evidence/source/skin-identity-m01.v1.json` | A decisions, raw anchors, locators, historical trace and limitations |
| `tools/validate-skin-identities.mjs` | Independent population, schema, source integrity and provenance checks |
| `tools/test-skin-identities.mjs` | Standalone owner and failure detection |
| `.github/workflows/ci.yml` | Invoke the new validator and test in the existing PR/Main CI job |
| `docs/migrations/m01-skin-identity.md` | Scoped decision and M02 handoff |

No existing canonical, relation, generated data, generator, frontend or Pages file is changed. CI gains two explicit calls; no routing, registry or additional workflow is introduced.

## Verification contract

- `node tools/validate-skin-identities.mjs`: exact explicit ID set, unique safe-integer IDs, strict canonical field shape, per-claim direct A evidence, exact source/record locators, pinned raw subset digest, raw snapshot and historical blob anchors, transformation provenance and scoped contradiction state.
- `node tools/test-skin-identities.mjs`: standalone validation with only this owner's inputs; 27 failure controls covering missing/extra/duplicate/string/wrong IDs, relation/order/localization leakage, provenance misdirection, C/D evidence, source/locator/interpretation corruption, historical anchor loss and coordinated canonical/evidence injection. A reversed canonical array remains valid: no source-order semantics are assigned.
- Independent ingestion check recomputes the full raw Git blob hash and extracts the four ID/Name pairs directly, then compares them to the preserved subset. The validator does not invoke a generator or use current canonical values as its source oracle.
- Existing Base CI commands were executed before implementation: 87/87 PASS. The implementation sequence, including the two new calls, passed 89/89 locally. No Existing Drift or current-diff hard failure was observed. Remote results and exact commit/PR identifiers are recorded in the execution report/PR; local Node was v24.22.1 and hosted CI uses Node 22.
- Final checks include `git diff --check`, the exact seven-path set, no changes to existing canonical/relation/generated files, and rechecking remote Target `main` before publication. Build/static packaging are regression checks only; browser/hosting gates are not required by this semantic-only slice.

## M02 handoff

The confirmed endpoint identity set is `[102, 103, 104, 105]`, backed by `canonical/skin-identities.v1.json` and `evidence/source/skin-identity-m01.v1.json#records`.

The Legacy relation artifact, pinned in the evidence, reports Hero 1 and source orders 1, 2, 3, 4 respectively. The inspected raw skin records also contain `SpecifiedHero: 1`. These observations are comparison/discovery references only: M01 does not admit any Hero relation or independent source-order claim. M02 must recheck current repository state and separately assess relation evidence, endpoint authority and any ordering scope before implementing a relation. It must not infer ownership from names, ID arithmetic or this canonical array order.

M01 introduces no generated consumer and no frontend. Its branch admission must not be described as Main integration or deployment until those actions are actually performed.
