import { CLIMATE_TECHNOLOGIES } from "../data/climateTechnologyCatalog";
import type {
  VietnamCatalogElementV121,
  VietnamEntityV121,
  VietnamIndicatorMetaV121,
  VietnamObservationV121,
} from "../data/vietnam/vietnamTypesV121";
import type { VietnamElementPublicStatusV124 } from "../data/vietnam/vietnamTypesV124";
import { publicEntityTitleV131 } from "../data/visualization/publicEntityTitleV131";

export const VIETNAM_PUBLIC_STATUS_LABEL_V121: Record<
  VietnamCatalogElementV121["publicStatus"],
  string
> = {
  actual: "실제 데이터",
  partial: "일부 자료 제공",
  "metadata-only": "출처정보 제공",
  "not-in-package": "현재 제공자료 없음",
};

export const VIETNAM_CATEGORY_LABEL_V121: Record<string, string> = {
  A: "국가 기본정보",
  B: "기후·환경·자원",
  C: "정책·제도",
  D: "사업·재원",
  E: "파트너·기술역량",
};

export const VIETNAM_PUBLIC_STATUS_LABEL_V124: Record<
  VietnamElementPublicStatusV124,
  string
> = {
  actual: "실제 데이터",
  partial: "부분 데이터",
  "public-authorized": "공개 승인 데이터",
  "schema-only": "입력 양식만 제공",
  "data-entry-planned": "입력 예정",
  "not-collected": "원자료 미수집",
  quarantined: "형식 검토 필요",
};

const FIELD_LABELS: Record<string, string> = {
  name: "명칭",
  projectName: "사업명",
  plantName: "발전소명",
  mineName: "광산명",
  organizationName: "기관명",
  orgName: "기관명",
  orgType: "기관 유형",
  orgCategory: "기관 유형",
  parentOrg: "소속 부처·상위기관",
  companyName: "기업명",
  supportingOrganization: "지원기관",
  title: "제목",
  plantId: "발전소 ID",
  capacityMw: "설비용량(MW)",
  capacityBand: "용량구간",
  fuelType: "발전원",
  fuelTypeRaw: "발전원 원문",
  commissioningYear: "준공연도",
  owner: "소유자",
  status: "상태",
  standard: "표준",
  technologyField: "기술분야",
  technologyMappingBasis: "기술분야 근거",
  mineral: "광종",
  regionName: "지역",
  disasterType: "재해유형",
  eventYear: "발생연도",
  deaths: "사망자",
  affectedPopulation: "피해인구",
  damageThousandUsd: "피해액(천 US$)",
  implementingEntity: "실행기관",
  accreditedEntity: "인가기관",
  sector: "분야",
  fund: "기금",
  approvedAmount: "승인액",
  approvedAmountNumeric: "승인액(수치)",
  disbursementAmount: "이전·집행액 원문",
  disbursedAmount: "이전·집행액",
  commitmentAmount: "약정액",
  primaryFinanceAmount: "원자료 대표 금융값",
  projectPeriod: "기간",
  approvalDate: "승인일",
  sourceUrl: "공식 링크",
  recordSourceUrl: "레코드 출처",
  websiteUrl: "웹사이트",
  city: "도시",
  address: "주소",
  officeAddress: "사무소 주소",
  officeProgram: "사무소·프로그램",
  focalPointName: "담당자명",
  focalPointTitle: "직함",
  personName: "담당자명",
  contactName: "담당자명",
  contactType: "담당자 구분",
  email: "이메일",
  emailAlt: "이메일 2",
  phone: "전화번호",
  telephone: "전화번호",
  fax: "팩스",
  contact: "연락처",
  agreementType: "협정 유형",
  signedDate: "체결일",
  scope: "대상 분야",
  supportType: "지원 유형",
  eligibleRecipients: "지원 대상",
  budgetScale: "예산 규모",
  supportLimit: "지원 한도",
  applicationPeriod: "신청 시기",
  vietnamAllocation: "베트남 귀속액",
  referenceYear: "자료연도",
  sourceFirstLatitude: "원천 첫 위도",
  sourceFirstLongitude: "원천 첫 경도",
  sourceCoordinateCandidates: "원천 다중좌표",
  recordSource: "레코드 출처",
  coordinateSource: "좌표 출처",
};

const TEMPLATE_PREFERRED_FIELDS: Record<string, string[]> = {
  spatial: [
    "name",
    "plantName",
    "mineName",
    "fuelType",
    "capacityMw",
    "capacityBand",
    "mineral",
    "regionName",
    "status",
    "commissioningYear",
    "owner",
  ],
  entity: [
    "name",
    "title",
    "organizationName",
    "companyName",
    "technologyField",
    "status",
    "regionName",
    "sourceUrl",
  ],
  project: [
    "projectName",
    "fund",
    "implementingEntity",
    "accreditedEntity",
    "sector",
    "status",
    "projectPeriod",
    "approvalDate",
    "approvedAmount",
    "disbursedAmount",
    "commitmentAmount",
    "sourceUrl",
  ],
  finance: [
    "projectName",
    "fund",
    "implementingEntity",
    "accreditedEntity",
    "sector",
    "status",
    "approvedAmount",
    "disbursedAmount",
    "commitmentAmount",
    "primaryFinanceAmount",
    "vietnamAllocation",
    "sourceUrl",
  ],
  partner: [
    "organizationName",
    "orgName",
    "name",
    "orgType",
    "orgCategory",
    "organizationType",
    "role",
    "city",
    "address",
    "officeAddress",
    "focalPointName",
    "personName",
    "focalPointTitle",
    "title",
    "email",
    "emailAlt",
    "phone",
    "contact",
    "technologyField",
    "websiteUrl",
    "website",
    "sourceUrl",
  ],
  policy: [
    "title",
    "name",
    "documentName",
    "version",
    "publicationDate",
    "sector",
    "status",
    "sourceUrl",
  ],
  "technology-demand": [
    "name",
    "technologyName",
    "track",
    "sector",
    "rank",
    "barrier",
    "projectIdea",
    "sourceUrl",
  ],
};

export function publicStatusLabelV121(
  status: VietnamCatalogElementV121["publicStatus"]
): string {
  return VIETNAM_PUBLIC_STATUS_LABEL_V121[status];
}

export function publicStatusLabelV124(
  status: VietnamElementPublicStatusV124
): string {
  return VIETNAM_PUBLIC_STATUS_LABEL_V124[status];
}

export function technologyLabelV121(id: string): string {
  const normalized = id.replace(/^CTIS-/i, "");
  const number = Number(normalized);
  if (Number.isInteger(number) && number >= 1 && number <= 38) {
    const item = CLIMATE_TECHNOLOGIES[number - 1];
    return item ? `${String(number).padStart(2, "0")} ${item.nameKo}` : id;
  }
  return id === "확인필요" ? "기술분야 확인 필요" : id;
}

export function fieldLabelV121(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key
    .replace(/^field_[a-f0-9]+$/i, "추가 원자료 필드")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function formatValueV121(value: unknown): string {
  if (value === null || value === undefined || value === "") return "자료 없음";
  if (typeof value === "number") {
    return new Intl.NumberFormat("ko-KR", {
      maximumFractionDigits: 4,
    }).format(value);
  }
  if (typeof value === "boolean") return value ? "예" : "아니요";
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "object" ? JSON.stringify(item) : String(item)
      )
      .join(" · ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function isHttpUrlV121(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

export function entityDisplayNameV121(entity: VietnamEntityV121): string {
  return publicEntityTitleV131(entity);
}

export function entityColumnsV121(
  records: VietnamEntityV121[],
  template: string,
  limit = 8
): string[] {
  const counts = new Map<string, number>();
  records.slice(0, 400).forEach((record) => {
    Object.entries(record.normalizedAttributes || {}).forEach(
      ([key, value]) => {
        if (value === null || value === undefined || value === "") return;
        if (key === "sourceCoordinateCandidates") return;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    );
  });
  const preferred =
    TEMPLATE_PREFERRED_FIELDS[template] || TEMPLATE_PREFERRED_FIELDS.entity;
  const result: string[] = [];
  preferred.forEach((key) => {
    if (counts.has(key) && !result.includes(key)) result.push(key);
  });
  Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .forEach(([key]) => {
      if (!result.includes(key)) result.push(key);
    });
  return result.slice(0, limit);
}

export function latestObservationV121(
  observations: VietnamObservationV121[],
  indicatorId?: string | null
): VietnamObservationV121 | null {
  const filtered = indicatorId
    ? observations.filter((row) => row.indicatorId === indicatorId)
    : observations;
  return (
    filtered
      .filter((row) => row.value !== null)
      .sort((a, b) => (b.year || -Infinity) - (a.year || -Infinity))[0] || null
  );
}

export function observationSearchTextV121(
  row: VietnamObservationV121,
  meta?: VietnamIndicatorMetaV121
): string {
  return [
    meta?.labelKo,
    row.year,
    row.period,
    row.value,
    row.unit,
    row.note,
    row.provenance.sourceOrg,
    row.provenance.sourceUrl,
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLocaleLowerCase("ko-KR");
}

export function entitySearchTextV121(row: VietnamEntityV121): string {
  return [
    entityDisplayNameV121(row),
    JSON.stringify(row.normalizedAttributes || {}),
    row.note,
    row.provenance.sourceOrg,
    row.provenance.sourceUrl,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ko-KR");
}

export function publicFileSlugV121(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ko-KR")
    .replace(/[^0-9a-z가-힣]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
  return normalized || "vietnam-data";
}

function csvEscape(value: unknown): string {
  const text = formatValueForExportV121(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function formatValueForExportV121(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function observationsToCsvV121(
  rows: VietnamObservationV121[],
  metadataById: Map<string, VietnamIndicatorMetaV121>,
  elementLabel: string
): string {
  const headers = [
    "data_name",
    "indicator_name",
    "country_iso3",
    "year",
    "period",
    "value",
    "unit",
    "missing_reason_code",
    "note",
    "source_org",
    "source_url",
    "citation_locator",
    "license_code",
    "attribution_text",
  ];
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    const meta = metadataById.get(row.indicatorId);
    lines.push(
      [
        elementLabel,
        meta?.labelKo,
        row.countryIso3,
        row.year,
        row.period,
        row.value,
        row.unit,
        row.missingReasonCode,
        row.note,
        row.provenance.sourceOrg,
        row.provenance.sourceUrl,
        row.provenance.citationLocator,
        row.provenance.licenseCode,
        meta?.attributionText,
      ]
        .map(csvEscape)
        .join(",")
    );
  });
  return `\uFEFF${lines.join("\n")}\n`;
}

export function entitiesToCsvV121(
  rows: VietnamEntityV121[],
  metadataById: Map<string, VietnamIndicatorMetaV121>,
  elementLabel: string
): string {
  const attributeKeys = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row.normalizedAttributes || {})))
  ).sort();
  const headers = [
    "data_name",
    "indicator_name",
    "country_iso3",
    "name",
    "latitude",
    "longitude",
    "geometry_type",
    "crs",
    ...attributeKeys,
    "raw_attributes_json",
    "missing_reason_code",
    "note",
    "source_org",
    "source_url",
    "citation_locator",
    "license_code",
    "attribution_text",
  ];
  const lines = [headers.map(csvEscape).join(",")];
  rows.forEach((row) => {
    const meta = row.indicatorId
      ? metadataById.get(row.indicatorId)
      : undefined;
    lines.push(
      [
        elementLabel,
        meta?.labelKo,
        row.countryIso3,
        entityDisplayNameV121(row),
        row.latitude,
        row.longitude,
        row.geometryType,
        row.crs,
        ...attributeKeys.map((key) => row.normalizedAttributes?.[key]),
        row.rawAttributes,
        row.missingReasonCode,
        row.note,
        row.provenance.sourceOrg,
        row.provenance.sourceUrl,
        row.provenance.citationLocator,
        row.provenance.licenseCode,
        meta?.attributionText,
      ]
        .map(csvEscape)
        .join(",")
    );
  });
  return `\uFEFF${lines.join("\n")}\n`;
}

export function triggerTextDownloadV121(
  filename: string,
  text: string,
  mime: string
): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadDateV121(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizedSearchV121(value: string): string {
  return value.normalize("NFC").trim().toLocaleLowerCase("ko-KR");
}
