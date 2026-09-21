import { test, expect } from "@jest/globals";
import { sortHomeItemsV149 } from "./publicUsageV149";
const items = [{elementId:"A-003",publicTitle:"나",latestYear:2100},{elementId:"B-003",publicTitle:"가",latestYear:2020},{elementId:"C-003",publicTitle:"다",latestYear:2025}];
const dates = new Map([["A-003","2025-01-01"],["B-003","2026-09-01"],["C-003","2026-09-01"]]);
test("latest uses published data dates, not forecast years; ties use Korean title", () => {
  expect(sortHomeItemsV149(items,"latest",[],dates).map(i=>i.elementId)).toEqual(["B-003","C-003","A-003"]);
  expect(items[0].elementId).toBe("A-003");
});
test("global counts outrank publication date", () => {
  expect(sortHomeItemsV149(items,"views",[{elementId:"A-003",count:20},{elementId:"C-003",count:3}],dates).map(i=>i.elementId)).toEqual(["A-003","C-003","B-003"]);
});
