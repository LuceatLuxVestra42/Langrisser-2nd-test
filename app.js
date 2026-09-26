const container = document.querySelector('#heroes');

function addHero(hero) {
  const article = document.createElement('article');
  article.className = 'hero-card';

  const image = document.createElement('img');
  image.className = 'hero-portrait';
  image.src = new URL(hero.portrait, document.baseURI).href;
  image.alt = `${hero.nameEng} portrait`;
  image.loading = 'lazy';

  const details = document.createElement('div');
  details.className = 'hero-details';
  const name = document.createElement('h2');
  name.textContent = hero.nameEng;
  const id = document.createElement('p');
  id.className = 'hero-id';
  id.textContent = `Hero ID ${hero.id}`;

  details.append(name, id);
  article.append(image, details);
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
  status.textContent = 'Hero data could not be loaded.';
  container.replaceChildren(status);
  console.error(error);
}
