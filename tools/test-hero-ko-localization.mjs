import assert from 'node:assert/strict';
import {
  parseHeroLocalizationSource,
  readHeroKoLocalizationInputs,
  validateHeroKoLocalization,
} from './validate-hero-ko-localization.mjs';

const args = await readHeroKoLocalizationInputs();
const result = validateHeroKoLocalization(args);
assert.deepEqual(result, {
  localizedCount: 3,
  heroIds: [5, 6, 8],
  officialKrProvenanceStatus: 'unverified',
});

assert.throws(() => parseHeroLocalizationSource('甲 - 갑\n甲 - 을'), /duplicate Chinese localization key/);
assert.throws(() => parseHeroLocalizationSource('not a delimited record'), /malformed localization source row/);
const rejected = (label, edit, pattern) => {
  const input = structuredClone(args);
  edit(input);
  assert.throws(() => validateHeroKoLocalization(input), pattern, label);
};

rejected('wrong Hero ID', x => { x.canonical.records[0].heroId = 999; }, /Hero ID set\/order mismatch/);
rejected('duplicate Hero ID', x => { x.canonical.records[1].heroId = 5; }, /Hero ID set\/order mismatch|duplicate canonical Hero ID/);
rejected('extra Hero ID', x => { x.canonical.records.push({ ...x.canonical.records[0], heroId: 9 }); }, /coverage mismatch/);
rejected('missing localization', x => { x.canonical.records.pop(); }, /coverage mismatch/);
rejected('Korean display value changed', x => { x.canonical.records[0].nameKo += 'X'; }, /canonical localization\/provenance mismatch/);
rejected('Chinese key mismatch', x => { x.evidence.records[0].nameCn = '马修'; }, /source\/evidence localization mismatch/);
rejected('direct ConfigData name mismatch', x => { x.heroInfoRecords[0].Name = '马修'; }, /ConfigData Chinese Name mismatch/);
rejected('Hero absent from identity owner', x => { x.heroIdentities.records = x.heroIdentities.records.filter(row => row.heroId !== 5); }, /Hero identity population count changed/);
rejected('localization for non-admitted Hero', x => { x.evidence.records[0].heroId = 999; }, /duplicate evidence Hero ID|localization missing for Hero 5/);
rejected('source evidence omission', x => { x.evidence.records.pop(); }, /evidence coverage mismatch/);
rejected('reference bytes changed', x => { x.sourceText += '\n甲 - 갑'; }, /source hash or byte count mismatch/);
rejected('direct ConfigData records duplicated', x => { x.heroInfoRecords[1].ID = 5; }, /record ID set or order mismatch|duplicate direct ConfigData Hero ID/);
rejected('identity duplicate', x => { x.heroIdentities.records[0].heroId = 5; }, /duplicate Hero identity ID/);

process.stdout.write('Hero Korean localization negatives: PASS (wrong/duplicate/extra/missing ID, source key/value mismatch, identity endpoint, source/evidence parity)\n');
