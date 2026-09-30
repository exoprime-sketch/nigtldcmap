import { test, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { gunzipSync } from "zlib";
import { join } from "path";
import { countryPublicDirV158 } from "../countryContext";
import { joinNationalMineAttributesV157_2, nationalMineAttributeLineV157_2 } from "./entityAttributeJoinV157_2";
import type { MinePointV157_2, NationalMineAttributeV157_2 } from "./entityAttributeJoinV157_2";

// Read B-048's real published entities the way the screens do (packs/, gzip+base64),
// the same asset scripts/v157-2/build-map-companions-v157.mjs reads from - so the
// join is tested against the actual 8 mines and their real 광종 labels, not a fixture
// that happens to be convenient.
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

test("B-048 carries the 8 mines this join is designed against, each with its own 광종", () => {
  expect(mines).toHaveLength(8);
  const byName = new Map(mines.map((m) => [m.name, m.normalizedAttributes["광종"]]));
  expect(byName.get("Ban Phuc")).toBe("니켈");
  expect(byName.get("Sin Quyen")).toBe("구리");
  expect(byName.get("Nui Phao")).toBe("텅스텐(+형석·비스무트·구리)");
});

function mkAttribute(overrides: Partial<NationalMineAttributeV157_2>): NationalMineAttributeV157_2 {
  return {
    elementId: "B-046",
    label: "확인 매장량",
    value: 3_500_000,
    unit: "t REO",
    period: "2026",
    source: "TEST-SOURCE",
    oreTypes: ["니켈", "리튬"],
    ...overrides,
  };
}

test("a mine whose own 광종 is in the target's ore list is attached the national value", () => {
  const rows = joinNationalMineAttributesV157_2(mines, [mkAttribute({})]);
  const banPhuc = rows.find((r) => r.name === "Ban Phuc")!;
  expect(banPhuc.oreType).toBe("니켈");
  expect(banPhuc.attached).toHaveLength(1);
  expect(banPhuc.attached[0]).toEqual({
    elementId: "B-046",
    label: "확인 매장량",
    value: 3_500_000,
    unit: "t REO",
    period: "2026",
    source: "TEST-SOURCE",
    scope: "국가 전체",
  });
});

test("a mine with no matching ore type is left with an empty list, never a guessed value", () => {
  const rows = joinNationalMineAttributesV157_2(mines, [mkAttribute({})]);
  const dongPao = rows.find((r) => r.name === "Dong Pao")!; // 희토류
  expect(dongPao.oreType).toBe("희토류");
  expect(dongPao.attached).toEqual([]);
});

test("a byproduct mentioned in parentheses never matches by substring", () => {
  // Núi Pháo's own 광종 names copper as a byproduct ("텅스텐(+형석·비스무트·구리)");
  // it must not pick up B-047's Lào Cai copper figure, which belongs to Sin Quyen.
  const copperTarget = mkAttribute({ elementId: "B-047", label: "구리 생산량", oreTypes: ["구리"] });
  const rows = joinNationalMineAttributesV157_2(mines, [copperTarget]);
  const nuiPhao = rows.find((r) => r.name === "Nui Phao")!;
  const sinQuyen = rows.find((r) => r.name === "Sin Quyen")!;
  expect(nuiPhao.attached).toEqual([]);
  expect(sinQuyen.attached).toHaveLength(1);
  expect(sinQuyen.attached[0].elementId).toBe("B-047");
});

test("two targets can attach to the same mine independently", () => {
  const nickel = mkAttribute({ elementId: "B-046", oreTypes: ["니켈", "리튬"] });
  const critical = mkAttribute({
    elementId: "B-044",
    label: "핵심광물 부존",
    value: 1,
    unit: "건",
    oreTypes: ["니켈", "희토류", "텅스텐(+형석·비스무트·구리)", "티타늄(ilmenite·leucoxene)", "보크사이트/알루미나"],
  });
  const rows = joinNationalMineAttributesV157_2(mines, [nickel, critical]);
  const banPhuc = rows.find((r) => r.name === "Ban Phuc")!;
  expect(banPhuc.attached.map((a) => a.elementId).sort()).toEqual(["B-044", "B-046"]);
});

test("every mine in B-048 is accounted for (no record silently dropped)", () => {
  const rows = joinNationalMineAttributesV157_2(mines, [mkAttribute({})]);
  expect(rows.map((r) => r.name)).toEqual(mines.map((m) => m.name));
});

test("nationalMineAttributeLineV157_2 states the value, unit, period and that it is national", () => {
  const line = nationalMineAttributeLineV157_2({
    elementId: "B-047",
    label: "구리 생산량",
    value: 3000,
    unit: "t (W 함량)",
    period: "2025",
    source: "TEST",
    scope: "국가 전체",
  });
  expect(line).toContain("3,000");
  expect(line).toContain("국가 전체");
  expect(line).toContain("2025");
});
