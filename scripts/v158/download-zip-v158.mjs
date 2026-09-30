/**
 * V158: read the per-element download ZIPs (tools/etl/download_zip_v158.py).
 *
 * The static downloads ship as one ZIP per element holding `<id>.json` and
 * `<id>.csv`. Audits and scripts that read those files read them through here.
 * Node's zlib is enough: the ZIPs hold stored or deflated members only.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { inflateRawSync } from "node:zlib";

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

/** Every member of a ZIP, by name. */
export function readZipMembersV158(pathOrBuffer) {
  const buffer = Buffer.isBuffer(pathOrBuffer) ? pathOrBuffer : readFileSync(pathOrBuffer);
  let end = -1;
  for (let at = buffer.length - 22; at >= Math.max(0, buffer.length - 22 - 0xffff); at -= 1) {
    if (buffer.readUInt32LE(at) === EOCD) {
      end = at;
      break;
    }
  }
  if (end < 0) throw new Error("ZIP_END_NOT_FOUND");
  const count = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16);
  const members = new Map();
  for (let index = 0; index < count; index += 1) {
    if (buffer.readUInt32LE(offset) !== CENTRAL) throw new Error("ZIP_CENTRAL_ENTRY_INVALID");
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const size = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    if (buffer.readUInt32LE(localOffset) !== LOCAL) throw new Error(`ZIP_LOCAL_HEADER_INVALID: ${name}`);
    const start = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
    const raw = buffer.subarray(start, start + compressedSize);
    const data = method === 0 ? Buffer.from(raw) : method === 8 ? inflateRawSync(raw) : null;
    if (!data) throw new Error(`ZIP_METHOD_UNSUPPORTED: ${name} (${method})`);
    if (data.length !== size) throw new Error(`ZIP_SIZE_MISMATCH: ${name}`);
    members.set(name, data);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return members;
}

/** `<dataRoot>/downloads/<id>.zip`, or null when the element has no download. */
export function downloadZipPathV158(dataRoot, elementId) {
  const path = resolve(dataRoot, "downloads", `${String(elementId).toLowerCase()}.zip`);
  return existsSync(path) ? path : null;
}

/** One member (`json` or `csv`) of an element's download ZIP as a Buffer, or null. */
export function readDownloadMemberV158(dataRoot, elementId, format) {
  const path = downloadZipPathV158(dataRoot, elementId);
  if (!path) return null;
  const token = String(elementId).toLowerCase();
  return readZipMembersV158(path).get(`${token}.${String(format).toLowerCase()}`) ?? null;
}

/** The download JSON document of an element, or null. */
export function readDownloadJsonV158(dataRoot, elementId) {
  const member = readDownloadMemberV158(dataRoot, elementId, "json");
  return member ? JSON.parse(member.toString("utf8")) : null;
}
