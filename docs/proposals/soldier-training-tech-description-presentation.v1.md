# Soldier TrainingTech 223 Description Presentation Contract

**Contract ID:** `soldier-training-tech-description-presentation.v1`
**Status:** `APPROVED`
**Effectiveness:** `EFFECTIVE` after the owning validators and Required CI pass on this exact source state.
**Decision Record:** `docs/decisions/pr137-training-tech-223-presentation.v1.json`
**Repository Ref:** proposal branch based on `main` at `ef63ede9d866dc55f6c1af46646ab22840b6ce26`
**Decision A — existing-scope reconciliation:** `APPROVED` (`A2_WITH_MINIMAL_A1_RECONCILIATION`)
**Decision B — publication eligibility:** `APPROVED` for the four exact public surfaces in the Decision Record.
**Publication state:** `AUTHORIZED_FOR_EXACT_20_CLAIMS`; actual Pages deployment remains a separate gate.

Decision A uses a separate downstream Presentation contract and the minimum reconciliation required by the existing exclusions. Canonical does not grant downstream presentation eligibility. Evidence does not itself authorize Generated or frontend publication. The reconciled scope statements in Canonical and Evidence refer downstream permission to this exact-scope Presentation Contract. The admitted claims, evidence, identities, relations, strings, fields, source pin, and provenance remain unchanged.

Decision A and Decision B were authorized by the Project Principal Decision-Maker, as expressly identified by the user in the authorization conversation. The individual account/legal name and original decision date are not inferred and remain `UNRESOLVED`; the record date is in the Decision Record. GitHub permission alone is not the authority basis.

## 1. Purpose and responsibility boundary

If approved, this contract permits a Generated and Frontend consumer to present only the already admitted opaque CN description strings listed below. It does not admit or change Canonical claims, Source evidence, identity, relations, game rules, localization, or source interpretation.

The existing Canonical and Evidence owners remain responsible only for their recorded claims and evidence. The future consumer is responsible for presentation eligibility, disclosure, safe text rendering, and preserving exact claim scope. It must consume the Canonical owner through deterministic Generated output; it must not read raw ConfigData or Legacy files at runtime.

## 2. Exact proposed scope

Only the existing 20 Canonical rows in `canonical/soldier-training-tech-descriptions.v1.json` are in scope:

| Variant | Soldier ID | TrainingTech ID | LevelInfo source IDs | Source Field | Claims |
|---|---:|---:|---|---|---:|
| NORMAL | 115 | 223 | 2230–2239 | `Description` | 10 |
| SP | 5115 | 223 | 2230–2239 | `SpSoidlierDescription` | 10 |

Source pin: `LuceatLuxVestra42/langrisser-future-guide` commit `6475e63ee23d18adf733756c26a14fa9e3ed662c`.

Source records and locators:

- `data/configdata/ConfigDataTrainingTechInfo.json#ID=223`
- `data/configdata/ConfigDataTrainingTechLevelInfo.json#ID=<levelInfoId>`

The TrainingTech record explicitly lists `SoldierIDRelated=[115,5115]` and `TechLevelupInfoList=[2230…2239]`. The consumer must use exact Canonical IDs and Provenance. It must not infer endpoints through names, arithmetic, ordering, or fallback.

No additional Soldier, TrainingTech, LevelInfo ID, field, source version, or relation is authorized by this contract.

### 2.1 Authorized public surfaces

Decision B authorizes only these exact 20 claims on Soldier card UI, Build Generated JSON, Hosted Direct JSON, and public GitHub Source. Direct JSON access and UI presentation are separate permissions; both are explicitly included. This authorization does not assert that a Hosted deployment has occurred or passed verification.

## 3. Permitted presentation under Decisions A and B

The consumer may display:

- The exact Canonical CN source string.
- Variant and Soldier ID.
- TrainingTech ID and LevelInfo **source record ID**.
- Exact source field name.
- Pinned source repository, commit, and record locator.
- The disclosures below.

Required disclosure:

> CN ConfigData 원문 설명 · 한국어 공식 번역 아님

> LevelInfo ID는 원본 레코드 식별자이며 게임 레벨이나 진행 순서를 뜻하지 않습니다. 원문은 검증된 실제 전투 효과로 해석하지 않습니다.

For SP rows, also show:

> SP 설명의 슬롯·시점·게임 내 적용 의미는 확인되지 않았습니다.

The consumer must not present a LevelInfo ID as a game level, growth stage, unlock step, progression order, or rank. It must not assert SP slot, timing, target, application, or combat effect. It must not calculate costs, growth stats, or combat stats; create Korean translations or official Korean names; or generalize to another ID, field, or source version.

## 4. Safe string rendering

Source strings are untrusted text. Never insert a source string using `innerHTML` or any HTML parser that executes or interprets arbitrary markup.

The current source strings contain the exact tokens `<color=#DC143C>` and `</color>`. A renderer may convert only balanced, non-nested occurrences of this exact pair to fixed DOM spans. All enclosed and surrounding text must be assigned with `textContent` or text nodes. Newlines must remain visible. Unsupported, malformed, nested, or unknown markup must be preserved as plain text or make validation fail; it must never be silently removed or interpreted as HTML.

The owning validator must compare original Canonical strings byte-for-byte with Generated strings and test the safe transformation boundary independently.

## 5. Owners and approvals

- **Semantic Claim Owner:** existing Canonical/Evidence responsibility; named human owner `UNRESOLVED`.
- **Generated Projection Owner:** `UNRESOLVED`.
- **Frontend Presentation Owner:** `UNRESOLVED`.
- **Contract Reconciliation Owner for Decision A:** the Project Principal Decision-Maker for policy; implementation owner identity remains `UNRESOLVED`.
- **Publication Eligibility Approver for Decision B:** the Project Principal Decision-Maker for policy; implementation owner identity remains `UNRESOLVED`.

GitHub write, admin, review, Required CI, or merge permission alone does not establish authority to resolve existing contract scope or approve publication. The approver's role and authority basis must be recorded.

Decisions A and B are recorded independently in the Decision Record with separate IDs and outcomes. The record identifies repository, Contract ID/version, source, IDs/fields, public surfaces, authority basis, reconciliation, validators, effectiveness conditions, and review/revocation terms. Decision A does not itself authorize publication; Decision B cannot expand this exact scope.

## 6. Contract approval and effectiveness

Approval and effectiveness are independent states. The Decision Record approves both policy decisions. The contract is effective only when the following conditions hold together:

1. Separately identified Decision A and Decision B records match this Contract ID/version.
2. Canonical and Evidence downstream responsibility wording is reconciled and their owning validator passes without changing admitted Semantic claims.
3. Generated output is deterministic and matches all 20 Canonical rows, source fields, IDs, and provenance.
4. Build, Frontend Guard, revocation negatives, and Required CI pass on the same source state.
5. Generated approval/effectiveness metadata matches the Decision Record; `approved: true` alone never enables publication.

While unapproved, approved-only, revoked, wrong-version, or out-of-scope, the Frontend renders no TrainingTech disclosure and Build omits the direct JSON artifact. The effective state permits only these exact 20 claims and four approved surfaces. A test fixture, CI PASS, Review comment, or merge permission alone is not an approval record.

Any change to IDs, fields, source pin, disclosure, markup handling, public surfaces, or presentation meaning requires a new reviewed contract decision. New source versions do not inherit this approval. Revocation disables future UI use and causes new Build output to omit the JSON artifact. It does not erase previously published static files, GitHub history, caches, or external copies; replacing a deployed copy remains a separate deployment action.

## 7. Required validation for contract effectiveness

Independent checks must establish:

1. Exact parity across the 20 Canonical claims and Generated output.
2. Exact Soldier, TrainingTech, LevelInfo, and Provenance linkage.
3. NORMAL/SP field separation.
4. No unapproved ID, field, relation, source version, or population in Generated or Frontend output.
5. Original string parity and safe markup handling without `innerHTML`.
6. Negative cases for scope widening, endpoint substitution, field crosswire, altered strings, missing disclosures, unsupported markup, game-level/progression labels, SP application claims, and computed effects or stats.
7. Deterministic Generated freshness and packaged artifact parity.
8. Frontend association only with Soldier 115 and 5115, collapsed native disclosure, keyboard operation, and existing Skill/SP-NORMAL behavior.
9. Cache-key checks, applicable regressions, Preflight, and static Build.
10. Exact PR Head Required CI success.

Passing these checks establishes the contract's technical effectiveness for this exact source state. Draft release, Merge, Main CI, Pages deployment, and Hosted verification remain separate gates; this contract does not perform them.
