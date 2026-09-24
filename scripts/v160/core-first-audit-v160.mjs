/**
 * V160 facts the earlier audits need once the finder opens on the core tier.
 *
 * Audits enter the finder with `tier=all` (every public dataset) and the map
 * with `mapList=all` (every layer group unfolded), so their judgement is the
 * one they always made. What changes is only how many cards "every public
 * dataset" is: the ⓪ status elements (tier `hidden`) are no longer listed in
 * the finder (decision 2026-09-24), so the expected count is read from
 * src/data/spec/informationTiersV160.json instead of the fixed 152.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const TIERS = JSON.parse(readFileSync(resolve(ROOT, "src/data/spec/informationTiersV160.json"), "utf8")).rows;

/** Elements the finder lists with tier=all (every tier but hidden). */
export const FINDER_PUBLIC_IDS_V160 = TIERS.filter((row) => row.tier !== "hidden").map((row) => row.elementId);
export const FINDER_PUBLIC_COUNT_V160 = FINDER_PUBLIC_IDS_V160.length;
/** ⓪ status elements: reachable by their detail URL, not listed in the finder. */
export const FINDER_HIDDEN_IDS_V160 = new Set(TIERS.filter((row) => row.tier === "hidden").map((row) => row.elementId));

/** The finder's auto-load steps (24 at a time) up to `total`. */
export function finderAutoLoadSequenceV160(total = FINDER_PUBLIC_COUNT_V160, batch = 24) {
  const steps = [];
  for (let count = batch; count < total; count += batch) steps.push(count);
  steps.push(total);
  return steps;
}

/** Append the V160 "show everything" parameters to an audit URL. */
export function withAllTiersV160(url) {
  const next = new URL(url);
  next.searchParams.set("tier", "all");
  return next.toString();
}
export function withAllLayersV160(url) {
  const next = new URL(url);
  next.searchParams.set("mapList", "all");
  return next.toString();
}
