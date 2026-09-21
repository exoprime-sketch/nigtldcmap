// Bind the map's sourceIndicatorId to the supplied publisher metadata.
// This reads delivery assets; it does not scrape or infer an organisation.
import { readFileSync, writeFileSync } from 'node:fs';
const layers = JSON.parse(readFileSync('public/data/vietnam/v2/map-index.json','utf8')).layers;
const sources = {};
for (const layer of layers) {
  const data = JSON.parse(readFileSync(`public/data/vietnam/v2/downloads/${layer.elementId.toLowerCase()}.json`, 'utf8'));
  const spatial = layer.dataUrl ? JSON.parse(readFileSync(`public${layer.dataUrl}`, 'utf8')) : null;
  const used = new Set(spatial ? [...spatial.values, ...(spatial.valueTable?.series || [])].map(r=>r.sourceIndicatorId) : data.entities.map(r=>r.indicatorId));
  for (const item of data.indicators || []) if (used.has(item.indicatorId) && item.sourceOrg) sources[item.indicatorId] = item.sourceOrg;
}
writeFileSync('src/data/map/mapSourcesV148.json', JSON.stringify(sources, null, 2)+'\n');
console.log(`${Object.keys(sources).length} source-indicator bindings`);
