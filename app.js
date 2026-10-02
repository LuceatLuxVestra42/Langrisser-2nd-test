const container = document.querySelector('#heroes');
const spSoldierContainer = document.querySelector('#sp-soldiers');
const jobGlossaryContainer = document.querySelector('#job-glossary');

function addHero(hero) {
  const article = document.createElement('article');
  article.className = 'hero-card';

  const image = document.createElement('img');
  image.className = 'hero-portrait';
  image.src = new URL(hero.portrait, document.baseURI).href;
  image.alt = `${hero.nameEng} 초상화`;
  image.loading = 'lazy';

  const details = document.createElement('div');
  details.className = 'hero-details';
  const name = document.createElement('h2');
  name.textContent = hero.nameEng;
  const id = document.createElement('p');
  id.className = 'hero-id';
  id.textContent = `영웅 ID ${hero.id}`;

  details.append(name, id);
  const connections = document.createElement('ul');
  connections.className = 'job-connections';
  connections.setAttribute('aria-label', `${hero.nameEng}의 전직 연결과 한국어 표시명`);
  for (const relation of hero.jobConnections) {
    const item = document.createElement('li');
    item.textContent = `연결 ${relation.connectionId} → ${relation.jobNameKo} (전직 ID ${relation.jobId})`;
    connections.append(item);
  }
  article.append(image, details);
  article.append(connections);
  container.append(article);
}

try {
  const response = await fetch('./generated/hero-slice.v1.json');
  if (!response.ok) throw new Error(`Generated data request failed (${response.status})`);
  const data = await response.json();
  if (data.schemaVersion !== 1 || !Array.isArray(data.heroes)) throw new Error('Unsupported generated data');
  container.replaceChildren();
  for (const hero of data.heroes) addHero(hero);
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
  article.append(heading, normal, stats);
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
