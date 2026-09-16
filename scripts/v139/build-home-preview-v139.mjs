/**
 * Home preview asset (V139).
 *
 * The home page shows eight featured datasets as small analysis previews and
 * one static map of the 2016 transmission network. Neither is computed in the
 * browser: this step reads the public packs and the verified geometry once,
 * writes one small JSON with the series the cards draw, and one static SVG of
 * the network on the 63 province boundaries. The home then loads a few
 * kilobytes instead of eight packs and a map engine.
 *
 * Every number comes from a delivered row; the rules that pick a series are
 * written here and repeated in the card copy (which year, which unit, which
 * region, which source rows). Nothing is summed across units, currencies or
 * sources that share no identifier.
 *
 * Output: public/data/vietnam/v2/home/home-preview-v139.json
 *         public/data/vietnam/v2/home/transmission-preview-v139.svg
 *         reports/v139/home-preview-build-v139.json
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const DATA = resolve(ROOT, opt("--data", process.env.VIETNAM_DATA_ROOT || "public/data/vietnam/v2"));
const OUT_DIR = resolve(DATA, "home");
const JSON_PATH = resolve(OUT_DIR, "home-preview-v139.json");
const SVG_PATH = resolve(OUT_DIR, "transmission-preview-v139.svg");
const REPORT_PATH = resolve(ROOT, "reports/v139/home-preview-build-v139.json");
const SVG_URL = "/data/vietnam/v2/home/transmission-preview-v139.svg";

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const round = (value, digits = 2) => Number(Number(value).toFixed(digits));
const signed = (value) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(2)}`;

function loadPacks() {
  const index = readJson(resolve(DATA, "packs/bundle-index-v124.json"));
  const cache = new Map();
  const elements = new Map();
  for (const [elementId, entry] of Object.entries(index.elements)) {
    const path = resolve(DATA, entry.packUrl.replace(/^\/data\/vietnam\/v2\//, ""));
    let shard = cache.get(path);
    if (!shard) {
      const envelope = readJson(path);
      shard = JSON.parse(gunzipSync(Buffer.from(envelope.payloadChunks.join(""), "base64")).toString("utf8"));
      cache.set(path, shard);
    }
    elements.set(elementId, shard.elements[elementId]);
  }
  return elements;
}

const packs = loadPacks();
const manifest = readJson(resolve(DATA, "manifest.json"));
// The detail screen's measure keys, so a card can hand the detail the exact
// selection it summarised (V140).
const visualizationContracts = readJson(resolve(DATA, "semantic/element-visualization-contracts-v125.json")).contracts;
function measureKeyV140(elementId, labelPattern, unit) {
  const contract = visualizationContracts.find((entry) => entry.elementId === elementId);
  const measure = (contract?.measures || []).find((entry) => labelPattern.test(entry.labelKo) && (!unit || entry.unit === unit));
  if (!measure) throw new Error(`${elementId}: measure ${labelPattern} ${unit || ""} not in the contract`);
  return measure.key;
}
const observations = (id) => packs.get(id)?.observations?.records || [];
const entities = (id) => packs.get(id)?.entities?.records || [];
const report = { generatedAt: new Date().toISOString(), cards: [], map: null, warnings: [] };
const warn = (message) => report.warnings.push(message);

// ---------------------------------------------------------------- A-002 WGI
// Six estimate series (-2.5 weak … +2.5 strong) for the newest year every
// dimension reports. Percentile ranks are a different scale and are not mixed in.
function cardA002() {
  const dims = [
    ["va", "시민참여·책임성"],
    ["pv", "정치 안정"],
    ["ge", "정부 효과성"],
    ["rq", "규제의 질"],
    ["rl", "법치"],
    ["cc", "부패 통제"],
  ];
  const rows = observations("A-002").filter((row) => /_est$/u.test(row.indicatorId) && Number.isFinite(row.value));
  const years = [...new Set(rows.map((row) => row.year))].sort((a, b) => a - b);
  const latest = [...years].reverse().find((year) => dims.every(([code]) => rows.some((row) => row.year === year && row.indicatorId === `A-002_wgi_${code}_est`)));
  const bars = dims.map(([code, label]) => ({
    label,
    value: round(rows.find((row) => row.year === latest && row.indicatorId === `A-002_wgi_${code}_est`).value, 2),
  }));
  return {
    elementId: "A-002",
    kind: "signed-bars",
    lead: "여섯 거버넌스 영역의 추정치를 비교하고 1996년부터의 변화를 확인할 수 있습니다.",
    question: "베트남의 거버넌스 여섯 영역은 각각 어느 수준인가?",
    headline: {
      value: `${signed(Math.min(...bars.map((bar) => bar.value)))} ~ ${signed(Math.max(...bars.map((bar) => bar.value)))}`,
      label: `${latest}년 여섯 영역 추정치 범위 · −2.5 약함 ~ +2.5 강함`,
    },
    unit: "추정치(−2.5 약함 ~ +2.5 강함)",
    period: `${latest}년 값 · ${years[0]}–${years[years.length - 1]}년 제공`,
    provider: "World Bank · 세계 거버넌스 지표(WGI)",
    selection: { measure: null, sex: null, year: latest, period: null, dimensions: { wgiMeasure: "est" } },
    domain: [-2.5, 2.5],
    bars,
    note: "백분위 순위는 다른 척도이므로 함께 그리지 않습니다.",
  };
}

// ---------------------------------------------------------------- A-003 GDP
function cardA003() {
  const rows = observations("A-003")
    .filter((row) => row.indicatorId === "A-003_gdp_current_usd" && Number.isFinite(row.value))
    .sort((a, b) => a.year - b.year);
  const points = rows.map((row) => ({ year: row.year, value: round(row.value / 1e9, 1) }));
  const first = points[0];
  const last = points[points.length - 1];
  return {
    elementId: "A-003",
    kind: "line",
    lead: "국내총생산의 연도별 추이와 성장률을 확인할 수 있습니다.",
    question: "국내총생산은 어떻게 변해왔나?",
    headline: {
      value: `${last.value.toLocaleString("en-US", { maximumFractionDigits: 1 })}`,
      label: `10억 미국달러 · ${last.year}년 명목 국내총생산`,
    },
    unit: "10억 미국달러(명목, 현재 가격)",
    period: `${first.year}–${last.year}년`,
    provider: "World Bank 국가 통계",
    selection: { measure: measureKeyV140("A-003", /^GDP 총액$/u, "USD"), sex: null, year: last.year, period: null, dimensions: {} },
    series: points,
    latest: { year: last.year, value: last.value },
    note: "명목 달러 계열 하나만 그립니다. 실질·구매력평가 계열은 상세에서 따로 제공합니다.",
  };
}

// ---------------------------------------------------------------- A-010 GHG by gas
function cardA010() {
  const gases = [
    ["co2", "CO₂"],
    ["ch4", "CH₄"],
    ["n2o", "N₂O"],
    ["fgas", "F-gas"],
  ];
  const rows = observations("A-010").filter((row) => /_co2eq$/u.test(row.indicatorId) && Number.isFinite(row.value));
  const years = [...new Set(rows.map((row) => row.year))].sort((a, b) => a - b);
  const latest = [...years].reverse().find((year) => gases.every(([code]) => rows.some((row) => row.year === year && row.indicatorId === `A-010_emissions_${code}_co2eq`)));
  const parts = gases.map(([code, label]) => ({
    label,
    value: round(rows.find((row) => row.year === latest && row.indicatorId === `A-010_emissions_${code}_co2eq`).value, 1),
  }));
  const total = round(parts.reduce((sum, part) => sum + part.value, 0), 1);
  return {
    elementId: "A-010",
    kind: "composition",
    lead: "온실가스 종류별 배출량의 구성과 1970년부터의 변화를 확인할 수 있습니다.",
    question: "온실가스는 어떤 가스에서 얼마나 배출되나?",
    headline: {
      value: `${total.toLocaleString("en-US", { maximumFractionDigits: 1 })}`,
      label: `Mt CO₂eq · ${latest}년 네 가스 합계`,
    },
    unit: "Mt CO₂eq (GWP-100, AR5)",
    period: `${latest}년 구성 · ${years[0]}–${years[years.length - 1]}년 제공`,
    provider: "European Commission JRC · EDGAR",
    selection: { measure: measureKeyV140("A-010", /^가스별 배출량$/u, "Mt CO2eq"), sex: null, year: latest, period: null, dimensions: {} },
    parts,
    total,
    note: "네 가스를 같은 환산 단위로 나란히 둔 구성입니다. 원천은 별도 총계 행을 제공하지 않습니다.",
  };
}

// ---------------------------------------------------------------- A-023 power plants
// Rows per fuel, per registry. WRI and OSM share no identifier, so the two
// counts stand side by side and are never added into a plant count.
function cardA023() {
  const fuelLabel = (raw) => {
    const value = String(raw || "").trim().toLowerCase();
    if (!value || value === "(미표기)") return "미표기";
    if (/hydro/u.test(value)) return "수력";
    if (/solar/u.test(value)) return "태양광";
    if (/wind/u.test(value)) return "풍력";
    if (/coal/u.test(value)) return "석탄";
    if (/gas/u.test(value) && /oil/u.test(value)) return "가스·석유";
    if (/gas/u.test(value)) return "가스";
    if (/oil/u.test(value)) return "석유";
    if (/biomass/u.test(value)) return "바이오매스";
    if (/waste/u.test(value)) return "폐기물";
    return "기타";
  };
  const sources = [
    ["A-023_power_plant_registry", "WRI"],
    ["A-023_power_plant_registry_osm2026", "OSM"],
  ];
  const counts = new Map();
  const rowsBySource = { WRI: 0, OSM: 0 };
  for (const row of entities("A-023")) {
    const source = sources.find(([id]) => id === row.indicatorId)?.[1];
    if (!source) continue;
    rowsBySource[source] += 1;
    const fuel = fuelLabel(row.normalizedAttributes?.primaryFuel ?? row.normalizedAttributes?.fuelType);
    const entry = counts.get(fuel) || { label: fuel, WRI: 0, OSM: 0 };
    entry[source] += 1;
    counts.set(fuel, entry);
  }
  const groups = [...counts.values()]
    .sort((a, b) => b.WRI + b.OSM - (a.WRI + a.OSM))
    .slice(0, 6);
  // The card's one number: WRI GPPD states a capacity for every one of its
  // rows, so their sum is a sum of the registry, not of two sources.
  const wriRows = entities("A-023").filter((row) => row.indicatorId === sources[0][0]);
  const wriCapacities = wriRows.map((row) => Number(row.normalizedAttributes?.mw ?? row.normalizedAttributes?.capacityMw));
  if (wriCapacities.some((value) => !Number.isFinite(value))) warn("A-023: a WRI row has no capacity; the headline sums only the stated ones");
  const wriCapacityMw = Math.round(wriCapacities.filter(Number.isFinite).reduce((sum, value) => sum + value, 0));
  return {
    elementId: "A-023",
    kind: "grouped-bars",
    lead: "발전소 위치와 발전원별 분포, 설비용량을 지도와 목록으로 확인할 수 있습니다.",
    question: "발전소는 어떤 발전원으로 얼마나 있나?",
    headline: {
      value: `${wriCapacityMw.toLocaleString("en-US")} MW`,
      label: "WRI 수록 발전소 설비용량 합계 · 2021년",
    },
    unit: "원천 수록 행(곳)",
    period: "WRI GPPD v1.3.0(2021) · OSM 2026년 추출",
    provider: "World Resources Institute · OpenStreetMap 기여자",
    selection: { measure: null, sex: null, year: null, period: null, dimensions: {} },
    seriesLabels: ["WRI", "OSM"],
    groups: groups.map((group) => ({ label: group.label, values: [group.WRI, group.OSM] })),
    rowsBySource,
    note: `두 원천(WRI ${rowsBySource.WRI.toLocaleString("en-US")}행 · OSM ${rowsBySource.OSM.toLocaleString("en-US")}행)은 공통 식별자가 없어 고유 발전소 수로 합치지 않습니다.`,
  };
}

// ---------------------------------------------------------------- A-024 transmission map
function projection(bbox, height) {
  const [west, south, east, north] = bbox;
  const latMid = (south + north) / 2;
  const kx = Math.cos((latMid * Math.PI) / 180);
  const scale = height / (north - south);
  const width = (east - west) * kx * scale;
  return {
    width: round(width, 1),
    height,
    x: (lon) => round((lon - west) * kx * scale, 1),
    y: (lat) => round((north - lat) * scale, 1),
  };
}

// Douglas–Peucker on lon/lat rings; the province outlines carry far more
// vertices than a 420px silhouette can show.
function simplify(points, tolerance) {
  if (points.length <= 2) return points;
  const sq = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const distSq = (p, a, b) => {
    const l2 = sq(a, b);
    if (l2 === 0) return sq(p, a);
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / l2));
    return sq(p, [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
  };
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  const tol2 = tolerance * tolerance;
  while (stack.length) {
    const [start, end] = stack.pop();
    let best = 0;
    let index = -1;
    for (let i = start + 1; i < end; i += 1) {
      const d = distSq(points[i], points[start], points[end]);
      if (d > best) {
        best = d;
        index = i;
      }
    }
    if (best > tol2 && index > 0) {
      keep[index] = true;
      stack.push([start, index], [index, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function buildTransmissionSvg() {
  const boundaries = readJson(resolve(DATA, "geometry/vnm-adm1-63.geojson"));
  const network = readJson(resolve(DATA, "geometry/vnm-transmission-network.geojson"));
  const geometryManifest = readJson(resolve(DATA, "geometry/geometry-manifest.json"));
  const bbox = [102.0, 8.3, 109.7, 23.5];
  const proj = projection(bbox, 640);
  const rings = [];
  for (const feature of boundaries.features) {
    const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    for (const polygon of polygons) {
      const outer = simplify(polygon[0], 0.012);
      if (outer.length < 4) continue;
      rings.push(outer);
    }
  }
  const provincePath = rings
    .map((ring) => `M${ring.map((point) => `${proj.x(point[0])} ${proj.y(point[1])}`).join("L")}Z`)
    .join("");
  const classes = [
    { kv: 500, color: "#c2410c", width: 1.7 },
    { kv: 220, color: "#0f766e", width: 1.2 },
    { kv: 110, color: "#7aa8a0", width: 0.7 },
  ];
  const legend = [];
  const linePaths = classes.map((cls) => {
    const features = network.features.filter((feature) => Number(feature.properties.voltageKv) === cls.kv);
    const km = features.reduce((sum, feature) => sum + Number(feature.properties.lengthKm || 0), 0);
    legend.push({ kv: cls.kv, color: cls.color, segments: features.length, lengthKm: Math.round(km) });
    const d = features
      .flatMap((feature) => feature.geometry.coordinates)
      .map((line) => `M${line.map((point) => `${proj.x(point[0])} ${proj.y(point[1])}`).join("L")}`)
      .join("");
    return `<path class="kv${cls.kv}" fill="none" stroke="${cls.color}" stroke-width="${cls.width}" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`;
  });
  const meta = network.metadata;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${proj.width} ${proj.height}" role="img" aria-labelledby="t d">`,
    `<title id="t">베트남 송전망 2016년 · 전압별 송전선 경로</title>`,
    `<desc id="d">63개 성·시 경계 위에 World Bank ENERGYDATA.INFO의 2016년 송전선 ${network.features.length}개 구간을 전압(500·220·110 kV)별 색으로 그린 정적 지도. 배경 경계는 geoBoundaries VNM ADM1(CC BY 4.0). 선의 교차는 전기적 접속을 뜻하지 않습니다.</desc>`,
    `<path fill="#e8efeb" stroke="#b9cac2" stroke-width="0.6" stroke-linejoin="round" d="${provincePath}"/>`,
    ...linePaths,
    `</svg>`,
  ].join("\n");
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(SVG_PATH, svg);
  const pdp8 = entities("A-024").filter((row) => row.indicatorId === "A-024_transmission_line_pdp8");
  const pdp8Planned = pdp8.filter((row) => /planned/iu.test(String(row.normalizedAttributes?.["속성3_A_024_선로상태_기존_계획"] || ""))).length;
  report.map = { provinceRings: rings.length, segments: network.features.length, svgBytes: Buffer.byteLength(svg), legend };
  return {
    elementId: "A-024",
    svgUrl: SVG_URL,
    title: "베트남 송전망",
    subtitle: "전압별 송전선 분포 · 2016년",
    provider: "World Bank (ENERGYDATA.INFO)",
    attribution: `${meta.attribution} · 경계 ${geometryManifest.assets?.[0]?.attribution?.split(";")[0] || "geoBoundaries VNM ADM1"} (CC BY 4.0)`,
    segments: network.features.length,
    totalLengthKm: Math.round(meta.totalLengthKm),
    legend,
    accuracy: "원천 PDF를 좌표화한 자료로 2–10 km 위치 오차가 있을 수 있습니다. 선의 교차는 전기적 접속을 뜻하지 않습니다.",
    plannedNote: `개정 PDP8 선로 ${pdp8.length}행(계획 ${pdp8Planned}행 포함)은 경로 좌표가 없어 이 지도에는 없고 상세 목록에만 있습니다.`,
  };
}

// ---------------------------------------------------------------- B-033 forest loss
// One named province, the one with the largest loss in the newest year. The
// source publishes no national series; 63 province values are not summed here.
function cardB033() {
  const rows = observations("B-033").filter((row) => Number.isFinite(row.value) && row.regionLabel);
  const years = [...new Set(rows.map((row) => row.year))].sort((a, b) => a - b);
  const latestYear = years[years.length - 1];
  const top = rows.filter((row) => row.year === latestYear).sort((a, b) => b.value - a.value)[0];
  const series = rows
    .filter((row) => row.indicatorId === top.indicatorId)
    .sort((a, b) => a.year - b.year)
    .map((row) => ({ year: row.year, value: Math.round(row.value) }));
  const threshold = top.threshold ? ` · 수관 밀도 ${top.threshold} 기준` : "";
  return {
    elementId: "B-033",
    kind: "line",
    lead: "성·시별 연간 산림(수관) 손실과 누적 변화를 확인할 수 있습니다.",
    question: "산림손실은 어디에서 얼마나 큰가?",
    headline: {
      value: `${Math.round(top.value).toLocaleString("en-US")} ha`,
      label: `${top.regionLabel} · ${latestYear}년 손실이 가장 큰 성·시`,
    },
    unit: `ha/년${threshold}`,
    period: `${years[0]}–${latestYear}년`,
    provider: "Global Forest Watch (UMD/WRI)",
    selection: { measure: measureKeyV140("B-033", /^연간 수관 손실$/u, "ha"), sex: null, year: latestYear, period: null, dimensions: { detail_2: top.regionLabel } },
    seriesLabel: `${top.regionLabel} · ${latestYear}년 손실이 가장 큰 성·시`,
    series,
    latest: { year: latestYear, value: Math.round(top.value) },
    note: "63개 성·시 계열 중 한 곳입니다. 원천은 전국 계열을 제공하지 않으며, 성·시 값을 더해 전국값으로 만들지 않습니다.",
  };
}

// ---------------------------------------------------------------- C-016 renewable plan
function cardC016() {
  const tech = "dmt_tap_trung";
  const period = "2025-2030";
  const rows = observations("C-016").filter(
    (row) => row.indicatorId.startsWith(`C-016_re_capacity_${tech}_`) && row.period === period && Number.isFinite(row.value)
  );
  const regionCount = rows.length;
  const total = Math.round(rows.reduce((sum, row) => sum + row.value, 0));
  const bars = [...rows]
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((row) => ({ label: row.regionLabel, value: Math.round(row.value) }));
  const version = rows[0]?.planVersion || "개정 PDP8";
  return {
    elementId: "C-016",
    kind: "bars",
    lead: "재생에너지 기술별·기간별 성·시 계획용량을 비교할 수 있습니다.",
    question: "재생에너지 계획용량은 어느 성·시에 집중되나?",
    headline: {
      value: `${total.toLocaleString("en-US")} MW`,
      label: `${regionCount}개 성·시 합계 · 집중형 태양광 ${period.replace("-", "–")}년 계획`,
    },
    unit: "MW(계획 용량)",
    period: `${period.replace("-", "–")}년 · 집중형 태양광`,
    provider: "베트남 총리실 · 산업무역부(MOIT), 개정 PDP8 부록 II",
    selection: { measure: measureKeyV140("C-016", /집중형 태양광/u, "MW"), sex: null, year: null, period, dimensions: {} },
    bars,
    scope: `${regionCount}개 성·시 중 상위 6곳 · 합계 ${total.toLocaleString("en-US")} MW`,
    note: `${version.split("·")[0].trim()}의 계획 용량이며 설치 실적이 아닙니다.`,
  };
}

// ---------------------------------------------------------------- D-023 climate finance
function cardD023() {
  const rows = entities("D-023").filter((row) => String(row.normalizedAttributes?.["레코드구분"] || "") === "개별");
  const fundLabel = (raw) => {
    const value = String(raw || "").trim();
    if (/^GEF/u.test(value)) return "GEF";
    if (/^GCF/u.test(value)) return "GCF";
    if (/CIF|Clean Technology/u.test(value)) return "CIF(CTF)";
    if (/Adaptation Fund/u.test(value)) return "적응기금";
    return value || "미표기";
  };
  const counts = new Map();
  for (const row of rows) {
    const fund = fundLabel(row.normalizedAttributes?.["기금"]);
    counts.set(fund, (counts.get(fund) || 0) + 1);
  }
  const parts = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  // The four funds date their rows differently (GEF fiscal year, GCF board
  // date, AF approval date, CIF plan revision); the span is read from whichever
  // the row carries rather than typed in.
  const years = rows
    .flatMap((row) => {
      const a = row.normalizedAttributes || {};
      return [a["승인_회계연도"], a["이사회_승인일"], a["승인일"], a["상태"]].map((value) => {
        const match = String(value || "").match(/(?:^|\D)((?:19|20)\d{2})(?:\D|$)/u);
        return match ? Number(match[1]) : null;
      });
    })
    // Six GEF rows carry fiscal year 1970, the Unix epoch the export wrote
    // where the year was missing; the fund did not exist before 1991.
    .filter((year) => Number.isFinite(year) && year !== 1970);
  const span = years.length ? `${Math.min(...years)}–${Math.max(...years)}년 승인·등록 사업` : "승인연도 원천 기재 기준";
  return {
    elementId: "D-023",
    kind: "composition",
    lead: "기후재원 기금별 사업 수와 사업 유형, 기간을 확인할 수 있습니다.",
    question: "기후재원 사업은 어느 기금에 얼마나 있나?",
    headline: {
      value: `${rows.length.toLocaleString("en-US")}건`,
      label: `${parts.length}개 기금의 개별 사업 · ${span}`,
    },
    unit: "사업 수(건)",
    period: span,
    provider: "GCF · GEF · 적응기금 · CIF 공개 사업 목록",
    selection: { measure: null, sex: null, year: null, period: null, dimensions: {} },
    parts,
    total: rows.length,
    note: "같은 기준(개별 사업 행 수)으로 센 구성입니다. 승인액은 통화·기간·집행 단계가 달라 합산하지 않습니다.",
  };
}

const cards = [cardA002(), cardA003(), cardA010(), cardA023(), null, cardB033(), cardC016(), cardD023()];
const map = buildTransmissionSvg();
cards[4] = {
  elementId: "A-024",
  kind: "map",
  lead: "송전선 경로와 전압별 분포를 지도에서 확인할 수 있습니다.",
  question: "송전선은 어디에, 어떤 전압으로 놓여 있나?",
  headline: {
    value: `${map.totalLengthKm.toLocaleString("en-US")} km`,
    label: `2016년 송전선 ${map.segments.toLocaleString("en-US")}구간 총연장`,
  },
  unit: "kV · 구간 수 · km",
  period: "2016년 선로(경로 있음) · 계획 선로는 목록",
  provider: map.provider,
  selection: { measure: null, sex: null, year: 2016, period: null, dimensions: {} },
  svgUrl: SVG_URL,
  legend: map.legend,
  note: map.plannedNote,
};

const output = {
  schemaVersion: "v139-home-preview-2",
  dataSnapshot: manifest.generatedAt,
  generatedFrom: "public packs (bundle-index-v124) and geometry/*.geojson",
  map,
  cards,
};
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(JSON_PATH, `${JSON.stringify(output, null, 2)}\n`);
report.cards = cards.map((card) => ({ elementId: card.elementId, kind: card.kind, period: card.period, unit: card.unit }));
mkdirSync(dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ cards: cards.length, map: report.map, warnings: report.warnings }));
