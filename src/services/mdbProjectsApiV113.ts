export type MdbOrganizationV113 = "World Bank" | "ADB";

export interface MdbProjectRecordV113 {
  organization: MdbOrganizationV113;
  projectId: string;
  title: string;
  countryIso3: string;
  status: string;
  approvalDate: string | null;
  closingDate: string | null;
  commitmentUsd: number | null;
  disbursementUsd: number | null;
  sectors: string[];
  implementingAgency: string | null;
  sourceUrl: string;
}

export interface MdbCountryPortfolioV113 {
  countryIso3: string;
  worldBank: MdbProjectRecordV113[];
  adb: MdbProjectRecordV113[];
  adbCoverage: "covered" | "not_applicable" | "unavailable";
  warnings: string[];
}

const WORLD_BANK_PROJECT_API_V3 =
  "https://search.worldbank.org/api/v3/projects";
const WORLD_BANK_PROJECT_API_V2 =
  "https://search.worldbank.org/api/v2/projects";

const ISO2_BY_ISO3: Record<string, string> = {
  VNM: "VN",
  BGD: "BD",
  PHL: "PH",
  KHM: "KH",
  IDN: "ID",
  LAO: "LA",
  LKA: "LK",
  IND: "IN",
  MYS: "MY",
  EGY: "EG",
};

const ADB_IATI_URL_BY_ISO3: Record<string, string> = {
  VNM: "https://www.adb.org/iati/iati-activities-vn.xml",
  BGD: "https://www.adb.org/iati/iati-activities-bd.xml",
  PHL: "https://www.adb.org/iati/iati-activities-ph.xml",
  KHM: "https://www.adb.org/iati/iati-activities-kh.xml",
  IDN: "https://www.adb.org/iati/iati-activities-id.xml",
  LAO: "https://www.adb.org/iati/iati-activities-la.xml",
  LKA: "https://www.adb.org/iati/iati-activities-lk.xml",
  IND: "https://www.adb.org/iati/iati-activities-in.xml",
  MYS: "https://www.adb.org/iati/iati-activities-my.xml",
};

const cache = new Map<string, Promise<MdbCountryPortfolioV113>>();

function numberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: unknown): string {
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(", ");
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return text(
      object.name ?? object.value ?? object.sectorname ?? object.sector ?? ""
    );
  }
  return value == null ? "" : String(value).trim();
}

function pickObjectValue(
  object: Record<string, unknown>,
  candidates: string[]
): unknown {
  for (const candidate of candidates) {
    if (object[candidate] != null) return object[candidate];
  }
  return null;
}

function normalizeWorldBankProject(
  raw: Record<string, unknown>,
  iso3: string
): MdbProjectRecordV113 | null {
  const projectId = text(
    pickObjectValue(raw, ["id", "projectid", "project_id"])
  );
  const title = text(
    pickObjectValue(raw, [
      "project_name",
      "projectname",
      "project_name_en",
      "title",
    ])
  );
  if (!projectId || !title) return null;

  const sectors = [
    pickObjectValue(raw, ["sector1"]),
    pickObjectValue(raw, ["sector2"]),
    pickObjectValue(raw, ["sector3"]),
    pickObjectValue(raw, ["sector4"]),
    pickObjectValue(raw, ["sector"]),
    pickObjectValue(raw, ["sector_name"]),
  ]
    .map(text)
    .flatMap((value) => value.split(/\s*;\s*|\s*\|\s*/))
    .map((value) => value.trim())
    .filter(Boolean);

  const currentCommitment = numberOrNull(
    pickObjectValue(raw, [
      "curr_total_commitment",
      "total_commitment",
      "totalcommitment",
    ])
  );
  const totalAmount = numberOrNull(
    pickObjectValue(raw, ["totalamt", "total_amount"])
  );

  return {
    organization: "World Bank",
    projectId,
    title,
    countryIso3: iso3,
    status:
      text(
        pickObjectValue(raw, [
          "projectstatusdisplay",
          "status",
          "project_status",
          "status_exact",
        ])
      ) || "상태 정보 없음",
    approvalDate:
      text(
        pickObjectValue(raw, [
          "boardapprovaldate",
          "approvaldate",
          "board_approval_date",
        ])
      ) || null,
    closingDate:
      text(pickObjectValue(raw, ["closingdate", "closing_date"])) || null,
    commitmentUsd: currentCommitment ?? totalAmount,
    disbursementUsd: null,
    sectors: Array.from(new Set(sectors)).slice(0, 5),
    implementingAgency:
      text(
        pickObjectValue(raw, [
          "impagency",
          "implementingagency",
          "implementing_agency",
          "borrower",
        ])
      ) || null,
    sourceUrl: `https://projects.worldbank.org/en/projects-operations/project-detail/${encodeURIComponent(
      projectId
    )}`,
  };
}

async function fetchJsonWithTimeout(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`응답 오류 ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

function projectObjectFromResponse(
  payload: unknown
): Record<string, Record<string, unknown>> {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  const projects = root.projects;
  if (projects && typeof projects === "object" && !Array.isArray(projects)) {
    return projects as Record<string, Record<string, unknown>>;
  }
  if (Array.isArray(projects)) {
    return Object.fromEntries(
      projects
        .filter((item): item is Record<string, unknown> =>
          Boolean(item && typeof item === "object")
        )
        .map((item) => [text(item.id ?? item.projectid), item])
        .filter(([id]) => Boolean(id))
    );
  }
  return {};
}

async function fetchWorldBankStatus(
  iso3: string,
  iso2: string,
  status: "Active" | "Pipeline"
): Promise<MdbProjectRecordV113[]> {
  const params = new URLSearchParams({
    format: "json",
    rows: "200",
    apilang: "en",
    os: "0",
    countrycode_exact: iso2,
    status_exact: status,
  });

  let payload: unknown;
  try {
    payload = await fetchJsonWithTimeout(
      `${WORLD_BANK_PROJECT_API_V3}?${params}`
    );
  } catch {
    payload = await fetchJsonWithTimeout(
      `${WORLD_BANK_PROJECT_API_V2}?${params}`
    );
  }

  return Object.values(projectObjectFromResponse(payload))
    .map((project) => normalizeWorldBankProject(project, iso3))
    .filter((project): project is MdbProjectRecordV113 => project !== null);
}

async function fetchWorldBankProjects(
  iso3: string
): Promise<MdbProjectRecordV113[]> {
  const iso2 = ISO2_BY_ISO3[iso3];
  if (!iso2) return [];
  const settled = await Promise.allSettled([
    fetchWorldBankStatus(iso3, iso2, "Active"),
    fetchWorldBankStatus(iso3, iso2, "Pipeline"),
  ]);
  const records = settled.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
  if (
    !records.length &&
    settled.every((result) => result.status === "rejected")
  ) {
    throw new Error("World Bank Projects API를 불러오지 못했습니다");
  }
  const byId = new Map<string, MdbProjectRecordV113>();
  records.forEach((record) => byId.set(record.projectId, record));
  return Array.from(byId.values()).sort((a, b) => {
    const left = a.approvalDate ?? "";
    const right = b.approvalDate ?? "";
    return right.localeCompare(left);
  });
}

function firstNarrative(parent: Element | null): string {
  if (!parent) return "";
  return (
    parent.querySelector("narrative")?.textContent?.trim() ??
    parent.textContent?.trim() ??
    ""
  );
}

function sumIatiTransactions(
  activity: Element,
  typeCode: string
): number | null {
  let sum = 0;
  let hasUsd = false;
  const activityCurrency = activity.getAttribute("default-currency") ?? "";
  activity.querySelectorAll("transaction").forEach((transaction) => {
    const code = transaction
      .querySelector("transaction-type")
      ?.getAttribute("code");
    if (code !== typeCode) return;
    const valueNode = transaction.querySelector("value");
    const currency = valueNode?.getAttribute("currency") ?? activityCurrency;
    const value = numberOrNull(valueNode?.textContent ?? null);
    if (value == null || currency.toUpperCase() !== "USD") return;
    sum += value;
    hasUsd = true;
  });
  return hasUsd ? sum : null;
}

function adbSectorLabel(node: Element): string {
  const narrative = firstNarrative(node);
  if (narrative) return narrative;
  const code = node.getAttribute("code") ?? "";
  if (!code) return "";
  return node.getAttribute("vocabulary") === "1" ? `DAC ${code}` : code;
}

function adbStatusLabel(code: string | null): string {
  const labels: Record<string, string> = {
    "1": "준비·식별",
    "2": "이행 중",
    "3": "종료 정리",
    "4": "종료",
    "5": "취소",
    "6": "중단",
  };
  return code ? labels[code] ?? `상태 ${code}` : "상태 정보 없음";
}

function adbProjectUrl(identifier: string): string {
  const match = identifier.match(/(?:ADB|46004)[^0-9]*([0-9]{4,6})/i);
  if (match?.[1]) return `https://www.adb.org/projects/${match[1]}/main`;
  return "https://www.adb.org/projects";
}

function parseAdbIati(xmlText: string, iso3: string): MdbProjectRecordV113[] {
  const xml = new DOMParser().parseFromString(xmlText, "application/xml");
  if (xml.querySelector("parsererror"))
    throw new Error("ADB IATI XML을 해석하지 못했습니다");

  return Array.from(xml.querySelectorAll("iati-activity")).flatMap(
    (activity): MdbProjectRecordV113[] => {
      const projectId =
        activity.querySelector("iati-identifier")?.textContent?.trim() ?? "";
      const title = firstNarrative(activity.querySelector("title"));
      if (!projectId || !title) return [];

      const status = adbStatusLabel(
        activity.querySelector("activity-status")?.getAttribute("code") ?? null
      );
      if (!["준비·식별", "이행 중", "종료 정리"].includes(status)) return [];

      const dates = Array.from(activity.querySelectorAll("activity-date"));
      const approvalDate =
        dates
          .find((node) => ["1", "2"].includes(node.getAttribute("type") ?? ""))
          ?.getAttribute("iso-date") ?? null;
      const closingDate =
        dates
          .find((node) => ["3", "4"].includes(node.getAttribute("type") ?? ""))
          ?.getAttribute("iso-date") ?? null;
      const sectors = Array.from(activity.querySelectorAll("sector"))
        .map(adbSectorLabel)
        .filter(Boolean);
      const implementer = Array.from(
        activity.querySelectorAll("participating-org")
      ).find((node) => node.getAttribute("role") === "4");

      return [
        {
          organization: "ADB",
          projectId,
          title,
          countryIso3: iso3,
          status,
          approvalDate,
          closingDate,
          commitmentUsd: sumIatiTransactions(activity, "2"),
          disbursementUsd: sumIatiTransactions(activity, "3"),
          sectors: Array.from(new Set(sectors)).slice(0, 5),
          implementingAgency: implementer
            ? firstNarrative(implementer) || null
            : null,
          sourceUrl: adbProjectUrl(projectId),
        },
      ];
    }
  );
}

async function fetchAdbProjects(iso3: string): Promise<{
  records: MdbProjectRecordV113[];
  coverage: MdbCountryPortfolioV113["adbCoverage"];
}> {
  const sourceUrl = ADB_IATI_URL_BY_ISO3[iso3];
  if (!sourceUrl) return { records: [], coverage: "not_applicable" };

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      headers: { Accept: "application/xml,text/xml,*/*;q=0.8" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`ADB IATI 응답 오류 ${response.status}`);
    const xml = await response.text();
    return { records: parseAdbIati(xml, iso3), coverage: "covered" };
  } catch {
    return { records: [], coverage: "unavailable" };
  } finally {
    window.clearTimeout(timer);
  }
}

async function loadPortfolio(iso3: string): Promise<MdbCountryPortfolioV113> {
  const [wbResult, adbResult] = await Promise.allSettled([
    fetchWorldBankProjects(iso3),
    fetchAdbProjects(iso3),
  ]);
  const warnings: string[] = [];

  const worldBank = wbResult.status === "fulfilled" ? wbResult.value : [];
  if (wbResult.status === "rejected")
    warnings.push("World Bank 프로젝트를 일시적으로 불러오지 못했습니다");

  const adb = adbResult.status === "fulfilled" ? adbResult.value.records : [];
  const adbCoverage =
    adbResult.status === "fulfilled" ? adbResult.value.coverage : "unavailable";
  if (adbCoverage === "unavailable")
    warnings.push("ADB 프로젝트를 일시적으로 불러오지 못했습니다");

  if (
    !worldBank.length &&
    !adb.length &&
    adbCoverage !== "not_applicable" &&
    warnings.length >= 2
  ) {
    throw new Error("MDB 프로젝트 원천에 연결하지 못했습니다");
  }

  return { countryIso3: iso3, worldBank, adb, adbCoverage, warnings };
}

export function fetchMdbCountryPortfolioV113(
  countryIso3: string
): Promise<MdbCountryPortfolioV113> {
  const iso3 = countryIso3.toUpperCase();
  const existing = cache.get(iso3);
  if (existing) return existing;
  const request = loadPortfolio(iso3).catch((error) => {
    cache.delete(iso3);
    throw error;
  });
  cache.set(iso3, request);
  return request;
}

export function getAdbIatiSourceUrlV113(countryIso3: string): string | null {
  return ADB_IATI_URL_BY_ISO3[countryIso3.toUpperCase()] ?? null;
}

export const WORLD_BANK_PROJECTS_SOURCE_URL_V113 =
  "https://projects.worldbank.org/en/projects-operations/projects-list";
export const ADB_SOVEREIGN_PROJECTS_SOURCE_URL_V113 =
  "https://data.adb.org/dataset/adb-sovereign-projects";
