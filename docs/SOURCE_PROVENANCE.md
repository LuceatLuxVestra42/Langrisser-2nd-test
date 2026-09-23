# Source Provenance

## 1. Purpose

This document defines how source material, preserved evidence, prior validated claims, localization references, and unresolved or rejected findings support semantic claims in this repository.

It refines the Project Instructions and `ARCHITECTURE_PRINCIPLES.md`.

It does not define repository lifecycle, promotion stages, global ownership, migration completion, or game-specific truth.

The goal is simple:

```text
a semantic claim
→ traceable support
→ explicit scope and limitations
→ canonical admission only when justified
```

## 2. Provenance is claim-scoped

Provenance exists to support a claim.

A source, file, snapshot, table, or artifact is not authoritative merely because it is preserved, named `evidence`, historically important, or previously marked final.

The relevant question is:

> What exact claim does this material support, in what scope, and through what interpretation?

One source may support several claims, but the reference must not be stretched beyond what the source actually establishes.

Likewise, one claim may depend on several sources or preserved artifacts.

Provenance need not be duplicated mechanically per field when multiple fields genuinely share the same support. Shared provenance is acceptable when its supported scope remains clear.

## 3. Minimum traceability

A semantic claim should preserve enough information to reconstruct why it was accepted.

As needed for the claim, provenance should identify:

- source family or preserved artifact
- snapshot, version, date, commit, or equivalent source state
- locator to the relevant record, field, row, key, section, or other specific source position
- interpretation or transformation applied
- semantic scope supported
- known limitation or unresolved boundary

Not every claim requires every metadata field.

Use the minimum information that keeps the claim non-circular and re-checkable.

A URL alone may be insufficient if the relevant version or record cannot be identified later.

A copied value alone is insufficient if its origin and meaning cannot be reconstructed.

## 4. Evidence classes

For practical review, evidence may be described with the following four classes.

These classes describe the quality and state of support for a claim. They are not lifecycle stages, promotion states, repository directories, or workflow requirements.

### A — Direct evidence

Use A when the current claim can be traced directly to source material or a preserved source artifact with enough detail to inspect the supporting evidence.

Typical characteristics:

- source identity is known
- relevant snapshot or source state is known where needed
- locator is available
- source field or explicit relation is inspectable
- interpretation is stated when the source is not self-explanatory
- claim scope is clear

A does not mean the source is globally authoritative for every semantic responsibility.

It means the specific claim has direct traceable support.

### B — Inherited validated claim

Use B when a prior validated semantic claim is being reused without reopening the complete raw-source investigation.

B is allowed when all of the following are sufficiently clear:

- the claim itself is explicit
- canonical identity and semantic scope are unambiguous
- a non-circular provenance anchor exists
- the prior evidence or validation chain is traceable
- the prior validation is relevant to the claim being reused
- no known authoritative contradiction invalidates the claim
- limitations of the inherited support are recorded where material

B does not require re-fetching or re-decoding every original raw source.

However, the following are not enough by themselves:

- `PASS`
- `FROZEN`
- `COMPLETE`
- a Stage number
- a checkpoint
- a final-looking filename
- generated output
- a statement that the Legacy repository used the value

Predecessor status alone is not admission evidence. A B claim is reusable because its traceable, non-circular evidence and validation chain satisfies the conditions above.

### C — Unsupported assertion

Use C when a claim exists but its supporting evidence chain is missing, circular, ambiguous, or too weak to justify canonical admission.

Examples:

- a value copied from generated output with no upstream support
- an identity based only on matching names
- a relation preserved only as a conclusion with no traceable basis
- a claim whose supposed provenance is another derived artifact that ultimately points back to the claim itself
- an unexplained value whose original source and meaning cannot be reconstructed

C may remain as a research note or unresolved candidate.

Do not silently promote C into canonical data.

### D — Contradicted claim

Use D when authoritative evidence materially contradicts the claim within the relevant scope.

A contradiction may concern:

- identity
- relation
- game rule or numeric value
- server/version/time scope
- source semantics

D should record the conflicting evidence and affected scope clearly enough that the contradiction can be resolved without reopening unrelated responsibilities.

A display wording difference, filename difference, directory change, or presentation-only change is not by itself a D-level semantic contradiction.

## 5. Evidence class is not source rank

A/B/C/D classifies the support state of a claim. It does not create a universal ranking of source families.

For example:

- an official game data field may directly support one claim but not another
- a localization reference may directly support display text while providing no support for identity
- a preserved Legacy investigation may be B-quality support for one semantic claim and C-quality for another
- an external Wiki may be useful for cross-checking while remaining non-canonical for the claim under review

Evaluate source authority within the semantic responsibility and scope being claimed.

## 6. Source families and source semantics

Before using a source, understand what that source represents.

Important distinctions may include:

- China server vs Korea server
- current vs historical snapshot
- runtime/configuration data vs display/localization data
- released content vs unreleased content
- canonical game data vs editorial presentation
- source record vs derived/generated output
- official source vs community reference
- preserved evidence artifact vs live upstream source

Do not combine facts from different source scopes into one unqualified value unless the semantic decision explicitly justifies the merge.

Source meaning matters more than filename or storage location.

## 7. Locators

A locator identifies the part of a source that actually supports a claim.

Depending on the source, a locator may be:

- explicit object ID
- record key
- field name
- table and row
- JSON path
- source filename plus stable identifier
- commit plus file and line/record
- page and section
- URL plus source-native record identifier

Prefer semantic locators over fragile presentation positions.

Do not rely on:

- screen order
- list position
- alphabetical position
- filename similarity
- unnamed array position

when a stable source-native locator exists.

## 8. Interpretation and transformation provenance

Some sources do not directly state the final canonical claim.

When interpretation is required, record enough of the reasoning to distinguish source fact from project interpretation.

Examples include:

- a source field whose meaning was established through runtime or code inspection
- a source-native enum mapped to a semantic label
- several explicit fields combined into one canonical fact
- localized text derived from a confirmed source string
- a relation extracted from an explicit relation table

Transformation provenance should identify the meaningful operation, not reproduce every mechanical processing step.

Do not hide semantic inference inside a parser, generator, validator, or frontend transformation.

If a transformation creates new semantic meaning, it belongs in evidence/semantic decision rather than downstream generation.

## 9. Identity and relation evidence

Identity and relations require explicit support.

Preferred evidence includes:

- source-native identifiers whose meaning is verified
- explicit foreign keys
- explicit relation records
- source fields documented or otherwise validated to represent the relation
- preserved prior evidence chains that satisfy B requirements

Do not establish identity or relations from:

- matching display names
- translated-name equality
- filename similarity
- ID arithmetic
- numeric range assumptions
- UI or sort order
- adjacency
- missing-value guessing
- historical generated output alone

A lookup or index may locate records but does not create semantic identity or relation meaning merely because references exist in both directions.

## 10. Localization evidence

Localization evidence supports display or localized description within its documented scope.

It does not automatically establish:

- canonical identity
- canonical population
- semantic relation
- release state
- numeric rule or parameter
- server-independent game truth

A localization record should preserve confirmed and provisional states when that distinction matters.

Do not convert an unofficial or temporary translation into a confirmed Korea-server display name merely because the source object itself is known.

If official Korea-server display text or a reviewed project localization source materially contradicts an existing localization value, resolve that issue in localization scope unless the contradiction also affects semantics.

## 11. Negative evidence and rejected hypotheses

Preserve useful rejected hypotheses when they are likely to prevent repeated mistakes.

A negative evidence note should normally state:

- rejected hypothesis
- scope in which it was tested
- reason it was rejected
- supporting counterexample or evidence when available

Examples include rejected assumptions based on:

- fixed ID offsets
- name equality
- screen order
- incomplete relation tables being treated as complete
- inferred enum meaning
- unsupported fallback behavior

Negative evidence is a guardrail, not a lifecycle state.

It should not become a global registry unless repeated real use demonstrates the need for one.

## 12. Generated output, reports, and status artifacts

Generated output, reports, checkpoints, dashboards, PASS records, readiness summaries, and status projections may preserve useful historical context.

They do not create semantic authority by themselves.

They may be used as:

- comparison fixtures
- migration diagnostics
- regression expectations
- pointers to prior investigations
- evidence-chain anchors when they lead to non-circular supporting material

Do not use them as the sole basis for admitting semantic claims.

## 13. External references

Official sources, Wikis, community databases, existing Korean resources, spreadsheets, and other external references may be useful for:

- discovery
- cross-checking
- localization confirmation
- contradiction detection
- identifying source gaps

Their role must match the claim being supported.

An external reference does not override authoritative source semantics merely because it is easier to read or already localized.

When external material is only corroborative, record it as corroboration rather than silently promoting it to primary authority.

## 14. Raw source retention

Traceable evidence does not require copying every raw source into the production repository.

External Source Store, preserved snapshots, or other authorized storage may support ingestion, investigation, or re-verification.

Evidence supporting admitted canonical claims must remain traceable without requiring the Legacy repository.

This does not require copying every raw source into the production repository.

Normal canonical validation, generation, generated validation, and frontend build should not depend on raw external sources. If a process requires raw source material, classify it as ingestion, investigation, or re-verification, or redesign the dependency rather than hiding it behind a fallback.

## 15. Source change and re-verification

A newer source snapshot does not automatically invalidate previously admitted claims.

Re-verification is warranted when:

- the current task requires source-level confirmation beyond the existing admitted evidence
- the source semantics changed
- authoritative evidence creates a material contradiction
- existing provenance is too weak to support a required current claim

Do not reopen unrelated claims merely because a newer snapshot exists.

Source ADDED / CHANGED / REMOVED observations do not automatically imply canonical additions, mutations, or deletions.

## 16. Admission test

Before admitting a semantic claim, verify the smallest relevant set of questions:

1. What exact claim is being admitted?
2. What identity does the claim apply to?
3. What source or preserved evidence supports it?
4. Is the support A or B quality?
5. What locator or provenance anchor makes the support traceable?
6. What interpretation, if any, turns the source into the claim?
7. What server/version/time/source scope applies?
8. Are there known contradictions or material limitations?
9. Is the claim being admitted semantically, or is it only localization/presentation information?

If these questions cannot be answered well enough for the claim, keep it unresolved rather than filling the gap by inference.

## 17. Practical rule

Use the lightest provenance structure that keeps semantic claims traceable and non-circular.

Do not build a central evidence framework merely because this document defines provenance rules.

Start with the needs of the current executable slice, preserve what is required to justify its claims, and add structure only when repeated work demonstrates a concrete need.
