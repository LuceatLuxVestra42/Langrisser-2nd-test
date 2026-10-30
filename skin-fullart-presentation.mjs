// Presentation-only mapping from admitted Skin IDs to approved public WebP assets.
// Identity, ownership and source order remain owned by the Generated consumer.
export const skinFullartPathById = Object.freeze({
  102: './assets/skins/skin-102.webp',
  103: './assets/skins/skin-103.webp',
  104: './assets/skins/skin-104.webp',
  105: './assets/skins/skin-105.webp',
});

const expectedRows = [
  { skinId: 102, heroId: 1, sourceOrder: 1 },
  { skinId: 103, heroId: 1, sourceOrder: 2 },
  { skinId: 104, heroId: 1, sourceOrder: 3 },
  { skinId: 105, heroId: 1, sourceOrder: 4 },
];

export function selectSkinFullarts(consumer, heroId, assetPaths = skinFullartPathById) {
  if (!Number.isSafeInteger(heroId)) throw new Error('Skin presentation requires a valid Hero endpoint');
  if (!consumer || Object.keys(consumer).sort().join('|') !== 'schemaVersion|skins'
    || consumer.schemaVersion !== 1 || !Array.isArray(consumer.skins)) {
    throw new Error('Unsupported Skin Generated consumer schema');
  }
  const rows = consumer.skins;
  if (rows.length !== expectedRows.length) throw new Error('Skin Generated consumer population mismatch');
  const seen = new Set();
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row || Object.keys(row).sort().join('|') !== 'heroId|skinId|sourceOrder'
      || !Number.isSafeInteger(row.skinId) || !Number.isSafeInteger(row.heroId) || !Number.isSafeInteger(row.sourceOrder)
      || seen.has(row.skinId)) throw new Error('Malformed or duplicate Skin Generated consumer record');
    seen.add(row.skinId);
    const expected = expectedRows[index];
    if (row.skinId !== expected.skinId || row.heroId !== expected.heroId || row.sourceOrder !== expected.sourceOrder) {
      throw new Error('Skin Generated consumer differs from the admitted M01/M02 population');
    }
  }
  if (!assetPaths || Object.keys(assetPaths).sort().join('|') !== '102|103|104|105'
    || new Set(Object.values(assetPaths)).size !== 4
    || Object.entries(assetPaths).some(([id, path]) => path !== `./assets/skins/skin-${id}.webp`)) {
    throw new Error('Skin asset URL mapping is malformed or duplicated');
  }
  if (seen.size !== Object.keys(assetPaths).length) throw new Error('Skin asset mapping population mismatch');
  return orderSkinPresentationRows(rows.filter((row) => row.heroId === heroId))
    .map((row, index, selected) => ({
      skinId: row.skinId,
      heroId: row.heroId,
      sourceOrder: row.sourceOrder,
      imageUrl: assetPaths[row.skinId],
      accessibleLabel: `영웅 스킨 일러스트 ${index + 1} / ${selected.length}`,
    }));
}

export function sortPresentationFixture(rows) {
  return orderSkinPresentationRows(rows);
}

function orderSkinPresentationRows(rows) {
  if (!Array.isArray(rows) || rows.some((row) => !Number.isSafeInteger(row?.sourceOrder))) {
    throw new Error('Skin presentation fixture has an invalid source order');
  }
  return [...rows].sort((left, right) => left.sourceOrder - right.sourceOrder);
}
