// Stable publication dates: the last committed data-file change, not a
// forecast year and not the date a code-only build happened.
const fs = require('node:fs');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const catalog = require('../../public/data/vietnam/v2/catalog.json');
const index = require('../../public/data/vietnam/v2/map-index.json');
const manifest = require('../../public/data/vietnam/v2/manifest.json');
const path = require('node:path');
const target = path.resolve(__dirname, '../../src/data/datasetDirectoryV149.json');
const old = fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8')) : [];
let history = '';
try { history = cp.execFileSync('git', ['log', '--format=@%cI', '--name-only', '--', 'public/data/vietnam/v2/downloads'], {encoding:'utf8', maxBuffer: 20e6}); } catch { /* Archive builds retain the committed directory. */ }
const dates = new Map();
let date;
for (const line of history.split(/\r?\n/)) {
  if (line.startsWith('@')) date = line.slice(1);
  const id = line.match(/downloads\/([a-e]-\d{3})\.(json|csv)$/i)?.[1]?.toUpperCase();
  if (id && date && !dates.has(id)) dates.set(id, date);
}
const mapIds = new Set(index.layers.filter(l => l.enabled !== false).map(l => l.elementId));
const result = catalog.elements.map(item => {
  const hash = crypto.createHash('sha256').update(JSON.stringify(item.downloadAssets?.map(a => a.sha256) || item)).digest('hex');
  const previous = old.find(o => o.elementId === item.elementId);
  // No-data items use the publication snapshot date; unknown dates remain null.
  const updatedAt = dates.get(item.elementId) || previous?.updatedAt || manifest.generatedAt || null;
  return {elementId: item.elementId, updatedAt, map: mapIds.has(item.elementId), fingerprint: hash};
});
const text = JSON.stringify(result, null, 2) + '\n';
if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== text) fs.writeFileSync(target, text);
console.log(`dataset directory: ${result.length} items, ${mapIds.size} map items`);
