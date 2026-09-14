#!/usr/bin/env node
/**
 * How many power plants does A-023 actually describe?
 *
 * A-023 is two deliveries in one element: World Resources Institute rows and
 * OpenStreetMap rows. Neither carries the other's identifier, so "no shared id"
 * is not evidence that nothing overlaps - and the record count is not a plant
 * count. This reports both, and the overlap it can actually demonstrate.
 *
 * A pair is treated as the same facility only on evidence the sources both
 * state: the two points are within a distance threshold, the fuel agrees, and
 * the capacity agrees to within 2%. Proximity alone is reported separately and
 * never counted as a match - two plants can share a site.
 *
 * Nothing here deletes or merges a record. The result is a reviewed count and a
 * list of confirmed pairs, so the screen can say how many source records there
 * are and how many of them are known to describe the same plant.
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import { gunzipSync } from "node:zlib";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const DATA = resolve(ROOT, opt("--data", ".verify/candidate/build/data/vietnam/v2"));
const OUT = resolve(ROOT, opt("--out", "reports/final-data-integration"));
// 150 m, the distance at which two records of the same plant plausibly sit and
// two different plants rarely do. Wider thresholds are reported alongside so the
// choice is visible rather than assumed.
const MATCH_METRES = Number(opt("--metres", "150"));
const CAPACITY_TOLERANCE = 0.02;

function packRecords(elementId) {
  const dir = resolve(DATA, "packs");
  for (const file of readdirSync(dir).filter((n) => n.startsWith("vnm-v124-pack-"))) {
    const envelope = JSON.parse(readFileSync(resolve(dir, file), "utf8"));
    const payload = JSON.parse(
      gunzipSync(Buffer.from(envelope.payloadChunks.join(""), "base64")).toString("utf8")
    );
    if ((payload.elementIds || []).includes(elementId)) {
      return ((payload.elements[elementId] || {}).entities || {}).records || [];
    }
  }
  return [];
}

const EARTH_RADIUS_M = 6371000;
const radians = (degrees) => (degrees * Math.PI) / 180;
function metresBetween(a, b) {
  const dLat = radians(b.latitude - a.latitude);
  const dLng = radians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

const attributes = (record) => record.normalizedAttributes || {};
const fuelOf = (record) => {
  const a = attributes(record);
  return String(a.fuelTypeRaw || a.primaryFuel || "").trim().toLowerCase();
};
const capacityOf = (record) => {
  const a = attributes(record);
  const value = Number(a.capacityMw ?? a.mw);
  return Number.isFinite(value) ? value : null;
};
const noteField = (record, pattern) => (pattern.exec(record.note || "") || [])[1] || null;
const sourceOrg = (record) => (record.provenance || {}).sourceOrg || "";

function main() {
  const records = packRecords("A-023");
  const located = records.filter(
    (r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude)
  );
  const wri = records.filter((r) => sourceOrg(r).startsWith("World Resources"));
  const osm = records.filter((r) => sourceOrg(r).startsWith("OpenStreetMap"));

  // Coarse cells so this is not every WRI row against every OSM row.
  const cellKey = (record, dy = 0, dx = 0) =>
    `${Math.round(record.latitude * 100) + dy}:${Math.round(record.longitude * 100) + dx}`;
  const grid = new Map();
  for (const record of osm) {
    if (!Number.isFinite(record.latitude)) continue;
    for (const dy of [-1, 0, 1]) {
      for (const dx of [-1, 0, 1]) {
        const key = cellKey(record, dy, dx);
        grid.set(key, (grid.get(key) || []).concat(record));
      }
    }
  }

  const measure = (limit) => {
    const confirmed = [];
    let fuelOnly = 0;
    let proximityOnly = 0;
    const withNeighbour = new Set();
    for (const left of wri) {
      if (!Number.isFinite(left.latitude)) continue;
      const near = (grid.get(cellKey(left)) || []).filter(
        (right) => metresBetween(left, right) <= limit
      );
      if (!near.length) continue;
      withNeighbour.add(left.recordId);
      const leftFuel = fuelOf(left);
      const leftCapacity = capacityOf(left);
      const sameFuel = near.filter((right) => leftFuel && fuelOf(right) === leftFuel);
      if (!sameFuel.length) {
        proximityOnly += 1;
        continue;
      }
      const sameCapacity = sameFuel.filter((right) => {
        const rightCapacity = capacityOf(right);
        return (
          leftCapacity !== null &&
          rightCapacity !== null &&
          Math.abs(rightCapacity - leftCapacity) <=
            Math.max(0.5, leftCapacity * CAPACITY_TOLERANCE)
        );
      });
      if (!sameCapacity.length) {
        fuelOnly += 1;
        continue;
      }
      const right = sameCapacity[0];
      confirmed.push({
        wriRecordId: left.recordId,
        wriPlantId: noteField(left, /\[발전소ID:\s*([^\]]+)\]/u),
        wriName: noteField(left, /명칭:\s*([^·\n]+)/u),
        osmRecordId: right.recordId,
        osmObjectId: attributes(right).field_33702ec7 || null,
        osmName: right.name,
        fuel: leftFuel,
        capacityMw: leftCapacity,
        metresApart: Math.round(metresBetween(left, right)),
      });
    }
    return { limit, confirmed, fuelOnly, proximityOnly, withNeighbour: withNeighbour.size };
  };

  const thresholds = [50, 150, 500, 1000].map(measure);
  const chosen = thresholds.find((row) => row.limit === MATCH_METRES) || thresholds[1];

  const withCapacity = located.filter((r) => capacityOf(r) !== null);
  const capacitySum = withCapacity.reduce((total, r) => total + capacityOf(r), 0);

  const report = {
    schema: "nigt-a023-identity-1",
    generatedAt: new Date().toISOString(),
    dataRoot: relative(ROOT, DATA).split(sep).join("/"),
    sourceRecordCount: records.length,
    bySource: {
      "World Resources Institute": wri.length,
      "OpenStreetMap contributors": osm.length,
    },
    recordsWithCoordinates: located.length,
    mapEligibleRecordCount: records.filter((r) => r.mapEligible).length,
    identifiers: {
      osmObjectIds: new Set(
        osm.map((r) => attributes(r).field_33702ec7).filter(Boolean)
      ).size,
      wriPlantIds: new Set(
        wri.map((r) => noteField(r, /\[발전소ID:\s*([^\]]+)\]/u)).filter(Boolean)
      ).size,
      sharedIdentifierSystem: null,
      note:
        "The two deliveries use different identifier systems and share none, " +
        "so an identifier join is impossible in either direction. That is a " +
        "reason to measure the overlap on other evidence, not to declare it zero.",
    },
    sameFacilityRule: {
      metres: MATCH_METRES,
      capacityTolerance: CAPACITY_TOLERANCE,
      requires: ["distance", "same fuel", "capacity within tolerance"],
    },
    sameFacilityByThreshold: thresholds.map((row) => ({
      metres: row.limit,
      wriRowsWithAnyNeighbour: row.withNeighbour,
      confirmedSameFacility: row.confirmed.length,
      sameFuelCapacityNotComparable: row.fuelOnly,
      proximityOnlyDifferentFuel: row.proximityOnly,
    })),
    confirmedPairs: chosen.confirmed,
    uniqueFacilityCount: {
      sourceRecords: records.length,
      confirmedDuplicatePairs: chosen.confirmed.length,
      lowerBoundDistinctFacilities: records.length - chosen.confirmed.length,
      meaning:
        "A lower bound on how many records describe distinct plants, not a " +
        "verified national plant count. Overlap that the two deliveries do not " +
        "both describe cannot be confirmed from what they publish.",
    },
    capacity: {
      recordsStatingCapacity: withCapacity.length,
      recordsWithoutCapacity: located.length - withCapacity.length,
      sumOfStatedCapacityMw: Number(capacitySum.toFixed(1)),
      doNotUseAs:
        "국가 총설비용량. Fewer than a third of the records state a capacity, " +
        "and the confirmed duplicate pairs are counted twice in this sum.",
    },
  };

  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    resolve(OUT, "a023-identity-v137.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8"
  );
  console.log(
    JSON.stringify({ ...report, confirmedPairs: `${chosen.confirmed.length} pairs` }, null, 2)
  );
}

main();
