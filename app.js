import { selectSkinFullarts } from './skin-fullart-presentation.mjs';

const container = document.querySelector('#heroes');
const heroIndexContainer = document.querySelector('#hero-index-results');
const heroIndexSearch = document.querySelector('#hero-index-search');
const heroIndexDetailFilter = document.querySelector('#hero-index-detail-filter');
const heroIndexSearchClear = document.querySelector('#hero-index-search-clear');
const heroIndexSearchCount = document.querySelector('#hero-index-search-count');
const heroIndexSearchEmpty = document.querySelector('#hero-index-search-empty');
const hero15MinimalDetailContainer = document.querySelector('#hero-minimal-detail-15-content');
const hero16MinimalDetailContainer = document.querySelector('#hero-minimal-detail-16-content');
const heroMinimalDetailBatchContainers = new Map([17, 18, 20, 21, 30].map((heroId) => [heroId, document.querySelector(`#hero-minimal-detail-${heroId}-content`)]));
const heroMinimalDetailTenBatchContainers = new Map([31, 34, 35, 36, 38, 39, 49, 51, 54, 57].map((heroId) => [heroId, document.querySelector(`#hero-minimal-detail-${heroId}-content`)]));
const heroMinimalDetailTwentyBatchContainers = new Map([58, 59, 61, 62, 63, 64, 65, 66, 87, 88, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100].map((heroId) => [heroId, document.querySelector(`#hero-minimal-detail-${heroId}-content`)]));
const heroMinimalDetailThirtyBatchContainers = new Map([101, 102, 103, 104, 105, 106, 108, 109, 110, 111, 112, 113, 114, 115, 116, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 129, 130, 99161, 99162, 99163].map((heroId) => [heroId, document.querySelector(`#hero-minimal-detail-${heroId}-content`)]));
const heroMinimalDetailThirtyOneBatchContainers = new Map([99164, 99165, 99166, 99167, 99168, 99169, 99170, 99171, 99172, 99173, 99174, 99175, 99176, 99177, 99178, 99179, 99180, 99181, 99182, 99183, 99184, 99185, 99186, 99187, 99188, 99189, 99190, 99191, 99192, 99193, 99197].map((heroId) => [heroId, document.querySelector(`#hero-minimal-detail-${heroId}-content`)]));
const heroMinimalDetailFortyBatchContainers = new Map([99198, 99199, 99203, 99204, 99205, 99206, 99207, 99208, 99212, 99213, 99214, 99215, 99216, 99217, 99218, 99219, 99220, 99221, 99225, 99226, 99227, 99228, 99229, 99230, 99231, 99233, 99234, 99238, 99239, 99240, 99241, 99243, 99244, 99249, 99250, 99252, 99253, 99254, 99255, 99259].map((heroId) => [heroId, document.querySelector(`#hero-minimal-detail-${heroId}-content`)]));
const heroSearch = document.querySelector('#hero-search');
const heroSearchClear = document.querySelector('#hero-search-clear');
const heroFactionFilter = document.querySelector('#hero-faction-filter');
const heroSearchCount = document.querySelector('#hero-search-count');
const heroSearchEmpty = document.querySelector('#hero-search-empty');
const spSoldierContainer = document.querySelector('#sp-soldiers');
const normalSoldierContainer = document.querySelector('#normal-soldiers');
const jobGlossaryContainer = document.querySelector('#job-glossary');
const generalEquipmentContainer = document.querySelector('#general-ssr-equipment');
const exclusiveEquipmentContainer = document.querySelector('#exclusive-equipment');
const generalEquipmentSearch = document.querySelector('#general-equipment-search');
const generalEquipmentClear = document.querySelector('#general-equipment-clear');
const generalEquipmentCount = document.querySelector('#general-equipment-count');
const exclusiveEquipmentSearch = document.querySelector('#exclusive-equipment-search');
const exclusiveEquipmentClear = document.querySelector('#exclusive-equipment-clear');
const exclusiveEquipmentCount = document.querySelector('#exclusive-equipment-count');
const spSoldierSearch = document.querySelector('#sp-soldier-search');
const spSoldierClear = document.querySelector('#sp-soldier-clear');
const spSoldierCount = document.querySelector('#sp-soldier-count');
const normalSoldierSearch = document.querySelector('#normal-soldier-search');
const normalSoldierClear = document.querySelector('#normal-soldier-clear');
const normalSoldierCount = document.querySelector('#normal-soldier-count');
let exclusiveEquipmentHeroById = new Map();
let exclusiveEquipmentNavigation = null;
let heroNavigation = null;
let heroIndexNavigation = null;
let heroIndexDetailIds = new Set();
let hero15MinimalDetailNavigation = null;
let hero15MinimalDetailIds = new Set();
let hero16MinimalDetailNavigation = null;
let hero16MinimalDetailIds = new Set();
let heroMinimalDetailBatchNavigation = new Map();
let heroMinimalDetailBatchIds = new Set();
let heroMinimalDetailTenBatchNavigation = new Map();
let heroMinimalDetailTwentyBatchNavigation = new Map();
let heroMinimalDetailTwentyBatchIds = new Set();
let heroMinimalDetailThirtyBatchNavigation = new Map();
let heroMinimalDetailThirtyBatchIds = new Set();
let heroMinimalDetailThirtyOneBatchNavigation = new Map();
let heroMinimalDetailThirtyOneBatchIds = new Set();
let heroMinimalDetailFortyBatchNavigation = new Map();
let heroMinimalDetailFortyBatchIds = new Set();
let heroBySoldierId = new Map();
let spSoldiersByNormalId = new Map();
let spSoldierNavigation = null;
let normalSoldierNavigation = null;
let soldierTrainingTechDescriptions = new Map();

function indexSpSoldiersByNormalId(soldiers) {
  const byNormalId = new Map();
  const seenPairs = new Set();
  for (const soldier of soldiers) {
    if (!Number.isInteger(soldier.spSoldierId) || !Number.isInteger(soldier.normalSoldierId)
      || typeof soldier.nameKo !== 'string' || !soldier.nameKo) {
      throw new Error('Malformed SP–NORMAL Soldier presentation relation');
    }
    const pairKey = `${soldier.normalSoldierId}:${soldier.spSoldierId}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);
    const linked = byNormalId.get(soldier.normalSoldierId) ?? [];
    linked.push({ spSoldierId: soldier.spSoldierId, nameKo: soldier.nameKo });
    byNormalId.set(soldier.normalSoldierId, linked);
  }
  return byNormalId;
}

function makeAnchor(label, targetId, revealTarget = () => {}, revealHiddenTarget = false) {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.textContent = label;
  link.addEventListener('click', (event) => {
    let target = document.getElementById(targetId);
    if (!target || (revealHiddenTarget && target.hidden)) {
      revealTarget();
      target = document.getElementById(targetId);
    }
    if (!target) {
      event.preventDefault();
      let frames = 0;
      const waitForTarget = () => {
        target = document.getElementById(targetId);
        if (target) {
          window.location.hash = targetId;
          target.scrollIntoView?.();
        } else if (frames++ < 300) {
          window.requestAnimationFrame(waitForTarget);
        }
      };
      window.requestAnimationFrame(waitForTarget);
    } else {
      const scrollToTarget = () => document.getElementById(targetId)?.scrollIntoView?.();
      if (typeof window !== 'undefined' && window.requestAnimationFrame) window.requestAnimationFrame(scrollToTarget);
      else scrollToTarget();
    }
  });
  return link;
}

function filterHeroes(heroes, query) {
  const term = query.trim();
  if (!term) return heroes;
  if (/^\d+$/.test(term)) return heroes.filter((hero) => String(hero.id) === term);
  if (/^(?:\d|[+-]\d)/.test(term)) return [];
  const nameQuery = term.toLocaleLowerCase('ko-KR');
  return heroes.filter((hero) => hero.nameKo.toLocaleLowerCase('ko-KR').includes(nameQuery));
}

function filterHeroIndex(heroes, query) {
  const term = query.trim();
  if (!term) return heroes;
  if (/^\d+$/.test(term)) return heroes.filter((hero) => String(hero.heroId) === term);
  if (/^(?:\d|[+-]\d)/.test(term)) return [];
  const nameQuery = term.toLocaleLowerCase('ko-KR');
  return heroes.filter((hero) => hero.nameKo.toLocaleLowerCase('ko-KR').includes(nameQuery));
}

function renderHeroIndexSearch({ heroes, detailHeroIds, minimalDetailHeroIds = new Set(), input, detailFilter, clearButton, count, emptyState, container, showDetailTarget, showMinimalDetailTarget }) {
  const approvedDetailIds = new Set(detailHeroIds);
  const approvedMinimalDetailIds = new Set(minimalDetailHeroIds);
  const update = () => {
    const levelFor = (heroId) => approvedDetailIds.has(heroId) ? 'full' : approvedMinimalDetailIds.has(heroId) ? 'minimal' : 'index';
    const matches = filterHeroIndex(heroes, input.value).filter(({ heroId }) => !detailFilter.value || detailFilter.value === 'all' || levelFor(heroId) === detailFilter.value);
    const rows = matches.map((hero) => {
      const item = document.createElement('li');
      item.className = 'hero-index-row';
      item.id = `hero-index-entry-${hero.heroId}`;
      const name = document.createElement('span');
      name.className = 'hero-index-name';
      name.textContent = hero.nameKo;
      const id = document.createElement('span');
      id.className = 'hero-index-id';
      id.textContent = `Hero ID ${hero.heroId}`;
      if (approvedDetailIds.has(hero.heroId)) {
        const link = makeAnchor(hero.nameKo, `hero-${hero.heroId}`, () => showDetailTarget(hero.heroId), true);
        link.className = 'hero-index-detail-link';
        item.append(link, id);
      } else if (approvedMinimalDetailIds.has(hero.heroId)) {
        const link = makeAnchor(hero.nameKo, `hero-minimal-detail-${hero.heroId}`, () => showMinimalDetailTarget(hero.heroId));
        link.className = 'hero-index-minimal-detail-link';
        item.append(link, id);
      } else {
        item.append(name, id);
      }
      const level = document.createElement('span');
      level.className = 'hero-index-level';
      level.textContent = { full: 'Full Detail', minimal: 'Minimal Detail', index: 'Index Only' }[levelFor(hero.heroId)];
      item.append(level);
      return item;
    });
    container.replaceChildren(...rows);
    count.textContent = `검색 결과 ${matches.length}명 / 전체 ${heroes.length}명`;
    emptyState.hidden = matches.length > 0;
    return matches;
  };
  input.addEventListener('input', update);
  detailFilter.addEventListener('change', update);
  const showAll = (focus = true) => {
    input.value = '';
    update();
    if (focus) input.focus();
  };
  clearButton.addEventListener('click', () => showAll());
  update();
  const showTarget = (heroId) => {
    if (!heroes.some(({ heroId: id }) => id === heroId)) return false;
    input.value = '';
    detailFilter.value = 'all';
    update();
    return true;
  };
  return { showAll, showTarget, update };
}

function renderHeroMinimalDetailView(data, container, { heroId, nameKo, equipmentId, equipmentNameKo }, talent = null) {
  const expectedHeroId = heroId;
  if (data?.schemaVersion !== 1 || !Array.isArray(data.heroes) || data.heroes.length !== 1) {
    throw new Error(`Unsupported Hero ${heroId} minimal detail consumer`);
  }
  const hero = data.heroes[0];
  if (Object.keys(hero).sort().join(',') !== 'exclusiveEquipment,heroId,nameKo' || hero.heroId !== heroId || hero.nameKo !== nameKo
    || Object.keys(hero.exclusiveEquipment ?? {}).sort().join(',') !== 'effectDescriptionKo,equipmentId,nameKo'
    || hero.exclusiveEquipment.equipmentId !== equipmentId || hero.exclusiveEquipment.nameKo !== equipmentNameKo
    || !hero.exclusiveEquipment.effectDescriptionKo?.trim()) throw new Error(`Malformed or out-of-scope Hero ${heroId} minimal detail consumer`);
  const article = document.createElement('article');
  article.className = 'hero-minimal-detail-card';
  const name = document.createElement('h3');
  name.textContent = hero.nameKo;
  const id = document.createElement('p');
  id.className = 'hero-minimal-detail-id';
  id.textContent = `Hero ID ${hero.heroId}`;
  const nameStatus = document.createElement('p');
  nameStatus.className = 'hero-minimal-detail-provenance';
  nameStatus.textContent = '프로젝트 검수 표시명 · 공식 한국 서버 Provenance 미확인';
  const equipment = document.createElement('h4');
  equipment.textContent = `${hero.exclusiveEquipment.nameKo} (Equipment ID ${hero.exclusiveEquipment.equipmentId})`;
  const effect = document.createElement('p');
  effect.className = 'hero-minimal-detail-effect';
  effect.textContent = hero.exclusiveEquipment.effectDescriptionKo.replace(/\\n/g, '\n');
  article.append(name, id, nameStatus, equipment, effect);
  if (talent) article.append(makeTalentPresentation(heroId, talent));
  container.replaceChildren(article);
  return {
    showTarget(heroId) {
      if (heroId !== expectedHeroId) return false;
      document.getElementById(`hero-minimal-detail-${heroId}`)?.scrollIntoView?.();
      return true;
    },
  };
}

function renderHero15MinimalDetailView(data, talentData, container) {
  if (Object.keys(talentData ?? {}).sort().join(',') !== 'heroId,officialKrProvenanceStatus,schemaVersion,surface,talent'
    || talentData.schemaVersion !== 1 || talentData.heroId !== 15 || talentData.surface !== 'hero-minimal-detail-15'
    || talentData.officialKrProvenanceStatus !== 'unverified' || talentData.talent?.nameKo !== '성결한 수녀'
    || Object.keys(talentData.talent ?? {}).sort().join(',') !== 'nameKo,starDescriptions'
    || JSON.stringify(talentData.talent?.starDescriptions?.map(({ star, skillId }) => [star, skillId])) !== '[[3,3212],[4,3214],[5,3216],[6,3218]]') {
    throw new Error('Hero 15 Talent consumer is malformed or outside its approved publication scope');
  }
  for (const row of talentData.talent.starDescriptions) {
    if (Object.keys(row).sort().join(',') !== 'descriptionCn,descriptionKoRaw,nameCn,skillId,star') {
      throw new Error('Hero 15 Talent consumer contains an unapproved field');
    }
  }
  return renderHeroMinimalDetailView(data, container, { heroId: 15, nameKo: '리아나', equipmentId: 535, equipmentNameKo: '완벽한 찬사' }, talentData.talent);
}

function renderHero16MinimalDetailView(data, container) {
  return renderHeroMinimalDetailView(data, container, { heroId: 16, nameKo: '란스', equipmentId: 418, equipmentNameKo: '칼자스의 왕관' });
}

function renderHeroSearch({ heroes, input, clearButton, factionFilter, count, emptyState }) {
  const factions = new Map();
  for (const hero of heroes) {
    for (const faction of hero.factions) {
      const label = faction.localizationStatus === 'PROJECT_REVIEWED'
        ? `${faction.nameKo} · 프로젝트 검수 표시명`
        : `미번역 · ${faction.nameCn}`;
      const previous = factions.get(faction.factionId);
      if (previous && previous !== label) throw new Error(`Conflicting presentation labels for Faction ID ${faction.factionId}`);
      factions.set(faction.factionId, label);
    }
  }
  for (const [factionId, label] of [...factions].sort(([left], [right]) => left - right)) {
    const option = document.createElement('option');
    option.value = String(factionId);
    option.textContent = label;
    factionFilter.append(option);
  }
  const update = () => {
    const searchMatches = filterHeroes(heroes, input.value);
    const selectedFactionId = factionFilter.value === 'all' ? null : Number(factionFilter.value);
    const matches = searchMatches.filter((hero) => selectedFactionId === null
      || hero.factions.some(({ factionId }) => factionId === selectedFactionId));
    const visibleIds = new Set(matches.map(({ id }) => id));
    for (const hero of heroes) {
      const card = document.getElementById(`hero-${hero.id}`);
      if (!card) throw new Error(`Missing approved Hero presentation endpoint ${hero.id}`);
      card.hidden = !visibleIds.has(hero.id);
    }
    count.textContent = `검색 결과 ${matches.length}명 / 전체 ${heroes.length}명`;
    emptyState.hidden = matches.length > 0;
    return matches;
  };
  input.addEventListener('input', update);
  factionFilter.addEventListener('change', update);
  const showAll = (focus = true) => {
    input.value = '';
    update();
    if (focus) input.focus();
  };
  const showTarget = (heroId) => {
    const target = heroes.find(({ id }) => id === heroId);
    if (!target) return false;
    const searchHidesTarget = !filterHeroes(heroes, input.value).some(({ id }) => id === heroId);
    const selectedFactionId = factionFilter.value === 'all' ? null : Number(factionFilter.value);
    const factionHidesTarget = selectedFactionId !== null
      && !target.factions.some(({ factionId }) => factionId === selectedFactionId);
    if (searchHidesTarget) input.value = '';
    if (factionHidesTarget) factionFilter.value = 'all';
    update();
    return true;
  };
  clearButton.addEventListener('click', () => showAll());
  update();
  return { showAll, showTarget };
}

function makeHeroRarityLabel(rarity) {
  if (!rarity || typeof rarity.label !== 'string' || !rarity.label.trim()) throw new Error('Generated Hero rarity label is missing');
  const label = document.createElement('span');
  label.className = 'hero-rarity';
  label.textContent = rarity.label;
  label.setAttribute('aria-label', `희귀도 ${rarity.label}`);
  return label;
}

function makeFactionPresentation(factions) {
  if (!Array.isArray(factions) || factions.length === 0) throw new Error('Generated Hero Faction presentation is missing');
  const section = document.createElement('section');
  section.className = 'hero-factions';
  const heading = document.createElement('h3');
  heading.textContent = '진영 · 한국어명';
  const list = document.createElement('ul');
  list.className = 'hero-faction-list';
  const seen = new Set();
  for (const faction of factions) {
    const localized = faction.localizationStatus === 'PROJECT_REVIEWED';
    const expectedKeys = localized ? ['factionId', 'nameCn', 'nameKo', 'localizationStatus'] : ['factionId', 'nameCn', 'localizationStatus'];
    if (!Number.isSafeInteger(faction.factionId) || typeof faction.nameCn !== 'string' || !faction.nameCn.trim()
      || (localized ? typeof faction.nameKo !== 'string' || !faction.nameKo.trim() : faction.localizationStatus !== 'UNTRANSLATED')
      || Object.keys(faction).sort().join('|') !== expectedKeys.sort().join('|') || seen.has(faction.factionId)) throw new Error('Generated Hero Faction presentation is malformed');
    seen.add(faction.factionId);
    const item = document.createElement('li');
    item.textContent = localized ? `${faction.nameKo} (${faction.nameCn})` : `미번역 · ${faction.nameCn}`;
    list.append(item);
  }
  section.append(heading, list);
  return section;
}

function makeOriginPresentation(origins) {
  if (!Array.isArray(origins) || origins.length === 0) throw new Error('Generated Hero Production presentation is missing');
  const section = document.createElement('section');
  section.className = 'hero-origins';
  const heading = document.createElement('h3');
  heading.textContent = '출전작 · 프로젝트 검수 한국어명';
  const list = document.createElement('ul');
  list.className = 'hero-origin-list';
  const seen = new Set();
  for (const origin of origins) {
    if (!Number.isSafeInteger(origin.productionId) || typeof origin.nameCn !== 'string' || !origin.nameCn.trim()
      || typeof origin.nameKo !== 'string' || !origin.nameKo.trim() || origin.localizationStatus !== 'PROJECT_REVIEWED'
      || Object.keys(origin).sort().join('|') !== ['localizationStatus', 'nameCn', 'nameKo', 'productionId'].sort().join('|')
      || seen.has(origin.productionId)) throw new Error('Generated Hero Production presentation is malformed');
    seen.add(origin.productionId);
    const item = document.createElement('li');
    item.textContent = origin.nameKo + ' (' + origin.nameCn + ')';
    list.append(item);
  }
  section.append(heading, list);
  return section;
}

function makeTalentDescription(raw, star) {
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('Generated Hero Talent description is missing');
  const paragraph = document.createElement('p');
  paragraph.className = 'talent-description';
  const openTag = '<font color="red">';
  const closeTag = '</font>';
  const nextTag = raw.indexOf('<');
  if (nextTag < 0) {
    paragraph.textContent = raw;
    return paragraph;
  }
  let cursor = 0;
  while (cursor < raw.length) {
    const tagAt = raw.indexOf('<', cursor);
    if (tagAt < 0) {
      paragraph.append(document.createTextNode(raw.slice(cursor)));
      break;
    }
    if (tagAt > cursor) paragraph.append(document.createTextNode(raw.slice(cursor, tagAt)));
    if (!raw.startsWith(openTag, tagAt)) {
      paragraph.textContent = raw;
      return paragraph;
    }
    const closeAt = raw.indexOf(closeTag, tagAt + openTag.length);
    if (closeAt < 0 || raw.slice(tagAt + openTag.length, closeAt).includes('<')) {
      paragraph.textContent = raw;
      return paragraph;
    }
    const emphasis = document.createElement('span');
    emphasis.className = 'talent-emphasis';
    emphasis.textContent = raw.slice(tagAt + openTag.length, closeAt);
    paragraph.append(emphasis);
    cursor = closeAt + closeTag.length;
  }
  return paragraph;
}

function makeTalentPresentation(heroId, talent) {
  if (!Number.isSafeInteger(heroId) || !talent || typeof talent.nameKo !== 'string' || !talent.nameKo.trim()
    || !Array.isArray(talent.starDescriptions) || JSON.stringify(talent.starDescriptions.map(({ star }) => star)) !== '[3,4,5,6]') {
    throw new Error('Generated Hero Talent presentation is malformed');
  }
  const section = document.createElement('section');
  section.className = 'hero-talent';
  const heading = document.createElement('h3');
  heading.id = `hero-${heroId}-talent-heading`;
  heading.textContent = 'Talent · 프로젝트 검수 한국어 (공식 표기 미확인)';
  section.setAttribute('aria-labelledby', heading.id);
  const name = document.createElement('p');
  name.className = 'talent-name';
  name.textContent = talent.nameKo;
  const list = document.createElement('ul');
  list.className = 'talent-star-list';
  const sourceDetails = document.createElement('details');
  sourceDetails.className = 'talent-source-original';
  const sourceSummary = document.createElement('summary');
  sourceSummary.textContent = '연결된 Talent Skill 중국어 원문 · ID 기준';
  const sourceList = document.createElement('ul');
  sourceList.className = 'talent-source-list';
  for (const row of talent.starDescriptions) {
    if (!Number.isSafeInteger(row.skillId) || typeof row.nameCn !== 'string' || !row.nameCn.trim()
      || typeof row.descriptionCn !== 'string' || !row.descriptionCn.trim()) {
      throw new Error('Generated Hero Talent Skill source text is malformed');
    }
    const item = document.createElement('li');
    const star = document.createElement('h4');
    star.textContent = `${row.star}성`;
    item.append(star, makeTalentDescription(row.descriptionKoRaw, row.star));
    list.append(item);

    const sourceItem = document.createElement('li');
    const sourceLabel = document.createElement('p');
    sourceLabel.className = 'talent-source-label';
    sourceLabel.textContent = `${row.star}성 · Skill ID ${row.skillId} · ${row.nameCn}`;
    const sourceDescription = document.createElement('p');
    sourceDescription.className = 'talent-source-description';
    appendSkillDescription(sourceDescription, row.descriptionCn);
    sourceItem.append(sourceLabel, sourceDescription);
    sourceList.append(sourceItem);
  }
  sourceDetails.append(sourceSummary, sourceList);
  section.append(heading, name, list, sourceDetails);
  return section;
}

function makeSpJobPresentation(spJobConnections) {
  if (!Array.isArray(spJobConnections)) throw new Error('Generated SP Job presentation data is missing');
  if (spJobConnections.length === 0) return null;
  const section = document.createElement('section');
  section.className = 'sp-job-presentation';
  const list = document.createElement('ul');
  for (const spJob of spJobConnections) {
    const item = document.createElement('li');
    item.textContent = `${spJob.classification} · ${spJob.nameKo} (전직 ID ${spJob.jobId}) · 프로젝트 검수 표시명 · 공식 KR 출처 미확인`;
    list.append(item);
  }
  section.append(list);
  return section;
}

function makeJobConnectionLabel(relation) {
  if (relation.classification === 'SP Job') {
    if (relation.localizationClassification !== 'PROJECT_REVIEWED_LOCALIZATION'
      || relation.officialKrProvenanceStatus !== 'UNVERIFIED') {
      throw new Error(`Malformed SP Job localization status for Job ${relation.jobId}`);
    }
    return `SP Job · ${relation.jobNameKo} (전직 ID ${relation.jobId}) · 프로젝트 검수 표시명 · 공식 KR 출처 미확인`;
  }
  if (relation.classification !== undefined || relation.localizationClassification !== undefined
    || relation.officialKrProvenanceStatus !== undefined) {
    throw new Error(`Unexpected Job classification metadata for Job ${relation.jobId}`);
  }
  return `연결 ${relation.connectionId} → ${relation.jobNameKo} (전직 ID ${relation.jobId})`;
}

function makeJobLevelSourceStatsPresentation(hero) {
  if (hero.jobLevelSourceStats === undefined) return null;
  if (![6, 8].includes(hero.id) || !Array.isArray(hero.jobLevelSourceStats) || hero.jobLevelSourceStats.length !== 25) {
    throw new Error(`Malformed generated raw JobLevel data for Hero ${hero.id}`);
  }
  const section = document.createElement('details');
  section.className = 'job-level-source-stats';
  const summary = document.createElement('summary');
  summary.textContent = 'CN ConfigData 원본 JobLevel 필드 · 최종 전투 능력치 아님';
  const note = document.createElement('p');
  note.className = 'job-level-source-note';
  note.textContent = '고정 CN ConfigData 스냅샷의 필드값을 그대로 표시합니다. 원본 버전 상태는 미확인이고, 전투 능력치 환산·성장 적용이나 나열 순서의 의미는 주장하지 않습니다.';
  section.append(summary, note);

  const rowsByConnection = new Map();
  for (const row of hero.jobLevelSourceStats) {
    const connection = hero.jobConnections.find((candidate) => candidate.connectionId === row.jobConnectionId
      && candidate.jobId === row.jobId);
    if (!connection || !Number.isSafeInteger(row.jobLevelId) || !row.rawStats || typeof row.rawStats !== 'object') {
      throw new Error(`Unresolved generated raw JobLevel endpoint for Hero ${hero.id}`);
    }
    const group = rowsByConnection.get(row.jobConnectionId) ?? { connection, rows: [] };
    group.rows.push(row);
    rowsByConnection.set(row.jobConnectionId, group);
  }
  for (const [connectionId, group] of rowsByConnection) {
    const jobDetails = document.createElement('details');
    const jobSummary = document.createElement('summary');
    jobSummary.textContent = `${group.connection.jobNameKo} · Job ID ${group.connection.jobId} · 연결 ID ${connectionId}`;
    jobDetails.append(jobSummary);
    for (const row of group.rows) {
      const recordDetails = document.createElement('details');
      const recordSummary = document.createElement('summary');
      recordSummary.textContent = `JobLevel ID ${row.jobLevelId} · JobLevelUpHeroLevel=${row.jobLevelUpHeroLevel} · rank_code=${row.rankCode}`;
      const fields = document.createElement('dl');
      fields.className = 'job-level-source-fields';
      for (const [field, value] of Object.entries(row.rawStats)) {
        const term = document.createElement('dt');
        term.textContent = field;
        const description = document.createElement('dd');
        description.textContent = String(value);
        fields.append(term, description);
      }
      recordDetails.append(recordSummary, fields);
      jobDetails.append(recordDetails);
    }
    section.append(jobDetails);
  }
  return section;
}

function makeSkinFullartPresentation(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const section = document.createElement('section');
  section.className = 'hero-skin-fullarts';
  const heading = document.createElement('h3');
  heading.textContent = '스킨 일러스트';
  const list = document.createElement('ul');
  list.className = 'hero-skin-fullart-list';
  list.setAttribute('aria-label', '스킨 일러스트');
  rows.forEach((row, index) => {
    const item = document.createElement('li');
    const image = document.createElement('img');
    image.className = 'hero-skin-fullart';
    image.src = new URL(row.imageUrl, document.baseURI).href;
    image.alt = row.accessibleLabel;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => {
      const status = document.createElement('p');
      status.className = 'hero-skin-fullart-error';
      status.setAttribute('role', 'status');
      status.textContent = `스킨 일러스트 ${index + 1}을 불러오지 못했습니다.`;
      item.replaceChildren(status);
    }, { once: true });
    item.append(image);
    list.append(item);
  });
  section.append(heading, list);
  return section;
}

function addHero(hero, relationsByHero, soldiersById, skinsByHero) {
  const article = document.createElement('article');
  article.className = 'hero-card';
  article.id = `hero-${hero.id}`;

  const image = typeof hero.portrait === 'string' && hero.portrait.length > 0
    ? document.createElement('img')
    : null;
  if (image) {
    image.className = 'hero-portrait';
    image.src = new URL(hero.portrait, document.baseURI).href;
    image.alt = `${hero.nameKo} 초상화`;
    image.loading = 'lazy';
  }

  const details = document.createElement('div');
  details.className = 'hero-details';
  const name = document.createElement('h2');
  name.textContent = hero.nameKo;
  const id = document.createElement('p');
  id.className = 'hero-id';
  id.textContent = `영웅 ID ${hero.id}`;
  const metadata = document.createElement('div');
  metadata.className = 'hero-metadata';
  metadata.append(id, makeHeroRarityLabel(hero.rarity));

  details.append(name, metadata);
  const connections = document.createElement('ul');
  connections.className = 'job-connections';
  connections.setAttribute('aria-label', `${hero.nameKo}의 전직 연결과 한국어 표시명`);
  for (const relation of hero.jobConnections) {
    const item = document.createElement('li');
    item.textContent = makeJobConnectionLabel(relation);
    connections.append(item);
  }
  const jobLevelSourceStats = makeJobLevelSourceStatsPresentation(hero);
  if (image) article.append(image);
  article.append(details);
  const skinPresentation = makeSkinFullartPresentation(skinsByHero.get(hero.id) ?? []);
  if (skinPresentation) article.append(skinPresentation);
  article.append(makeFactionPresentation(hero.factions));
  article.append(makeOriginPresentation(hero.origins));
  if (hero.talent) article.append(makeTalentPresentation(hero.id, hero.talent));
  article.append(connections);
  if (jobLevelSourceStats) article.append(jobLevelSourceStats);
  const spJobPresentation = makeSpJobPresentation(hero.spJobConnections);
  if (spJobPresentation) article.append(spJobPresentation);
  const exclusive = document.createElement('section');
  exclusive.className = 'exclusive-equipment';
  const exclusiveHeading = document.createElement('h3');
  exclusiveHeading.id = `hero-${hero.id}-exclusive-heading`;
  exclusiveHeading.textContent = '전용 장비';
  exclusive.setAttribute('aria-labelledby', exclusiveHeading.id);
  const equipmentName = document.createElement('p');
  equipmentName.className = 'exclusive-equipment-name';
  equipmentName.textContent = hero.exclusiveEquipment.equipmentNameKo;
  const equipmentLink = makeAnchor(
    `Equipment ID ${hero.exclusiveEquipment.equipmentId} 장비로 이동`,
    `equipment-${hero.exclusiveEquipment.equipmentId}`,
    () => exclusiveEquipmentNavigation?.showAll(false),
  );
  equipmentLink.className = 'equipment-navigation-link';
  const effect = document.createElement('p');
  effect.className = 'exclusive-equipment-effect';
  effect.textContent = hero.exclusiveEquipment.effectDescriptionKo;
  exclusive.append(exclusiveHeading, equipmentName, equipmentLink, effect);
  article.append(exclusive);

  const soldierIds = relationsByHero.get(hero.id);
  if (soldierIds?.length) {
    const section = document.createElement('section');
    section.className = 'hero-soldiers';
    const heading = document.createElement('h3');
    heading.id = `hero-${hero.id}-soldiers-heading`;
    heading.textContent = '용병';
    section.setAttribute('aria-labelledby', heading.id);
    const list = document.createElement('ul');
    list.className = 'hero-soldier-list';
    for (const soldierId of soldierIds) {
      const soldier = soldiersById.get(soldierId);
      if (!soldier) throw new Error(`Unresolved Soldier presentation ID ${soldierId}`);
      if (!['NORMAL', 'SP'].includes(soldier.namespace)) {
        throw new Error(`Unsupported Soldier namespace for Hero ${hero.id}, Soldier ${soldierId}`);
      }
      const item = document.createElement('li');
      const soldierLink = makeAnchor(`${soldier.namespace} · ${soldier.nameKo}`, soldier.domId, () => {
        const navigation = soldier.namespace === 'NORMAL' ? normalSoldierNavigation : spSoldierNavigation;
        navigation?.showAll(false);
      });
      soldierLink.className = 'soldier-navigation-link';
      item.append(soldierLink);
      list.append(item);
    }
    section.append(heading, list);
    article.append(section);
  }
  container.append(article);
}

try {
  const [heroResponse, relationResponse, normalResponse, spResponse, skinResponse, skinAssetResponse] = await Promise.all([
    fetch('./generated/hero-slice.v1.json'),
    fetch('./generated/hero-soldier-relations.v1.json'),
    fetch('./generated/normal-soldiers.v1.json'),
    fetch('./generated/sp-soldiers.v1.json'),
    fetch('./generated/skin-consumer-public-m05-g.v1.json'),
    fetch('./generated/skin-assets-public-m05-g.v1.json'),
  ]);
  for (const response of [heroResponse, relationResponse, normalResponse, spResponse, skinResponse, skinAssetResponse]) {
    if (!response.ok) throw new Error(`Generated presentation request failed (${response.status})`);
  }
  const [data, relationData, normalData, spData, skinConsumer, skinPublicAssets] = await Promise.all([
    heroResponse.json(), relationResponse.json(), normalResponse.json(), spResponse.json(), skinResponse.json(), skinAssetResponse.json(),
  ]);
  if (data.schemaVersion !== 1 || !Array.isArray(data.heroes)) throw new Error('Unsupported generated Hero data');
  heroIndexDetailIds = new Set(data.heroes.map(({ id }) => id));
  if (data.heroes.some((hero) => typeof hero.nameKo !== 'string' || !hero.nameKo)) throw new Error('Generated Hero Korean display label is missing');
  if (data.heroes.some((hero) => !Number.isSafeInteger(hero.rarity?.rankId) || typeof hero.rarity.label !== 'string' || !hero.rarity.label.trim())) throw new Error('Generated Hero rarity is missing');
  if (data.heroes.some((hero) => !Array.isArray(hero.factions) || hero.factions.length === 0)) throw new Error('Generated Hero Faction presentation is missing');
  if (data.heroes.some((hero) => !Array.isArray(hero.origins) || hero.origins.length === 0)) throw new Error('Generated Hero Production presentation is missing');
  if (relationData.schemaVersion !== 1 || !Array.isArray(relationData.relations)) throw new Error('Unsupported Hero–Soldier relation data');
  if (normalData.schemaVersion !== 1 || !Array.isArray(normalData.soldiers)
    || spData.schemaVersion !== 1 || !Array.isArray(spData.soldiers)) throw new Error('Unsupported generated Soldier data');

  const soldiersById = new Map();
  for (const soldier of normalData.soldiers) {
    if (!Number.isInteger(soldier.normalSoldierId) || typeof soldier.nameKo !== 'string' || !soldier.nameKo
      || soldiersById.has(soldier.normalSoldierId)) throw new Error('Malformed or duplicate NORMAL Soldier presentation ID');
    soldiersById.set(soldier.normalSoldierId, {
      nameKo: soldier.nameKo,
      domId: `normal-soldier-${soldier.normalSoldierId}`,
      namespace: 'NORMAL',
    });
  }
  for (const soldier of spData.soldiers) {
    if (!Number.isInteger(soldier.spSoldierId) || typeof soldier.nameKo !== 'string' || !soldier.nameKo
      || soldiersById.has(soldier.spSoldierId)) throw new Error('Malformed or duplicate SP Soldier presentation ID');
    soldiersById.set(soldier.spSoldierId, {
      nameKo: soldier.nameKo,
      domId: `sp-soldier-${soldier.spSoldierId}`,
      namespace: 'SP',
    });
  }

  const relationsByHero = new Map();
  const seenPairs = new Set();
  for (const relation of relationData.relations) {
    if (!Number.isInteger(relation.heroId) || !Number.isInteger(relation.soldierId)) throw new Error('Malformed Hero–Soldier relation endpoint');
    const pairKey = `${relation.heroId}:${relation.soldierId}`;
    if (seenPairs.has(pairKey)) throw new Error(`Duplicate Hero–Soldier relation ${pairKey}`);
    seenPairs.add(pairKey);
    if (!soldiersById.has(relation.soldierId)) throw new Error(`Unresolved Soldier presentation ID ${relation.soldierId}`);
    const soldierIds = relationsByHero.get(relation.heroId) ?? [];
    soldierIds.push(relation.soldierId);
    relationsByHero.set(relation.heroId, soldierIds);
  }
  const heroIds = new Set(data.heroes.map((hero) => hero.id));
  if (data.heroes.some((hero) => !Number.isInteger(hero.id)) || [...relationsByHero.keys()].some((heroId) => !heroIds.has(heroId))) {
    throw new Error('Hero–Soldier relation references an unavailable Hero presentation');
  }
  container.replaceChildren();
  heroBySoldierId = new Map();
  for (const [heroId, soldierIds] of relationsByHero) {
    for (const soldierId of soldierIds) {
      const heroIdsForSoldier = heroBySoldierId.get(soldierId) ?? [];
      heroIdsForSoldier.push(heroId);
      heroBySoldierId.set(soldierId, heroIdsForSoldier);
    }
  }
  const skinsByHero = new Map();
  for (const hero of data.heroes) {
    const rows = selectSkinFullarts(skinConsumer, hero.id, skinPublicAssets);
    if (rows.length) skinsByHero.set(hero.id, rows);
  }
  for (const hero of data.heroes) addHero(hero, relationsByHero, soldiersById, skinsByHero);
  heroNavigation = renderHeroSearch({
    heroes: data.heroes, input: heroSearch, clearButton: heroSearchClear,
    factionFilter: heroFactionFilter, count: heroSearchCount, emptyState: heroSearchEmpty,
  });
  revealInitialHeroFragment();
} catch (error) {
  const status = document.createElement('p');
  status.className = 'status status-error';
  status.textContent = '영웅 정보를 불러오지 못했습니다.';
  container.replaceChildren(status);
  console.error(error);
}

try {
  const [response, talentResponse] = await Promise.all([
    fetch('./generated/hero-minimal-detail.v1.json'),
    fetch('./generated/hero-15-talent-public.v1.json'),
  ]);
  if (!response.ok) throw new Error(`Generated Hero 15 minimal detail request failed (${response.status})`);
  if (!talentResponse.ok) throw new Error(`Generated Hero 15 Talent request failed (${talentResponse.status})`);
  const [data, talentData] = await Promise.all([response.json(), talentResponse.json()]);
  hero15MinimalDetailIds = new Set(data.heroes?.map(({ heroId }) => heroId) ?? []);
  if (hero15MinimalDetailIds.size !== 1 || !hero15MinimalDetailIds.has(15)) throw new Error('Hero Minimal Detail publication scope must contain only Hero 15');
  hero15MinimalDetailNavigation = renderHero15MinimalDetailView(data, talentData, hero15MinimalDetailContainer);
} catch (error) {
  const status = document.createElement('p');
  status.className = 'status status-error';
  status.textContent = '영웅 최소 상세 정보를 불러오지 못했습니다.';
  hero15MinimalDetailContainer.replaceChildren(status);
  console.error(error);
}

try {
  const response = await fetch('./generated/hero-minimal-detail-16.v1.json');
  if (!response.ok) throw new Error(`Generated Hero 16 minimal detail request failed (${response.status})`);
  const data = await response.json();
  hero16MinimalDetailIds = new Set(data.heroes?.map(({ heroId }) => heroId) ?? []);
  if (hero16MinimalDetailIds.size !== 1 || !hero16MinimalDetailIds.has(16)) throw new Error('Hero Minimal Detail publication scope must contain only Hero 16');
  hero16MinimalDetailNavigation = renderHero16MinimalDetailView(data, hero16MinimalDetailContainer);
} catch (error) {
  const status = document.createElement('p');
  status.className = 'status status-error';
  status.textContent = '영웅 최소 상세 정보를 불러오지 못했습니다.';
  hero16MinimalDetailContainer.replaceChildren(status);
  console.error(error);
}

try {
  const response = await fetch('./generated/hero-minimal-detail-batch-17-18-20-21-30.v1.json');
  if (!response.ok) throw new Error(`Generated Minimal Detail batch request failed (${response.status})`);
  const data = await response.json();
  const expected = new Map([
    [17, ['에그베르트', 405, '플레임 코트']], [18, ['이멜다', 276, '매혹의 립스틱']],
    [20, ['소니아', 281, '검은 서광']], [21, ['발가스', 441, '염룡의 휘광']], [30, ['리파니', 286, '요정의 날개']],
  ]);
  if (data?.schemaVersion !== 1 || !Array.isArray(data.heroes) || data.heroes.length !== expected.size) throw new Error('Unsupported Minimal Detail batch publication scope');
  heroMinimalDetailBatchNavigation = new Map();
  for (const hero of data.heroes) {
    const [nameKo, equipmentId, equipmentNameKo] = expected.get(hero.heroId) ?? [];
    if (!nameKo || hero.nameKo !== nameKo || hero.exclusiveEquipment?.equipmentId !== equipmentId || hero.exclusiveEquipment?.nameKo !== equipmentNameKo
      || Object.keys(hero).sort().join(',') !== 'exclusiveEquipment,heroId,nameKo'
      || Object.keys(hero.exclusiveEquipment ?? {}).sort().join(',') !== 'effectDescriptionKo,equipmentId,nameKo'
      || !hero.exclusiveEquipment.effectDescriptionKo?.trim() || heroMinimalDetailBatchNavigation.has(hero.heroId)) throw new Error('Malformed or out-of-scope Minimal Detail batch record');
    const target = renderHeroMinimalDetailView({ schemaVersion: 1, heroes: [hero] }, heroMinimalDetailBatchContainers.get(hero.heroId), { heroId: hero.heroId, nameKo, equipmentId, equipmentNameKo });
    heroMinimalDetailBatchNavigation.set(hero.heroId, target);
  }
  heroMinimalDetailBatchIds = new Set(heroMinimalDetailBatchNavigation.keys());
  if (JSON.stringify([...heroMinimalDetailBatchIds]) !== JSON.stringify([17, 18, 20, 21, 30])) throw new Error('Minimal Detail batch IDs do not match the approved exact population');
} catch (error) {
  for (const container of heroMinimalDetailBatchContainers.values()) {
    const status = document.createElement('p');
    status.className = 'status status-error';
    status.textContent = '영웅 최소 상세 정보를 불러오지 못했습니다.';
    container.replaceChildren(status);
  }
  heroMinimalDetailBatchNavigation = new Map();
  heroMinimalDetailBatchIds = new Set();
  console.error(error);
}

let heroMinimalDetailTenBatchIds = new Set();
try {
  const response = await fetch('./generated/hero-minimal-detail-batch-31-34-35-36-38-39-49-51-54-57.v1.json');
  if (!response.ok) throw new Error(`Generated ten-Hero Minimal Detail batch request failed (${response.status})`);
  const data = await response.json();
  const expected = new Map([[31,['소피아',434,'성광의 베일']],[34,['키리카제',297,'삿갓']],[35,['안젤리카',425,'만능 공구 모자']],[36,['실버울프',414,'의적의 가면']],[38,['제리올&레이라',455,'나의 수호자']],[39,['페라키아',411,'악몽의 속삭임']],[49,['파나',429,'스칼렛 윈드']],[51,['셀파닐',293,'카콘시스의 왕관']],[54,['리스틸',490,'마혈의 투구']],[57,['윌러',472,'은하 제독']]]);
  if (data?.schemaVersion !== 1 || !Array.isArray(data.heroes) || data.heroes.length !== expected.size) throw new Error('Unsupported ten-Hero Minimal Detail batch publication scope');
  const navigation = new Map();
  for (const hero of data.heroes) {
    const [nameKo, equipmentId, equipmentNameKo] = expected.get(hero.heroId) ?? [];
    if (!nameKo || hero.nameKo !== nameKo || hero.exclusiveEquipment?.equipmentId !== equipmentId || hero.exclusiveEquipment?.nameKo !== equipmentNameKo
      || Object.keys(hero).sort().join(',') !== 'exclusiveEquipment,heroId,nameKo'
      || Object.keys(hero.exclusiveEquipment ?? {}).sort().join(',') !== 'effectDescriptionKo,equipmentId,nameKo' || !hero.exclusiveEquipment.effectDescriptionKo?.trim() || navigation.has(hero.heroId)) throw new Error('Malformed or out-of-scope ten-Hero Minimal Detail record');
    navigation.set(hero.heroId, renderHeroMinimalDetailView({ schemaVersion: 1, heroes: [hero] }, heroMinimalDetailTenBatchContainers.get(hero.heroId), { heroId: hero.heroId, nameKo, equipmentId, equipmentNameKo }));
  }
  heroMinimalDetailTenBatchNavigation = navigation;
  heroMinimalDetailTenBatchIds = new Set(navigation.keys());
  if (JSON.stringify([...heroMinimalDetailTenBatchIds]) !== JSON.stringify([...expected.keys()])) throw new Error('Ten-Hero Minimal Detail IDs do not match the approved exact population');
} catch (error) {
  for (const container of heroMinimalDetailTenBatchContainers.values()) { const status = document.createElement('p'); status.className = 'status status-error'; status.textContent = '영웅 최소 상세 정보를 불러오지 못했습니다.'; container.replaceChildren(status); }
  heroMinimalDetailTenBatchNavigation = new Map(); heroMinimalDetailTenBatchIds = new Set(); console.error(error);
}

try {
  const response = await fetch('./generated/hero-minimal-detail-batch-58-59-61-62-63-64-65-66-87-88-91-92-93-94-95-96-97-98-99-100.v1.json');
  if (!response.ok) throw new Error(`Generated twenty-Hero Minimal Detail batch request failed (${response.status})`);
  const data = await response.json();
  const expected = new Map([[58,['세레나',423,'여명의 수호자']],[59,['기자로프',424,'파멸과 창조의 지팡이']],[61,['람다',413,'세계수의 꽃']],[62,['알프레드',427,'오션즈 하트']],[63,['레인폴스',452,'크림조의 심장']],[64,['브렌다',439,'아득한 달의 기억']],[65,['비라쥬',437,'크림조 아머']],[66,['클라렛',464,'칼자스의 군신']],[87,['베티',435,'파멸의 샛별']],[88,['엘라스타',417,'바람을 싣는 날개']],[91,['에밀리아',453,'영광의 전승']],[92,['환생 제시카',426,'신탁을 받은 자']],[93,['미지의 기사',479,'수호의 맹세']],[94,['아카야',440,'성령의 손길']],[95,['올리버',438,'위대한 왕의 증표']],[96,['멜파니',460,'활기찬 소환사']],[97,['일루시아',448,'그 여름의 기억']],[98,['빈센트',476,'타락한 날개']],[99,['클로테르',540,'영원한 불꽃의 맹세']],[100,['로젠실',549,'순백의 면사포']]]);
  if (data?.schemaVersion !== 1 || !Array.isArray(data.heroes) || data.heroes.length !== expected.size) throw new Error('Unsupported twenty-Hero Minimal Detail batch publication scope');
  const navigation = new Map();
  for (const hero of data.heroes) {
    const [nameKo, equipmentId, equipmentNameKo] = expected.get(hero.heroId) ?? [];
    if (!nameKo || hero.nameKo !== nameKo || hero.exclusiveEquipment?.equipmentId !== equipmentId || hero.exclusiveEquipment?.nameKo !== equipmentNameKo
      || Object.keys(hero).sort().join(',') !== 'exclusiveEquipment,heroId,nameKo'
      || Object.keys(hero.exclusiveEquipment ?? {}).sort().join(',') !== 'effectDescriptionKo,equipmentId,nameKo' || !hero.exclusiveEquipment.effectDescriptionKo?.trim() || navigation.has(hero.heroId)) throw new Error('Malformed or out-of-scope twenty-Hero Minimal Detail record');
    navigation.set(hero.heroId, renderHeroMinimalDetailView({ schemaVersion: 1, heroes: [hero] }, heroMinimalDetailTwentyBatchContainers.get(hero.heroId), { heroId: hero.heroId, nameKo, equipmentId, equipmentNameKo }));
  }
  heroMinimalDetailTwentyBatchNavigation = navigation;
  heroMinimalDetailTwentyBatchIds = new Set(navigation.keys());
  if (JSON.stringify([...heroMinimalDetailTwentyBatchIds]) !== JSON.stringify([...expected.keys()])) throw new Error('Twenty-Hero Minimal Detail IDs do not match the approved exact population');
} catch (error) {
  for (const container of heroMinimalDetailTwentyBatchContainers.values()) { const status = document.createElement('p'); status.className = 'status status-error'; status.textContent = '영웅 최소 상세 정보를 불러오지 못했습니다.'; container.replaceChildren(status); }
  heroMinimalDetailTwentyBatchNavigation = new Map(); heroMinimalDetailTwentyBatchIds = new Set(); console.error(error);
}

try {
  const response = await fetch('./generated/hero-minimal-detail-thirty-batch.v1.json');
  if (!response.ok) throw new Error(`Generated thirty-Hero Minimal Detail batch request failed (${response.status})`);
  const data = await response.json();
  const expected = new Map([[101,['헬레나',463,'황금 수정의 갑옷']],[102,['세계수의 현자',477,'낡은 두건']],[103,['실린카',451,'역날개의 가면']],[104,['알파',508,'개조된 신체 αEX']],[105,['뮤',497,'만개의 월계관']],[106,['입실론',487,'소멸 · 개']],[108,['사신 크루거',499,'사기꾼의 가면']],[109,['화이트 시시',489,'비즈니스 마인드']],[110,['아레스',475,'자경단의 투구']],[111,['마이야',449,'치명적인 빗자루']],[112,['토와',501,'스피릿 비전 고글']],[113,['탄생의 빛',507,'전생의 글귀']],[114,['마리엘',485,'저스티스 플레일']],[115,['로자리아',478,'세인트 소드']],[116,['노에미',461,'기발한 모자']],[118,['오토크라트 4세',496,'금단의 황실 갑옷']],[119,['루크레치아',526,'면죄의 모자']],[120,['플로렌티아',473,'제국의 보배']],[121,['츠바메',454,'숨겨진 별의 투구']],[122,['힐다',502,'선홍색 무장']],[123,['베르너',486,'기동 폭발검']],[124,['크리스티아네',519,'깃털 장식 모자']],[125,['리코리스',467,'어린 왕']],[126,['팟시르',484,'심취의 베일']],[127,['레나타',450,'드래곤 크레스트']],[129,['구스타프',520,'머나먼 메아리']],[130,['미셸',512,'마도 과학 무장']],[99161,['크림조의 왕',495,'월식 갑옷']],[99162,['수제트',498,'빛의 심판자']],[99163,['초월자',500,'무한한 고리']]]);
  if (data?.schemaVersion !== 1 || !Array.isArray(data.heroes) || data.heroes.length !== expected.size) throw new Error('Unsupported thirty-Hero Minimal Detail batch publication scope');
  const navigation = new Map();
  for (const hero of data.heroes) {
    const [nameKo, equipmentId, equipmentNameKo] = expected.get(hero.heroId) ?? [];
    if (!nameKo || hero.nameKo !== nameKo || hero.exclusiveEquipment?.equipmentId !== equipmentId || hero.exclusiveEquipment?.nameKo !== equipmentNameKo
      || Object.keys(hero).sort().join(',') !== 'exclusiveEquipment,heroId,nameKo'
      || Object.keys(hero.exclusiveEquipment ?? {}).sort().join(',') !== 'effectDescriptionKo,equipmentId,nameKo' || !hero.exclusiveEquipment.effectDescriptionKo?.trim() || navigation.has(hero.heroId)) throw new Error('Malformed or out-of-scope thirty-Hero Minimal Detail record');
    navigation.set(hero.heroId, renderHeroMinimalDetailView({ schemaVersion: 1, heroes: [hero] }, heroMinimalDetailThirtyBatchContainers.get(hero.heroId), { heroId: hero.heroId, nameKo, equipmentId, equipmentNameKo }));
  }
  heroMinimalDetailThirtyBatchNavigation = navigation;
  heroMinimalDetailThirtyBatchIds = new Set(navigation.keys());
  if (JSON.stringify([...heroMinimalDetailThirtyBatchIds]) !== JSON.stringify([...expected.keys()])) throw new Error('Thirty-Hero Minimal Detail IDs do not match the approved exact population');
} catch (error) {
  for (const container of heroMinimalDetailThirtyBatchContainers.values()) { const status = document.createElement('p'); status.className = 'status status-error'; status.textContent = '영웅 최소 상세 정보를 불러오지 못했습니다.'; container.replaceChildren(status); }
  heroMinimalDetailThirtyBatchNavigation = new Map(); heroMinimalDetailThirtyBatchIds = new Set(); console.error(error);
}


try {
  const response = await fetch('./generated/hero-minimal-detail-thirty-one-batch.v1.json');
  if (!response.ok) throw new Error(`Generated thirty-one-Hero Minimal Detail batch request failed (${response.status})`);
  const data = await response.json();
  const expected = new Map([[99164,["베르너 폰 에길",534,"은빛 바람의 망토"]],[99165,["마리안델",510,"세계수의 꽃웃음"]],[99166,["웨탐",539,"악마 우두머리"]],[99167,["리사",511,"유령 대장"]],[99168,["엘마",537,"경건한 축하"]],[99169,["켈티스",509,"초혼의 모자"]],[99170,["로비나 대제",513,"호령의 칼날"]],[99171,["방주의 성녀",514,"여명의 왕관"]],[99172,["크림조의 집정관",524,"우주전함의 결의"]],[99173,["아이언 챈슬러",538,"검붉은 의지"]],[99174,["아즈사",533,"낭월청진"]],[99175,["오보로",536,"영혼이 깃든 법상"]],[99176,["캐롤리안",521,"역행의 투구"]],[99177,["카구야",523,"꿈의 달빛"]],[99178,["아사멜",532,"타오르는 북극성"]],[99179,["로스탐",547,"뜨거운 모래바람"]],[99180,["방랑투사",525,"방랑의 상처"]],[99181,["줄리안",551,"처형자의 침묵"]],[99182,["리키",531,"진정한 영웅"]],[99183,["마크렌",550,"메카파츠"]],[99184,["빛의 수호사도",559,"잿불의 수호"]],[99185,["아단켈모",560,"아득한 수수께끼"]],[99186,["빛과 그림자 검의 영혼",568,"엇갈린 숙명"]],[99187,["껍질 소녀",548,"소스 코어"]],[99188,["리오벡",546,"세월의 연못"]],[99189,["시엔",545,"도사리는 어둠"]],[99190,["폴리알",569,"선령의 속삭임"]],[99191,["루그너",552,"신자의 면류관"]],[99192,["그렌실",570,"겨울 서리의 오만"]],[99193,["요아&코니",557,"Y자 비주얼 디바이스"]],[99197,["각성자",603,"최후의 시선"]]]);
  if (data?.schemaVersion !== 1 || !Array.isArray(data.heroes) || data.heroes.length !== expected.size) throw new Error('Unsupported thirty-one-Hero Minimal Detail batch publication scope');
  const navigation = new Map();
  for (const hero of data.heroes) {
    const [nameKo, equipmentId, equipmentNameKo] = expected.get(hero.heroId) ?? [];
    if (!nameKo || hero.nameKo !== nameKo || hero.exclusiveEquipment?.equipmentId !== equipmentId || hero.exclusiveEquipment?.nameKo !== equipmentNameKo
      || Object.keys(hero).sort().join(',') !== 'exclusiveEquipment,heroId,nameKo'
      || Object.keys(hero.exclusiveEquipment ?? {}).sort().join(',') !== 'effectDescriptionKo,equipmentId,nameKo' || !hero.exclusiveEquipment.effectDescriptionKo?.trim() || navigation.has(hero.heroId)) throw new Error('Malformed or out-of-scope thirty-one-Hero Minimal Detail record');
    navigation.set(hero.heroId, renderHeroMinimalDetailView({ schemaVersion: 1, heroes: [hero] }, heroMinimalDetailThirtyOneBatchContainers.get(hero.heroId), { heroId: hero.heroId, nameKo, equipmentId, equipmentNameKo }));
  }
  heroMinimalDetailThirtyOneBatchNavigation = navigation;
  heroMinimalDetailThirtyOneBatchIds = new Set(navigation.keys());
  if (JSON.stringify([...heroMinimalDetailThirtyOneBatchIds]) !== JSON.stringify([...expected.keys()])) throw new Error('Thirty-One-Hero Minimal Detail IDs do not match the approved exact population');
} catch (error) {
  for (const container of heroMinimalDetailThirtyOneBatchContainers.values()) { const status = document.createElement('p'); status.className = 'status status-error'; status.textContent = '영웅 최소 상세 정보를 불러오지 못했습니다.'; container.replaceChildren(status); }
  heroMinimalDetailThirtyOneBatchNavigation = new Map(); heroMinimalDetailThirtyOneBatchIds = new Set(); console.error(error);
}


try {
  const response = await fetch('./generated/hero-minimal-detail-forty-batch.v1.json');
  if (!response.ok) throw new Error(`Generated forty-Hero Minimal Detail batch request failed (${response.status})`);
  const data = await response.json();
  const expected = new Map([[99198,['아마데우스',558,'반짝이는 가시창']],[99199,['사그니',562,'겨울의 제사 로브']],[99203,['님프',567,'먼 바다의 조가비']],[99204,['타탈리아',561,'징벌의 협객']],[99205,['투어밀크',572,'침묵의 고백']],[99206,['이리스',571,'극야의 열쇠']],[99207,['롤랑',578,'새벽빛의 비밀']],[99208,['프레시아',573,'순차의 빛']],[99212,['강신자',580,'심연의 계시']],[99213,['캡틴 잭',579,'검은 고양이 선장 모자']],[99214,['네미아',582,'기원 탐구의 길']],[99215,['안드리올',604,'황제가 내린 훈장']],[99216,['에쉬앤',612,'페가수스의 광휘']],[99217,['호프만',581,'녹과 영광']],[99218,['이졸데',619,'잊혀진 전설']],[99219,['제이스',589,'새벽 바람']],[99220,['패트리샤',588,'붉은 숨결']],[99221,['군',587,'산행의 망토']],[99225,['빙설 심연의 지배자',643,'빙룡의 서리 왕관']],[99226,['테란틸',595,'초대 왕의 후손']],[99227,['타브리스',590,'암흑 날개 투구']],[99228,['이미르',620,'잃어버린 여명']],[99229,['셀리카',628,'연금의 법칙']],[99230,['세라피나',596,'칼날의 포옹']],[99231,['비리아',614,'섬의 예절']],[99233,['시온',597,'운명의 왕검']],[99234,['티아나',598,'고독한 기사의 결의']],[99238,['아리아',605,'축복의 달']],[99239,['이리아',636,'영력의 비단 왕관']],[99240,['사프린',613,'엘프의 새싹']],[99241,['노노린',606,'파도의 메아리']],[99243,['날개 꺾인 새',627,'부러진 깃털의 잔상']],[99244,['란델',611,'꿈의 망토']],[99249,['마카엘라',622,'마지막 알현']],[99250,['샘',621,'베오프의 비극']],[99252,['루크만',635,'수호의 칼날']],[99253,['아브샤이트',629,'신의 인형의 족쇄']],[99254,['레이아',637,'지혜의 날개 왕관']],[99255,['엘비스',634,'암흑 날개의 부활']],[99259,['레이피어',638,'신제국의 대검']]]);
  if (data?.schemaVersion !== 1 || !Array.isArray(data.heroes) || data.heroes.length !== expected.size) throw new Error('Unsupported forty-Hero Minimal Detail batch publication scope');
  const navigation = new Map();
  for (const hero of data.heroes) {
    const [nameKo, equipmentId, equipmentNameKo] = expected.get(hero.heroId) ?? [];
    if (!nameKo || hero.nameKo !== nameKo || hero.exclusiveEquipment?.equipmentId !== equipmentId || hero.exclusiveEquipment?.nameKo !== equipmentNameKo
      || Object.keys(hero).sort().join(',') !== 'exclusiveEquipment,heroId,nameKo'
      || Object.keys(hero.exclusiveEquipment ?? {}).sort().join(',') !== 'effectDescriptionKo,equipmentId,nameKo' || !hero.exclusiveEquipment.effectDescriptionKo?.trim() || navigation.has(hero.heroId)) throw new Error('Malformed or out-of-scope forty-Hero Minimal Detail record');
    navigation.set(hero.heroId, renderHeroMinimalDetailView({ schemaVersion: 1, heroes: [hero] }, heroMinimalDetailFortyBatchContainers.get(hero.heroId), { heroId: hero.heroId, nameKo, equipmentId, equipmentNameKo }));
  }
  heroMinimalDetailFortyBatchNavigation = navigation;
  heroMinimalDetailFortyBatchIds = new Set(navigation.keys());
  if (JSON.stringify([...heroMinimalDetailFortyBatchIds]) !== JSON.stringify([...expected.keys()])) throw new Error('Forty-Hero Minimal Detail IDs do not match the approved exact population');
} catch (error) {
  for (const container of heroMinimalDetailFortyBatchContainers.values()) { const status = document.createElement('p'); status.className = 'status status-error'; status.textContent = '영웅 최소 상세 정보를 불러오지 못했습니다.'; container.replaceChildren(status); }
  heroMinimalDetailFortyBatchNavigation = new Map(); heroMinimalDetailFortyBatchIds = new Set(); console.error(error);
}

const minimalDetailHeroIds = new Set([...hero15MinimalDetailIds, ...hero16MinimalDetailIds, ...heroMinimalDetailBatchIds, ...heroMinimalDetailTenBatchIds, ...heroMinimalDetailTwentyBatchIds, ...heroMinimalDetailThirtyBatchIds, ...heroMinimalDetailThirtyOneBatchIds, ...heroMinimalDetailFortyBatchIds]);
const showMinimalDetailTarget = (heroId) => heroId === 15
  ? hero15MinimalDetailNavigation?.showTarget(heroId)
  : heroId === 16 ? hero16MinimalDetailNavigation?.showTarget(heroId)
    : heroMinimalDetailBatchNavigation.get(heroId)?.showTarget(heroId) ?? heroMinimalDetailTenBatchNavigation.get(heroId)?.showTarget(heroId) ?? heroMinimalDetailTwentyBatchNavigation.get(heroId)?.showTarget(heroId) ?? heroMinimalDetailThirtyBatchNavigation.get(heroId)?.showTarget(heroId) ?? heroMinimalDetailThirtyOneBatchNavigation.get(heroId)?.showTarget(heroId) ?? heroMinimalDetailFortyBatchNavigation.get(heroId)?.showTarget(heroId) ?? false;

try {
  const response = await fetch('./generated/hero-index.v1.json');
  if (!response.ok) throw new Error(`Generated Hero Index request failed (${response.status})`);
  const data = await response.json();
  if (data.schemaVersion !== 1 || !Array.isArray(data.heroes) || data.heroes.length !== 267) {
    throw new Error('Unsupported generated Hero Index data');
  }
  const seen = new Set();
  for (const hero of data.heroes) {
    if (Object.keys(hero).sort().join(',') !== 'heroId,nameKo'
      || !Number.isSafeInteger(hero.heroId) || typeof hero.nameKo !== 'string' || !hero.nameKo.trim()
      || seen.has(hero.heroId)) throw new Error('Malformed or duplicate generated Hero Index row');
    seen.add(hero.heroId);
  }
  heroIndexNavigation = renderHeroIndexSearch({
    heroes: data.heroes, detailHeroIds: heroIndexDetailIds, minimalDetailHeroIds,
    input: heroIndexSearch, detailFilter: heroIndexDetailFilter, clearButton: heroIndexSearchClear,
    count: heroIndexSearchCount, emptyState: heroIndexSearchEmpty, container: heroIndexContainer,
    showDetailTarget: (heroId) => heroNavigation?.showTarget(heroId),
    showMinimalDetailTarget,
  });
} catch (error) {
  const status = document.createElement('p');
  status.className = 'status status-error';
  status.textContent = '영웅 전체 목록을 불러오지 못했습니다.';
  heroIndexContainer.replaceChildren(status);
  console.error(error);
}

try {
  const response = await fetch('./generated/job-glossary.v1.json');
  if (!response.ok) throw new Error(`Generated Job glossary request failed (${response.status})`);
  const data = await response.json();
  if (data.schemaVersion !== 1 || !Array.isArray(data.jobs)) throw new Error('Unsupported Job glossary data');
  const rows = data.jobs.map((job) => {
    const row = document.createElement('tr');
    const id = document.createElement('td');
    id.className = 'job-glossary-id';
    id.textContent = String(job.jobId);
    const name = document.createElement('td');
    name.textContent = job.nameKo;
    row.append(id, name);
    return row;
  });
  jobGlossaryContainer.replaceChildren(...rows);
} catch (error) {
  const row = document.createElement('tr');
  const status = document.createElement('td');
  status.colSpan = 2;
  status.className = 'status status-error';
  status.textContent = '전직명 사전을 불러오지 못했습니다.';
  row.append(status);
  jobGlossaryContainer.replaceChildren(row);
  console.error(error);
}

function addGeneralEquipment(item) {
  const article = document.createElement('article');
  article.className = 'general-equipment-card';
  const heading = document.createElement('div');
  heading.className = 'general-equipment-heading';
  const name = document.createElement('h3');
  name.textContent = item.nameKo;
  const id = document.createElement('p');
  id.className = 'general-equipment-id';
  id.textContent = 'Equipment ID ' + item.equipmentId;
  heading.append(name, id);
  const effect = document.createElement('p');
  effect.className = 'general-equipment-effect';
  effect.textContent = item.effectDescriptionKo.replace(/\\n/g, '\n');
  article.append(heading, effect);
  generalEquipmentContainer.append(article);
}

function filterEquipment(equipment, query) {
  const term = query.trim();
  if (!term) return equipment;
  if (/^\d+$/.test(term)) return equipment.filter((item) => String(item.equipmentId) === term);
  const nameQuery = term.toLocaleLowerCase('ko-KR');
  return equipment.filter((item) => item.nameKo.toLocaleLowerCase('ko-KR').includes(nameQuery));
}

function renderEquipmentSearch({ equipment, input, clearButton, count, container, renderCard, label }) {
  const update = () => {
    const matches = filterEquipment(equipment, input.value);
    container.replaceChildren();
    count.textContent = `검색 결과 ${matches.length}건 / 전체 ${equipment.length}건`;
    if (matches.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'status';
      empty.textContent = `${label} 검색 결과가 없습니다.`;
      container.append(empty);
      return;
    }
    for (const item of matches) renderCard(item);
  };
  input.addEventListener('input', update);
  const showAll = (focus = true) => {
    input.value = '';
    update();
    if (focus) input.focus();
  };
  clearButton.addEventListener('click', () => {
    showAll();
  });
  update();
  return { showAll };
}

function filterSoldiers(soldiers, idField, query) {
  const term = query.trim();
  if (!term) return soldiers;
  if (/^\d+$/.test(term)) return soldiers.filter((soldier) => String(soldier[idField]) === term);
  if (/^(?:\d|[+-]\d)/.test(term)) return [];
  const nameQuery = term.toLocaleLowerCase('ko-KR');
  return soldiers.filter((soldier) => soldier.nameKo.toLocaleLowerCase('ko-KR').includes(nameQuery));
}

function renderSoldierSearch({ soldiers, idField, input, clearButton, count, container, renderCard, label }) {
  const update = () => {
    const matches = filterSoldiers(soldiers, idField, input.value);
    container.replaceChildren();
    count.textContent = `검색 결과 ${matches.length}건 / 전체 ${soldiers.length}건`;
    if (matches.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'status';
      empty.textContent = `${label} 검색 결과가 없습니다.`;
      container.append(empty);
      return;
    }
    for (const soldier of matches) renderCard(soldier);
  };
  input.addEventListener('input', update);
  const showAll = (focus = true) => {
    input.value = '';
    update();
    if (focus) input.focus();
  };
  clearButton.addEventListener('click', () => showAll());
  update();
  return { showAll };
}

try {
  const response = await fetch('./generated/general-ssr-equipment.v1.json');
  if (!response.ok) throw new Error('Generated General SSR Equipment request failed (' + response.status + ')');
  const data = await response.json();
  if (data.schemaVersion !== 1 || !Array.isArray(data.equipment)) throw new Error('Unsupported General SSR Equipment data');
  const ids = data.equipment.map((item) => item.equipmentId);
  if (ids.some((id) => !Number.isInteger(id)) || new Set(ids).size !== ids.length) throw new Error('Malformed or duplicate General SSR Equipment ID');
  if (data.equipment.some((item) => typeof item.nameKo !== 'string' || !item.nameKo.trim()
    || typeof item.effectDescriptionKo !== 'string' || !item.effectDescriptionKo.trim())) throw new Error('General SSR Equipment presentation is incomplete');
  renderEquipmentSearch({
    equipment: data.equipment, input: generalEquipmentSearch, clearButton: generalEquipmentClear,
    count: generalEquipmentCount, container: generalEquipmentContainer,
    renderCard: addGeneralEquipment, label: '일반 SSR 장비',
  });
} catch (error) {
  const status = document.createElement('p');
  status.className = 'status status-error';
  status.textContent = '일반 SSR 장비 정보를 불러오지 못했습니다.';
  generalEquipmentContainer.replaceChildren(status);
  console.error(error);
}

function addExclusiveEquipment(item) {
  const article = document.createElement('article');
  article.className = 'general-equipment-card';
  article.id = `equipment-${item.equipmentId}`;
  const heading = document.createElement('div');
  heading.className = 'general-equipment-heading';
  const name = document.createElement('h3');
  name.textContent = item.nameKo;
  const id = document.createElement('p');
  id.className = 'general-equipment-id';
  id.textContent = 'Equipment ID ' + item.equipmentId;
  heading.append(name, id);
  const effect = document.createElement('p');
  effect.className = 'general-equipment-effect';
  effect.textContent = item.effectDescriptionKo.replace(/\\n/g, '\n');
  const hero = exclusiveEquipmentHeroById.get(item.equipmentId);
  if (hero) {
    const isDetail = hero.navigationTarget.surface === 'HERO_DETAIL';
    const heroLink = makeAnchor(
      `연결 영웅 · ${hero.heroNameKo} · 프로젝트 검수 표시명`,
      hero.navigationTarget.fragment,
      () => {
        if (isDetail) heroNavigation?.showTarget(hero.heroId);
        else if (hero.navigationTarget.surface === 'HERO_MINIMAL_DETAIL') {
          showMinimalDetailTarget(hero.heroId);
        }
        else heroIndexNavigation?.showTarget(hero.heroId);
      },
      true,
    );
    heroLink.className = 'equipment-navigation-link';
    article.append(heading, heroLink, effect);
  } else {
    article.append(heading, effect);
  }
  exclusiveEquipmentContainer.append(article);
}

try {
  const [response, navigationResponse] = await Promise.all([
    fetch('./generated/exclusive-equipment.v1.json'),
    fetch('./generated/exclusive-equipment-hero-navigation.v1.json'),
  ]);
  if (!response.ok) throw new Error('Generated Exclusive Equipment request failed (' + response.status + ')');
  if (!navigationResponse.ok) throw new Error('Generated Exclusive Equipment Hero Navigation request failed (' + navigationResponse.status + ')');
  const data = await response.json();
  const navigationData = await navigationResponse.json();
  if (data.schemaVersion !== 1 || !Array.isArray(data.equipment)) throw new Error('Unsupported Exclusive Equipment data');
  if (navigationData.schemaVersion !== 1 || navigationData.consumer !== 'exclusive-equipment-hero-navigation'
    || !Array.isArray(navigationData.records) || navigationData.records.length !== 167) {
    throw new Error('Unsupported Exclusive Equipment Hero Navigation data');
  }
  const ids = data.equipment.map((item) => item.equipmentId);
  if (ids.some((id) => !Number.isSafeInteger(id)) || new Set(ids).size !== ids.length) throw new Error('Malformed or duplicate Exclusive Equipment ID');
  if (data.equipment.some((item) => typeof item.nameKo !== 'string' || !item.nameKo.trim()
    || typeof item.effectDescriptionKo !== 'string' || !item.effectDescriptionKo.trim())) throw new Error('Exclusive Equipment presentation is incomplete');
  const equipmentIds = new Set(ids);
  exclusiveEquipmentHeroById = new Map();
  for (const row of navigationData.records) {
    if (Object.keys(row).sort().join(',') !== 'equipmentId,heroId,heroNameKo,navigationTarget'
      || !Number.isSafeInteger(row.equipmentId) || !Number.isSafeInteger(row.heroId)
      || !equipmentIds.has(row.equipmentId) || exclusiveEquipmentHeroById.has(row.equipmentId)
      || typeof row.heroNameKo !== 'string' || !row.heroNameKo.trim()
      || !row.navigationTarget || !['HERO_DETAIL', 'HERO_INDEX', 'HERO_MINIMAL_DETAIL'].includes(row.navigationTarget.surface)
      || Object.keys(row.navigationTarget).sort().join(',') !== 'fragment,surface'
      || row.navigationTarget.fragment !== (row.navigationTarget.surface === 'HERO_DETAIL' ? `hero-${row.heroId}`
        : row.navigationTarget.surface === 'HERO_INDEX' ? `hero-index-entry-${row.heroId}`
          : row.equipmentId === 535 && row.heroId === 15 ? 'hero-minimal-detail-15'
            : row.equipmentId === 418 && row.heroId === 16 ? 'hero-minimal-detail-16'
              : new Map([[405, 17], [276, 18], [281, 20], [441, 21], [286, 30], [434,31],[297,34],[425,35],[414,36],[455,38],[411,39],[429,49],[293,51],[490,54],[472,57],[423,58],[424,59],[413,61],[427,62],[452,63],[439,64],[437,65],[464,66],[435,87],[417,88],[453,91],[426,92],[479,93],[440,94],[438,95],[460,96],[448,97],[476,98],[540,99],[549,100],[463,101],[477,102],[451,103],[508,104],[497,105],[487,106],[499,108],[489,109],[475,110],[449,111],[501,112],[507,113],[485,114],[478,115],[461,116],[496,118],[526,119],[473,120],[454,121],[502,122],[486,123],[519,124],[467,125],[484,126],[450,127],[520,129],[512,130],[495,99161],[498,99162],[500,99163],[534,99164],[510,99165],[539,99166],[511,99167],[537,99168],[509,99169],[513,99170],[514,99171],[524,99172],[538,99173],[533,99174],[536,99175],[521,99176],[523,99177],[532,99178],[547,99179],[525,99180],[551,99181],[531,99182],[550,99183],[559,99184],[560,99185],[568,99186],[548,99187],[546,99188],[545,99189],[569,99190],[552,99191],[570,99192],[557,99193],[603,99197],[558,99198],[562,99199],[567,99203],[561,99204],[572,99205],[571,99206],[578,99207],[573,99208],[580,99212],[579,99213],[582,99214],[604,99215],[612,99216],[581,99217],[619,99218],[589,99219],[588,99220],[587,99221],[643,99225],[595,99226],[590,99227],[620,99228],[628,99229],[596,99230],[614,99231],[597,99233],[598,99234],[605,99238],[636,99239],[613,99240],[606,99241],[627,99243],[611,99244],[622,99249],[621,99250],[635,99252],[629,99253],[637,99254],[634,99255],[638,99259]]).get(row.equipmentId) === row.heroId ? `hero-minimal-detail-${row.heroId}` : null)) {
      throw new Error('Malformed, duplicate, or unresolved Exclusive Equipment Hero Navigation record');
    }
    exclusiveEquipmentHeroById.set(row.equipmentId, row);
  }
  if (exclusiveEquipmentHeroById.size !== 167) throw new Error('Exclusive Equipment Hero Navigation population must remain 167');
  const minimalRows = [...exclusiveEquipmentHeroById.values()].filter(({ navigationTarget }) => navigationTarget.surface === 'HERO_MINIMAL_DETAIL');
  if (exclusiveEquipmentHeroById.get(535)?.navigationTarget.fragment !== 'hero-minimal-detail-15'
    || exclusiveEquipmentHeroById.get(418)?.navigationTarget.fragment !== 'hero-minimal-detail-16'
    || minimalRows.length !== 138
    || JSON.stringify(minimalRows.map(({ equipmentId, heroId }) => [equipmentId, heroId])) !== JSON.stringify([[276,18],[281,20],[286,30],[293,51],[297,34],[405,17],[411,39],[413,61],[414,36],[417,88],[418,16],[423,58],[424,59],[425,35],[426,92],[427,62],[429,49],[434,31],[435,87],[437,65],[438,95],[439,64],[440,94],[441,21],[448,97],[449,111],[450,127],[451,103],[452,63],[453,91],[454,121],[455,38],[460,96],[461,116],[463,101],[464,66],[467,125],[472,57],[473,120],[475,110],[476,98],[477,102],[478,115],[479,93],[484,126],[485,114],[486,123],[487,106],[489,109],[490,54],[495,99161],[496,118],[497,105],[498,99162],[499,108],[500,99163],[501,112],[502,122],[507,113],[508,104],[509,99169],[510,99165],[511,99167],[512,130],[513,99170],[514,99171],[519,124],[520,129],[521,99176],[523,99177],[524,99172],[525,99180],[526,119],[531,99182],[532,99178],[533,99174],[534,99164],[535,15],[536,99175],[537,99168],[538,99173],[539,99166],[540,99],[545,99189],[546,99188],[547,99179],[548,99187],[549,100],[550,99183],[551,99181],[552,99191],[557,99193],[559,99184],[560,99185],[568,99186],[569,99190],[570,99192],[603,99197],[558,99198],[562,99199],[567,99203],[561,99204],[572,99205],[571,99206],[578,99207],[573,99208],[580,99212],[579,99213],[582,99214],[604,99215],[612,99216],[581,99217],[619,99218],[589,99219],[588,99220],[587,99221],[643,99225],[595,99226],[590,99227],[620,99228],[628,99229],[596,99230],[614,99231],[597,99233],[598,99234],[605,99238],[636,99239],[613,99240],[606,99241],[627,99243],[611,99244],[622,99249],[621,99250],[635,99252],[629,99253],[637,99254],[634,99255],[638,99259]].sort((a, b) => a[0] - b[0]))) {
    throw new Error('Only the 138 approved Equipment IDs may target their corresponding minimal details');
  }
  exclusiveEquipmentNavigation = renderEquipmentSearch({
    equipment: data.equipment, input: exclusiveEquipmentSearch, clearButton: exclusiveEquipmentClear,
    count: exclusiveEquipmentCount, container: exclusiveEquipmentContainer,
    renderCard: addExclusiveEquipment, label: '전용 장비',
  });
} catch (error) {
  const status = document.createElement('p');
  status.className = 'status status-error';
  status.textContent = '전용 장비 정보를 불러오지 못했습니다.';
  exclusiveEquipmentContainer.replaceChildren(status);
  console.error(error);
}

function appendSkillDescription(target, sourceText) {
  const original = String(sourceText ?? '');
  const openTag = '<color=#DC143C>';
  const closeTag = '</color>';
  const parts = [];
  let cursor = 0;
  while (cursor < original.length) {
    const nextTag = original.indexOf('<', cursor);
    if (nextTag < 0) {
      parts.push({ text: original.slice(cursor) });
      cursor = original.length;
      break;
    }
    if (nextTag > cursor) parts.push({ text: original.slice(cursor, nextTag) });
    if (original.startsWith(openTag, nextTag)) {
      const close = original.indexOf(closeTag, nextTag + openTag.length);
      if (close < 0 || original.indexOf(openTag, nextTag + openTag.length) >= 0
        && original.indexOf(openTag, nextTag + openTag.length) < close
        || original.indexOf('<', nextTag + openTag.length) >= 0
        && original.indexOf('<', nextTag + openTag.length) < close) {
        target.textContent = original;
        return;
      }
      parts.push({ emphasis: original.slice(nextTag + openTag.length, close) });
      cursor = close + closeTag.length;
      continue;
    }
    target.textContent = original;
    return;
  }
  for (const part of parts) {
    if (part.emphasis !== undefined) {
      const span = document.createElement('span');
      span.className = 'skill-description-emphasis';
      span.textContent = part.emphasis;
      target.append(span);
    } else target.append(document.createTextNode(part.text));
  }
}

function indexSoldierTrainingTechDescriptions(data) {
  if (data?.schemaVersion !== 1 || !Array.isArray(data.records)
    || data.contract?.id !== 'soldier-training-tech-description-presentation.v1'
    || data.contract.version !== 1
    || !['PROPOSED', 'APPROVED', 'EFFECTIVE', 'REVOKED'].includes(data.contract.status)
    || typeof data.contract.approved !== 'boolean' || typeof data.contract.effective !== 'boolean'
    || data.contract.decisionRecord !== 'docs/decisions/pr137-training-tech-223-presentation.v1.json'
    || JSON.stringify(data.contract.decisionIds) !== JSON.stringify(['PR137-TT223-DECISION-A-v1', 'PR137-TT223-DECISION-B-v1'])
    || JSON.stringify(data.contract.publicSurfaces) !== JSON.stringify(['soldier_card_ui', 'build_generated_json', 'hosted_direct_json', 'public_github_source'])
    || data.source?.repository !== 'LuceatLuxVestra42/langrisser-future-guide'
    || data.source?.commit !== '6475e63ee23d18adf733756c26a14fa9e3ed662c') {
    throw new Error('Unsupported Soldier TrainingTech description consumer');
  }
  if (data.contract.status !== 'EFFECTIVE' || data.contract.approved !== true || data.contract.effective !== true) return new Map();
  if (data.records.length !== 20) throw new Error('Effective Soldier TrainingTech contract must contain exactly 20 records');
  const expected = new Map([
    ['NORMAL', { soldierId: 115, sourceField: 'Description' }],
    ['SP', { soldierId: 5115, sourceField: 'SpSoidlierDescription' }],
  ]);
  const levelInfoIds = new Set([2230, 2231, 2232, 2233, 2234, 2235, 2236, 2237, 2238, 2239]);
  const evidencePath = 'evidence/source/configdata/soldier-training-tech-223-descriptions.v1.json';
  const bySoldier = new Map();
  for (const row of data.records) {
    const target = expected.get(row.variant);
    if (!target || row.soldierId !== target.soldierId || row.trainingTechId !== 223
      || !levelInfoIds.has(row.levelInfoId) || row.sourceField !== target.sourceField
      || typeof row.descriptionCn !== 'string' || !row.descriptionCn.trim()
      || !row.provenance
      || row.provenance.description !== `${evidencePath}#ID=${row.levelInfoId}/${target.sourceField}`
      || row.provenance.soldierRelation !== `${evidencePath}#ID=223/SoldierIDRelated&contains=${target.soldierId}`
      || row.provenance.levelInfoLink !== `${evidencePath}#ID=223/TechLevelupInfoList&contains=${row.levelInfoId}`) {
      throw new Error('Malformed or out-of-scope Soldier TrainingTech description');
    }
    const key = `${row.variant}:${row.soldierId}`;
    const records = bySoldier.get(key) ?? [];
    if (records.some((existing) => existing.levelInfoId === row.levelInfoId)) {
      throw new Error(`Duplicate TrainingTech LevelInfo source ID ${row.levelInfoId}`);
    }
    records.push(row);
    bySoldier.set(key, records);
  }
  for (const [variant, target] of expected) {
    const rows = bySoldier.get(`${variant}:${target.soldierId}`) ?? [];
    if (rows.length !== 10 || [...levelInfoIds].some((id) => !rows.some((row) => row.levelInfoId === id))) {
      throw new Error(`${variant} TrainingTech description set is incomplete`);
    }
  }
  return bySoldier;
}

function makeSoldierTrainingTechPresentation(soldier, variant, bySoldier) {
  const target = variant === 'NORMAL' ? { soldierId: soldier.normalSoldierId, field: 'Description' }
    : variant === 'SP' ? { soldierId: soldier.spSoldierId, field: 'SpSoidlierDescription' } : null;
  if (!target || ![115, 5115].includes(target.soldierId)) return null;
  const records = bySoldier.get(`${variant}:${target.soldierId}`);
  if (!records) return null;
  if (records.length !== 10 || records.some((row) => row.trainingTechId !== 223 || row.sourceField !== target.field)) {
    throw new Error(`Malformed TrainingTech description presentation for ${variant} Soldier ${target.soldierId}`);
  }
  const details = document.createElement('details');
  details.className = 'soldier-training-tech-descriptions';
  const summary = document.createElement('summary');
  summary.textContent = 'CN ConfigData 원문 설명 · 한국어 공식 번역 아님';
  const notice = document.createElement('p');
  notice.className = 'soldier-training-tech-notice';
  notice.textContent = 'LevelInfo ID는 원본 레코드 식별자이며 게임 레벨이나 진행 순서를 뜻하지 않습니다. 원문은 검증된 실제 전투 효과로 해석하지 않습니다.';
  const list = document.createElement('ul');
  list.className = 'soldier-training-tech-list';
  const spNotice = document.createElement('p');
  spNotice.className = 'soldier-training-tech-notice';
  if (variant === 'SP') spNotice.textContent = 'SP 설명의 슬롯·시점·게임 내 적용 의미는 확인되지 않았습니다.';
  const source = document.createElement('p');
  source.className = 'soldier-training-tech-source';
  source.textContent = 'Source: LuceatLuxVestra42/langrisser-future-guide · Commit 6475e63ee23d18adf733756c26a14fa9e3ed662c · TrainingTech ID 223';
  for (const row of records) {
    const item = document.createElement('li');
    const label = document.createElement('p');
    label.className = 'soldier-training-tech-label';
    label.textContent = `LevelInfo Source ID ${row.levelInfoId} · Source Field ${row.sourceField}`;
    const provenance = document.createElement('p');
    provenance.className = 'soldier-training-tech-source';
    provenance.textContent = `Source: data/configdata/ConfigDataTrainingTechLevelInfo.json#ID=${row.levelInfoId}/${row.sourceField} · Evidence: ${row.provenance.description} · Relation: ${row.provenance.soldierRelation} · LevelInfo link: ${row.provenance.levelInfoLink}`;
    const description = document.createElement('p');
    description.className = 'soldier-training-tech-description';
    appendSkillDescription(description, row.descriptionCn);
    item.append(label, provenance, description);
    list.append(item);
  }
  details.append(summary, notice);
  if (variant === 'SP') details.append(spNotice);
  details.append(source, list);
  return details;
}

const soldierTrainingTechDescriptionsPromise = fetch('./generated/soldier-training-tech-descriptions.v1.json')
  .then((response) => {
    if (!response.ok) throw new Error(`Generated Soldier TrainingTech request failed (${response.status})`);
    return response.json();
  })
  .then(indexSoldierTrainingTechDescriptions)
  .catch((error) => {
    console.error(error);
    return new Map();
  });

function makeSoldierSkillReferences(soldier) {
  if (!Array.isArray(soldier.skillReferences) || soldier.skillReferences.length === 0) return null;
  const details = document.createElement('details');
  details.className = 'soldier-skill-references';
  const summary = document.createElement('summary');
  summary.textContent = 'Skill 원문 · 목록 순서는 의미 없음 · 게임 레벨 의미 미확정';
  const list = document.createElement('ul');
  for (const skill of soldier.skillReferences) {
    const item = document.createElement('li');
    const label = document.createElement('p');
    label.className = 'soldier-skill-label';
    label.textContent = `Skill ID ${skill.skillId} · ${skill.nameCn}`;
    const description = document.createElement('p');
    description.className = 'soldier-skill-description';
    appendSkillDescription(description, skill.descriptionCn);
    item.append(label, description);
    list.append(item);
  }
  details.append(summary, list);
  return details;
}

function addSpSoldier(soldier) {
  const article = document.createElement('article');
  article.className = 'sp-soldier-card';
  article.id = `sp-soldier-${soldier.spSoldierId}`;
  const heading = document.createElement('div');
  heading.className = 'sp-soldier-heading';
  const name = document.createElement('h3');
  name.textContent = soldier.nameKo;
  const id = document.createElement('p');
  id.textContent = `SP Soldier ID ${soldier.spSoldierId}`;
  heading.append(name, id);
  const bfMovePoint = document.createElement('p');
  bfMovePoint.className = 'soldier-bf-move-point';
  bfMovePoint.textContent = `BF_MovePoint (원본 값): ${soldier.bfMovePoint}`;

  const normal = document.createElement('p');
  normal.className = 'normal-soldier-id';
  const normalLink = makeAnchor(
    `일반 용병 ID ${soldier.normalSoldierId} · ${soldier.normalSoldierNameKo}`,
    `normal-soldier-${soldier.normalSoldierId}`,
    () => normalSoldierNavigation?.showAll(false),
  );
  normalLink.className = 'normal-soldier-navigation-link';
  normal.append(normalLink);
  const makeStats = (labelText, values, className) => {
    const group = document.createElement('div');
    group.className = `soldier-stat-group ${className}`;
    const label = document.createElement('p');
    label.className = 'soldier-stat-label';
    label.textContent = labelText;
    const stats = document.createElement('dl');
    stats.className = 'sp-soldier-stats';
    for (const [name, value] of [
      ['HP', values.hp],
      ['공격력', values.attack],
      ['방어력', values.defense],
      ['마방', values.magicDefense],
    ]) {
      const pair = document.createElement('div');
      const term = document.createElement('dt');
      term.textContent = name;
      const description = document.createElement('dd');
      description.textContent = String(value);
      pair.append(term, description);
      stats.append(pair);
    }
    group.append(label, stats);
    return group;
  };
  const spStats = makeStats('SP 기본 능력치', soldier.baseStats, 'sp-stat-group');
  const normalStats = makeStats('일반 기본 능력치', soldier.normalSoldierBaseStats, 'normal-stat-group');
  const heroLinks = makeSoldierHeroLinks(soldier.spSoldierId);
  const skillReferences = makeSoldierSkillReferences(soldier);
  const trainingTechDescriptions = makeSoldierTrainingTechPresentation(soldier, 'SP', soldierTrainingTechDescriptions);
  article.append(heading, normal, bfMovePoint, spStats, normalStats);
  if (trainingTechDescriptions) article.append(trainingTechDescriptions);
  if (skillReferences) article.append(skillReferences);
  if (heroLinks) article.append(heroLinks);
  spSoldierContainer.append(article);
}

try {
  const response = await fetch('./generated/sp-soldiers.v1.json');
  if (!response.ok) throw new Error(`Generated SP Soldier data request failed (${response.status})`);
  const data = await response.json();
  if (data.schemaVersion !== 1 || !Array.isArray(data.soldiers)
    || !data.soldiers.every((soldier) => Number.isFinite(soldier.bfMovePoint))) throw new Error('Unsupported SP Soldier data');
  soldierTrainingTechDescriptions = await soldierTrainingTechDescriptionsPromise;
  spSoldiersByNormalId = indexSpSoldiersByNormalId(data.soldiers);
  spSoldierNavigation = renderSoldierSearch({
    soldiers: data.soldiers, idField: 'spSoldierId', input: spSoldierSearch,
    clearButton: spSoldierClear, count: spSoldierCount, container: spSoldierContainer,
    renderCard: addSpSoldier, label: 'SP 용병',
  });
} catch (error) {
  const status = document.createElement('p');
  status.className = 'status status-error';
  status.textContent = 'SP 용병 정보를 불러오지 못했습니다.';
  spSoldierContainer.replaceChildren(status);
  console.error(error);
}


function addNormalSoldier(soldier) {
  const article = document.createElement('article');
  article.className = 'sp-soldier-card';
  article.id = `normal-soldier-${soldier.normalSoldierId}`;
  const heading = document.createElement('div');
  heading.className = 'sp-soldier-heading';
  const name = document.createElement('h3');
  name.textContent = soldier.nameKo;
  const id = document.createElement('p');
  id.textContent = `일반 용병 ID ${soldier.normalSoldierId}`;
  heading.append(name, id);
  const bfMovePoint = document.createElement('p');
  bfMovePoint.className = 'soldier-bf-move-point';
  bfMovePoint.textContent = `BF_MovePoint (원본 값): ${soldier.bfMovePoint}`;
  const stats = document.createElement('dl');
  stats.className = 'sp-soldier-stats';
  for (const [label, value] of [
    ['HP', soldier.baseStats.hp],
    ['공격력', soldier.baseStats.attack],
    ['방어력', soldier.baseStats.defense],
    ['마방', soldier.baseStats.magicDefense],
  ]) {
    const pair = document.createElement('div');
    const term = document.createElement('dt');
    term.textContent = label;
    const description = document.createElement('dd');
    description.textContent = String(value);
    pair.append(term, description);
    stats.append(pair);
  }
  const heroLinks = makeSoldierHeroLinks(soldier.normalSoldierId);
  const skillReferences = makeSoldierSkillReferences(soldier);
  const trainingTechDescriptions = makeSoldierTrainingTechPresentation(soldier, 'NORMAL', soldierTrainingTechDescriptions);
  const spLinks = spSoldiersByNormalId.get(soldier.normalSoldierId);
  let linkedSpSection = null;
  if (spLinks?.length) {
    linkedSpSection = document.createElement('section');
    linkedSpSection.className = 'normal-soldier-sp-links';
    const linkedSpHeading = document.createElement('h4');
    linkedSpHeading.textContent = '연결 SP 용병';
    const linkedSpList = document.createElement('ul');
    for (const linkedSp of spLinks) {
      const item = document.createElement('li');
      const link = makeAnchor(
        `${linkedSp.nameKo} (SP 용병 ID ${linkedSp.spSoldierId})`,
        `sp-soldier-${linkedSp.spSoldierId}`,
        () => spSoldierNavigation?.showAll(false),
      );
      link.className = 'sp-soldier-navigation-link';
      item.append(link);
      linkedSpList.append(item);
    }
    linkedSpSection.append(linkedSpHeading, linkedSpList);
  }
  article.append(heading, bfMovePoint, stats);
  if (trainingTechDescriptions) article.append(trainingTechDescriptions);
  if (skillReferences) article.append(skillReferences);
  if (heroLinks) article.append(heroLinks);
  if (linkedSpSection) article.append(linkedSpSection);
  normalSoldierContainer.append(article);
}

function revealInitialHeroFragment() {
  const initialTargetId = window.location.hash.slice(1);
  if (!initialTargetId.startsWith('hero-')) return;
  window.requestAnimationFrame(() => document.getElementById(initialTargetId)?.scrollIntoView());
}

function makeSoldierHeroLinks(soldierId) {
  const heroIds = heroBySoldierId.get(soldierId);
  if (!heroIds?.length) return null;
  const section = document.createElement('section');
  section.className = 'soldier-hero-links';
  const heading = document.createElement('h4');
  heading.textContent = '연결 영웅';
  const list = document.createElement('ul');
  for (const heroId of heroIds) {
    const item = document.createElement('li');
    const heroName = document.querySelector(`#hero-${heroId} h2`)?.textContent ?? `영웅 ID ${heroId}`;
    item.append(makeAnchor(
      `${heroName} (영웅 ID ${heroId})`,
      `hero-${heroId}`,
      () => heroNavigation?.showTarget(heroId),
      true,
    ));
    list.append(item);
  }
  section.append(heading, list);
  return section;
}

try {
  const response = await fetch('./generated/normal-soldiers.v1.json');
  if (!response.ok) throw new Error(`Generated NORMAL Soldier data request failed (${response.status})`);
  const data = await response.json();
  if (data.schemaVersion !== 1 || !Array.isArray(data.soldiers)
    || !data.soldiers.every((soldier) => Number.isFinite(soldier.bfMovePoint))) throw new Error('Unsupported NORMAL Soldier data');
  soldierTrainingTechDescriptions = await soldierTrainingTechDescriptionsPromise;
  normalSoldierNavigation = renderSoldierSearch({
    soldiers: data.soldiers, idField: 'normalSoldierId', input: normalSoldierSearch,
    clearButton: normalSoldierClear, count: normalSoldierCount, container: normalSoldierContainer,
    renderCard: addNormalSoldier, label: '일반 용병',
  });
} catch (error) {
  const status = document.createElement('p');
  status.className = 'status status-error';
  status.textContent = '일반 용병 정보를 불러오지 못했습니다.';
  normalSoldierContainer.replaceChildren(status);
  console.error(error);
}
