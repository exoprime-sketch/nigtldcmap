import type { Dataset } from "../../types/dataset";
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";
import {
  elementIdFromPublicSlugV121,
  isVietnamElementIdV121,
} from "./vietnamElementSlugsV121";
import {
  VIETNAM_DATA_RUNTIME_VERSION_V121,
} from "./vietnamTypesV121";
import type {
  VietnamAssetErrorCodeV121,
  VietnamBundleIndexElementV121,
  VietnamBundleIndexV121,
  VietnamCatalogElementV121,
  VietnamElementDataBundleV121,
  VietnamElementMetaBundleV121,
  VietnamElementShardPayloadV121,
  VietnamEntityV121,
  VietnamManifestV121,
  VietnamMapLayerV121,
  VietnamObservationV121,
  VietnamQualityReportV121,
  VietnamShardEnvelopeV121R2,
  VietnamShardV121,
} from "./vietnamTypesV121";

const MANIFEST_URL = publicAssetUrlV128("data/vietnam/v1/manifest.json");
const BUNDLE_INDEX_URL = publicAssetUrlV128(
  "data/vietnam/v1/packs-r2/bundle-index-v121r2.json"
);

const jsonCache = new Map<string, Promise<unknown>>();
const envelopeCache = new Map<
  string,
  Promise<{ bytes: Uint8Array; envelope: VietnamShardEnvelopeV121R2 }>
>();
const packCache = new Map<string, Promise<VietnamShardV121>>();
const elementCache = new Map<string, Promise<VietnamElementShardPayloadV121>>();
let manifestCache: Promise<VietnamManifestV121> | null = null;
let bundleIndexCache: Promise<VietnamBundleIndexV121> | null = null;

export class VietnamAssetErrorV121 extends Error {
  readonly code: VietnamAssetErrorCodeV121;
  readonly details: Record<string, unknown>;

  constructor(
    code: VietnamAssetErrorCodeV121,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "VietnamAssetErrorV121";
    this.code = code;
    this.details = details;
  }
}

export function isVietnamAssetErrorV121(
  error: unknown
): error is VietnamAssetErrorV121 {
  return error instanceof VietnamAssetErrorV121;
}

export function publicVietnamDataErrorMessageV121(
  _error: unknown,
  context: "data" | "map" | "download" = "data"
): string {
  if (context === "map") return "지도 데이터를 불러오지 못했습니다";
  if (context === "download") return "다운로드할 데이터를 불러오지 못했습니다";
  return "데이터를 불러오지 못했습니다";
}

function cachePromise<T>(
  cache: Map<string, Promise<any>>,
  key: string,
  factory: () => Promise<T>
): Promise<T> {
  const existing = cache.get(key);
  if (existing) return existing as Promise<T>;
  const pending = factory().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, pending as Promise<unknown>);
  return pending;
}

function startsWithHtml(value: string): boolean {
  const trimmed = value.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}

async function fetchTextChecked(
  url: string,
  cacheMode: RequestCache = "default"
): Promise<{ text: string; contentType: string; responseUrl: string }> {
  const requestUrl = publicAssetUrlV128(url);
  let response: Response;
  try {
    response = await fetch(requestUrl, { cache: cacheMode });
  } catch (error) {
    throw new VietnamAssetErrorV121(
      "ASSET_HTTP_ERROR",
      `정적 자산 요청 실패: ${requestUrl}`,
      {
        url: requestUrl,
        cause: error instanceof Error ? error.message : String(error),
      }
    );
  }
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  const responseUrl = response.url || requestUrl;
  const sample = text.slice(0, 200);

  if (!response.ok) {
    throw new VietnamAssetErrorV121(
      response.status === 404 ? "ASSET_NOT_FOUND" : "ASSET_HTTP_ERROR",
      `정적 자산 응답 오류: ${response.status}`,
      { url, responseUrl, status: response.status, contentType, sample }
    );
  }
  if (contentType.toLowerCase().includes("text/html") || startsWithHtml(text)) {
    throw new VietnamAssetErrorV121(
      "ASSET_HTML_FALLBACK",
      "정적 데이터 대신 HTML 문서가 응답되었습니다",
      { url, responseUrl, status: response.status, contentType, sample }
    );
  }
  if (!text.trim()) {
    throw new VietnamAssetErrorV121(
      "ASSET_EMPTY",
      "정적 자산이 비어 있습니다",
      {
        url,
        responseUrl,
        status: response.status,
        contentType,
      }
    );
  }
  return { text, contentType, responseUrl };
}

async function fetchJson<T>(
  url: string,
  cacheMode: RequestCache = "default"
): Promise<T> {
  return cachePromise(jsonCache, `${cacheMode}:${url}`, async () => {
    const result = await fetchTextChecked(url, cacheMode);
    try {
      return JSON.parse(result.text) as T;
    } catch (error) {
      throw new VietnamAssetErrorV121(
        "ASSET_JSON_INVALID",
        "정적 자산의 JSON 형식이 올바르지 않습니다",
        {
          url,
          responseUrl: result.responseUrl,
          contentType: result.contentType,
          sample: result.text.slice(0, 200),
          cause: error instanceof Error ? error.message : String(error),
        }
      );
    }
  });
}

function assertElementId(elementId: string): void {
  if (!isVietnamElementIdV121(elementId)) {
    throw new VietnamAssetErrorV121(
      "ELEMENT_ID_INVALID",
      "올바르지 않은 데이터 요소입니다",
      { elementId }
    );
  }
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new VietnamAssetErrorV121(
      "ASSET_SCHEMA_INVALID",
      "SHA-256 검증 기능을 사용할 수 없습니다"
    );
  }
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  );
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function validateEnvelope(
  value: unknown,
  url: string
): VietnamShardEnvelopeV121R2 {
  const payload = value as Partial<VietnamShardEnvelopeV121R2>;
  const chunks = payload.payloadChunks;
  if (
    payload.schemaVersion !== "v121" ||
    payload.runtimeVersion !== VIETNAM_DATA_RUNTIME_VERSION_V121 ||
    payload.transportEncoding !== "gzip-base64-chunks-v2" ||
    !payload.shardId ||
    !payload.resourceType ||
    !Number.isInteger(payload.compressedByteSize) ||
    !Number.isInteger(payload.contentByteSize) ||
    !/^[a-f0-9]{64}$/.test(payload.compressedSha256 || "") ||
    !/^[a-f0-9]{64}$/.test(payload.contentSha256 || "") ||
    !Array.isArray(chunks) ||
    chunks.length === 0 ||
    payload.payloadChunkCount !== chunks.length ||
    chunks.some(
      (chunk) =>
        typeof chunk !== "string" ||
        chunk.length === 0 ||
        chunk.length > 8192 ||
        chunk.length % 4 !== 0 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(chunk)
    )
  ) {
    throw new VietnamAssetErrorV121(
      "ASSET_ENVELOPE_INVALID",
      "정적 데이터 envelope 계약이 올바르지 않습니다",
      { url }
    );
  }
  return payload as VietnamShardEnvelopeV121R2;
}

function decodeBase64Chunks(chunks: string[], url: string): Uint8Array {
  try {
    const decoded = chunks.map((chunk) => {
      const binary = atob(chunk);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      return bytes;
    });
    const length = decoded.reduce((sum, bytes) => sum + bytes.byteLength, 0);
    const merged = new Uint8Array(length);
    let offset = 0;
    decoded.forEach((bytes) => {
      merged.set(bytes, offset);
      offset += bytes.byteLength;
    });
    return merged;
  } catch (error) {
    throw new VietnamAssetErrorV121(
      "ASSET_BASE64_INVALID",
      "정적 데이터의 base64 payload가 올바르지 않습니다",
      { url, cause: error instanceof Error ? error.message : String(error) }
    );
  }
}

async function decompressGzip(
  compressed: Uint8Array,
  url: string
): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new VietnamAssetErrorV121(
      "ASSET_DECOMPRESSION_UNSUPPORTED",
      "이 브라우저에서는 압축 데이터 해제를 지원하지 않습니다",
      { url }
    );
  }
  try {
    const stream = new Blob([compressed])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch (error) {
    throw new VietnamAssetErrorV121(
      "ASSET_DECOMPRESSION_FAILED",
      "정적 데이터 압축 해제에 실패했습니다",
      { url, cause: error instanceof Error ? error.message : String(error) }
    );
  }
}

async function loadEnvelopeContent(
  url: string,
  expectedResourceType?: VietnamShardEnvelopeV121R2["resourceType"]
): Promise<{ bytes: Uint8Array; envelope: VietnamShardEnvelopeV121R2 }> {
  return cachePromise(envelopeCache, url, async () => {
    const result = await fetchTextChecked(url);
    let raw: unknown;
    try {
      raw = JSON.parse(result.text);
    } catch (error) {
      throw new VietnamAssetErrorV121(
        "ASSET_JSON_INVALID",
        "정적 데이터 envelope의 JSON 형식이 올바르지 않습니다",
        {
          url,
          sample: result.text.slice(0, 200),
          cause: error instanceof Error ? error.message : String(error),
        }
      );
    }
    const envelope = validateEnvelope(raw, url);
    if (
      expectedResourceType &&
      envelope.resourceType !== expectedResourceType
    ) {
      throw new VietnamAssetErrorV121(
        "ASSET_SCHEMA_INVALID",
        "정적 데이터 유형이 요청과 일치하지 않습니다",
        { url, expectedResourceType, actual: envelope.resourceType }
      );
    }
    const compressed = decodeBase64Chunks(envelope.payloadChunks, url);
    if (compressed.byteLength !== envelope.compressedByteSize) {
      throw new VietnamAssetErrorV121(
        "ASSET_COMPRESSED_SIZE_MISMATCH",
        "압축 데이터 크기가 일치하지 않습니다",
        {
          url,
          actual: compressed.byteLength,
          expected: envelope.compressedByteSize,
        }
      );
    }
    const compressedHash = await sha256Hex(compressed);
    if (compressedHash !== envelope.compressedSha256) {
      throw new VietnamAssetErrorV121(
        "ASSET_COMPRESSED_HASH_MISMATCH",
        "압축 데이터의 무결성 검증에 실패했습니다",
        { url, actual: compressedHash, expected: envelope.compressedSha256 }
      );
    }
    const content = await decompressGzip(compressed, url);
    if (content.byteLength !== envelope.contentByteSize) {
      throw new VietnamAssetErrorV121(
        "ASSET_CONTENT_SIZE_MISMATCH",
        "원문 데이터 크기가 일치하지 않습니다",
        { url, actual: content.byteLength, expected: envelope.contentByteSize }
      );
    }
    const contentHash = await sha256Hex(content);
    if (contentHash !== envelope.contentSha256) {
      throw new VietnamAssetErrorV121(
        "ASSET_CONTENT_HASH_MISMATCH",
        "원문 데이터의 무결성 검증에 실패했습니다",
        { url, actual: contentHash, expected: envelope.contentSha256 }
      );
    }
    return { bytes: content, envelope };
  });
}

function parseContentJson<T>(bytes: Uint8Array, url: string): T {
  try {
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    ) as T;
  } catch (error) {
    throw new VietnamAssetErrorV121(
      "ASSET_JSON_INVALID",
      "압축 해제된 데이터의 JSON 형식이 올바르지 않습니다",
      { url, cause: error instanceof Error ? error.message : String(error) }
    );
  }
}

function validateBundleIndex(payload: VietnamBundleIndexV121): void {
  const elementIds = Object.keys(payload.elements || {});
  if (
    payload.schemaVersion !== "v121" ||
    payload.runtimeVersion !== VIETNAM_DATA_RUNTIME_VERSION_V121 ||
    payload.assetLayoutVersion !== "gzip-base64-json-envelope-v2" ||
    payload.elementCount !== 152 ||
    elementIds.length !== 152 ||
    !Array.isArray(payload.packs) ||
    payload.packs.length !== payload.packCount
  ) {
    throw new VietnamAssetErrorV121(
      "ASSET_SCHEMA_INVALID",
      "베트남 데이터 index 계약이 올바르지 않습니다"
    );
  }
}

export async function loadVietnamManifestV121(): Promise<VietnamManifestV121> {
  if (!manifestCache) {
    manifestCache = fetchJson<VietnamManifestV121>(MANIFEST_URL, "no-store")
      .then((payload) => {
        if (
          payload.schemaVersion !== "v121" ||
          payload.runtimeVersion !== VIETNAM_DATA_RUNTIME_VERSION_V121 ||
          payload.assetLayoutVersion !== "gzip-base64-json-envelope-v2"
        ) {
          throw new VietnamAssetErrorV121(
            "ASSET_SCHEMA_INVALID",
            "베트남 데이터 manifest 계약이 올바르지 않습니다"
          );
        }
        return payload;
      })
      .catch((error) => {
        manifestCache = null;
        throw error;
      });
  }
  return manifestCache;
}

export async function loadVietnamBundleIndexV121(): Promise<VietnamBundleIndexV121> {
  if (!bundleIndexCache) {
    bundleIndexCache = fetchJson<VietnamBundleIndexV121>(
      BUNDLE_INDEX_URL,
      "no-store"
    )
      .then((payload) => {
        validateBundleIndex(payload);
        return payload;
      })
      .catch((error) => {
        bundleIndexCache = null;
        throw error;
      });
  }
  return bundleIndexCache;
}

async function loadVerifiedPack(
  entry: VietnamBundleIndexElementV121
): Promise<VietnamShardV121> {
  const existing = packCache.get(entry.packUrl);
  if (existing) return existing;
  const pending = (async () => {
    const { bytes, envelope } = await loadEnvelopeContent(
      entry.packUrl,
      "element-shard"
    );
    if (
      envelope.shardId !== entry.shardId ||
      envelope.compressedByteSize !== entry.compressedByteSize ||
      envelope.compressedSha256 !== entry.compressedSha256 ||
      envelope.contentByteSize !== entry.contentByteSize ||
      envelope.contentSha256 !== entry.contentSha256
    ) {
      throw new VietnamAssetErrorV121(
        "ASSET_SCHEMA_INVALID",
        "정적 데이터 index와 pack의 무결성 정보가 일치하지 않습니다",
        { packUrl: entry.packUrl, shardId: entry.shardId }
      );
    }
    const payload = parseContentJson<VietnamShardV121>(bytes, entry.packUrl);
    if (
      payload.schemaVersion !== "v121" ||
      payload.assetLayoutVersion !== "sharded-element-bundles-v1" ||
      payload.shardId !== entry.shardId ||
      !payload.elements ||
      typeof payload.elements !== "object"
    ) {
      throw new VietnamAssetErrorV121(
        "ASSET_SCHEMA_INVALID",
        "압축 해제된 데이터 pack 계약이 올바르지 않습니다",
        { packUrl: entry.packUrl, shardId: entry.shardId }
      );
    }
    return payload;
  })().catch((error) => {
    packCache.delete(entry.packUrl);
    throw error;
  });
  packCache.set(entry.packUrl, pending);
  return pending;
}

async function loadElementPayload(
  elementId: string
): Promise<VietnamElementShardPayloadV121> {
  assertElementId(elementId);
  const existing = elementCache.get(elementId);
  if (existing) return existing;
  const pending = (async () => {
    const index = await loadVietnamBundleIndexV121();
    const entry = index.elements[elementId];
    if (!entry) {
      throw new VietnamAssetErrorV121(
        "ELEMENT_NOT_INDEXED",
        "데이터 index에 해당 항목이 없습니다",
        { elementId }
      );
    }
    const pack = await loadVerifiedPack(entry);
    const payload = pack.elements[elementId];
    if (!payload) {
      throw new VietnamAssetErrorV121(
        "ELEMENT_NOT_IN_PACK",
        "데이터 pack에 해당 항목이 없습니다",
        { elementId, packUrl: entry.packUrl }
      );
    }
    if (
      payload.meta.element.elementId !== elementId ||
      payload.observations.elementId !== elementId ||
      payload.entities.elementId !== elementId ||
      payload.observations.recordCount !==
        payload.observations.records.length ||
      payload.entities.recordCount !== payload.entities.records.length
    ) {
      throw new VietnamAssetErrorV121(
        "ASSET_SCHEMA_INVALID",
        "데이터 항목의 식별자 또는 레코드 수가 일치하지 않습니다",
        { elementId, packUrl: entry.packUrl }
      );
    }
    return payload;
  })().catch((error) => {
    elementCache.delete(elementId);
    throw error;
  });
  elementCache.set(elementId, pending);
  return pending;
}

export async function loadVietnamQualityReportV121(): Promise<VietnamQualityReportV121> {
  return fetchJson<VietnamQualityReportV121>(
    publicAssetUrlV128("data/vietnam/v1/quality-report.json")
  );
}

export async function loadVietnamMapIndexV121(): Promise<
  VietnamMapLayerV121[]
> {
  const payload = await fetchJson<{
    schemaVersion: "v121";
    layers: VietnamMapLayerV121[];
  }>(publicAssetUrlV128("data/vietnam/v1/map-index.json"));
  return payload.layers;
}

export async function loadVietnamCatalogV121(): Promise<
  VietnamCatalogElementV121[]
> {
  const payload = await fetchJson<{
    schemaVersion: "v121";
    elements: VietnamCatalogElementV121[];
  }>(publicAssetUrlV128("data/vietnam/v1/catalog.json"));
  return payload.elements;
}

function manifestAssetUrls(
  manifest: VietnamManifestV121,
  key: string
): string[] {
  const value = manifest.assets[key];
  if (Array.isArray(value)) return value;
  return typeof value === "string" ? [value] : [];
}

export async function loadVietnamSearchIndexV121(): Promise<
  Map<string, { searchText: string; keywords: string[] }>
> {
  const manifest = await loadVietnamManifestV121();
  const urls = manifestAssetUrls(manifest, "searchIndex");
  const result = new Map<string, { searchText: string; keywords: string[] }>();
  for (const url of urls) {
    const { bytes } = await loadEnvelopeContent(url, "search-index");
    const payload = parseContentJson<{
      schemaVersion: "v121";
      runtimeVersion: typeof VIETNAM_DATA_RUNTIME_VERSION_V121;
      elements: Array<{
        publicSlug: string;
        searchText: string;
        keywords: string[];
      }>;
    }>(bytes, url);
    if (
      payload.schemaVersion !== "v121" ||
      payload.runtimeVersion !== VIETNAM_DATA_RUNTIME_VERSION_V121 ||
      !Array.isArray(payload.elements)
    ) {
      throw new VietnamAssetErrorV121(
        "ASSET_SCHEMA_INVALID",
        "검색색인 계약이 올바르지 않습니다",
        { url }
      );
    }
    payload.elements.forEach((item) => {
      const elementId = elementIdFromPublicSlugV121(item.publicSlug);
      if (elementId) {
        result.set(elementId, {
          searchText: item.searchText,
          keywords: item.keywords,
        });
      }
    });
  }
  return result;
}

export async function loadVietnamSourceRegistryV121<T = unknown>(): Promise<T> {
  const manifest = await loadVietnamManifestV121();
  const [url] = manifestAssetUrls(manifest, "sourceRegistry");
  if (!url) {
    throw new VietnamAssetErrorV121(
      "ASSET_NOT_FOUND",
      "출처정보 자산 경로가 없습니다"
    );
  }
  const { bytes } = await loadEnvelopeContent(url, "source-registry");
  return parseContentJson<T>(bytes, url);
}

export async function loadVietnamElementMetaV121(
  elementId: string
): Promise<VietnamElementMetaBundleV121> {
  return (await loadElementPayload(elementId)).meta;
}

export async function loadVietnamElementObservationsV121(
  elementId: string
): Promise<VietnamElementDataBundleV121<VietnamObservationV121>> {
  return (await loadElementPayload(elementId)).observations;
}

export async function loadVietnamElementEntitiesV121(
  elementId: string
): Promise<VietnamElementDataBundleV121<VietnamEntityV121>> {
  return (await loadElementPayload(elementId)).entities;
}

export async function loadVietnamElementBundleV121(
  elementId: string
): Promise<VietnamElementShardPayloadV121> {
  return loadElementPayload(elementId);
}

export function datasetHasLoadablePayloadV121(
  dataset: Pick<Dataset, "dataAssetRef" | "dataPayloadUrl">
): boolean {
  return Boolean(dataset.dataAssetRef || dataset.dataPayloadUrl);
}

export async function loadDatasetPayloadV121<T = Record<string, unknown>>(
  dataset: Pick<Dataset, "dataAssetRef" | "dataPayloadUrl" | "id">
): Promise<T> {
  if (dataset.dataAssetRef) {
    const asset = dataset.dataAssetRef;
    if (asset.provider !== "vietnam-v121") {
      throw new VietnamAssetErrorV121(
        "ASSET_SCHEMA_INVALID",
        "지원하지 않는 데이터 제공자입니다",
        { provider: String(asset.provider), datasetId: dataset.id }
      );
    }
    const section = asset.section || "bundle";
    if (section === "meta") {
      return (await loadVietnamElementMetaV121(asset.elementId)) as T;
    }
    if (section === "observations") {
      return (await loadVietnamElementObservationsV121(asset.elementId)) as T;
    }
    if (section === "entities") {
      return (await loadVietnamElementEntitiesV121(asset.elementId)) as T;
    }
    return (await loadVietnamElementBundleV121(asset.elementId)) as T;
  }
  if (dataset.dataPayloadUrl) {
    return fetchJson<T>(dataset.dataPayloadUrl);
  }
  throw new VietnamAssetErrorV121(
    "ASSET_NOT_FOUND",
    "연결된 데이터 자산이 없습니다",
    { datasetId: dataset.id }
  );
}

export function clearVietnamDataCacheV121(): void {
  jsonCache.clear();
  envelopeCache.clear();
  packCache.clear();
  elementCache.clear();
  manifestCache = null;
  bundleIndexCache = null;
}
