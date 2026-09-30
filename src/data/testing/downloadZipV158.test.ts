import { describe, expect, test } from "@jest/globals";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { readZipMembersV158 } from "./downloadZipV158";

const ROOT = resolve(__dirname, "../../..");
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const registry = JSON.parse(readFileSync(resolve(ROOT, "public/data/countries.json"), "utf8")) as {
  countries: { iso3: string; dataRoot: string }[];
};

interface ZipAssetV158 {
  format: string;
  url: string;
  sha256?: string;
  byteSize?: number;
  entries?: { fileName: string; byteSize?: number; sha256?: string }[];
}

describe("per-element download ZIPs V158", () => {
  for (const country of registry.countries) {
    test(`${country.iso3}: every ZIP holds exactly the files its catalog entry lists`, () => {
      const catalog = JSON.parse(readFileSync(resolve(ROOT, `public${country.dataRoot}`, "catalog.json"), "utf8")) as {
        elements: { elementId: string; downloadAssets?: ZipAssetV158[] | null }[];
      };
      const problems: string[] = [];
      let zips = 0;
      for (const element of catalog.elements) {
        for (const asset of element.downloadAssets || []) {
          if (asset.format !== "ZIP") {
            problems.push(`${element.elementId}: ${asset.format} asset (expected ZIP)`);
            continue;
          }
          zips += 1;
          const path = resolve(ROOT, "public", asset.url.replace(/^\//u, ""));
          const bytes = readFileSync(path);
          if (sha256(bytes) !== asset.sha256 || bytes.length !== asset.byteSize) problems.push(`${element.elementId}: ZIP digest`);
          const members = readZipMembersV158(path);
          const listed = (asset.entries || []).map((entry) => entry.fileName).sort();
          if (JSON.stringify([...members.keys()].sort()) !== JSON.stringify(listed)) problems.push(`${element.elementId}: members ${[...members.keys()]}`);
          for (const entry of asset.entries || []) {
            const member = members.get(entry.fileName);
            if (!member || member.length !== entry.byteSize || sha256(member) !== entry.sha256) problems.push(`${element.elementId}: ${entry.fileName}`);
          }
        }
      }
      expect(problems).toEqual([]);
      expect(zips).toBeGreaterThan(0);
    });
  }
});
