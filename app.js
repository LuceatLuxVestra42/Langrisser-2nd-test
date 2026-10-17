const container = document.querySelector('#heroes');
const heroSearch = document.querySelector('#hero-search');
const heroSearchClear = document.querySelector('#hero-search-clear');
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
let heroBySoldierId = new Map();
let spSoldiersByNormalId = new Map();
let spSoldierNavigation = null;
let normalSoldierNavigation = null;

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

function renderHeroSearch({ heroes, input, clearButton, count, emptyState }) {
  const update = () => {
    const matches = filterHeroes(heroes, input.value);
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
  const showAll = (focus = true) => {
    input.value = '';
    update();
    if (focus) input.focus();
  };
  const showTarget = (heroId) => {
    if (!heroes.some(({ id }) => id === heroId)) return false;
    showAll(false);
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
  heading.textContent = '진영 · 중국어 원문';
  const list = document.createElement('ul');
  list.className = 'hero-faction-list';
  const seen = new Set();
  for (const faction of factions) {
    if (!Number.isSafeInteger(faction.factionId) || typeof faction.nameCn !== 'string' || !faction.nameCn.trim() || seen.has(faction.factionId)) {
      throw new Error('Generated Hero Faction presentation is malformed');
    }
    seen.add(faction.factionId);
    const item = document.createElement('li');
    item.textContent = faction.nameCn;
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
  heading.textContent = '출전작 · 중국어 원문';
  const list = document.createElement('ul');
  list.className = 'hero-origin-list';
  const seen = new Set();
  for (const origin of origins) {
    if (!Number.isSafeInteger(origin.productionId) || typeof origin.nameCn !== 'string' || !origin.nameCn.trim()
      || seen.has(origin.productionId)) {
      throw new Error('Generated Hero Production presentation is malformed');
    }
    seen.add(origin.productionId);
    const item = document.createElement('li');
    item.textContent = origin.nameCn;
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
  for (const row of talent.starDescriptions) {
    if (!Number.isSafeInteger(row.skillId)) throw new Error('Generated Hero Talent Skill ID is malformed');
    const item = document.createElement('li');
    const star = document.createElement('h4');
    star.textContent = `${row.star}성`;
    item.append(star, makeTalentDescription(row.descriptionKoRaw, row.star));
    list.append(item);
  }
  section.append(heading, name, list);
  return section;
}

function addHero(hero, relationsByHero, soldiersById) {
  const article = document.createElement('article');
  article.className = 'hero-card';
  article.id = `hero-${hero.id}`;

  const image = document.createElement('img');
  image.className = 'hero-portrait';
  image.src = new URL(hero.portrait, document.baseURI).href;
  image.alt = `${hero.nameKo} 초상화`;
  image.loading = 'lazy';

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
    item.textContent = `연결 ${relation.connectionId} → ${relation.jobNameKo} (전직 ID ${relation.jobId})`;
    connections.append(item);
  }
  article.append(image, details);
  article.append(makeFactionPresentation(hero.factions));
  article.append(makeOriginPresentation(hero.origins));
  if (hero.talent) article.append(makeTalentPresentation(hero.id, hero.talent));
  article.append(connections);
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
      const item = document.createElement('li');
      const soldierLink = makeAnchor(soldier.nameKo, soldier.domId, () => {
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
  const [heroResponse, relationResponse, normalResponse, spResponse] = await Promise.all([
    fetch('./generated/hero-slice.v1.json'),
    fetch('./generated/hero-soldier-relations.v1.json'),
    fetch('./generated/normal-soldiers.v1.json'),
    fetch('./generated/sp-soldiers.v1.json'),
  ]);
  for (const response of [heroResponse, relationResponse, normalResponse, spResponse]) {
    if (!response.ok) throw new Error(`Generated presentation request failed (${response.status})`);
  }
  const [data, relationData, normalData, spData] = await Promise.all([
    heroResponse.json(), relationResponse.json(), normalResponse.json(), spResponse.json(),
  ]);
  if (data.schemaVersion !== 1 || !Array.isArray(data.heroes)) throw new Error('Unsupported generated Hero data');
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
  exclusiveEquipmentHeroById = new Map();
  for (const hero of data.heroes) {
    const equipmentId = hero.exclusiveEquipment?.equipmentId;
    if (!Number.isSafeInteger(equipmentId) || exclusiveEquipmentHeroById.has(equipmentId)) {
      throw new Error('Malformed or duplicate Hero Slice Exclusive Equipment endpoint');
    }
    exclusiveEquipmentHeroById.set(equipmentId, hero);
  }
  heroBySoldierId = new Map();
  for (const [heroId, soldierIds] of relationsByHero) {
    for (const soldierId of soldierIds) {
      const heroIdsForSoldier = heroBySoldierId.get(soldierId) ?? [];
      heroIdsForSoldier.push(heroId);
      heroBySoldierId.set(soldierId, heroIdsForSoldier);
    }
  }
  for (const hero of data.heroes) addHero(hero, relationsByHero, soldiersById);
  heroNavigation = renderHeroSearch({
    heroes: data.heroes, input: heroSearch, clearButton: heroSearchClear,
    count: heroSearchCount, emptyState: heroSearchEmpty,
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
    const heroLink = makeAnchor(
      `연결 영웅 · ${hero.nameKo}`,
      `hero-${hero.id}`,
      () => heroNavigation?.showTarget(hero.id),
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
  const response = await fetch('./generated/exclusive-equipment.v1.json');
  if (!response.ok) throw new Error('Generated Exclusive Equipment request failed (' + response.status + ')');
  const data = await response.json();
  if (data.schemaVersion !== 1 || !Array.isArray(data.equipment)) throw new Error('Unsupported Exclusive Equipment data');
  const ids = data.equipment.map((item) => item.equipmentId);
  if (ids.some((id) => !Number.isSafeInteger(id)) || new Set(ids).size !== ids.length) throw new Error('Malformed or duplicate Exclusive Equipment ID');
  if (data.equipment.some((item) => typeof item.nameKo !== 'string' || !item.nameKo.trim()
    || typeof item.effectDescriptionKo !== 'string' || !item.effectDescriptionKo.trim())) throw new Error('Exclusive Equipment presentation is incomplete');
  const equipmentIds = new Set(ids);
  for (const [equipmentId] of exclusiveEquipmentHeroById) {
    if (!equipmentIds.has(equipmentId)) throw new Error(`Hero Slice references missing Exclusive Equipment ID ${equipmentId}`);
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
  article.append(heading, normal, spStats, normalStats);
  if (heroLinks) article.append(heroLinks);
  spSoldierContainer.append(article);
}

try {
  const response = await fetch('./generated/sp-soldiers.v1.json');
  if (!response.ok) throw new Error(`Generated SP Soldier data request failed (${response.status})`);
  const data = await response.json();
  if (data.schemaVersion !== 1 || !Array.isArray(data.soldiers)) throw new Error('Unsupported SP Soldier data');
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
  article.append(heading, stats);
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
  if (data.schemaVersion !== 1 || !Array.isArray(data.soldiers)) throw new Error('Unsupported NORMAL Soldier data');
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
