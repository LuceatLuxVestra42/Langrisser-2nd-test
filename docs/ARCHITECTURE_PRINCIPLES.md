# Architecture Principles

## 1. Purpose

This repository is a new implementation of a Korean Langrisser Mobile information site that connects earlier China-server information with Korea-server information.

It is not a cleanup, fork, or architectural continuation of the Legacy repository.

Verified semantic knowledge and surviving evidence may be reused when they remain valid, but Legacy workflow, lifecycle, orchestration, directory topology, frontend architecture, and hosting structure are not inherited by default.

## 2. Authority boundaries

Architecture and semantic authority are separate concerns.

- The current repository state describes the current implementation.
- These architecture principles constrain how that implementation should be designed.
- Admitted evidence and authoritative source semantics support game-specific claims within their scope.

Existing code is not automatically correct architecture or semantic truth. If implementation conflicts with an applicable architectural or semantic authority, investigate the conflict instead of treating the implementation as self-justifying.

Historical plans, checkpoints, status documents, Stage labels, or generated outputs do not define current implementation state.

## 3. Logical data flow

Use the following logical responsibility boundaries:

```text
Raw Source
  ↓
Evidence / Semantic Decision
  ↓
Canonical
  ↓
Generated
  ↓
Presentation
```

These are responsibility boundaries, not mandatory directories, services, registries, managers, or lifecycle states.

Do not create infrastructure merely to mirror this diagram.

### Raw Source

Raw sources preserve external or upstream information used for ingestion, investigation, comparison, or re-verification.

Raw source presence does not by itself admit a claim into canonical data.

### Evidence / Semantic Decision

This layer determines what a source actually supports, within what scope, and with what limitations.

Identity, facts, and relations must not be created from unsupported inference.

### Canonical

Canonical data contains admitted semantic claims used by the project.

Canonical data should express identity, facts, relations, and scope explicitly enough that downstream consumers do not need to reinterpret raw sources.

### Generated

Generated output is derived from canonical data.

Generated output must be deterministic, reproducible, replaceable, and regenerable. It is never semantic authority.

### Presentation

Presentation consumes admitted canonical or generated data.

Presentation may decide how information is displayed, filtered, sorted, searched, or navigated, but it must not invent identity, reconstruct semantic relations, or reinterpret raw sources.

## 4. No inferred identity or relations

Prefer explicit identifiers, source fields, and verified relation evidence.

Do not create identity or relations from:

- name matching
- filename similarity
- ID arithmetic or numeric proximity
- screen order, sort order, or UI position
- guessed missing values
- historical generated output
- unsupported fallback behavior

An identifier is not globally canonical merely because it is numeric or stable-looking. Its meaning and source scope must be understood before it is used as canonical identity.

## 5. Scope-aware semantics

Facts may differ by server, version, time, source family, or release state.

Where those differences matter, represent the scope explicitly rather than collapsing them into one unqualified current truth.

Do not mechanically add scope to every field. Add it when omission would make the claim ambiguous or incorrect.

Localization is not semantic authority by default:

- display localization chooses presentation text
- localized semantic description expresses meaning for users
- canonical semantic rules and values require their own evidence

Do not derive canonical numbers, identity, or relations from translated text without evidence review.

## 6. Canonical population and presentation eligibility

Canonical population and presentation eligibility are separate responsibilities.

A record may exist canonically while being omitted from a particular list, filter, navigation surface, or release-oriented view.

Presentation decisions must not be interpreted as canonical deletion or relation removal.

Likewise, changing a filter must not silently mutate canonical population.

## 7. Generated and frontend boundaries

Normal production work should consume canonical data and deterministic generated outputs without requiring Legacy or raw external sources.

A production path should normally resemble:

```text
canonical/internal validation
  ↓
generation
  ↓
generated validation
  ↓
frontend build
```

Re-verification and ingestion may require original source material, but routine rendering should not.

Frontend code must not:

- perform raw-source semantic JOINs
- infer relations from names or ID patterns
- silently fall back to historical output
- repair missing semantic data by guessing
- promote localization text into semantic truth

If the frontend needs semantic knowledge that is not already represented upstream, that is a signal to resolve the semantic responsibility before adding presentation logic.

## 8. Small executable slices

Do not build the entire future architecture before the first working domain slice exists.

Prefer a small end-to-end slice such as:

```text
small Hero set
→ verified identity
→ display localization
→ one or two simple facts
→ portrait
→ local validation
→ generated consumer
→ minimal UI
```

Relations are optional when the slice does not need them.

The purpose of the first slice is to prove responsibility boundaries and data flow, not domain completeness.

Do not add unrelated subsystems merely because they may be useful later.

## 9. Tooling and abstraction threshold

Create a tool or abstraction when current work demonstrates a need for repeatability, correctness, reproducibility, or reduced maintenance burden.

Do not prebuild generic infrastructure for hypothetical future requirements.

In particular, do not introduce by default:

- global owner registries
- changed-path routing systems
- global validator graphs
- Stage / Freeze / promotion lifecycles
- Project Check / Status Source clones
- checkpoint graphs
- generic Doctor / Runner frameworks
- central source registries without a demonstrated need

Local ownership and executable validation are allowed where useful. Local structure does not imply global orchestration.

## 10. Validation principles

A validator proves only what it explicitly checks.

Validator success does not:

- create semantic meaning
- improve weak provenance
- convert unsupported inference into evidence
- make generated output authoritative

Validation should stay close to the responsibility it checks.

When failures occur, return to the responsible layer instead of reopening unrelated upstream work.

Examples:

```text
semantic identity problem → semantic/evidence responsibility
generated parity problem  → generation responsibility
asset resolution problem  → asset responsibility
build problem             → frontend/build responsibility
hosted route problem      → deployment/hosting responsibility
interaction problem       → browser/UI responsibility
```

Do not use a presentation or hosting failure as a reason to reopen settled semantic work unless new evidence actually contradicts that semantic claim.

## 11. Source changes and canonical mutation

A source being added, changed, or removed is an observation.

It does not automatically imply a canonical mutation.

In particular:

```text
source absence
≠ entity nonexistence
≠ canonical deletion
```

Canonical additions, changes, and especially removals require a semantic decision based on the meaning of the source and the available evidence.

## 12. Reopening completed semantics

Do not reopen completed semantic work merely because:

- the evidence is old
- a newer snapshot exists
- a filename changed
- a directory changed
- an artifact format changed
- presentation wording changed
- localization changed

Reopen only the affected semantic responsibility when newer authoritative evidence creates a material contradiction in identity, relation, game rule/value, or meaningful scope.

Reopening should be local to the affected responsibility, not a global lifecycle event.

## 13. Legacy boundary

Legacy may remain a useful predecessor for semantic responsibilities that have not yet been migrated.

Reuse from Legacy is selective.

Potentially reusable:

- verified semantic claims
- traceable evidence chains
- explicit ID or relation evidence
- source interpretation knowledge
- localization results
- rejected hypotheses and negative evidence
- comparison outputs used as migration diagnostics

Not inherited by default:

- directory topology
- schemas merely because Legacy used them
- Stage / Freeze / Status systems
- owner topology
- validator orchestration
- frontend framework
- routing architecture
- asset pipeline
- hosting architecture
- checkpoint or promotion lifecycle

A Legacy implementation technique should be adopted only when current requirements independently justify it.

## 14. Repository bootstrap constraint

During bootstrap, keep the repository intentionally small.

The initial architecture baseline does not require:

- `canonical/`
- `generated/`
- `tools/`
- `validators/`
- an asset pipeline
- ConfigData snapshots
- Legacy migration data
- a frontend application
- a framework choice

These should appear only when an executable slice demonstrates a concrete need.

Bootstrap documentation is an exception to the normal rule that detailed documents refine existing implementation: at this stage the documents establish the initial constraints before repository-dependent architecture exists.

## 15. Design test

Before adding a new subsystem, ask:

1. What current responsibility requires it?
2. What concrete problem does it solve now?
3. Could the current slice be completed correctly without it?
4. Does it preserve Source → Evidence → Canonical → Generated → Presentation boundaries?
5. Does it avoid importing Legacy structure merely because it already exists?

If the answer does not demonstrate a present need, defer the subsystem until a later slice.
