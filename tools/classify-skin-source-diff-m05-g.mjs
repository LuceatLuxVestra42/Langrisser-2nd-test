import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export function classifySkinSnapshotDiff(before, after) {
  if (!before || !after || !Array.isArray(before.records) || !Array.isArray(after.records)
    || !before.snapshot || !after.snapshot) throw new Error('Skin Snapshot Diff requires two versioned record sets');
  const rows = (snapshot) => {
    const map = new Map();
    for (const row of snapshot.records) {
      if (!Number.isSafeInteger(row.skinId) || map.has(row.skinId)) throw new Error('Invalid or duplicate Source Skin identity in Snapshot');
      map.set(row.skinId, row);
    }
    return map;
  };
  const oldRows = rows(before), newRows = rows(after), changes = [];
  for (const [skinId, row] of newRows) {
    if (row.verificationStatus === 'UNVERIFIABLE') changes.push({ skinId, classification: 'UNVERIFIABLE_RECORD_REVIEW' });
    else if (!oldRows.has(skinId)) changes.push({ skinId, classification: 'NEW_CLAIM_CANDIDATE' });
    else if (JSON.stringify(oldRows.get(skinId)) !== JSON.stringify(row)) changes.push({ skinId, classification: 'CHANGED_CLAIM_REVIEW' });
  }
  for (const skinId of oldRows.keys()) if (!newRows.has(skinId)) changes.push({ skinId, classification: 'MISSING_RECORD_REVIEW' });
  const snapshotChanged = before.snapshot.commit !== after.snapshot.commit || before.snapshot.version !== after.snapshot.version;
  return { schemaVersion: 1, mode: 'READ_ONLY_CANDIDATE_CLASSIFICATION', snapshotChanged, changes: changes.sort((a, b) => a.skinId - b.skinId) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const fs = await import('node:fs/promises');
  const source = process.argv[2];
  if (!source) throw new Error('Usage: node tools/classify-skin-source-diff-m05-g.mjs <fixture.json>');
  const data = JSON.parse(await fs.readFile(source, 'utf8'));
  process.stdout.write(`${JSON.stringify(classifySkinSnapshotDiff(data.before, data.after), null, 2)}\n`);
}
