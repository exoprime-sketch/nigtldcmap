import { test, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { gunzipSync } from "zlib";
import { join } from "path";
import { countryPublicDirV158 } from "../countryContext";
import {
  applyNationalMineJoinV157_2,
  joinNationalMineAttributesV157_2,
  nationalMineAttributeLineV157_2,
  NATIONAL_VALUE_KEY_V157_2,
  oreEntriesV157_2,
} from "./entityAttributeJoinV157_2";
import type { MineJoinDeclarationV157_2, MinePointV157_2, NationalMineAttributeV157_2 } from "./entityAttributeJoinV157_2";

// Read B-048's real published entities the way the screens do (packs/, gzip+base64),
// so the join is tested against the delivered mines and their real 광종 labels.
const DATA_ROOT = join(__dirname, `../../../${countryPublicDirV158("VNM")}`);
const PUBLIC_ROOT = join(__dirname, "../../../public");
function loadB048Mines(): MinePointV157_2[] {
  const bundleIndex = JSON.parse(readFileSync(join(DATA_ROOT, "packs/bundle-index-v124.json"), "utf8"));
  const entry = bundleIndex.elements["B-048"];
  // packUrl is given relative to the public/ root, not relative to DATA_ROOT.
  const envelope = JSON.parse(readFileSync(join(PUBLIC_ROOT, entry.packUrl.replace(/^\//u, "")), "utf8"));
  const payload = JSON.parse(gunzipSync(Buffer.from(envelope.payloadChunks.join(""), "base64")).toString("utf8"));
  return payload.elements["B-048"].entities.records.map((record: { recordId?: string; name: string; normalizedAttributes: Record<string, unknown> }) => ({
    recordId: record.recordId ?? record.name,
    name: record.name,
    normalizedAttributes: record.normalizedAttributes,
  }));
}

const mines = loadB048Mines();
const mapIndex = JSON.parse(readFileSync(join(DATA_ROOT, "map-index.json"), "utf8")) as {
  layers: Array<{ elementId: string; featureCount: number; entityJoinV157_2?: MineJoinDeclarationV157_2 }>;
};

function mkAttribute(overrides: Partial<NationalMineAttributeV157_2>): NationalMineAttributeV157_2 {
  return {
    elementId: "B-046",
    mineral: "니켈",
    label: "매장량",
    valueText: "130,000 t",
    period: "2024",
    source: "TEST-SOURCE",
    oreTypes: ["니켈"],
    ...overrides,
  };
}

test("a mine lists its commodities with ' / '; a parenthesis stays inside its entry", () => {
  expect(oreEntriesV157_2("구리 / 니켈 / 코발트")).toEqual(["구리", "니켈", "코발트"]);
  expect(oreEntriesV157_2("텅스텐(+형석·비스무트·구리)")).toEqual(["텅스텐(+형석·비스무트·구리)"]);
  expect(oreEntriesV157_2("보크사이트/알루미나")).toEqual(["보크사이트/알루미나"]);
  expect(oreEntriesV157_2(null)).toEqual([]);
});

test("a mine one of whose own 광종 entries is in the target's ore list is attached the national value", () => {
  const rows = joinNationalMineAttributesV157_2(mines, [mkAttribute({})]);
  const nickel = rows.filter((row) => row.attached.length);
  expect(nickel.length).toBeGreaterThan(0);
  for (const row of nickel) expect(row.oreEntries).toContain("니켈");
  expect(nickel[0].attached[0]).toEqual({
    elementId: "B-046",
    mineral: "니켈",
    label: "매장량",
    valueText: "130,000 t",
    period: "2024",
    source: "TEST-SOURCE",
    scope: "국가 전체",
  });
});

test("a byproduct mentioned in parentheses never matches by substring", () => {
  const copper = mkAttribute({ elementId: "B-047", mineral: "구리", oreTypes: ["구리"] });
  const rows = joinNationalMineAttributesV157_2(mines, [copper]);
  const nuiPhao = rows.find((row) => row.oreEntries.includes("텅스텐(+형석·비스무트·구리)"))!;
  expect(nuiPhao).toBeDefined();
  expect(nuiPhao.attached).toEqual([]);
  for (const row of rows.filter((item) => item.attached.length)) expect(row.oreEntries).toContain("구리");
});

test("a mine with no matching ore type is left with an empty list, and every mine is accounted for", () => {
  const rows = joinNationalMineAttributesV157_2(mines, [mkAttribute({})]);
  expect(rows.map((row) => row.recordId)).toEqual(mines.map((mine) => mine.recordId));
  const iron = rows.filter((row) => row.oreEntries.length === 1 && row.oreEntries[0] === "철");
  expect(iron.length).toBeGreaterThan(0);
  for (const row of iron) expect(row.attached).toEqual([]);
});

test("applyNationalMineJoinV157_2 keeps only joined mines and never mutates the host's records", () => {
  const before = JSON.stringify(mines);
  const joined = applyNationalMineJoinV157_2(mines, { hostElementId: "B-048", attributes: [mkAttribute({})] });
  expect(JSON.stringify(mines)).toBe(before);
  expect(joined.length).toBeGreaterThan(0);
  for (const record of joined) {
    expect(String(record.normalizedAttributes[NATIONAL_VALUE_KEY_V157_2])).toContain("국가 전체");
  }
});

test("the published mineral layers count the same mines the runtime join keeps (build ↔ runtime parity)", () => {
  const bundleIndex = JSON.parse(readFileSync(join(DATA_ROOT, "packs/bundle-index-v124.json"), "utf8"));
  const envelope = JSON.parse(readFileSync(join(PUBLIC_ROOT, bundleIndex.elements["B-048"].packUrl.replace(/^\//u, "")), "utf8"));
  const host = JSON.parse(gunzipSync(Buffer.from(envelope.payloadChunks.join(""), "base64")).toString("utf8")).elements["B-048"].entities.records as Array<
    MinePointV157_2 & { latitude?: number; longitude?: number; mapEligible?: boolean }
  >;
  const layers = mapIndex.layers.filter((layer) => layer.entityJoinV157_2);
  expect(layers.map((layer) => layer.elementId).sort()).toEqual(["B-044", "B-046", "B-047"]);
  for (const layer of layers) {
    const shown = applyNationalMineJoinV157_2(host, layer.entityJoinV157_2!).filter(
      (record) => typeof record.latitude === "number" && typeof record.longitude === "number" && record.mapEligible !== false
    );
    expect(shown.length).toBe(layer.featureCount);
  }
});

test("nationalMineAttributeLineV157_2 states the mineral, figure, period and that it is national", () => {
  const line = nationalMineAttributeLineV157_2({
    elementId: "B-047",
    mineral: "구리",
    label: "광산 생산량",
    valueText: "30,000 t",
    period: "2023",
    source: "TEST",
    scope: "국가 전체",
  });
  expect(line).toBe("구리 광산 생산량 30,000 t(2023) — 국가 전체 값");
});
