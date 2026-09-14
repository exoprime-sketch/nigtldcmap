#!/usr/bin/env node
/**
 * Map QA against the candidate build.
 *
 * The point of this script is to establish that the object under the pointer is
 * the object the popup names and the object the right-hand panel then describes,
 * and that its value matches what the candidate data says it should be. Nothing
 * here treats the existence of a canvas, or the successful dispatch of a click,
 * as evidence of anything.
 *
 * Expected targets come from the candidate's own data files, never from the
 * screen's computation of them. Feature identity and screen position come from
 * MapLibre through a read-only observer the app attaches on localhost only.
 *
 * What changed in this pass (Stage 4 continuation §1):
 *   A. Variable and period are chosen through the control by pointer and arrow
 *      key. The prototype .value setter and the synthesised change event are
 *      gone, so a selection this script reports was actually made by input.
 *   B. Every wait is bounded polling on the thing being waited for - the new
 *      data scope rendered, the popup for this feature, the panel naming this
 *      record - and reports how long it took. No fixed sleep decides a verdict.
 *   C. The expected value is compared against the field it is designed to
 *      appear in, by whole numeric token. A number found elsewhere on the panel
 *      is reported as OUTSIDE_DESIGNED_FIELD, not as a match, and 63 can no
 *      longer match inside 631,219.
 *   D. Identity is the stable record key the popup and panel now carry. Two
 *      facilities sharing a name are no longer the same target.
 *   E. The popup left over from the previous probe is cleared and its absence
 *      confirmed before the next hover, so a stale popup cannot be read as the
 *      new one. Two selections that legitimately hold the same number are not
 *      failed for holding it.
 *   F. When every point that lands on a feature is covered, the script tries
 *      the recovery a reader has - collapsing the panel, panning, zooming - and
 *      records which one worked. An initial coordinate behind a panel and a
 *      feature that cannot be reached at all are reported differently.
 */

import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";

import {
  startStaticBuildServer,
  launchHeadlessBrowser,
  navigate,
  evaluateValue,
  setViewport,
} from "./v125/browser-runtime.mjs";
import {
  MapQaError,
  READ_SURFACES,
  clickSelector,
  elementPoint,
  identityOf,
  locateExpectedValue,
  mouse,
  pointerClick,
  pointerDrag,
  collapseLayerList,
  ensureControlReachable,
  numericTokens,
  openLayerList,
  pollUntil,
  selectOptionByRealInput,
  sleep,
  tokenCarriesValue,
  wheelZoom,
  json,
} from "./v137/map-qa-input.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, opt("--build-root", ".verify/candidate/build"));
const DATA = resolve(BUILD, "data/vietnam/v2");
const OUT = resolve(ROOT, opt("--out", "reports/final-data-integration/map-qa"));
const WIDTH = Number(opt("--width", "1440"));
const HEIGHT = Number(opt("--height", "1000"));
const ONLY = (opt("--only", "") || "").split(",").map((s) => s.trim()).filter(Boolean);

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");

/* ------------------------------------------------------------------ *
 * Expected targets, taken from the candidate data
 * ------------------------------------------------------------------ */

function packRecords() {
  const dir = resolve(DATA, "packs");
  const byElement = new Map();
  for (const file of readdirSync(dir).filter((n) => n.startsWith("vnm-v124-pack-"))) {
    const envelope = readJson(resolve(dir, file));
    const payload = JSON.parse(
      gunzipSync(Buffer.from(envelope.payloadChunks.join(""), "base64")).toString("utf8")
    );
    for (const elementId of payload.elementIds || []) {
      byElement.set(
        elementId,
        ((payload.elements[elementId] || {}).entities || {}).records || []
      );
    }
  }
  return byElement;
}

const mapLayers = () => readJson(resolve(DATA, "map-index.json")).layers || [];

/**
 * One target for every layer the map publishes, taken from the candidate data.
 *
 * A layer's own contract says which source attribute holds each fact it shows,
 * so the value under test and the field label it belongs under both come from
 * the layer rather than from a list written here. Only the geometry-specific
 * ways of finding a first feature differ.
 */
function buildExpectedTargets() {
  const packs = packRecords();
  const targets = [];

  for (const layer of mapLayers()) {
    const target = targetForLayer(layer, packs);
    if (target) targets.push(target);
    else targets.push({
      elementId: layer.elementId,
      geometryKind: rendererKind(layer),
      status: "NO_TARGET_BUILT",
      expectedSource: "candidate data carried no first feature for this layer",
    });
  }
  return ONLY.length ? targets.filter((t) => ONLY.includes(t.elementId)) : targets;
}

function rendererKind(layer) {
  const renderer = String(layer.renderer || layer.mapMode || "");
  if (renderer.includes("choropleth")) return "polygon";
  if (renderer === "regional-scope") return "regional-scope";
  if (renderer === "line") return "line";
  return "point";
}

/** The first published fact of this layer, and the label it appears under. */
function firstFact(layer, attributes) {
  for (const fact of layer.factFields || []) {
    for (const key of fact.sources || []) {
      const value = attributes[key];
      if (value === null || value === undefined) continue;
      if (typeof value === "string" && value.trim() === "") continue;
      const mapped = fact.valueMap ? fact.valueMap[String(value).trim().toLowerCase()] : null;
      return { fact, value: mapped ?? value };
    }
  }
  return null;
}

function targetForLayer(layer, packs) {
  const elementId = layer.elementId;
  const kind = rendererKind(layer);

  if (kind === "polygon") {
    const path = resolve(DATA, `spatial/layers/${elementId.toLowerCase()}.json`);
    if (!existsSync(path)) return null;
    const document = readJson(path);
    const wanted = document.selectors?.defaultVariable;
    const period = document.selectors?.defaultPeriod;
    const first =
      (document.values || []).find(
        (row) => row.variable === wanted && String(row.period) === String(period)
      ) || (document.values || [])[0];
    if (!first) return null;
    return {
      elementId,
      geometryKind: "polygon",
      expectedKey: first.adm1Code,
      expectedName: first.adm1Name,
      expectedValue: first.value,
      expectedUnit: first.unit,
      expectedPeriod: first.period,
      expectedVariableLabel: first.variableLabel,
      designedLabels: [first.variableLabel, "값"],
      expectedSource: `spatial/layers/${elementId.toLowerCase()}.json`,
      // Province names are unique within ADM1, and the panel carries the code.
      nameIsAmbiguous: false,
    };
  }

  if (kind === "line") {
    const path = resolve(DATA, "geometry/vnm-transmission-network.geojson");
    if (!existsSync(path)) return null;
    const feature = (readJson(path).features || [])[0];
    if (!feature) return null;
    const properties = feature.properties || {};
    const chosen = firstFact(layer, properties);
    return {
      elementId,
      geometryKind: "line",
      expectedKey: properties.featureId,
      expectedName: properties.featureId,
      expectedValue: properties.lengthKm ?? null,
      expectedUnit: properties.lengthUnit ?? "km",
      expectedPeriod: String(layer.sourceYear ?? ""),
      expectedVariableLabel: null,
      designedLabels: ["확인된 길이", "길이", "선로 길이"],
      expectedVoltage: chosen ? String(chosen.value) : "",
      expectedSource: "geometry/vnm-transmission-network.geojson",
      nameIsAmbiguous: false,
    };
  }

  if (kind === "regional-scope") {
    const path = resolve(DATA, "spatial/projects/d-018-regional.geojson");
    if (!existsSync(path)) return null;
    const feature = (readJson(path).features || []).find(
      (item) => (item.properties || {}).geometryRole === "activity-site"
    );
    if (!feature) return null;
    const properties = feature.properties || {};
    return {
      elementId,
      geometryKind: "regional-scope",
      expectedKey: String(feature.id || ""),
      expectedName: String(properties.activitySiteLabel || properties.projectTitle || ""),
      expectedValue: properties.activitySiteLabel ?? null,
      expectedUnit: null,
      expectedPeriod: null,
      expectedVariableLabel: null,
      designedLabels: ["사업 참여지역", "세부 활동지역", "활동지역"],
      expectedSource: "spatial/projects/d-018-regional.geojson",
      nameIsAmbiguous: false,
    };
  }

  // Facility points. The value under test is the first fact the layer's own
  // contract publishes - a mine's 광종, a plant's 발전원, a project's 등록표준.
  const records = packs.get(elementId) || [];
  const record = records.find(
    (r) => r.mapEligible && Number.isFinite(r.latitude) && Number.isFinite(r.longitude)
  );
  if (!record) return null;
  const chosen = firstFact(layer, record.normalizedAttributes || {});
  const sameName = records.filter((r) => r.name === record.name).length;
  return {
    elementId,
    geometryKind: "point",
    expectedKey: record.recordId,
    expectedName: record.name,
    expectedValue: chosen ? chosen.value : null,
    expectedUnit: chosen?.fact.unit ?? null,
    expectedPeriod: null,
    expectedVariableLabel: null,
    designedLabels: chosen ? [chosen.fact.label] : [],
    expectedLngLat: [record.longitude, record.latitude],
    expectedSource: chosen
      ? `packs entity ${elementId} · ${chosen.fact.sources.join("|")}`
      : `packs entity ${elementId}`,
    nameIsAmbiguous: sameName > 1,
  };
}

/* ------------------------------------------------------------------ *
 * Browser-side reads
 * ------------------------------------------------------------------ */

const OBSERVER_PRESENT = `Boolean(window.__nigtMapObserverV137)`;
const OBSERVER_READY = `Boolean(window.__nigtMapObserverV137 && window.__nigtMapObserverV137.ready())`;
const CAMERA = `(() => { const o = window.__nigtMapObserverV137; return o && o.camera ? o.camera() : null; })()`;

/**
 * Wait until the camera has stopped, not just until the tiles have loaded.
 *
 * Selecting a dataset starts a fitBounds, and ready() can be true while it is
 * still easing. A screen point resolved during that ease is stale by the time
 * the pointer arrives, which is why one run hovered a point resolved for one
 * province and read its neighbour's value.
 */
async function waitForStillCamera(cdp, timeoutMs = 12000) {
  let previous = null;
  const settled = await pollUntil(
    async () => {
      const camera = await evaluateValue(cdp, CAMERA);
      const same =
        camera &&
        previous &&
        !camera.moving &&
        camera.zoom === previous.zoom &&
        camera.lng === previous.lng &&
        camera.lat === previous.lat;
      previous = camera;
      return same ? camera : null;
    },
    (value) => Boolean(value),
    { timeoutMs, intervalMs: 150, label: "camera still" }
  );
  return settled.ok ? "STILL" : "STILL_MOVING";
}

const read = (cdp) => evaluateValue(cdp, READ_SURFACES);

async function waitFor(cdp, expression, timeoutMs, label) {
  const outcome = await pollUntil(
    () => evaluateValue(cdp, expression),
    (value) => Boolean(value),
    { timeoutMs, intervalMs: 250, label }
  );
  if (!outcome.ok) throw new MapQaError(`TIMEOUT_WAITING_FOR ${label}`);
  return outcome.value;
}

/**
 * What the layer is rendering right now, as one comparable value.
 *
 * A choropleth states its variable and period on every feature, but a line
 * layer's selector is a voltage filter: the features carry no variable, so
 * comparing one feature's properties before and after reported "no change"
 * even though the layer had re-filtered from 606 segments to the 110 kV subset.
 * The signature is what the layer draws, not what one feature says.
 */
const renderedSignature = (elementId) => `(() => {
  const o = window.__nigtMapObserverV137;
  if (!o) return null;
  const list = o.renderedFeatures(${json(elementId)});
  const facets = new Set();
  list.forEach((f) => {
    const p = f.properties || {};
    facets.add([p.variable, p.period, p.voltageKv || p.voltage, p.status].join("|"));
  });
  return { count: list.length, facets: [...facets].sort().slice(0, 12).join(" ") };
})()`;

const renderedFeatureFor = (elementId, selectionKey) => `(() => {
  const o = window.__nigtMapObserverV137;
  if (!o) return null;
  const hit = o.renderedFeatures(${json(elementId)})
    .find((f) => f.selectionKey === ${json(selectionKey)});
  if (!hit) return null;
  const p = hit.properties || {};
  return {
    selectionKey: hit.selectionKey,
    name: hit.name,
    geometryType: hit.geometryType,
    variable: p.variable === undefined ? null : String(p.variable),
    period: p.period === undefined ? null : String(p.period),
    value: p.value === undefined ? null : p.value,
    unit: p.unit === undefined ? null : String(p.unit),
    variableLabel: p.variableLabel === undefined ? null : String(p.variableLabel),
    propertyNames: Object.keys(p)
  };
})()`;

/** Clear a popup left over from the previous probe, and confirm it is gone. */
async function clearPopup(cdp, canvas) {
  await mouse(cdp, "mouseMoved", canvas.left + 3, canvas.top + 3);
  const gone = await pollUntil(
    () => evaluateValue(cdp, `Boolean(document.querySelector('[data-testid="map-hover-popup-v133"]'))`),
    (present) => present === false,
    { timeoutMs: 3000, label: "previous popup cleared" }
  );
  return gone.ok;
}

/* ------------------------------------------------------------------ *
 * Reaching a covered feature the way a reader would
 * ------------------------------------------------------------------ */

/**
 * Zoom in on where the source says the facility is.
 *
 * A-023 clusters its 1,889 plants, so at the opening zoom the individual point
 * is not on screen at all; C-025 draws 262 points close enough together that
 * one sits under another. In both cases a reader zooms in. Each step is a real
 * wheel gesture at the facility's own projected position.
 */
async function zoomTowards(cdp, target, until, steps = 14) {
  const [lng, lat] = target.expectedLngLat;
  for (let step = 1; step <= steps; step += 1) {
    const at = await evaluateValue(
      cdp,
      `(() => { const o = window.__nigtMapObserverV137;
        return o && o.project ? o.project(${lng}, ${lat}) : null; })()`
    );
    if (!at) return "NO_PROJECTION";
    // A-023 clusters up to zoom 13 and the opening view is zoom 5.2, so a
    // gentle wheel step would need forty gestures to break the cluster. This is
    // still one wheel gesture per step, just a decisive one.
    await wheelZoom(cdp, at.x, at.y, -900);
    await sleep(450);
    await pollUntil(
      () => evaluateValue(cdp, OBSERVER_READY),
      (value) => value === true,
      { timeoutMs: 15000, intervalMs: 200, label: "map ready after zoom" }
    );
    await waitForStillCamera(cdp, 6000);
    if (await until()) return `ZOOMED_IN_${step}_STEPS`;
  }
  return `NOT_REACHED_AFTER_${steps}_ZOOM_STEPS`;
}

const isRendered = (cdp, target) => async () =>
  Boolean(
    await evaluateValue(
      cdp,
      renderedFeatureFor(target.elementId, String(target.expectedKey || ""))
    )
  );

const PANEL_TOGGLE = '.cdp-map-evidence .cdp-map-panel-toggle';
const LEGEND_TOGGLE = '[data-testid="map-legend-toggle-v137"]';

async function hitPoint(cdp, elementId, selectionKey) {
  return evaluateValue(
    cdp,
    `(() => { const o = window.__nigtMapObserverV137;
      return o ? o.hitPointFor(${json(elementId)}, ${json(selectionKey)}) : null; })()`
  );
}

/**
 * A point on this feature that no panel covers, using only what a reader can
 * do. Each step is recorded, so "it was behind the panel until the panel was
 * collapsed" never gets reported the same way as "it could not be reached".
 */
async function reachableHitPoint(cdp, elementId, selectionKey) {
  const trail = [];
  let point = await hitPoint(cdp, elementId, selectionKey);
  if (!point) return { point: null, trail, recovery: "NO_POINT_ON_FEATURE" };
  trail.push({ step: "initial", occludedBy: point.occludedBy || null });
  if (!point.occludedBy) return { point, trail, recovery: "NONE_NEEDED" };

  const canvas = await evaluateValue(
    cdp,
    `(() => { const o = window.__nigtMapObserverV137; return o ? o.canvasRect() : null; })()`
  );

  // 1. Collapse whatever the reader can collapse: the legend, then the panel.
  for (const [name, selector] of [["legend", LEGEND_TOGGLE], ["panel", PANEL_TOGGLE]]) {
    const spot = await elementPoint(cdp, evaluateValue, selector);
    if (!spot) {
      trail.push({ step: `collapse:${name}`, result: "NO_CONTROL" });
      continue;
    }
    await pointerClick(cdp, spot.x, spot.y);
    await sleep(350);
    point = await hitPoint(cdp, elementId, selectionKey);
    trail.push({
      step: `collapse:${name}`,
      result: point ? point.occludedBy || "REACHABLE" : "FEATURE_GONE",
    });
    if (point && !point.occludedBy) return { point, trail, recovery: `COLLAPSED_${name.toUpperCase()}` };
  }

  // 2. Pan the covered point toward the middle of the canvas.
  if (point && canvas) {
    const centre = { x: canvas.left + canvas.width / 2, y: canvas.top + canvas.height * 0.4 };
    const from = { x: canvas.left + canvas.width * 0.55, y: canvas.top + canvas.height * 0.55 };
    const to = { x: from.x + (centre.x - point.x), y: from.y + (centre.y - point.y) };
    await pointerDrag(cdp, from, to);
    await sleep(600);
    await waitFor(cdp, OBSERVER_READY, 20000, "map settled after pan");
    point = await hitPoint(cdp, elementId, selectionKey);
    trail.push({ step: "pan", result: point ? point.occludedBy || "REACHABLE" : "FEATURE_GONE" });
    if (point && !point.occludedBy) return { point, trail, recovery: "PANNED" };
  }

  // 3. Zoom in on it.
  if (point && canvas) {
    await wheelZoom(cdp, point.x, point.y, -240);
    await sleep(600);
    await waitFor(cdp, OBSERVER_READY, 20000, "map settled after zoom");
    point = await hitPoint(cdp, elementId, selectionKey);
    trail.push({ step: "zoom", result: point ? point.occludedBy || "REACHABLE" : "FEATURE_GONE" });
    if (point && !point.occludedBy) return { point, trail, recovery: "ZOOMED" };
  }

  return { point, trail, recovery: "UNREACHABLE_AFTER_RECOVERY" };
}

/* ------------------------------------------------------------------ *
 * One target
 * ------------------------------------------------------------------ */

async function reviewTarget(cdp, base, target, shots, progress = {}) {
  const row = {
    elementId: target.elementId,
    geometryKind: target.geometryKind,
    expectedKey: target.expectedKey,
    expectedName: target.expectedName,
    expectedValue: target.expectedValue,
    expectedUnit: target.expectedUnit ?? "",
    expectedPeriod: target.expectedPeriod ?? "",
    expectedSource: target.expectedSource,
    renderer: "UNKNOWN",
    layerSelected: "NO",
    layerRendered: "NO",
    targetPresentInRender: "NO",
    hitPointResolved: "NO",
    occludedBy: "",
    stageReached: "start",
    cameraSettled: "NOT_CHECKED",
    zoomedToTarget: "",
    reachRecovery: "NOT_ATTEMPTED",
    reachTrail: "",
    layerListState: "",
    overlapChoices: "",
    overlapResolved: "",
    hoverPopupIdentifiesTarget: "NO",
    hoverIdentityBasis: "",
    hoverWaitMs: "",
    clickPanelIdentifiesTarget: "NO",
    clickIdentityBasis: "",
    clickWaitMs: "",
    hoverAndPanelAgree: "NO",
    expectedVariableSelected: "NOT_ATTEMPTED",
    expectedPeriodSelected: "NOT_ATTEMPTED",
    dataScopeReady: "NOT_CHECKED",
    controlChangedResult: "NOT_ATTEMPTED",
    expectedValueObserved: "NOT_CHECKED",
    expectedValueShown: "",
    expectedUnitObserved: "",
    expectedPeriodObserved: "",
    evidence: "NO",
    note: "",
  };
  const notes = [];
  const stage = (name) => {
    row.stageReached = name;
    progress.stage = name;
    // Everything verified before a later step fails is still evidence. Handing
    // the partial row out means a run that stumbles on the last control does
    // not throw away a confirmed hover, click and value.
    progress.row = row;
    return name;
  };
  stage("navigate");

  await navigate(cdp, `${base}/?view=map&country=VNM#map`);
  await waitFor(cdp, OBSERVER_PRESENT, 45000, "map observer");
  await waitFor(cdp, OBSERVER_READY, 45000, "map style + tiles");
  row.renderer = "MAPLIBRE";

  stage("select-layer");
  // 1. Select this dataset by its own element id, through the real control.
  //    Below 769px the list starts collapsed, so it is opened first - the way a
  //    reader would - rather than reporting its button as unhittable.
  row.layerListState = await openLayerList(cdp, evaluateValue);
  const button = `[data-testid="map-all-data-layer-v135"][data-element-id="${target.elementId}"]`;
  await clickSelector(cdp, evaluateValue, button);
  const pressed = await pollUntil(
    () =>
      evaluateValue(
        cdp,
        `(() => { const b = document.querySelector(${json(button)});
          return Boolean(b && b.getAttribute("aria-pressed") === "true"); })()`
      ),
    (value) => value === true,
    { timeoutMs: 20000, label: "layer aria-pressed" }
  );
  row.layerSelected = pressed.ok ? "YES" : "NO";

  stage("render-layer");
  // 2. The layer has to be rendered, not merely requested.
  const rendered = await pollUntil(
    () =>
      evaluateValue(
        cdp,
        `(() => { const o = window.__nigtMapObserverV137;
          return o ? o.renderedFeatures(${json(target.elementId)}).length : 0; })()`
      ),
    (count) => count > 0,
    { timeoutMs: 45000, intervalMs: 250, label: "rendered features" }
  );
  row.layerRendered = rendered.value > 0 ? "YES" : "NO";
  notes.push(`renderedFeatures=${rendered.value}`);
  if (!rendered.ok) {
    row.note = notes.join("; ");
    return row;
  }

  stage("find-target");
  // 3. The specific expected target has to be among what is rendered.
  let match = await evaluateValue(
    cdp,
    renderedFeatureFor(target.elementId, String(target.expectedKey || ""))
  );
  if (!match && target.expectedLngLat) {
    // A clustered layer collapses its points until the reader zooms in, and a
    // crowded one keeps a point under its neighbours. Zooming toward the
    // facility is what a reader does to reach it, so the run does it too and
    // records that it was needed.
    row.zoomedToTarget = await zoomTowards(cdp, target, isRendered(cdp, target));
    match = await evaluateValue(
      cdp,
      renderedFeatureFor(target.elementId, String(target.expectedKey || ""))
    );
  }
  if (!match) {
    notes.push("expected target not among rendered features");
    row.note = notes.join("; ");
    return row;
  }
  row.targetPresentInRender = "YES";
  notes.push(`matched ${match.selectionKey} (${match.geometryType})`);

  // 3b. Put the map on the variable and period the expected value belongs to,
  //     through the control, before comparing anything. B-034 renders 탄소
  //     저장량 by default while the expected row is 산림탄소 총배출(연평균):
  //     comparing without selecting it reads one variable and checks it against
  //     another.
  stage("choose-variable");
  // The variable and period controls live inside the dataset drawer, which the
  // narrow layout closes as soon as a dataset is chosen. A reader reopens it to
  // change the indicator and closes it again to see the map; so does this, and
  // the two steps are recorded rather than worked around.
  const controlsNeedList =
    target.expectedVariableLabel || target.expectedPeriod
      ? await ensureControlReachable(cdp, evaluateValue, '[data-testid="map-layer-variable-select"]')
      : "";
  if (controlsNeedList) row.layerListState = `${row.layerListState}>${controlsNeedList}`;
  if (target.expectedVariableLabel) {
    const outcome = await selectOptionByRealInput(
      cdp,
      evaluateValue,
      '[data-testid="map-layer-variable-select"]',
      (option) =>
        option.label === target.expectedVariableLabel ||
        option.label.includes(target.expectedVariableLabel)
    );
    row.expectedVariableSelected = outcome.result;
  }
  if (target.expectedPeriod && target.geometryKind === "polygon") {
    const outcome = await selectOptionByRealInput(
      cdp,
      evaluateValue,
      '[data-testid="map-layer-period-select"]',
      (option) => option.label.includes(String(target.expectedPeriod))
    );
    row.expectedPeriodSelected = outcome.result;
  }

  if (controlsNeedList === "REACHABLE_AFTER_OPENING_LIST") {
    row.layerListState = `${row.layerListState}>${await collapseLayerList(cdp, evaluateValue)}`;
  }

  stage("await-scope");
  // 3c. Wait for the data scope the selection asked for, not for a clock. The
  //     rendered feature itself carries the variable and period it was drawn
  //     from, so this waits on the change having happened.
  const wantsScope = Boolean(target.expectedVariableLabel || target.expectedPeriod);
  if (wantsScope) {
    const scope = await pollUntil(
      () => evaluateValue(cdp, renderedFeatureFor(target.elementId, String(target.expectedKey || ""))),
      (feature) => {
        if (!feature) return false;
        if (feature.variableLabel === null && feature.period === null) return true;
        const labelOk =
          !target.expectedVariableLabel ||
          (feature.variableLabel || "").includes(target.expectedVariableLabel);
        const periodOk =
          !target.expectedPeriod || String(feature.period || "") === String(target.expectedPeriod);
        return labelOk && periodOk;
      },
      { timeoutMs: 15000, label: "rendered data scope" }
    );
    row.dataScopeReady = scope.ok ? `YES_IN_${scope.waitedMs}MS` : `TIMEOUT_AFTER_${scope.waitedMs}MS`;
    if (scope.value) match = scope.value;
  }

  stage("find-hit-point");
  // 4. A screen point the renderer agrees is this feature, reached the way a
  //    reader would if a panel covers it.
  row.cameraSettled = await waitForStillCamera(cdp);
  //    At narrow widths the workspace stacks and the map sits below the list,
  //    so it is scrolled into view before any point on it is probed.
  await evaluateValue(
    cdp,
    `(() => {
      const el = document.querySelector("canvas.maplibregl-canvas");
      if (el) el.scrollIntoView({ block: "center", inline: "center" });
      return true;
    })()`
  );
  const canvas = await evaluateValue(
    cdp,
    `(() => { const o = window.__nigtMapObserverV137; return o ? o.canvasRect() : null; })()`
  );
  let reach = await reachableHitPoint(cdp, target.elementId, String(match.selectionKey));
  if (!reach.point && target.expectedLngLat) {
    // Rendered but never the topmost feature anywhere: a crowded point layer.
    // Zooming separates the neighbours, which is the reader's move as well.
    // Keep zooming until the feature is the topmost thing under a pointer,
    // which is what "reachable" means - not merely until it is drawn.
    const reachable = async () => {
      const found = await hitPoint(cdp, target.elementId, String(match.selectionKey));
      return Boolean(found && !found.occludedBy);
    };
    const outcome = await zoomTowards(cdp, target, reachable);
    row.zoomedToTarget = `${row.zoomedToTarget}${row.zoomedToTarget ? ">" : ""}${outcome}`;
    reach = await reachableHitPoint(cdp, target.elementId, String(match.selectionKey));
  }
  row.reachRecovery = reach.recovery;
  row.reachTrail = reach.trail
    .map((step) => `${step.step}=${step.result ?? step.occludedBy ?? "ok"}`)
    .join(" > ");
  if (!reach.point) {
    notes.push("no screen point resolves to this feature");
    row.note = notes.join("; ");
    return row;
  }
  const point = reach.point;
  row.hitPointResolved = "YES";
  row.occludedBy = point.occludedBy || "";

  stage("hover");
  // 5. Clear the previous popup, confirm it is gone, then hover exactly there
  //    and poll for the popup that names this feature.
  if (canvas) await clearPopup(cdp, canvas);
  await mouse(cdp, "mouseMoved", point.x, point.y);
  const hover = await pollUntil(
    () => read(cdp),
    (surfaces) => identityOf(surfaces.popup, target).identifies,
    { timeoutMs: 4000, label: "hover popup names target" }
  );
  const afterHover = hover.value;
  const hoverIdentity = identityOf(afterHover.popup, target);
  row.hoverPopupIdentifiesTarget = hoverIdentity.identifies ? "YES" : "NO";
  row.hoverIdentityBasis = hoverIdentity.by;
  row.hoverWaitMs = String(hover.waitedMs);
  if (afterHover.fallbackTooltip && !afterHover.popup) {
    row.renderer = "SVG_FALLBACK";
    notes.push("fallback tooltip only");
  }
  if (!hoverIdentity.identifies) {
    notes.push(`popup=${json(String(hoverIdentity.observed || "").slice(0, 90))}`);
  }

  // 5b. Where several features cross one pixel the app offers a picker instead
  //     of guessing. That is the reader's path to the one they meant, so the
  //     run takes it rather than reporting the popup as a failure.
  // An overlap popup is the app declining to guess, whatever its text happens
  // to contain. Reading the target's name inside a list of four choices is not
  // the map having identified it.
  if (afterHover.popup && /개 데이터/u.test(afterHover.popup.title || "")) {
    await pointerClick(cdp, point.x, point.y);
    const picked = await pollUntil(
      () =>
        evaluateValue(
          cdp,
          `(() => {
            const picker = document.querySelector('[data-testid="map-overlap-picker-v133"]');
            if (!picker) return null;
            return [...picker.querySelectorAll("button[data-map-element]")].map((b, i) => ({
              index: i,
              elementId: b.getAttribute("data-map-element"),
              text: (b.textContent || "").replace(/\\s+/gu, " ").trim()
            }));
          })()`
        ),
      (list) => Array.isArray(list) && list.length > 0,
      { timeoutMs: 4000, label: "overlap picker" }
    );
    row.overlapChoices = picked.ok
      ? picked.value.map((choice) => choice.text).join(" | ").slice(0, 240)
      : "NONE";
    const wanted = (picked.value || []).find(
      (choice) =>
        choice.elementId === target.elementId &&
        (choice.text.includes(String(target.expectedName || "")) ||
          choice.text.includes(String(target.expectedKey || "")))
    );
    if (wanted) {
      await clickSelector(
        cdp,
        evaluateValue,
        `[data-testid="map-overlap-picker-v133"] li:nth-child(${wanted.index + 1}) button`
      );
      const resolved = await pollUntil(
        () => read(cdp),
        (surfaces) => identityOf(surfaces.panel, target).identifies,
        { timeoutMs: 4000, label: "panel after overlap pick" }
      );
      row.overlapResolved = resolved.ok ? "PICKED_TARGET" : "PICKER_DID_NOT_RESOLVE";
      if (resolved.ok) {
        const picked = identityOf(resolved.value.popup, target);
        row.hoverPopupIdentifiesTarget = "YES";
        row.hoverIdentityBasis = `OVERLAP_PICKER:${picked.by}`;
      }
    } else {
      // The picker's own labels have to tell the choices apart; if none of them
      // names this feature, that is the defect, not a missing hover.
      row.overlapResolved = "TARGET_NOT_NAMED_IN_PICKER";
    }
  }

  stage("click");
  // 6. Click the same point and poll for the panel to name the same record.
  await pointerClick(cdp, point.x, point.y);
  const clicked = await pollUntil(
    () => read(cdp),
    (surfaces) => identityOf(surfaces.panel, target).identifies,
    { timeoutMs: 5000, label: "panel names target" }
  );
  const afterClick = clicked.value;
  const clickIdentity = identityOf(afterClick.panel, target);
  if (row.overlapResolved === "PICKED_TARGET" && !clickIdentity.identifies) {
    // The picker resolved it; a later plain click at the same overlapping spot
    // reopens the picker rather than selecting, which is the app behaving as
    // designed. The picker's own outcome is what counts here.
    const resolved = await pollUntil(
      () => read(cdp),
      (surfaces) => identityOf(surfaces.panel, target).identifies,
      { timeoutMs: 3000, label: "panel after overlap pick" }
    );
    if (resolved.ok) {
      const again = identityOf(resolved.value.panel, target);
      row.clickPanelIdentifiesTarget = "YES";
      row.clickIdentityBasis = `${again.by}_VIA_OVERLAP_PICKER`;
      Object.assign(afterClick, resolved.value);
    }
  }
  row.clickPanelIdentifiesTarget = clickIdentity.identifies ? "YES" : "NO";
  row.clickIdentityBasis = clickIdentity.by;
  row.clickWaitMs = String(clicked.waitedMs);
  row.hoverAndPanelAgree =
    row.hoverPopupIdentifiesTarget === "YES" && row.clickPanelIdentifiesTarget === "YES"
      ? "YES"
      : "NO";

  stage("compare-value");
  // 7. The value the candidate data says this target holds must appear in the
  //    field designed to hold it, with its unit and period.
  const located = locateExpectedValue(afterClick, {
    value: target.expectedValue,
    unit: target.expectedUnit,
    period: target.expectedPeriod,
    designedLabels: target.designedLabels,
  });
  row.expectedValueObserved = located.status;
  row.expectedValueShown = located.shown ? String(located.shown).slice(0, 120) : "";
  row.expectedUnitObserved = located.unitObserved === null || located.unitObserved === undefined
    ? ""
    : String(located.unitObserved);
  row.expectedPeriodObserved = located.periodObserved === null || located.periodObserved === undefined
    ? ""
    : String(located.periodObserved);
  if (located.status !== "MATCH_IN_DESIGNED_FIELD" && located.status !== "MATCH_IN_POPUP_FIELD") {
    notes.push(
      `value ${json(target.expectedValue)} ${located.status}` +
        (located.panelLabels ? `; panel labels=${json(located.panelLabels)}` : "")
    );
  }

  stage("change-control");
  // 8. Changing the selection has to change what the map renders. The rendered
  //    feature is the comparison, not the panel's wording: two selections that
  //    legitimately hold the same number must not fail here, and a stale panel
  //    must not pass.
  const variableSelector = '[data-testid="map-layer-variable-select"]';
  await ensureControlReachable(cdp, evaluateValue, variableSelector);
  const controlState = await evaluateValue(
    cdp,
    `(() => {
      const el = document.querySelector(${json(variableSelector)});
      if (!el) return null;
      return { value: el.value, count: el.options.length };
    })()`
  );
  if (!controlState) {
    row.controlChangedResult = "NO_CONTROL_PRESENT";
  } else if (controlState.count < 2) {
    row.controlChangedResult = "SINGLE_OPTION";
  } else {
    const before = await evaluateValue(cdp, renderedSignature(target.elementId));
    const outcome = await selectOptionByRealInput(
      cdp,
      evaluateValue,
      variableSelector,
      (option) => option.value !== controlState.value
    );
    if (!String(outcome.result).startsWith("SELECTED")) {
      row.controlChangedResult = `CONTROL_DID_NOT_TAKE_INPUT:${outcome.result}`;
    } else {
      const changed = await pollUntil(
        () => evaluateValue(cdp, renderedSignature(target.elementId)),
        (after) => {
          if (!after || !before) return true;
          return after.count !== before.count || after.facets !== before.facets;
        },
        { timeoutMs: 12000, label: "rendered scope after control change" }
      );
      row.controlChangedResult = changed.ok
        ? `RENDERED_SCOPE_CHANGED_TO:${String(outcome.option || "").slice(0, 40)}` +
          `(${before?.count ?? "?"}->${changed.value?.count ?? "?"} features)`
        : `NO_RENDERED_CHANGE_AFTER_${changed.waitedMs}MS`;
    }
  }

  const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
  const bytes = Buffer.from(shot.data, "base64");
  const file = resolve(shots, `map-${target.elementId.toLowerCase()}-${target.geometryKind}.png`);
  writeFileSync(file, bytes);
  row.evidence = bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" ? "YES" : "INVALID_PNG";
  row.screenshot = relative(OUT, file).split(sep).join("/");
  row.screenshotSha256 = digest(bytes);
  row.note = notes.join("; ");
  return row;
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

const VALUE_PASS = new Set(["MATCH_IN_DESIGNED_FIELD", "MATCH_IN_POPUP_FIELD"]);

async function main() {
  const shots = resolve(OUT, "screenshots");
  mkdirSync(shots, { recursive: true });
  const targets = buildExpectedTargets();
  if (!targets.length) throw new MapQaError("NO_EXPECTED_TARGETS_BUILT");

  const server = await startStaticBuildServer(BUILD);
  const browser = await launchHeadlessBrowser();
  const cdp = browser.cdp;
  const base = server.url.replace(/\/$/, "");
  await setViewport(cdp, WIDTH, HEIGHT);

  const rows = [];
  for (const target of targets) {
    const started = browser.runtimeErrors?.length || 0;
    let row;
    if (target.status === "NO_TARGET_BUILT") {
      rows.push({ ...target, note: target.expectedSource, pageRuntimeEvents: 0 });
      process.stderr.write(`  ${target.elementId}: NO_TARGET_BUILT
`);
      continue;
    }
    const progress = { stage: "start" };
    try {
      row = await reviewTarget(cdp, base, target, shots, progress);
      row.status = "REVIEWED";
    } catch (error) {
      row = {
        ...(progress.row || {}),
        elementId: target.elementId,
        geometryKind: target.geometryKind,
        status: error instanceof MapQaError ? "HARNESS_ERROR" : "APP_ERROR",
        stageReached: progress.stage || "unknown",
        note: [progress.row?.note, String(error.message || error)].filter(Boolean).join("; ").slice(0, 300),
      };
    }
    row.pageRuntimeEvents = (browser.runtimeErrors || []).slice(started).length;
    rows.push(row);
    process.stderr.write(
      `  ${row.elementId} (${row.geometryKind}): selected=${row.layerSelected} ` +
        `target=${row.targetPresentInRender} reach=${row.reachRecovery} ` +
        `hover=${row.hoverPopupIdentifiesTarget} panel=${row.clickPanelIdentifiesTarget} ` +
        `value=${row.expectedValueObserved}\n`
    );
  }

  const columns = [
    "elementId", "geometryKind", "status", "renderer", "expectedKey", "expectedName",
    "expectedValue", "expectedUnit", "expectedPeriod", "expectedSource",
    "layerSelected", "layerRendered", "targetPresentInRender", "hitPointResolved",
    "stageReached", "cameraSettled", "zoomedToTarget", "occludedBy", "reachRecovery", "reachTrail", "layerListState",
    "overlapChoices", "overlapResolved",
    "hoverPopupIdentifiesTarget", "hoverIdentityBasis", "hoverWaitMs",
    "clickPanelIdentifiesTarget", "clickIdentityBasis", "clickWaitMs", "hoverAndPanelAgree",
    "expectedVariableSelected", "expectedPeriodSelected", "dataScopeReady",
    "controlChangedResult", "expectedValueObserved", "expectedValueShown",
    "expectedUnitObserved", "expectedPeriodObserved",
    "evidence", "screenshot", "screenshotSha256", "pageRuntimeEvents", "note",
  ];
  const cell = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  writeFileSync(
    resolve(OUT, "map-target-review-v137.csv"),
    `${columns.join(",")}\n${rows.map((r) => columns.map((c) => cell(r[c])).join(",")).join("\n")}\n`,
    "utf8"
  );
  const summary = {
    schema: "nigt-map-target-review-2",
    generatedAt: new Date().toISOString(),
    buildRoot: relative(ROOT, BUILD).split(sep).join("/"),
    viewport: { width: WIDTH, height: HEIGHT },
    targetsReviewed: rows.length,
    fullChainVerified: rows.filter((r) => r.hoverAndPanelAgree === "YES").length,
    expectedValueObserved: rows.filter((r) => VALUE_PASS.has(r.expectedValueObserved)).length,
    reachedWithoutRecovery: rows.filter((r) => r.reachRecovery === "NONE_NEEDED").length,
    reachedAfterRecovery: rows.filter(
      (r) => r.reachRecovery && !["NONE_NEEDED", "NOT_ATTEMPTED", "UNREACHABLE_AFTER_RECOVERY", "NO_POINT_ON_FEATURE"].includes(r.reachRecovery)
    ).length,
    unreachable: rows.filter((r) => r.reachRecovery === "UNREACHABLE_AFTER_RECOVERY").length,
    harnessErrors: rows.filter((r) => r.status === "HARNESS_ERROR").length,
    appErrors: rows.filter((r) => r.status === "APP_ERROR").length,
    meaning:
      "Selection is made through the control by pointer and arrow key. Every wait is bounded " +
      "polling on the observed result. Identity is the stable record key. The expected value is " +
      "compared against the field designed to carry it, by whole numeric token.",
    rows,
  };
  writeFileSync(resolve(OUT, "map-target-review-v137.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ...summary, rows: undefined }, null, 2));

  await browser.close();
  await server.close();
  return summary.harnessErrors ? 2 : 0;
}

main().then((code) => process.exit(code));
