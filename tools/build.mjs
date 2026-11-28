import { generateOrdinarySkills, ordinaryPublic, ordinaryPublicV2, ordinaryPublicV3, ordinaryPublicV4, ordinaryPublicV5, validateOrdinaryPublic } from './hero-16-ordinary-skills-publication-contract.mjs';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { runInNewContext, Script } from 'node:vm';
import { generateLanceTalent, lanceTalentPublic, selectTalentSkill, validateLanceTalentPackage } from './hero-16-talent-publication-contract.mjs';
import { extractFunction } from './test-app-function-source.mjs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { readFileSync } from 'node:fs';
import { loadPublicNormalSoldierLocalization } from './validate-normal-soldier-ko-localization.mjs';
import { renderGenerated, renderSpSoldiers, renderNormalSoldiers, renderHeroSoldierRelations, renderJobGlossary, renderGeneralSsrEquipment, renderExclusiveEquipment, renderSoldierTrainingTechDescriptions } from './generate.mjs';
import { validateHeroIndex } from './validate-hero-index.mjs';
import { validateAppCacheKey, validateStylesCacheKey } from './validate-app-cache-key.mjs';
import { validateSkinGenerated } from './validate-skin-generated.mjs';
import { validateM05G } from './validate-skin-m05-g.mjs';
import { validateGeneralSsrPublication } from './validate-general-ssr-equipment-publication.mjs';
import { TRAINING_TECH_DECISION_RECORD_PATH, shouldPublishTrainingTechDirectJson, validateTrainingTechDecisionRecord } from './soldier-training-tech-presentation-contract.mjs';
import { isAllowedSkinAssetPath, skinAssetPathFromPublicUrl } from '../skin-asset-publication-contract.mjs';
import { EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH, EXCLUSIVE_EQUIPMENT_HERO_PUBLICATION_PATH, validateExclusiveEquipmentHeroNavigation } from './exclusive-equipment-hero-navigation-contract.mjs';
import { bond1GoldValues, bond2GoldValues, bond3GoldValues, bond4GoldValues, bond5GoldValues, heartFetterGoldValues, bondKeyAssets, readBondKeyDisplay, renderBond1KeyTotals, renderBond2KeyTotals, renderHeadGoldSubtotal, readSlotGoldSubtotals, readFreezeDisplay, readShieldDisplay, readMeditationDisplay, readHero15JobPublicationInputs, readHero15SoldierPublicationInputs, readHero15ProfileInputs, HERO_15_INTEGRATED_PUBLICATION_PATH, HERO_15_MINIMAL_DETAIL_PATH, validateHero15IntegratedPublication, validateHero15MinimalDetail } from './hero-15-integrated-publication-contract.mjs';
import { validateHero15SkillReferences } from './validate-hero15-skill-references.mjs';
import { validateHero15FetterMaterialRelations } from './validate-hero15-fetter-material-relations.mjs';
import { validateHero15FetterConditionTypeReferences } from './validate-hero15-fetter-condition-type-references.mjs';
import { validateHero15FetterRewardTypeReferences } from './validate-hero15-fetter-reward-type-references.mjs';
import { validateHero15FetterSkillReferences } from './validate-hero15-fetter-skill-references.mjs';
import { validateHero15FullDetailPublicationFromRoot } from './hero-15-full-detail-publication-contract.mjs';
import { validateHero15FetterRawDetails } from './validate-hero15-fetter-raw-details.mjs';
import { validateHero15HeartFetterRawDetails } from './validate-hero15-heart-fetter-raw-details.mjs';
import { validateHero15FetterReferences } from './validate-hero15-fetter-references.mjs';
import { conditionPath, heartDecisionPath, heartSourcePath } from './lance-heart-fetter.mjs';
import { bond45DecisionPath, bond45EvidencePath, lanceCompanionBondDescriptions, bond23DecisionPath, bond23EvidencePath, lanceBondDescriptions, lanceHeartGroups } from './hero-16-integrated-publication-contract.mjs';
import { validateHero15HeartFetterRawConditions } from './validate-hero15-heart-fetter-raw-conditions.mjs';
import { validateHero15FetterInternal } from './hero-15-fetter-internal.mjs';
import { validateHero15SkillDetailInternal } from './hero-15-skill-detail-internal.mjs';
import { expectedAdvancements } from './validate-hero15-job-advancement.mjs';
import { validateFile as validateLianaJobTree } from './hero-15-job-tree-internal.mjs';
import { loadInputs as commandBaseInputs, validateHero15SoldierCommandBase } from './validate-hero-15-soldier-command-base.mjs';
import { loadInputs as commandBondInputs, validateHero15SoldierCommandBondContribution } from './validate-hero-15-soldier-command-bond-contribution.mjs';
import { finalMovementEvidence, finalMovementDecision, validateFinalMovementEvidence, finalJobMovementLines, commandDecisionPath, lanceCommandRows, finalJobPathDecision, splitJobAdvancements, finalJobPathLines, readLanceFetterTotals, readLanceCentralEffect, readLanceGoldDisplay, HERO_16_JOB_PATH_DECISION, hero16JobPathLine, HERO_16_PROFILE_DECISION, hero16ProfileLines, HERO_16_INTEGRATED_PUBLICATION_PATH, HERO_16_MINIMAL_DETAIL_PATH, validateHero16IntegratedPublication, validateHero16MinimalDetail } from './hero-16-integrated-publication-contract.mjs';
import { HERO_MINIMAL_DETAIL_BATCH_PATH, HERO_MINIMAL_DETAIL_BATCH_PUBLICATION_PATH, validateHeroMinimalDetailBatchPublication, validateHeroMinimalDetailBatch } from './hero-minimal-detail-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_TEN_BATCH_PATH, HERO_MINIMAL_DETAIL_TEN_BATCH_PUBLICATION_PATH, validateHeroMinimalDetailBatchPublication as validateHeroMinimalDetailTenBatchPublication, validateHeroMinimalDetailBatch as validateHeroMinimalDetailTenBatch } from './hero-minimal-detail-ten-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_TWENTY_BATCH_PATH, HERO_MINIMAL_DETAIL_TWENTY_BATCH_PUBLICATION_PATH, validateHeroMinimalDetailTwentyBatchPublication, validateHeroMinimalDetailTwentyBatch } from './hero-minimal-detail-twenty-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_THIRTY_BATCH_PATH, HERO_MINIMAL_DETAIL_THIRTY_BATCH_PUBLICATION_PATH, validateHeroMinimalDetailThirtyBatchPublication, validateHeroMinimalDetailThirtyBatch } from './hero-minimal-detail-thirty-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH, HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PUBLICATION_PATH, validateHeroMinimalDetailThirtyOneBatchPublication, validateHeroMinimalDetailThirtyOneBatch } from './hero-minimal-detail-thirty-one-batch-contract.mjs';
import { HERO_MINIMAL_DETAIL_FORTY_BATCH_PATH, HERO_MINIMAL_DETAIL_FORTY_BATCH_PUBLICATION_PATH, validateHeroMinimalDetailFortyBatchPublication, validateHeroMinimalDetailFortyBatch } from './hero-minimal-detail-forty-batch-contract.mjs';
import { FULL_DETAIL_PORTRAIT_PROJECTION_CONTRACT } from './full-detail-portrait-projection-contract.mjs';
import { projectApprovedFullDetailRecords, validateFullDetailPublicPopulation } from './full-detail-public-population-contract.mjs';
import { HERO_15_TALENT_PUBLICATION_PATH, HERO_15_TALENT_PUBLIC_PATH, validateHero15TalentDecision, validateHero15TalentPublic } from './hero-15-talent-publication-contract.mjs';
import { HERO_15_SOLDIER_TEXT_DECISION, HERO_15_SOLDIER_TEXT_PUBLIC, readHero15SoldierTextInputs, validateHero15SoldierText, validateHero15SoldierTextBytes, validateHero15SoldierTextDecision } from './hero-15-soldier-text-publication-contract.mjs';
const defaultHero15TalentDecision = validateHero15TalentDecision(JSON.parse(readFileSync(resolve(HERO_15_TALENT_PUBLICATION_PATH), 'utf8')));

const readJson = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const exactKeys = (value, expected, label) => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} fields were ${actual.join(',')}; expected ${wanted.join(',')}`);
  }
};

const skinConsumerPublicPath = 'generated/skin-consumer-public-m05-g.v1.json';
const skinAssetsPublicPath = 'generated/skin-assets-public-m05-g.v1.json';

async function readApprovedSkinAssetPaths(sourceRoot = process.cwd()) {
  const value = JSON.parse(await readFile(resolve(sourceRoot, skinAssetsPublicPath), 'utf8'));
  if (value.schemaVersion !== 1 || !Array.isArray(value.assets)) throw new Error('Public Skin Asset map schema is invalid');
  const paths = value.assets.map((asset) => {
    const path = skinAssetPathFromPublicUrl(asset.imageUrl);
    if (!Number.isSafeInteger(asset.skinId) || !path) throw new Error('Public Skin Asset map contains an invalid URL');
    return path;
  });
  if (new Set(paths).size !== paths.length) throw new Error('Public Skin Asset map contains duplicate paths');
  return paths;
}

// Publication packaging only: this list does not admit semantic populations.
export function publicSitePaths(canonical, publicationDecision, decisionRecord, skinFullartPaths = [], exclusiveHeroPublicationDecision = null, hero15IntegratedPublication = null, hero16IntegratedPublication = null, heroMinimalDetailBatchPublication = null, heroMinimalDetailTenBatchPublication = null, heroMinimalDetailTwentyBatchPublication = null, heroMinimalDetailThirtyBatchPublication = null, heroMinimalDetailThirtyOneBatchPublication = null, heroMinimalDetailFortyBatchPublication = null, hero15TalentPublication = defaultHero15TalentDecision, hero15SoldierTextPublication = JSON.parse(readFileSync(resolve(HERO_15_SOLDIER_TEXT_DECISION), 'utf8'))) {
  if (!Array.isArray(skinFullartPaths) || skinFullartPaths.some((path) => !isAllowedSkinAssetPath(path))
    || new Set(skinFullartPaths).size !== skinFullartPaths.length) {
    throw new Error('Skin Fullart Build paths must be unique approved Asset paths');
  }
  const files = [
    'index.html', 'app.js', 'styles.css',
    'generated/hero-slice.v1.json', 'generated/hero-index.v1.json', 'generated/job-glossary.v1.json',
    'generated/general-ssr-equipment.v1.json', 'generated/exclusive-equipment.v1.json',
    'generated/sp-soldiers.v1.json', 'generated/normal-soldiers.v1.json',
    'generated/hero-soldier-relations.v1.json',
    'generated/skin-consumer.v1.json',
    skinConsumerPublicPath,
    skinAssetsPublicPath,
    'skin-fullart-presentation.mjs',
    'skin-asset-publication-contract.mjs',
    ...skinFullartPaths,
  ];
  if (shouldPublishTrainingTechDirectJson(decisionRecord)) files.push('generated/soldier-training-tech-descriptions.v1.json');
  if (exclusiveHeroPublicationDecision?.status === 'APPROVED') files.push(EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH);
  if (hero15IntegratedPublication?.status === 'APPROVED') files.push(HERO_15_MINIMAL_DETAIL_PATH, ...bondKeyAssets.map(asset => asset.path));
  if (hero15TalentPublication) {
    validateHero15TalentDecision(hero15TalentPublication);
    files.push(HERO_15_TALENT_PUBLIC_PATH);
  }
  validateHero15SoldierTextDecision(hero15SoldierTextPublication);
  files.push(HERO_15_SOLDIER_TEXT_PUBLIC);
  if (hero16IntegratedPublication?.status === 'APPROVED') files.push(HERO_16_MINIMAL_DETAIL_PATH, lanceTalentPublic, ordinaryPublic, ordinaryPublicV2, ordinaryPublicV3, ordinaryPublicV4, ordinaryPublicV5);
  if (heroMinimalDetailBatchPublication?.status === 'APPROVED') files.push(HERO_MINIMAL_DETAIL_BATCH_PATH);
  if (heroMinimalDetailTenBatchPublication?.status === 'APPROVED') files.push(HERO_MINIMAL_DETAIL_TEN_BATCH_PATH);
  if (heroMinimalDetailTwentyBatchPublication?.status === 'APPROVED') files.push(HERO_MINIMAL_DETAIL_TWENTY_BATCH_PATH);
  if (heroMinimalDetailThirtyBatchPublication?.status === 'APPROVED') files.push(HERO_MINIMAL_DETAIL_THIRTY_BATCH_PATH);
  if (heroMinimalDetailThirtyOneBatchPublication?.status === 'APPROVED') files.push(HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH);
  if (heroMinimalDetailFortyBatchPublication?.status === 'APPROVED') files.push(HERO_MINIMAL_DETAIL_FORTY_BATCH_PATH);
  for (const hero of projectApprovedFullDetailRecords(canonical, publicationDecision)) {
    if (hero.portrait === undefined) continue;
    if (!FULL_DETAIL_PORTRAIT_PROJECTION_CONTRACT.preservedCurrentPublicHeroIds.includes(hero.id)
      || typeof hero.portrait !== 'string' || !FULL_DETAIL_PORTRAIT_PROJECTION_CONTRACT.publicAssetPathPattern.test(hero.portrait)) {
      throw new Error('Unsupported public portrait path');
    }
    files.push(hero.portrait);
  }
  return [...new Set(files)].sort();
}

export async function validatePublicSiteDirectory(output, canonical, publicationDecision, decisionRecord, sourceRoot = process.cwd(), exclusiveHeroPublicationDecision = null, hero15IntegratedPublication = null, hero16IntegratedPublication = null, heroMinimalDetailBatchPublication = null, heroMinimalDetailTenBatchPublication = null, heroMinimalDetailTwentyBatchPublication = null, heroMinimalDetailThirtyBatchPublication = null, heroMinimalDetailThirtyOneBatchPublication = null, heroMinimalDetailFortyBatchPublication = null, hero15TalentPublication = defaultHero15TalentDecision, hero15SoldierTextPublication = JSON.parse(readFileSync(resolve(sourceRoot, HERO_15_SOLDIER_TEXT_DECISION), 'utf8'))) {
  const skinFullartPaths = await readApprovedSkinAssetPaths(sourceRoot);
  const expected = publicSitePaths(canonical, publicationDecision, decisionRecord, skinFullartPaths, exclusiveHeroPublicationDecision, hero15IntegratedPublication, hero16IntegratedPublication, heroMinimalDetailBatchPublication, heroMinimalDetailTenBatchPublication, heroMinimalDetailTwentyBatchPublication, heroMinimalDetailThirtyBatchPublication, heroMinimalDetailThirtyOneBatchPublication, heroMinimalDetailFortyBatchPublication, hero15TalentPublication, hero15SoldierTextPublication);
  assert.deepEqual(expected.filter(path => path.startsWith('assets/bond-materials/')),
    hero15IntegratedPublication?.status === 'APPROVED' ? bondKeyAssets.map(asset => asset.path) : [],
    'Bond key icon deployment paths mismatch');
  const allowedDirectories = new Set(expected.flatMap(file => {
    const parts = file.split('/');
    return parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join('/'));
  }));
  const actual = [];
  async function walk(relative = '') {
    for (const entry of await readdir(join(output, relative), { withFileTypes: true })) {
      const path = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!allowedDirectories.has(path)) throw new Error(`Unexpected public directory: ${path}`);
        await walk(path);
      } else if (entry.isFile()) actual.push(path);
      else throw new Error(`Non-regular public entry: ${path}`);
    }
  }
  await walk();
  if (JSON.stringify(actual.sort()) !== JSON.stringify(expected)) throw new Error('Public artifact file allowlist mismatch');
  const files = [];
  for (const path of expected) {
    const [bytes, source] = await Promise.all([readFile(join(output, path)), readFile(join(sourceRoot, path))]);
    if (path === HERO_15_SOLDIER_TEXT_PUBLIC) validateHero15SoldierTextBytes(bytes, await readFile(join(output, 'app.js'), 'utf8'));
    const icon = bondKeyAssets.find(asset => asset.path === path);
    if (icon) {
      const blob = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
      if (bytes.length !== icon.bytes || blob !== icon.blobSha1) throw new Error(`Bond key icon bytes mismatch: ${path}`);
    }
    if (!bytes.equals(source)) throw new Error(`Public artifact bytes differ from approved Source: ${path}`);
    files.push({ path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  return files;
}

function textLines(node, matches) {
  if (typeof node === 'string') return matches(node) ? [node] : [];
  const own = matches(node.textContent) ? [node.textContent] : [];
  return own.concat(node.children.flatMap(child => textLines(child, matches)));
}

const parents = new WeakMap();
const elementNavigation = {
  get nextElementSibling() {
    const siblings = parents.get(this)?.children;
    const index = siblings?.indexOf(this) ?? -1;
    return index < 0 ? null : siblings.slice(index+1).find(node => typeof node === 'object') ?? null;
  },
};
const element = tag => ({
  __proto__: elementNavigation,
  tag, textContent: '', children: [],
  get childNodes() { return this.textContent ? [this.textContent, ...this.children] : this.children; },
  append(...nodes) {
    for (const node of nodes) if (typeof node === 'object') parents.set(node,this);
    this.children.push(...nodes);
  },
  replaceChildren(...nodes) { this.children = nodes; }, addEventListener(type, callback) { this.listeners.set(type,callback); },
  listeners: new Map(),
  click() { if (!this.disabled) this.listeners.get('click')?.(); },
  attributes: new Map(),
  hasAttribute(name) { return this.attributes.has(name.toLowerCase()); },
  setAttribute(name, value) {
    const key = name.toLowerCase();
    this.attributes.set(key, String(value));
    if (key !== 'open' && key !== 'name') this[key] = String(value);
  },
  get open() { return this.hasAttribute('open'); },
  set open(value) {
    if (value) this.attributes.set('open', '');
    else this.attributes.delete('open');
  },
  get name() { return this.attributes.get('name') ?? ''; },
  set name(value) { this.attributes.set('name', String(value)); },
});

function renderAndCheckPackagedHero15(app, detail, talent, keyGroups, headGoldLine, slotGoldLines) {
  const groups = detail.heroes[0].fetterGold;
  for (const [index, values] of [bond1GoldValues, bond2GoldValues, bond3GoldValues, bond4GoldValues, bond5GoldValues, heartFetterGoldValues].entries()) {
    assert.deepEqual(groups[index], {
      labelKo: ['유대 1', '유대 2', '유대 3', '유대 4', '유대 5', '마음의 유대'][index],
      rows: values.map((gold, i) => ({ level: i + 2, gold })),
    }, 'Packaged Fetter Gold rows differ from the approved source vector');
  }
  const functions = ['renderSoldierCommandTable','renderHero15MinimalDetailView', 'renderHeroMinimalDetailView', 'renderMinimalDetailList', 'makeAnchor',
    'makeTalentPresentation', 'makeTalentDescription', 'appendSkillDescription'];
  const render = runInNewContext(functions.map(name => extractFunction(app, name)).join('\n') + '\nrenderHero15MinimalDetailView',
    { document: { createElement: element, createTextNode: text => text } });
  const approvedTotals = ['Lv.2~10 합계 골드 118,600', 'Lv.2~10 합계 골드 383,500', 'Lv.2~10 합계 골드 736,000', 'Lv.2~10 합계 골드 1,186,000', 'Lv.2~10 합계 골드 1,523,000', 'Lv.2~10 합계 골드 650,000'];
  function checkCentralDiscipline(card) {
    const sections = card.children.filter(node => node.children[0]?.textContent === '중앙율정');
    assert.equal(sections.length, 1, 'Packaged Central Discipline section count');
    const [, list, item, ...slots] = sections[0].children;
    assert.deepEqual(sections[0].children.map(node => node.tag), ['h4', 'ul', 'p', 'p', 'p', 'p', 'p'], 'Packaged Central Discipline subtotal placement');
    const originalLines = [...detail.heroes[0].centralDisciplineEffectKo.split('\n'), 'Lv.1~10 합계 골드 10,800,000'];
    assert.deepEqual(list.children.map(node => node.textContent), originalLines, 'Packaged Central Discipline list');
    assert.equal(item.textContent, headGoldLine, 'Packaged HEAD subtotal label and amount');
    assert.equal(item.children.length, 0, 'Packaged HEAD subtotal content');
    assert.deepEqual(slots.map(node => node.textContent), slotGoldLines, 'Packaged Central Discipline slot subtotal order or label');
    assert.ok(slots.every(node => node.children.length === 0), 'Packaged Central Discipline subtotals must be plain text');
    assert.deepEqual(textLines(card, text => text?.includes('소계 골드') || originalLines.includes(text)),
      [...originalLines, headGoldLine, ...slotGoldLines], 'Packaged Central Discipline lines in Hero 15 card');
  }
  const pathsById = new Map(bondKeyAssets.map(asset => [asset.itemId, './' + asset.path]));
  function checkBadges(parent, pairs) {
    assert.equal(parent.children.length, pairs.length, 'Bond key badge count or group boundary mismatch');
    for (const [index, [itemId, count]] of pairs.entries()) {
      const badge = parent.children[index];
      assert.equal(badge.tag, 'span', 'Bond key badge element mismatch');
      assert.equal(badge.children.length, 2, 'Bond key badge must contain only an image and quantity');
      const [image, quantity] = badge.children;
      assert.equal(image.tag, 'img', 'Bond key badge must use a single img');
      assert.equal(image.children.length, 0);
      assert.equal(image.src, pathsById.get(itemId), 'Bond key icon local src mismatch');
      assert.equal(image.alt, '', 'Bond key icon alt must be explicitly empty');
      assert.ok(!('srcset' in image), 'Bond key icon srcset is forbidden');
      assert.ok(!('title' in badge || 'title' in image), 'Bond key badge or image title is forbidden');
      assert.ok(!badge.textContent && !image.textContent, 'Bond key badge contains unexpected text');
      assert.equal(quantity, `×${count}`, 'Bond key quantity mismatch');
    }
  }
  function check(sample, changedGroup) {
    const container = element();
    render(sample, talent, container);
    const card = container.children[0];
    if (sample === detail) checkCentralDiscipline(card);
    const panels = card.children.filter(node => node.children[0]?.textContent === '유대 강화 골드');
    assert.equal(panels.length, 1);
    const [panel] = panels;
    assert.equal(panel.tag, 'details');
    assert.equal(panel.children[0].tag, 'summary');
    assert.equal(panel.hasAttribute('open'), false);
    assert.equal(panel.open, false);
    const names = new Set([panel.name]);
    const totals = approvedTotals.map((line, i) => i === changedGroup ? null : line);
    assert.deepEqual(textLines(card, text => text?.startsWith('Lv.2~10 합계 골드')), totals.filter(Boolean), 'Unexpected Fetter Gold totals in the card');
    assert.deepEqual(textLines(card, text => text?.includes('마음의 열쇠')), []);
    assert.equal(panel.children.length, groups.length + 1);
    for (const [i, group] of sample.heroes[0].fetterGold.entries()) {
      const section = panel.children[i + 1];
      assert.equal(section.tag, 'section');
      const [levels, ...afterList] = section.children;
      assert.equal(levels.tag, 'details');
      assert.deepEqual(levels.children.map(node => node.tag), ['summary', 'ul'], `Bond level list ownership: ${group.labelKo}`);
      const [heading, list] = levels.children;
      assert.equal(heading.textContent, group.labelKo);
      assert.equal(heading.children.length, 0);
      assert.equal(levels.hasAttribute('open'), false, 'Bond level list must start closed');
      assert.equal(levels.open, false, 'Bond level list must start closed');
      if (levels.name) {
        assert.ok(!names.has(levels.name), 'Bond level lists must open independently');
        names.add(levels.name);
      }
      assert.ok(list.children.every(row => row.tag === 'li'));
      assert.deepEqual(list.children.map(row => row.textContent), group.rows.map(
        ({ level, gold }) => `Lv.${level} · ${gold.toLocaleString('ko-KR')} 골드`));
      list.children.forEach((row, level) => checkBadges(row, keyGroups[i]?.levels[level] ?? []));
      const expectedCount = Number(Boolean(totals[i])) + Number(Boolean(keyGroups[i]));
      assert.equal(afterList.length, expectedCount, 'Bond key group summary placement');
      if (totals[i]) {
        assert.equal(afterList[0].tag, 'p');
        assert.equal(afterList[0].textContent, totals[i]);
        assert.equal(afterList[0].children.length, 0);
      }
      if (keyGroups[i]) {
        const summary = afterList.at(-1);
        assert.equal(summary.tag, 'p');
        assert.ok(!summary.textContent);
        checkBadges(summary, keyGroups[i].totals);
      }
    }
    return card;
  }
  const card = check(detail);
  for (const index of approvedTotals.keys()) {
    for (const level of groups[index].rows.keys()) {
      const changed = structuredClone(detail);
      changed.heroes[0].fetterGold[index].rows[level].gold++;
      check(changed, index);
    }
  }
  for (const [index, otherRow] of [[0, 1], [1, 1], [2, 1], [3, 8], [4, 8], [5, 8]]) {
    const swapped = structuredClone(detail);
    const rows = swapped.heroes[0].fetterGold[index].rows;
    [rows[0].gold, rows[otherRow].gold] = [rows[otherRow].gold, rows[0].gold];
    check(swapped, index);
  }
  // Preserve headings and levels while making the amounts identical across two groups.
  for (const [source, destination] of [[1, 2], [2, 3], [3, 4], [4, 5], [5, 4]]) {
    const matchingAmounts = structuredClone(detail);
    for (const [i, row] of matchingAmounts.heroes[0].fetterGold[destination].rows.entries()) {
      row.gold = groups[source].rows[i].gold;
    }
    check(matchingAmounts, destination);
  }
  return card;
}

function checkLanceGold(card, lines, effects = []) {
  const goldText = text => text === '중앙율정' || text?.includes('Lv.1~10') && text.includes('골드');
  const actual = textLines(card, goldText);
  const knownEffects = ['상성 우세인 부대와 전투 시 모든 스탯 +15%', '혼합부대로 구성 시 이동력 +2, 전투 후 피해량의 20%만큼 회복'];
  const cardEffects = textLines(card, text => knownEffects.some(line => text?.includes(line)));
  assert.deepEqual(cardEffects, effects, 'Lance central effect order or placement');
  if (!lines) {
    assert.deepEqual(actual, [], 'Base Lance card must have zero gold paragraphs');
    return;
  }
  const section = card.children[10];
  assert.equal(section?.tag, 'section', 'Lance gold section must immediately follow the job path');
  assert.equal(section.attributes.size, 0);
  assert.deepEqual(section.children.map(node => node.tag), ['h4', ...effects.map(() => 'p'), ...lines.map(() => 'p')]);
  assert.ok(section.children.every(node => node.attributes.size === 0 && node.children.length === 0));
  const expected = ['중앙율정', ...lines];
  const children = section.children;
  assert.deepEqual(children.slice(1, 1 + effects.length).map(node => node.textContent), effects, 'Lance central effect order or placement');
  for (const node of children.slice(1, 1 + effects.length)) {
    assert.equal(node.childNodes.length, 1);
    assert.ok(!node.id && !node.title && !Object.keys(node.dataset ?? {}).length, 'Unexpected Lance effect metadata');
  }
  assert.deepEqual([children[0], ...children.slice(1 + effects.length)].map(node => node.textContent), expected, 'Lance gold paragraph attribution');
  assert.deepEqual(actual, expected, 'Lance gold paragraphs must occur once on the card');
}

function checkLanceBondPanel(card, lines, open = false) {
  const panels = card.children.filter(node => node.tag === 'details' && node.children[0]?.textContent === '유대 강화 골드');
  assert.equal(panels.length, Number(Boolean(lines)), 'Lance bond total disclosure count');
  if (!lines) return;
  const [panel] = panels;
  assert.equal(card.children[11], panel, 'Lance bond panel must immediately follow central discipline');
  assert.equal(panel.hasAttribute('open'), open);
  assert.equal(panel.open, open);
  assert.deepEqual(panel.children.map(node => node.tag), ['summary', ...lines.map(() => 'p')]);
  assert.deepEqual(panel.children.map(node => node.textContent), ['유대 강화 골드', ...lines], 'Lance bond total paragraph attribution');
  assert.ok(panel.children.every(node => !node.attributes.size && !node.children.length && !node.ariaLabel && !node.hidden));
  assert.deepEqual(textLines(card, text => lines.some(line => text?.includes(line))), lines, 'Lance bond total occurrences');
  return panel;
}

const finalJobText = ['전직 · 드래곤 나이트 → 드래곤 마스터', '전직 · 하이랜더 → 로열 나이트'];
const finalMovementText = [
  '전직 · 드래곤 나이트 → 드래곤 마스터 · 기본 사거리 1 · 비행 · 이동력 5',
  '전직 · 하이랜더 → 로열 나이트 · 기본 사거리 1 · 기마 · 이동력 5',
];

function checkFinalPathText(card, lines = []) {
  const paragraphs = [];
  function collect(node) {
    if (node.tag === 'p') paragraphs.push(node.textContent);
    for (const child of node.children ?? []) collect(child);
  }
  collect(card);
  for (const [index, oldText] of finalJobText.entries()) {
    const newText = finalMovementText[index];
    const oldCount = paragraphs.filter(text => text === oldText).length;
    const newCount = paragraphs.filter(text => text === newText).length;
    assert.equal(oldCount, Number(lines.includes(oldText)), 'Lance old final job paragraph occurrence: ' + oldText);
    if (lines.includes(newText) && paragraphs.some(text => text.startsWith(oldText + ' ·') && text !== newText)) {
      assert.fail('Lance successor Job movement mismatch: ' + oldText);
    }
    assert.equal(newCount, Number(lines.includes(newText)), 'Lance final job paragraph attribution');
  }
}

function checkFinalPaths(card, lines = []) {
  checkFinalPathText(card, lines);
  for (const [index, line] of lines.entries()) {
    const node = card.children[12 + index];
    assert.equal(node?.tag, 'p');
    assert.equal(node.textContent, line, 'Lance final job paragraph placement');
    assert.ok(!node.children.length && !node.attributes.size && !node.hidden && !node.ariaLabel);
    assert.deepEqual(Object.keys(node), Object.keys(card.children[9]));
    assert.equal(card.children[11 + index].nextElementSibling, node, 'Lance consecutive final job paragraphs after bond gold');
  }
}

function checkPackagedHero16(app, detail, profileLines, jobPath, goldLines, effectLines, bondTotals, finalPaths, commandRows, heartGroups, bondDescriptions) {
  const renderer = ['renderSoldierCommandTable','renderHeroMinimalDetailView', 'renderHero16MinimalDetailView'].map(name => extractFunction(app, name)).join('\n');
  const render = runInNewContext(renderer + '\nrenderHero16MinimalDetailView', { document: { createElement: element } });
  const root = element('div');
  render(detail, root);
  const [card] = root.children;
  const expected = ['란스', 'Hero ID 16', '프로젝트 검수 표시명 · 공식 한국 서버 Provenance 미확인',
    ...profileLines, '칼자스의 왕관 (Equipment ID 418)', detail.heroes[0].exclusiveEquipment.effectDescriptionKo];
  assert.equal(root.children.length, 1);
  assert.deepEqual(card.children.slice(0, expected.length).map(node => node.textContent), expected, 'Packaged Hero 16 profile text or placement mismatch');
  const path = card.children[expected.length];
  assert.equal(path?.textContent, jobPath, 'Packaged Hero 16 job path text or direction mismatch');
  assert.deepEqual(textLines(card, text => text?.includes(jobPath)), [jobPath], 'Packaged Hero 16 job path occurrence mismatch');
  assert.equal(path.attributes.size, 0, 'Packaged Hero 16 job path must have no attributes');
  assert.deepEqual(Object.keys(path), Object.keys(element('p')), 'Packaged Hero 16 job path must have no additional properties');
  checkFinalPathText(card, finalPaths);
  checkLanceCommand(card, commandRows);
  checkLanceHeart(card, heartGroups, bondDescriptions);
  assert.deepEqual(card.children.map(node => node.tag), ['h3', 'p', 'p', 'p', 'p', 'p', 'p', 'h4', 'p', 'p', 'section', 'details', 'p', 'p','section','section','p','p','p','p']);
  checkFinalPaths(card, finalPaths);
  checkLanceBondPanel(card, bondTotals);
  checkLanceGold(card, goldLines, effectLines);
  assert.ok(card.children.slice(0, -10).every(node => node.children.length === 0), 'Packaged Hero 16 rows must contain only text');
}

const oldLanceSkillLines = [
  '뇌광 · 물리 피해 · 2코스트 · 쿨 3턴 · 사거리 1칸 · 범위 단일 · 단일 적 부대를 공격해 1.5배 피해를 준다. 이 스킬로 적을 처치하면 스킬 쿨타임 -3.',
  '격돌 · 물리 피해 · 1코스트 · 쿨 2턴 · 사거리 1칸 · 범위 단일 · 단일 적 부대를 공격해 1.2배 피해를 준다. 대상을 2칸 밀쳐내고 이동력 -2와 호위 불가를 1턴 부여한다.',
];

const newLanceSkillLines = [
  '바람의 분노 · 물리 피해 · 2코스트 · 쿨 2턴 · 사거리 자신 · 범위 주위 1칸 · 주위 1칸 내 모든 적에게 0.3배 범위 피해를 주고 각 대상에게 무작위 디버프를 부여한다.',
  ...oldLanceSkillLines,
  '구급 · 치료 · 1코스트 · 쿨 3턴 · 사거리 자신 · 범위 단일 · 자신 부대 생명 100% 회복.',
  '돌진 · 패시브 · 1코스트 · 공격 전 이동 1칸마다 공격 +5%, 최대 +15%.',
];

const lanceSkillLinesV3 = [
  ...newLanceSkillLines.slice(0,4),
  '공격 지휘 · 패시브 · 2코스트 · 주위 2칸 내 모든 아군의 공격, 지력 +10%.',
  newLanceSkillLines[4],
  '방어 위협 · 패시브 · 2코스트 · 행동 종료 시 주위 2칸 내 모든 적의 방어 -15%, 1턴 지속.',
];

const lanceSkillLinesV4 = [...lanceSkillLinesV3.slice(0,6),
  "제국 질풍 · 초절강화 · 2코스트 · 쿨 3턴 · 사거리 자신 · 범위 전체 · [초절강화] 범위 내 모든 '제국의 빛' 아군의 공격, 방어 능력치가 크게 상승한다. 4턴 지속. 다른 초절강화와 중첩되지 않는다.",
  lanceSkillLinesV3[6],
];

const windLine = '바람 타기 · 패시브 · 1코스트 · 생명 50% 이상일 때 전투 진입 시 받는 모든 피해량 -15%.';
const lanceSkillLinesV5 = [...lanceSkillLinesV4.slice(0,3),windLine,...lanceSkillLinesV4.slice(3)];

async function checkPackagedLanceStartup(output, html, app, talent, skills, otherVersion, hasNameAndVoice, goldLines, effectLines, bondComparison) {
  const traces = [];
  const oldApp = skills.schemaVersion === 1;
  const skillPath = [ordinaryPublic,ordinaryPublicV2,ordinaryPublicV3,ordinaryPublicV4,ordinaryPublicV5][skills.schemaVersion-1];
  const lanceSkillLines = [oldLanceSkillLines,newLanceSkillLines,lanceSkillLinesV3,lanceSkillLinesV4,lanceSkillLinesV5][skills.schemaVersion-1];
  const { selectSkinFullarts } = await import(pathToFileURL(join(output,'skin-fullart-presentation.mjs')).href);
  const source = app.replace("import { selectSkinFullarts } from './skin-fullart-presentation.mjs';", '');
  const script = new Script('(async () => { "use strict";\n' + source + '\nreturn hero16MinimalDetailNavigation; })()');
  const settle = () => new Promise(resolve => setImmediate(resolve));
  const response = data => ({ok:true, status:200, json:async()=>data});
  const visible = node => typeof node === 'string' ? node : node.textContent + node.children.map(visible).join('');
  function walk(node, matches, found = []) {
    if (typeof node !== 'string') {
      if (matches(node)) found.push(node);
      for (const child of node.children) walk(child, matches, found);
    }
    return found;
  }
  const scenarios = [
    ['skills','success'], ['skills','failure'], ['talent','success'], ['talent','failure'], ['talent','invalid-second-row'],
    ['skills','blank-lower-star'], ['talent','other-version'],
    ...(skills.schemaVersion >= 3 ? [
      ['skills','success',false], ['skills','failure',false],
      ['talent','success',false], ['talent','failure',false],
    ] : []),
    ...(skills.schemaVersion >= 4 ? [['talent', skills.schemaVersion === 5 ? 'invalid-wind' : 'invalid-storm']] : []),
    ...oldApp ? [] : [['talent','invalid-last-row'], ['talent','wrong-version'], ['talent','wrong-description']],
  ];
  // Each session parses fresh responses from the same immutable final package.
  const packageText = new Map();
  const baseUrl = './' + HERO_16_MINIMAL_DETAIL_PATH;
  const talentUrl = './' + lanceTalentPublic;
  const skillsUrl = './' + skillPath;
  for (const [first,outcome,firstSucceeded = true] of scenarios) {
    const roots = new Map();
    const errors = [];
    let scrollTarget;
    const make = tag => Object.assign(element(tag), {
      value:'', hidden:false, focus() {}, scrollIntoView() { scrollTarget=this.id; },
      insertBefore(node,next) {
        const index=this.children.indexOf(next);
        assert.notEqual(index,-1);
        this.children.splice(index,0,node);
      },
    });
    for (const match of html.matchAll(/<([a-z][\w-]*)\b[^>]*?\sid="([^"]+)"/gi)) {
      const node = make(match[1]);
      node.id = match[2];
      roots.set(node.id,node);
    }
    const getById = id => roots.get(id) ?? Array.from(roots.values()).flatMap(root=>walk(root,n=>n.id===id))[0];
    const document = {
      baseURI:pathToFileURL(join(output,'index.html')).href,
      createElement:make, createTextNode:text=>text, getElementById:getById,
      querySelector:selector=>roots.get(selector.slice(1)) ?? null,
    };
    const pending = new Map();
    const requests = [];
    const fetchCounts = new Map();
    const snapshot = () => [...fetchCounts].sort(([a], [b]) => a.localeCompare(b));
    const fetch = async url => {
      const absolute = new URL(url, document.baseURI).href;
      fetchCounts.set(absolute, (fetchCounts.get(absolute) ?? 0) + 1);
      if (url === baseUrl || url === talentUrl || url.startsWith('./generated/hero-16-ordinary-skills-public.')) requests.push(url);
      if (url === skillsUrl || url === talentUrl) {
        assert.ok(!pending.has(url),'Duplicate optional Lance request');
        return new Promise(resolve=>pending.set(url,resolve));
      }
      if (!packageText.has(url)) packageText.set(url,readFile(join(output,url),'utf8'));
      return response(JSON.parse(await packageText.get(url)));
    };
    const startup = script.runInNewContext({
      document, fetch, selectSkinFullarts, window:{location:{hash:''},requestAnimationFrame:callback=>callback()},
      console:{error:e=>errors.push(e.message), warn() {}, log() {}}, URL, URLSearchParams, AbortController, Request, Response, Headers,
    },{timeout:10000});
    let timeout;
    let navigation;
    try {
      navigation = await Promise.race([startup,new Promise((_,reject)=>{
        timeout=setTimeout(()=>reject(new Error('Lance startup blocked by optional request')),10000);
      })]);
    } finally { clearTimeout(timeout); }
    assert.deepEqual(errors,[]);
    const resolveTalent=pending.get('./'+lanceTalentPublic);
    const resolveSkills=pending.get('./'+skillPath);
    assert.deepEqual(requests.slice(0,1),[baseUrl]);
    assert.deepEqual(requests.slice(1).sort(),[talentUrl,skillsUrl].sort());
    assert.ok(resolveTalent && resolveSkills,'Both Lance requests must start independently');
    const card=getById('hero-minimal-detail-16-content').children[0];
    const base=[...card.children];
    const nameAndVoice = ['중국어명 · 兰斯 / 영문명 · Lance','성우 · 모가미 츠구오'];
    const profile = ['등급 · SR','진영 · 빛의 군단 · 제국의 빛 · 전략의 대가'];
    if (hasNameAndVoice) profile.push(...nameAndVoice);
    function checkProfileAttribution() {
      for (const [i,line] of nameAndVoice.entries()) {
        const matches = Array.from(roots.values()).flatMap(root=>walk(root,n=>n.textContent===line));
        assert.ok(hasNameAndVoice ? matches.length === 1 && matches[0] === card.children[5+i] : matches.length === 0,
          'Lance profile paragraph attribution');
      }
    }
    checkProfileAttribution();
    checkFinalPathText(card, bondComparison?.finalPaths);
    assert.equal(base.length,(hasNameAndVoice ? 10 : 8) + Number(Boolean(goldLines)) + Number(Boolean(bondComparison?.lines)) + (bondComparison?.finalPaths?.length ?? 0) + Number(Boolean(bondComparison?.commandRows)) + Number(Boolean(bondComparison?.heartGroups)) + (bondComparison?.bondDescriptions?.length ?? 0), 'Lance initial profile child count');
    assert.equal(base[hasNameAndVoice ? 9 : 7].textContent,'전직 · 호크 나이트 → 하이랜더');
    checkLanceGold(card, goldLines, effectLines);
    checkLanceCommand(card, bondComparison?.commandRows);
    checkLanceHeart(card, bondComparison?.heartGroups, bondComparison?.bondDescriptions);
    checkFinalPaths(card, bondComparison?.finalPaths);
    const panel = checkLanceBondPanel(card, bondComparison?.lines);
    if (bondComparison) {
      traces.push(snapshot());
      for (const open of [true, false, true]) {
        const before = snapshot();
        if (panel) {
          // Model native summary activation in this DOM fixture. Chromium covers the real default action.
          panel.children[0].click();
          panel.open = open;
          panel.listeners.get('toggle')?.();
        }
        await settle();
        checkLanceBondPanel(card, bondComparison.lines, open);
        checkLanceCommand(card, bondComparison.commandRows);
        checkLanceHeart(card, bondComparison.heartGroups, bondComparison.bondDescriptions);
        checkFinalPaths(card, bondComparison.finalPaths);
        assert.deepEqual(snapshot(), before, 'Lance disclosure initiated a fetch');
        traces.push(snapshot());
      }
    }
    function checkNavigation() {
      checkLanceCommand(card, bondComparison?.commandRows);
      checkLanceHeart(card, bondComparison?.heartGroups, bondComparison?.bondDescriptions);
      checkFinalPaths(card, bondComparison?.finalPaths);
      checkLanceBondPanel(card, bondComparison?.lines, true);
      checkLanceGold(card, goldLines, effectLines);
      assert.equal(card.children[hasNameAndVoice ? 9 : 7].textContent,'전직 · 호크 나이트 → 하이랜더');
      assert.deepEqual(card.children.slice(3,4+profile.length).map(n=>n.textContent),
        [...profile,'칼자스의 왕관 (Equipment ID 418)'],'Lance profile order while loading');
      checkProfileAttribution();
      const fragment='hero-minimal-detail-16';
      assert.ok(navigation.showTarget(16));
      assert.equal(getById(fragment+'-content').children[0],card);
      assert.ok(base.every((node,i)=>card.children[i]===node));
      for (const id of ['hero-index-entry-16','equipment-418']) {
        const links=walk(getById(id),n=>n.href==='#'+fragment);
        assert.equal(links.length,1);
        scrollTarget=null;
        links[0].click();
        assert.equal(scrollTarget,fragment);
      }
    }
    function checkSkills(present) {
      const section=card.children.find(n=>n.className==='hero-ordinary-skills');
      assert.equal(walk(card,n=>n.textContent==='일반 스킬').length,Number(present));
      if (present && skills.schemaVersion === 5) {
        const rendered = section.children[1].children.map(node=>node.textContent);
        const wind = rendered.filter(text=>text.startsWith('바람 타기 ·'));
        if (wind.length === 1) assert.equal(wind[0],windLine,'10418 rendered Korean text');
        if (JSON.stringify(rendered.filter(text=>text!==windLine)) === JSON.stringify(lanceSkillLinesV4)) {
          assert.equal(rendered[3],windLine,'10418 rendered row must follow 격돌 and precede 구급');
        }
      }
      const matchingLines = node => lanceSkillLinesV5.includes(node.textContent);
      const cardLines = walk(card,matchingLines).map(node=>node.textContent);
      const siteLines = Array.from(roots.values()).flatMap(root=>walk(root,matchingLines)).map(node=>node.textContent);
      for (const line of lanceSkillLinesV5) {
        const count = Number(present && lanceSkillLines.includes(line));
        assert.equal(cardLines.filter(text=>text===line).length,count,'Packaged Lance ordinary skill row text or placement');
        assert.equal(siteLines.filter(text=>text===line).length,count,'Lance ordinary skill leaked outside its card');
      }
      if (!present) { assert.equal(section,undefined); return; }
      const [title,list]=section.children;
      assert.deepEqual(section.children.map(n=>n.tag),['h4','ul']);
      assert.equal(title.textContent,'일반 스킬');
      assert.deepEqual(list.children.map(n=>n.textContent),lanceSkillLines,'Packaged Lance ordinary skill row text or placement');
      assert.ok(list.children.every(n=>n.tag==='li' && !n.children.length));
      return section;
    }
    function selectFive() {
      const section=card.children[base.length];
      const [heading,name,lower,higher,list,original]=section.children;
      assert.equal(heading.id,'hero-16-talent-heading');
      assert.equal(name.textContent,'하늘의 사령관');
      assert.equal(original.open,false);
      original.open=true;
      const cnRows=original.children[1].children;
      const expectedCn=talent.talent.starDescriptions.map(row=>[
        `${row.star}성 · Skill ID ${row.skillId} · ${row.nameCn}`,row.descriptionCn.replace(/<[^>]+>/g,''),
      ]);
      function checkStar(star) {
        const row=talent.talent.starDescriptions.find(r=>r.star===star);
        assert.equal(card.children[base.length],section);
        assert.equal(list.children.length,1);
        assert.deepEqual(list.children[0].children.map(visible),[`${star}성`,row.descriptionKoRaw.replace(/<[^>]+>/g,'')]);
        assert.equal(lower.disabled,star===2);
        assert.equal(higher.disabled,star===6);
        assert.equal(original.open,true);
        assert.equal(original.children[1].children,cnRows);
        assert.deepEqual(cnRows.map(n=>n.children.map(visible)),expectedCn);
      }
      for (const [i,star] of [6,5,4,3,2,3,4,5,6].entries()) {
        checkStar(star);
        if (i<4) lower.click();
        else if (i<8) higher.click();
      }
      lower.click();
      checkStar(5);
      return ()=>checkStar(5);
    }
    checkNavigation();
    checkSkills(false);
    if (first==='skills') {
      resolveSkills(firstSucceeded ? response(skills) : {ok:false});
      await settle();
      if (bondComparison) traces.push(snapshot());
      assert.equal(card.children.length,base.length+Number(firstSucceeded));
      const existing=checkSkills(firstSucceeded);
      checkNavigation();
      if (outcome==='blank-lower-star') {
        const invalid=structuredClone(talent);
        invalid.talent.starDescriptions[0].descriptionKoRaw=' ';
        resolveTalent(response(invalid));
      } else resolveTalent(outcome==='success'?response(talent):{ok:false});
      await settle();
      if (bondComparison) traces.push(snapshot());
      assert.equal(card.children.length,base.length+Number(firstSucceeded)+Number(outcome==='success'));
      if (outcome==='success') selectFive();
      if (firstSucceeded) assert.equal(card.children.at(-1),existing);
      checkSkills(firstSucceeded);
    } else {
      resolveTalent(firstSucceeded ? response(talent) : {ok:false});
      await settle();
      if (bondComparison) traces.push(snapshot());
      assert.equal(card.children.length,base.length+Number(firstSucceeded));
      const checkSelection = firstSucceeded ? selectFive() : () =>
        assert.equal(walk(card,n=>n.id==='hero-16-talent-heading').length,0);
      checkSelection();
      checkSkills(false);
      checkNavigation();
      const payload = structuredClone(skills);
      if (outcome==='invalid-second-row') payload.ordinarySkills[1].descriptionKo=' ';
      if (outcome==='invalid-last-row') payload.ordinarySkills.at(-1).descriptionKo=' ';
      if (outcome==='wrong-version') payload.schemaVersion=skills.schemaVersion+1;
      if (outcome==='invalid-wind') {
        const row = payload.ordinarySkills.find(r=>r.skillId===10418);
        row.descriptionKo = row.descriptionKo.replace('50% 이상','50% 초과');
      }
      if (outcome==='invalid-storm') payload.ordinarySkills.find(r=>r.skillId===11819).descriptionKo+='!';
      if (outcome==='wrong-description') payload.ordinarySkills[0].descriptionKo+='!';
      if (outcome==='other-version') resolveSkills(response(otherVersion));
      else resolveSkills(outcome==='failure' ? {ok:false} : response(payload));
      await settle();
      if (bondComparison) traces.push(snapshot());
      checkSelection();
      assert.equal(card.children.length,base.length+Number(firstSucceeded)+Number(outcome==='success'));
      checkSkills(outcome==='success');
    }
    checkNavigation();
    assert.deepEqual(requests.slice().sort(),[baseUrl,talentUrl,skillsUrl].sort(),'Lance ordinary skill request or fallback');
  }
  return traces;
}

function checkPackagedSoldierCommand(card) {
  const sections = card.children.filter(node => node.children[0]?.textContent === '병사 지휘 보정');
  assert.equal(sections.length, 1, 'Hero 15 Soldier Command section count');
  const [section] = sections;
  const position = card.children.indexOf(section);
  assert.equal(card.children[position - 1]?.children[0]?.textContent, '용병');
  assert.equal(card.children[position + 1]?.children[0]?.textContent, '전직');

  validateCommandTable(section, [
    ['생명', '+15%', '+25%'], ['공격', '', '+10%'], ['방어', '', '+10%'], ['마방', '+15%', '+25%'],
  ]);
}

function checkLanceHeart(card, groups, bondDescriptions) {
  const title = '마음의 유대';
  const sections = card.children.filter(node => node.children[0]?.textContent === title);
  assert.deepEqual(textLines(card,text=>text===title),groups ? [title] : [],'Lance Heart heading');
  assert.equal(sections.length,Number(Boolean(groups)),'Lance Heart section count');
  if (!groups) return;
  const [section] = sections;
  const command = card.children.find(node=>node.children[0]?.textContent==='병사 지휘 보정');
  assert.ok(command?.nextElementSibling === section,'Lance Heart placement after command');
  const tags = node => node.childNodes.map(child=>child.tag);
  assert.deepEqual(tags(section),['h4','section','section'],'Lance Heart structure');
  const lines = groups.flatMap(group=>group.slice(1));
  for (const [i,group] of section.children.slice(1).entries()) {
    assert.deepEqual(tags(group),['h5','p','p'],'Lance Heart group structure');
    const values = group.children.map(node=>node.textContent);
    assert.equal(values[0],groups[i][0],'Lance Heart job heading');
    assert.ok(values.slice(1).every(line=>lines.includes(line)),'Lance Heart effect text');
    assert.deepEqual(values,groups[i],'Lance Heart job attribution');
  }
  for (const line of lines) assert.equal(textLines(card,text=>text?.includes(line)).length,1,'Lance Heart effect occurrence');
  for (const node of [section,...section.children,...section.children.slice(1).flatMap(group=>group.children)]) {
    assert.ok(!node.attributes.size && !node.hidden && !node.title && !Object.keys(node.dataset ?? {}).length,'Lance Heart plain elements');
    if (node.tag !== 'section') assert.equal(node.childNodes.length,1,'Lance Heart plain text');
  }
  const expected = ['유대 2 · 레벨 30 달성', '유대 3 · 란스를 출전시켜 시공의 균열 3-1[정예] 클리어'];
  if (bondDescriptions) {
    assert.deepEqual(bondDescriptions.slice(0, 2), expected, 'Lance translated bond descriptions');
    const first = section.nextElementSibling;
    const second = first?.nextElementSibling;
    assert.ok(first?.textContent.startsWith('유대 2 ·') && second?.textContent.startsWith('유대 3 ·'),
      'Lance bond description placement after Heart Fetter');
    for (const [index, paragraph] of [first, second].entries()) {
      assert.equal(paragraph.textContent, expected[index], 'Lance bond description rendered text');
      assert.ok(card.children.includes(paragraph) && paragraph.tag === 'p' && !paragraph.hidden && !paragraph.attributes.size,
        'Lance bond description visible card paragraph');
      assert.deepEqual(paragraph.childNodes, [expected[index]], 'Lance bond description plain text');
    }
  }
  for (const line of expected) {
    assert.equal(textLines(card, text => text?.includes(line)).length, bondDescriptions ? 1 : 0, 'Lance bond description occurrence');
  }
  const companionLines = ['유대 4 · 나암과 함께 운명의문 4 클리어', '유대 5 · 쉐리와 함께 운명의문 5 클리어'];
  const companionDescriptions = bondDescriptions?.slice(2) ?? [];
  if (companionDescriptions.length) {
    assert.deepEqual(companionDescriptions, companionLines, 'Lance companion bond descriptions');
    let previous = section.nextElementSibling.nextElementSibling;
    for (const [index, line] of companionLines.entries()) {
      const bond = [4, 5][index];
      const paragraph = previous.nextElementSibling;
      assert.ok(card.children.includes(paragraph) && paragraph?.tag === 'p' && paragraph.textContent.startsWith('유대 ' + bond + ' · '),
        'Lance companion paragraph placement after bond ' + (bond - 1));
      assert.equal(paragraph.textContent, line, 'Lance bond ' + bond + ' rendered Gate of Fate number or text');
      assert.deepEqual(paragraph.childNodes, [line], 'Lance companion paragraph plain text');
      assert.ok(!paragraph.hidden && !paragraph.attributes.size, 'Lance companion paragraph visibility');
      previous = paragraph;
    }
  }
  for (const line of companionLines) {
    assert.equal(textLines(card, text => text?.includes(line)).length, companionDescriptions.length ? 1 : 0, 'Lance companion paragraph occurrence');
  }
}

function checkLanceCommand(card, rows) {
  const label = '병사 지휘 보정';
  const sections = card.children.filter(node => node.children[0]?.textContent === label);
  assert.deepEqual(textLines(card,text => text === label),rows ? [label] : [], 'Lance command heading occurrences');
  assert.equal(sections.length,Number(Boolean(rows)), 'Lance command section count');
  if (!rows) return;
  const secondPath = card.children.find(node => node.tag === 'p' && [finalJobText[1], finalMovementText[1]].includes(node.textContent));
  assert.ok(secondPath, 'Lance final job paragraph attribution');
  assert.ok(secondPath.nextElementSibling === sections[0], 'Lance command must immediately follow second final job paragraph');
  validateCommandTable(sections[0], rows);
}

function validateCommandTable(section, expected) {
  function checkStructure(node, tag, children) {
    assert.equal(node.tag, tag);
    assert.deepEqual(node.childNodes.map(child => child.tag), children, 'Soldier Command table structure');
  }
  checkStructure(section, 'section', ['h4', 'table']);
  const [heading, table] = section.children;
  assert.equal(heading.children.length, 0);
  checkStructure(table, 'table', ['thead', 'tbody']);
  const [head, body] = table.children;
  checkStructure(head, 'thead', ['tr']);
  checkStructure(head.children[0], 'tr', ['th', 'th', 'th']);
  assert.deepEqual(head.children[0].children.map(cell => [cell.scope, cell.textContent, cell.children.length]), [
    ['col', '능력치', 0], ['col', '기본 지휘', 0], ['col', '최대 레벨 일반 유대', 0],
  ]);

  checkStructure(body, 'tbody', ['tr', 'tr', 'tr', 'tr']);
  for (const [i, row] of body.children.entries()) {
    checkStructure(row, 'tr', ['th', 'td', 'td']);
    const [label, base] = row.children;
    assert.equal(label.scope, 'row');
    if (expected[i][0] === '마방' && expected[i][1] === '') {
      assert.equal(base.textContent, '', 'Lance unadmitted base magic defense text');
      assert.ok(!base.hasAttribute('aria-label') && !base.ariaLabel, 'Lance base magic defense accessible name');
      assert.ok(!base.hasAttribute('aria-description') && !base.ariaDescription, 'Lance base magic defense accessible description');
    }
    assert.deepEqual(row.children.map(cell => cell.textContent), expected[i], `Soldier Command values: ${expected[i][0]}`);
    assert.ok(row.children.every(cell => cell.children.length === 0), 'Soldier Command cells must be plain text');
    if (expected[i][1] === '') {
      assert.equal(base.childNodes.length, 0, 'Empty Soldier Command cell has child nodes');
      const hiddenAttributes = [...base.attributes.keys()].filter(key =>
        key === 'title' || key === 'value' || key.startsWith('aria-') || key.startsWith('data-'));
      const hiddenProperties = ['title', 'ariaLabel', 'ariaDescription', 'ariaLabelledByElements', 'ariaDescribedByElements', 'value'];
      // The startup fixture sets value='' on every element, including table cells.
      const plainCell = hiddenProperties.every(key => !Object.hasOwn(base,key)
        || (key === 'value' && base.value === '' && Object.hasOwn(base,'focus')));
      assert.ok(hiddenAttributes.length === 0 && plainCell
        && !base.innerText && !base.innerHTML && !Object.keys(base.dataset ?? {}).length,
      'Empty Soldier Command cell has a hidden value');
    }
  }
}

function checkPackagedSkillDescriptions(card, descriptions) {
  const sections = card.children.filter(node => node.children[0]?.textContent === '일반 스킬');
  assert.equal(sections.length, 1, 'Packaged ordinary skill section count');
  const list = sections[0].children[1];
  assert.equal(list.tag, 'ul');
  const expectedRows = [
    '힐 · 치료 · 1코스트 · 사거리 2칸 · 범위 단일 · 단일 아군의 생명을 시전자 지력의 5배만큼 회복하고 디버프 1개를 제거한다.',
    '어게인 · 지원 · 2코스트 · 쿨 2턴 · 사거리 2칸 · 범위 단일 · 행동을 마친 아군 1부대를 다시 행동할 수 있게 하고 시전자 지력 2배만큼 생명을 회복시킨다.',
    '복음 · 지원 · 2코스트 · 쿨 2턴 · 사거리 3칸 · 범위 단일 · [지원] 단일 부대의 공격, 지력, 방어 +20% 및 모든 디버프 면역, 2턴 지속.',
    '윈드 커터 · 마법 피해 · 1코스트 · 쿨 1턴 · 사거리 2칸 · 범위 단일 · 단일 적 부대를 공격해 1.5배의 마법 피해를 준다. 비병에게 더 큰 피해를 준다.',
    '빙결 · 마법 피해 · 1코스트 · 쿨 1턴 · 사거리 2칸 · 범위 단일 · 적 1부대에 1.5배의 마법 피해를 준다. 창병에게 더 큰 피해를 준다.',
    '광역 실드 · 지원 · 2코스트 · 쿨 2턴 · 사거리 3칸 · 범위 3칸 · 범위 내 여러 아군 부대의 방어를 20% 높이고, 방어·마방 감소와 치료 방해에 면역을 부여한다. 효과는 2턴 동안 지속된다.',
    '홀리 힐 · 치료 · 2코스트 · 쿨 3턴 · 사거리 3칸 · 범위 6칸 · [지원]광범위 부대에게 지력 4배만큼 생명을 회복한다. 그리고 행동 종료 시 생명을 20% 회복한다. 2행동 지속.',
    '명상 · 패시브 · 1코스트 · 부대 생명이 90% 이상일 때 지력과 마방이 10% 증가한다',
    '천공사수 소환 · 소환 · 2코스트 · 쿨 4턴 · 사거리 3칸 · 범위 단일 · [소환] 천공사수 1기 소환',
  ];
  for (const [id, index, description] of [[10705, 4, descriptions.freeze], [10804, 5, descriptions.shield], [6009, 7, descriptions.meditation]]) {
    assert.equal(list.children[index]?.textContent, expectedRows[index], `Packaged Skill ${id} row attribution or description mismatch`);
    assert.deepEqual(textLines(card, text => text?.includes(description)), [expectedRows[index]], `Skill ${id} description occurrences in Hero 15 card`);
  }
  assert.deepEqual(list.children.map(row => row.textContent), expectedRows, 'Packaged ordinary skill list mismatch');
  assert.ok(list.children.every(row => row.tag === 'li' && row.children.length === 0), 'Ordinary skills must be plain text rows');
}

export async function buildSite({ outputDir, verifyDir, manifestPath } = {}) {
  if (outputDir && verifyDir) throw new Error('Choose output-dir or verify-dir');
  if (outputDir && (resolve(outputDir) === process.cwd() || resolve(outputDir).startsWith(`${process.cwd()}${sep}`))) {
    throw new Error('Public output must be outside the Source checkout');
  }
  const selectedOutput = outputDir || verifyDir;
  await validateM05G();
  const heroIndexValidation = await validateHeroIndex();
  const skinFullartPaths = await readApprovedSkinAssetPaths();
  if (manifestPath && selectedOutput && (resolve(manifestPath) === resolve(selectedOutput)
    || resolve(manifestPath).startsWith(`${resolve(selectedOutput)}${sep}`))) throw new Error('Manifest must remain outside the public artifact');
const canonical = await readJson('canonical/heroes.v1.json');
const heroLocalization = await readJson('canonical/hero-localizations-ko.v1.json');
const heroIdentities = await readJson('canonical/hero-identities.v1.json');
const jobLocalization = await readJson('canonical/job-localizations-ko.v1.json');
const exclusiveRelations = await readJson('canonical/hero-exclusive-equipment-relations.v1.json');
const exclusiveLocalizations = await readJson('canonical/exclusive-equipment-localizations-ko.v1.json');
const heroRarities = await readJson('canonical/hero-rarities.v1.json');
const factionIdentities = await readJson('canonical/faction-identities.v1.json');
const heroFactionRelations = await readJson('canonical/hero-faction-relations.v1.json');
const factionLocalizations = await readJson('canonical/faction-localizations-ko.v1.json');
const lanceLines = await hero16ProfileLines(await readJson(HERO_16_PROFILE_DECISION), heroRarities, heroFactionRelations, factionLocalizations, heroIdentities, readJson);
const productionLocalizations = await readJson('canonical/production-localizations-ko.v1.json');
const heroJobRelations = await readJson('canonical/hero-job-relations.v1.json');
const expectedJobEdges = await expectedAdvancements(readJson);
const jobEdges = splitJobAdvancements(await readJson('canonical/hero-job-advancement-relations.v1.json'), expectedJobEdges);
const lanceJobPath = hero16JobPathLine(await readJson(HERO_16_JOB_PATH_DECISION), heroJobRelations,
  jobEdges.first, jobLocalization);
await validateLianaJobTree();
assert.equal(createHash('sha256').update(await readFile('generated/hero-15-job-tree-internal.v1.json')).digest('hex'),
  '571086f09825bfe3e1e10067772299d174e5ee16e1b997c93e919e8a5b93a0dd', 'Preserved Liana internal Job Tree bytes');
const lanceOrdinary = await generateOrdinarySkills();
const bondTotals = await readLanceFetterTotals(readJson);
await Promise.all([validateHero15FetterReferences(), validateHero15FetterRawDetails(), validateHero15HeartFetterRawDetails()]);
await validateHero15HeartFetterRawConditions();
const bondReferences = await readJson('canonical/hero-fetter-references.v1.json');
const bondDescriptionSource = await readJson(bond23EvidencePath);
const bondDescriptionDecision = await readJson(bond23DecisionPath);
const bondDescriptions = lanceBondDescriptions(bondReferences, bondDescriptionSource, heroLocalization, bondDescriptionDecision);
const companionSource = await readJson(bond45EvidencePath);
const companionDecision = await readJson(bond45DecisionPath);
const companionDescriptions = lanceCompanionBondDescriptions(bondReferences, companionSource, heroLocalization, companionDecision);
const allBondDescriptions = [...bondDescriptions, ...companionDescriptions];
const heartConditions = await readJson(conditionPath);
const heartSource = await readJson(heartSourcePath);
const heartGroups = lanceHeartGroups(heartConditions, heartSource, jobEdges.finals, heroJobRelations, jobLocalization, await readJson(heartDecisionPath));
const baseCommand = await commandBaseInputs();
const bondCommand = await commandBondInputs();
validateHero15SoldierCommandBase(baseCommand);
validateHero15SoldierCommandBondContribution(bondCommand);
const commandRows = lanceCommandRows(
  baseCommand.canonical.records.find(row => row.heroId === 16),
  bondCommand.canonical.records.find(row => row.heroId === 16),
  await readJson(commandDecisionPath),
);
const effectLines = await readLanceCentralEffect(readJson);
await validateHero15SkillReferences();
await validateHero15SkillDetailInternal();
assert.equal(createHash('sha256').update(await readFile('generated/hero-15-skill-detail-internal.v1.json')).digest('hex'),
  '27f12960aff3a141a4443939b024f81afe0097b3eb55f13f919ecf562748f400', 'Preserved Liana internal Skill projection bytes');
const lanceTalent = await generateLanceTalent();
const finalDecision = await readJson(finalJobPathDecision);
const finalPaths = finalJobPathLines(finalDecision, heroJobRelations, jobEdges.finals, expectedJobEdges.slice(6), jobLocalization);
const successors = jobEdges.finals.map((edge, index) => ({
  connectionId: edge.successorConnectionId, jobId: edge.successorJobId, pathText: finalPaths[index],
}));
const movementEvidence = await readJson(finalMovementEvidence);
validateFinalMovementEvidence(movementEvidence);
const movementDecision = await readJson(finalMovementDecision);
const movementPaths = finalJobMovementLines(successors, movementEvidence.jobs.records, movementEvidence.movement.records, movementDecision);
assert.equal(selectTalentSkill({TalentSkill_IDs:[9999,3277,3278,3279,3280,3281]}, 2), 3277, 'Lance two-star selector must use index 1');
const spJobIdentities = await readJson('canonical/sp-job-identities.v1.json');
const productionIdentities = await readJson('canonical/production-identities.v1.json');
const heroProductionRelations = await readJson('canonical/hero-production-relations.v1.json');
const talentRelations = await readJson('canonical/hero-talent-star-skills.v1.json');
const talentLocalizations = await readJson('canonical/hero-talent-localizations-ko.v1.json');
const skills = await readJson('canonical/skills.v1.json');
const heroJobLevelRawStats = await readJson('canonical/hero-job-level-raw-stats.v1.json');
await validateSkinGenerated(process.cwd());
const generatedPath = resolve('generated/hero-slice.v1.json');
const generatedText = await readFile(generatedPath, 'utf8');
const fullDetailPublicationDecision = await readJson('docs/decisions/hero-index-publication.v1.json');
const expectedGenerated = renderGenerated(canonical, heroIdentities, heroLocalization, jobLocalization, exclusiveRelations, exclusiveLocalizations, heroRarities, factionIdentities, heroFactionRelations, productionIdentities, heroProductionRelations, talentRelations, talentLocalizations, factionLocalizations, productionLocalizations, heroJobRelations, spJobIdentities, skills, heroJobLevelRawStats, fullDetailPublicationDecision);
if (generatedText !== expectedGenerated) {
  throw new Error('generated consumer is stale or non-deterministic relative to canonical input');
}
const exclusiveHeroPublicationDecision = await readJson(EXCLUSIVE_EQUIPMENT_HERO_PUBLICATION_PATH);
const hero15IntegratedPublication = validateHero15IntegratedPublication(await readJson(HERO_15_INTEGRATED_PUBLICATION_PATH));
  const hero15TalentPublication = validateHero15TalentDecision(await readJson(HERO_15_TALENT_PUBLICATION_PATH));
const hero16IntegratedPublication = validateHero16IntegratedPublication(await readJson(HERO_16_INTEGRATED_PUBLICATION_PATH));
const heroMinimalDetailBatchPublication = validateHeroMinimalDetailBatchPublication(await readJson(HERO_MINIMAL_DETAIL_BATCH_PUBLICATION_PATH));
const heroMinimalDetailTenBatchPublication = validateHeroMinimalDetailTenBatchPublication(await readJson(HERO_MINIMAL_DETAIL_TEN_BATCH_PUBLICATION_PATH));
const heroMinimalDetailTwentyBatchPublication = validateHeroMinimalDetailTwentyBatchPublication(await readJson(HERO_MINIMAL_DETAIL_TWENTY_BATCH_PUBLICATION_PATH));
const heroMinimalDetailThirtyBatchPublication = validateHeroMinimalDetailThirtyBatchPublication(await readJson(HERO_MINIMAL_DETAIL_THIRTY_BATCH_PUBLICATION_PATH));
const heroMinimalDetailThirtyOneBatchPublication = validateHeroMinimalDetailThirtyOneBatchPublication(await readJson(HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PUBLICATION_PATH));
const heroMinimalDetailFortyBatchPublication = validateHeroMinimalDetailFortyBatchPublication(await readJson(HERO_MINIMAL_DETAIL_FORTY_BATCH_PUBLICATION_PATH));
const [exclusiveHeroEquipmentIdentity, exclusiveHeroIndexPublication, exclusiveHeroLocalizationBytes, exclusiveHeroIdentityBytes] = await Promise.all([
  readJson('canonical/exclusive-equipment.v1.json'),
  readJson('docs/decisions/hero-index-publication.v1.json'),
  readFile(resolve('canonical/hero-localizations-ko.v1.json')),
  readFile(resolve('canonical/hero-identities.v1.json')),
]);
const exclusiveHeroNavigationPath = resolve(EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH);
const exclusiveHeroNavigationText = await readFile(exclusiveHeroNavigationPath, 'utf8');
const hero15MinimalInputs = {
  decision: hero15IntegratedPublication,
  heroIdentities,
  heroLocalizations: heroLocalization,
  relations: exclusiveRelations,
  equipmentIdentities: exclusiveHeroEquipmentIdentity,
  equipmentLocalizations: exclusiveLocalizations,
  sourceHashes: Object.fromEntries(await Promise.all([
    ['heroIdentity', 'canonical/hero-identities.v1.json'],
    ['heroLocalization', 'canonical/hero-localizations-ko.v1.json'],
    ['equipmentRelation', 'canonical/hero-exclusive-equipment-relations.v1.json'],
    ['equipmentIdentity', 'canonical/exclusive-equipment.v1.json'],
    ['equipmentLocalization', 'canonical/exclusive-equipment-localizations-ko.v1.json'],
  ].map(async ([key, path]) => [key, createHash('sha256').update(await readFile(resolve(path))).digest('hex')]))),
};
const hero15MinimalDetailPath = resolve(HERO_15_MINIMAL_DETAIL_PATH);
const hero15MinimalDetailText = await readFile(hero15MinimalDetailPath, 'utf8');
const profileInputs = await readHero15ProfileInputs(readJson);
// Retain the original Bond 1 and 2 approval and Korean name provenance checks.
renderBond1KeyTotals(profileInputs);
renderBond2KeyTotals(profileInputs);
const keyGroups = readBondKeyDisplay(profileInputs);
const skillDescriptions = {
  freeze: readFreezeDisplay(profileInputs),
  shield: readShieldDisplay(profileInputs),
  meditation: readMeditationDisplay(profileInputs),
};
validateHero15MinimalDetail({ generatedText: hero15MinimalDetailText, inputs: { ...hero15MinimalInputs, jobInputs: await readHero15JobPublicationInputs(readJson), soldierInputs: await readHero15SoldierPublicationInputs(readJson), profileInputs } });
const hero15TalentPublicText = await readFile(resolve(HERO_15_TALENT_PUBLIC_PATH), 'utf8');
const hero15TalentPublicInputs = { decision: hero15TalentPublication, talentRelations, skills, localizations: talentLocalizations };
validateHero15TalentPublic({ generatedText: hero15TalentPublicText, inputs: hero15TalentPublicInputs });
const hero15SoldierTextInputs = await readHero15SoldierTextInputs();
const hero15SoldierTextPublication = hero15SoldierTextInputs.decision;
validateHero15SoldierText({ bytes: await readFile(HERO_15_SOLDIER_TEXT_PUBLIC), app: await readFile('app.js', 'utf8'),
  inputs: hero15SoldierTextInputs });
const hero16MinimalInputs = { ...hero15MinimalInputs, decision: hero16IntegratedPublication };
const hero16MinimalDetailPath = resolve(HERO_16_MINIMAL_DETAIL_PATH);
const hero16MinimalDetailText = await readFile(hero16MinimalDetailPath, 'utf8');
validateHero16MinimalDetail({ generatedText: hero16MinimalDetailText, inputs: hero16MinimalInputs });
const heroMinimalDetailBatchPath = resolve(HERO_MINIMAL_DETAIL_BATCH_PATH);
const heroMinimalDetailBatchText = await readFile(heroMinimalDetailBatchPath, 'utf8');
const heroMinimalDetailBatchInputs = { ...hero15MinimalInputs, decision: heroMinimalDetailBatchPublication };
validateHeroMinimalDetailBatch({ generatedText: heroMinimalDetailBatchText, inputs: heroMinimalDetailBatchInputs });
const heroMinimalDetailTenBatchPath = resolve(HERO_MINIMAL_DETAIL_TEN_BATCH_PATH);
const heroMinimalDetailTenBatchText = await readFile(heroMinimalDetailTenBatchPath, 'utf8');
const heroMinimalDetailTenBatchInputs = { ...hero15MinimalInputs, decision: heroMinimalDetailTenBatchPublication };
validateHeroMinimalDetailTenBatch({ generatedText: heroMinimalDetailTenBatchText, inputs: heroMinimalDetailTenBatchInputs });
const heroMinimalDetailTwentyBatchPath = resolve(HERO_MINIMAL_DETAIL_TWENTY_BATCH_PATH);
const heroMinimalDetailTwentyBatchText = await readFile(heroMinimalDetailTwentyBatchPath, 'utf8');
const heroMinimalDetailTwentyBatchInputs = { ...hero15MinimalInputs, decision: heroMinimalDetailTwentyBatchPublication };
validateHeroMinimalDetailTwentyBatch({ generatedText: heroMinimalDetailTwentyBatchText, inputs: heroMinimalDetailTwentyBatchInputs });
const heroMinimalDetailThirtyBatchPath = resolve(HERO_MINIMAL_DETAIL_THIRTY_BATCH_PATH);
const heroMinimalDetailThirtyOneBatchPath = resolve(HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH);
const heroMinimalDetailThirtyBatchText = await readFile(heroMinimalDetailThirtyBatchPath, 'utf8');
const heroMinimalDetailThirtyBatchInputs = { ...hero15MinimalInputs, decision: heroMinimalDetailThirtyBatchPublication };
validateHeroMinimalDetailThirtyBatch({ generatedText: heroMinimalDetailThirtyBatchText, inputs: heroMinimalDetailThirtyBatchInputs });
const heroMinimalDetailThirtyOneBatchText = await readFile(heroMinimalDetailThirtyOneBatchPath, 'utf8');
const heroMinimalDetailThirtyOneBatchInputs = { ...hero15MinimalInputs, decision: heroMinimalDetailThirtyOneBatchPublication };
validateHeroMinimalDetailThirtyOneBatch({ generatedText: heroMinimalDetailThirtyOneBatchText, inputs: heroMinimalDetailThirtyOneBatchInputs });
const heroMinimalDetailFortyBatchPath = resolve(HERO_MINIMAL_DETAIL_FORTY_BATCH_PATH);
const heroMinimalDetailFortyBatchText = await readFile(heroMinimalDetailFortyBatchPath, 'utf8');
const heroMinimalDetailFortyBatchInputs = { ...hero15MinimalInputs, decision: heroMinimalDetailFortyBatchPublication };
validateHeroMinimalDetailFortyBatch({ generatedText: heroMinimalDetailFortyBatchText, inputs: heroMinimalDetailFortyBatchInputs });
validateExclusiveEquipmentHeroNavigation({ generatedText: exclusiveHeroNavigationText, inputs: {
  relations: exclusiveRelations,
  equipmentIdentities: exclusiveHeroEquipmentIdentity,
  heroIdentities,
  heroLocalizations: heroLocalization,
  heroSlice: JSON.parse(generatedText),
  heroIndexPublication: exclusiveHeroIndexPublication,
  publicationDecision: exclusiveHeroPublicationDecision,
  integratedPublicationDecision: hero15IntegratedPublication,
  hero16IntegratedPublicationDecision: hero16IntegratedPublication,
  heroMinimalDetailBatchPublicationDecision: heroMinimalDetailBatchPublication,
  heroMinimalDetailTenBatchPublicationDecision: heroMinimalDetailTenBatchPublication,
  heroMinimalDetailTwentyBatchPublicationDecision: heroMinimalDetailTwentyBatchPublication,
  heroMinimalDetailThirtyBatchPublicationDecision: heroMinimalDetailThirtyBatchPublication,
  heroMinimalDetailThirtyOneBatchPublicationDecision: heroMinimalDetailThirtyOneBatchPublication,
  heroMinimalDetailFortyBatchPublicationDecision: heroMinimalDetailFortyBatchPublication,
  heroLocalizationSha256: createHash('sha256').update(exclusiveHeroLocalizationBytes).digest('hex'),
  heroIdentitySha256: createHash('sha256').update(exclusiveHeroIdentityBytes).digest('hex'),
} });
const glossaryPath = resolve('generated/job-glossary.v1.json');
const glossaryText = await readFile(glossaryPath, 'utf8');
if (glossaryText !== renderJobGlossary(jobLocalization)) throw new Error('generated Job glossary is stale or non-deterministic');
const glossary = JSON.parse(glossaryText);
exactKeys(glossary, ['schemaVersion', 'jobs'], 'generated Job glossary');
if (glossary.schemaVersion !== 1 || !Array.isArray(glossary.jobs) || glossary.jobs.length !== jobLocalization.records.length) {
  throw new Error('built document has unsupported Job glossary presentation schema');
}

const equipmentIdentity = await readJson('canonical/general-ssr-equipment.v1.json');
const equipmentLocalization = await readJson('canonical/general-ssr-equipment-localizations-ko.v1.json');
const equipmentContract = await readJson('evidence/source/equipment/general-ssr-equipment-population-contract.v1.json');
const equipmentPublicationDecision = await readJson('docs/decisions/general-ssr-equipment-publication.v1.json');
const equipmentPublication = validateGeneralSsrPublication({ canonical: equipmentIdentity, localization: equipmentLocalization, contract: equipmentContract, decision: equipmentPublicationDecision });
const equipmentGeneratedPath = resolve('generated/general-ssr-equipment.v1.json');
const equipmentGeneratedText = await readFile(equipmentGeneratedPath, 'utf8');
if (equipmentGeneratedText !== renderGeneralSsrEquipment(equipmentIdentity, equipmentLocalization, equipmentPublication)) throw new Error('generated General SSR Equipment is stale or non-deterministic');
const equipmentGenerated = JSON.parse(equipmentGeneratedText);
exactKeys(equipmentGenerated, ['schemaVersion', 'equipment'], 'generated General SSR Equipment');
if (equipmentGenerated.schemaVersion !== 1 || !Array.isArray(equipmentGenerated.equipment)) throw new Error('unsupported General SSR Equipment presentation schema');
if (equipmentIdentity.records.length !== 206 || equipmentLocalization.records.length !== 206) throw new Error('General SSR Equipment semantic/localization baseline mismatch');
if (equipmentGenerated.equipment.length !== 198) throw new Error('General SSR Equipment approved public count mismatch');
const generatedEquipmentIds = equipmentGenerated.equipment.map((item) => item.equipmentId);
if (generatedEquipmentIds.some((id) => !Number.isInteger(id)) || new Set(generatedEquipmentIds).size !== generatedEquipmentIds.length
  || JSON.stringify(generatedEquipmentIds) !== JSON.stringify(equipmentPublication.approvedPublicIds)) throw new Error('General SSR Equipment generated IDs differ from approved publication');
for (const item of equipmentGenerated.equipment) {
  exactKeys(item, ['equipmentId', 'nameKo', 'effectDescriptionKo'], 'General SSR Equipment ' + item.equipmentId);
  if (!Number.isInteger(item.equipmentId) || typeof item.nameKo !== 'string' || !item.nameKo.trim() || typeof item.effectDescriptionKo !== 'string' || !item.effectDescriptionKo.trim()) throw new Error('malformed General SSR Equipment presentation');
}

const exclusiveEquipmentIdentity = await readJson('canonical/exclusive-equipment.v1.json');
const exclusiveEquipmentLocalization = await readJson('canonical/exclusive-equipment-localizations-ko.v1.json');
const exclusiveEquipmentGeneratedPath = resolve('generated/exclusive-equipment.v1.json');
const exclusiveEquipmentGeneratedText = await readFile(exclusiveEquipmentGeneratedPath, 'utf8');
if (exclusiveEquipmentGeneratedText !== renderExclusiveEquipment(exclusiveEquipmentIdentity, exclusiveEquipmentLocalization)) throw new Error('generated Exclusive Equipment is stale or non-deterministic');
const exclusiveEquipmentGenerated = JSON.parse(exclusiveEquipmentGeneratedText);
exactKeys(exclusiveEquipmentGenerated, ['schemaVersion', 'equipment'], 'generated Exclusive Equipment');
if (exclusiveEquipmentGenerated.schemaVersion !== 1 || !Array.isArray(exclusiveEquipmentGenerated.equipment)) throw new Error('unsupported Exclusive Equipment presentation schema');
const exclusiveEquipmentIds = exclusiveEquipmentGenerated.equipment.map((item) => item.equipmentId);
if (exclusiveEquipmentIds.some((id) => !Number.isSafeInteger(id)) || new Set(exclusiveEquipmentIds).size !== exclusiveEquipmentIds.length) throw new Error('Exclusive Equipment generated IDs are malformed or duplicated');
for (const item of exclusiveEquipmentGenerated.equipment) {
  exactKeys(item, ['equipmentId', 'nameKo', 'effectDescriptionKo'], 'Exclusive Equipment ' + item.equipmentId);
  if (typeof item.nameKo !== 'string' || !item.nameKo.trim() || typeof item.effectDescriptionKo !== 'string' || !item.effectDescriptionKo.trim()) throw new Error('malformed Exclusive Equipment presentation');
}

const [{ identities: publicSoldiers, relations: soldierRelations, normalLocalizations: normalSoldierLocalizations }, soldierLocalizations, soldierBaseStats, normalSoldierBaseStats] = await Promise.all([
  loadPublicNormalSoldierLocalization(),
  readJson('canonical/sp-soldier-localizations-ko.v1.json'),
  readJson('canonical/sp-soldier-base-stats.v1.json'),
  readJson('canonical/normal-soldier-base-stats.v1.json'),
]);
const soldierBfMovePoints = await readJson('canonical/soldier-bf-move-points.v1.json');
const soldierSkillRelations = await readJson('canonical/soldier-skill-relations.v1.json');
const spGeneratedPath = resolve('generated/sp-soldiers.v1.json');
const spGeneratedText = await readFile(spGeneratedPath, 'utf8');
const expectedSpGenerated = renderSpSoldiers(publicSoldiers, soldierLocalizations, normalSoldierLocalizations, soldierBaseStats, soldierRelations, normalSoldierBaseStats, soldierBfMovePoints, soldierSkillRelations, skills);
if (spGeneratedText !== expectedSpGenerated) throw new Error('generated SP Soldier data is stale or non-deterministic');
const spGenerated = JSON.parse(spGeneratedText);
if (spGenerated.schemaVersion !== 1 || !Array.isArray(spGenerated.soldiers)) throw new Error('built document has unsupported SP Soldier presentation schema');
for (const soldier of spGenerated.soldiers) {
  exactKeys(soldier, soldier.spSoldierId === 5115
    ? ['spSoldierId', 'nameKo', 'bfMovePoint', 'normalSoldierId', 'normalSoldierNameKo', 'baseStats', 'normalSoldierBaseStats', 'skillReferences']
    : ['spSoldierId', 'nameKo', 'bfMovePoint', 'normalSoldierId', 'normalSoldierNameKo', 'baseStats', 'normalSoldierBaseStats'], `SP Soldier ${soldier.spSoldierId}`);
  if (!Number.isFinite(soldier.bfMovePoint) || !Number.isInteger(soldier.normalSoldierId) || typeof soldier.normalSoldierNameKo !== 'string' || !soldier.normalSoldierNameKo) {
    throw new Error(`malformed NORMAL Soldier presentation for SP Soldier ${soldier.spSoldierId}`);
  }
  exactKeys(soldier.normalSoldierBaseStats, ['hp', 'attack', 'defense', 'magicDefense'], `NORMAL Soldier ${soldier.normalSoldierId} base stats`);
  if (!Object.values(soldier.normalSoldierBaseStats).every(Number.isFinite)) throw new Error(`malformed NORMAL Soldier base stats for SP Soldier ${soldier.spSoldierId}`);
}

const normalSoldierGeneratedPath = resolve('generated/normal-soldiers.v1.json');
const normalSoldierGeneratedText = await readFile(normalSoldierGeneratedPath, 'utf8');
if (normalSoldierGeneratedText !== renderNormalSoldiers(publicSoldiers, normalSoldierLocalizations, normalSoldierBaseStats, soldierBfMovePoints, soldierSkillRelations, skills)) {
  throw new Error('generated NORMAL Soldier data is stale or non-deterministic');
}
const normalSoldierGenerated = JSON.parse(normalSoldierGeneratedText);
if (normalSoldierGenerated.schemaVersion !== 1 || !Array.isArray(normalSoldierGenerated.soldiers)) {
  throw new Error('built document has unsupported NORMAL Soldier presentation schema');
}
for (const soldier of normalSoldierGenerated.soldiers) {
  exactKeys(soldier, soldier.normalSoldierId === 115
    ? ['normalSoldierId', 'nameKo', 'bfMovePoint', 'baseStats', 'skillReferences']
    : ['normalSoldierId', 'nameKo', 'bfMovePoint', 'baseStats'], `NORMAL Soldier ${soldier.normalSoldierId}`);
  if (!Number.isInteger(soldier.normalSoldierId) || typeof soldier.nameKo !== 'string' || !soldier.nameKo.trim() || !Number.isFinite(soldier.bfMovePoint)) {
    throw new Error(`malformed NORMAL Soldier presentation ${String(soldier.normalSoldierId)}`);
  }
  exactKeys(soldier.baseStats, ['hp', 'attack', 'defense', 'magicDefense'], `NORMAL Soldier ${soldier.normalSoldierId} base stats`);
  if (!Object.values(soldier.baseStats).every(Number.isFinite)) throw new Error(`malformed NORMAL Soldier base stats for ${soldier.normalSoldierId}`);
}
const trainingTechCanonical = await readJson('canonical/soldier-training-tech-descriptions.v1.json');
const trainingTechDecisionRecord = await readJson(TRAINING_TECH_DECISION_RECORD_PATH);
const trainingTechDecisionState = validateTrainingTechDecisionRecord(trainingTechDecisionRecord);
const includeTrainingTechDirectJson = shouldPublishTrainingTechDirectJson(trainingTechDecisionRecord);
const trainingTechGeneratedPath = resolve('generated/soldier-training-tech-descriptions.v1.json');
const trainingTechGeneratedText = await readFile(trainingTechGeneratedPath, 'utf8');
if (trainingTechGeneratedText !== renderSoldierTrainingTechDescriptions(trainingTechCanonical, trainingTechDecisionRecord)) {
  throw new Error('generated Soldier TrainingTech descriptions are stale or non-deterministic');
}
const trainingTechGenerated = JSON.parse(trainingTechGeneratedText);
if (trainingTechGenerated.records.length !== 20 || trainingTechGenerated.contract?.effective !== trainingTechDecisionState.effective) {
  throw new Error('built Soldier TrainingTech projection must match the approved contract state and contain exactly 20 records');
}

const heroSoldierRelationPath = resolve('generated/hero-soldier-relations.v1.json');
const heroSoldierRelationText = await readFile(heroSoldierRelationPath, 'utf8');
const publicHeroPresentation = { ...canonical, records: projectApprovedFullDetailRecords(canonical, fullDetailPublicationDecision) };
const heroSoldierOwner = await readJson('canonical/hero-soldier-relations.v1.json');
if (heroSoldierRelationText !== renderHeroSoldierRelations(publicHeroPresentation, heroSoldierOwner, publicSoldiers)) {
  throw new Error('generated Hero–Soldier relations are stale or non-deterministic');
}
const heroSoldierRelations = JSON.parse(heroSoldierRelationText);
exactKeys(heroSoldierRelations, ['schemaVersion', 'relations'], 'generated Hero–Soldier relations');
if (heroSoldierRelations.schemaVersion !== 1 || !Array.isArray(heroSoldierRelations.relations)) {
  throw new Error('unsupported generated Hero–Soldier relation presentation schema');
}

const heroIds = new Set(JSON.parse(generatedText).heroes.map((hero) => hero.id));
const soldierPresentationById = new Map();
for (const soldier of normalSoldierGenerated.soldiers) {
  if (soldierPresentationById.has(soldier.normalSoldierId)) throw new Error(`duplicate Soldier presentation ID ${soldier.normalSoldierId}`);
  soldierPresentationById.set(soldier.normalSoldierId, soldier);
}
for (const soldier of spGenerated.soldiers) {
  if (soldierPresentationById.has(soldier.spSoldierId)) throw new Error(`duplicate Soldier presentation ID ${soldier.spSoldierId}`);
  soldierPresentationById.set(soldier.spSoldierId, soldier);
}
const frontendPairs = new Set();
for (const relation of heroSoldierRelations.relations) {
  exactKeys(relation, ['heroId', 'soldierId'], 'generated Hero–Soldier relation pair');
  if (!Number.isSafeInteger(relation.heroId) || !Number.isSafeInteger(relation.soldierId)
    || !heroIds.has(relation.heroId)) {
    throw new Error('Hero–Soldier relation has an invalid or unresolved Hero endpoint');
  }
  const pair = `${relation.heroId}:${relation.soldierId}`;
  if (frontendPairs.has(pair)) throw new Error(`duplicate frontend relation mapping ${pair}`);
  frontendPairs.add(pair);
  const soldier = soldierPresentationById.get(relation.soldierId);
  if (!soldier || typeof soldier.nameKo !== 'string' || !soldier.nameKo.trim()) {
    throw new Error(`unresolved Soldier presentation ID ${relation.soldierId}`);
  }
}

const generated = JSON.parse(generatedText);
exactKeys(generated, ['schemaVersion', 'heroes'], 'generated consumer');
if (generated.schemaVersion !== 1 || !Array.isArray(generated.heroes)) throw new Error('unsupported generated consumer schema');
validateFullDetailPublicPopulation({ canonical, generated, publicationDecision: fullDetailPublicationDecision });
const expectedSpJobsByHeroId = new Map([
  [6, [{ jobId: 377, nameKo: '어둠의 청룡', classification: 'SP Job', localizationClassification: 'PROJECT_REVIEWED_LOCALIZATION', officialKrProvenanceStatus: 'UNVERIFIED' }]],
  [8, [{ jobId: 864, nameKo: '단죄의 성녀', classification: 'SP Job', localizationClassification: 'PROJECT_REVIEWED_LOCALIZATION', officialKrProvenanceStatus: 'UNVERIFIED' }]],
  [1, [{ jobId: 262, nameKo: '고독한 검객', classification: 'SP Job', localizationClassification: 'PROJECT_REVIEWED_LOCALIZATION', officialKrProvenanceStatus: 'UNVERIFIED' }]],
  [3, [{ jobId: 633, nameKo: '바람의 기사', classification: 'SP Job', localizationClassification: 'PROJECT_REVIEWED_LOCALIZATION', officialKrProvenanceStatus: 'UNVERIFIED' }]],
  [10, [{ jobId: 878, nameKo: '선택받은 왕', classification: 'SP Job', localizationClassification: 'PROJECT_REVIEWED_LOCALIZATION', officialKrProvenanceStatus: 'UNVERIFIED' }]],
  [25, [{ jobId: 414, nameKo: '천공의 마룡', classification: 'SP Job', localizationClassification: 'PROJECT_REVIEWED_LOCALIZATION', officialKrProvenanceStatus: 'UNVERIFIED' }]],
]);
for (const hero of generated.heroes) {
  const heroKeys = ['id', 'nameEng', 'nameKo', 'rarity', 'jobConnections', 'spJobConnections', 'exclusiveEquipment', 'factions', 'origins'];
  if (hero.portrait !== undefined) {
    if (!FULL_DETAIL_PORTRAIT_PROJECTION_CONTRACT.preservedCurrentPublicHeroIds.includes(hero.id)
      || typeof hero.portrait !== 'string' || !FULL_DETAIL_PORTRAIT_PROJECTION_CONTRACT.publicAssetPathPattern.test(hero.portrait)) {
      throw new Error(`unsupported or unapproved portrait field for Hero ${hero.id}`);
    }
    heroKeys.push('portrait');
  }
  if (talentRelations.records.some((row) => row.heroId === hero.id)) heroKeys.push('talent');
  if ([6, 8].includes(hero.id)) heroKeys.push('jobLevelSourceStats');
  exactKeys(hero, heroKeys, `generated Hero ${hero.id}`);
  if (!Number.isInteger(hero.id) || typeof hero.nameEng !== 'string' || !hero.nameEng || typeof hero.nameKo !== 'string' || !hero.nameKo || !Array.isArray(hero.jobConnections)) {
    throw new Error(`malformed generated Hero ${String(hero.id)}`);
  }
  exactKeys(hero.rarity, ['rankId', 'label'], `generated Hero ${hero.id} rarity`);
  if (!Number.isSafeInteger(hero.rarity.rankId) || typeof hero.rarity.label !== 'string' || !hero.rarity.label.trim()) throw new Error(`malformed generated rarity for Hero ${hero.id}`);
  if (!Array.isArray(hero.factions) || hero.factions.length === 0) throw new Error(`malformed generated Faction list for Hero ${hero.id}`);
  const factionIds = new Set();
  for (const faction of hero.factions) {
    const localized = faction.localizationStatus === 'PROJECT_REVIEWED';
    exactKeys(faction, localized ? ['factionId', 'nameCn', 'nameKo', 'localizationStatus'] : ['factionId', 'nameCn', 'localizationStatus'], `generated Hero ${hero.id} Faction`);
    if (!Number.isSafeInteger(faction.factionId) || typeof faction.nameCn !== 'string' || !faction.nameCn.trim()
      || (localized ? typeof faction.nameKo !== 'string' || !faction.nameKo.trim() : faction.localizationStatus !== 'UNTRANSLATED')
      || factionIds.has(faction.factionId)) throw new Error(`malformed or duplicate generated Faction for Hero ${hero.id}`);
    factionIds.add(faction.factionId);
  }
  if (!Array.isArray(hero.origins) || hero.origins.length === 0) throw new Error(`malformed generated Production list for Hero ${hero.id}`);
  const productionIds = new Set();
  for (const origin of hero.origins) {
    exactKeys(origin, ['productionId', 'nameCn', 'nameKo', 'localizationStatus'], `generated Hero ${hero.id} Production`);
    if (!Number.isSafeInteger(origin.productionId) || typeof origin.nameCn !== 'string' || !origin.nameCn.trim()
      || typeof origin.nameKo !== 'string' || !origin.nameKo.trim() || origin.localizationStatus !== 'PROJECT_REVIEWED'
      || productionIds.has(origin.productionId)) throw new Error(`malformed or duplicate generated Production for Hero ${hero.id}`);
    productionIds.add(origin.productionId);
  }
  const expectedSpJobs = expectedSpJobsByHeroId.get(hero.id) ?? [];
  if (!Array.isArray(hero.spJobConnections) || JSON.stringify(hero.spJobConnections) !== JSON.stringify(expectedSpJobs)
    || hero.jobConnections.some((relation) => [377, 864].includes(relation.jobId))) {
    throw new Error(`malformed or out-of-scope SP Job presentation for Hero ${hero.id}`);
  }
  for (const relation of hero.jobConnections) {
    const isSpClassified = hero.id === 53 && relation.jobId === 426;
    exactKeys(relation, isSpClassified
      ? ['connectionId', 'jobId', 'sourceField', 'jobNameKo', 'classification', 'localizationClassification', 'officialKrProvenanceStatus']
      : ['connectionId', 'jobId', 'sourceField', 'jobNameKo'],
    `generated Hero ${hero.id} Job relation`);
    if (!Number.isInteger(relation.connectionId) || !Number.isInteger(relation.jobId) || typeof relation.sourceField !== 'string'
      || typeof relation.jobNameKo !== 'string' || !relation.jobNameKo
      || (isSpClassified && (relation.connectionId !== 536 || relation.sourceField !== 'JobConnection_ID'
        || relation.jobNameKo !== '빛나는 지략가' || relation.classification !== 'SP Job'
        || relation.localizationClassification !== 'PROJECT_REVIEWED_LOCALIZATION'
        || relation.officialKrProvenanceStatus !== 'UNVERIFIED'))) {
      throw new Error(`malformed generated Job relation for Hero ${hero.id}`);
    }
  }
  if ([6, 8].includes(hero.id)) {
    if (!Array.isArray(hero.jobLevelSourceStats) || hero.jobLevelSourceStats.length !== 25) throw new Error(`Hero ${hero.id} generated raw JobLevel record count mismatch`);
    const levelIds = new Set();
    for (const row of hero.jobLevelSourceStats) {
      exactKeys(row, ['jobConnectionId', 'jobId', 'jobRank', 'jobLevelId', 'jobLevelUpHeroLevel', 'rankCode', 'rawStats'], `Hero ${hero.id} raw JobLevel row`);
      exactKeys(row.rawStats, ['HP_INI', 'HP_UP', 'AT_INI', 'AT_UP', 'Magic_INI', 'Magic_UP', 'DF_INI', 'DF_UP', 'MagicDF_INI', 'MagicDF_UP', 'DEX_INI'], `Hero ${hero.id} raw JobLevel fields`);
      if (!Number.isSafeInteger(row.jobConnectionId) || !Number.isSafeInteger(row.jobId)
        || !Number.isSafeInteger(row.jobRank) || !Number.isSafeInteger(row.jobLevelId)
        || !Number.isSafeInteger(row.jobLevelUpHeroLevel) || !Number.isSafeInteger(row.rankCode)
        || !hero.jobConnections.some((relation) => relation.connectionId === row.jobConnectionId && relation.jobId === row.jobId)
        || levelIds.has(row.jobLevelId)
        || Object.values(row.rawStats).some((value) => !Number.isSafeInteger(value))) {
        throw new Error(`Hero ${hero.id} generated raw JobLevel record is malformed, duplicated, or mislinked`);
      }
      levelIds.add(row.jobLevelId);
    }
  }
  exactKeys(hero.exclusiveEquipment, ['equipmentId', 'equipmentNameKo', 'effectDescriptionKo'], `generated Hero ${hero.id} Exclusive Equipment`);
  if (!Number.isInteger(hero.exclusiveEquipment.equipmentId) || typeof hero.exclusiveEquipment.equipmentNameKo !== 'string'
    || !hero.exclusiveEquipment.equipmentNameKo || typeof hero.exclusiveEquipment.effectDescriptionKo !== 'string' || !hero.exclusiveEquipment.effectDescriptionKo) {
    throw new Error(`malformed Exclusive Equipment presentation for Hero ${hero.id}`);
  }
  if (hero.talent !== undefined) {
    exactKeys(hero.talent, ['nameKo', 'starDescriptions'], `generated Hero ${hero.id} Talent`);
    if (typeof hero.talent.nameKo !== 'string' || !hero.talent.nameKo.trim() || !Array.isArray(hero.talent.starDescriptions)
      || JSON.stringify(hero.talent.starDescriptions.map((row) => row.star)) !== '[3,4,5,6]') throw new Error(`malformed generated Talent for Hero ${hero.id}`);
    for (const row of hero.talent.starDescriptions) {
      exactKeys(row, ['star', 'skillId', 'descriptionKoRaw', 'nameCn', 'descriptionCn'], `generated Hero ${hero.id} Talent star`);
      if (!Number.isSafeInteger(row.star) || !Number.isSafeInteger(row.skillId) || typeof row.descriptionKoRaw !== 'string' || !row.descriptionKoRaw.trim()
        || typeof row.nameCn !== 'string' || !row.nameCn.trim() || typeof row.descriptionCn !== 'string' || !row.descriptionCn.trim()) {
        throw new Error(`malformed generated Talent star for Hero ${hero.id}`);
      }
    }
  }
}
const portraitPaths = [...new Set(generated.heroes.filter((hero) => hero.portrait !== undefined).map((hero) => hero.portrait))];

const output = selectedOutput ? resolve(selectedOutput) : await mkdtemp(join(tmpdir(), 'langrisser-hero-slice-build-'));
if (outputDir) await mkdir(output, { recursive: false }); // Never overwrite a previous output.
let completed = false;
try {
  if (!verifyDir) {
  await mkdir(join(output, 'generated'), { recursive: true });
  for (const file of ['index.html', 'app.js', 'styles.css']) await cp(resolve(file), join(output, file));
  await cp(generatedPath, join(output, 'generated', 'hero-slice.v1.json'));
  await cp(resolve('generated/hero-index.v1.json'), join(output, 'generated', 'hero-index.v1.json'));
  await cp(hero15MinimalDetailPath, join(output, ...HERO_15_MINIMAL_DETAIL_PATH.split('/')));
  await cp(resolve(HERO_15_TALENT_PUBLIC_PATH), join(output, ...HERO_15_TALENT_PUBLIC_PATH.split('/')));
  await cp(resolve(HERO_15_SOLDIER_TEXT_PUBLIC), join(output, HERO_15_SOLDIER_TEXT_PUBLIC));
  await cp(resolve(ordinaryPublicV5), join(output,ordinaryPublicV5));
  await cp(resolve(ordinaryPublicV4), join(output,ordinaryPublicV4));
  await cp(resolve(ordinaryPublicV3), join(output,ordinaryPublicV3));
  await cp(resolve(ordinaryPublicV2), join(output,ordinaryPublicV2));
  await cp(resolve(ordinaryPublic), join(output,ordinaryPublic));
  await cp(resolve(lanceTalentPublic), join(output,lanceTalentPublic));
  await cp(hero16MinimalDetailPath, join(output, ...HERO_16_MINIMAL_DETAIL_PATH.split('/')));
  await cp(heroMinimalDetailBatchPath, join(output, ...HERO_MINIMAL_DETAIL_BATCH_PATH.split('/')));
  await cp(heroMinimalDetailTenBatchPath, join(output, ...HERO_MINIMAL_DETAIL_TEN_BATCH_PATH.split('/')));
  await cp(heroMinimalDetailTwentyBatchPath, join(output, ...HERO_MINIMAL_DETAIL_TWENTY_BATCH_PATH.split('/')));
  await cp(heroMinimalDetailThirtyBatchPath, join(output, ...HERO_MINIMAL_DETAIL_THIRTY_BATCH_PATH.split('/')));
  await cp(heroMinimalDetailThirtyOneBatchPath, join(output, ...HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH.split('/')));
  await cp(heroMinimalDetailFortyBatchPath, join(output, ...HERO_MINIMAL_DETAIL_FORTY_BATCH_PATH.split('/')));
  await cp(spGeneratedPath, join(output, 'generated', 'sp-soldiers.v1.json'));
  await cp(normalSoldierGeneratedPath, join(output, 'generated', 'normal-soldiers.v1.json'));
  const skinConsumerPath = resolve('generated/skin-consumer.v1.json');
  await cp(skinConsumerPath, join(output, 'generated', 'skin-consumer.v1.json'));
  await cp(resolve(skinConsumerPublicPath), join(output, ...skinConsumerPublicPath.split('/')));
  await cp(resolve(skinAssetsPublicPath), join(output, ...skinAssetsPublicPath.split('/')));
  await cp(resolve('skin-fullart-presentation.mjs'), join(output, 'skin-fullart-presentation.mjs'));
  await cp(resolve('skin-asset-publication-contract.mjs'), join(output, 'skin-asset-publication-contract.mjs'));
  for (const assetPath of [...skinFullartPaths, ...bondKeyAssets.map(asset => asset.path)]) {
    const destination = join(output, ...assetPath.split('/'));
    await mkdir(dirname(destination), { recursive: true });
    await cp(resolve(assetPath), destination);
  }
  if (includeTrainingTechDirectJson) {
    await cp(trainingTechGeneratedPath, join(output, 'generated', 'soldier-training-tech-descriptions.v1.json'));
  }
  await cp(heroSoldierRelationPath, join(output, 'generated', 'hero-soldier-relations.v1.json'));
  await cp(glossaryPath, join(output, 'generated', 'job-glossary.v1.json'));
  await cp(equipmentGeneratedPath, join(output, 'generated', 'general-ssr-equipment.v1.json'));
  await cp(exclusiveEquipmentGeneratedPath, join(output, 'generated', 'exclusive-equipment.v1.json'));
  await cp(exclusiveHeroNavigationPath, join(output, ...EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH.split('/')));

  for (const portraitPath of portraitPaths) {
    if (typeof portraitPath !== 'string' || !/^assets\/portraits\/[^/]+\.png$/.test(portraitPath)) {
      throw new Error(`unsupported generated portrait path: ${String(portraitPath)}`);
    }
    const destination = join(output, ...portraitPath.split('/'));
    await mkdir(dirname(destination), { recursive: true });
    await cp(resolve(portraitPath), destination);
  }
  }

  const [html, app, styles] = await Promise.all([
    readFile(join(output, 'index.html'), 'utf8'),
    readFile(join(output, 'app.js'), 'utf8'),
    readFile(join(output, 'styles.css'), 'utf8'),
  ]);
  validateAppCacheKey(html, app, 'built site');
  validateStylesCacheKey(html, styles, 'built site');
  if (!html.includes('./app.js') || !html.includes('./styles.css')) {
    throw new Error('built document is missing app or style entry');
  }
  if (!app.includes("fetch('./generated/hero-slice.v1.json')")) {
    throw new Error('built app does not resolve the generated Hero data entry');
  }
  if (!app.includes("fetch('./generated/hero-index.v1.json')")) {
    throw new Error('built app does not resolve the approved Generated Hero Index entry');
  }
  if (!app.includes(`fetch('./${HERO_15_MINIMAL_DETAIL_PATH}')`)) throw new Error('built app does not resolve the approved Hero 15 minimal detail consumer');
  if (!app.includes(`fetch('./${HERO_16_MINIMAL_DETAIL_PATH}')`)) throw new Error('built app does not resolve the approved Hero 16 minimal detail consumer');
  if (!app.includes(`fetch('./${HERO_MINIMAL_DETAIL_BATCH_PATH}')`)) throw new Error('built app does not resolve the approved Minimal Detail batch consumer');
  if (!app.includes(`fetch('./${HERO_MINIMAL_DETAIL_TWENTY_BATCH_PATH}')`)) throw new Error('built app does not resolve the approved twenty-Hero Minimal Detail batch consumer');
  if (!app.includes(`fetch('./${HERO_MINIMAL_DETAIL_THIRTY_BATCH_PATH}')`)) throw new Error('built app does not resolve the approved thirty-Hero Minimal Detail batch consumer');
  if (!app.includes(`fetch('./${HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH}')`)) throw new Error('built app does not resolve the approved thirty-one-Hero Minimal Detail batch consumer');
  if (!app.includes(`fetch('./${HERO_MINIMAL_DETAIL_FORTY_BATCH_PATH}')`)) throw new Error('built app does not resolve the approved forty-Hero Minimal Detail batch consumer');
  if (!app.includes("fetch('./generated/sp-soldiers.v1.json')")) throw new Error('built app does not resolve the generated SP Soldier data entry');
  if (!app.includes("fetch('./generated/normal-soldiers.v1.json')")) throw new Error('built app does not resolve the generated NORMAL Soldier data entry');
  if (!app.includes("fetch('./generated/soldier-training-tech-descriptions.v1.json')")) throw new Error('built app does not resolve the scoped TrainingTech proposal consumer');
  if (!app.includes("data.contract.status !== 'EFFECTIVE' || data.contract.approved !== true || data.contract.effective !== true")) {
    throw new Error('built app must require an approved, effective TrainingTech contract');
  }
  if (includeTrainingTechDirectJson) {
    const packagedTrainingTechText = await readFile(join(output, 'generated', 'soldier-training-tech-descriptions.v1.json'), 'utf8');
    if (packagedTrainingTechText !== trainingTechGeneratedText) throw new Error('packaged TrainingTech projection differs from validated Generated artifact');
  } else {
    try {
      await readFile(join(output, 'generated', 'soldier-training-tech-descriptions.v1.json'), 'utf8');
      throw new Error('revoked or non-effective TrainingTech JSON must not be included in the Build output');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  if (!app.includes("fetch('./generated/hero-soldier-relations.v1.json')")) throw new Error('built app does not resolve the generated Hero–Soldier relation entry');
  const packagedRelationsText = await readFile(join(output, 'generated', 'hero-soldier-relations.v1.json'), 'utf8');
  if (packagedRelationsText !== heroSoldierRelationText) throw new Error('packaged Hero–Soldier relations differ from tracked generated artifact');
  const packagedRelations = JSON.parse(packagedRelationsText);
  const packagedHero15MinimalDetailText = await readFile(join(output, ...HERO_15_MINIMAL_DETAIL_PATH.split('/')), 'utf8');
  if (packagedHero15MinimalDetailText !== hero15MinimalDetailText) throw new Error('packaged Hero 15 minimal detail differs from validated Generated artifact');
  const packagedHero15MinimalDetail = JSON.parse(packagedHero15MinimalDetailText);
  if (packagedHero15MinimalDetail.heroes.length !== 1 || packagedHero15MinimalDetail.heroes[0].heroId !== 15) throw new Error('packaged Hero Minimal Detail scope mismatch');
  assert.equal(createHash('sha256').update(packagedHero15MinimalDetailText).digest('hex'),
    'ff6404711698bdd04e426097e09f9a735ed2c16e34693174d0e3974433859021', 'Packaged Hero 15 public v1 bytes changed');
  const packagedHero16MinimalDetailText = await readFile(join(output, ...HERO_16_MINIMAL_DETAIL_PATH.split('/')), 'utf8');
  if (packagedHero16MinimalDetailText !== hero16MinimalDetailText) throw new Error('packaged Hero 16 minimal detail differs from validated Generated artifact');
  assert.equal(Buffer.byteLength(packagedHero16MinimalDetailText),294,'Packaged Lance base v1 length');
  assert.equal(createHash('sha256').update(packagedHero16MinimalDetailText).digest('hex'),
    'ef76cb5a482d1fc717a49a16b115f25358c843cdb5ded784b9d7558ad1ed83d2','Packaged Lance base v1 digest');
  const packagedHero16MinimalDetail = JSON.parse(packagedHero16MinimalDetailText);
  if (packagedHero16MinimalDetail.heroes.length !== 1 || packagedHero16MinimalDetail.heroes[0].heroId !== 16) throw new Error('packaged Hero 16 Minimal Detail scope mismatch');
  const packagedHeroMinimalDetailBatchText = await readFile(join(output, ...HERO_MINIMAL_DETAIL_BATCH_PATH.split('/')), 'utf8');
  if (packagedHeroMinimalDetailBatchText !== heroMinimalDetailBatchText) throw new Error('packaged Minimal Detail batch differs from validated Generated artifact');
  const packagedHeroMinimalDetailBatch = JSON.parse(packagedHeroMinimalDetailBatchText);
  if (JSON.stringify(packagedHeroMinimalDetailBatch.heroes.map(({ heroId }) => heroId)) !== '[17,18,20,21,30]') throw new Error('packaged Minimal Detail batch scope mismatch');
  const packagedHeroMinimalDetailTenBatchText = await readFile(join(output, ...HERO_MINIMAL_DETAIL_TEN_BATCH_PATH.split('/')), 'utf8');
  if (packagedHeroMinimalDetailTenBatchText !== heroMinimalDetailTenBatchText) throw new Error('packaged ten-Hero Minimal Detail batch differs from validated Generated artifact');
  const packagedHeroMinimalDetailTenBatch = JSON.parse(packagedHeroMinimalDetailTenBatchText);
  if (JSON.stringify(packagedHeroMinimalDetailTenBatch.heroes.map(({ heroId }) => heroId)) !== '[31,34,35,36,38,39,49,51,54,57]') throw new Error('packaged ten-Hero Minimal Detail batch scope mismatch');
  const packagedHeroMinimalDetailTwentyBatchText = await readFile(join(output, ...HERO_MINIMAL_DETAIL_TWENTY_BATCH_PATH.split('/')), 'utf8');
  if (packagedHeroMinimalDetailTwentyBatchText !== heroMinimalDetailTwentyBatchText) throw new Error('packaged twenty-Hero Minimal Detail batch differs from validated Generated artifact');
  const packagedHeroMinimalDetailTwentyBatch = JSON.parse(packagedHeroMinimalDetailTwentyBatchText);
  if (JSON.stringify(packagedHeroMinimalDetailTwentyBatch.heroes.map(({ heroId }) => heroId)) !== '[58,59,61,62,63,64,65,66,87,88,91,92,93,94,95,96,97,98,99,100]') throw new Error('packaged twenty-Hero Minimal Detail batch scope mismatch');
  const packagedHeroMinimalDetailThirtyBatchText = await readFile(join(output, ...HERO_MINIMAL_DETAIL_THIRTY_BATCH_PATH.split('/')), 'utf8');
  if (packagedHeroMinimalDetailThirtyBatchText !== heroMinimalDetailThirtyBatchText) throw new Error('packaged thirty-Hero Minimal Detail batch differs from validated Generated artifact');
  const packagedHeroMinimalDetailThirtyOneBatchText = await readFile(join(output, ...HERO_MINIMAL_DETAIL_THIRTY_ONE_BATCH_PATH.split('/')), 'utf8');
  if (packagedHeroMinimalDetailThirtyOneBatchText !== heroMinimalDetailThirtyOneBatchText) throw new Error('packaged thirty-one-Hero Minimal Detail batch differs from validated Generated artifact');
  const packagedHeroMinimalDetailThirtyBatch = JSON.parse(packagedHeroMinimalDetailThirtyBatchText);
  const packagedHeroMinimalDetailThirtyOneBatch = JSON.parse(packagedHeroMinimalDetailThirtyOneBatchText);
  const packagedHeroMinimalDetailFortyBatchText = await readFile(join(output, ...HERO_MINIMAL_DETAIL_FORTY_BATCH_PATH.split('/')), 'utf8');
  if (packagedHeroMinimalDetailFortyBatchText !== heroMinimalDetailFortyBatchText) throw new Error('packaged forty-Hero Minimal Detail batch differs from validated Generated artifact');
  const packagedHeroMinimalDetailFortyBatch = JSON.parse(packagedHeroMinimalDetailFortyBatchText);
  if (packagedHeroMinimalDetailFortyBatch.heroes.length !== 40 || packagedHeroMinimalDetailFortyBatch.heroes.some(({ heroId }, index) => heroId !== heroMinimalDetailFortyBatchInputs.decision.approvedScope.heroes[index].heroId)) throw new Error('packaged forty-Hero Minimal Detail batch scope mismatch');
  if (JSON.stringify(packagedHeroMinimalDetailThirtyOneBatch.heroes.map(({ heroId }) => heroId)) !== '[99164,99165,99166,99167,99168,99169,99170,99171,99172,99173,99174,99175,99176,99177,99178,99179,99180,99181,99182,99183,99184,99185,99186,99187,99188,99189,99190,99191,99192,99193,99197]') throw new Error('packaged thirty-one-Hero Minimal Detail batch scope mismatch');
  if (JSON.stringify(packagedHeroMinimalDetailThirtyBatch.heroes.map(({ heroId }) => heroId)) !== '[101,102,103,104,105,106,108,109,110,111,112,113,114,115,116,118,119,120,121,122,123,124,125,126,127,129,130,99161,99162,99163]') throw new Error('packaged thirty-Hero Minimal Detail batch scope mismatch');
  if (!app.includes("fetch('./generated/hero-minimal-detail-batch-31-34-35-36-38-39-49-51-54-57.v1.json')")) throw new Error('built app does not resolve approved ten-Hero Minimal Detail batch');
  if (!app.includes("fetch('./generated/job-glossary.v1.json')")) throw new Error('built app does not resolve the generated Job glossary entry');
  if (!app.includes("fetch('./generated/general-ssr-equipment.v1.json')")) throw new Error('built app does not resolve the generated General SSR Equipment entry');
  if (!app.includes("fetch('./generated/exclusive-equipment.v1.json')")) throw new Error('built app does not resolve the generated Exclusive Equipment entry');
  if (!app.includes("fetch('./generated/hero-15-talent-public.v1.json')")) throw new Error('built app does not resolve the approved Hero 15 Talent entry');
  if (!app.includes("fetch('./generated/exclusive-equipment-hero-navigation.v1.json')")) throw new Error('built app does not resolve the approved Exclusive Equipment Hero Navigation entry');
  const packagedEquipmentText = await readFile(join(output, 'generated', 'general-ssr-equipment.v1.json'), 'utf8');
  if (packagedEquipmentText !== equipmentGeneratedText) throw new Error('packaged General SSR Equipment differs from validated generated artifact');
  const packagedEquipment = JSON.parse(packagedEquipmentText);
  const packagedExclusiveEquipmentText = await readFile(join(output, 'generated', 'exclusive-equipment.v1.json'), 'utf8');
  if (packagedExclusiveEquipmentText !== exclusiveEquipmentGeneratedText) throw new Error('packaged Exclusive Equipment differs from validated generated artifact');
  const packagedExclusiveEquipment = JSON.parse(packagedExclusiveEquipmentText);
  const packagedExclusiveHeroNavigationText = await readFile(join(output, ...EXCLUSIVE_EQUIPMENT_HERO_NAVIGATION_PATH.split('/')), 'utf8');
  if (packagedExclusiveHeroNavigationText !== exclusiveHeroNavigationText) throw new Error('packaged Exclusive Equipment Hero Navigation differs from validated Generated artifact');
  const packagedExclusiveHeroNavigation = JSON.parse(packagedExclusiveHeroNavigationText);
  if (await readFile(join(output, ...HERO_15_TALENT_PUBLIC_PATH.split('/')), 'utf8') !== hero15TalentPublicText) throw new Error('packaged Hero 15 Talent differs from validated Generated artifact');
  if (packagedExclusiveHeroNavigation.records.length !== 167) throw new Error('packaged Exclusive Equipment Hero Navigation population mismatch');
  const packagedGlossary = JSON.parse(await readFile(join(output, 'generated', 'job-glossary.v1.json'), 'utf8'));

  const packagedOrdinaryText = await readFile(join(output,ordinaryPublic), 'utf8');
  validateOrdinaryPublic(packagedOrdinaryText, lanceOrdinary.v1);
  const newOrdinaryText = await readFile(join(output,ordinaryPublicV2),'utf8');
  validateOrdinaryPublic(newOrdinaryText,lanceOrdinary.v2);
  const skillsV3Text = await readFile(join(output,ordinaryPublicV3),'utf8');
  validateOrdinaryPublic(skillsV3Text,lanceOrdinary.v3);
  assert.equal(Buffer.byteLength(skillsV3Text),2219,'Packaged Lance v3 length');
  assert.equal(createHash('sha256').update(skillsV3Text).digest('hex'),'8da5645139e51d86367c8c6e11f7b801719c41102bb122220ce9582fa2e30dc5','Packaged Lance v3 digest');
  const skillsV3 = JSON.parse(skillsV3Text);
  const skillsV4Text = await readFile(join(output,ordinaryPublicV4),'utf8');
  validateOrdinaryPublic(skillsV4Text,lanceOrdinary.v4);
  const skillsV4 = JSON.parse(skillsV4Text);
  const skillsV5Text = await readFile(join(output,ordinaryPublicV5),'utf8');
  validateOrdinaryPublic(skillsV5Text,lanceOrdinary.v5);
  const skillsV5 = JSON.parse(skillsV5Text);
  assert.deepEqual(skillsV5.ordinarySkills.filter(row=>row.skillId!==10418),skillsV4.ordinarySkills,'Preserved v4 rows');
  assert.deepEqual(skillsV4.ordinarySkills.filter(row => row.skillId !== 11819),skillsV3.ordinarySkills,'Preserved v3 rows');
  const oldSkills = JSON.parse(packagedOrdinaryText);
  const newSkills = JSON.parse(newOrdinaryText);
  for (const oldRow of oldSkills.ordinarySkills) {
    const newRow = newSkills.ordinarySkills.find(r=>r.skillId===oldRow.skillId);
    assert.equal(JSON.stringify(newRow),JSON.stringify(oldRow),'Lance existing Skill object bytes');
  }
  for (const row of newSkills.ordinarySkills) {
    const preserved = skillsV3.ordinarySkills.find(r=>r.skillId===row.skillId);
    assert.equal(JSON.stringify(preserved),JSON.stringify(row),'Lance v3 preserved Skill object bytes');
  }
  const packagedTalentText = await readFile(join(output, lanceTalentPublic), 'utf8');
  validateLanceTalentPackage(packagedTalentText, lanceTalent);
  assert.equal(Buffer.byteLength(packagedTalentText),1866,'Packaged Lance Talent v1 length');
  assert.equal(createHash('sha256').update(packagedTalentText).digest('hex'),
    '80a670648c10269ee32d4cec33e81335698422ada2e53c3eb94d21502f59af94','Packaged Lance Talent v1 digest');
  const files = await validatePublicSiteDirectory(output, canonical, fullDetailPublicationDecision, trainingTechDecisionRecord, process.cwd(), exclusiveHeroPublicationDecision, hero15IntegratedPublication, hero16IntegratedPublication, heroMinimalDetailBatchPublication, heroMinimalDetailTenBatchPublication, heroMinimalDetailTwentyBatchPublication, heroMinimalDetailThirtyBatchPublication, heroMinimalDetailThirtyOneBatchPublication, heroMinimalDetailFortyBatchPublication, hero15TalentPublication, hero15SoldierTextPublication);
  const hero15Card = renderAndCheckPackagedHero15(app, packagedHero15MinimalDetail, JSON.parse(await readFile(join(output, HERO_15_TALENT_PUBLIC_PATH), 'utf8')),
    keyGroups, renderHeadGoldSubtotal(profileInputs), await readSlotGoldSubtotals(readJson, profileInputs));
  assert.deepEqual(textLines(hero15Card,text=>text?.startsWith('중국어명 · ') || text?.startsWith('성우 · ')),
    ['중국어명 · 莉亚娜 / 영문명 · Liana','성우 · 코시미즈 아미'],'Packaged Liana original names and voice');
  assert.equal(createHash('sha256').update(newOrdinaryText).digest('hex'),'fec251ee8db49065e1405e8cb703cf73c81ae94494fdcabcb79ea559a44a3190','Merged v2 public bytes');
  assert.equal(createHash('sha256').update(skillsV4Text).digest('hex'),'52da81c3271b97a6f89c199cc0793289f6aebfedcbd9bf4a5a7fe09bf9caac3e','Merged v4 public bytes');
  const goldLines = await readLanceGoldDisplay(readJson);
  checkPackagedHero16(app, packagedHero16MinimalDetail, lanceLines, lanceJobPath, goldLines, effectLines, bondTotals, movementPaths, commandRows, heartGroups, allBondDescriptions);
  await Promise.all([
    validateHero15FetterInternal(), validateHero15FullDetailPublicationFromRoot(),
    validateHero15FetterMaterialRelations(), validateHero15FetterConditionTypeReferences(),
    validateHero15FetterRewardTypeReferences(), validateHero15FetterSkillReferences(),
  ]);
  assert.equal(createHash('sha256').update(await readFile('generated/hero-15-fetter-internal.v1.json')).digest('hex'),
    'd7cc703459fe4ed04bc43e9ba2709ce0a89d539d4b42d7778391e8095733b552', 'Liana Fetter internal projection bytes');
  checkPackagedSoldierCommand(hero15Card);
  checkPackagedSkillDescriptions(hero15Card, skillDescriptions);
  const base338 = await readFile(resolve('tools/fixtures/hero-16-fetter-gold-base-338-app.js'));
  assert.equal(base338.length, 123101);
  assert.equal(createHash('sha256').update(base338).digest('hex'),
    '475a25604a81d0523ba8373210226612a62895e41e31de6a40f8b080ed4ca62c', 'Merged #338 app digest');
  const startupArgs = [JSON.parse(packagedTalentText), skillsV4, skillsV3, true, goldLines, effectLines];
  const currentFeatures = { lines:bondTotals, finalPaths, commandRows, heartGroups };
  const v5Args = [JSON.parse(packagedTalentText), skillsV5, skillsV4, true, goldLines, effectLines];
  const priorFeatures = { ...currentFeatures, bondDescriptions: allBondDescriptions };
  const candidateRequests = await checkPackagedLanceStartup(output, html, app, ...v5Args, { ...priorFeatures, finalPaths: movementPaths });
  const base345 = await readFile(resolve('tools/fixtures/hero-16-final-movement-base-345-app.js'));
  assert.equal(createHash('sha256').update(base345).digest('hex'), '54bff924fb76bf6aade989e5a1a09b616b5fd8f9fcb61a7e5f7d76ecf9313094', 'Merged #345 app digest');
  const base345Requests = await checkPackagedLanceStartup(output, html, base345.toString('utf8'), ...v5Args, priorFeatures);
  assert.deepEqual(candidateRequests, base345Requests, 'Lance #345 requests across final Job movement display');
  const base344 = await readFile(resolve('tools/fixtures/hero-16-bond45-base-344-app.js'));
  assert.equal(createHash('sha256').update(base344).digest('hex'), '431a1a9858ae869317e316f9d1c087339ec5ec8510be1f0fabecb69e7dc63716', 'Merged #344 app digest');
  const base344Requests = await checkPackagedLanceStartup(output, html, base344.toString('utf8'), ...v5Args, { ...currentFeatures, bondDescriptions });
  assert.deepEqual(candidateRequests, base344Requests, 'Lance #344 complete fetch URLs and counts');
  const base343 = await readFile(resolve('tools/fixtures/hero-16-bond23-base-343-app.js'));
  assert.equal(createHash('sha256').update(base343).digest('hex'), '62f0e539e32b7b3d5cd55e3d9c663e6bb11b44ba2e37c4deec8f62af0b0562c5', 'Merged #343 app digest');
  const base343Requests = await checkPackagedLanceStartup(output, html, base343.toString('utf8'), ...v5Args, currentFeatures);
  assert.deepEqual(candidateRequests, base343Requests, 'Lance #343 complete fetch URLs and counts');
  const base342 = await readFile(resolve('tools/fixtures/hero-16-wind-base-342-app.js'));
  assert.equal(createHash('sha256').update(base342).digest('hex'),'aa209787b00fac5bed631c5e66608baf699a0f97f548889fc062cd0d05aff1b5','Merged #342 app digest');
  const legacyRequests = await checkPackagedLanceStartup(output,html,base342.toString('utf8'),...startupArgs,currentFeatures);
  // The optional loader checks each actual URL. Only the versioned URL changes across these traces.
  const priorUrl = pathToFileURL(join(output,ordinaryPublicV4)).href;
  const newUrl = pathToFileURL(join(output,ordinaryPublicV5)).href;
  assert.deepEqual(candidateRequests.map(trace=>trace.map(([url,count])=>[url===newUrl ? priorUrl : url,count])),
    legacyRequests,'Lance #342 fetch counts across v4 and v5');
  const previousRequests = await checkPackagedLanceStartup(output,html,base338.toString('utf8'),...startupArgs,{});
  const base339 = await readFile(resolve('tools/fixtures/hero-16-final-jobs-base-339-app.js'));
  assert.equal(base339.length, 123739);
  assert.equal(createHash('sha256').update(base339).digest('hex'),
    '2348ffe1d8599ef30b9609c4c87f21a219d34671c995daa2c505224321ff1b02', 'Merged #339 app digest');
  const baseRequests = await checkPackagedLanceStartup(output,html,base339.toString('utf8'),...startupArgs,{ lines:bondTotals });
  const base340 = await readFile(resolve('tools/fixtures/hero-16-soldier-command-base-340-app.js'));
  assert.equal(base340.length,124007);
  assert.equal(createHash('sha256').update(base340).digest('hex'),
    '4a1cbcec94b57128db55f4ba7d8fad5ab4c409795c6b2119f42e4fd7425bd6a6', 'Merged #340 app digest');
  const previousCommandRequests = await checkPackagedLanceStartup(output,html,base340.toString('utf8'),...startupArgs,{ lines:bondTotals, finalPaths });
  const base341 = await readFile(resolve('tools/fixtures/hero-16-heart-fetter-base-341-app.js'));
  assert.equal(createHash('sha256').update(base341).digest('hex'),'e0358782f019dded4c27105b2151075527471241490ef19aa8709c6011307339','Merged #341 app digest');
  const baseHeartRequests = await checkPackagedLanceStartup(output,html,base341.toString('utf8'),...startupArgs,{ lines:bondTotals, finalPaths, commandRows });
  assert.deepEqual(legacyRequests,baseHeartRequests,'Lance #341 fetch URLs and counts across Heart Fetter display and optional loading');
  assert.deepEqual(legacyRequests, previousCommandRequests, 'Lance #340 fetch URL counts across command and optional loading');
  assert.deepEqual(legacyRequests, baseRequests, 'Lance #339 complete fetch URL counts by scenario and arrival');
  assert.deepEqual(legacyRequests, previousRequests, 'Lance complete fetch URL counts by scenario and arrival');
  const base337 = await readFile(resolve('tools/fixtures/hero-16-central-effect-base-337-app.js'));
  assert.equal(base337.length, 122948, 'Merged #337 app length');
  assert.equal(createHash('sha256').update(base337).digest('hex'),
    '52446799ac17c9c71ec3c94a5248d008910adf35fede2929078221caa2547616', 'Merged #337 app digest');
  await checkPackagedLanceStartup(output,html,base337.toString('utf8'),JSON.parse(packagedTalentText),skillsV4,skillsV3,true,goldLines);
  const oldApp = await readFile(resolve('tools/fixtures/hero-16-ordinary-skills-base-app.js'),'utf8');
  assert.equal(createHash('sha256').update(oldApp).digest('hex'),'9c4e9d027b27308d3e0a18f1f7dc913371a0df11256e4cd808e315d23d58fb3f','Packaged Lance #332 fixture digest');
  assert.equal(Buffer.byteLength(oldApp),120939,'Packaged Lance #332 fixture length');
  const base333App = await readFile(resolve('tools/fixtures/hero-16-profile-base-333-app.js'),'utf8');
  assert.equal(Buffer.byteLength(base333App),121696,'Packaged Lance #333 fixture length');
  assert.equal(createHash('sha256').update(base333App).digest('hex'),'699653dcc1881f6078f2c4ed120954582131ac322412a4005196ad2c4641be44','Packaged Lance #333 fixture digest');
  assert.equal(Buffer.byteLength(newOrdinaryText),1799,'Packaged Lance skills v2 length');
  assert.equal(createHash('sha256').update(newOrdinaryText).digest('hex'),'fec251ee8db49065e1405e8cb703cf73c81ae94494fdcabcb79ea559a44a3190','Packaged Lance skills v2 digest');
  await checkPackagedLanceStartup(output,html,oldApp,JSON.parse(packagedTalentText),oldSkills,newSkills,false);
  await checkPackagedLanceStartup(output,html,base333App,JSON.parse(packagedTalentText),newSkills,oldSkills,false);
  const base334App = await readFile(resolve('tools/fixtures/hero-16-passives-base-334-app.js'),'utf8');
  assert.equal(Buffer.byteLength(base334App),121795,'Packaged Lance #334 fixture length');
  assert.equal(createHash('sha256').update(base334App).digest('hex'),'aaa738dfcf88c9fe3a3790567a6ddea0c7fa1d467d1cddaa8095b2462d36343d','Packaged Lance #334 fixture digest');
  await checkPackagedLanceStartup(output,html,base334App,JSON.parse(packagedTalentText),newSkills,oldSkills,true);
  const base335 = await readFile(resolve('tools/fixtures/hero-16-central-discipline-base-335-app.js'));
  assert.equal(base335.length,122052,'#335 fixture length');
  assert.equal(createHash('sha1').update('blob 122052\0').update(base335).digest('hex'),'619111cec61b3aeb83c78ab29a30e5a945226967','#335 fixture blob');
  assert.equal(createHash('sha256').update(base335).digest('hex'),'9073023e1142c8cfeb48ed0150c744816497ae37d2dc8a531f47ac4434b22140','#335 fixture digest');
  await checkPackagedLanceStartup(output,html,base335.toString('utf8'),JSON.parse(packagedTalentText),skillsV3,newSkills,true);
  // #336 merge 94b13d04513fa19851bc50b54a62aea6d81ba3af introduced the gold section and still consumes v3.
  const base336 = await readFile(resolve('tools/fixtures/hero-16-imperial-storm-base-336-app.js'));
  assert.equal(base336.length,122677,'#336 fixture length');
  assert.equal(createHash('sha256').update(base336).digest('hex'),'4d35ddb545b8ff92b8dee67cd4968405b5ebd69adc1c58d7f62e3c9bb4f03b29','#336 fixture digest');
  await checkPackagedLanceStartup(output,html,base336.toString('utf8'),JSON.parse(packagedTalentText),skillsV3,newSkills,true,goldLines);
  if (manifestPath) {
    const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    if (process.env.GITHUB_SHA && process.env.GITHUB_SHA !== sourceSha) throw new Error('Build Source SHA differs from workflow SHA');
    await writeFile(resolve(manifestPath), `${JSON.stringify({ schemaVersion: 1, sourceSha, files }, null, 2)}\n`, { flag: 'wx' });
  }
  completed = true;
  process.stdout.write(`Static build: PASS (${output}; ${heroIndexValidation.indexCount} approved Hero Index rows; ${heroIndexValidation.detailCount} Full Detail endpoints; ${packagedHero15MinimalDetail.heroes.length + packagedHero16MinimalDetail.heroes.length + packagedHeroMinimalDetailBatch.heroes.length + packagedHeroMinimalDetailTenBatch.heroes.length + packagedHeroMinimalDetailTwentyBatch.heroes.length + packagedHeroMinimalDetailThirtyBatch.heroes.length + packagedHeroMinimalDetailThirtyOneBatch.heroes.length + packagedHeroMinimalDetailFortyBatch.heroes.length} Minimal Detail endpoints; ${spGenerated.soldiers.length} SP Soldier, ${normalSoldierGenerated.soldiers.length} NORMAL Soldier, ${packagedGlossary.jobs.length} Job glossary, ${packagedEquipment.equipment.length} General SSR Equipment, ${packagedExclusiveEquipment.equipment.length} Exclusive Equipment, ${packagedExclusiveHeroNavigation.records.length} Equipment Hero Navigation relations, ${packagedExclusiveHeroNavigation.records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_DETAIL').length} detail targets, ${packagedExclusiveHeroNavigation.records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_INDEX').length} Index targets, ${packagedExclusiveHeroNavigation.records.filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_MINIMAL_DETAIL').length} Minimal Detail targets, ${packagedRelations.relations.length} Hero–Soldier relation records, ${portraitPaths.length} portrait assets; public allowlist ${files.length} files)\n`);
  return { output, files };
} finally {
  if (!verifyDir && (!outputDir || !completed)) await rm(output, { recursive: true, force: true });
}
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = {};
  const flags = { '--output-dir': 'outputDir', '--verify-dir': 'verifyDir', '--manifest': 'manifestPath' };
  const args = process.argv.slice(2);
  while (args.length) {
    const flag = args.shift();
    if (!flags[flag] || !args[0] || args[0].startsWith('--') || options[flags[flag]]) throw new Error(`Invalid Build option: ${flag}`);
    options[flags[flag]] = args.shift();
  }
  await buildSite(options);
}
