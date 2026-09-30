/**
 * Is every B-017 polygon the platform serves a WRI Aqueduct polygon?
 *
 * The question a reader of the map is entitled to ask about an assessment zone is
 * where its outline came from. This compares the published geometry against the
 * vendored Aqueduct 4.0 subset (tools/vietnam_spatial/source, see that folder's
 * README for the archive, release and licence) unit by unit: same identifier, same
 * vertex count, identical coordinates. Any unit that is not an exact copy of a
 * source polygon is printed - a boundary this project drew itself would show up
 * here as a mismatch.
 *
 * Usage: node scripts/v157/verify-b017-source-v157.mjs
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const capsule = JSON.parse(
  gunzipSync(readFileSync("tools/vietnam_spatial/source/vnm-aqueduct40-baseline-annual-source.geojson.gz")).toString("utf8")
);
const published = JSON.parse(readFileSync("public/data/vietnam/v2/geometry/vnm-aqueduct40-basins.geojson", "utf8"));

const ringsOf = (geometry) => {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  return [];
};
const fingerprint = (geometry) => {
  const hash = createHash("sha256");
  for (const ring of ringsOf(geometry)) for (const [x, y] of ring) hash.update(`${x},${y};`);
  return { hash: hash.digest("hex"), vertices: ringsOf(geometry).reduce((sum, ring) => sum + ring.length, 0) };
};

const source = new Map(capsule.features.map((f) => [String(f.properties.string_id), f]));
const report = { capsuleFeatures: capsule.features.length, publishedFeatures: published.features.length, matched: 0, idsNotInSource: [], vertexMismatch: [], scoreMismatch: [] };

for (const feature of published.features) {
  const id = String(feature.properties.stringId ?? feature.properties.string_id ?? feature.id);
  const origin = source.get(id);
  if (!origin) {
    report.idsNotInSource.push(id);
    continue;
  }
  const a = fingerprint(feature.geometry);
  const b = fingerprint(origin.geometry);
  if (a.hash !== b.hash) report.vertexMismatch.push({ id, published: a.vertices, source: b.vertices });
  else report.matched += 1;
  const score = feature.properties.bwsScore ?? feature.properties.score ?? null;
  const sourceScore = origin.properties.bws_raw ?? origin.properties.bws_score ?? null;
  if (score !== null && sourceScore !== null && Math.abs(Number(score) - Number(sourceScore)) > 1e-9) {
    report.scoreMismatch.push({ id, published: score, source: sourceScore });
  }
}
report.missingFromPublished = [...source.keys()].filter((id) => !published.features.some((f) => String(f.properties.stringId ?? f.properties.string_id ?? f.id) === id));
console.log(JSON.stringify({ ...report, idsNotInSource: report.idsNotInSource.slice(0, 5), vertexMismatch: report.vertexMismatch.slice(0, 5), scoreMismatch: report.scoreMismatch.slice(0, 5) }, null, 1));
console.log("sample published properties:", JSON.stringify(published.features[0].properties));
