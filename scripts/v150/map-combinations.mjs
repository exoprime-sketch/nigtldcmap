// V150 removes recommended-analysis buttons. These fixtures retain regression
// coverage of the same layer combinations through the supported shared URL.
// Real checkbox selection is covered independently by map-presets.spec.ts.
import { readFileSync } from 'node:fs';
import { evaluateValue, navigate, waitForValue } from '../v125/browser-runtime.mjs';
const layers = JSON.parse(readFileSync(new URL('../../public/data/vietnam/v2/map-index.json', import.meta.url))).layers;
export const COMBINATIONS_V150 = {
  POWER_INFRASTRUCTURE: ['A-024', 'A-023'],
  RENEWABLE_PLANNING: ['C-016', 'A-024', 'A-023'],
  FOREST_CHANGE: ['B-033', 'B-031', 'B-034'],
  CLIMATE_VULNERABILITY: ['B-021', 'D-008', 'D-018'],
  CLIMATE_FINANCE_PROJECTS: ['D-018', 'C-025'],
};
export function combinationUrlV150(base, id) {
  const ids = COMBINATIONS_V150[id];
  if (!ids) throw new Error('Unknown combination ' + id);
  const url = new URL(base); url.search = ''; url.hash = 'map';
  const selectors = {};
  for (const elementId of ids) {
    const layer = layers.find(item => item.elementId === elementId);
    if (!layer) throw new Error('Missing layer ' + elementId);
    selectors[elementId] = {variable: layer.selectors.defaultVariable, period: layer.selectors.defaultPeriod};
  }
  for (const [key,value] of Object.entries({country:'VNM',layers:ids.join(','),primaryLayer:ids[0],focusLayer:ids[0],contextLayers:ids.slice(1).join(','),mapPreset:id,mapSelectors:JSON.stringify(selectors)})) url.searchParams.set(key,value);
  return url.toString();
}
export async function selectCombinationV150(cdp, id) {
  const base = await evaluateValue(cdp, 'location.href');
  await navigate(cdp, combinationUrlV150(base,id));
  await waitForValue(cdp, `document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') === ${JSON.stringify(COMBINATIONS_V150[id][0])}`, {timeoutMs:35000});
  return true;
}
