// Presentation consumes only the generated public Skin records and approved URL map.
// It does not derive identity, ownership, order, or publication status.
export function selectSkinFullarts(consumer, heroId, publicAssets) {
  if (!Number.isSafeInteger(heroId)) throw new Error('Skin presentation requires a valid Hero endpoint');
  if (!consumer || Object.keys(consumer).sort().join('|') !== 'schemaVersion|skins'
    || consumer.schemaVersion !== 1 || !Array.isArray(consumer.skins)) throw new Error('Unsupported Skin Generated consumer schema');
  if (!publicAssets || Object.keys(publicAssets).sort().join('|') !== 'assets|schemaVersion'
    || publicAssets.schemaVersion !== 1 || !Array.isArray(publicAssets.assets)) throw new Error('Unsupported public Skin Asset map schema');
  const seenSkins = new Set();
  for (const row of consumer.skins) {
    if (!row || Object.keys(row).sort().join('|') !== 'heroId|skinId|sourceOrder'
      || !Number.isSafeInteger(row.skinId) || !Number.isSafeInteger(row.heroId)
      || !Number.isSafeInteger(row.sourceOrder) || row.sourceOrder < 1 || seenSkins.has(row.skinId)) {
      throw new Error('Malformed or duplicate Skin Generated consumer record');
    }
    seenSkins.add(row.skinId);
  }
  const paths = new Map();
  const usedUrls = new Set();
  for (const asset of publicAssets.assets) {
    if (!asset || Object.keys(asset).sort().join('|') !== 'imageUrl|skinId'
      || !Number.isSafeInteger(asset.skinId) || !seenSkins.has(asset.skinId)
      || typeof asset.imageUrl !== 'string' || !/^\.\/assets\/skins\/[a-zA-Z0-9._-]+\.webp$/.test(asset.imageUrl)
      || paths.has(asset.skinId) || usedUrls.has(asset.imageUrl)) {
      throw new Error('Malformed or duplicate approved Skin Asset URL mapping');
    }
    paths.set(asset.skinId, asset.imageUrl);
    usedUrls.add(asset.imageUrl);
  }
  const selected = [...consumer.skins]
    .filter((row) => row.heroId === heroId && paths.has(row.skinId))
    .sort((left, right) => left.sourceOrder - right.sourceOrder);
  return selected.map((row, index) => ({
    skinId: row.skinId,
    heroId: row.heroId,
    sourceOrder: row.sourceOrder,
    imageUrl: paths.get(row.skinId),
    accessibleLabel: `영웅 스킨 일러스트 ${index + 1} / ${selected.length}`,
  }));
}

export function sortPresentationFixture(rows) {
  if (!Array.isArray(rows) || rows.some((row) => !Number.isSafeInteger(row?.sourceOrder))) {
    throw new Error('Skin presentation fixture has an invalid source order');
  }
  return [...rows].sort((left, right) => left.sourceOrder - right.sourceOrder);
}
