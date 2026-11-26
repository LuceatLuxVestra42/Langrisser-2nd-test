import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { loadPublicNormalSoldierLocalization, parseNormalSoldierSource, validateNormalSoldierKoLocalization } from './validate-normal-soldier-ko-localization.mjs';

const sourcePath = 'evidence/localization/source/normal-soldier-names-ko.v1.txt';
const evidencePath = 'evidence/localization/normal-soldier-names-ko.v1.json';
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const [soldiers, canonical, evidence, manifest, rawSource, spBytes] = await Promise.all([
  read('canonical/soldiers.v1.json'),
  read('canonical/normal-soldier-localizations-ko.v1.json'),
  read(evidencePath),
  read('evidence/localization/source/normal-soldier-names-ko.source-manifest.v1.json'),
  readFile(sourcePath),
  readFile('evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json'),
]);
assert.equal(createHash('sha256').update(spBytes).digest('hex'), 'ba41a6a37c873a5cc6196bd3135d2b656896e808741cd2b1df56a555ab888500');
const publicIds = JSON.parse(spBytes).records.map(row => row.NormalSoliderId).sort((a, b) => a - b);
assert.equal(new Set(publicIds).size, 56);
const publicIdentities = { schemaVersion: 1, records: publicIds.map(id => ({ entity: 'Soldier', id, variant: 'NORMAL' })) };
const args = { soldiers, publicIdentities, canonical, evidence, manifest, rawSource };
const approved = [
  [806, '무녀', 149, 129], [817, '바람과 꽃을 찬송하는 자', 157, 137], [819, '산별 구조대', 159, 139],
];
const admittedIds = [...publicIds, ...approved.map(([id]) => id)].sort((a, b) => a - b);
assert.deepEqual(canonical.records.map(row => row.soldierId), admittedIds);
assert.deepEqual(evidence.records.map(row => row.soldierId), admittedIds);
const sourceRows = parseNormalSoldierSource(rawSource.toString('utf8'));
assert.deepEqual(manifest.excludedNonTargetIds, sourceRows.filter(row => !admittedIds.includes(row.id)).map(row => row.id).sort((a, b) => a - b));
for (const [id, nameKo, line, row] of approved) {
  assert.deepEqual(sourceRows.find(r => r.id === id), { id, name: nameKo, line, row });
  assert.deepEqual(evidence.records.find(r => r.soldierId === id), {
    soldierId: id, nameKo, sourceArtifact: sourcePath, sourceLocator: `SoldierID=${id}`,
    sourceLine: line, sourceRow: row, evidenceClass: 'A',
  });
  assert.deepEqual(canonical.records.find(r => r.soldierId === id), {
    soldierId: id, nameKo, evidenceClass: 'A', provenance: `${evidencePath}#SoldierID=${id}`,
  });
}
const validated = validateNormalSoldierKoLocalization(args);
assert.equal(validated.localizedCount, 59);
assert.equal(validated.excludedCount, 109);
const publicNames = (await loadPublicNormalSoldierLocalization()).normalLocalizations.records;
assert.deepEqual(publicNames.map(row => row.soldierId), publicIds);
assert.deepEqual(publicNames.map(({ soldierId, nameKo }) => [soldierId, nameKo]),
  publicIds.map(id => [id, sourceRows.find(row => row.id === id).name]));
assert.deepEqual(publicNames, validated.publicRecords);

assert.throws(() => parseNormalSoldierSource('SoldierID\t한국명\n115\t\t빈 이름'), /malformed source row/);
assert.throws(() => parseNormalSoldierSource('SoldierID\t한국명\n115\t'), /empty\/malformed Korean name/);
const fail = (change, pattern) => {
  const input = structuredClone(args);
  change(input);
  assert.throws(() => validateNormalSoldierKoLocalization(input), pattern);
};
fail(x => { x.canonical.records.pop(); }, /coverage mismatch/);
fail(x => { x.canonical.records.push({ ...x.canonical.records[0], soldierId: 999999 }); }, /coverage mismatch/);
fail(x => { x.canonical.records[1].soldierId = x.canonical.records[0].soldierId; }, /duplicate canonical ID/);
fail(x => { x.canonical.records[0].nameKo += 'X'; }, /name mismatch/);
fail(x => { x.canonical.records.find(row => row.soldierId === 806).nameKo += 'X'; }, /name mismatch 806/);
fail(x => { x.canonical.records[0].soldierId = 999999; }, /target ID set mismatch/);
fail(x => { x.canonical.records[0].soldierId = 136; }, /target ID set mismatch/);
fail(x => { x.evidence.records.pop(); }, /coverage mismatch/);
fail(x => { x.evidence.records[0].nameKo += 'X'; }, /name mismatch/);
fail(x => { x.canonical.records[0].provenance += 'x'; }, /provenance or schema mismatch/);
for (const field of ['sourceLocator', 'sourceLine', 'sourceRow']) {
  fail(x => { x.evidence.records.find(row => row.soldierId === 817)[field] = -1; }, /evidence locator or schema mismatch 817/);
}
fail(x => { x.rawSource = Buffer.from(rawSource.toString('utf8').replace('115\t', '115\t\t')); }, /source hash mismatch/);
fail(x => {
  x.rawSource = Buffer.from(rawSource.toString('utf8').replace('115\t근위창병', '115\t'));
  x.manifest.sourceSha256 = createHash('sha256').update(x.rawSource).digest('hex');
  x.manifest.sourceBytes = x.rawSource.length;
}, /source hash mismatch/);
fail(x => { x.manifest.sourceSha256 = '0'.repeat(64); }, /source provenance mismatch/);

// An admitted identity and an exact source name still require separate localization approval.
const with818 = structuredClone(args);
with818.soldiers.records.push({
  entity: 'Soldier', id: 818, variant: 'NORMAL',
  provenance: 'evidence/source/configdata/ConfigDataSoldierInfo.records-hero-15-normal-identities.v1.json#ID=818',
});
assert.deepEqual(validateNormalSoldierKoLocalization(with818), validated);
const replacement = { id: 818, name: '빛의 세인트', line: 158, row: 138 };
assert.deepEqual(sourceRows.find(row => row.id === 818), replacement);
const c = with818.canonical.records.find(row => row.soldierId === 819);
Object.assign(c, { soldierId: 818, nameKo: replacement.name, provenance: `${evidencePath}#SoldierID=818` });
const e = with818.evidence.records.find(row => row.soldierId === 819);
Object.assign(e, { soldierId: 818, nameKo: replacement.name, sourceLocator: 'SoldierID=818', sourceLine: 158, sourceRow: 138 });
with818.manifest.targetIds = with818.manifest.targetIds.map(id => id === 819 ? 818 : id).sort((a, b) => a - b);
with818.manifest.excludedNonTargetIds = with818.manifest.excludedNonTargetIds.map(id => id === 818 ? 819 : id).sort((a, b) => a - b);
for (const doc of [with818.canonical, with818.evidence]) {
  doc.records.sort((a, b) => a.soldierId - b.soldierId);
  assert.equal(doc.records.length, 59);
  assert.deepEqual(doc.records.map(row => row.soldierId), with818.manifest.targetIds);
}
assert.equal(with818.publicIdentities.records.length, 56);
assert.throws(() => validateNormalSoldierKoLocalization(with818), /manifest approved target ID set mismatch/);

process.stdout.write('NORMAL Soldier KO localization negatives: PASS (source, keys, ordering, name, locators, provenance, coherent 818 substitution)\n');
