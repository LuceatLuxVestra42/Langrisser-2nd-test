// The full-detail consumers own the original Hero 15 population, including shared Template 41.
const templates = [14, 12, 37, 40, 41];
const levels = new Set([
  66, 67, 68, 69, 70, 10066, 10067, 10068, 10069, 10070,
  56, 57, 58, 59, 60, 10056, 10057, 10058, 10059, 10060,
  181, 182, 183, 184, 185, 10181, 10182, 10183, 10184, 10185,
  196, 197, 198, 199, 200, 10196, 10197, 10198, 10199, 10200,
  201, 202, 203, 204, 205, 10201, 10202, 10203, 10204, 10205,
]);

export function lianaCastingInput(path, document) {
  let records, sourceOrder;
  let scope = document.scope;
  switch (path) {
    case 'canonical/hero-casting-law-template-references.v1.json':
      records = document.records.filter(row => row.heroId === 15);
      scope = scope.replace('Hero 15 and 16 explicit', 'Hero 15 explicit');
      break;
    case 'canonical/casting-law-template-raw-details.v1.json':
      records = document.records.filter(row => templates.includes(row.templateId));
      break;
    case 'canonical/casting-law-template-level-references.v1.json':
      records = document.records.filter(row => templates.includes(row.templateId));
      sourceOrder = document.sourceOrder.filter(id => templates.includes(id));
      break;
    case 'canonical/casting-law-levelup-raw-details.v1.json':
      records = document.records.filter(row => levels.has(row.levelUpInfoId));
      sourceOrder = document.sourceOrder.filter(id => levels.has(id));
      scope = scope.replace('ID and LevelUpGoldCost; Name only for the original 50 records', 'ID, Name, LevelUpGoldCost');
      break;
    default:
      return document;
  }
  return { ...document, scope, records, ...(sourceOrder && { sourceOrder }) };
}
