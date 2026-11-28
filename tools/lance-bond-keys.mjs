import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

export const materialPath = 'canonical/hero-fetter-material-relations.v1.json';
export const keyDecisionPath = 'docs/decisions/hero-16-minimal-bond-key-icons-publication.v1.json';
const evidence = 'evidence/source/bonds/hero16-fetter-gold.v1.json';
const namespace = 'ConfigDataHeroFetterInfo.ID';
const slots = [
  { slot: 0, fetterId: 71, recordIndex: 70 },
  { slot: 1, fetterId: 72, recordIndex: 71 },
  { slot: 2, fetterId: 73, recordIndex: 72 },
];
const levels = [2,3,4,5,6,7,8,9,10];
// Individually reviewed LevelUpMaterials vectors, in source order within each level.
const vectors = [
  [[3200,2,[1,2,3,4,5,6,7,8,9]], [3201,6,[1,2,3,4,5]]],
  [[3200,2,[5,6,7,8]], [3201,2,[2,3,4,5,7,9,11,13,15]], [3202,6,[1,2,3,4,6]]],
  [[3201,2,[5,8,10,12,15]], [3202,2,[2,3,3,4,5,6,7,8,9]], [3203,7,[1,2,3,4]]],
];
export const lanceMaterialRows = vectors.map(group => levels.flatMap(Level =>
  group.filter(([,start,counts]) => Level >= start && Level < start + counts.length)
    .map(([ItemId,start,counts]) => ({ Level, ItemType:6, ItemId, Count:counts[Level-start] }))));

const relations = slots.map(({slot,fetterId,recordIndex}) => lanceMaterialRows[slot].map((row, sourceArrayIndex) => ({
  heroId:16, endpointKind:'FETTER', endpointId:fetterId, endpointNamespace:namespace,
  sourceRecordLocator:'data/configdata/ConfigDataHeroFetterInfo.json#/' + recordIndex,
  sourceField:'LevelUpMaterials', sourceArrayIndex, targetLevel:row.Level, itemType:row.ItemType, itemId:row.ItemId,
  itemNamespace:'ConfigDataItemInfo.ID', rawDetailProvenance:evidence + '#/endpoints/' + slot,
})));

const lianaScope = 'Hero 15 Fetter/Heart Fetter material item endpoint references and LevelUpGold array locators only; no item identity, cost execution, or publication.';
export function lianaMaterialInput(doc) {
  assert.deepEqual(Object.keys(doc).sort(), ['goldLocators','itemEndpoints','materials','schemaVersion','scope']);
  assert.equal(doc.schemaVersion, 1);
  assert.equal(doc.scope, lianaScope + ' Hero 16: FETTER 71, 72, 73 material relations only.');
  assert.deepEqual(doc.materials.slice(104), relations.flat(), 'Lance shared material relations');
  const materials = doc.materials.slice(0,104);
  const liana = materials.concat(doc.goldLocators, doc.itemEndpoints);
  // Original 104 relations, 54 locators and 18 endpoints in their admitted order.
  assert.equal(createHash('sha256').update(JSON.stringify(liana)).digest('hex'),
    'db202d4f8995daf239935946f9112c7505058bd0ceacf383d06c83aff0bf375b', 'Liana material owner projection');
  assert.deepEqual([materials.length,doc.goldLocators.length,doc.itemEndpoints.length], [104,54,18]);
  return { ...doc, scope:lianaScope, materials };
}

export function readLanceKeyDisplay({references, details, materials, decision}, assets) {
  assert.ok(decision, 'Lance key publication decision missing');
  assert.deepEqual([decision.schemaVersion, decision.status, decision.heroId, decision.surface],
    [1,'APPROVED',16,'hero-minimal-detail-16'], 'Lance key publication target');
  assert.deepEqual(decision.groups, slots, 'Lance key publication groups');
  assert.deepEqual(decision.levels, levels, 'Lance key publication levels');
  assert.deepEqual(decision.placement, ['after-level-gold','immediately-below-group-gold-total'], 'Lance key publication placement');
  assert.deepEqual(decision.assets, assets, 'Lance key publication assets');
  assert.deepEqual([decision.configCommit,decision.legacyCommit,decision.manifest],
    ['6475e63ee23d18adf733756c26a14fa9e3ed662c','57fb1b1262f475d24a3ddd8dc0d5883c2eabe4ff','data/generated/hero-bond-material-icon-assets.v1.json'], 'Lance key publication sources');

  return slots.map(({slot,fetterId}) => {
    const label = 'Lance FETTER ' + fetterId;
    const refs = references.filter(r => r.heroId === 16 && r.fetterId === fetterId);
    assert.deepEqual(refs.map(r => [r.referenceKind,r.heroInformationId,r.sourceField,r.endpointNamespace,r.provenance]),
      [['HERO_FETTER_ID_REFERENCE',16,'ConfigDataHeroInformationInfo.HeroFetters_ID',namespace,evidence+'#/information/fields/HeroFetters_ID/'+slot]], label + ' key reference');
    const detail = details.find(r => r.heroId === 16 && r.endpointId === fetterId);
    assert.ok(detail?.detailKind === 'FETTER_RAW_DETAIL' && detail.endpointNamespace === namespace
      && detail.sourceRecordLocator === relations[slot][0].sourceRecordLocator && detail.provenance === evidence+'#/endpoints/'+slot, label + ' key detail attribution');
    const rows = detail.fields.LevelUpMaterials;
    assert.deepEqual(rows, lanceMaterialRows[slot], label + ' key material counts or source rows');
    const selected = materials.materials.filter(r => r.heroId === 16 && r.endpointId === fetterId);
    assert.deepEqual(selected, relations[slot], label + ' material relation attribution or locator');
    const totals = new Map();
    for (const {ItemId, Count} of rows) totals.set(ItemId, (totals.get(ItemId) ?? 0) + Count);
    for (const id of totals.keys()) {
      const endpoint = materials.itemEndpoints.filter(r => r.itemId === id && r.itemType === 6);
      assert.deepEqual(endpoint.map(r => [r.endpointNamespace,r.sourceRecordLocator]),
        [['ConfigDataItemInfo.ID','ConfigDataItemInfo#ID='+id]], label + ' key item endpoint');
    }
    return { levels:levels.map(level => rows.filter(r => r.Level === level).map(r => [r.ItemId,r.Count])), totals:[...totals] };
  });
}
