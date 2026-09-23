# Migration Policy

## 1. Purpose

This document defines how semantic knowledge and supporting evidence may move from the Legacy project into this repository.

It refines the Project Instructions, `ARCHITECTURE_PRINCIPLES.md`, and `SOURCE_PROVENANCE.md`.

Migration here means selective semantic succession.

It does not mean copying the Legacy repository, reproducing its directory structure, continuing its lifecycle, or preserving its implementation architecture.

The default migration shape is:

```text
identify a semantic responsibility
→ inspect the Legacy result actually relied upon
→ evaluate its evidence under SOURCE_PROVENANCE
→ admit only supported claims
→ implement the smallest new canonical/generated/presentation path needed
→ validate the new result
```

## 2. Legacy is a predecessor, not a template

Legacy may remain an authoritative predecessor for a semantic responsibility that this repository has not yet migrated, but only for the semantic results actually relied upon.

This prevents unnecessary reinvestigation of already validated work while keeping the new repository independent.

Predecessor authority does not imply:

- automatic canonical admission
- architectural inheritance
- schema inheritance
- workflow inheritance
- validator inheritance
- frontend inheritance
- source authority beyond the relied-upon semantic result

A Legacy technique or structure should be adopted only when current requirements independently justify it.

## 3. Migrate responsibilities, admit claims

The normal migration unit is the smallest independently meaningful semantic responsibility. Within that responsibility, admit only the claims supported by evidence.

Legacy files, directories, Stages, checkpoints, or feature bundles are not migration units.

Potentially reusable material includes:

- verified semantic claims
- traceable A or B evidence
- explicit identifiers
- explicit relation evidence
- validated source interpretation
- localization results within their actual scope
- rejected hypotheses and negative evidence
- Legacy output used as a comparison fixture
- historical notes that lead to non-circular evidence

Do not migrate an artifact merely because it contains some useful information.

Extract only what the current migration responsibility needs.

## 4. Evidence admission during migration

Use the evidence rules in `SOURCE_PROVENANCE.md`.

In practical migration work:

- A claims may be admitted from direct traceable evidence
- B claims may be reused without reopening the full raw-source investigation when the B conditions are satisfied
- C claims remain unsupported and must not enter canonical data
- A D claim must not be admitted as-is. Resolve, scope-split, or explicitly exclude the contradicted claim before admitting the affected portion; unrelated supported claims may proceed independently.

Migration itself is not a reason to re-verify all B claims.

Source-level re-verification is appropriate only when the current task requires confirmation beyond the existing admitted evidence, provenance is insufficient, source semantics changed, or authoritative evidence creates a material contradiction.

A Legacy `PASS`, `FROZEN`, `COMPLETE`, Stage, checkpoint, or final-looking artifact is not sufficient admission evidence by itself.

## 5. Evidence must survive Legacy retirement

Claims admitted into the new canonical system must remain traceable without requiring the Legacy repository.

This does not require copying every raw source into this repository.

Acceptable support may include:

- preserved source snapshots
- authorized external source storage
- source-native locators
- stable source versions, preserved commits, or locators that remain accessible independently of the Legacy repository
- compact evidence notes
- prior validation traces that satisfy B requirements

Legacy may be consulted during migration, but it must not become a permanent hidden dependency for explaining why current canonical data is valid.

## 6. What must not be inherited by default

Do not migrate the following merely because they existed in Legacy:

- Stage systems
- Freeze or promotion systems
- Status Source
- Project Status
- Project Check
- global owner topology
- changed-path routing frameworks
- validator graphs
- checkpoint graphs
- orchestration frameworks
- generic Doctor or Runner systems
- old directory topology
- old frontend framework
- old route structure
- old asset pipeline
- old hosting architecture
- old generated formats
- old schemas without independent current need

Absence of these systems in the new repository is not a migration gap.

They should appear only if current implementation demonstrates a concrete need.

## 7. Semantic responsibility boundary

Migration should be scoped by semantic responsibility rather than by file ownership in Legacy.

Examples of distinct responsibilities include:

- Hero identity
- Hero display localization
- Hero release scope
- Hero stat semantics
- Hero-to-Soldier relation
- Equipment identity
- Equipment ownership relation
- TrainingTech meaning
- asset identity and provenance
- presentation eligibility

Different evidence may be tracked at claim level without creating a separate migration responsibility.

Split migration responsibilities when the concerns are independently meaningful and have distinct semantic or completion boundaries.

Do not let a broad Legacy artifact force unrelated responsibilities into one migration unit.

## 8. Identity and population migration

Canonical identity must be based on explicit supported identifiers and source semantics.

Do not migrate identity or population using:

- display-name matching
- translated-name matching
- filename similarity
- ID arithmetic
- numeric ranges
- UI ordering
- Legacy list order
- historical generated output alone
- guessed missing records

A Legacy population may be useful as a comparison fixture, but a matching count is not identity evidence.

Likewise, a count mismatch does not by itself prove the new canonical population is wrong.

Investigate the actual identities and scope involved.

## 9. Relation migration

Relations are separate semantic claims and require relation evidence.

Do not migrate a relation merely because:

- two Legacy pages linked to each other
- IDs appear numerically related
- names match
- one generated file contains both IDs
- a lookup can reverse-reference both records
- the relation existed in frontend code

Prefer explicit foreign keys, relation tables, validated source fields, or traceable inherited evidence satisfying B.

If the first executable slice does not require a relation, defer it.

## 10. Localization migration

Localization may be migrated independently from semantic identity when identity is already established.

Localization evidence may support:

- confirmed display names
- provisional display names
- localized descriptions
- display labels

It does not automatically support:

- identity
- canonical population
- relation
- release status
- numeric mechanics

Preserve confirmed versus provisional status when it matters.

Do not promote a temporary or unofficial Korean name to confirmed merely because the underlying entity is known.

## 11. Negative evidence migration

Useful rejected hypotheses should be retained when they prevent likely repeated mistakes.

Examples include previously rejected assumptions based on:

- fixed ID offsets
- name equality
- display order
- incomplete relation sources treated as complete
- guessed enum meanings
- historical fallback behavior

Keep negative evidence lightweight.

It should record the rejected hypothesis, why it failed, and enough support to avoid repeating the same inference.

Do not recreate a Legacy lifecycle around negative evidence.

## 12. Legacy output and parity

Legacy generated output may be used as a migration diagnostic or parity fixture.

It may help answer questions such as:

- Did the new implementation unintentionally lose records?
- Did a transformation change display output?
- Is a difference expected from a corrected semantic claim?
- Did presentation eligibility change?

Parity is not canonical authority.

The goal is not automatic byte-for-byte reproduction of Legacy output.

When new output differs, determine whether the difference is:

- an intentional architecture or presentation difference
- a scope difference
- a supported semantic correction
- a migration omission
- an unresolved semantic contradiction
- a defect in generation or presentation

Only the last relevant owning responsibility should be changed.

Do not alter correct canonical data merely to make a Legacy fixture match.

## 13. Handling Legacy and new-repository disagreement

When a migrated result disagrees with Legacy, do not assume either side is correct solely because it is older or newer.

Check, in order:

1. Are both results talking about the same identity and semantic scope?
2. Is the Legacy result supported by traceable A or B evidence?
3. Is the new result supported by traceable evidence?
4. Is the difference semantic, localization-only, presentation-only, or generated-output-only?
5. Does newer authoritative evidence materially contradict the predecessor claim?
6. Is the difference caused by an intentional change in canonical structure or presentation eligibility?

Possible outcomes include:

- keep the inherited claim
- admit a source-backed correction
- preserve both scoped facts
- keep the issue unresolved
- fix a downstream generation or presentation defect

Do not resolve disagreement by name matching, count matching, output matching, or choosing the newer artifact automatically.

## 14. Source snapshots and newer data

A newer source snapshot is not automatically a migration command.

Source ADDED, CHANGED, or REMOVED observations do not automatically mean:

- canonical addition
- canonical mutation
- canonical deletion
- predecessor invalidation

If a newer source introduces a material contradiction, reopen only the affected semantic responsibility.

If existing A/B support remains sufficient and no material contradiction exists, migration may reuse it without full source-level re-investigation.

## 15. Generated and production independence

Migration is complete only when normal use of the migrated responsibility no longer depends on Legacy.

Normal canonical validation, generation, generated validation, and frontend build should use the new repository's admitted canonical data and deterministic derived outputs.

Legacy or raw external sources may still be consulted for:

- ingestion
- investigation
- contradiction resolution
- re-verification

They should not be silently read during normal rendering or generation.

Generated output remains replaceable and non-authoritative.

## 16. Small migration slices

Prefer small executable slices over domain-wide migration.

The first Hero slice should prove the new architecture with only the data required for the path being implemented.

A suitable initial scope is:

```text
2–3 Heroes
→ Hero identity
→ Korean display name
→ portrait
→ one or two simple facts
→ focused validation
→ deterministic generated consumer
→ minimal UI
```

Relations are optional.

Do not include jobs, skills, factions, origins, exclusive equipment, central discipline, SP data, Soldiers, or other domains merely because relevant Legacy evidence already exists.

Add them when a later slice has a concrete need and its own completion criteria.

## 17. Migration completion for a responsibility

A semantic responsibility is migrated when all of the following are true for the intended scope:

- the new canonical claims are explicit
- admitted claims have sufficient A or B provenance
- known C claims are not silently included
- known D contradictions affecting the scope are resolved or explicitly excluded from admission
- required localization or presentation metadata is handled in its proper scope
- required validation passes
- generated consumers, if any, are reproducible from new canonical data
- normal production use does not require Legacy
- Legacy differences that materially affect canonical validity, required downstream consumers, or remaining predecessor dependency are resolved
- other non-blocking historical deviations may remain explicitly documented

Migration completion is local to the responsibility.

It does not create a global Stage, Freeze, promotion status, or repository-wide completion state.

## 18. Legacy retirement boundary

Do not retire Legacy authority globally just because one slice has migrated.

For each semantic responsibility:

- before migration, Legacy may remain the authoritative predecessor for the relied-upon semantic result
- after migration, the new repository becomes authoritative for the admitted scope of that responsibility
- unrelated unmigrated responsibilities may still rely on Legacy as predecessor

Legacy retirement should therefore happen responsibility by responsibility.

Once a responsibility is migrated, normal work on that responsibility should not require reopening Legacy unless re-verification or contradiction investigation is justified.

## 19. Migration records

Do not require a global migration registry by default.

When a migration decision needs to be preserved, record only what is necessary to understand:

- what semantic responsibility moved
- what claims were admitted
- what evidence class and provenance supported them
- what limitations or exclusions remain
- what Legacy difference, if any, was intentionally accepted

This information may live close to the canonical data, evidence notes, focused documentation, or tests when that is sufficient.

Create broader migration tooling only if repeated work demonstrates a concrete need.

## 20. Practical migration test

Before migrating a Legacy-derived claim, ask:

1. What semantic responsibility is actually moving?
2. What exact claim is needed by the current slice?
3. Is Legacy authoritative predecessor for that still-unmigrated responsibility?
4. What A or B evidence supports the claim?
5. Will that evidence remain traceable without Legacy?
6. Is any relation being inferred rather than supported?
7. Is localization being mistaken for semantics?
8. Is a Legacy output being used as evidence rather than as a diagnostic?
9. Is the task pulling in unrelated data or infrastructure only because Legacy already had it?
10. Can the new responsibility operate normally without Legacy after admission?

If the claim cannot pass the relevant questions, do not fill the gap by inference. Keep the unresolved portion outside canonical admission and continue with the smallest independently valid slice.
