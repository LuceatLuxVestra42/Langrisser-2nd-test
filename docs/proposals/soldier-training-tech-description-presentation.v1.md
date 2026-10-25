# Soldier TrainingTech 223 Description Presentation Contract

**Contract ID:** `soldier-training-tech-description-presentation.v1`
**Status:** `PROPOSED / NOT_APPROVED / NOT_EFFECTIVE`
**Repository Ref:** proposal branch based on `main` at `ef63ede9d866dc55f6c1af46646ab22840b6ce26`
**Decision A — existing-scope reconciliation:** `UNRESOLVED`
**Decision B — publication eligibility:** `UNRESOLVED`
**Publication state:** `PUBLICATION_BLOCKED`

This proposal does not amend, override, or interpret the existing Canonical exclusion `Frontend display` or Evidence exclusion `Generated or frontend presentation`. It proposes a separate downstream consumer for review. The relationship between these exclusions and a future consumer remains unresolved until an authorized owner records Decision A. This proposal grants no publication permission and becomes effective only after Decisions A and B are separately approved and recorded by identified owners with documented authority.

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

No additional Soldier, TrainingTech, LevelInfo ID, field, source version, or relation is authorized by this proposal.

## 3. Permitted presentation if Decisions A and B approve

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
- **Contract Reconciliation Owner for Decision A:** `UNRESOLVED`.
- **Publication Eligibility Approver for Decision B:** `UNRESOLVED`.

GitHub write, admin, review, Required CI, or merge permission alone does not establish authority to resolve existing contract scope or approve publication. The approver's role and authority basis must be recorded.

Decisions A and B require separate records. Each record must identify the decision, approver and authority, repository and Ref, this Contract ID/version, exact IDs and fields, outcome, date, record location, compatibility action, effective conditions, and review or revocation terms. Decision A does not approve publication. Decision B cannot expand this scope.

## 6. Effectiveness and publication gate

This proposal remains non-effective until all of the following hold:

1. An authorized owner records Decision A and resolves the relationship to both existing exclusions.
2. An independently authorized publication owner records Decision B as approval for this exact scope.
3. Both approval records and any required contract reconciliation are committed through the normal repository review path.
4. Generated and Presentation owners are identified and the approved contract version is made effective.
5. The generated consumer's approval state is changed only by a reviewed change that references those approval records.

Until then, the Generated consumer must say `PROPOSED` and `approved: false`, and the Frontend must render no TrainingTech disclosure. A proposed PR, test fixture, CI PASS, Review comment, or merge authority is not an approval record.

Any change to IDs, fields, source pin, disclosure, markup handling, or presentation meaning requires a new reviewed contract version. New source versions do not inherit this proposal's approval. An identified publication owner may suspend or revoke eligibility through a recorded reviewed revision. Revocation removes presentation eligibility but does not invalidate or delete Canonical claims.

## 7. Required validation after approval

Before a future PR can claim implementation readiness, independent checks must establish:

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

Even if these checks pass, publication remains blocked until Decisions A and B are effective. A separate approval and review are required before any Merge, Main CI, Pages, Hosted, or Browser delivery gate.
