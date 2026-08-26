import { CCKP_HI35_SOURCE } from "../config/dataSources";
import type {
  CckpHi35Snapshot,
  ClimateIndicatorDataResult,
} from "../types/climate";
import type { IndicatorObservation } from "../types/indicator";

const API_TIMEOUT_MS = 25000;
let cachedResult: ClimateIndicatorDataResult | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeIso3(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getCandidateIso3(record: Record<string, unknown>): string | null {
  const keys = [
    "code",
    "iso3",
    "ISO3",
    "country_code",
    "countryCode",
    "geocode",
    "geo_code",
    "id",
  ];

  for (const key of keys) {
    const iso3 = normalizeIso3(record[key]);
    if (iso3) return iso3;
  }

  return null;
}

function getCandidateValue(record: Record<string, unknown>): number | null {
  const preferredKeys = [
    "value",
    "Value",
    "VALUE",
    "mean",
    "Mean",
    "hi35",
    "2040-07",
    "2040-2059",
  ];

  for (const key of preferredKeys) {
    const value = toFiniteNumber(record[key]);
    if (value !== null) return value;
  }

  for (const [key, value] of Object.entries(record)) {
    if (
      /^(code|iso3|country|name|region|id|lat|lon|latitude|longitude)$/i.test(
        key
      )
    ) {
      continue;
    }

    if (/2040|2059|hi35|value|mean/i.test(key)) {
      const direct = toFiniteNumber(value);
      if (direct !== null) return direct;
    }

    if (isRecord(value)) {
      const nested = getCandidateValue(value);
      if (nested !== null) return nested;
    }
  }

  return null;
}

function collectApiRecords(
  value: unknown,
  output: Array<Record<string, unknown>>,
  depth = 0
): void {
  if (depth > 6 || output.length > 5000) return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectApiRecords(item, output, depth + 1));
    return;
  }

  if (!isRecord(value)) return;

  if (getCandidateIso3(value) && getCandidateValue(value) !== null) {
    output.push(value);
  }

  const isoKeyEntries = Object.entries(value).filter(([key]) =>
    /^[A-Za-z]{3}$/.test(key)
  );

  isoKeyEntries.forEach(([key, nestedValue]) => {
    const iso3 = normalizeIso3(key);
    if (!iso3) return;

    const numberValue = toFiniteNumber(nestedValue);
    if (numberValue !== null) {
      output.push({ code: iso3, value: numberValue });
      return;
    }

    if (isRecord(nestedValue)) {
      output.push({ code: iso3, ...nestedValue });
    }
  });

  Object.values(value).forEach((item) =>
    collectApiRecords(item, output, depth + 1)
  );
}

function parseCckpApiPayload(payload: unknown): IndicatorObservation[] {
  const candidateRecords: Array<Record<string, unknown>> = [];
  collectApiRecords(payload, candidateRecords);

  const byIso3 = new Map<string, IndicatorObservation>();

  candidateRecords.forEach((record) => {
    const iso3 = getCandidateIso3(record);
    const value = getCandidateValue(record);

    if (!iso3 || value === null) return;

    byIso3.set(iso3, {
      indicatorId: CCKP_HI35_SOURCE.indicatorId,
      iso3,
      year: CCKP_HI35_SOURCE.representativeYear,
      value: Number(value.toFixed(2)),
    });
  });

  return Array.from(byIso3.values()).sort((a, b) =>
    a.iso3.localeCompare(b.iso3)
  );
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    return await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function loadFromApi(): Promise<ClimateIndicatorDataResult> {
  const response = await fetchWithTimeout(CCKP_HI35_SOURCE.apiUrl);

  if (!response.ok) {
    throw new Error(`CCKP API 응답 오류: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const observations = parseCckpApiPayload(payload);

  if (observations.length < 50) {
    throw new Error("CCKP API 응답에서 국가별 값을 충분히 확인하지 못함");
  }

  const fetchedAt = new Date().toISOString();

  return {
    observations,
    lastUpdated: fetchedAt,
    isFallback: false,
    sourceStatus: "live-api",
    referencePeriod: CCKP_HI35_SOURCE.referencePeriod,
    scenario: CCKP_HI35_SOURCE.scenario,
    fetchedAt,
  };
}

async function loadFromSnapshot(): Promise<ClimateIndicatorDataResult> {
  const response = await fetch(CCKP_HI35_SOURCE.snapshotUrl, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`CCKP 저장본 응답 오류: ${response.status}`);
  }

  const snapshot = (await response.json()) as CckpHi35Snapshot;

  if (!Array.isArray(snapshot.observations)) {
    throw new Error("CCKP 저장본 형식 오류");
  }

  const observations = snapshot.observations.map((item) => ({
    indicatorId: CCKP_HI35_SOURCE.indicatorId,
    iso3: item.iso3,
    year: CCKP_HI35_SOURCE.representativeYear,
    value:
      typeof item.value === "number" && Number.isFinite(item.value)
        ? item.value
        : null,
  }));

  return {
    observations,
    lastUpdated: snapshot.metadata.snapshotDate,
    isFallback: true,
    sourceStatus: "snapshot",
    referencePeriod: snapshot.metadata.projectionPeriod,
    scenario: snapshot.metadata.scenario,
    fetchedAt: snapshot.metadata.snapshotDate,
    warning: "CCKP 원천 API 연결 지연 · 2026-08-03 저장본 표시",
  };
}

export async function loadCckpHeatIndexData(
  force = false
): Promise<ClimateIndicatorDataResult> {
  if (cachedResult && !force) return cachedResult;

  try {
    cachedResult = await loadFromApi();
    return cachedResult;
  } catch {
    try {
      cachedResult = await loadFromSnapshot();
      return cachedResult;
    } catch {
      return {
        observations: [],
        lastUpdated: null,
        isFallback: true,
        sourceStatus: "unavailable",
        referencePeriod: CCKP_HI35_SOURCE.referencePeriod,
        scenario: CCKP_HI35_SOURCE.scenario,
        fetchedAt: null,
        warning: "CCKP API·저장본 모두 연결 불가",
      };
    }
  }
}
