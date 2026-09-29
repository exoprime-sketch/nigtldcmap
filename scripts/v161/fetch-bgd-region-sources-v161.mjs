#!/usr/bin/env node
/**
 * V161-A: snapshot of the sources behind the Bangladesh region names.
 *
 * Network step, run once when a source changes; the generator
 * (build-region-names-v161.mjs) reads only the snapshot it writes, so the
 * dictionary rebuilds offline and byte-identically.
 *
 * - District local names: geoBoundaries gbOpen BGD ADM2 (64 districts,
 *   BBS/OCHA ROAP), pinned to the release commit the API reports, with the
 *   sha256 of the file read.
 * - Korean names: Korean Wikipedia "방글라데시의 구" (64 districts grouped by
 *   division) at a fixed revision, each article's English interlanguage link as
 *   the bridge to the geoBoundaries spelling. The page cites the Korean embassy
 *   in Dhaka; the embassy article is checked for which names it spells itself.
 *
 *   node scripts/v161/fetch-bgd-region-sources-v161.mjs
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = resolve(ROOT, "scripts/v161/sources/bgd-region-sources-v161.json");
const UA = { "User-Agent": "nigtldcmap-region-names/1.0 (data review)" };
const EMBASSY_URL = "https://overseas.mofa.go.kr/bd-ko/brd/m_2162/view.do?seq=1263477";

async function getJson(url) {
  const response = await fetch(url, { headers: UA });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

async function wikiApi(params) {
  const url = new URL("https://ko.wikipedia.org/w/api.php");
  url.search = new URLSearchParams({ format: "json", ...params }).toString();
  return getJson(url);
}

// --- geoBoundaries ADM2 (district local names)
const meta = await getJson("https://www.geoboundaries.org/api/current/gbOpen/BGD/ADM2/");
const fileUrl = meta.simplifiedGeometryGeoJSON;
const fileBytes = Buffer.from(await (await fetch(fileUrl, { headers: UA })).arrayBuffer());
const geojson = JSON.parse(fileBytes.toString("utf8"));
const districtNames = geojson.features.map((feature) => String(feature.properties.shapeName)).sort();
if (districtNames.length !== Number(meta.admUnitCount)) {
  throw new Error(`geoBoundaries ADM2: ${districtNames.length} features, metadata says ${meta.admUnitCount}`);
}

// --- Korean Wikipedia: divisions and their districts, then English links
const PAGE = "방글라데시의 구";
const parsed = await wikiApi({ action: "parse", page: PAGE, prop: "wikitext|revid", redirects: "1" });
const revid = parsed.parse.revid;
const divisions = [];
let current = null;
let inList = false;
for (const line of parsed.parse.wikitext["*"].split(/\r?\n/)) {
  // Only the list section: the "같이 보기" section links 방글라데시의 주 too.
  if (/^==[^=]/u.test(line)) {
    inList = /구 목록/u.test(line);
    continue;
  }
  if (!inList) continue;
  const division = line.match(/^\* \[\[(.+?)\]\]/);
  const district = line.match(/^\*\* \[\[(.+?)\]\]/);
  if (division && /주$/u.test(division[1])) {
    current = { titleKo: division[1], districts: [] };
    divisions.push(current);
  } else if (district && current) {
    current.districts.push({ titleKo: district[1] });
  }
}
const titles = divisions.flatMap((division) => [division.titleKo, ...division.districts.map((d) => d.titleKo)]);
const english = new Map();
for (let i = 0; i < titles.length; i += 40) {
  const body = await wikiApi({ action: "query", titles: titles.slice(i, i + 40).join("|"), prop: "langlinks", lllang: "en", lllimit: "max", redirects: "1" });
  const redirected = new Map((body.query.redirects || []).map((row) => [row.to, row.from]));
  for (const page of Object.values(body.query.pages)) {
    english.set(redirected.get(page.title) || page.title, page.langlinks?.[0]?.["*"] || null);
  }
}
for (const division of divisions) {
  division.titleEn = english.get(division.titleKo) || null;
  for (const district of division.districts) district.titleEn = english.get(district.titleKo) || null;
}

// --- the embassy article the Korean page cites: which names it spells itself
const embassyText = (await (await fetch(EMBASSY_URL, { headers: UA })).text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const spelledByEmbassy = [...new Set(titles.map((title) => title.replace(/(구|주)$/u, "")).filter((name) => name.length > 1 && embassyText.includes(name)))].sort();

const snapshot = {
  schemaVersion: "bgd-region-sources-v161",
  note: "Sources behind the Bangladesh entries of src/data/geo/regionNamesV161.json. Refresh with scripts/v161/fetch-bgd-region-sources-v161.mjs.",
  geoBoundariesAdm2: {
    boundaryId: meta.boundaryID,
    source: meta.boundarySource,
    license: meta.boundaryLicense,
    yearRepresented: meta.boundaryYearRepresented,
    fileUrl,
    sha256: createHash("sha256").update(fileBytes).digest("hex"),
    districtNames,
  },
  koreanWikipedia: {
    page: PAGE,
    revid,
    url: `https://ko.wikipedia.org/w/index.php?title=${encodeURIComponent(PAGE)}&oldid=${revid}`,
    divisions,
  },
  embassyArticle: {
    url: EMBASSY_URL,
    title: "[무역관 르포] 지도로 보는 방글라데시(1) — 주방글라데시 대한민국 대사관, 2016-11-15",
    spelledNames: spelledByEmbassy,
  },
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ out: OUT, districts: districtNames.length, divisions: divisions.length, koreanDistricts: divisions.reduce((sum, d) => sum + d.districts.length, 0), missingEnglish: titles.filter((t) => !english.get(t)), embassyNames: spelledByEmbassy }));
