import type {
  CountryCatalogItemV122,
  CountryElementBundleV122,
  CountryEntityV122,
  CountryMapLayerV122,
  CountrySearchEntryV122,
} from "./countryDataTypesV122";
import {
  getCountryDataProviderV122,
  listCountryDataProvidersV122,
} from "./countryDataProviderRegistryV122";

export class CountryDataErrorV122 extends Error {
  readonly code: string;
  readonly countryIso3?: string;
  readonly providerId?: string;
  readonly assetUrl?: string;
  readonly internalMessage: string;
  readonly publicMessage: string;
  readonly retryable: boolean;

  constructor(input: {
    code: string;
    internalMessage: string;
    publicMessage: string;
    retryable?: boolean;
    countryIso3?: string;
    providerId?: string;
    assetUrl?: string;
    cause?: unknown;
  }) {
    super(input.internalMessage);
    this.name = "CountryDataErrorV122";
    this.code = input.code;
    this.countryIso3 = input.countryIso3;
    this.providerId = input.providerId;
    this.assetUrl = input.assetUrl;
    this.internalMessage = input.internalMessage;
    this.publicMessage = input.publicMessage;
    this.retryable = input.retryable ?? true;
    if (input.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = input.cause;
    }
  }
}

function normalizeCountry(value: string | null | undefined): string {
  return value?.trim().toUpperCase() || "";
}

function providerOrThrow(countryIso3: string) {
  const provider = getCountryDataProviderV122(countryIso3);
  if (!provider) {
    throw new CountryDataErrorV122({
      code: "COUNTRY_PROVIDER_UNAVAILABLE",
      countryIso3,
      internalMessage: `등록된 국가 데이터 provider가 없습니다: ${countryIso3}`,
      publicMessage: "현재 제공되는 데이터가 없습니다",
      retryable: false,
    });
  }
  return provider;
}

function wrapProviderError(
  error: unknown,
  countryIso3: string,
  context: "data" | "map" | "download" | "search"
): never {
  if (error instanceof CountryDataErrorV122) throw error;
  const messages = {
    data: "데이터를 불러오지 못했습니다",
    map: "선택한 데이터 레이어를 불러오지 못했습니다",
    download: "다운로드할 데이터를 불러오지 못했습니다",
    search: "검색 데이터를 불러오지 못했습니다",
  };
  throw new CountryDataErrorV122({
    code: "COUNTRY_PROVIDER_REQUEST_FAILED",
    countryIso3,
    providerId: getCountryDataProviderV122(countryIso3)?.providerId,
    internalMessage: error instanceof Error ? error.message : String(error),
    publicMessage: messages[context],
    cause: error,
  });
}

export function publicCountryDataErrorMessageV122(
  error: unknown,
  fallback = "데이터를 불러오지 못했습니다"
): string {
  return error instanceof CountryDataErrorV122 ? error.publicMessage : fallback;
}

export function countryCatalogKeyV122(
  providerId: string,
  elementId: string
): string {
  return `${providerId}::${elementId}`;
}

export function hasCountryDataProviderV122(
  countryIso3: string | null | undefined
): boolean {
  return Boolean(getCountryDataProviderV122(countryIso3));
}

export function firstAvailableCountryIso3V122(): string | null {
  return (
    listCountryDataProvidersV122().find(
      (provider) => provider.availability !== "unavailable"
    )?.countryIso3 || null
  );
}

export function resolveCountryElementIdV122(
  countryIso3: string | null | undefined,
  token: string | null | undefined
): string | null {
  if (!token) return null;
  const provider = getCountryDataProviderV122(countryIso3);
  if (provider) return provider.resolveElementId(token);
  for (const candidate of listCountryDataProvidersV122()) {
    const resolved = candidate.resolveElementId(token);
    if (resolved) return resolved;
  }
  return null;
}

export function resolveElementIdAcrossProvidersV122(
  token: string | null | undefined
): string | null {
  return resolveCountryElementIdV122(null, token);
}

export function publicCountryElementTokenV122(
  countryIso3: string | null | undefined,
  elementId: string
): string {
  return (
    getCountryDataProviderV122(countryIso3)?.publicElementToken(elementId) ||
    elementId.toLowerCase()
  );
}

export function countryNameKoV122(
  countryIso3: string | null | undefined
): string {
  return getCountryDataProviderV122(countryIso3)?.countryNameKo || "선택 국가";
}

export async function loadCatalogForCountrySelectionV122(
  countryIso3: string | "all" | null | undefined
): Promise<CountryCatalogItemV122[]> {
  const normalized = normalizeCountry(countryIso3) || "ALL";
  const providers =
    normalized === "ALL"
      ? listCountryDataProvidersV122().filter(
          (provider) => provider.availability !== "unavailable"
        )
      : [providerOrThrow(normalized)];
  const groups = await Promise.all(
    providers.map(async (provider) => {
      try {
        return await provider.loadCatalog();
      } catch (error) {
        return wrapProviderError(error, provider.countryIso3, "data");
      }
    })
  );
  return groups.flat();
}

export async function loadSearchIndexForCountrySelectionV122(
  countryIso3: string | "all" | null | undefined
): Promise<Map<string, CountrySearchEntryV122>> {
  const normalized = normalizeCountry(countryIso3) || "ALL";
  const providers =
    normalized === "ALL"
      ? listCountryDataProvidersV122().filter(
          (provider) => provider.availability !== "unavailable"
        )
      : [providerOrThrow(normalized)];
  const indexes = await Promise.all(
    providers.map(async (provider) => {
      try {
        return await provider.loadSearchIndex();
      } catch (error) {
        return wrapProviderError(error, provider.countryIso3, "search");
      }
    })
  );
  const result = new Map<string, CountrySearchEntryV122>();
  indexes.forEach((index) =>
    index.forEach((entry) =>
      result.set(
        countryCatalogKeyV122(entry.providerId, entry.elementId),
        entry
      )
    )
  );
  return result;
}

export async function loadCountryMapIndexV122(
  countryIso3: string
): Promise<CountryMapLayerV122[]> {
  const normalized = normalizeCountry(countryIso3);
  const provider = providerOrThrow(normalized);
  try {
    return await provider.loadMapIndex();
  } catch (error) {
    return wrapProviderError(error, normalized, "map");
  }
}

export async function loadCountryElementBundleV122(
  countryIso3: string,
  elementId: string
): Promise<CountryElementBundleV122> {
  const normalized = normalizeCountry(countryIso3);
  const provider = providerOrThrow(normalized);
  try {
    return await provider.loadElementBundle(elementId);
  } catch (error) {
    return wrapProviderError(error, normalized, "data");
  }
}

export async function loadCountryElementEntitiesV122(
  countryIso3: string,
  elementId: string
): Promise<{
  schemaVersion: "v121";
  elementId: string;
  recordCount: number;
  records: CountryEntityV122[];
}> {
  const normalized = normalizeCountry(countryIso3);
  const provider = providerOrThrow(normalized);
  try {
    return await provider.loadElementEntities(elementId);
  } catch (error) {
    return wrapProviderError(error, normalized, "map");
  }
}

export async function loadCountrySourceRegistryV122<T = unknown>(
  countryIso3: string
): Promise<T> {
  const normalized = normalizeCountry(countryIso3);
  const provider = providerOrThrow(normalized);
  try {
    return await provider.loadSourceRegistry<T>();
  } catch (error) {
    return wrapProviderError(error, normalized, "data");
  }
}
