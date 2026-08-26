export type OecdOdaFlowV113 = "disbursement" | "commitment";

export interface OecdOdaObservationV113 {
  flow: OecdOdaFlowV113;
  donorCode: string;
  donorName: string;
  recipientCode: string;
  recipientName: string;
  year: number;
  value: number;
  unitLabel: string;
  priceBaseLabel: string;
}

export interface OecdOdaProviderV113 {
  code: string;
  name: string;
  value: number;
  year: number;
}

export interface OecdOdaCountryResultV113 {
  countryIso3: string;
  disbursements: OecdOdaObservationV113[];
  commitments: OecdOdaObservationV113[];
  latestDisbursementYear: number | null;
  latestDisbursement: number | null;
  latestCommitmentYear: number | null;
  latestCommitment: number | null;
  disbursementTrend: Array<{ year: number; value: number }>;
  commitmentTrend: Array<{ year: number; value: number }>;
  topProviders: OecdOdaProviderV113[];
  providerComposition: Array<{
    code: string;
    label: string;
    value: number;
    year: number;
  }>;
  unitLabel: string;
  priceBaseLabel: string;
  sourceUrls: { disbursement: string; commitment: string };
  warnings: string[];
}

const OECD_HOST = "https://sdmx.oecd.org/public/rest/data";
const DISBURSEMENT_FLOW = "OECD.DCD.FSD,DSD_DAC2@DF_DAC2A,";
const COMMITMENT_FLOW = "OECD.DCD.FSD,DSD_DAC2@DF_DAC3A,";
const START_PERIOD = 2020;

const AGGREGATE_PROVIDER_CODES = new Set([
  "ALLD",
  "DAC",
  "ALLM",
  "WXDAC",
  "DAC_EC",
  "9PRIV0",
]);

const AGGREGATE_PROVIDER_NAME_PATTERNS = [
  /official donors/i,
  /dac countries/i,
  /multilateral agencies/i,
  /other official providers/i,
  /all donors/i,
  /total/i,
];

const requestCache = new Map<string, Promise<OecdOdaCountryResultV113>>();

function buildUrl(
  flowRef: string,
  countryIso3: string,
  measure: string
): string {
  const key = `.${countryIso3.toUpperCase()}.${measure}.USD.Q`;
  return `${OECD_HOST}/${flowRef}/${key}?startPeriod=${START_PERIOD}&dimensionAtObservation=AllDimensions&format=csvfilewithlabels`;
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function parseCsv(text: string): Array<Record<string, string>> {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const lines = normalized.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((value) => value.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function pick(row: Record<string, string>, candidates: string[]): string {
  for (const candidate of candidates) {
    const direct = row[candidate];
    if (direct != null && direct !== "") return direct.trim();
  }

  const normalizedEntries = Object.entries(row).map(
    ([key, value]) =>
      [key.toLowerCase().replace(/[^a-z0-9]/g, ""), value] as const
  );
  for (const candidate of candidates) {
    const normalizedCandidate = candidate
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const match = normalizedEntries.find(
      ([key]) => key === normalizedCandidate
    );
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function toNumber(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeOecdRows(
  rows: Array<Record<string, string>>,
  flow: OecdOdaFlowV113
): OecdOdaObservationV113[] {
  return rows
    .map((row) => {
      const year = Number(
        pick(row, ["TIME_PERIOD", "Time period", "TIME", "Year"])
      );
      const value = toNumber(
        pick(row, ["OBS_VALUE", "Observation value", "Value", "OBS VALUE"])
      );
      if (!Number.isInteger(year) || value == null) return null;

      const observation: OecdOdaObservationV113 = {
        flow,
        donorCode: pick(row, ["DONOR", "Donor code", "DONOR_CODE"]),
        donorName:
          pick(row, ["Donor", "DONOR_NAME", "Donor label"]) ||
          pick(row, ["DONOR", "Donor code"]),
        recipientCode: pick(row, [
          "RECIPIENT",
          "Recipient code",
          "RECIPIENT_CODE",
        ]),
        recipientName:
          pick(row, ["Recipient", "RECIPIENT_NAME", "Recipient label"]) ||
          pick(row, ["RECIPIENT", "Recipient code"]),
        year,
        value,
        unitLabel:
          pick(row, [
            "Combined unit of measure",
            "COMBINED_UNIT_MEASURE",
            "UNIT_MEASURE",
            "Unit of measure",
          ]) || "US dollar, Millions",
        priceBaseLabel:
          pick(row, ["Price base", "PRICE_BASE"]) || "Constant prices",
      };

      return observation;
    })
    .filter((row): row is OecdOdaObservationV113 => row !== null);
}

async function fetchTextWithRetry(url: string): Promise<string> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "text/csv,*/*;q=0.8" },
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error(`OECD API 응답 오류 ${response.status}`);
      const text = await response.text();
      if (!text.trim()) throw new Error("OECD API가 빈 응답을 반환했습니다");
      return text;
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await new Promise((resolve) =>
          window.setTimeout(resolve, 450 * (attempt + 1))
        );
      }
    } finally {
      window.clearTimeout(timer);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("OECD API 연결에 실패했습니다");
}

function isAggregateProvider(row: OecdOdaObservationV113): boolean {
  if (AGGREGATE_PROVIDER_CODES.has(row.donorCode.toUpperCase())) return true;
  return AGGREGATE_PROVIDER_NAME_PATTERNS.some((pattern) =>
    pattern.test(row.donorName)
  );
}

function totalRows(rows: OecdOdaObservationV113[]): OecdOdaObservationV113[] {
  const exact = rows.filter((row) => row.donorCode.toUpperCase() === "ALLD");
  if (exact.length) return exact;
  return rows.filter((row) => /official donors/i.test(row.donorName));
}

function buildTrend(rows: OecdOdaObservationV113[]) {
  return totalRows(rows)
    .slice()
    .sort((a, b) => a.year - b.year)
    .slice(-5)
    .map((row) => ({ year: row.year, value: row.value }));
}

function buildLatest(rows: OecdOdaObservationV113[]) {
  const totals = totalRows(rows).sort((a, b) => b.year - a.year);
  return totals[0] ?? null;
}

function buildTopProviders(
  rows: OecdOdaObservationV113[],
  latestYear: number | null
): OecdOdaProviderV113[] {
  if (latestYear == null) return [];
  return rows
    .filter(
      (row) =>
        row.year === latestYear &&
        !isAggregateProvider(row) &&
        row.value > 0 &&
        row.donorName.trim().length > 0
    )
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((row) => ({
      code: row.donorCode,
      name: row.donorName,
      value: row.value,
      year: row.year,
    }));
}

function buildComposition(
  rows: OecdOdaObservationV113[],
  latestYear: number | null
) {
  if (latestYear == null) return [];
  const labels: Record<string, string> = {
    DAC: "DAC 회원국",
    ALLM: "다자기관",
    WXDAC: "기타 공식 공여국",
  };
  return ["DAC", "ALLM", "WXDAC"]
    .map((code) => {
      const row = rows.find(
        (item) =>
          item.year === latestYear && item.donorCode.toUpperCase() === code
      );
      return row
        ? { code, label: labels[code], value: row.value, year: row.year }
        : null;
    })
    .filter(
      (
        item
      ): item is { code: string; label: string; value: number; year: number } =>
        item !== null
    );
}

async function loadCountry(
  countryIso3: string
): Promise<OecdOdaCountryResultV113> {
  const iso3 = countryIso3.toUpperCase();
  const disbursementUrl = buildUrl(DISBURSEMENT_FLOW, iso3, "206");
  const commitmentUrl = buildUrl(COMMITMENT_FLOW, iso3, "305");

  const [disbursementResult, commitmentResult] = await Promise.allSettled([
    fetchTextWithRetry(disbursementUrl),
    fetchTextWithRetry(commitmentUrl),
  ]);

  const disbursements =
    disbursementResult.status === "fulfilled"
      ? normalizeOecdRows(parseCsv(disbursementResult.value), "disbursement")
      : [];
  const commitments =
    commitmentResult.status === "fulfilled"
      ? normalizeOecdRows(parseCsv(commitmentResult.value), "commitment")
      : [];
  const warnings: string[] = [];
  if (disbursementResult.status === "rejected")
    warnings.push("ODA 실제 지출 자료를 일시적으로 불러오지 못했습니다");
  if (commitmentResult.status === "rejected")
    warnings.push("ODA 약정 자료를 일시적으로 불러오지 못했습니다");

  if (!disbursements.length && !commitments.length) {
    throw new Error("선택 국가의 OECD ODA 자료를 확인하지 못했습니다");
  }

  const latestDisbursementRow = buildLatest(disbursements);
  const latestCommitmentRow = buildLatest(commitments);
  const exemplar = latestDisbursementRow ?? latestCommitmentRow;

  return {
    countryIso3: iso3,
    disbursements,
    commitments,
    latestDisbursementYear: latestDisbursementRow?.year ?? null,
    latestDisbursement: latestDisbursementRow?.value ?? null,
    latestCommitmentYear: latestCommitmentRow?.year ?? null,
    latestCommitment: latestCommitmentRow?.value ?? null,
    disbursementTrend: buildTrend(disbursements),
    commitmentTrend: buildTrend(commitments),
    topProviders: buildTopProviders(
      disbursements,
      latestDisbursementRow?.year ?? null
    ),
    providerComposition: buildComposition(
      disbursements,
      latestDisbursementRow?.year ?? null
    ),
    unitLabel: exemplar?.unitLabel ?? "US dollar, Millions",
    priceBaseLabel: exemplar?.priceBaseLabel ?? "Constant prices",
    sourceUrls: { disbursement: disbursementUrl, commitment: commitmentUrl },
    warnings,
  };
}

export function fetchOecdOdaCountryV113(
  countryIso3: string
): Promise<OecdOdaCountryResultV113> {
  const key = countryIso3.toUpperCase();
  const cached = requestCache.get(key);
  if (cached) return cached;
  const request = loadCountry(key).catch((error) => {
    requestCache.delete(key);
    throw error;
  });
  requestCache.set(key, request);
  return request;
}

export const OECD_ODA_DATA_EXPLORER_URL_V113 =
  "https://data-explorer.oecd.org/vis?df[ag]=OECD.DCD.FSD&df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_DAC2@DF_DAC2A";
