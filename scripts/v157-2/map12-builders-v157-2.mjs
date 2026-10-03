/**
 * P8-2 (지도 12): the inputs of the twelve map layers the 2026-09-30 delivery (V162)
 * makes possible, for scripts/v138/build-map-layers-v138.mjs.
 *
 * Four of the twelve (B-002 · B-024 · B-035 · B-036) state a value per province and
 * go through the builder's ordinary `admin1-attributes` path - nothing here. The
 * other eight take one of two shapes this module builds:
 *
 * group-constant (A-022 · C-017 · A-013 · C-003, and C-006's project count)
 *   A value the source states for a named group of provinces - an EVN power
 *   corporation's territory, a price-bracket region, a socio-economic region - is
 *   shown unchanged on every member province (`broadcastGroupValuesV157_2`, the same
 *   transform as src/data/map/groupConstantV157_2.ts). A group the source gives no
 *   value for gets no rows: never a neighbour's number, never a zero. Which province
 *   belongs to which group comes from the four verified tables under
 *   tools/etl/countries/vnm/ (each with official URLs; REVIEW_V157-2.md §1-2).
 *
 * entity-join (B-044 · B-046 · B-047)
 *   National mineral figures on B-048's mine points: the layer is the host's points
 *   narrowed to the mines whose own 광종 entries match the mineral
 *   (mineral-crosswalk-v162.json). The runtime does the join with
 *   src/data/map/entityAttributeJoinV157_2.ts; this module declares it and counts
 *   the features with the same rule.
 *
 * Nothing here derives a value: every number is a cell of the delivery.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const MAP12_DIR = "tools/etl/countries/vnm/map12";

const readJson = (root, relative) => JSON.parse(readFileSync(resolve(root, relative), "utf8"));
const text = (value) => (value === null || value === undefined ? "" : String(value).trim());
const finite = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null);

// ---------------------------------------------------------------- group tables

/** province → group, from one of the verified tables. */
export function groupMembershipV157_2(root, table) {
  if (table === "evn") {
    const doc = readJson(root, "tools/etl/countries/vnm/evn-jurisdiction.json");
    const labels = new Map(doc.corporations.map((corp) => [corp.id, corp]));
    return {
      rows: doc.provinces63.map((row) => ({ adm1Code: row.adm1Code, adm1Name: row.name, group: row.corporation })),
      groupLabel: (group) => EVN_LABELS_V157_2[group] || labels.get(group)?.nameVi || group,
      groupUrl: (group) => labels.get(group)?.sourceUrls?.[0] || "",
      basis: "EVN 5개 전력총공사 관할(2025-07-01 이후, 총공사별 공식 소속 단위 페이지)",
    };
  }
  if (table === "c017") {
    const doc = readJson(root, `${MAP12_DIR}/c017-price-regions.json`);
    return {
      rows: doc.provinces63.map((row) => ({ adm1Code: row.adm1Code, adm1Name: row.name, group: row.region })),
      groupLabel: (group) => PRICE_REGION_LABELS_V157_2[group] || group,
      groupUrl: () => doc.regionDefinition?.url || "",
      basis: "레코드가 밝힌 권역(북부·중부·남부) · 권역의 성 구성은 EVN 관할 기준(가격 규정 원문은 성을 나열하지 않음)",
    };
  }
  if (table === "six") {
    const doc = readJson(root, `${MAP12_DIR}/six-regions.json`);
    const byKey = new Map(doc.regions.map((region) => [region.key, region]));
    const names = new Map(
      readJson(root, "public/data/vietnam/v2/geometry/vnm-adm1-63.geojson").features.map((feature) => [
        feature.properties.adm1Code,
        feature.properties.name,
      ])
    );
    return {
      rows: doc.regions.flatMap((region) =>
        region.provinces63.map((code) => ({ adm1Code: code, adm1Name: names.get(code) || code, group: region.key }))
      ),
      groupLabel: (group) => SIX_REGION_LABELS_V157_2[group] || byKey.get(group)?.nameVi || group,
      groupUrl: () => doc.definition63?.url || "",
      regions: doc.regions,
      basis: "6대 사회경제 권역(Nghị quyết 81/2023/QH15 Điều 3)",
    };
  }
  throw new Error(`unknown group table ${table}`);
}

const EVN_LABELS_V157_2 = {
  evnnpc: "북부전력총공사(EVNNPC)",
  evncpc: "중부전력총공사(EVNCPC)",
  evnspc: "남부전력총공사(EVNSPC)",
  evnhanoi: "하노이전력총공사(EVNHANOI)",
  evnhcmc: "호찌민시전력총공사(EVNHCMC)",
};
const PRICE_REGION_LABELS_V157_2 = { north: "북부", central: "중부", south: "남부" };
const PRICE_REGION_OF_RECORD_V157_2 = { 북부: "north", 중부: "central", 남부: "south" };
const SIX_REGION_LABELS_V157_2 = {
  "northern-midlands-mountains": "북부 산간·중부 내륙",
  "red-river-delta": "홍강 삼각주",
  "north-central-central-coast": "북중부·중부 해안",
  "central-highlands": "중부 고원",
  southeast: "동남부",
  "mekong-river-delta": "메콩강 삼각주",
};

/** The build-time twin of broadcastGroupValuesV157_2 (src/data/map/groupConstantV157_2.ts). */
export function broadcastGroupValuesV157_2(membership, valuesByGroup, meta) {
  const rows = [];
  for (const province of membership) {
    const groupValue = valuesByGroup.get(province.group);
    if (!groupValue) continue; // no value for this group: no row, not a zero
    rows.push({
      adm1Code: province.adm1Code,
      adm1Name: province.adm1Name,
      variable: meta.variable,
      variableLabel: meta.variableLabel,
      period: meta.period,
      value: groupValue.value,
      unit: groupValue.unit,
      sourceIndicatorId: groupValue.sourceIndicatorId,
      sourceRecordId: groupValue.sourceRecordId ?? null,
      sourceSpatialUnit: "admin1",
      imputed: false,
      ...(groupValue.categoryLabel ? { categoryLabel: groupValue.categoryLabel } : {}),
    });
  }
  return rows;
}

// ---------------------------------------------------------------- per element

/**
 * A-022: SAIDI · SAIFI · MAIFI per power corporation. The group-wide EVN series
 * is national and stays on the detail screen; EVNHCMC's pre-2025 old-city figure
 * belongs to a territory that no longer exists and is not drawn (its current,
 * merged-city figure is). A corporation whose cell reads "(미공개)" has no row.
 */
function a022Values(element) {
  const pattern = /^A-022_(saidi|saifi|maifi)_(evnnpc|evncpc|evnspc|evnhanoi|evnhcmc_current)$/u;
  const values = [];
  const skipped = [];
  for (const obs of element?.observations?.records || []) {
    const match = String(obs.indicatorId).match(pattern);
    if (!match) continue;
    const value = finite(obs.value);
    const group = match[2].replace(/_current$/u, "");
    if (value === null) {
      skipped.push({ indicatorId: obs.indicatorId, reason: obs.missingReasonCode || "value-missing" });
      continue;
    }
    values.push({ measureKey: match[1], group, period: text(obs.year), value, unit: text(obs.unit), sourceIndicatorId: obs.indicatorId });
  }
  return { values, skipped };
}

/**
 * C-017: the 2025 generation price caps the source states per region (북부·중부·
 * 남부). The record's own 권역 decides its region; the province list of a region
 * comes from c017-price-regions.json. Sea-area caps (해역) name no province and the
 * Ninh Thuận special tariff names one province: the first are left to the detail
 * screen, the second is drawn on that province alone.
 */
function c017Values(element, boundaries) {
  const values = [];
  const special = [];
  const unmapped = [];
  for (const record of element?.entities?.records || []) {
    const a = record.normalizedAttributes || {};
    const region = text(a["지역_권역"]);
    const id = text(a["식별_레코드ID"]);
    const cap = finite(a["요율_가격_상한"]);
    if (region === "전국" || !region) continue;
    if (PRICE_REGION_OF_RECORD_V157_2[region]) {
      if (cap === null) continue;
      const stem = id.replace(/-[NCS]$/u, "");
      values.push({
        measureKey: stem.toLowerCase().replace(/^vnm-c017-/u, ""),
        measureLabel: text(a["식별_레코드명"]).replace(/,\s*(북부|중부|남부)$/u, "").replace(/\s*-\s*/u, " · "),
        group: PRICE_REGION_OF_RECORD_V157_2[region],
        period: text(a["기간_시행일_YYYY_MM_DD"]).slice(0, 4),
        value: cap,
        unit: text(a["요율_가격_단위"]),
        sourceIndicatorId: record.indicatorId,
        sourceRecordId: record.recordId,
      });
      continue;
    }
    const province = /닌투언|Ninh Thuận/u.test(region) ? boundaries.lookup.get("ninh thuan") : null;
    if (province && cap !== null) {
      special.push({
        adm1Code: province.adm1Code,
        adm1Name: province.adm1Name,
        measureKey: id.toLowerCase().replace(/^vnm-c017-/u, ""),
        // "태양광 FIT(2020) - 닌투언성 특례(계통연계, …)" → "태양광 FIT(2020) · 닌투언성 특례"
        measureLabel: text(a["식별_레코드명"]).replace(/\s*-\s*/u, " · ").replace(/\s*\([^()]*\)$/u, "").trim(),
        period: text(a["기간_시행일_YYYY_MM_DD"]).slice(0, 4),
        value: cap,
        unit: text(a["요율_가격_단위"]),
        sourceIndicatorId: record.indicatorId,
        sourceRecordId: record.recordId,
        currentUnit: text(a["지역_지역명_현행"]),
      });
      continue;
    }
    unmapped.push({ recordId: id, region, reason: "권역이 해역 단위라 성·시에 대응하지 않음" });
  }
  return { values, special, unmapped };
}

/** The official six-region names, whole words only ("South East" is not "South East Asia"). */
function sixRegionMatchers(regions) {
  return regions.flatMap((region) =>
    [region.nameVi, ...(region.englishVariants || []).filter((v) => v.match === "exact").map((v) => v.text)]
      .map((name) => name.replace(/\s*\(untranslated\)$/u, ""))
      .map((name) => ({
        key: region.key,
        name,
        pattern: new RegExp(`(?<![\\p{L}\\p{N}])${name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}(?![\\p{L}\\p{N}])(?!\\s+Asia)`, "iu"),
      }))
  );
}

/** C-003: NAP records whose own text names a six-region by its official name. */
function c003Tags(element, regions) {
  const matchers = sixRegionMatchers(regions);
  const tagged = [];
  for (const record of element?.entities?.records || []) {
    const a = record.normalizedAttributes || {};
    const found = new Map();
    for (const [key, value] of Object.entries(a)) {
      if (typeof value !== "string" || key.startsWith("출처_") || key.startsWith("기술_")) continue;
      for (const matcher of matchers) if (matcher.pattern.test(value)) found.set(matcher.key, key);
    }
    if (!found.size) continue;
    tagged.push({
      recordId: record.recordId,
      label: text(a["식별_레코드명"]) || text(record.name),
      kind: text(a["식별_레코드_유형"]),
      regions: [...found.keys()].sort(),
      fields: [...new Set(found.values())],
      url: text(a["출처_원문_URL"]),
    });
  }
  return tagged;
}

/** A-013: the records prepare-map12-v157-2.py found naming a six-region in the workbook text. */
function a013Tags(root, element) {
  const doc = readJson(root, `${MAP12_DIR}/prepared/a-013-regions.json`);
  // The tags were read from the same delivery the pack was built from: the
  // record counts must agree, or the tags belong to another vintage.
  const packCount = (element?.entities?.records || []).length;
  if (packCount !== doc.coverage.records) {
    throw new Error(`A-013: pack has ${packCount} records, the region tags were read from ${doc.coverage.records}`);
  }
  return doc.rows.map((row) => ({ ...row, recordId: row.sourceRecordId }));
}

function seriesFromRows(rows, measuresByKey, series, seriesMeta) {
  for (const row of rows) {
    const key = `${row.variable} ${row.period}`;
    let bucket = series.get(key);
    if (!bucket) {
      bucket = new Map();
      series.set(key, bucket);
      seriesMeta.set(key, { variable: row.variable, period: row.period, measure: measuresByKey.get(row.variable), scenario: "", label: row.variableLabel });
    }
    if (!bucket.has(row.adm1Code)) bucket.set(row.adm1Code, row);
  }
}

/**
 * The choropleth inputs (series · members · stats · measures) of one group-constant
 * target, in the shapes buildAdmin1Layer hands to finishChoroplethLayer.
 */
export function buildGroupConstantInputsV157_2(root, target, packs, boundaries) {
  const { build } = target;
  const element = packs.get(target.elementId);
  // C-006 counts registry projects per province; it has no group table.
  const membership =
    build.groupTable === "jcm"
      ? { rows: [], basis: "JCM 공식 등록부의 사업별 소재 성·시(jcm-projects.json, 사업별 등록부 URL)", groupLabel: (group) => group, groupUrl: () => "" }
      : groupMembershipV157_2(root, build.groupTable);
  const series = new Map();
  const seriesMeta = new Map();
  const members = new Map();
  const report = { groupTable: build.groupTable, basis: membership.basis };
  const measures = [];
  const measuresByKey = new Map();
  const addMeasure = (measure) => {
    if (measuresByKey.has(measure.key)) return;
    measures.push(measure);
    measuresByKey.set(measure.key, measure);
  };
  const addMember = (adm1Code, item) => {
    const list = members.get(adm1Code) || [];
    list.push(item);
    members.set(adm1Code, list);
  };
  let sourceValueCount = 0;
  const groupsOf = (group) => membership.rows.filter((row) => row.group === group);

  if (target.elementId === "A-022") {
    const { values, skipped } = a022Values(element);
    for (const measure of build.measures) addMeasure(measure);
    for (const value of values) {
      const measure = measuresByKey.get(value.measureKey);
      const rows = broadcastGroupValuesV157_2(
        groupsOf(value.group),
        new Map([[value.group, { ...value, categoryLabel: membership.groupLabel(value.group) }]]),
        { variable: measure.key, variableLabel: measure.label, period: value.period }
      );
      seriesFromRows(rows, measuresByKey, series, seriesMeta);
      sourceValueCount += 1;
    }
    for (const row of membership.rows) {
      addMember(row.adm1Code, {
        recordId: `${target.elementId}-${row.group}`,
        label: `${membership.groupLabel(row.group)} 관할`,
        date: "",
        status: "",
        value: values.some((value) => value.group === row.group) ? "관할 전체 값" : "관할 값 미공개",
        url: membership.groupUrl(row.group),
        indicatorId: "",
      });
    }
    report.skipped = skipped;
    report.groups = [...new Set(values.map((value) => value.group))].sort();
  } else if (target.elementId === "C-017") {
    const { values, special, unmapped } = c017Values(element, boundaries);
    for (const value of values) {
      addMeasure({ key: value.measureKey, label: value.measureLabel, unit: value.unit, measureId: `c017-${value.measureKey}` });
      const rows = broadcastGroupValuesV157_2(
        groupsOf(value.group),
        new Map([[value.group, { ...value, categoryLabel: `${membership.groupLabel(value.group)} 권역` }]]),
        { variable: value.measureKey, variableLabel: value.measureLabel, period: value.period }
      );
      seriesFromRows(rows, measuresByKey, series, seriesMeta);
      sourceValueCount += 1;
    }
    for (const value of special) {
      addMeasure({ key: value.measureKey, label: value.measureLabel, unit: value.unit, measureId: `c017-${value.measureKey}` });
      seriesFromRows(
        [{
          adm1Code: value.adm1Code, adm1Name: value.adm1Name, variable: value.measureKey, variableLabel: value.measureLabel,
          period: value.period, value: value.value, unit: value.unit, sourceIndicatorId: value.sourceIndicatorId,
          sourceRecordId: value.sourceRecordId, sourceSpatialUnit: "admin1", imputed: false, categoryLabel: "성 특례",
        }],
        measuresByKey, series, seriesMeta
      );
      addMember(value.adm1Code, {
        recordId: value.sourceRecordId, label: `${value.measureLabel} — 원문이 이 성에 따로 정한 특례 가격`, date: value.period,
        status: "특례", value: `${value.value.toLocaleString("ko-KR")} ${value.unit}`, url: "", indicatorId: value.sourceIndicatorId,
      });
      sourceValueCount += 1;
    }
    for (const row of membership.rows) {
      addMember(row.adm1Code, {
        recordId: `${target.elementId}-${row.group}`, label: `${membership.groupLabel(row.group)} 권역`, date: "", status: "",
        value: "권역 전체 가격 상한", url: membership.groupUrl(row.group), indicatorId: "",
      });
    }
    report.specialCases = special.map(({ adm1Code, adm1Name, currentUnit, value, unit }) => ({ adm1Code, adm1Name, currentUnit, value, unit }));
    report.unmappedRecords = unmapped;
  } else if (target.elementId === "A-013" || target.elementId === "C-003") {
    const tagged = target.elementId === "A-013" ? a013Tags(root, element) : c003Tags(element, membership.regions);
    const measure = build.measures[0];
    addMeasure(measure);
    const countByRegion = new Map();
    for (const row of tagged) for (const region of row.regions) countByRegion.set(region, (countByRegion.get(region) || 0) + 1);
    const valuesByGroup = new Map(
      [...countByRegion].map(([region, count]) => [
        region,
        { value: count, unit: measure.unit, sourceIndicatorId: element?.entities?.records?.[0]?.indicatorId || "", categoryLabel: `${membership.groupLabel(region)} 권역` },
      ])
    );
    seriesFromRows(
      broadcastGroupValuesV157_2(membership.rows, valuesByGroup, { variable: measure.key, variableLabel: measure.label, period: build.periodFixed }),
      measuresByKey, series, seriesMeta
    );
    for (const row of tagged) {
      for (const region of row.regions) {
        for (const province of groupsOf(region)) {
          addMember(province.adm1Code, {
            recordId: row.entityId || row.recordId,
            label: target.elementId === "A-013" ? `${row.actionText} (SDG ${row.sdgTarget})` : row.label,
            date: "",
            status: `${membership.groupLabel(region)} 권역`,
            value: "",
            url: row.sourceUrl || row.url || "",
            indicatorId: "",
          });
        }
      }
    }
    sourceValueCount = tagged.length;
    report.taggedRecords = tagged.length;
    report.regions = Object.fromEntries([...countByRegion].sort());
  } else if (target.elementId === "C-006") {
    const registry = readJson(root, `${MAP12_DIR}/jcm-projects.json`);
    const counted = registry.projects.filter((project) => project.mapUse === "count");
    const measure = build.measures[0];
    addMeasure(measure);
    const byCode = new Map();
    for (const project of counted) {
      for (const code of new Set(project.provinces63)) {
        const list = byCode.get(code) || [];
        list.push(project);
        byCode.set(code, list);
      }
    }
    const rows = [...byCode].map(([code, projects]) => ({
      adm1Code: code, adm1Name: boundaries.nameByCode.get(code) || code, variable: measure.key, variableLabel: measure.label,
      period: build.periodFixed, value: projects.length, unit: measure.unit, sourceIndicatorId: "C-006_activity", sourceRecordId: null,
      sourceSpatialUnit: "admin1", imputed: false,
    }));
    seriesFromRows(rows, measuresByKey, series, seriesMeta);
    for (const [code, projects] of byCode) {
      for (const project of projects) {
        addMember(code, { recordId: project.id, label: `${project.id} ${project.title}`, date: "", status: "등록", value: "", url: project.sourceUrl, indicatorId: "C-006_activity" });
      }
    }
    // The 34-unit count is the distinct projects in the unit - a project that
    // names two provinces later merged into one unit counts once there.
    const parentOf = new Map(boundaries.boundaries34.units.flatMap((unit) => unit.memberAdm1Codes.map((code) => [code, unit])));
    const byUnit = new Map();
    for (const project of counted) {
      for (const unit of new Set(project.provinces63.map((code) => parentOf.get(code)).filter(Boolean))) {
        const list = byUnit.get(unit.unitCode) || { unit, ids: [] };
        list.ids.push(project.id);
        byUnit.set(unit.unitCode, list);
      }
    }
    report.source34Rows = [...byUnit.values()].map(({ unit, ids }) => ({
      unitCode: unit.unitCode, unitName: unit.name, variable: measure.key, variableLabel: measure.label, period: build.periodFixed,
      value: ids.length, unit: measure.unit, sourceIndicatorId: "C-006_activity", sourceRecordId: null, sourceSpatialUnit: "admin1-34", imputed: false,
    }));
    sourceValueCount = counted.length;
    report.projects = { registered: registry.projects.length, counted: counted.length, provinces63: byCode.size, units34: byUnit.size, locationUnconfirmed: registry.projects.filter((p) => p.mapUse !== "count").map((p) => p.id) };
  } else {
    throw new Error(`${target.elementId}: no group-constant input defined`);
  }

  return {
    measures,
    series,
    seriesMeta,
    members,
    stats: { sourceValueCount, duplicateValueCount: 0, providedZeroCount: 0, unmatched: new Map(), sourceRowCount: sourceValueCount },
    report,
  };
}

// ---------------------------------------------------------------- mineral join

function formatNumber(value) {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 3 });
}

/** One national line per mineral the crosswalk ties to a B-048 entry. */
function mineralAttributes(root, target, element) {
  const crosswalk = readJson(root, `${MAP12_DIR}/mineral-crosswalk-v162.json`);
  const records = element?.entities?.records || [];
  const attributes = [];
  for (const mineral of crosswalk.minerals) {
    const rows = records.filter((record) => text(record.normalizedAttributes?.["광종_표준"]) === mineral.standard);
    if (!rows.length) continue;
    for (const row of rows) {
      const stated = text(row.normalizedAttributes?.["광종_USGS_영문"]);
      if (stated && stated !== mineral.usgsCommodity) {
        throw new Error(`${target.elementId} ${mineral.standard}: USGS commodity ${stated} ≠ crosswalk ${mineral.usgsCommodity}`);
      }
    }
    let label;
    let valueText;
    let period;
    if (target.elementId === "B-044") {
      const a = rows[0].normalizedAttributes;
      const parts = [];
      if (finite(a["매장량_최신"]) !== null) parts.push(`매장량 ${formatNumber(a["매장량_최신"])} ${text(a["매장량_단위"])}(${text(a["매장량_기준연도"])})`);
      if (finite(a["생산량_최신"]) !== null) parts.push(`생산량 ${formatNumber(a["생산량_최신"])} ${text(a["생산량_단위"])}(${text(a["생산량_연도"])})`);
      if (!parts.length && finite(a["수량_범위_하한"]) !== null && finite(a["수량_범위_상한"]) !== null) {
        parts.push(`${text(a["범위_구분_매장_생산"])} ${formatNumber(a["수량_범위_하한"])}~${formatNumber(a["수량_범위_상한"])} ${text(a["범위_단위"])}`);
      }
      label = "부존";
      valueText = [text(a["부존_상태"]), ...parts].filter(Boolean).join(" · ");
      period = "";
    } else {
      const numeric = rows.filter((row) => finite(row.normalizedAttributes?.["값"]) !== null);
      if (!numeric.length) continue;
      const latest = Math.max(...numeric.map((row) => Number(row.normalizedAttributes["연도"])));
      const latestRows = numeric.filter((row) => Number(row.normalizedAttributes["연도"]) === latest);
      label = target.elementId === "B-046" ? "매장량" : "광산 생산량";
      // Two rows for one year are both printed; the delivery states both.
      valueText = latestRows.map((row) => `${formatNumber(row.normalizedAttributes["값"])} ${text(row.normalizedAttributes["단위"])}`).join(" / ");
      period = String(latest);
    }
    if (!valueText) continue;
    attributes.push({
      elementId: target.elementId,
      mineral: mineral.mineral,
      label,
      valueText,
      period,
      source: text(rows[0].normalizedAttributes?.["원천_기관_판"]),
      oreTypes: mineral.b048Entries,
    });
  }
  return attributes;
}

/** The build-time twin of oreEntriesV157_2 / joinNationalMineAttributesV157_2. */
export function oreEntriesV157_2(value) {
  const raw = text(value);
  return raw ? raw.split(/\s+\/\s+/u).map((entry) => entry.trim()).filter(Boolean) : [];
}

export function buildMineJoinV157_2(root, target, packs) {
  const host = packs.get(target.build.hostElementId);
  const attributes = mineralAttributes(root, target, packs.get(target.elementId));
  const hostRecords = host?.entities?.records || [];
  const joined = hostRecords.filter((record) => {
    const entries = oreEntriesV157_2(record.normalizedAttributes?.["광종"]);
    return attributes.some((attribute) => entries.some((entry) => attribute.oreTypes.includes(entry)));
  });
  return { attributes, joined, hostRecords };
}
