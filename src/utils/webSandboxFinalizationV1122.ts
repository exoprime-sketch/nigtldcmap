import { ACQUISITION_SOURCES_V76 } from "../data/acquisition/sourceRegistryV76";
import { INDICATOR_CONFIGS } from "../data/indicators/registry";
import { PRIORITY_COUNTRIES } from "../data/priorityCountries";
import { DATASETS } from "../data/publicDatasets";
import { COOPERATION_POLICY_EVIDENCE_V109 } from "../data/policy/cooperationPolicyEvidenceV109";
import {
  TNA_COUNTRY_PROFILES_V110,
  countTnaMappedRecordsV110,
  countTnaTechnologyRecordsV110,
} from "../data/policy/tnaTechnologyNeedsV110";
import {
  TNA_CURRENTNESS_EVIDENCE_V111,
  getVerifiedGcfMatchesForTnaV111,
} from "../data/policy/tnaCurrentnessV111";
import {
  CTCN_COUNTRY_INDEX_V112,
  INTERNATIONAL_SUPPORT_RECORDS_V112,
} from "../data/support/internationalSupportV112";
import {
  fetchWorldBankIndicatorForCountries,
  fetchWorldBankIndicatorsForCountries,
} from "../services/worldBankApi";
import { fetchOecdOdaCountryV113 } from "../services/oecdOdaApiV113";
import {
  fetchMdbCountryPortfolioV113,
  getAdbIatiSourceUrlV113,
} from "../services/mdbProjectsApiV113";
import { getReleaseAuditSummaryV88 } from "./releaseAuditV88";
import { runOperationalFinalizationAuditV102 } from "./operationalFinalizationAuditV102";
import {
  isDatasetDownloadable,
  isDatasetPubliclyVisible,
} from "./datasetAccess";

export type WebSandboxQaStatusV1122 = "PASS" | "WARN" | "FAIL";

export interface WebSandboxQaCheckV1122 {
  section: string;
  status: WebSandboxQaStatusV1122;
  code: string;
  label: string;
  actual: string;
  expected: string;
  note?: string;
}

export interface WebSandboxWorldBankResultV1122 {
  configured: number;
  liveOk: number;
  snapshotOk: number;
  unavailable: number;
  failedIndicatorIds: string[];
}

export interface WebSandboxQaResultV1122 {
  schemaVersion: "v113";
  generatedAt: string;
  overall: "READY" | "CONDITIONALLY_READY" | "BLOCKED";
  p0: number;
  p1: number;
  checks: WebSandboxQaCheckV1122[];
  facts: {
    datasets: number;
    publicDatasets: number;
    publishedDatasets: number;
    policyRecordsV109: number;
    tnaProfilesV110: number;
    tnaTechnologyRecordsV110: number;
    tnaMappedRecordsV110: number;
    tnaProjectIdeasV110: number;
    currentnessRecordsV111: number;
    gcfMatchedTnaRecordsV111: number;
    gcfRecordProjectLinksV111: number;
    uniqueGcfProjectsV111: number;
    supportRecordsV112: number;
    ctcnRecordsV112: number;
    adaptationFundRecordsV112: number;
    gefRecordsV112: number;
    acquisitionSourcesV113: number;
    adbConfiguredCountriesV113: number;
    oecdOdaLiveV113: boolean;
    worldBankProjectsLiveV113: boolean;
    adbProjectsLiveV113: boolean;
    worldBank: WebSandboxWorldBankResultV1122;
  };
}

const EXPECTED = {
  datasets: 39,
  publicDatasets: 35,
  publishedDatasets: 31,
  policyRecordsV109: 40,
  tnaProfilesV110: 7,
  tnaTechnologyRecordsV110: 82,
  tnaMappedRecordsV110: 79,
  tnaProjectIdeasV110: 7,
  currentnessRecordsV111: 82,
  currentnessReconfirmedV111: 44,
  currentnessPartialV111: 27,
  currentnessHistoricalV111: 9,
  currentnessConflictV111: 2,
  gcfMatchedTnaRecordsV111: 17,
  gcfRecordProjectLinksV111: 19,
  uniqueGcfProjectsV111: 7,
  supportRecordsV112: 48,
  ctcnRecordsV112: 17,
  adaptationFundRecordsV112: 27,
  gefRecordsV112: 4,
  ctcnCountryIndexV112: 10,
  acquisitionSourcesV113: 14,
  adbConfiguredCountriesV113: 9,
  worldBankIndicators: 19,
} as const;

function statusForEquality(
  actual: number,
  expected: number
): WebSandboxQaStatusV1122 {
  return actual === expected ? "PASS" : "FAIL";
}

function addCountCheck(
  checks: WebSandboxQaCheckV1122[],
  section: string,
  code: string,
  label: string,
  actual: number,
  expected: number,
  note?: string
): void {
  checks.push({
    section,
    status: statusForEquality(actual, expected),
    code,
    label,
    actual: String(actual),
    expected: String(expected),
    note,
  });
}

function addBooleanCheck(
  checks: WebSandboxQaCheckV1122[],
  section: string,
  code: string,
  label: string,
  pass: boolean,
  note?: string,
  warnOnly = false
): void {
  checks.push({
    section,
    status: pass ? "PASS" : warnOnly ? "WARN" : "FAIL",
    code,
    label,
    actual: pass ? "정상" : "확인 필요",
    expected: "정상",
    note,
  });
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function getAllTnaRecords() {
  return TNA_COUNTRY_PROFILES_V110.flatMap((profile) =>
    profile.technologies.map((record) => ({ profile, record }))
  );
}

function getWorldBankConfigs() {
  return INDICATOR_CONFIGS.filter(
    (config) =>
      config.provider === "world-bank" && Boolean(config.worldBankCode)
  );
}

async function hasLocalSnapshot(indicatorId: string): Promise<boolean> {
  try {
    const response = await fetch(`/data/worldbank/${indicatorId}.json`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return false;
    const payload = (await response.json()) as { observations?: unknown[] };
    return (
      Array.isArray(payload.observations) && payload.observations.length > 0
    );
  } catch {
    return false;
  }
}

async function hasLiveWorldBankData(
  worldBankCode: string,
  priorityCountryIso3: string[]
): Promise<boolean> {
  try {
    const result = await fetchWorldBankIndicatorForCountries(
      worldBankCode,
      priorityCountryIso3,
      3,
      true
    );
    const prioritySet = new Set<string>(priorityCountryIso3);
    return result.observations.some(
      (row) => prioritySet.has(row.iso3) && Number.isFinite(row.value)
    );
  } catch {
    return false;
  }
}

async function auditWorldBankV1122(
  onProgress?: (message: string) => void
): Promise<WebSandboxWorldBankResultV1122> {
  const configs = getWorldBankConfigs();
  const priorityCountryIso3 = PRIORITY_COUNTRIES.map((country) => country.iso3);
  const liveIds = new Set<string>();
  const snapshotIds = new Set<string>();

  onProgress?.("World Bank 저장본 확인");
  await Promise.all(
    configs.map(async (config) => {
      if (await hasLocalSnapshot(config.id)) snapshotIds.add(config.id);
    })
  );

  // 19개 지표를 각각 호출하면 QA 자체가 일시적 API 오류를 증폭시킨다.
  // World Bank가 공식 지원하는 multi-indicator 요청을 우선 사용한다.
  try {
    onProgress?.("World Bank 19개 지표 묶음 요청");
    const batch = await fetchWorldBankIndicatorsForCountries(
      configs.map((config) => config.worldBankCode),
      priorityCountryIso3,
      3
    );
    const prioritySet = new Set<string>(priorityCountryIso3);
    configs.forEach((config) => {
      const result = batch.get(config.worldBankCode.toUpperCase());
      if (
        result?.observations.some(
          (row) => prioritySet.has(row.iso3) && Number.isFinite(row.value)
        )
      ) {
        liveIds.add(config.id);
      }
    });
  } catch {
    // 외부 API의 일시 실패는 아래에서 WARN으로만 기록한다.
  }

  // 묶음 요청이 성공했지만 특정 지표가 비어 있는 경우에만 개별 재확인한다.
  // 요청 폭주를 막기 위해 순차 실행한다.
  const missingAfterBatch = configs.filter(
    (config) => !liveIds.has(config.id) && !snapshotIds.has(config.id)
  );
  if (liveIds.size > 0 && missingAfterBatch.length > 0) {
    for (const config of missingAfterBatch) {
      onProgress?.(`World Bank 재확인 · ${config.definition.titleKo}`);
      if (
        await hasLiveWorldBankData(config.worldBankCode, priorityCountryIso3)
      ) {
        liveIds.add(config.id);
      }
    }
  }

  const failedIndicatorIds = configs
    .filter((config) => !liveIds.has(config.id) && !snapshotIds.has(config.id))
    .map((config) => config.id)
    .sort();

  return {
    configured: configs.length,
    liveOk: liveIds.size,
    snapshotOk: snapshotIds.size,
    unavailable: failedIndicatorIds.length,
    failedIndicatorIds,
  };
}

export async function runWebSandboxFinalizationV1122(
  onProgress?: (message: string) => void
): Promise<WebSandboxQaResultV1122> {
  const checks: WebSandboxQaCheckV1122[] = [];

  onProgress?.("기존 릴리스 감사 확인");
  const releaseV88 = getReleaseAuditSummaryV88();
  addBooleanCheck(
    checks,
    "기존 릴리스 게이트",
    "V88_P0",
    "v88 릴리스 감사 P0",
    releaseV88.p0 === 0,
    `P0 ${releaseV88.p0} · P1 ${releaseV88.p1}`
  );
  if (releaseV88.p1 > 0) {
    checks.push({
      section: "기존 릴리스 게이트",
      status: "WARN",
      code: "V88_P1",
      label: "v88 릴리스 감사 P1",
      actual: String(releaseV88.p1),
      expected: "0",
      note: "P1은 공개 차단이 아닌 확인 항목으로 표시",
    });
  }

  onProgress?.("운영 최종화 감사 확인");
  const operationalV102 = await runOperationalFinalizationAuditV102();
  addBooleanCheck(
    checks,
    "기존 릴리스 게이트",
    "V102_RUNTIME",
    "v102 운영 최종화",
    operationalV102.status === "MAP_UI_FINALIZED",
    operationalV102.issues.length
      ? operationalV102.issues.join(" · ")
      : "기존 운영 감사 통과"
  );

  const publicDatasets = DATASETS.filter(isDatasetPubliclyVisible);
  const publishedDatasets = DATASETS.filter(
    (dataset) => dataset.publicationStatus === "published"
  );
  addCountCheck(
    checks,
    "Dataset 기준선",
    "DATASETS_TOTAL",
    "Dataset 수",
    DATASETS.length,
    EXPECTED.datasets
  );
  addCountCheck(
    checks,
    "Dataset 기준선",
    "DATASETS_PUBLIC",
    "공개 Dataset 수",
    publicDatasets.length,
    EXPECTED.publicDatasets
  );
  addCountCheck(
    checks,
    "Dataset 기준선",
    "DATASETS_PUBLISHED",
    "published Dataset 수",
    publishedDatasets.length,
    EXPECTED.publishedDatasets
  );

  onProgress?.("v109 정책근거 검증");
  const v109Keys = COOPERATION_POLICY_EVIDENCE_V109.map(
    (record) => `${record.countryIso3}:${record.kind}`
  );
  addCountCheck(
    checks,
    "v109 정책근거",
    "V109_RECORDS",
    "정책근거 레코드",
    COOPERATION_POLICY_EVIDENCE_V109.length,
    EXPECTED.policyRecordsV109
  );
  addBooleanCheck(
    checks,
    "v109 정책근거",
    "V109_UNIQUE",
    "국가×정책종류 중복 없음",
    unique(v109Keys).length === v109Keys.length
  );
  const v109PriorityCoverage = PRIORITY_COUNTRIES.every((country) => {
    const records = COOPERATION_POLICY_EVIDENCE_V109.filter(
      (record) => record.countryIso3 === country.iso3
    );
    return unique(records.map((record) => record.kind)).length === 4;
  });
  addBooleanCheck(
    checks,
    "v109 정책근거",
    "V109_COUNTRY_COVERAGE",
    "10개 우선국 BTR·NAP·LT-LEDS·TNA 메타데이터",
    v109PriorityCoverage
  );

  onProgress?.("v110 TNA/TAP 구조화 검증");
  const allTna = getAllTnaRecords();
  const tnaProjectIdeas = TNA_COUNTRY_PROFILES_V110.reduce(
    (sum, profile) => sum + profile.projectIdeas.length,
    0
  );
  addCountCheck(
    checks,
    "v110 TNA/TAP",
    "V110_PROFILES",
    "원문 구조화 국가",
    TNA_COUNTRY_PROFILES_V110.length,
    EXPECTED.tnaProfilesV110
  );
  addCountCheck(
    checks,
    "v110 TNA/TAP",
    "V110_TECH",
    "우선기술 레코드",
    countTnaTechnologyRecordsV110(),
    EXPECTED.tnaTechnologyRecordsV110
  );
  addCountCheck(
    checks,
    "v110 TNA/TAP",
    "V110_MAPPED",
    "38대 기후기술 매핑",
    countTnaMappedRecordsV110(),
    EXPECTED.tnaMappedRecordsV110
  );
  addCountCheck(
    checks,
    "v110 TNA/TAP",
    "V110_PROJECT_IDEA",
    "Project Idea",
    tnaProjectIdeas,
    EXPECTED.tnaProjectIdeasV110
  );
  addBooleanCheck(
    checks,
    "v110 TNA/TAP",
    "V110_SOURCE_URL",
    "TNA 우선기술 원문 URL 보유",
    allTna.every(({ record }) => Boolean(record.sourceUrl))
  );

  onProgress?.("v111 현재성·GCF 연결 검증");
  const currentnessIds = TNA_CURRENTNESS_EVIDENCE_V111.map(
    (record) => record.recordId
  );
  const tnaIds = new Set(allTna.map(({ record }) => record.id));
  const currentnessCounts = {
    reconfirmed: TNA_CURRENTNESS_EVIDENCE_V111.filter(
      (record) => record.status === "reconfirmed"
    ).length,
    partial: TNA_CURRENTNESS_EVIDENCE_V111.filter(
      (record) => record.status === "partially_reconfirmed"
    ).length,
    historical: TNA_CURRENTNESS_EVIDENCE_V111.filter(
      (record) => record.status === "historical_only"
    ).length,
    conflict: TNA_CURRENTNESS_EVIDENCE_V111.filter(
      (record) => record.status === "possible_conflict"
    ).length,
  };
  addCountCheck(
    checks,
    "v111 현재성",
    "V111_CURRENTNESS",
    "현재성 판정",
    TNA_CURRENTNESS_EVIDENCE_V111.length,
    EXPECTED.currentnessRecordsV111
  );
  addCountCheck(
    checks,
    "v111 현재성",
    "V111_RECONFIRMED",
    "최신 정책에서 재확인",
    currentnessCounts.reconfirmed,
    EXPECTED.currentnessReconfirmedV111
  );
  addCountCheck(
    checks,
    "v111 현재성",
    "V111_PARTIAL",
    "부분 재확인",
    currentnessCounts.partial,
    EXPECTED.currentnessPartialV111
  );
  addCountCheck(
    checks,
    "v111 현재성",
    "V111_HISTORICAL",
    "TNA 역사근거만",
    currentnessCounts.historical,
    EXPECTED.currentnessHistoricalV111
  );
  addCountCheck(
    checks,
    "v111 현재성",
    "V111_CONFLICT",
    "최신 정책과 방향 충돌 가능",
    currentnessCounts.conflict,
    EXPECTED.currentnessConflictV111
  );
  addBooleanCheck(
    checks,
    "v111 현재성",
    "V111_ID_MATCH",
    "현재성 레코드가 TNA 82건과 일대일 대응",
    unique(currentnessIds).length === currentnessIds.length &&
      currentnessIds.every((id) => tnaIds.has(id)) &&
      currentnessIds.length === tnaIds.size
  );

  let gcfMatchedTnaRecords = 0;
  let gcfRecordProjectLinks = 0;
  const uniqueGcfProjects = new Set<string>();
  allTna.forEach(({ profile, record }) => {
    const matches = getVerifiedGcfMatchesForTnaV111(
      profile.countryIso3,
      record.mappedTechnologyId
    );
    if (matches.length > 0) gcfMatchedTnaRecords += 1;
    gcfRecordProjectLinks += matches.length;
    matches.forEach((match) => uniqueGcfProjects.add(match.projectId));
  });
  addCountCheck(
    checks,
    "v111 GCF 연결",
    "V111_GCF_TNA",
    "GCF 연결 TNA 레코드",
    gcfMatchedTnaRecords,
    EXPECTED.gcfMatchedTnaRecordsV111
  );
  addCountCheck(
    checks,
    "v111 GCF 연결",
    "V111_GCF_LINKS",
    "TNA↔GCF 연결",
    gcfRecordProjectLinks,
    EXPECTED.gcfRecordProjectLinksV111
  );
  addCountCheck(
    checks,
    "v111 GCF 연결",
    "V111_GCF_PROJECTS",
    "고유 GCF 프로젝트",
    uniqueGcfProjects.size,
    EXPECTED.uniqueGcfProjectsV111
  );

  onProgress?.("v112 국제지원 데이터 검증");
  const ctcnRecords = INTERNATIONAL_SUPPORT_RECORDS_V112.filter(
    (record) => record.sourceOrganization === "CTCN"
  );
  const afRecords = INTERNATIONAL_SUPPORT_RECORDS_V112.filter(
    (record) => record.sourceOrganization === "Adaptation Fund"
  );
  const gefRecords = INTERNATIONAL_SUPPORT_RECORDS_V112.filter(
    (record) => record.sourceOrganization === "GEF"
  );
  addCountCheck(
    checks,
    "v112 국제지원",
    "V112_TOTAL",
    "원문검증 국제지원 레코드",
    INTERNATIONAL_SUPPORT_RECORDS_V112.length,
    EXPECTED.supportRecordsV112
  );
  addCountCheck(
    checks,
    "v112 국제지원",
    "V112_CTCN",
    "CTCN 상세 레코드",
    ctcnRecords.length,
    EXPECTED.ctcnRecordsV112
  );
  addCountCheck(
    checks,
    "v112 국제지원",
    "V112_AF",
    "Adaptation Fund 레코드",
    afRecords.length,
    EXPECTED.adaptationFundRecordsV112
  );
  addCountCheck(
    checks,
    "v112 국제지원",
    "V112_GEF",
    "GEF 선별 공식사업",
    gefRecords.length,
    EXPECTED.gefRecordsV112
  );
  addCountCheck(
    checks,
    "v112 국제지원",
    "V112_CTCN_INDEX",
    "CTCN 10개 우선국 index",
    CTCN_COUNTRY_INDEX_V112.length,
    EXPECTED.ctcnCountryIndexV112
  );
  const multiCountryAllocationViolation =
    INTERNATIONAL_SUPPORT_RECORDS_V112.filter(
      (record) =>
        record.multiCountry &&
        record.countryAllocatedAmountUsd !== null &&
        record.amountScope !== "single_country_approved"
    );
  addBooleanCheck(
    checks,
    "v112 국제지원",
    "V112_MULTI_COUNTRY_ALLOCATION",
    "다국가 총액의 임의 국가배분 없음",
    multiCountryAllocationViolation.length === 0,
    multiCountryAllocationViolation.length
      ? multiCountryAllocationViolation
          .map((record) => record.projectId)
          .join(", ")
      : undefined
  );
  addBooleanCheck(
    checks,
    "v112 국제지원",
    "V112_SOURCE_URL",
    "국제지원 레코드 공식 출처 URL 보유",
    INTERNATIONAL_SUPPORT_RECORDS_V112.every((record) =>
      Boolean(record.sourceUrl)
    )
  );

  onProgress?.("v113 ODA·MDB 공개 데이터 연결 검증");
  const odaDataset = DATASETS.find(
    (dataset) => dataset.id === "LDC-DS-D-011-OECD-ODA"
  );
  const mdbDataset = DATASETS.find((dataset) => dataset.id === "LDC-DS-D-002");
  addBooleanCheck(
    checks,
    "v113 ODA·MDB",
    "V113_ODA_DATASET",
    "D-011 OECD ODA 공개 Dataset",
    Boolean(
      odaDataset &&
        odaDataset.elementId === "D-011" &&
        odaDataset.publicationStatus === "published" &&
        isDatasetPubliclyVisible(odaDataset) &&
        isDatasetDownloadable(odaDataset) &&
        odaDataset.countries.length === 10
    ),
    "10개 우선국 · 국가별 CSV/JSON 다운로드 · OECD DAC2A 실제 지출과 DAC3A 약정 분리 제공"
  );
  addBooleanCheck(
    checks,
    "v113 ODA·MDB",
    "V113_MDB_DATASET",
    "D-021 World Bank·ADB 공개 Dataset",
    Boolean(
      mdbDataset &&
        mdbDataset.elementId === "D-021" &&
        mdbDataset.publicationStatus === "published" &&
        isDatasetPubliclyVisible(mdbDataset) &&
        isDatasetDownloadable(mdbDataset) &&
        mdbDataset.countries.length === 10
    ),
    "10개 우선국 · 국가별 CSV/JSON 다운로드 · World Bank와 ADB 원천을 기관별로 구분"
  );
  addCountCheck(
    checks,
    "v113 ODA·MDB",
    "V113_ACQUISITION_SOURCES",
    "공식 수집 원천",
    ACQUISITION_SOURCES_V76.length,
    EXPECTED.acquisitionSourcesV113
  );
  const adbConfiguredCountriesV113 = PRIORITY_COUNTRIES.filter((country) =>
    Boolean(getAdbIatiSourceUrlV113(country.iso3))
  ).length;
  const egyptHasNoAdbRoute = !getAdbIatiSourceUrlV113("EGY");
  addBooleanCheck(
    checks,
    "v113 ODA·MDB",
    "V113_ADB_SCOPE",
    "ADB 적용국·비적용국 구분",
    adbConfiguredCountriesV113 === EXPECTED.adbConfiguredCountriesV113 &&
      egyptHasNoAdbRoute,
    `ADB 연결 ${adbConfiguredCountriesV113}/9 · 이집트 대상지역 아님`
  );

  let oecdOdaLiveV113 = false;
  let worldBankProjectsLiveV113 = false;
  let adbProjectsLiveV113 = false;
  try {
    onProgress?.("v113 OECD ODA 실시간 경로 확인 · 베트남");
    const oda = await fetchOecdOdaCountryV113("VNM");
    oecdOdaLiveV113 =
      oda.disbursements.length > 0 || oda.commitments.length > 0;
  } catch {
    oecdOdaLiveV113 = false;
  }
  addBooleanCheck(
    checks,
    "v113 외부 운영성",
    "V113_OECD_LIVE",
    "OECD ODA 실시간 조회",
    oecdOdaLiveV113,
    "외부 API 장애는 공개 코드 P0가 아닌 운영 확인항목",
    true
  );

  try {
    onProgress?.("v113 World Bank·ADB 프로젝트 실시간 경로 확인 · 베트남");
    const portfolio = await fetchMdbCountryPortfolioV113("VNM");
    worldBankProjectsLiveV113 = portfolio.worldBank.length > 0;
    adbProjectsLiveV113 =
      portfolio.adbCoverage === "covered" && portfolio.adb.length > 0;
  } catch {
    worldBankProjectsLiveV113 = false;
    adbProjectsLiveV113 = false;
  }
  addBooleanCheck(
    checks,
    "v113 외부 운영성",
    "V113_WORLD_BANK_PROJECTS_LIVE",
    "World Bank 프로젝트 실시간 조회",
    worldBankProjectsLiveV113,
    "외부 Projects API 장애는 운영 확인항목",
    true
  );
  addBooleanCheck(
    checks,
    "v113 외부 운영성",
    "V113_ADB_PROJECTS_LIVE",
    "ADB IATI 프로젝트 실시간 조회",
    adbProjectsLiveV113,
    "브라우저 CORS·ADB 응답상태에 따라 일시 실패할 수 있으며 원자료 링크는 유지",
    true
  );

  onProgress?.("World Bank 19개 지표 · 구성과 외부 가용성 확인");
  const worldBank = await auditWorldBankV1122(onProgress);
  addCountCheck(
    checks,
    "World Bank 운영성",
    "WB_CONFIGURED",
    "World Bank 지표 구성",
    worldBank.configured,
    EXPECTED.worldBankIndicators
  );

  if (worldBank.unavailable > 0) {
    checks.push({
      section: "World Bank 운영성",
      status: "WARN",
      code: "WB_EXTERNAL_AVAILABILITY",
      label: "World Bank 외부 API 시점별 가용성",
      actual: `live ${worldBank.liveOk}/${worldBank.configured} · snapshot ${worldBank.snapshotOk}/${worldBank.configured}`,
      expected: "외부 API 정상 시 19/19 · 저장본은 Web Sandbox에서 선택 보강",
      note: `외부 의존성 상태는 릴리스 코드 P0로 판정하지 않음 · 현재 미확인: ${worldBank.failedIndicatorIds.join(
        ", "
      )}`,
    });
  } else {
    checks.push({
      section: "World Bank 운영성",
      status: worldBank.snapshotOk === worldBank.configured ? "PASS" : "WARN",
      code: "WB_RESILIENCE",
      label: "World Bank 운영 경로",
      actual: `live ${worldBank.liveOk}/${worldBank.configured} · snapshot ${worldBank.snapshotOk}/${worldBank.configured}`,
      expected: "모든 지표가 live 또는 snapshot 중 최소 1개 경로 보유",
      note:
        worldBank.snapshotOk < worldBank.configured
          ? "Web Sandbox에서는 Node로 snapshot을 생성할 수 없으므로 live API가 정상인 경우 진행 가능. 저장본은 배포 전 별도 자동화/업로드 단계에서 보강"
          : "live API 장애 시에도 정적 snapshot fallback 가능",
    });
  }

  const p0 = checks.filter((check) => check.status === "FAIL").length;
  const p1 = checks.filter((check) => check.status === "WARN").length;
  const overall = p0 > 0 ? "BLOCKED" : p1 > 0 ? "CONDITIONALLY_READY" : "READY";

  const result: WebSandboxQaResultV1122 = {
    schemaVersion: "v113",
    generatedAt: new Date().toISOString(),
    overall,
    p0,
    p1,
    checks,
    facts: {
      datasets: DATASETS.length,
      publicDatasets: publicDatasets.length,
      publishedDatasets: publishedDatasets.length,
      policyRecordsV109: COOPERATION_POLICY_EVIDENCE_V109.length,
      tnaProfilesV110: TNA_COUNTRY_PROFILES_V110.length,
      tnaTechnologyRecordsV110: countTnaTechnologyRecordsV110(),
      tnaMappedRecordsV110: countTnaMappedRecordsV110(),
      tnaProjectIdeasV110: tnaProjectIdeas,
      currentnessRecordsV111: TNA_CURRENTNESS_EVIDENCE_V111.length,
      gcfMatchedTnaRecordsV111: gcfMatchedTnaRecords,
      gcfRecordProjectLinksV111: gcfRecordProjectLinks,
      uniqueGcfProjectsV111: uniqueGcfProjects.size,
      supportRecordsV112: INTERNATIONAL_SUPPORT_RECORDS_V112.length,
      ctcnRecordsV112: ctcnRecords.length,
      adaptationFundRecordsV112: afRecords.length,
      gefRecordsV112: gefRecords.length,
      acquisitionSourcesV113: ACQUISITION_SOURCES_V76.length,
      adbConfiguredCountriesV113,
      oecdOdaLiveV113,
      worldBankProjectsLiveV113,
      adbProjectsLiveV113,
      worldBank,
    },
  };

  if (typeof window !== "undefined") {
    (
      window as typeof window & {
        __LDC_WEB_SANDBOX_QA_V113__?: WebSandboxQaResultV1122;
      }
    ).__LDC_WEB_SANDBOX_QA_V113__ = result;
  }

  return result;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getStatusLabel(status: WebSandboxQaStatusV1122): string {
  if (status === "PASS") return "통과";
  if (status === "WARN") return "확인";
  return "차단";
}

function getOverallLabel(overall: WebSandboxQaResultV1122["overall"]): string {
  if (overall === "READY") return "릴리스 기준 통과";
  if (overall === "CONDITIONALLY_READY")
    return "핵심 기준 통과 · 확인항목 있음";
  return "수정 후 재검사 필요";
}

function qaStyle(): string {
  return `
    :root { color-scheme: light; font-family: Inter, Pretendard, "Noto Sans KR", Arial, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #f4f7f6; color: #10231d; }
    .qa-shell { max-width: 1320px; margin: 0 auto; padding: 28px 22px 56px; }
    .qa-top { display: flex; gap: 18px; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
    .qa-eyebrow { display: inline-block; font-size: 12px; font-weight: 800; letter-spacing: .08em; color: #2f6b57; margin-bottom: 7px; }
    .qa-title { margin: 0; font-size: clamp(24px, 3vw, 36px); line-height: 1.2; }
    .qa-desc { margin: 8px 0 0; max-width: 800px; color: #52645f; line-height: 1.6; }
    .qa-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .qa-button { border: 1px solid #c8d6d1; background: #fff; color: #173d30; border-radius: 9px; padding: 10px 13px; font-weight: 700; cursor: pointer; }
    .qa-button.primary { background: #145d45; border-color: #145d45; color: white; }
    .qa-banner { border-radius: 14px; padding: 18px 20px; margin: 18px 0; border: 1px solid; }
    .qa-banner.ready { background: #edf8f2; border-color: #a9d3bd; }
    .qa-banner.warn { background: #fff8e8; border-color: #ead29a; }
    .qa-banner.fail { background: #fff0ef; border-color: #e5b5b0; }
    .qa-banner strong { display: block; font-size: 19px; margin-bottom: 4px; }
    .qa-progress { margin-top: 6px; color: #687a74; font-size: 13px; }
    .qa-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin: 18px 0 24px; }
    .qa-fact { background: white; border: 1px solid #dce5e1; border-radius: 12px; padding: 14px; }
    .qa-fact span { display: block; color: #687a74; font-size: 12px; margin-bottom: 5px; }
    .qa-fact strong { font-size: 22px; }
    .qa-table-wrap { background: #fff; border: 1px solid #dce5e1; border-radius: 14px; overflow: auto; }
    table { border-collapse: collapse; width: 100%; min-width: 900px; }
    th, td { text-align: left; padding: 11px 12px; border-bottom: 1px solid #edf1ef; vertical-align: top; font-size: 13px; }
    th { position: sticky; top: 0; background: #f9fbfa; color: #4d625b; z-index: 1; }
    tr:last-child td { border-bottom: none; }
    .qa-status { display: inline-flex; min-width: 48px; justify-content: center; border-radius: 999px; padding: 4px 8px; font-weight: 800; font-size: 11px; }
    .qa-status.PASS { background: #e6f5ed; color: #16633f; }
    .qa-status.WARN { background: #fff2ce; color: #8a5b00; }
    .qa-status.FAIL { background: #ffe4e2; color: #a12c24; }
    .qa-note { color: #64756f; line-height: 1.45; max-width: 420px; }
    .qa-section { font-weight: 800; color: #284c40; white-space: nowrap; }
    .qa-footer-note { margin-top: 14px; color: #6a7c76; font-size: 12px; line-height: 1.55; }
    @media (max-width: 760px) { .qa-top { flex-direction: column; } .qa-actions { justify-content: flex-start; } }
  `;
}

function buildQaHtml(
  result: WebSandboxQaResultV1122 | null,
  progress: string,
  error: string | null
): string {
  const appUrl = new URL(window.location.href);
  appUrl.searchParams.delete("qa");
  const bannerClass = !result
    ? "warn"
    : result.overall === "READY"
    ? "ready"
    : result.overall === "CONDITIONALLY_READY"
    ? "warn"
    : "fail";

  const resultContent = result
    ? `
      <div class="qa-banner ${bannerClass}">
        <strong>${escapeHtml(getOverallLabel(result.overall))}</strong>
        <span>P0 ${result.p0} · P1 ${result.p1} · ${escapeHtml(
        new Date(result.generatedAt).toLocaleString("ko-KR")
      )}</span>
      </div>
      <div class="qa-facts">
        <div class="qa-fact"><span>Dataset</span><strong>${
          result.facts.datasets
        }</strong></div>
        <div class="qa-fact"><span>TNA 우선기술</span><strong>${
          result.facts.tnaTechnologyRecordsV110
        }</strong></div>
        <div class="qa-fact"><span>TNA 기술매핑</span><strong>${
          result.facts.tnaMappedRecordsV110
        }</strong></div>
        <div class="qa-fact"><span>현재성 판정</span><strong>${
          result.facts.currentnessRecordsV111
        }</strong></div>
        <div class="qa-fact"><span>국제지원 레코드</span><strong>${
          result.facts.supportRecordsV112
        }</strong></div>
        <div class="qa-fact"><span>ODA 실시간</span><strong>${
          result.facts.oecdOdaLiveV113 ? "정상" : "확인"
        }</strong></div>
        <div class="qa-fact"><span>WB 프로젝트</span><strong>${
          result.facts.worldBankProjectsLiveV113 ? "정상" : "확인"
        }</strong></div>
        <div class="qa-fact"><span>ADB 프로젝트</span><strong>${
          result.facts.adbProjectsLiveV113 ? "정상" : "확인"
        }</strong></div>
        <div class="qa-fact"><span>World Bank live</span><strong>${
          result.facts.worldBank.liveOk
        }/${result.facts.worldBank.configured}</strong></div>
        <div class="qa-fact"><span>World Bank snapshot</span><strong>${
          result.facts.worldBank.snapshotOk
        }/${result.facts.worldBank.configured}</strong></div>
      </div>
      <div class="qa-table-wrap">
        <table>
          <thead><tr><th>구분</th><th>상태</th><th>검사항목</th><th>현재</th><th>기준</th><th>비고</th></tr></thead>
          <tbody>
            ${result.checks
              .map(
                (check) => `
                <tr>
                  <td class="qa-section">${escapeHtml(check.section)}</td>
                  <td><span class="qa-status ${check.status}">${escapeHtml(
                  getStatusLabel(check.status)
                )}</span></td>
                  <td><strong>${escapeHtml(
                    check.label
                  )}</strong><br><small>${escapeHtml(check.code)}</small></td>
                  <td>${escapeHtml(check.actual)}</td>
                  <td>${escapeHtml(check.expected)}</td>
                  <td class="qa-note">${escapeHtml(check.note ?? "-")}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <p class="qa-footer-note">이 화면은 Web Sandbox용 내부 QA입니다. 공개 메뉴에는 노출하지 않으며 URL의 <strong>?qa=1</strong>로만 접근합니다. Node 기반 기존 감사 스크립트는 향후 CI/Devbox용으로 유지하며 v113 외부 원천 장애는 WARN으로 분리합니다.</p>
    `
    : `
      <div class="qa-banner ${bannerClass}">
        <strong>${error ? "검사 실행 중 오류" : "브라우저에서 검사 중"}</strong>
        <span>${escapeHtml(error ?? progress)}</span>
        <div class="qa-progress">${escapeHtml(progress)}</div>
      </div>`;

  return `
    <style>${qaStyle()}</style>
    <div class="qa-shell">
      <div class="qa-top">
        <div>
          <span class="qa-eyebrow">INTERNAL QA · WEB SANDBOX</span>
          <h1 class="qa-title">개도국 전략지도 릴리스 점검 v113</h1>
          <p class="qa-desc">Terminal 없이 현재 브라우저 Preview에서 v109~v113 데이터 기준선, D-011 OECD ODA, D-021 World Bank·ADB 프로젝트와 기존 운영 경로를 점검합니다.</p>
        </div>
        <div class="qa-actions">
          <button id="qa-rerun" class="qa-button primary" type="button">검사 다시 실행</button>
          <button id="qa-download" class="qa-button" type="button" ${
            result ? "" : "disabled"
          }>결과 JSON 저장</button>
          <a class="qa-button" href="${escapeHtml(
            appUrl.toString()
          )}">플랫폼으로 돌아가기</a>
        </div>
      </div>
      ${resultContent}
    </div>`;
}

function downloadResult(result: WebSandboxQaResultV1122): void {
  const blob = new Blob([`${JSON.stringify(result, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ldc-web-sandbox-qa-v113-${new Date()
    .toISOString()
    .replace(/:/g, "-")}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function isWebSandboxQaRequestedV1122(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get("qa") === "1";
}

export async function mountWebSandboxQaV1122(root: HTMLElement): Promise<void> {
  let currentResult: WebSandboxQaResultV1122 | null = null;
  let running = false;

  const render = (
    progress = "검사를 준비하고 있습니다",
    error: string | null = null
  ) => {
    root.innerHTML = buildQaHtml(currentResult, progress, error);
    const rerunButton = document.getElementById(
      "qa-rerun"
    ) as HTMLButtonElement | null;
    const downloadButton = document.getElementById(
      "qa-download"
    ) as HTMLButtonElement | null;
    if (rerunButton) {
      rerunButton.disabled = running;
      rerunButton.addEventListener("click", () => void execute());
    }
    if (downloadButton && currentResult) {
      downloadButton.addEventListener("click", () =>
        downloadResult(currentResult!)
      );
    }
  };

  const execute = async () => {
    if (running) return;
    running = true;
    currentResult = null;
    render("검사를 시작합니다");
    try {
      currentResult = await runWebSandboxFinalizationV1122((message) => {
        render(message);
      });
      render("검사가 완료되었습니다");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "알 수 없는 검사 오류";
      render("검사가 중단되었습니다", message);
    } finally {
      running = false;
      render(
        currentResult ? "검사가 완료되었습니다" : "검사 결과를 확인하세요"
      );
    }
  };

  render();
  await execute();
}
