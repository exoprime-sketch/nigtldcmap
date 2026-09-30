/**
 * V158 (tests only): read a country's per-element download ZIP.
 *
 * The static downloads ship as `downloads/<id>.zip` holding `<id>.json` and
 * `<id>.csv` (tools/etl/download_zip_v158.py). Unit tests that use a delivered
 * download as a fixture read it through here. Not imported by the app.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { inflateRawSync } from "node:zlib";

import { countryPublicDirV158 } from "../countryContext";

const REPO_ROOT = resolve(__dirname, "../../..");

/** Every member of a ZIP file, by name. */
export function readZipMembersV158(path: string): Map<string, Buffer> {
  const buffer = readFileSync(path);
  let end = -1;
  for (let at = buffer.length - 22; at >= Math.max(0, buffer.length - 22 - 0xffff); at -= 1) {
    if (buffer.readUInt32LE(at) === 0x06054b50) {
      end = at;
      break;
    }
  }
  if (end < 0) throw new Error(`ZIP_END_NOT_FOUND: ${path}`);
  const count = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16);
  const members = new Map<string, Buffer>();
  for (let index = 0; index < count; index += 1) {
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    const start = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
    const raw = buffer.subarray(start, start + compressedSize);
    members.set(name, method === 0 ? Buffer.from(raw) : inflateRawSync(raw));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return members;
}

/** The download JSON document of an element (default country unless given). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readDownloadJsonV158(elementId: string, country: string = "VNM"): any {
  const token = elementId.toLowerCase();
  const path = resolve(REPO_ROOT, countryPublicDirV158(country), "downloads", `${token}.zip`);
  const member = readZipMembersV158(path).get(`${token}.json`);
  if (!member) throw new Error(`DOWNLOAD_MEMBER_MISSING: ${token}.json in ${path}`);
  return JSON.parse(member.toString("utf8"));
}
