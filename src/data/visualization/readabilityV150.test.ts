import { test, expect } from "@jest/globals";
import descriptions from './datasetDescriptionsV150.json';
import { fitMapPanelsV150 } from '../../hooks/useResizableMapPanelsV129';
import { PROVINCE_KO_V150, polygonLabelPointV150 } from '../map/mapBackdropV150';

test('152 descriptions are concise phrases, with unique dataset coverage', () => {
  expect(Object.keys(descriptions)).toHaveLength(152);
  for (const [id, text] of Object.entries(descriptions)) {
    expect(id).toMatch(/^[A-E]-\d{3}$/);
    expect(text.length).toBeGreaterThan(5);
    expect(text.length).toBeLessThanOrEqual(70);
    expect(text).not.toMatch(/습니다|확인할 수|제공합니다/);
  }
});
test('panel widths are not capped at 460/520, but fit the viewport', () => {
  for (const priority of ['left', 'right'] as const) {
    const fit = fitMapPanelsV150(1920, 1600, 1600, true, true, priority);
    expect(fit[priority]).toBeGreaterThan(1000);
    expect(fit.left + fit.right + 224).toBeLessThanOrEqual(1920);
    expect(Math.min(fit.left, fit.right)).toBeGreaterThanOrEqual(120);
  }
  expect(fitMapPanelsV150(1440, 120, 120, true, true)).toEqual({left:120,right:120});
  expect(fitMapPanelsV150(1440, 600, 600, false, false)).toEqual({left:64,right:64});
});
test('Korean labels cover the 63-unit geography and use geographic anchors', () => {
  expect(Object.keys(PROVINCE_KO_V150)).toHaveLength(63);
  expect(Object.values(PROVINCE_KO_V150).every(value => /^[가-힣]+$/.test(value))).toBe(true);
  expect(polygonLabelPointV150({type:'Polygon', coordinates:[[[0,0],[2,0],[2,2],[0,2],[0,0]]]})).toEqual([1,1]);
  expect(polygonLabelPointV150({type:'Polygon', coordinates:[[]]})).toBeNull();
});
