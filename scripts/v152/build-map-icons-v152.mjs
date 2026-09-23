#!/usr/bin/env node
// Deterministic generator for src/data/map/mapIconPathsV152.ts.
//
// Reads:
//   - 30 Tabler Icons outline SVGs from node_modules/@tabler/icons (MIT),
//     stripping Tabler's own bounding-box placeholder path.
//   - 2 Material Symbols SVGs from scripts/v152/icons/material/*.svg (Apache-2.0,
//     downloaded once from unpkg — see NOTICE.md in that folder).
//   - 2 custom SVGs from scripts/v152/icons/custom/*.svg (자체 제작 / composite
//     of two Tabler paths — see docs/MAP_ICON_CONTRACT_V152.md).
//
// Writes src/data/map/mapIconPathsV152.ts with one glyph record per icon id:
// viewBox, stroke/fill mode, ready-to-use `Path2D` `d` strings, source/licence
// metadata. Every run with the same inputs produces byte-identical output
// (sorted keys, no timestamps, no Math.random).
//
// Run: node scripts/v152/build-map-icons-v152.mjs
// Regenerate after: editing the icon set below, or the files under
// scripts/v152/icons/{material,custom}/.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const TABLER_OUTLINE_DIR = join(ROOT, "node_modules/@tabler/icons/icons/outline");
const TABLER_PACKAGE_JSON = join(ROOT, "node_modules/@tabler/icons/package.json");
const MATERIAL_DIR = join(ROOT, "scripts/v152/icons/material");
const CUSTOM_DIR = join(ROOT, "scripts/v152/icons/custom");
const OUT_FILE = join(ROOT, "src/data/map/mapIconPathsV152.ts");

const TABLER_BBOX_PLACEHOLDER_D = "M0 0h24v24H0z";
const MATERIAL_VERSION = "0.47.5"; // @material-symbols/svg-400, pinned in the unpkg URL (see NOTICE.md)
const CUSTOM_VERSION = "1.0.0";

/** The 30 Tabler outline icons this module uses; id === Tabler's own file name. */
const TABLER_ICON_IDS = [
  "droplet",
  "solar-panel-2",
  "windmill",
  "flame",
  "barrel",
  "plant-2",
  "recycle",
  "radioactive",
  "volcano",
  "bolt",
  "storm",
  "tornado",
  "sun-high",
  "virus",
  "bug",
  "temperature-sun",
  "alert-triangle",
  "cloud-down",
  "ripple",
  "gauge",
  "droplets",
  "pick",
  "certificate",
  "world",
  "building-bank",
  "school",
  "flask",
  "heart-handshake",
  "coin",
  "building-skyscraper",
  "building",
];

/** Material Symbols (outlined, fill-based); id === downloaded file name. */
const MATERIAL_ICON_IDS = ["flood", "landslide"];

/**
 * Custom SVGs. `flame-barrel` is a composite of two Tabler paths (flame
 * scaled ~0.57x into the upper right, barrel scaled 0.875x into the lower
 * left of a 24x24 box); the scale/translate used to hand-build the file are
 * recorded here for provenance even though `paths` already has them baked
 * in (Path2D takes only `d`, it cannot apply a transform itself).
 */
const CUSTOM_MANIFEST = {
  coal: {
    mode: "stroke",
    source: "자체 제작",
    sourceName: "coal",
    license: "CC0-1.0",
    version: CUSTOM_VERSION,
  },
  "flame-barrel": {
    mode: "stroke",
    source: "Tabler Icons",
    sourceName: "flame + barrel",
    license: "MIT",
    version: null, // filled in with the Tabler package version below
    partTransforms: [
      { scale: 0.875, translate: [-2.5, 5.5] }, // barrel outline
      { scale: 0.875, translate: [-2.5, 5.5] }, // barrel band 1
      { scale: 0.875, translate: [-2.5, 5.5] }, // barrel band 2
      { scale: 0.875, translate: [-2.5, 5.5] }, // barrel hoop 1
      { scale: 0.875, translate: [-2.5, 5.5] }, // barrel hoop 2
      { scale: 0.57, translate: [10.15, -0.14] }, // flame
    ],
  },
};

function assertOnlyKnownTags(svgText, filePath) {
  const tags = new Set();
  for (const match of svgText.matchAll(/<\/?([a-zA-Z][\w-]*)/g)) tags.add(match[1].toLowerCase());
  const unexpected = [...tags].filter((tag) => tag !== "svg" && tag !== "path");
  if (unexpected.length > 0) {
    throw new Error(
      `${filePath}: expected only <svg>/<path> elements, found <${unexpected.join(">, <")}> — ` +
        "this icon needs manual review before it can go through the generator."
    );
  }
}

function extractViewBox(svgText, filePath) {
  const match = svgText.match(/<svg\b[^>]*\bviewBox="([^"]+)"/u);
  if (!match) throw new Error(`${filePath}: <svg> has no viewBox attribute`);
  return match[1];
}

function extractPathDs(svgText, filePath) {
  const ds = [];
  for (const match of svgText.matchAll(/<path\b([^>]*)>/gu)) {
    const attrs = match[1];
    const dMatch = attrs.match(/\bd="([^"]*)"/u);
    if (!dMatch) throw new Error(`${filePath}: <path> element with no d attribute`);
    if (dMatch[1] === TABLER_BBOX_PLACEHOLDER_D) continue; // Tabler's own bounding-box placeholder
    ds.push(dMatch[1]);
  }
  if (ds.length === 0) throw new Error(`${filePath}: no usable <path> data left after stripping the placeholder`);
  return ds;
}

function readGlyphSource(filePath) {
  const svgText = readFileSync(filePath, "utf8");
  assertOnlyKnownTags(svgText, filePath);
  return { viewBox: extractViewBox(svgText, filePath), paths: extractPathDs(svgText, filePath) };
}

function buildGlyphs() {
  const tablerPackage = JSON.parse(readFileSync(TABLER_PACKAGE_JSON, "utf8"));
  const tablerVersion = tablerPackage.version;
  if (!tablerVersion) throw new Error("could not read @tabler/icons version from its package.json");
  CUSTOM_MANIFEST["flame-barrel"].version = tablerVersion;

  const glyphs = {};

  for (const id of TABLER_ICON_IDS) {
    const filePath = join(TABLER_OUTLINE_DIR, `${id}.svg`);
    const { viewBox, paths } = readGlyphSource(filePath);
    glyphs[id] = {
      viewBox,
      mode: "stroke",
      paths,
      source: "Tabler Icons",
      sourceName: id,
      license: "MIT",
      version: tablerVersion,
    };
  }

  const materialFiles = readdirSync(MATERIAL_DIR).filter((name) => name.endsWith(".svg"));
  const materialIds = materialFiles.map((name) => name.replace(/\.svg$/u, "")).sort();
  const expectedMaterialIds = [...MATERIAL_ICON_IDS].sort();
  if (materialIds.join(",") !== expectedMaterialIds.join(",")) {
    throw new Error(
      `scripts/v152/icons/material has ${JSON.stringify(materialIds)}, expected ${JSON.stringify(expectedMaterialIds)}`
    );
  }
  for (const id of MATERIAL_ICON_IDS) {
    const filePath = join(MATERIAL_DIR, `${id}.svg`);
    const { viewBox, paths } = readGlyphSource(filePath);
    glyphs[id] = {
      viewBox,
      mode: "fill",
      paths,
      source: "Material Symbols",
      sourceName: id,
      license: "Apache-2.0",
      version: MATERIAL_VERSION,
    };
  }

  const customFiles = readdirSync(CUSTOM_DIR).filter((name) => name.endsWith(".svg"));
  const customIds = customFiles.map((name) => name.replace(/\.svg$/u, "")).sort();
  const expectedCustomIds = Object.keys(CUSTOM_MANIFEST).sort();
  if (customIds.join(",") !== expectedCustomIds.join(",")) {
    throw new Error(`scripts/v152/icons/custom has ${JSON.stringify(customIds)}, expected ${JSON.stringify(expectedCustomIds)}`);
  }
  for (const id of Object.keys(CUSTOM_MANIFEST)) {
    const filePath = join(CUSTOM_DIR, `${id}.svg`);
    const { viewBox, paths } = readGlyphSource(filePath);
    const manifestEntry = CUSTOM_MANIFEST[id];
    if (manifestEntry.partTransforms && paths.length !== manifestEntry.partTransforms.length) {
      throw new Error(`${filePath}: expected ${manifestEntry.partTransforms.length} paths for recorded partTransforms, found ${paths.length}`);
    }
    glyphs[id] = {
      viewBox,
      mode: manifestEntry.mode,
      paths,
      ...(manifestEntry.partTransforms ? { partTransforms: manifestEntry.partTransforms } : {}),
      source: manifestEntry.source,
      sourceName: manifestEntry.sourceName,
      license: manifestEntry.license,
      version: manifestEntry.version,
    };
  }

  return glyphs;
}

function renderTypeScript(glyphs) {
  const ids = Object.keys(glyphs).sort();
  const sorted = {};
  for (const id of ids) sorted[id] = glyphs[id];

  const idUnion = ids.map((id) => `  | "${id}"`).join("\n");
  const body = JSON.stringify(sorted, null, 2)
    // JSON.stringify quotes every key; TS is fine with that, but re-indent
    // under the exported const with two extra spaces for readability.
    .split("\n")
    .join("\n");

  return `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Regenerate with:
 *   node scripts/v152/build-map-icons-v152.mjs
 *
 * Source SVGs:
 *   - Tabler Icons (MIT) — node_modules/@tabler/icons/icons/outline/*.svg
 *   - Material Symbols (Apache-2.0) — scripts/v152/icons/material/*.svg
 *   - Custom (자체 제작 / composite) — scripts/v152/icons/custom/*.svg
 *
 * See docs/MAP_ICON_CONTRACT_V152.md for the licence table and how to add
 * an icon. Every path's \`d\` string is ready for \`new Path2D(d)\`.
 */

export type MapIconIdV152 =
${idUnion};

export interface MapIconPartTransformV152 {
  /** Uniform scale applied to the original source path before translation. */
  scale: number;
  /** Translation in the icon's own viewBox units, applied after scaling. */
  translate: [number, number];
}

export interface MapIconGlyphV152 {
  viewBox: string;
  mode: "stroke" | "fill";
  /** Path \`d\` strings, already usable with \`new Path2D(d)\`. */
  paths: string[];
  /**
   * Per-path transform record for hand-built composites (same length as
   * \`paths\` when present). Informational: \`paths\` already has the
   * transform baked in, since Path2D cannot apply one at draw time.
   */
  partTransforms?: MapIconPartTransformV152[];
  source: "Tabler Icons" | "Material Symbols" | "자체 제작";
  sourceName: string;
  license: "MIT" | "Apache-2.0" | "CC0-1.0";
  version: string;
}

export const MAP_ICON_PATHS_V152: Record<MapIconIdV152, MapIconGlyphV152> = ${body};
`;
}

function main() {
  const glyphs = buildGlyphs();
  const source = renderTypeScript(glyphs);
  writeFileSync(OUT_FILE, source, "utf8");
  process.stdout.write(`wrote ${OUT_FILE} (${Object.keys(glyphs).length} icons)\n`);
}

main();
