/**
 * V158: the published-data loader, one instance per country.
 *
 * Until V158 this code lived in `vietnam/vietnamDataLoaderV124.ts` with every
 * URL pinned to the default country and single module-level caches for the
 * manifest, the bundle index and the element payloads. A second country cannot
 * share those: its manifest would overwrite the first, and an element id such
 * as "B-003" names a different payload in each tree.
 *
 * What moved here is the same code. What changed:
 * - URLs are built from the country's registry data root (`countryAssetPathV158`).
 * - The manifest and bundle-index caches belong to an instance.
 * - Element payloads are keyed `${iso3}:${elementId}`.
 * - The framework size is read from the country's own manifest instead of a
 *   literal, so the checks hold for every tree built from the same framework.
 * - A spatial asset URL must sit under the loader's own country root.
 *
 * Caches keyed by URL (JSON, envelopes, decoded packs) stay shared: URLs are
 * unique per country, and one resident-shard budget across countries keeps the
 * memory ceiling that V139 set for the largest pack.
 *
 * `vietnam/vietnamDataLoaderV124.ts` keeps its exported names and delegates to
 * the default country's instance, so its callers are unchanged.
 */
import { isVietnamElementIdV121, elementIdFromPublicSlugV121 } from "../vietnam/vietnamElementSlugsV121";
import { isPublicAssetWithinV128, publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";
import { VIETNAM_DATA_RUNTIME_VERSION_V124 } from "../vietnam/vietnamTypesV124";
import type {
  VietnamAssetErrorCodeV124,
  VietnamBundleIndexElementV124,
  VietnamBundleIndexV124,
  VietnamCatalogElementV124,
  VietnamElementDataBundleV124,
  VietnamElementMetaBundleV124,
  VietnamElementShardPayloadV124,
  VietnamEntityV124,
  VietnamLocationSidecarV151,
  VietnamManifestV124,
  VietnamMapLayerV124,
  VietnamObservationV124,
  VietnamQualityReportV124,
  VietnamShardEnvelopeV124,
  VietnamShardV124,
  VietnamSpatialLayerAssetV124,
} from "../vietnam/vietnamTypesV124";
import { countryAssetPathV158, normalizeCountryIso3V158 } from "../countryContext";

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

export function isVietnamAssetErrorV124(error: unknown): error is VietnamAssetErrorV124 {
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

export interface CountryMapGeoJsonV158 {
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

// ---------------------------------------------------------------- shared caches
const jsonCache = new Map<string, Promise<unknown>>();
const envelopeCache = new Map<
  string,
  Promise<{ bytes: Uint8Array; envelope: VietnamShardEnvelopeV124 }>
>();
const packCache = new Map<string, Promise<VietnamShardV124>>();
/** Element payloads, keyed `${iso3}:${elementId}`. */
const elementCache = new Map<string, Promise<VietnamElementShardPayloadV124>>();
/** The pack each cached element payload points into, same key. */
const packUrlByElementKey = new Map<string, string>();
/**
 * How many decoded element shards stay resident, across countries.
 *
 * One shard (pack-005: B-003~B-007, the province-year climate series)
 * decompresses to 447 MB of JSON and parses to a comparable object graph.
 * Keeping every shard a session has opened - and, until V139, the decompressed
 * bytes of each as well - let a route sweep across the 152 screens grow the
 * tab past the point where the CI browser answered a DevTools call within its
 * timeout. A shard not among the four most recently used is released together
 * with the element payloads that point into it; opening one of those elements
 * again decodes the shard again (about a second for the largest).
 */
const RESIDENT_SHARD_LIMIT_V139 = 4;

function touchResidentShard(packUrl: string): void {
  const pending = packCache.get(packUrl);
  if (!pending) return;
  // Re-insert to mark as most recently used (Map preserves insertion order).
  packCache.delete(packUrl);
  packCache.set(packUrl, pending);
  while (packCache.size > RESIDENT_SHARD_LIMIT_V139) {
    const oldest = packCache.keys().next().value as string | undefined;
    if (!oldest || oldest === packUrl) break;
    packCache.delete(oldest);
    for (const [key, url] of packUrlByElementKey) {
      if (url === oldest) elementCache.delete(key);
    }
  }
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

function validateEnvelope(value: unknown, url: string): VietnamShardEnvelopeV124 {
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

async function decompressGzip(compressed: Uint8Array, url: string): Promise<Uint8Array> {
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
    if (expectedResourceType && envelope.resourceType !== expectedResourceType) {
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
    // V151-2: the decompressed content is no longer digested a second time.
    // The compressed bytes were just verified against `compressedSha256`, and
    // gzip's own CRC-32 ties the decompressed bytes to them, so the second
    // digest only re-read up to a few hundred megabytes. `contentSha256` stays
    // in the envelope and the bundle index for the offline release audits.
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
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as T;
  } catch (error) {
    throw new VietnamAssetErrorV124(
      "ASSET_JSON_INVALID",
      "압축 해제된 데이터의 JSON 형식이 올바르지 않습니다",
      { url, cause: error instanceof Error ? error.message : String(error) }
    );
  }
}

function manifestAssetUrls(manifest: VietnamManifestV124, key: string): string[] {
  const value = manifest.assets[key];
  if (Array.isArray(value)) return value;
  return typeof value === "string" ? [value] : [];
}

/** The framework size a country's tree was built for, from its own manifest. */
function frameworkElementCount(manifest: VietnamManifestV124): number | null {
  const value = (manifest as unknown as { frameworkElements?: unknown }).frameworkElements;
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

async function loadVerifiedPack(entry: VietnamBundleIndexElementV124): Promise<VietnamShardV124> {
  const existing = packCache.get(entry.packUrl);
  if (existing) return existing;
  const pending = (async () => {
    const { bytes, envelope } = await loadEnvelopeContent(entry.packUrl, "element-shard");
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
    // The verified, decompressed bytes served their purpose; the parsed
    // payload is what the runtime reads. Nothing re-reads a shard's bytes.
    envelopeCache.delete(entry.packUrl);
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

/**
 * A climate layer states 63 provinces x 30 variables x 30 periods. As rows that
 * is a 12MB file; as a table of numbers it is under 1MB, and the runtime reads
 * rows. The table is expanded here, once, so every consumer keeps seeing rows.
 */
function expandSpatialValueTableV138(
  payload: VietnamSpatialLayerAssetV124
): VietnamSpatialLayerAssetV124 {
  const table = payload.valueTable;
  if (!table || payload.values.length > 0) return payload;
  const values: VietnamSpatialLayerAssetV124["values"] = [];
  for (const series of table.series) {
    series.values.forEach((value, index) => {
      if (value === null || !Number.isFinite(value)) return;
      values.push({
        adm1Code: table.adm1Codes[index],
        adm1Name: table.adm1Names[index],
        variable: series.variable,
        variableLabel: series.variableLabel,
        period: series.period,
        value,
        unit: series.unit,
        sourceIndicatorId: series.sourceIndicatorId,
        sourceRecordId: null,
        sourceSpatialUnit: table.sourceSpatialUnit,
        imputed: false,
      });
    });
  }
  return { ...payload, values };
}

// ---------------------------------------------------------------- per country
export interface CountryDataLoaderV158 {
  readonly iso3: string;
  loadManifest(): Promise<VietnamManifestV124>;
  loadBundleIndex(): Promise<VietnamBundleIndexV124>;
  loadQualityReport(): Promise<VietnamQualityReportV124>;
  loadMapIndex(): Promise<VietnamMapLayerV124[]>;
  loadCatalog(): Promise<VietnamCatalogElementV124[]>;
  loadSearchIndex(): Promise<Map<string, { searchText: string; keywords: string[] }>>;
  loadSourceRegistry<T = unknown>(): Promise<T>;
  loadElementMeta(elementId: string): Promise<VietnamElementMetaBundleV124>;
  loadElementObservations(elementId: string): Promise<VietnamElementDataBundleV124<VietnamObservationV124>>;
  loadElementEntities(elementId: string): Promise<VietnamElementDataBundleV124<VietnamEntityV124>>;
  loadElementBundle(elementId: string): Promise<VietnamElementShardPayloadV124>;
  loadSpatialLayer(dataUrl: string, signal?: AbortSignal): Promise<VietnamSpatialLayerAssetV124>;
  loadSpatialGeoJson(geometryUrl: string, signal?: AbortSignal): Promise<CountryMapGeoJsonV158>;
  loadLocations(locationsUrl: string, signal?: AbortSignal): Promise<VietnamLocationSidecarV151>;
  clearCache(): void;
}

const LOADERS = new Map<string, CountryDataLoaderV158>();

/** The loader for one country, created once and kept. */
export function countryDataLoaderV158(country: string): CountryDataLoaderV158 {
  const iso3 = normalizeCountryIso3V158(country);
  const existing = LOADERS.get(iso3);
  if (existing) return existing;
  const loader = createCountryDataLoaderV158(iso3);
  LOADERS.set(iso3, loader);
  return loader;
}

function createCountryDataLoaderV158(iso3: string): CountryDataLoaderV158 {
  // Paths are resolved when first used: a country other than the default is
  // only known once the registry has been read.
  const assetUrl = (relPath: string) => publicAssetUrlV128(countryAssetPathV158(iso3, relPath));
  const elementKey = (elementId: string) => `${iso3}:${elementId}`;
  let manifestCache: Promise<VietnamManifestV124> | null = null;
  let bundleIndexCache: Promise<VietnamBundleIndexV124> | null = null;

  function loadManifest(): Promise<VietnamManifestV124> {
    if (!manifestCache) {
      manifestCache = fetchJson<VietnamManifestV124>(assetUrl("manifest.json"), "no-store")
        .then((payload) => {
          if (
            payload.schemaVersion !== "v124" ||
            payload.runtimeVersion !== VIETNAM_DATA_RUNTIME_VERSION_V124 ||
            payload.assetLayoutVersion !== "gzip-base64-json-envelope-v2"
          ) {
            throw new VietnamAssetErrorV124(
              "ASSET_SCHEMA_INVALID",
              "데이터 manifest 계약이 올바르지 않습니다",
              { country: iso3 }
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

  async function manifestAssetUrl(key: string, fallback?: string): Promise<string> {
    const manifest = await loadManifest();
    const [url] = manifestAssetUrls(manifest, key);
    if (url) return url;
    if (fallback) return fallback;
    throw new VietnamAssetErrorV124(
      "ASSET_NOT_FOUND",
      "manifest에 필요한 정적 자산 경로가 없습니다",
      { key, country: iso3 }
    );
  }

  function loadBundleIndex(): Promise<VietnamBundleIndexV124> {
    if (!bundleIndexCache) {
      bundleIndexCache = Promise.all([
        loadManifest(),
        manifestAssetUrl("bundleIndex", assetUrl("packs/bundle-index-v124.json")),
      ])
        .then(async ([manifest, url]) => {
          const payload = await fetchJson<VietnamBundleIndexV124>(url, "no-store");
          const elementIds = Object.keys(payload.elements || {});
          const expected = frameworkElementCount(manifest) ?? elementIds.length;
          if (
            payload.schemaVersion !== "v124" ||
            payload.runtimeVersion !== VIETNAM_DATA_RUNTIME_VERSION_V124 ||
            payload.assetLayoutVersion !== "gzip-base64-json-envelope-v2" ||
            payload.elementCount !== expected ||
            elementIds.length !== expected ||
            !Array.isArray(payload.packs) ||
            payload.packs.length !== payload.packCount
          ) {
            throw new VietnamAssetErrorV124(
              "ASSET_SCHEMA_INVALID",
              "데이터 index 계약이 올바르지 않습니다",
              { country: iso3 }
            );
          }
          return payload;
        })
        .catch((error) => {
          bundleIndexCache = null;
          throw error;
        });
    }
    return bundleIndexCache;
  }

  async function loadElementPayload(elementId: string): Promise<VietnamElementShardPayloadV124> {
    assertElementId(elementId);
    const key = elementKey(elementId);
    const existing = elementCache.get(key);
    if (existing) {
      const packUrl = packUrlByElementKey.get(key);
      if (packUrl) touchResidentShard(packUrl);
      return existing;
    }
    const pending = (async () => {
      const index = await loadBundleIndex();
      const entry = index.elements[elementId];
      if (!entry) {
        throw new VietnamAssetErrorV124(
          "ELEMENT_NOT_INDEXED",
          "데이터 index에 해당 항목이 없습니다",
          { elementId, country: iso3 }
        );
      }
      packUrlByElementKey.set(key, entry.packUrl);
      const pack = await loadVerifiedPack(entry);
      touchResidentShard(entry.packUrl);
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
      elementCache.delete(key);
      throw error;
    });
    elementCache.set(key, pending);
    return pending;
  }

  function assertOwnMapAssetUrl(url: string): void {
    if (!isPublicAssetWithinV128(url, countryAssetPathV158(iso3, ""))) {
      throw new VietnamAssetErrorV124(
        "ASSET_SCHEMA_INVALID",
        "지도 자산은 해당 국가의 공개 자산만 사용할 수 있습니다",
        { url, country: iso3 }
      );
    }
  }

  return {
    iso3,
    loadManifest,
    loadBundleIndex,
    async loadQualityReport() {
      const url = await manifestAssetUrl("qualityReport", assetUrl("quality-report.json"));
      return fetchJson<VietnamQualityReportV124>(url);
    },
    async loadMapIndex() {
      const url = await manifestAssetUrl("mapIndex", assetUrl("map-index.json"));
      const payload = await fetchJson<{ schemaVersion: "v124"; layers: VietnamMapLayerV124[] }>(url);
      if (payload.schemaVersion !== "v124" || !Array.isArray(payload.layers)) {
        throw new VietnamAssetErrorV124(
          "ASSET_SCHEMA_INVALID",
          "지도 데이터 index 계약이 올바르지 않습니다",
          { url }
        );
      }
      return payload.layers;
    },
    async loadCatalog() {
      const [manifest, url] = await Promise.all([
        loadManifest(),
        manifestAssetUrl("catalog", assetUrl("catalog.json")),
      ]);
      const payload = await fetchJson<{ schemaVersion: "v124"; elements: VietnamCatalogElementV124[] }>(url);
      const expected = frameworkElementCount(manifest);
      if (
        payload.schemaVersion !== "v124" ||
        !Array.isArray(payload.elements) ||
        (expected !== null && payload.elements.length !== expected)
      ) {
        throw new VietnamAssetErrorV124(
          "ASSET_SCHEMA_INVALID",
          "데이터 catalog 계약이 올바르지 않습니다",
          { url }
        );
      }
      return payload.elements;
    },
    async loadSearchIndex() {
      const manifest = await loadManifest();
      const urls = manifestAssetUrls(manifest, "searchIndex");
      if (urls.length === 0) {
        throw new VietnamAssetErrorV124("ASSET_NOT_FOUND", "검색색인 자산 경로가 없습니다", { country: iso3 });
      }
      const result = new Map<string, { searchText: string; keywords: string[] }>();
      for (const url of urls) {
        const { bytes } = await loadEnvelopeContent(url, "search-index");
        const payload = parseContentJson<{
          schemaVersion: "v124";
          runtimeVersion: typeof VIETNAM_DATA_RUNTIME_VERSION_V124;
          elements: Array<{ elementId?: string; publicSlug?: string; searchText: string; keywords: string[] }>;
        }>(bytes, url);
        if (
          payload.schemaVersion !== "v124" ||
          payload.runtimeVersion !== VIETNAM_DATA_RUNTIME_VERSION_V124 ||
          !Array.isArray(payload.elements)
        ) {
          throw new VietnamAssetErrorV124("ASSET_SCHEMA_INVALID", "검색색인 계약이 올바르지 않습니다", { url });
        }
        payload.elements.forEach((item) => {
          const elementId =
            (item.elementId && isVietnamElementIdV121(item.elementId) ? item.elementId : null) ||
            elementIdFromPublicSlugV121(item.publicSlug);
          if (!elementId) return;
          result.set(elementId, {
            searchText: item.searchText || "",
            keywords: Array.isArray(item.keywords) ? item.keywords : [],
          });
        });
      }
      return result;
    },
    async loadSourceRegistry<T = unknown>() {
      const url = await manifestAssetUrl("sourceRegistry");
      const { bytes } = await loadEnvelopeContent(url, "source-registry");
      return parseContentJson<T>(bytes, url);
    },
    async loadElementMeta(elementId: string) {
      return (await loadElementPayload(elementId)).meta;
    },
    async loadElementObservations(elementId: string) {
      return (await loadElementPayload(elementId)).observations;
    },
    async loadElementEntities(elementId: string) {
      return (await loadElementPayload(elementId)).entities;
    },
    loadElementBundle: loadElementPayload,
    async loadSpatialLayer(dataUrl: string, signal?: AbortSignal) {
      assertOwnMapAssetUrl(dataUrl);
      const payload = await fetchJson<VietnamSpatialLayerAssetV124>(dataUrl, "default", signal);
      if (
        payload.schemaVersion !== "v124" ||
        payload.assetSchemaVersion !== "v124-spatial-layer-1" ||
        !Array.isArray(payload.values)
      ) {
        throw new VietnamAssetErrorV124("ASSET_SCHEMA_INVALID", "V124 공간값 자산 계약이 올바르지 않습니다", { dataUrl });
      }
      return expandSpatialValueTableV138(payload);
    },
    async loadSpatialGeoJson(geometryUrl: string, signal?: AbortSignal) {
      assertOwnMapAssetUrl(geometryUrl);
      const payload = await fetchJson<CountryMapGeoJsonV158>(geometryUrl, "default", signal);
      if (payload.type !== "FeatureCollection" || !Array.isArray(payload.features)) {
        throw new VietnamAssetErrorV124("ASSET_SCHEMA_INVALID", "V124 지도 geometry 자산 계약이 올바르지 않습니다", { geometryUrl });
      }
      return payload;
    },
    async loadLocations(locationsUrl: string, signal?: AbortSignal) {
      assertOwnMapAssetUrl(locationsUrl);
      const payload = await fetchJson<VietnamLocationSidecarV151>(locationsUrl, "default", signal);
      if (payload.schemaVersion !== "v151-2-locations-1" || !payload.byRecordId) {
        throw new VietnamAssetErrorV124("ASSET_SCHEMA_INVALID", "V151 소재지 자산 계약이 올바르지 않습니다", { locationsUrl });
      }
      return payload;
    },
    clearCache() {
      // The URL-keyed caches are shared, so clearing one country clears them
      // all; the next request simply fetches again. This matches V124, where a
      // single country owned every cache.
      jsonCache.clear();
      envelopeCache.clear();
      packCache.clear();
      for (const key of [...elementCache.keys()]) elementCache.delete(key);
      packUrlByElementKey.clear();
      manifestCache = null;
      bundleIndexCache = null;
    },
  };
}
