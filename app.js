const container = document.querySelector('#heroes');
const spSoldierContainer = document.querySelector('#sp-soldiers');
const normalSoldierContainer = document.querySelector('#normal-soldiers');
const jobGlossaryContainer = document.querySelector('#job-glossary');
const generalEquipmentContainer = document.querySelector('#general-ssr-equipment');
const exclusiveEquipmentContainer = document.querySelector('#exclusive-equipment');

function addHero(hero, relationsByHero, soldiersById) {
  const article = document.createElement('article');
  article.className = 'hero-card';

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

  details.append(name, id);
  const connections = document.createElement('ul');
  connections.className = 'job-connections';
  connections.setAttribute('aria-label', `${hero.nameKo}의 전직 연결과 한국어 표시명`);
  for (const relation of hero.jobConnections) {
    const item = document.createElement('li');
    item.textContent = `연결 ${relation.connectionId} → ${relation.jobNameKo} (전직 ID ${relation.jobId})`;
    connections.append(item);
  }
  article.append(image, details);
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
  const effect = document.createElement('p');
  effect.className = 'exclusive-equipment-effect';
  effect.textContent = hero.exclusiveEquipment.effectDescriptionKo;
  exclusive.append(exclusiveHeading, equipmentName, effect);
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
      item.textContent = soldier.nameKo;
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
  if (relationData.schemaVersion !== 1 || !Array.isArray(relationData.relations)) throw new Error('Unsupported Hero–Soldier relation data');
  if (normalData.schemaVersion !== 1 || !Array.isArray(normalData.soldiers)
    || spData.schemaVersion !== 1 || !Array.isArray(spData.soldiers)) throw new Error('Unsupported generated Soldier data');

  const soldiersById = new Map();
  for (const soldier of normalData.soldiers) {
    if (!Number.isInteger(soldier.normalSoldierId) || typeof soldier.nameKo !== 'string' || !soldier.nameKo
      || soldiersById.has(soldier.normalSoldierId)) throw new Error('Malformed or duplicate NORMAL Soldier presentation ID');
    soldiersById.set(soldier.normalSoldierId, { nameKo: soldier.nameKo });
  }
  for (const soldier of spData.soldiers) {
    if (!Number.isInteger(soldier.spSoldierId) || typeof soldier.nameKo !== 'string' || !soldier.nameKo
      || soldiersById.has(soldier.spSoldierId)) throw new Error('Malformed or duplicate SP Soldier presentation ID');
    soldiersById.set(soldier.spSoldierId, { nameKo: soldier.nameKo });
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
  for (const hero of data.heroes) addHero(hero, relationsByHero, soldiersById);
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
  effect.textContent = item.effectDescriptionKo;
  article.append(heading, effect);
  generalEquipmentContainer.append(article);
}

try {
  const response = await fetch('./generated/general-ssr-equipment.v1.json');
  if (!response.ok) throw new Error('Generated General SSR Equipment request failed (' + response.status + ')');
  const data = await response.json();
  if (data.schemaVersion !== 1 || !Array.isArray(data.equipment) || data.equipment.length !== 206) throw new Error('Unsupported General SSR Equipment data');
  const ids = data.equipment.map((item) => item.equipmentId);
  if (ids.some((id) => !Number.isInteger(id)) || new Set(ids).size !== ids.length) throw new Error('Malformed or duplicate General SSR Equipment ID');
  if (data.equipment.some((item) => typeof item.nameKo !== 'string' || !item.nameKo.trim()
    || typeof item.effectDescriptionKo !== 'string' || !item.effectDescriptionKo.trim())) throw new Error('General SSR Equipment presentation is incomplete');
  generalEquipmentContainer.replaceChildren();
  for (const item of data.equipment) addGeneralEquipment(item);
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
  effect.textContent = item.effectDescriptionKo;
  article.append(heading, effect);
  exclusiveEquipmentContainer.append(article);
}

try {
  const response = await fetch('./generated/exclusive-equipment.v1.json');
  if (!response.ok) throw new Error('Generated Exclusive Equipment request failed (' + response.status + ')');
  const data = await response.json();
  if (data.schemaVersion !== 1 || !Array.isArray(data.equipment) || data.equipment.length !== 167) throw new Error('Unsupported Exclusive Equipment data');
  const ids = data.equipment.map((item) => item.equipmentId);
  if (ids.some((id) => !Number.isSafeInteger(id)) || new Set(ids).size !== 167) throw new Error('Malformed or duplicate Exclusive Equipment ID');
  if (data.equipment.some((item) => typeof item.nameKo !== 'string' || !item.nameKo.trim()
    || typeof item.effectDescriptionKo !== 'string' || !item.effectDescriptionKo.trim())) throw new Error('Exclusive Equipment presentation is incomplete');
  exclusiveEquipmentContainer.replaceChildren();
  for (const item of data.equipment) addExclusiveEquipment(item);
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
  const heading = document.createElement('div');
  heading.className = 'sp-soldier-heading';
  const name = document.createElement('h3');
  name.textContent = soldier.nameKo;
  const id = document.createElement('p');
  id.textContent = `SP Soldier ID ${soldier.spSoldierId}`;
  heading.append(name, id);

  const normal = document.createElement('p');
  normal.className = 'normal-soldier-id';
  normal.textContent = `일반 용병 ID ${soldier.normalSoldierId} · ${soldier.normalSoldierNameKo}`;
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
  article.append(heading, normal, spStats, normalStats);
  spSoldierContainer.append(article);
}

try {
  const response = await fetch('./generated/sp-soldiers.v1.json');
  if (!response.ok) throw new Error(`Generated SP Soldier data request failed (${response.status})`);
  const data = await response.json();
  if (data.schemaVersion !== 1 || !Array.isArray(data.soldiers)) throw new Error('Unsupported SP Soldier data');
  spSoldierContainer.replaceChildren();
  for (const soldier of data.soldiers) addSpSoldier(soldier);
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
  article.append(heading, stats);
  normalSoldierContainer.append(article);
}

try {
  const response = await fetch('./generated/normal-soldiers.v1.json');
  if (!response.ok) throw new Error(`Generated NORMAL Soldier data request failed (${response.status})`);
  const data = await response.json();
  if (data.schemaVersion !== 1 || !Array.isArray(data.soldiers)) throw new Error('Unsupported NORMAL Soldier data');
  normalSoldierContainer.replaceChildren();
  for (const soldier of data.soldiers) addNormalSoldier(soldier);
} catch (error) {
  const status = document.createElement('p');
  status.className = 'status status-error';
  status.textContent = '일반 용병 정보를 불러오지 못했습니다.';
  normalSoldierContainer.replaceChildren(status);
  console.error(error);
}
