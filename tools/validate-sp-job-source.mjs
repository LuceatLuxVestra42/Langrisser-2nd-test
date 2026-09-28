import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourcePath = 'evidence/localization/source/sp-job-names-ko.v1.txt';
const manifestPath = 'evidence/localization/source/sp-job-names-ko.source-manifest.v1.json';
const expectedHeader = ['전직ID', '중국명', '한국명'];
const expectedStatusOnly = [
  { id: '1220', cnName: '魔导圣兽', krField: '한섭 미실장' },
  { id: '20243', cnName: '无上极剑', krField: '한섭 미실장' },
  { id: '20707', cnName: '初绽的圣约', krField: '한섭 미실장' }
];
const read = (path) => readFile(resolve(process.cwd(), path));
const check = (condition, message) => {
  if (!condition) throw new Error(`SP source preservation validation failed: ${message}`);
};

const [sourceBytes, manifestBytes] = await Promise.all([read(sourcePath), read(manifestPath)]);
let manifest;
try {
  manifest = JSON.parse(manifestBytes.toString('utf8'));
} catch {
  throw new Error('SP source preservation validation failed: manifest is not valid JSON');
}
check(manifest.repoPreservedPath === sourcePath, 'manifest preserved path mismatch');
check(manifest.originalProjectSourceName === 'SP전직명.txt', 'original project source filename mismatch');
check(manifest.sourceSha256 === createHash('sha256').update(sourceBytes).digest('hex'), 'source SHA-256 mismatch');
check(manifest.schemaVersion === 1, 'unsupported manifest schemaVersion');
check(manifest.sourceName === 'sp-job-names-ko.v1.txt', 'sourceName mismatch');
check(manifest.format === 'UTF-8 tab-separated text', 'format metadata mismatch');
check(manifest.encoding === 'UTF-8' && manifest.delimiter === 'TAB', 'encoding/delimiter metadata mismatch');
check(JSON.stringify(manifest.header) === JSON.stringify(expectedHeader), 'manifest header metadata mismatch');
check(manifest.idField === '전직ID' && manifest.cnNameField === '중국명' && manifest.krNameField === '한국명', 'manifest field metadata mismatch');
check(manifest.recordCount === 25, 'manifest recordCount must be 25');

let text;
try {
  text = new TextDecoder('utf-8', { fatal: true }).decode(sourceBytes);
} catch {
  throw new Error('SP source preservation validation failed: source is not valid UTF-8');
}
check(!text.startsWith('\uFEFF'), 'unexpected UTF-8 BOM');
const lines = text.split(/\r?\n/);
if (lines.at(-1) === '') lines.pop();
const header = (lines.shift() ?? '').split('\t');
check(JSON.stringify(header) === JSON.stringify(expectedHeader), 'source header mismatch');
check(lines.length === 25, `record count is ${lines.length}; expected 25`);

const seenIds = new Set();
const records = [];
for (const [index, line] of lines.entries()) {
  const fields = line.split('\t');
  check(fields.length === 3, `row ${index + 2} must have exactly 3 columns`);
  const [id, cnName, krField] = fields;
  check(/^\d+$/.test(id), `row ${index + 2} has malformed ID`);
  check(!seenIds.has(id), `duplicate source ID ${id}`);
  seenIds.add(id);
  check(cnName.trim() !== '', `row ${index + 2} has blank CN name`);
  check(krField.trim() !== '', `row ${index + 2} has blank KR field`);
  records.push({ id, cnName, krField });
}
const actualStatusOnly = records.filter((row) => row.krField === '한섭 미실장');
check(JSON.stringify(actualStatusOnly) === JSON.stringify(expectedStatusOnly), 'status-only rows differ from the preserved source contract');
check(JSON.stringify(manifest.statusOnlyRows) === JSON.stringify(expectedStatusOnly), 'manifest status-only rows mismatch');
check(records.length - actualStatusOnly.length === 22, 'expected 22 non-status KR text rows');

process.stdout.write('SP source preservation: PASS (25 UTF-8 TSV rows; source integrity only)\n');
