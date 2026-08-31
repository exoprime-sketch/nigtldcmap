import {
  elementIdFromPublicSlugV121,
  isVietnamElementIdV121,
} from "./vietnamElementSlugsV121";
import {
  isPublicAssetWithinV128,
  publicAssetUrlV128,
} from "../../utils/publicAssetUrlV128";
import { VIETNAM_DATA_RUNTIME_VERSION_V124 } from "./vietnamTypesV124";
import type {
  VietnamAssetErrorCodeV124,
  VietnamBundleIndexElementV124,
  VietnamBundleIndexV124,
  VietnamCatalogElementV124,
  VietnamElementDataBundleV124,
  VietnamElementMetaBundleV124,
  VietnamElementShardPayloadV124,
  VietnamEntityV124,
  VietnamManifestV124,
  VietnamMapLayerV124,
  VietnamObservationV124,
  VietnamQualityReportV124,
  VietnamShardEnvelopeV124,
  VietnamShardV124,
  VietnamSpatialLayerAssetV124,
} from "./vietnamTypesV124";

const MANIFEST_URL = publicAssetUrlV128("data/vietnam/v2/manifest.json");
const DEFAULT_BUNDLE_INDEX_URL =
  publicAssetUrlV128("data/vietnam/v2/packs/bundle-index-v124.json");

const jsonCache = new Map<string, Promise<unknown>>();
const envelopeCache = new Map<
  string,
  Promise<{ bytes: Uint8Array; envelope: VietnamShardEnvelopeV124 }>
>();
const packCache = new Map<string, Promise<VietnamShardV124>>();
const elementCache = new Map<
  string,
  Promise<VietnamElementShardPayloadV124>
>();
let manifestCache: Promise<VietnamManifestV124> | null = null;
let bundleIndexCache: Promise<VietnamBundleIndexV124> | null = null;

export class VietnamAssetErrorV124 extends Error {
  readonly code: VietnamAssetErrorCodeV124;
  readonly details: Record<string, unknown>;

  constructor(
    code: VietnamAssetErrorCodeV124,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "VietnamAssetErrorV124";
    this.code = code;
    this.details = details;
  }
}

export function isVietnamAssetErrorV124(
  error: unknown
): error is VietnamAssetErrorV124 {
  return error instanceof VietnamAssetErrorV124;
}

export function publicVietnamDataErrorMessageV124(
  _error: unknown,
  context: "data" | "map" | "download" = "data"
): string {
  if (context === "map") return "지도 데이터를 불러오지 못했습니다";
  if (context === "download") return "다운로드할 데이터를 불러오지 못했습니다";
  return "데이터를 불러오지 못했습니다";
}

function cachePromise<T>(
  cache: Map<string, Promise<unknown>>,
  key: string,
  factory: () => Promise<T>
): Promise<T> {
  const existing = cache.get(key);
  if (existing) return existing as Promise<T>;
  const pending = factory().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, pending);
  return pending;
}

function startsWithHtml(value: string): boolean {
  const trimmed = value.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}

async function fetchTextChecked(
  url: string,
  cacheMode: RequestCache = "default",
  signal?: AbortSignal
): Promise<{ text: string; contentType: string; responseUrl: string }> {
  const requestUrl = publicAssetUrlV128(url);
  let response: Response;
  try {
    response = await fetch(requestUrl, { cache: cacheMode, signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new VietnamAssetErrorV124(
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
    throw new VietnamAssetErrorV124(
      response.status === 404 ? "ASSET_NOT_FOUND" : "ASSET_HTTP_ERROR",
      `정적 자산 응답 오류: ${response.status}`,
      { url: requestUrl, responseUrl, status: response.status, contentType, sample }
    );
  }
  if (contentType.toLowerCase().includes("text/html") || startsWithHtml(text)) {
    throw new VietnamAssetErrorV124(
      "ASSET_HTML_FALLBACK",
      "정적 데이터 대신 HTML 문서가 응답되었습니다",
      { url: requestUrl, responseUrl, status: response.status, contentType, sample }
    );
  }
  if (!text.trim()) {
    throw new VietnamAssetErrorV124(
      "ASSET_EMPTY",
      "정적 자산이 비어 있습니다",
      { url: requestUrl, responseUrl, status: response.status, contentType }
    );
  }
  return { text, contentType, responseUrl };
}

async function fetchJson<T>(
  url: string,
  cacheMode: RequestCache = "default",
  signal?: AbortSignal
): Promise<T> {
  const read = async () => {
    const result = await fetchTextChecked(url, cacheMode, signal);
    try {
      return JSON.parse(result.text) as T;
    } catch (error) {
      throw new VietnamAssetErrorV124(
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
  };
  // Abortable layer requests must not share an underlying fetch owned by a
  // different layer. Successful non-abortable reads retain the existing cache.
  return signal ? read() : cachePromise(jsonCache, `${cacheMode}:${url}`, read);
}

function assertElementId(elementId: string): void {
  if (!isVietnamElementIdV121(elementId)) {
    throw new VietnamAssetErrorV124(
      "ELEMENT_ID_INVALID",
      "올바르지 않은 데이터 요소입니다",
      { elementId }
    );
  }
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new VietnamAssetErrorV124(
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
): VietnamShardEnvelopeV124 {
  const payload = value as Partial<VietnamShardEnvelopeV124>;
  const chunks = payload.payloadChunks;
  if (
    payload.schemaVersion !== "v124" ||
    payload.runtimeVersion !== VIETNAM_DATA_RUNTIME_VERSION_V124 ||
    payload.transportEncoding !== "gzip-base64-chunks-v2" ||
    !payload.shardId ||
    !["element-shard", "search-index", "source-registry"].includes(
      payload.resourceType || ""
    ) ||
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
        chunk.length % 4 !== 0 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(chunk)
    )
  ) {
    throw new VietnamAssetErrorV124(
      "ASSET_ENVELOPE_INVALID",
      "정적 데이터 envelope 계약이 올바르지 않습니다",
      { url }
    );
  }
  return payload as VietnamShardEnvelopeV124;
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
    throw new VietnamAssetErrorV124(
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
    throw new VietnamAssetErrorV124(
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
    throw new VietnamAssetErrorV124(
      "ASSET_DECOMPRESSION_FAILED",
      "정적 데이터 압축 해제에 실패했습니다",
      { url, cause: error instanceof Error ? error.message : String(error) }
    );
  }
}

async function loadEnvelopeContent(
  url: string,
  expectedResourceType?: VietnamShardEnvelopeV124["resourceType"]
): Promise<{ bytes: Uint8Array; envelope: VietnamShardEnvelopeV124 }> {
  const existing = envelopeCache.get(url);
  if (existing) return existing;
  const pending = (async () => {
    const result = await fetchTextChecked(url);
    let raw: unknown;
    try {
      raw = JSON.parse(result.text);
    } catch (error) {
      throw new VietnamAssetErrorV124(
        "ASSET_JSON_INVALID",
        "정적 데이터 envelope의 JSON 형식이 올바르지 않습니다",
        { url, cause: error instanceof Error ? error.message : String(error) }
      );
    }
    const envelope = validateEnvelope(raw, url);
    if (
      expectedResourceType &&
      envelope.resourceType !== expectedResourceType
    ) {
      throw new VietnamAssetErrorV124(
        "ASSET_SCHEMA_INVALID",
        "정적 데이터 유형이 요청과 일치하지 않습니다",
        { url, expectedResourceType, actual: envelope.resourceType }
      );
    }
    const compressed = decodeBase64Chunks(envelope.payloadChunks, url);
    if (compressed.byteLength !== envelope.compressedByteSize) {
      throw new VietnamAssetErrorV124(
        "ASSET_COMPRESSED_SIZE_MISMATCH",
        "압축 데이터 크기가 일치하지 않습니다",
        { url, actual: compressed.byteLength, expected: envelope.compressedByteSize }
      );
    }
    const compressedHash = await sha256Hex(compressed);
    if (compressedHash !== envelope.compressedSha256) {
      throw new VietnamAssetErrorV124(
        "ASSET_COMPRESSED_HASH_MISMATCH",
        "압축 데이터의 무결성 검증에 실패했습니다",
        { url, actual: compressedHash, expected: envelope.compressedSha256 }
      );
    }
    const content = await decompressGzip(compressed, url);
    if (content.byteLength !== envelope.contentByteSize) {
      throw new VietnamAssetErrorV124(
        "ASSET_CONTENT_SIZE_MISMATCH",
        "원문 데이터 크기가 일치하지 않습니다",
        { url, actual: content.byteLength, expected: envelope.contentByteSize }
      );
    }
    const contentHash = await sha256Hex(content);
    if (contentHash !== envelope.contentSha256) {
      throw new VietnamAssetErrorV124(
        "ASSET_CONTENT_HASH_MISMATCH",
        "원문 데이터의 무결성 검증에 실패했습니다",
        { url, actual: contentHash, expected: envelope.contentSha256 }
      );
    }
    return { bytes: content, envelope };
  })().catch((error) => {
    envelopeCache.delete(url);
    throw error;
  });
  envelopeCache.set(url, pending);
  return pending;
}

function parseContentJson<T>(bytes: Uint8Array, url: string): T {
  try {
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    ) as T;
  } catch (error) {
    throw new VietnamAssetErrorV124(
      "ASSET_JSON_INVALID",
      "압축 해제된 데이터의 JSON 형식이 올바르지 않습니다",
      { url, cause: error instanceof Error ? error.message : String(error) }
    );
  }
}

function manifestAssetUrls(
  manifest: VietnamManifestV124,
  key: string
): string[] {
  const value = manifest.assets[key];
  if (Array.isArray(value)) return value;
  return typeof value === "string" ? [value] : [];
}

async function manifestAssetUrl(
  key: string,
  fallback?: string
): Promise<string> {
  const manifest = await loadVietnamManifestV124();
  const [url] = manifestAssetUrls(manifest, key);
  if (url) return url;
  if (fallback) return fallback;
  throw new VietnamAssetErrorV124(
    "ASSET_NOT_FOUND",
    "manifest에 필요한 정적 자산 경로가 없습니다",
    { key }
  );
}

function validateBundleIndex(payload: VietnamBundleIndexV124): void {
  const elementIds = Object.keys(payload.elements || {});
  if (
    payload.schemaVersion !== "v124" ||
    payload.runtimeVersion !== VIETNAM_DATA_RUNTIME_VERSION_V124 ||
    payload.assetLayoutVersion !== "gzip-base64-json-envelope-v2" ||
    payload.elementCount !== 152 ||
    elementIds.length !== 152 ||
    !Array.isArray(payload.packs) ||
    payload.packs.length !== payload.packCount
  ) {
    throw new VietnamAssetErrorV124(
      "ASSET_SCHEMA_INVALID",
      "베트남 데이터 index 계약이 올바르지 않습니다"
    );
  }
}

export async function loadVietnamManifestV124(): Promise<VietnamManifestV124> {
  if (!manifestCache) {
    manifestCache = fetchJson<VietnamManifestV124>(MANIFEST_URL, "no-store")
      .then((payload) => {
        if (
          payload.schemaVersion !== "v124" ||
          payload.runtimeVersion !== VIETNAM_DATA_RUNTIME_VERSION_V124 ||
          payload.assetLayoutVersion !== "gzip-base64-json-envelope-v2"
        ) {
          throw new VietnamAssetErrorV124(
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

export async function loadVietnamBundleIndexV124(): Promise<VietnamBundleIndexV124> {
  if (!bundleIndexCache) {
    bundleIndexCache = manifestAssetUrl(
      "bundleIndex",
      DEFAULT_BUNDLE_INDEX_URL
    )
      .then((url) => fetchJson<VietnamBundleIndexV124>(url, "no-store"))
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
  entry: VietnamBundleIndexElementV124
): Promise<VietnamShardV124> {
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
      throw new VietnamAssetErrorV124(
        "ASSET_SCHEMA_INVALID",
        "정적 데이터 index와 pack의 무결성 정보가 일치하지 않습니다",
        { packUrl: entry.packUrl, shardId: entry.shardId }
      );
    }
    const payload = parseContentJson<VietnamShardV124>(bytes, entry.packUrl);
    if (
      payload.schemaVersion !== "v124" ||
      payload.assetLayoutVersion !== "sharded-element-bundles-v2" ||
      payload.shardId !== entry.shardId ||
      !payload.elements ||
      typeof payload.elements !== "object"
    ) {
      throw new VietnamAssetErrorV124(
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
): Promise<VietnamElementShardPayloadV124> {
  assertElementId(elementId);
  const existing = elementCache.get(elementId);
  if (existing) return existing;
  const pending = (async () => {
    const index = await loadVietnamBundleIndexV124();
    const entry = index.elements[elementId];
    if (!entry) {
      throw new VietnamAssetErrorV124(
        "ELEMENT_NOT_INDEXED",
        "데이터 index에 해당 항목이 없습니다",
        { elementId }
      );
    }
    const pack = await loadVerifiedPack(entry);
    const payload = pack.elements[elementId];
    if (!payload) {
      throw new VietnamAssetErrorV124(
        "ELEMENT_NOT_IN_PACK",
        "데이터 pack에 해당 항목이 없습니다",
        { elementId, packUrl: entry.packUrl }
      );
    }
    if (
      payload.meta.schemaVersion !== "v124" ||
      payload.meta.element.elementId !== elementId ||
      payload.observations.schemaVersion !== "v124" ||
      payload.observations.elementId !== elementId ||
      payload.entities.schemaVersion !== "v124" ||
      payload.entities.elementId !== elementId ||
      payload.observations.recordCount !== payload.observations.records.length ||
      payload.entities.recordCount !== payload.entities.records.length
    ) {
      throw new VietnamAssetErrorV124(
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

export async function loadVietnamQualityReportV124(): Promise<VietnamQualityReportV124> {
  const url = await manifestAssetUrl(
    "qualityReport",
    publicAssetUrlV128("data/vietnam/v2/quality-report.json")
  );
  return fetchJson<VietnamQualityReportV124>(url);
}

export async function loadVietnamMapIndexV124(): Promise<
  VietnamMapLayerV124[]
> {
  const url = await manifestAssetUrl(
    "mapIndex",
    publicAssetUrlV128("data/vietnam/v2/map-index.json")
  );
  const payload = await fetchJson<{
    schemaVersion: "v124";
    layers: VietnamMapLayerV124[];
  }>(url);
  if (payload.schemaVersion !== "v124" || !Array.isArray(payload.layers)) {
    throw new VietnamAssetErrorV124(
      "ASSET_SCHEMA_INVALID",
      "지도 데이터 index 계약이 올바르지 않습니다",
      { url }
    );
  }
  return payload.layers;
}

export interface VietnamMapGeoJsonV124 {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id?: string | number;
    properties: Record<string, unknown>;
    geometry: {
      type: string;
      coordinates: unknown;
    };
  }>;
  metadata?: Record<string, unknown>;
}

function assertVietnamV124MapAssetUrl(url: string): void {
  if (!isPublicAssetWithinV128(url, "data/vietnam/v2")) {
    throw new VietnamAssetErrorV124(
      "ASSET_SCHEMA_INVALID",
      "V124 지도는 Vietnam V2 공개 자산만 사용할 수 있습니다",
      { url }
    );
  }
}

export async function loadVietnamSpatialLayerV124(
  dataUrl: string,
  signal?: AbortSignal
): Promise<VietnamSpatialLayerAssetV124> {
  assertVietnamV124MapAssetUrl(dataUrl);
  const payload = await fetchJson<VietnamSpatialLayerAssetV124>(
    dataUrl,
    "default",
    signal
  );
  if (
    payload.schemaVersion !== "v124" ||
    payload.assetSchemaVersion !== "v124-spatial-layer-1" ||
    !Array.isArray(payload.values)
  ) {
    throw new VietnamAssetErrorV124(
      "ASSET_SCHEMA_INVALID",
      "V124 공간값 자산 계약이 올바르지 않습니다",
      { dataUrl }
    );
  }
  return payload;
}

export async function loadVietnamSpatialGeoJsonV124(
  geometryUrl: string,
  signal?: AbortSignal
): Promise<VietnamMapGeoJsonV124> {
  assertVietnamV124MapAssetUrl(geometryUrl);
  const payload = await fetchJson<VietnamMapGeoJsonV124>(
    geometryUrl,
    "default",
    signal
  );
  if (payload.type !== "FeatureCollection" || !Array.isArray(payload.features)) {
    throw new VietnamAssetErrorV124(
      "ASSET_SCHEMA_INVALID",
      "V124 지도 geometry 자산 계약이 올바르지 않습니다",
      { geometryUrl }
    );
  }
  return payload;
}

export async function loadVietnamCatalogV124(): Promise<
  VietnamCatalogElementV124[]
> {
  const url = await manifestAssetUrl(
    "catalog",
    publicAssetUrlV128("data/vietnam/v2/catalog.json")
  );
  const payload = await fetchJson<{
    schemaVersion: "v124";
    elements: VietnamCatalogElementV124[];
  }>(url);
  if (
    payload.schemaVersion !== "v124" ||
    !Array.isArray(payload.elements) ||
    payload.elements.length !== 152
  ) {
    throw new VietnamAssetErrorV124(
      "ASSET_SCHEMA_INVALID",
      "베트남 데이터 catalog 계약이 올바르지 않습니다",
      { url }
    );
  }
  return payload.elements;
}

export async function loadVietnamSearchIndexV124(): Promise<
  Map<string, { searchText: string; keywords: string[] }>
> {
  const manifest = await loadVietnamManifestV124();
  const urls = manifestAssetUrls(manifest, "searchIndex");
  if (urls.length === 0) {
    throw new VietnamAssetErrorV124(
      "ASSET_NOT_FOUND",
      "검색색인 자산 경로가 없습니다"
    );
  }
  const result = new Map<string, { searchText: string; keywords: string[] }>();
  for (const url of urls) {
    const { bytes } = await loadEnvelopeContent(url, "search-index");
    const payload = parseContentJson<{
      schemaVersion: "v124";
      runtimeVersion: typeof VIETNAM_DATA_RUNTIME_VERSION_V124;
      elements: Array<{
        elementId?: string;
        publicSlug?: string;
        searchText: string;
        keywords: string[];
      }>;
    }>(bytes, url);
    if (
      payload.schemaVersion !== "v124" ||
      payload.runtimeVersion !== VIETNAM_DATA_RUNTIME_VERSION_V124 ||
      !Array.isArray(payload.elements)
    ) {
      throw new VietnamAssetErrorV124(
        "ASSET_SCHEMA_INVALID",
        "검색색인 계약이 올바르지 않습니다",
        { url }
      );
    }
    payload.elements.forEach((item) => {
      const elementId =
        (item.elementId && isVietnamElementIdV121(item.elementId)
          ? item.elementId
          : null) || elementIdFromPublicSlugV121(item.publicSlug);
      if (!elementId) return;
      result.set(elementId, {
        searchText: item.searchText || "",
        keywords: Array.isArray(item.keywords) ? item.keywords : [],
      });
    });
  }
  return result;
}

export async function loadVietnamSourceRegistryV124<T = unknown>(): Promise<T> {
  const url = await manifestAssetUrl("sourceRegistry");
  const { bytes } = await loadEnvelopeContent(url, "source-registry");
  return parseContentJson<T>(bytes, url);
}

export async function loadVietnamElementMetaV124(
  elementId: string
): Promise<VietnamElementMetaBundleV124> {
  return (await loadElementPayload(elementId)).meta;
}

export async function loadVietnamElementObservationsV124(
  elementId: string
): Promise<VietnamElementDataBundleV124<VietnamObservationV124>> {
  return (await loadElementPayload(elementId)).observations;
}

export async function loadVietnamElementEntitiesV124(
  elementId: string
): Promise<VietnamElementDataBundleV124<VietnamEntityV124>> {
  return (await loadElementPayload(elementId)).entities;
}

export async function loadVietnamElementBundleV124(
  elementId: string
): Promise<VietnamElementShardPayloadV124> {
  return loadElementPayload(elementId);
}

export function clearVietnamDataCacheV124(): void {
  jsonCache.clear();
  envelopeCache.clear();
  packCache.clear();
  elementCache.clear();
  manifestCache = null;
  bundleIndexCache = null;
}
