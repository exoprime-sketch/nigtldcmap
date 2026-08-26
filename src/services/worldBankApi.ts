import type { Country } from "../types/country";
import type {
  IndicatorDataResult,
  IndicatorObservation,
} from "../types/indicator";

const WORLD_BANK_API_BASE = "https://api.worldbank.org/v2";
const REQUEST_TIMEOUT_MS = 20000;
const REQUEST_MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 650;

interface WorldBankPageInfo {
  page?: number;
  pages?: number;
  per_page?: number | string;
  total?: number;
  lastupdated?: string;
}

interface WorldBankValueLabel {
  id: string;
  value: string;
}

interface WorldBankCountryItem {
  id: string;
  iso2Code: string;
  name: string;
  region: WorldBankValueLabel;
  incomeLevel: WorldBankValueLabel;
  capitalCity: string;
  longitude: string;
  latitude: string;
}

interface WorldBankIndicatorRecord {
  indicator?: WorldBankValueLabel;
  countryiso3code: string;
  date: string;
  value: number | null;
}

type WorldBankResponse<T> = [WorldBankPageInfo, T[]];

const REGION_NAMES_KO: Record<string, string> = {
  EAS: "동아시아·태평양",
  ECS: "유럽·중앙아시아",
  LCN: "중남미·카리브",
  MEA: "중동·북아프리카·아프가니스탄·파키스탄",
  NAC: "북미",
  SAS: "남아시아",
  SSF: "사하라 이남 아프리카",
};

const INCOME_NAMES_KO: Record<string, string> = {
  LIC: "저소득",
  LMC: "중저소득",
  UMC: "중고소득",
  HIC: "고소득",
  INX: "미분류",
};

let countryPromise: Promise<Country[]> | null = null;
const indicatorPromises = new Map<string, Promise<IndicatorDataResult>>();

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function fetchJson<T>(url: string): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= REQUEST_MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    );

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        const error = new Error(`원천 API 응답 오류: ${response.status}`);
        if (
          !isRetryableStatus(response.status) ||
          attempt === REQUEST_MAX_ATTEMPTS
        ) {
          throw error;
        }
        lastError = error;
      } else {
        return (await response.json()) as T;
      }
    } catch (error) {
      lastError = error;
      if (attempt === REQUEST_MAX_ATTEMPTS) throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }

    await wait(RETRY_BASE_DELAY_MS * attempt);
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("World Bank API 요청에 실패했습니다.");
}

function toNumber(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function localizedCountryName(iso2: string, fallback: string): string {
  try {
    const displayNames = new Intl.DisplayNames(["ko"], { type: "region" });
    return displayNames.of(iso2) ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeCountryPath(countryIso3Codes: readonly string[]): string {
  const normalized = Array.from(
    new Set(
      countryIso3Codes
        .map((code) => code.trim().toLowerCase())
        .filter((code) => /^[a-z]{3}$/.test(code))
    )
  );
  return normalized.length > 0 ? normalized.join(";") : "all";
}

function normalizeIndicatorPath(indicatorIds: readonly string[]): string[] {
  return Array.from(
    new Set(
      indicatorIds
        .map((id) => id.trim().toUpperCase())
        .filter((id) => /^[A-Z0-9.]+$/.test(id))
    )
  );
}

function toIndicatorResult(
  indicatorId: string,
  response: WorldBankResponse<WorldBankIndicatorRecord>
): IndicatorDataResult {
  const metadata = response[0] ?? {};
  const records = response[1] ?? [];

  const observations: IndicatorObservation[] = records
    .filter(
      (record) =>
        record.countryiso3code?.length === 3 &&
        typeof record.value === "number" &&
        Number.isFinite(record.value)
    )
    .map((record) => ({
      indicatorId,
      iso3: record.countryiso3code,
      year: Number(record.date),
      value: record.value as number,
    }))
    .filter((record) => Number.isFinite(record.year));

  return {
    observations,
    lastUpdated: metadata.lastupdated ?? null,
    isFallback: false,
  };
}

async function fetchWorldBankIndicatorPath(
  indicatorId: string,
  countryPath: string,
  recentParam: "mrv" | "mrnev",
  mostRecentValues: number,
  force: boolean
): Promise<IndicatorDataResult> {
  const cacheKey = `${countryPath}:${indicatorId}:${recentParam}:${mostRecentValues}`;

  if (!force) {
    const cached = indicatorPromises.get(cacheKey);
    if (cached) return cached;
  }

  const request = (async () => {
    const url =
      `${WORLD_BANK_API_BASE}/country/${countryPath}/indicator/${encodeURIComponent(
        indicatorId
      )}` + `?format=json&per_page=20000&${recentParam}=${mostRecentValues}`;

    const response = await fetchJson<
      WorldBankResponse<WorldBankIndicatorRecord>
    >(url);
    return toIndicatorResult(indicatorId, response);
  })();

  indicatorPromises.set(cacheKey, request);

  try {
    return await request;
  } catch (error) {
    indicatorPromises.delete(cacheKey);
    throw error;
  }
}

export function resetWorldBankApiCache(): void {
  countryPromise = null;
  indicatorPromises.clear();
}

export async function fetchWorldBankCountries(
  force = false
): Promise<Country[]> {
  if (!force && countryPromise) return countryPromise;

  countryPromise = (async () => {
    const url = `${WORLD_BANK_API_BASE}/country?format=json&per_page=400`;
    const response = await fetchJson<WorldBankResponse<WorldBankCountryItem>>(
      url
    );
    const items = response[1] ?? [];

    return items
      .filter(
        (item) =>
          item.region?.id !== "NA" &&
          item.id.length === 3 &&
          item.iso2Code.length === 2
      )
      .map((item) => ({
        iso2: item.iso2Code,
        iso3: item.id,
        nameKo: localizedCountryName(item.iso2Code, item.name),
        nameEn: item.name,
        regionCode: item.region.id,
        region: REGION_NAMES_KO[item.region.id] ?? item.region.value.trim(),
        incomeLevelCode: item.incomeLevel.id,
        incomeLevel:
          INCOME_NAMES_KO[item.incomeLevel.id] ?? item.incomeLevel.value,
        capitalCity: item.capitalCity ?? "",
        longitude: toNumber(item.longitude),
        latitude: toNumber(item.latitude),
      }))
      .sort((a, b) => a.nameKo.localeCompare(b.nameKo, "ko"));
  })();

  try {
    return await countryPromise;
  } catch (error) {
    countryPromise = null;
    throw error;
  }
}

export async function fetchWorldBankIndicator(
  indicatorId: string,
  mostRecentValues = 10,
  force = false
): Promise<IndicatorDataResult> {
  return fetchWorldBankIndicatorPath(
    indicatorId,
    "all",
    "mrv",
    mostRecentValues,
    force
  );
}

/**
 * Web Sandbox QA처럼 제한된 국가 집합의 원천 가용성만 확인할 때 사용한다.
 * World Bank V2 API가 지원하는 세미콜론 복수국가 요청과 mrnev를 사용해
 * 전체 국가 응답보다 작고 안정적인 요청으로 최근 비결측치를 확인한다.
 */
export async function fetchWorldBankIndicatorForCountries(
  indicatorId: string,
  countryIso3Codes: readonly string[],
  mostRecentNonEmptyValues = 3,
  force = false
): Promise<IndicatorDataResult> {
  return fetchWorldBankIndicatorPath(
    indicatorId,
    normalizeCountryPath(countryIso3Codes),
    "mrnev",
    mostRecentNonEmptyValues,
    force
  );
}
/**
 * Web Sandbox QA용 다중 지표 조회.
 * World Bank V2 API는 같은 source 안에서 최대 60개 지표를 세미콜론으로
 * 한 번에 요청할 수 있으므로 QA가 19개의 외부 요청을 동시에 발생시키지 않게 한다.
 */
export async function fetchWorldBankIndicatorsForCountries(
  indicatorIds: readonly string[],
  countryIso3Codes: readonly string[],
  mostRecentNonEmptyValues = 3
): Promise<Map<string, IndicatorDataResult>> {
  const normalizedIndicators = normalizeIndicatorPath(indicatorIds);
  if (normalizedIndicators.length === 0) return new Map();
  if (normalizedIndicators.length > 60) {
    throw new Error("World Bank 다중 지표 요청은 최대 60개까지 지원됩니다.");
  }

  const countryPath = normalizeCountryPath(countryIso3Codes);
  const indicatorPath = normalizedIndicators.join(";");
  const url =
    `${WORLD_BANK_API_BASE}/country/${countryPath}/indicator/${indicatorPath}` +
    `?source=2&format=json&per_page=20000&mrnev=${mostRecentNonEmptyValues}`;

  const response = await fetchJson<WorldBankResponse<WorldBankIndicatorRecord>>(
    url
  );
  const metadata = response[0] ?? {};
  const records = response[1] ?? [];
  const results = new Map<string, IndicatorDataResult>();

  normalizedIndicators.forEach((indicatorId) => {
    results.set(indicatorId, {
      observations: [],
      lastUpdated: metadata.lastupdated ?? null,
      isFallback: false,
    });
  });

  records.forEach((record) => {
    const indicatorId = record.indicator?.id?.toUpperCase();
    if (!indicatorId || !results.has(indicatorId)) return;
    if (
      record.countryiso3code?.length !== 3 ||
      typeof record.value !== "number" ||
      !Number.isFinite(record.value)
    ) {
      return;
    }
    const year = Number(record.date);
    if (!Number.isFinite(year)) return;

    results.get(indicatorId)?.observations.push({
      indicatorId,
      iso3: record.countryiso3code,
      year,
      value: record.value,
    });
  });

  return results;
}
