// node --test scripts/v161/vietnamese-hangul-v161.test.mjs
// The transcription rules are held to the names the platform already spells:
// every pre-2025 and post-2025 province in the dictionaries must come out the
// same, so a proposal for a district follows the same rules as they do.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { vietnameseSyllablesV161, vietnameseToHangulV161 } from "./vietnamese-hangul-v161.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");

test("the 63 provinces and the 34 units transcribe to their dictionary names", () => {
  const ko63 = Object.fromEntries([...read("src/data/map/mapBackdropV150.ts").matchAll(/"(VN-[0-9A-Z]+)":"([^"]+)"/gu)].map((m) => [m[1], m[2]]));
  const aliases = JSON.parse(read("public/data/vietnam/v2/geometry/vnm-adm1-aliases.json")).aliases;
  const units = [...read("src/data/map/adminBoundaryV151.ts").matchAll(/unitCode: "(VN34-[0-9A-Z]+)", name: "([^"]+)", nameKo: "([^"]+)"/gu)];
  assert.equal(aliases.length, 63);
  assert.equal(units.length, 34);
  const misses = [
    ...aliases.map((row) => [row.canonicalName, ko63[row.adm1Code]]),
    ...units.map((m) => [m[2], m[3]]),
  ].filter(([local, ko]) => vietnameseToHangulV161(local).ko !== ko);
  assert.deepEqual(misses, []);
});

test("rules the dictionaries do not exercise", () => {
  const cases = {
    "Quy Nhơn": "꾸이년", // qu + y keeps the u; nh palatalises ơ
    "Nha Trang": "냐짱",
    "Đà Lạt": "달랏", // l after an open syllable → ㄹㄹ; t coda → ㅅ
    "Mỹ Tho": "미토",
    "Côn Đảo": "꼰다오",
    "Hà Tây": "하떠이",
    "Bạch Đằng": "바익당", // ach → 아익
  };
  for (const [local, ko] of Object.entries(cases)) assert.equal(vietnameseToHangulV161(local).ko, ko, local);
});

test("run-together names split into syllables", () => {
  assert.deepEqual(vietnameseSyllablesV161("QuảngBình"), ["Quảng", "Bình"]);
  assert.deepEqual(vietnameseSyllablesV161("ThừaThiênHuế"), ["Thừa", "Thiên", "Huế"]);
  assert.equal(vietnameseToHangulV161("QuảngBình").ko, "꽝빈");
});

test("a name that is not Vietnamese is refused, not guessed", () => {
  for (const name of ["Singapore", "Seoul", "Bangkok", "12"]) assert.equal(vietnameseToHangulV161(name).ok, false, name);
});

test("a name written without tone or vowel marks is flagged for review", () => {
  const result = vietnameseToHangulV161("Ha Tay");
  assert.equal(result.ok, true);
  assert.notEqual(result.reason, "");
});
