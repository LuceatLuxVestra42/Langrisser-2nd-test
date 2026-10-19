import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const TALENT_STARS = [3, 4, 5, 6];
const TALENT_HERO_IDS = new Set([6, 8]);

function validateTalentDescriptionMarkup(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is empty or malformed`);
  const openTag = '<font color="red">';
  const closeTag = '</font>';
  let cursor = 0;
  while (cursor < value.length) {
    const nextTag = value.indexOf('<', cursor);
    if (nextTag < 0) break;
    if (value.startsWith(openTag, nextTag)) {
      const close = value.indexOf(closeTag, nextTag + openTag.length);
      if (close < 0) throw new Error(`${label} contains an unclosed emphasis tag`);
      const content = value.slice(nextTag + openTag.length, close);
      if (!content || content.includes('<') || value.indexOf(openTag, nextTag + openTag.length) >= 0
        && value.indexOf(openTag, nextTag + openTag.length) < close) {
        throw new Error(`${label} contains nested or empty emphasis markup`);
      }
      cursor = close + closeTag.length;
      continue;
    }
    if (value.startsWith(closeTag, nextTag)) throw new Error(`${label} contains an unmatched emphasis close tag`);
    throw new Error(`${label} contains unsupported markup`);
  }
}

export function renderGenerated(canonical, heroLocalization, jobLocalization, exclusiveRelations, exclusiveLocalizations, heroRarities, factionIdentities, heroFactionRelations, productionIdentities, heroProductionRelations, talentRelations, talentLocalizations, factionLocalizations, productionLocalizations, heroJobRelations, spJobIdentities) {
  if (heroLocalization?.schemaVersion !== 1 || !Array.isArray(heroLocalization.records)) throw new Error('Unsupported Hero Korean localization owner');
  if (heroRarities?.schemaVersion !== 1 || !Array.isArray(heroRarities.records)) throw new Error('Unsupported Hero rarity owner');
  if (factionIdentities?.schemaVersion !== 1 || !Array.isArray(factionIdentities.records)) throw new Error('Unsupported Faction identity owner');
  if (factionLocalizations?.schemaVersion !== 1 || !Array.isArray(factionLocalizations.records)
    || !Array.isArray(factionLocalizations.untranslatedFactionIds)) throw new Error('Unsupported Faction Korean localization owner');
  if (heroFactionRelations?.schemaVersion !== 1 || !Array.isArray(heroFactionRelations.records)) throw new Error('Unsupported Hero–Faction relation owner');
  if (productionIdentities?.schemaVersion !== 1 || !Array.isArray(productionIdentities.records)) throw new Error('Unsupported Production identity owner');
  if (productionLocalizations?.schemaVersion !== 1 || !Array.isArray(productionLocalizations.records)) throw new Error('Unsupported Production Korean localization owner');
  if (heroJobRelations?.schemaVersion !== 1 || !Array.isArray(heroJobRelations.records)) throw new Error('Unsupported canonical Hero–Job relation owner');
  if (spJobIdentities?.schemaVersion !== 1 || !Array.isArray(spJobIdentities.records)) throw new Error('Unsupported canonical SP Job identity owner');
  if (heroProductionRelations?.schemaVersion !== 1 || !Array.isArray(heroProductionRelations.records)) throw new Error('Unsupported Hero–Production relation owner');
  if (talentRelations?.schemaVersion !== 1 || !Array.isArray(talentRelations.records)) throw new Error('Unsupported Hero Talent star-skill relation owner');
  if (talentLocalizations?.schemaVersion !== 1 || !Array.isArray(talentLocalizations.nameRecords)
    || !Array.isArray(talentLocalizations.descriptionRecords)) throw new Error('Unsupported Hero Talent Korean localization owner');
  const heroIds = new Set(canonical.records.map(({ id }) => id));
  if (talentLocalizations.officialKrProvenanceStatus !== 'unverified') throw new Error('Hero Talent localization official Korean status must remain unverified');
  const talentRelationByKey = new Map();
  for (const relation of talentRelations.records) {
    const key = `${relation.heroId}:${relation.star}`;
    if (!Number.isSafeInteger(relation.heroId) || !Number.isSafeInteger(relation.star) || !Number.isSafeInteger(relation.skillId)
      || !TALENT_HERO_IDS.has(relation.heroId) || !TALENT_STARS.includes(relation.star) || !heroIds.has(relation.heroId)) {
      throw new Error(`Hero Talent relation is malformed or out of scope (${key})`);
    }
    if (talentRelationByKey.has(key)) throw new Error(`Duplicate Hero Talent relation ${key}`);
    talentRelationByKey.set(key, relation.skillId);
  }
  const talentNameByHeroId = new Map();
  for (const name of talentLocalizations.nameRecords) {
    if (!Number.isSafeInteger(name.heroId) || !TALENT_HERO_IDS.has(name.heroId) || !heroIds.has(name.heroId)
      || typeof name.talentNameKo !== 'string' || !name.talentNameKo.trim()
      || name.localizationStatus !== 'CONFIRMED_EXISTING_KR_REUSE' || name.reviewRequired !== false || name.evidenceClass !== 'B') {
      throw new Error(`Hero Talent Korean name is malformed, unreviewed, or out of scope (${name.heroId})`);
    }
    if (talentNameByHeroId.has(name.heroId)) throw new Error(`Duplicate Hero Talent Korean name for Hero ${name.heroId}`);
    talentNameByHeroId.set(name.heroId, name.talentNameKo);
  }
  if (talentNameByHeroId.size !== TALENT_HERO_IDS.size || [...TALENT_HERO_IDS].some((id) => !talentNameByHeroId.has(id))) {
    throw new Error('Hero Talent Korean names must exactly cover Heroes 6 and 8');
  }
  const talentDescriptionByKey = new Map();
  for (const description of talentLocalizations.descriptionRecords) {
    const key = `${description.heroId}:${description.star}:${description.skillId}`;
    if (!Number.isSafeInteger(description.heroId) || !TALENT_HERO_IDS.has(description.heroId)
      || !Number.isSafeInteger(description.star) || !TALENT_STARS.includes(description.star)
      || !Number.isSafeInteger(description.skillId) || typeof description.descriptionKoRaw !== 'string'
      || description.localizationStatus !== 'CONFIRMED_EXISTING_KR_REUSE' || description.reviewRequired !== false || description.evidenceClass !== 'B') {
      throw new Error(`Hero Talent description is malformed, unreviewed, or out of scope (${key})`);
    }
    if (talentDescriptionByKey.has(key)) throw new Error(`Duplicate Hero Talent description ${key}`);
    const relationKey = `${description.heroId}:${description.star}`;
    if (talentRelationByKey.get(relationKey) !== description.skillId) {
      throw new Error(`Hero Talent description does not match admitted Skill ID relation ${key}`);
    }
    validateTalentDescriptionMarkup(description.descriptionKoRaw, `Hero Talent description ${key}`);
    talentDescriptionByKey.set(key, description.descriptionKoRaw);
  }
  for (const heroId of TALENT_HERO_IDS) {
    const stars = [...talentRelationByKey.keys()].filter((key) => key.startsWith(`${heroId}:`))
      .map((key) => Number(key.split(':')[1])).sort((a, b) => a - b);
    if (JSON.stringify(stars) !== JSON.stringify(TALENT_STARS)) throw new Error(`Hero ${heroId} Talent relation must cover stars 3 through 6 exactly`);
  }
  if (talentRelationByKey.size !== talentDescriptionByKey.size) throw new Error('Hero Talent relation and localized description key sets differ');
  const factionNameById = new Map();
  for (const faction of factionIdentities.records) {
    if (!Number.isSafeInteger(faction.factionId) || typeof faction.nameCn !== 'string' || !faction.nameCn.trim()) throw new Error('Faction identity owner contains a malformed record');
    if (factionNameById.has(faction.factionId)) throw new Error(`Duplicate Faction identity ${faction.factionId}`);
    factionNameById.set(faction.factionId, faction.nameCn);
  }
  const factionLocalizationById = new Map();
  for (const localization of factionLocalizations.records) {
    if (!Number.isSafeInteger(localization.factionId) || typeof localization.nameKo !== 'string' || !localization.nameKo.trim()) throw new Error('Faction Korean localization is malformed');
    if (factionLocalizationById.has(localization.factionId)) throw new Error(`Duplicate Faction Korean localization ${localization.factionId}`);
    factionLocalizationById.set(localization.factionId, localization.nameKo);
  }
  const untranslatedFactionIds = new Set(factionLocalizations.untranslatedFactionIds);
  if (untranslatedFactionIds.size !== factionLocalizations.untranslatedFactionIds.length || [...untranslatedFactionIds].some((id) => !Number.isSafeInteger(id))) throw new Error('Faction untranslated ID declaration is malformed');
  const factionIdsByHeroId = new Map();
  const factionPairs = new Set();
  for (const relation of heroFactionRelations.records) {
    if (!Number.isSafeInteger(relation.heroId) || !Number.isSafeInteger(relation.factionId)) throw new Error('Hero–Faction relation contains malformed endpoint');
    if (!heroIds.has(relation.heroId)) throw new Error(`Hero–Faction relation references unknown Hero ${relation.heroId}`);
    if (!factionNameById.has(relation.factionId)) throw new Error(`Hero–Faction relation references unknown Faction ${relation.factionId}`);
    const pair = `${relation.heroId}:${relation.factionId}`;
    if (factionPairs.has(pair)) throw new Error(`Duplicate Hero–Faction relation ${pair}`);
    factionPairs.add(pair);
    const factionIds = factionIdsByHeroId.get(relation.heroId) ?? [];
    factionIds.push(relation.factionId);
    factionIdsByHeroId.set(relation.heroId, factionIds);
  }
  if ([...heroIds].some((id) => !factionIdsByHeroId.has(id))) throw new Error('Hero–Faction relation owner is missing a visible Hero endpoint');
  const productionNameById = new Map();
  for (const production of productionIdentities.records) {
    if (!Number.isSafeInteger(production.productionId) || typeof production.nameCn !== 'string' || !production.nameCn.trim()) {
      throw new Error('Production identity owner contains a malformed record');
    }
    if (productionNameById.has(production.productionId)) throw new Error(`Duplicate Production identity ${production.productionId}`);
    productionNameById.set(production.productionId, production.nameCn);
  }
  const productionLocalizationById = new Map();
  for (const localization of productionLocalizations.records) {
    if (!Number.isSafeInteger(localization.productionId) || typeof localization.nameKo !== 'string' || !localization.nameKo.trim()
      || localization.evidenceClass !== 'A' || typeof localization.provenance !== 'string') throw new Error('Production Korean localization owner contains a malformed record');
    if (!productionNameById.has(localization.productionId)) throw new Error('Production localization references unknown Production ' + localization.productionId);
    if (productionLocalizationById.has(localization.productionId)) throw new Error('Duplicate Production Korean localization ' + localization.productionId);
    productionLocalizationById.set(localization.productionId, localization.nameKo);
  }
  if (productionLocalizationById.size !== productionNameById.size
    || [...productionNameById.keys()].some((id) => !productionLocalizationById.has(id))) throw new Error('Production Korean localization IDs must exactly match current Production identities');
  const productionIdsByHeroId = new Map();
  const productionPairs = new Set();
  for (const relation of heroProductionRelations.records) {
    if (!Number.isSafeInteger(relation.heroId) || !Number.isSafeInteger(relation.productionId)) {
      throw new Error('Hero–Production relation contains malformed endpoint');
    }
    if (!heroIds.has(relation.heroId)) throw new Error(`Hero–Production relation references unknown Hero ${relation.heroId}`);
    if (!productionNameById.has(relation.productionId)) throw new Error(`Hero–Production relation references unknown Production ${relation.productionId}`);
    const pair = `${relation.heroId}:${relation.productionId}`;
    if (productionPairs.has(pair)) throw new Error(`Duplicate Hero–Production relation ${pair}`);
    productionPairs.add(pair);
    const productionIds = productionIdsByHeroId.get(relation.heroId) ?? [];
    productionIds.push(relation.productionId);
    productionIdsByHeroId.set(relation.heroId, productionIds);
  }
  if ([...heroIds].some((id) => !productionIdsByHeroId.has(id))) throw new Error('Hero–Production relation owner is missing a visible Hero endpoint');
  const rarityByHeroId = new Map();
  for (const rarity of heroRarities.records) {
    if (!Number.isSafeInteger(rarity.heroId) || !Number.isSafeInteger(rarity.rankId)
      || typeof rarity.label !== 'string' || !rarity.label.trim()) throw new Error('Hero rarity owner contains a malformed record');
    if (rarityByHeroId.has(rarity.heroId)) throw new Error(`Duplicate Hero rarity for Hero ${rarity.heroId}`);
    rarityByHeroId.set(rarity.heroId, rarity);
  }
  if (rarityByHeroId.size !== canonical.records.length || canonical.records.some((hero) => !rarityByHeroId.has(hero.id))) {
    throw new Error('Hero rarity owner IDs do not exactly match the visible Hero canonical slice');
  }
  const nameByHeroId = new Map();
  for (const localization of heroLocalization.records) {
    if (!Number.isInteger(localization.heroId)) throw new Error('Hero Korean localization contains malformed heroId');
    if (nameByHeroId.has(localization.heroId)) throw new Error(`Duplicate Hero Korean localization for Hero ${localization.heroId}`);
    if (typeof localization.nameKo !== 'string' || !localization.nameKo) throw new Error(`Missing Korean Hero display name for Hero ${localization.heroId}`);
    nameByHeroId.set(localization.heroId, localization.nameKo);
  }
  const nameByJobId = new Map(jobLocalization.records.map(({ jobId, nameKo }) => [jobId, nameKo]));
  const SP_JOB_PRESENTATION_TARGETS = [
    { heroId: 6, jobId: 377, nameKo: '어둠의 청룡' },
    { heroId: 8, jobId: 864, nameKo: '단죄의 성녀' },
  ];
  const spJobPresentationByHeroId = new Map();
  const SP_JOB_CLASSIFIED_ORDINARY_CONNECTIONS = [
    { heroId: 53, jobId: 426, connectionId: 536, nameKo: '빛나는 지략가' },
  ];
  const spJobClassificationByPair = new Map();
  for (const target of SP_JOB_CLASSIFIED_ORDINARY_CONNECTIONS) {
    const targetHero = canonical.records.find((hero) => hero.id === target.heroId);
    if (!targetHero) throw new Error(`Missing visible Hero ${target.heroId} for SP Job classification`);
    const ordinaryRows = targetHero.jobConnections.filter((relation) => relation.jobId === target.jobId);
    if (ordinaryRows.length !== 1 || ordinaryRows[0].connectionId !== target.connectionId
      || ordinaryRows[0].sourceField !== 'JobConnection_ID') {
      throw new Error(`SP Job ${target.jobId} must match exactly one existing ordinary Hero ${target.heroId} Job connection`);
    }
    const identityRows = spJobIdentities.records.filter((identity) => identity.id === target.jobId);
    if (identityRows.length !== 1) throw new Error(`SP Job identity ${target.jobId} is missing or duplicated`);
    const relationRows = heroJobRelations.records.filter((relation) => relation.heroId === target.heroId && relation.jobId === target.jobId);
    if (relationRows.length !== 1 || relationRows[0].provenance !== `evidence/source/jobs/hero-sp-job-relation.v1.json#heroId=${target.heroId}`) {
      throw new Error(`Canonical Hero–SP Job relation ${target.heroId}:${target.jobId} is missing, duplicated, or has unexpected provenance`);
    }
    const localizationRows = jobLocalization.records.filter((localization) => localization.jobId === target.jobId);
    if (localizationRows.length !== 1 || localizationRows[0].nameKo !== target.nameKo
      || localizationRows[0].evidenceClass !== 'A'
      || localizationRows[0].provenance !== `evidence/localization/sp-job-namespace.v1.json#jobId=${target.jobId}`
      || jobLocalization.sourceScope !== 'KR display text from preserved project source; official KR provenance unverified') {
      throw new Error(`SP Job ${target.jobId} Korean localization or provenance is missing, duplicated, or unverified`);
    }
    spJobClassificationByPair.set(`${target.heroId}:${target.jobId}`, {
      classification: 'SP Job',
      localizationClassification: 'PROJECT_REVIEWED_LOCALIZATION',
      officialKrProvenanceStatus: 'UNVERIFIED',
    });
  }
  for (const target of SP_JOB_PRESENTATION_TARGETS) {
    const targetHero = canonical.records.find((hero) => hero.id === target.heroId);
    if (!targetHero) throw new Error(`Missing visible Hero ${target.heroId} for SP Job presentation`);
    if (targetHero.jobConnections.some((relation) => relation.jobId === target.jobId)) {
      throw new Error(`SP Job ${target.jobId} must remain separate from Hero ${target.heroId} ordinary Job connections`);
    }
    const identityRows = spJobIdentities.records.filter((identity) => identity.id === target.jobId);
    if (identityRows.length !== 1) throw new Error(`SP Job identity ${target.jobId} is missing or duplicated`);
    const relationRows = heroJobRelations.records.filter((relation) => relation.heroId === target.heroId && relation.jobId === target.jobId);
    if (relationRows.length !== 1 || relationRows[0].provenance !== `evidence/source/jobs/hero-sp-job-relation.v1.json#heroId=${target.heroId}`) {
      throw new Error(`Canonical Hero–SP Job relation ${target.heroId}:${target.jobId} is missing, duplicated, or has unexpected provenance`);
    }
    const localizationRows = jobLocalization.records.filter((localization) => localization.jobId === target.jobId);
    if (localizationRows.length !== 1 || localizationRows[0].nameKo !== target.nameKo
      || localizationRows[0].evidenceClass !== 'A'
      || localizationRows[0].provenance !== `evidence/localization/sp-job-namespace.v1.json#jobId=${target.jobId}`
      || jobLocalization.sourceScope !== 'KR display text from preserved project source; official KR provenance unverified') {
      throw new Error(`SP Job ${target.jobId} Korean localization or provenance is missing, duplicated, or unverified`);
    }
    spJobPresentationByHeroId.set(target.heroId, [{
      jobId: target.jobId,
      nameKo: localizationRows[0].nameKo,
      classification: 'SP Job',
      localizationClassification: 'PROJECT_REVIEWED_LOCALIZATION',
      officialKrProvenanceStatus: 'UNVERIFIED',
    }]);
  }
  const relationByHeroId = new Map();
  const equipmentIds = new Set();
  for (const relation of exclusiveRelations.records) {
    if (!Number.isInteger(relation.heroId) || !Number.isInteger(relation.equipmentId)) throw new Error('Exclusive Equipment relation contains malformed endpoint');
    if (relationByHeroId.has(relation.heroId)) throw new Error(`Duplicate Exclusive Equipment relation for Hero ${relation.heroId}`);
    if (equipmentIds.has(relation.equipmentId)) throw new Error(`Duplicate Exclusive Equipment mapping for equipment ${relation.equipmentId}`);
    relationByHeroId.set(relation.heroId, relation.equipmentId);
    equipmentIds.add(relation.equipmentId);
  }
  const localizationByEquipmentId = new Map();
  for (const localization of exclusiveLocalizations.records) {
    if (!Number.isInteger(localization.equipmentId)) throw new Error('Exclusive Equipment localization contains malformed equipmentId');
    if (localizationByEquipmentId.has(localization.equipmentId)) throw new Error(`Duplicate Exclusive Equipment localization for ${localization.equipmentId}`);
    if (typeof localization.nameKo !== 'string' || !localization.nameKo || typeof localization.effectDescriptionKo !== 'string' || !localization.effectDescriptionKo) {
      throw new Error(`Missing Korean Exclusive Equipment presentation for ${localization.equipmentId}`);
    }
    localizationByEquipmentId.set(localization.equipmentId, localization);
  }
  const heroes = [...canonical.records]
    .sort((a, b) => a.id - b.id)
    .map(({ id, nameEng, portrait, jobConnections }) => {
      const nameKo = nameByHeroId.get(id);
      if (typeof nameKo !== 'string' || !nameKo) throw new Error(`Missing admitted Korean Hero localization for visible Hero ${id}`);
      const rarity = rarityByHeroId.get(id);
      if (!rarity) throw new Error(`Missing admitted Hero rarity for visible Hero ${id}`);
      const equipmentId = relationByHeroId.get(id);
      if (!Number.isInteger(equipmentId)) throw new Error(`Missing Exclusive Equipment relation for visible Hero ${id}`);
      const localization = localizationByEquipmentId.get(equipmentId);
      if (!localization) throw new Error(`Missing Korean Exclusive Equipment localization for ${equipmentId}`);
      const factions = [...factionIdsByHeroId.get(id)].sort((a, b) => a - b)
        .map((factionId) => {
          const nameCn = factionNameById.get(factionId);
          const nameKo = factionLocalizationById.get(factionId);
          if (nameKo) return { factionId, nameCn, nameKo, localizationStatus: 'PROJECT_REVIEWED' };
          if (untranslatedFactionIds.has(factionId)) return { factionId, nameCn, localizationStatus: 'UNTRANSLATED' };
          throw new Error(`Faction ${factionId} has no admitted Korean localization or explicit untranslated status`);
        });
      const origins = [...productionIdsByHeroId.get(id)].sort((a, b) => a - b)
        .map((productionId) => {
          const nameKo = productionLocalizationById.get(productionId);
          if (!nameKo) throw new Error('Production ' + productionId + ' has no admitted Korean localization');
          return { productionId, nameCn: productionNameById.get(productionId), nameKo, localizationStatus: 'PROJECT_REVIEWED' };
        });
      const talentStars = [...talentRelationByKey.keys()].filter((key) => key.startsWith(`${id}:`))
        .map((key) => Number(key.split(':')[1])).sort((a, b) => a - b);
      const talent = talentStars.length ? {
        nameKo: talentNameByHeroId.get(id),
        starDescriptions: talentStars.map((star) => {
          const skillId = talentRelationByKey.get(`${id}:${star}`);
          const key = `${id}:${star}:${skillId}`;
          const descriptionKoRaw = talentDescriptionByKey.get(key);
          if (typeof descriptionKoRaw !== 'string') throw new Error(`Missing reviewed Hero Talent description ${key}`);
          return { star, skillId, descriptionKoRaw };
        }),
      } : undefined;
      return ({
      id,
      nameEng,
      nameKo,
      rarity: { rankId: rarity.rankId, label: rarity.label },
      factions,
      origins,
      ...(talent ? { talent } : {}),
      portrait,
      exclusiveEquipment: { equipmentId, equipmentNameKo: localization.nameKo, effectDescriptionKo: localization.effectDescriptionKo },
      spJobConnections: spJobPresentationByHeroId.get(id) ?? [],
      jobConnections: jobConnections.map((relation) => {
        const jobNameKo = nameByJobId.get(relation.jobId);
        if (typeof jobNameKo !== 'string' || !jobNameKo) throw new Error(`Missing admitted Korean Job localization for JobInfo.ID ${relation.jobId}`);
        const classification = spJobClassificationByPair.get(`${id}:${relation.jobId}`);
        return { ...relation, jobNameKo, ...(classification ?? {}) };
      }),
    });
    });
  return `${JSON.stringify({ schemaVersion: 1, heroes }, null, 2)}\n`;
}

export function renderJobGlossary(jobLocalization) {
  const jobs = [...jobLocalization.records]
    .sort((a, b) => a.jobId - b.jobId)
    .map(({ jobId, nameKo }) => ({ jobId, nameKo }));
  return `${JSON.stringify({ schemaVersion: 1, jobs }, null, 2)}\n`;
}

export function renderGeneralSsrEquipment(identities, localizations) {
  if (identities?.schemaVersion !== 1 || !Array.isArray(identities.records)) throw new Error('Unsupported General SSR Equipment identity owner');
  if (localizations?.schemaVersion !== 1 || !Array.isArray(localizations.records)) throw new Error('Unsupported General SSR Equipment localization owner');
  const identityIds = new Set();
  for (const record of identities.records) {
    if (!Number.isInteger(record.id)) throw new Error('General SSR Equipment identity contains malformed ID');
    if (identityIds.has(record.id)) throw new Error('Duplicate General SSR Equipment identity ' + record.id);
    if (record.population !== 'GENERAL_SSR') throw new Error('Unexpected population for Equipment ' + record.id);
    identityIds.add(record.id);
  }
  const localizationById = new Map();
  for (const record of localizations.records) {
    if (!Number.isInteger(record.equipmentId)) throw new Error('General SSR Equipment localization contains malformed equipmentId');
    if (localizationById.has(record.equipmentId)) throw new Error('Duplicate General SSR Equipment localization ' + record.equipmentId);
    if (typeof record.nameKo !== 'string' || !record.nameKo.trim() || typeof record.effectDescriptionKo !== 'string' || !record.effectDescriptionKo.trim()) throw new Error('Missing Korean presentation for ' + record.equipmentId);
    localizationById.set(record.equipmentId, record);
  }
  if (localizationById.size !== identityIds.size || [...identityIds].some((id) => !localizationById.has(id))) throw new Error('General SSR Equipment localization ID set does not exactly match identity');
  const equipment = [...identityIds].sort((a, b) => a - b).map((equipmentId) => {
    const localization = localizationById.get(equipmentId);
    return { equipmentId, nameKo: localization.nameKo, effectDescriptionKo: localization.effectDescriptionKo };
  });
  return JSON.stringify({ schemaVersion: 1, equipment }, null, 2) + '\n';
}

const idSet = (records, getId, label) => {
  const ids = records.map(getId);
  if (ids.some((id) => !Number.isInteger(id))) throw new Error(`${label} contains a non-integer SP Soldier ID`);
  if (new Set(ids).size !== ids.length) throw new Error(`${label} contains duplicate SP Soldier IDs`);
  return new Set(ids);
};

const assertSameIds = (expected, actual, label) => {
  if (expected.size !== actual.size || [...expected].some((id) => !actual.has(id))) {
    throw new Error(`${label} SP Soldier ID set does not exactly match identity`);
  }
};

export function renderSpSoldiers(identities, localizations, normalLocalizations, baseStats, relations, normalBaseStats, movePoints) {
  const spRecords = identities.records.filter((record) => record.variant === 'SP');
  const normalRecords = identities.records.filter((record) => record.variant === 'NORMAL');
  const identityIds = idSet(spRecords, (record) => record.id, 'identity');
  const localizationIds = idSet(localizations.records, (record) => record.soldierId, 'localization');
  const normalIdentityIds = idSet(normalRecords, (record) => record.id, 'NORMAL identity');
  const normalLocalizationIds = idSet(normalLocalizations.records, (record) => record.soldierId, 'NORMAL localization');
  const statsIds = idSet(baseStats.records, (record) => record.id, 'base stats');
  const normalStatsIds = idSet(normalBaseStats.records, (record) => record.id, 'NORMAL base stats');
  const allIdentityIds = idSet(identities.records, (record) => record.id, 'identity');
  const movePointIds = idSet(movePoints.records, (record) => record.soldierId, 'BF_MovePoint');
  assertSameIds(allIdentityIds, movePointIds, 'BF_MovePoint');
  const relationIds = idSet(relations.records, (record) => record.spSoldierId, 'relation');
  assertSameIds(identityIds, localizationIds, 'localization');
  assertSameIds(identityIds, statsIds, 'base stats');
  assertSameIds(identityIds, relationIds, 'relation');

  const relationTargetIds = relations.records.map(({ normalSoldierId }) => normalSoldierId);
  if (relationTargetIds.some((id) => !Number.isInteger(id)) || new Set(relationTargetIds).size !== relationTargetIds.length) {
    throw new Error('relation contains invalid or duplicate NORMAL Soldier IDs');
  }
  const relationTargets = new Set(relationTargetIds);
  assertSameIds(relationTargets, normalLocalizationIds, 'NORMAL localization');
  assertSameIds(relationTargets, normalStatsIds, 'NORMAL base stats');
  if ([...relationTargets].some((id) => !normalIdentityIds.has(id))) {
    throw new Error('relation NORMAL Soldier ID is missing from identity');
  }

  const nameById = new Map(localizations.records.map(({ soldierId, nameKo }) => [soldierId, nameKo]));
  const normalNameById = new Map(normalLocalizations.records.map(({ soldierId, nameKo }) => [soldierId, nameKo]));
  const statsById = new Map(baseStats.records.map(({ id, baseStats: stats }) => [id, stats]));
  const normalStatsById = new Map(normalBaseStats.records.map(({ id, baseStats: stats }) => [id, stats]));
  const normalIdBySpId = new Map(relations.records.map(({ spSoldierId, normalSoldierId }) => [spSoldierId, normalSoldierId]));
  const movePointById = new Map(movePoints.records.map(({ soldierId, bfMovePoint }) => [soldierId, bfMovePoint]));
  const soldiers = [...spRecords]
    .sort((a, b) => a.id - b.id)
    .map(({ id }) => {
      const stats = statsById.get(id);
      const nameKo = nameById.get(id);
      const bfMovePoint = movePointById.get(id);
      const normalSoldierId = normalIdBySpId.get(id);
      const normalSoldierNameKo = normalNameById.get(normalSoldierId);
      const normalSoldierBaseStats = normalStatsById.get(normalSoldierId);
      if (typeof nameKo !== 'string' || !nameKo) throw new Error(`Missing Korean localization for SP Soldier ${id}`);
      if (!Number.isFinite(bfMovePoint)) throw new Error(`Missing BF_MovePoint for SP Soldier ${id}`);
      if (!stats || !['hp', 'attack', 'defense', 'magicDefense'].every((key) => Number.isFinite(stats[key]))) {
        throw new Error(`Missing base stats for SP Soldier ${id}`);
      }
      if (!Number.isInteger(normalSoldierId)) throw new Error(`Missing NORMAL Soldier relation for SP Soldier ${id}`);
      if (typeof normalSoldierNameKo !== 'string' || !normalSoldierNameKo) {
        throw new Error(`Missing Korean localization for NORMAL Soldier ${normalSoldierId} linked to SP Soldier ${id}`);
      }
      if (!normalSoldierBaseStats || !['hp', 'attack', 'defense', 'magicDefense'].every((key) => Number.isFinite(normalSoldierBaseStats[key]))) {
        throw new Error(`Missing base stats for NORMAL Soldier ${normalSoldierId} linked to SP Soldier ${id}`);
      }
      return {
        spSoldierId: id,
        nameKo,
        bfMovePoint,
        normalSoldierId,
        normalSoldierNameKo,
        baseStats: { hp: stats.hp, attack: stats.attack, defense: stats.defense, magicDefense: stats.magicDefense },
        normalSoldierBaseStats: {
          hp: normalSoldierBaseStats.hp,
          attack: normalSoldierBaseStats.attack,
          defense: normalSoldierBaseStats.defense,
          magicDefense: normalSoldierBaseStats.magicDefense,
        },
      };
    });
  return `${JSON.stringify({ schemaVersion: 1, soldiers }, null, 2)}\n`;
}

export function renderNormalSoldiers(identities, localizations, baseStats, movePoints) {
  const normalRecords = identities.records.filter((record) => record.entity === 'Soldier' && record.variant === 'NORMAL');
  const identityIds = idSet(normalRecords, (record) => record.id, 'NORMAL identity');
  const localizationIds = idSet(localizations.records, (record) => record.soldierId, 'NORMAL localization');
  const statsIds = idSet(baseStats.records, (record) => record.id, 'NORMAL base stats');
  const allIdentityIds = idSet(identities.records, (record) => record.id, 'identity');
  const movePointIds = idSet(movePoints.records, (record) => record.soldierId, 'BF_MovePoint');
  assertSameIds(allIdentityIds, movePointIds, 'BF_MovePoint');
  assertSameIds(identityIds, localizationIds, 'NORMAL localization');
  assertSameIds(identityIds, statsIds, 'NORMAL base stats');
  if (identityIds.size !== 56) throw new Error('NORMAL Soldier candidate scope must contain exactly 56 admitted identities');
  const nameById = new Map(localizations.records.map(({ soldierId, nameKo }) => [soldierId, nameKo]));
  const statsById = new Map(baseStats.records.map(({ id, baseStats: values }) => [id, values]));
  const movePointById = new Map(movePoints.records.map(({ soldierId, bfMovePoint }) => [soldierId, bfMovePoint]));
  const soldiers = [...normalRecords].sort((a, b) => a.id - b.id).map(({ id }) => {
    const nameKo = nameById.get(id);
    const values = statsById.get(id);
    const bfMovePoint = movePointById.get(id);
    if (typeof nameKo !== 'string' || !nameKo.trim()) throw new Error(`Missing Korean localization for NORMAL Soldier ${id}`);
    if (!Number.isFinite(bfMovePoint)) throw new Error(`Missing BF_MovePoint for NORMAL Soldier ${id}`);
    if (!values || !['hp', 'attack', 'defense', 'magicDefense'].every((key) => Number.isFinite(values[key]))) {
      throw new Error(`Missing base stats for NORMAL Soldier ${id}`);
    }
    return { normalSoldierId: id, nameKo, bfMovePoint, baseStats: { hp: values.hp, attack: values.attack, defense: values.defense, magicDefense: values.magicDefense } };
  });
  return `${JSON.stringify({ schemaVersion: 1, soldiers }, null, 2)}\n`;
}

export function renderHeroSoldierRelations(heroPresentation, relationOwner, soldierIdentities) {
  if (heroPresentation?.schemaVersion !== 1 || !Array.isArray(heroPresentation.records)) {
    throw new Error('Unsupported Hero presentation population owner');
  }
  if (relationOwner?.schemaVersion !== 1 || !Array.isArray(relationOwner.records)) {
    throw new Error('Unsupported canonical Hero-Soldier relation owner');
  }
  if (soldierIdentities?.schemaVersion !== 1 || !Array.isArray(soldierIdentities.records)) {
    throw new Error('Unsupported canonical Soldier identity owner');
  }

  const heroIds = new Set();
  for (const hero of heroPresentation.records) {
    if (!Number.isInteger(hero.id)) throw new Error('Hero presentation owner contains malformed Hero ID');
    if (heroIds.has(hero.id)) throw new Error('Duplicate Hero presentation ID ' + hero.id);
    heroIds.add(hero.id);
  }

  const soldierIds = new Set();
  for (const soldier of soldierIdentities.records) {
    if (soldier.entity !== 'Soldier') continue;
    if (!Number.isInteger(soldier.id)) throw new Error('Soldier identity owner contains malformed Soldier ID');
    if (soldierIds.has(soldier.id)) throw new Error('Duplicate Soldier identity ID ' + soldier.id);
    soldierIds.add(soldier.id);
  }

  const seenPairs = new Set();
  const relations = [];
  for (const relation of relationOwner.records) {
    if (!heroIds.has(relation.heroId)) continue;
    if (!Number.isInteger(relation.heroId) || !Number.isInteger(relation.soldierId)) {
      throw new Error('Candidate Hero-Soldier relation contains malformed endpoint');
    }
    if (!soldierIds.has(relation.soldierId)) {
      throw new Error('Candidate Hero-Soldier relation references missing Soldier ' + relation.soldierId);
    }
    const key = relation.heroId + ':' + relation.soldierId;
    if (seenPairs.has(key)) throw new Error('Duplicate candidate Hero-Soldier pair ' + key);
    seenPairs.add(key);
    relations.push({ heroId: relation.heroId, soldierId: relation.soldierId });
  }

  relations.sort((a, b) => a.heroId - b.heroId || a.soldierId - b.soldierId);
  return JSON.stringify({ schemaVersion: 1, relations }, null, 2) + '\n';
}


export function renderExclusiveEquipment(identities, localizations) {
  if (identities?.schemaVersion !== 1 || !Array.isArray(identities.records)) throw new Error('Unsupported Exclusive Equipment identity owner');
  if (localizations?.schemaVersion !== 1 || !Array.isArray(localizations.records)) throw new Error('Unsupported Exclusive Equipment localization owner');
  const identityIds = new Set();
  for (const record of identities.records) {
    if (!Number.isSafeInteger(record.equipmentId) || record.equipmentId <= 0) throw new Error('Exclusive Equipment identity contains malformed equipmentId');
    if (identityIds.has(record.equipmentId)) throw new Error('Duplicate Exclusive Equipment identity ' + record.equipmentId);
    identityIds.add(record.equipmentId);
  }
  if (identityIds.size !== 167) throw new Error('Exclusive Equipment presentation scope must contain exactly 167 admitted IDs');
  const localizationById = new Map();
  for (const record of localizations.records) {
    if (!Number.isSafeInteger(record.equipmentId) || record.equipmentId <= 0) throw new Error('Exclusive Equipment localization contains malformed equipmentId');
    if (localizationById.has(record.equipmentId)) throw new Error('Duplicate Exclusive Equipment localization ' + record.equipmentId);
    if (typeof record.nameKo !== 'string' || !record.nameKo.trim() || typeof record.effectDescriptionKo !== 'string' || !record.effectDescriptionKo.trim()) throw new Error('Missing Korean presentation for Exclusive Equipment ' + record.equipmentId);
    localizationById.set(record.equipmentId, record);
  }
  if (localizationById.size !== identityIds.size || [...identityIds].some((id) => !localizationById.has(id))
    || [...localizationById.keys()].some((id) => !identityIds.has(id))) throw new Error('Exclusive Equipment localization ID set does not exactly match identity');
  const equipment = [...identityIds].sort((a, b) => a - b).map((equipmentId) => {
    const localization = localizationById.get(equipmentId);
    return { equipmentId, nameKo: localization.nameKo, effectDescriptionKo: localization.effectDescriptionKo };
  });
  return JSON.stringify({ schemaVersion: 1, equipment }, null, 2) + '\n';
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const inputPath = resolve('canonical/heroes.v1.json');
  const heroLocalizationPath = resolve('canonical/hero-localizations-ko.v1.json');
  const localizationPath = resolve('canonical/job-localizations-ko.v1.json');
  const exclusiveRelationPath = resolve('canonical/hero-exclusive-equipment-relations.v1.json');
  const exclusiveLocalizationPath = resolve('canonical/exclusive-equipment-localizations-ko.v1.json');
  const rarityPath = resolve('canonical/hero-rarities.v1.json');
  const factionIdentityPath = resolve('canonical/faction-identities.v1.json');
  const heroFactionRelationsPath = resolve('canonical/hero-faction-relations.v1.json');
  const productionIdentityPath = resolve('canonical/production-identities.v1.json');
  const heroProductionRelationsPath = resolve('canonical/hero-production-relations.v1.json');
  const talentRelationsPath = resolve('canonical/hero-talent-star-skills.v1.json');
  const talentLocalizationsPath = resolve('canonical/hero-talent-localizations-ko.v1.json');
  const factionLocalizationsPath = resolve('canonical/faction-localizations-ko.v1.json');
  const productionLocalizationsPath = resolve('canonical/production-localizations-ko.v1.json');
  const outputPath = resolve('generated/hero-slice.v1.json');
  const canonical = JSON.parse(await readFile(inputPath, 'utf8'));
  const heroLocalization = JSON.parse(await readFile(heroLocalizationPath, 'utf8'));
  const jobLocalization = JSON.parse(await readFile(localizationPath, 'utf8'));
  const [exclusiveRelations, exclusiveLocalizations] = await Promise.all([
    readFile(exclusiveRelationPath, 'utf8'), readFile(exclusiveLocalizationPath, 'utf8'),
  ]).then(([relations, localizations]) => [JSON.parse(relations), JSON.parse(localizations)]);
  const heroRarities = JSON.parse(await readFile(rarityPath, 'utf8'));
  const [factionIdentities, heroFactionRelations] = await Promise.all([
    readFile(factionIdentityPath, 'utf8'), readFile(heroFactionRelationsPath, 'utf8'),
  ]).then(([identities, relations]) => [JSON.parse(identities), JSON.parse(relations)]);
  const [productionIdentities, heroProductionRelations] = await Promise.all([
    readFile(productionIdentityPath, 'utf8'), readFile(heroProductionRelationsPath, 'utf8'),
  ]).then(([identities, relations]) => [JSON.parse(identities), JSON.parse(relations)]);
  const [talentRelations, talentLocalizations] = await Promise.all([
    readFile(talentRelationsPath, 'utf8'), readFile(talentLocalizationsPath, 'utf8'),
  ]).then(([relations, localizations]) => [JSON.parse(relations), JSON.parse(localizations)]);
  const factionLocalizations = JSON.parse(await readFile(factionLocalizationsPath, 'utf8'));
  const productionLocalizations = JSON.parse(await readFile(productionLocalizationsPath, 'utf8'));
  const [heroJobRelations, spJobIdentities] = await Promise.all([
    readFile(resolve('canonical/hero-job-relations.v1.json'), 'utf8'),
    readFile(resolve('canonical/sp-job-identities.v1.json'), 'utf8'),
  ]).then(([relations, identities]) => [JSON.parse(relations), JSON.parse(identities)]);
  await writeFile(outputPath, renderGenerated(canonical, heroLocalization, jobLocalization, exclusiveRelations, exclusiveLocalizations, heroRarities, factionIdentities, heroFactionRelations, productionIdentities, heroProductionRelations, talentRelations, talentLocalizations, factionLocalizations, productionLocalizations, heroJobRelations, spJobIdentities), 'utf8');
  const glossaryPath = resolve('generated/job-glossary.v1.json');
  await writeFile(glossaryPath, renderJobGlossary(jobLocalization), 'utf8');
  const spOutputPath = resolve('generated/sp-soldiers.v1.json');
  const soldierBfMovePointsPath = resolve('canonical/soldier-bf-move-points.v1.json');
  const [soldiers, spLocalizations, normalLocalizations, spBaseStats, spRelations, normalBaseStats, soldierBfMovePoints] = await Promise.all([
    readFile(resolve('canonical/soldiers.v1.json'), 'utf8'),
    readFile(resolve('canonical/sp-soldier-localizations-ko.v1.json'), 'utf8'),
    readFile(resolve('canonical/normal-soldier-localizations-ko.v1.json'), 'utf8'),
    readFile(resolve('canonical/sp-soldier-base-stats.v1.json'), 'utf8'),
    readFile(resolve('canonical/sp-soldier-normal-relations.v1.json'), 'utf8'),
    readFile(resolve('canonical/normal-soldier-base-stats.v1.json'), 'utf8'),
    readFile(soldierBfMovePointsPath, 'utf8'),
  ]);
  await writeFile(spOutputPath, renderSpSoldiers(JSON.parse(soldiers), JSON.parse(spLocalizations), JSON.parse(normalLocalizations), JSON.parse(spBaseStats), JSON.parse(spRelations), JSON.parse(normalBaseStats), JSON.parse(soldierBfMovePoints)), 'utf8');
  const [normalSoldierIdentities, normalSoldierLocalizations, normalSoldierBaseStats, normalSoldierBfMovePoints] = await Promise.all([
    readFile(resolve('canonical/soldiers.v1.json'), 'utf8'),
    readFile(resolve('canonical/normal-soldier-localizations-ko.v1.json'), 'utf8'),
    readFile(resolve('canonical/normal-soldier-base-stats.v1.json'), 'utf8'),
    readFile(soldierBfMovePointsPath, 'utf8'),
  ]);
  const normalSoldierOutputPath = resolve('generated/normal-soldiers.v1.json');
  await writeFile(normalSoldierOutputPath, renderNormalSoldiers(JSON.parse(normalSoldierIdentities), JSON.parse(normalSoldierLocalizations), JSON.parse(normalSoldierBaseStats), JSON.parse(normalSoldierBfMovePoints)), 'utf8');
  const heroSoldierRelationOwner = JSON.parse(await readFile(resolve('canonical/hero-soldier-relations.v1.json'), 'utf8'));
  const heroSoldierOutputPath = resolve('generated/hero-soldier-relations.v1.json');
  await writeFile(heroSoldierOutputPath, renderHeroSoldierRelations(canonical, heroSoldierRelationOwner, JSON.parse(normalSoldierIdentities)), 'utf8');
  const equipmentIdentity = JSON.parse(await readFile(resolve('canonical/general-ssr-equipment.v1.json'), 'utf8'));
  const equipmentLocalization = JSON.parse(await readFile(resolve('canonical/general-ssr-equipment-localizations-ko.v1.json'), 'utf8'));
  const equipmentOutputPath = resolve('generated/general-ssr-equipment.v1.json');
  await writeFile(equipmentOutputPath, renderGeneralSsrEquipment(equipmentIdentity, equipmentLocalization), 'utf8');
  const exclusiveEquipmentIdentity = JSON.parse(await readFile(resolve('canonical/exclusive-equipment.v1.json'), 'utf8'));
  const exclusiveEquipmentLocalization = JSON.parse(await readFile(resolve('canonical/exclusive-equipment-localizations-ko.v1.json'), 'utf8'));
  const exclusiveEquipmentOutputPath = resolve('generated/exclusive-equipment.v1.json');
  await writeFile(exclusiveEquipmentOutputPath, renderExclusiveEquipment(exclusiveEquipmentIdentity, exclusiveEquipmentLocalization), 'utf8');
  process.stdout.write('Generated ' + outputPath + ', ' + glossaryPath + ', ' + spOutputPath + ', ' + equipmentOutputPath + ', ' + exclusiveEquipmentOutputPath + ', and ' + heroSoldierOutputPath + '\n');
}
