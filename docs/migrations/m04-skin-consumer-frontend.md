# M04 — Skin consumer build publication and frontend review

## Decision and scope

M04 starts from Main `0b2949cd7ec2526e4c576095c2f632d5e81f2bd3` and preserves the M01 Identity, M02 Ownership and Source Order, and M03 Generated owners. The Generated Skin consumer contains only `skinId`, `heroId`, and `sourceOrder` for Skin IDs 102–105.

Responsibility A is admitted: publish the existing M03 Generated JSON through the existing static Build allowlist at `generated/skin-consumer.v1.json`. This file is an exact projection of the M03 output and contains four records only. Canonical and Evidence directories remain excluded from the public artifact.

Responsibility B is `MANUAL_REVIEW`. The current Hero page has Korean Hero names, portraits, rarity, origin, class and other supported presentation sections, but the Skin Generated consumer has only numeric Skin IDs, Hero IDs, and a fixed historical Source Order. The inspected Target contains no Skin display Localization or Skin Asset owner. A numeric ID list would not give the game-guide user an understandable description of each Skin; rendering the Chinese source names, guessing Korean names, showing an unrelated image, or presenting Source Order as release/UI order would exceed the verified presentation data and semantic boundary.

No Frontend file is changed in this slice. Reopen Responsibility B when a separately verified Skin display label and/or Skin Asset is available, with an approved display condition and a decision about how the fixed-snapshot Source Order should be described. Until then the M03 data is published for a future verified consumer but is not rendered in the Hero card.

## Responsibility A — Generated to Build

`tools/build.mjs` includes `generated/skin-consumer.v1.json` in the existing explicit static-publication allowlist. Its Build preflight continues to run the independent M03 validator. The JSON keeps the M03 schema and exact four tuples `(102,1,1)`, `(103,1,2)`, `(104,1,3)`, and `(105,1,4)`.

The field `sourceOrder` remains the one-based position in the pinned historical source array. It is not a release chronology, UI sorting rule, or future population claim. No Canonical, Evidence, source projection, or extra Generated file is published.

`tools/test-build.mjs` verifies the exact public payload, inclusion in the allowlist, byte-for-byte Build parity, and failure when the packaged Skin JSON is missing or altered. It also serves the built directory on loopback and Fetches the exact JSON path, checking HTTP 200, schema/population, HTTP 404 for a nonexistent path, and HTTP 404 for Canonical and Evidence paths. Existing public-directory checks continue to cover extra or missing files, unexpected directories, non-regular files, and incorrect bytes. The existing CI already runs `tools/test-build.mjs`, so no workflow change is needed.

## Responsibility C — validation and hosted QA handoff

Build and local publication-path validation can be completed in the M04 branch. Existing Browser Smoke can confirm the current site still starts and its existing flows still work, but it cannot establish a Skin UI result because no Skin UI is introduced. Hosted verification after Main integration must confirm that the exact JSON URL returns HTTP 200 and the four-record schema, and inspect the deployed response's cache/update behavior; it must not be described as visible Skin UI completion.

Responsibility A: `M04_A_COMPLETE` after Build/publication checks pass.

Responsibility B: `MANUAL_REVIEW`; no Skin UI completion claimed.

Responsibility C: local Build/publication-path checks can pass for A; Skin-specific Frontend Preflight, hosted cache/update behavior, and Browser UI are `NOT_RUN` pending a reviewable Skin presentation design and separate Main integration. Main CI, Pages, and hosted checks remain separate integration gates.

## Changed paths and handoff

Expected paths are `tools/build.mjs`, `tools/test-build.mjs`, and this migration record. Expected and actual paths must match before PR creation. M01–M03 Canonical, Evidence, Generated semantics, Frontend, assets, and Pages workflow remain unchanged.

This is a partial M04 implementation. It does not meet `M04_BRANCH_COMPLETE` while Responsibility B remains in `MANUAL_REVIEW`. No merge, deployment, localization admission, asset admission, or M05 work is part of this branch task.
