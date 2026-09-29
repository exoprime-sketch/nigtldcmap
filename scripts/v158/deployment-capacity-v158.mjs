#!/usr/bin/env node
/**
 * V158-B2a: measure what each country puts into a deployment and forecast the
 * size once every priority country is loaded. Read-only.
 *
 *   node scripts/v158/deployment-capacity-v158.mjs [--build <dir>] [--out <json>]
 *
 * Countries come from public/data/countries.json and the target list from
 * src/data/priorityCountries.ts; nothing here names a country or a count.
 * "Compressed" is measured, not assumed: every download file is deflated at
 * level 9 and packed per element the way a deterministic ZIP would hold it.
 */
import { deflateRawSync, gzipSync } from "node:zlib";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const MB = 1_000_000;
const round = (bytes) => Math.round((bytes / MB) * 10) / 10;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

// ZIP container overhead per member: local header (30) + central directory
// entry (46) + the name twice; plus one end-of-central-directory record (22).
const zipOverhead = (names) => names.reduce((sum, name) => sum + 76 + 2 * Buffer.byteLength(name), 22);

function measureCountry(entry) {
  const dataDir = join(ROOT, "public", entry.dataRoot);
  const files = walk(dataDir);
  const categories = {};
  let largest = { bytes: 0, path: null };
  for (const file of files) {
    const bytes = statSync(file).size;
    const rel = relative(dataDir, file).split(sep);
    const category = rel.length > 1 ? rel[0] : "(root files)";
    categories[category] ??= { bytes: 0, files: 0 };
    categories[category].bytes += bytes;
    categories[category].files += 1;
    if (bytes > largest.bytes) largest = { bytes, path: relative(join(ROOT, "public"), file).split(sep).join("/") };
  }
  // Downloads: gzip per file, and per-element ZIP (CSV + JSON of one element).
  const downloadFiles = files.filter((file) => file.includes(`${sep}downloads${sep}`) && /\.(csv|json)$/u.test(file) && !file.endsWith("delivery-manifest.json"));
  const byElement = new Map();
  let gzipBytes = 0;
  let rawBytes = 0;
  for (const file of downloadFiles) {
    const buffer = readFileSync(file);
    rawBytes += buffer.length;
    gzipBytes += gzipSync(buffer, { level: 9 }).length;
    const name = file.split(sep).pop();
    const element = name.replace(/\.(csv|json)$/u, "");
    const deflated = deflateRawSync(buffer, { level: 9 }).length;
    const slot = byElement.get(element) ?? { names: [], deflated: 0, raw: 0 };
    slot.names.push(name);
    slot.deflated += deflated;
    slot.raw += buffer.length;
    byElement.set(element, slot);
  }
  let zipBytes = 0;
  let largestZip = { bytes: 0, element: null };
  for (const [element, slot] of byElement) {
    const bytes = slot.deflated + zipOverhead(slot.names);
    zipBytes += bytes;
    if (bytes > largestZip.bytes) largestZip = { bytes, element };
  }
  const totalBytes = Object.values(categories).reduce((sum, item) => sum + item.bytes, 0);
  const downloadsBytes = categories.downloads?.bytes ?? 0;
  return {
    iso3: entry.iso3,
    nameKo: entry.nameKo,
    status: entry.status,
    dataRoot: entry.dataRoot,
    totalBytes,
    totalMB: round(totalBytes),
    files: files.length,
    largestFile: { ...largest, MB: round(largest.bytes) },
    categories: Object.fromEntries(
      Object.entries(categories)
        .sort((a, b) => b[1].bytes - a[1].bytes)
        .map(([name, item]) => [name, { ...item, MB: round(item.bytes) }])
    ),
    downloads: {
      files: downloadFiles.length,
      elements: byElement.size,
      rawBytes,
      rawMB: round(rawBytes),
      gzipMB: round(gzipBytes),
      zipPerElementMB: round(zipBytes),
      zipPerElementBytes: zipBytes,
      compressionRatio: zipBytes ? Math.round((rawBytes / zipBytes) * 10) / 10 : null,
      largestZip: { ...largestZip, MB: round(largestZip.bytes) },
      shareOfCountry: totalBytes ? Math.round((downloadsBytes / totalBytes) * 1000) / 10 : 0,
    },
  };
}

function measureDir(dir) {
  const files = walk(dir);
  const bytes = files.reduce((sum, file) => sum + statSync(file).size, 0);
  const largest = files.reduce((best, file) => {
    const size = statSync(file).size;
    return size > best.bytes ? { bytes: size, path: relative(dir, file).split(sep).join("/") } : best;
  }, { bytes: 0, path: null });
  return { bytes, MB: round(bytes), files: files.length, largestFile: { ...largest, MB: round(largest.bytes) } };
}

const registry = JSON.parse(readFileSync(join(ROOT, "public/data/countries.json"), "utf8"));
const countries = registry.countries.map(measureCountry);
const priorityText = readFileSync(join(ROOT, "src/data/priorityCountries.ts"), "utf8");
const priorityIso3 = [...priorityText.matchAll(/iso3:\s*"([A-Z]{3})"/gu)].map((match) => match[1]);
const measuredIso3 = new Set(countries.map((item) => item.iso3));
const futureCount = priorityIso3.filter((iso3) => !measuredIso3.has(iso3)).length;

// Everything in public/ that is not a country tree ships once, whatever the count.
const publicAll = measureDir(join(ROOT, "public"));
const countryBytes = countries.reduce((sum, item) => sum + item.totalBytes, 0);
const sharedPublicBytes = publicAll.bytes - countryBytes;
const buildDir = opt("--build");
const build = buildDir && existsSync(resolve(ROOT, buildDir)) ? measureDir(resolve(ROOT, buildDir)) : null;
const staticBytes = build ? build.bytes - publicAll.bytes : null;

const lower = countries.reduce((best, item) => (item.totalBytes < best.totalBytes ? item : best));
const upper = countries.reduce((best, item) => (item.totalBytes > best.totalBytes ? item : best));
const compressedTotal = (item) => item.totalBytes - item.downloads.rawBytes + item.downloads.zipPerElementBytes;
const scenario = (label, anchor, compressed) => {
  const measured = countries.reduce((sum, item) => sum + (compressed ? compressedTotal(item) : item.totalBytes), 0);
  const perFuture = compressed ? compressedTotal(anchor) : anchor.totalBytes;
  const deployBytes = measured + futureCount * perFuture + sharedPublicBytes + (staticBytes ?? 0);
  return { label, anchorIso3: anchor.iso3, compressedDownloads: compressed, futureCountries: futureCount, perFutureCountryMB: round(perFuture), deployMB: round(deployBytes) };
};

const report = {
  schemaVersion: "deployment-capacity-v158",
  generatedAt: new Date().toISOString().slice(0, 10),
  method: "public/ tree measured file by file; downloads gzip level 9 and per-element deflate level 9 + ZIP headers; forecast = measured countries + (priority countries not yet loaded) × anchor country, plus shared public files and the static bundle",
  priorityCountries: priorityIso3.length,
  measuredCountries: countries.length,
  futureCountries: futureCount,
  public: { ...publicAll, sharedNonCountryMB: round(sharedPublicBytes) },
  build: build ? { dir: buildDir, ...build, staticBundleMB: round(staticBytes) } : null,
  countries,
  forecast: [
    scenario("하한(가장 작은 측정 국가형)", lower, false),
    scenario("상한(가장 큰 측정 국가형)", upper, false),
    scenario("하한 · 다운로드 압축", lower, true),
    scenario("상한 · 다운로드 압축", upper, true),
  ],
};
const out = resolve(ROOT, opt("--out", "reports/v158/deployment-capacity-v158.json"));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ out: relative(ROOT, out), countries: countries.map((c) => ({ iso3: c.iso3, MB: c.totalMB, downloadsMB: c.downloads.rawMB, zipMB: c.downloads.zipPerElementMB, ratio: c.downloads.compressionRatio })), forecast: report.forecast.map((f) => `${f.label}: ${f.deployMB} MB`) }, null, 1));
