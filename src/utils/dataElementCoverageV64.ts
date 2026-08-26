import type { Dataset } from "../types/dataset";

export type ElementCoverageStatus = "full" | "partial" | "pending";
export type CoverageItemStatus = "provided" | "derived" | "pending";

export interface ElementCoverageItem {
  key: string;
  label: string;
  status: CoverageItemStatus;
  datasetIds?: string[];
  note?: string;
}

export interface ElementCoverageDefinition {
  status: ElementCoverageStatus;
  items: ElementCoverageItem[];
  note?: string;
}

const FULL_IF_LINKED = new Set(["A-007", "A-019", "A-021"]);

const PARTIAL_IF_LINKED = new Set([
  "A-020",
  "B-006",
  "B-041",
  "C-001",
  "C-002",
  "C-003",
  "C-004",
  "C-005",
  "D-018",
  "D-019",
  "D-020",
  "D-011",
  "D-021",
  "D-023",
  "E-003",
]);

const DEFINITIONS: Record<string, Omit<ElementCoverageDefinition, "status">> = {
  "A-020": {
    items: [
      {
        key: "share",
        label: "재생에너지 전력 비중",
        status: "provided",
        datasetIds: ["LDC-DS-D-004"],
      },
      {
        key: "trend",
        label: "최근 추세",
        status: "derived",
        datasetIds: ["LDC-DS-D-004"],
        note: "연도별 원값에서 계산",
      },
      {
        key: "mix",
        label: "전원구성",
        status: "pending",
        note: "전원별 발전량·비중 자료 필요",
      },
    ],
  },
  "B-006": {
    items: [
      { key: "tx35", label: "폭염일수 TX35", status: "pending" },
      { key: "tx40", label: "폭염일수 TX40", status: "pending" },
      { key: "tr20", label: "열대야 TR20", status: "pending" },
      { key: "tr25", label: "열대야 TR25", status: "pending" },
      {
        key: "hi35",
        label: "Heat Index HI35",
        status: "provided",
        datasetIds: ["LDC-DS-B-001"],
        note: "2040–2059 · SSP3-7.0",
      },
    ],
    note: "현재 HI35만 연결되어 있으며 TX35·TX40·TR20·TR25는 별도 자료가 필요",
  },
  "B-007": {
    items: [
      { key: "rx1day", label: "최대 1일 강수 RX1day", status: "pending" },
      { key: "rx5day", label: "최대 5일 강수 RX5day", status: "pending" },
      { key: "r20", label: "호우일수 R20mm", status: "pending" },
      { key: "r50", label: "호우일수 R50mm", status: "pending" },
      { key: "cwd", label: "연속 습윤일수 CWD", status: "pending" },
    ],
    note: "홍수 취약성 자료는 극한강수 지수와 다른 데이터이므로 이 항목의 제공자료로 계산하지 않음",
  },
  "B-041": {
    items: [
      {
        key: "ghi",
        label: "GHI",
        status: "provided",
        datasetIds: ["LDC-DS-B-004"],
      },
      { key: "dni", label: "DNI", status: "pending" },
      {
        key: "pvout",
        label: "PVOUT",
        status: "provided",
        datasetIds: ["LDC-DS-B-002"],
      },
      {
        key: "spatial",
        label: "지역별 분포",
        status: "derived",
        datasetIds: ["LDC-DS-B-002", "LDC-DS-B-004"],
      },
    ],
    note: "GHI·PVOUT은 제공 중이며 DNI는 준비 중",
  },
  "C-001": {
    items: [
      {
        key: "submission",
        label: "NDC 제출 이력",
        status: "provided",
        datasetIds: ["LDC-DS-C-001"],
      },
      {
        key: "technology",
        label: "기술 우선분야·원문 근거",
        status: "provided",
        datasetIds: ["LDC-DS-C-001"],
      },
      { key: "targets", label: "무조건부·조건부 감축목표", status: "pending" },
      { key: "sector", label: "부문별 감축수단", status: "pending" },
      { key: "adaptation", label: "적응 목표", status: "pending" },
      { key: "finance", label: "재원 소요", status: "pending" },
    ],
    note: "현재 연결 NDC 자료는 기술 우선분야·원문 근거 중심",
  },
  "C-002": {
    items: [
      {
        key: "submission",
        label: "BTR 제출여부·제출일",
        status: "provided",
        datasetIds: ["LDC-DS-C-002-BTR"],
      },
      {
        key: "document",
        label: "공식 제출목록·원문 경로",
        status: "provided",
        datasetIds: ["LDC-DS-C-002-BTR"],
      },
      { key: "ghg", label: "GHG·부문별 배출 시계열", status: "pending" },
      { key: "progress", label: "NDC 이행·감축성과", status: "pending" },
      {
        key: "support",
        label: "재정·기술·역량개발 지원 필요·수혜",
        status: "pending",
      },
    ],
    note: "현재 BTR 제출·문서 기본정보를 제공하며 문서 내 수치와 세부 근거는 확인되는 자료부터 순차적으로 제공합니다",
  },
  "C-003": {
    items: [
      {
        key: "submission",
        label: "NAP 제출·문서 현황",
        status: "provided",
        datasetIds: ["LDC-DS-C-003-NAP"],
      },
      {
        key: "document",
        label: "공식 문서 링크",
        status: "provided",
        datasetIds: ["LDC-DS-C-003-NAP"],
      },
      { key: "vulnerability", label: "취약부문·위험", status: "pending" },
      { key: "actions", label: "우선 적응조치·기술", status: "pending" },
      { key: "finance", label: "투자수요·거버넌스·M&E", status: "pending" },
    ],
    note: "현재 NAP 제출·문서 기본정보를 제공하며 우선조치·재원은 확인되는 자료부터 순차적으로 제공합니다",
  },
  "C-004": {
    items: [
      {
        key: "submission",
        label: "LT-LEDS current submission",
        status: "provided",
        datasetIds: ["LDC-DS-C-004-LTLEDS"],
      },
      {
        key: "document",
        label: "공식 문서·제출시점",
        status: "provided",
        datasetIds: ["LDC-DS-C-004-LTLEDS"],
      },
      { key: "pathway", label: "장기 배출경로·넷제로 목표", status: "pending" },
      {
        key: "technology",
        label: "부문별 전환경로·핵심기술",
        status: "pending",
      },
      { key: "investment", label: "장기 투자수요", status: "pending" },
    ],
    note: "현재 LT-LEDS 제출·문서 기본정보를 제공하며 장기 경로와 기술정보는 확인되는 자료부터 순차적으로 제공합니다",
  },
  "C-005": {
    items: [
      {
        key: "report",
        label: "TNA/TAP 공식 문서현황",
        status: "provided",
        datasetIds: ["LDC-DS-C-005-TNA"],
      },
      {
        key: "year",
        label: "문서 연도·공식 Country Reports 경로",
        status: "provided",
        datasetIds: ["LDC-DS-C-005-TNA"],
      },
      {
        key: "technology",
        label: "감축·적응 우선기술·문서근거",
        status: "provided",
        datasetIds: ["LDC-DS-C-005-TNA"],
        note: "TNA/TAP 상세자료 7개국",
      },
      {
        key: "mapping",
        label: "관련 기후기술",
        status: "provided",
        datasetIds: ["LDC-DS-C-005-TNA"],
        note: "관련성이 확인되는 기술만 표시",
      },
      {
        key: "barrier",
        label: "기술이전 장벽·이행여건",
        status: "provided",
        datasetIds: ["LDC-DS-C-005-TNA"],
        note: "공식 문서에서 확인된 장벽 제공",
      },
      {
        key: "tap",
        label: "TAP·사업 아이디어·이행정보",
        status: "provided",
        datasetIds: ["LDC-DS-C-005-TNA"],
        note: "공식 문서에 명시된 항목 제공",
      },
      {
        key: "remaining",
        label: "인도·말레이시아·이집트 상세자료",
        status: "pending",
      },
    ],
    note: "현재 7개국의 TNA/TAP 상세자료를 제공하며 작성 시점이 오래된 자료는 최신 NDC·NAP·BTR과 함께 확인해야 합니다",
  },
  "D-018": {
    items: [
      {
        key: "project",
        label: "프로젝트명·국가",
        status: "provided",
        datasetIds: ["LDC-DS-D-018-AF"],
      },
      {
        key: "finance",
        label: "승인 금액",
        status: "provided",
        datasetIds: ["LDC-DS-D-018-AF"],
      },
      {
        key: "status",
        label: "사업 상태",
        status: "provided",
        datasetIds: ["LDC-DS-D-018-AF"],
      },
      {
        key: "agency",
        label: "실행기관·NIE/MIE 구분",
        status: "pending",
        note: "현재 수록 사업 외 추가 자료는 순차적으로 보강",
      },
      {
        key: "technology",
        label: "관련 기후기술",
        status: "derived",
        datasetIds: ["LDC-DS-D-018-AF"],
        note: "공식 사업문서에서 기술내용을 확인한 경우만 매핑",
      },
      { key: "beneficiary", label: "수혜자 수", status: "pending" },
      { key: "period", label: "사업기간", status: "pending" },
    ],
    note: "우선 10개국의 Adaptation Fund 공식 국가 페이지를 기준으로 제공하며 관련 기후기술은 사업 상세자료에서 확인되는 경우 표시",
  },
  "D-019": {
    items: [
      {
        key: "request",
        label: "CTCN 기술지원 요청",
        status: "provided",
        datasetIds: ["LDC-DS-D-019-CTCN"],
      },
      {
        key: "phase",
        label: "공개 단계·상태",
        status: "provided",
        datasetIds: ["LDC-DS-D-019-CTCN"],
      },
      {
        key: "country-count",
        label: "공개 기술지원 건수",
        status: "provided",
        datasetIds: ["LDC-DS-D-019-CTCN"],
      },
      {
        key: "technology",
        label: "관련 기후기술",
        status: "provided",
        datasetIds: ["LDC-DS-D-019-CTCN"],
      },
      {
        key: "budget",
        label: "공개 예산",
        status: "provided",
        datasetIds: ["LDC-DS-D-019-CTCN"],
        note: "공식 원문에서 확인 가능한 일부 사례만 표시",
      },
      { key: "nde", label: "NDE 기관", status: "pending" },
      { key: "result", label: "TA 결과·후속재원", status: "pending" },
    ],
    note: "국가별 건수가 별도로 표시되지 않는 경우 0건으로 해석하지 않으며 상세사업은 현재 플랫폼 수록 범위",
  },
  "D-020": {
    items: [
      {
        key: "project",
        label: "프로젝트명·번호",
        status: "provided",
        datasetIds: ["LDC-PILOT-D-020-GCF-PROJECTS"],
      },
      {
        key: "agency",
        label: "인가·시행기관",
        status: "provided",
        datasetIds: ["LDC-PILOT-D-020-GCF-PROJECTS"],
      },
      {
        key: "finance",
        label: "GCF 승인재원",
        status: "provided",
        datasetIds: ["LDC-PILOT-D-020-GCF-PROJECTS"],
      },
      {
        key: "region",
        label: "대상지역·기간·상태",
        status: "provided",
        datasetIds: ["LDC-PILOT-D-020-GCF-PROJECTS"],
      },
      { key: "cofinance", label: "공동재원", status: "pending" },
      { key: "result", label: "결과영역", status: "pending" },
      { key: "approval", label: "이사회 승인일", status: "pending" },
      { key: "impact", label: "수혜자·예상 감축량", status: "pending" },
    ],
  },
  "D-011": {
    items: [
      {
        key: "disbursement",
        label: "ODA 실제 지출",
        status: "provided",
        datasetIds: ["LDC-DS-D-011-OECD-ODA"],
      },
      {
        key: "commitment",
        label: "ODA 약정",
        status: "provided",
        datasetIds: ["LDC-DS-D-011-OECD-ODA"],
      },
      {
        key: "donor",
        label: "주요 공여기관",
        status: "provided",
        datasetIds: ["LDC-DS-D-011-OECD-ODA"],
      },
      {
        key: "trend",
        label: "최근 5년 추세",
        status: "derived",
        datasetIds: ["LDC-DS-D-011-OECD-ODA"],
        note: "OECD 연도별 실제 지출 원값에서 표시",
      },
      {
        key: "provider-group",
        label: "공여기관군 구성",
        status: "provided",
        datasetIds: ["LDC-DS-D-011-OECD-ODA"],
      },
      {
        key: "sector",
        label: "분야별 ODA",
        status: "pending",
        note: "CRS 활동단위 자료를 후속 연결해야 함",
      },
    ],
    note: "DAC2A 실제 지출과 DAC3A 약정을 구분해 제공하며 분야별 활동분석은 후속 CRS 연결 대상",
  },
  "D-021": {
    items: [
      {
        key: "project",
        label: "프로젝트명·ID",
        status: "provided",
        datasetIds: ["LDC-DS-D-002"],
      },
      {
        key: "organization",
        label: "공여·금융기관",
        status: "provided",
        datasetIds: ["LDC-DS-D-002"],
      },
      {
        key: "finance",
        label: "약정·승인금액 및 공개 지출액",
        status: "provided",
        datasetIds: ["LDC-DS-D-002"],
        note: "기관별 원래 금융개념을 유지하고 서로 합산하지 않음",
      },
      {
        key: "agency",
        label: "시행기관",
        status: "provided",
        datasetIds: ["LDC-DS-D-002"],
      },
      {
        key: "sector",
        label: "원천기관 분야",
        status: "provided",
        datasetIds: ["LDC-DS-D-002"],
      },
      {
        key: "period",
        label: "승인·종료일",
        status: "provided",
        datasetIds: ["LDC-DS-D-002"],
      },
      {
        key: "status",
        label: "사업상태",
        status: "provided",
        datasetIds: ["LDC-DS-D-002"],
      },
      { key: "dac", label: "OECD DAC 목적코드", status: "pending" },
      { key: "rio", label: "Rio Marker", status: "pending" },
    ],
    note: "World Bank Projects API와 ADB IATI의 진행·준비 사업을 제공하며 DAC 목적코드·Rio Marker는 후속 CRS/IATI 정합화 대상",
  },
  "D-023": {
    items: [
      {
        key: "gcf-project",
        label: "GCF Funded Activity",
        status: "provided",
        datasetIds: ["LDC-DS-E-002"],
      },
      {
        key: "gcf-finance",
        label: "GCF 승인재원",
        status: "provided",
        datasetIds: ["LDC-DS-E-002"],
      },
      {
        key: "readiness",
        label: "GCF Readiness 지원·재원",
        status: "provided",
        datasetIds: ["LDC-DS-E-002"],
      },
      {
        key: "af",
        label: "Adaptation Fund 현재 사업·승인액",
        status: "provided",
        datasetIds: ["LDC-DS-E-002", "LDC-DS-D-018-AF"],
      },
      {
        key: "gef",
        label: "GEF 관련 사업",
        status: "provided",
        datasetIds: ["LDC-DS-E-002"],
        note: "현재 플랫폼에 수록된 관련 사업",
      },
      {
        key: "cofinance",
        label: "GEF 공동재원",
        status: "provided",
        datasetIds: ["LDC-DS-E-002"],
        note: "현재 수록된 GEF 사업의 공식 공동재원 제공",
      },
      { key: "cif", label: "CIF", status: "pending" },
      { key: "coinvest", label: "공동투자 참여형태", status: "pending" },
    ],
    note: "GCF·Adaptation Fund·GEF 사업을 기금별로 구분해 제공하며 다국가 사업 총액은 특정 국가의 배분액으로 표시하지 않습니다",
  },
  "E-003": {
    items: [
      {
        key: "org",
        label: "기관명·기관유형",
        status: "provided",
        datasetIds: ["LDC-PILOT-E-003-GCF-ORGS"],
      },
      {
        key: "role",
        label: "공식 역할·근거 URL",
        status: "provided",
        datasetIds: ["LDC-PILOT-E-003-GCF-ORGS"],
      },
      { key: "ministry", label: "소속부처", status: "pending" },
      { key: "person", label: "담당자·직함", status: "pending" },
      { key: "email", label: "이메일", status: "pending" },
      { key: "phone", label: "전화번호", status: "pending" },
    ],
  },
};

function datasetSet(datasets: Dataset[]): Set<string> {
  return new Set(datasets.map((dataset) => dataset.id));
}

export function getElementCoverageStatus(
  elementId: string,
  datasets: Dataset[]
): ElementCoverageStatus {
  if (datasets.length === 0) return "pending";
  if (FULL_IF_LINKED.has(elementId)) return "full";
  if (PARTIAL_IF_LINKED.has(elementId)) return "partial";

  if (
    datasets.every(
      (dataset) =>
        dataset.id.includes("EXAMPLE") || dataset.titleKo.includes("[예시]")
    )
  ) {
    return "pending";
  }

  return "full";
}

export function getElementCoverageDefinition(
  elementId: string,
  datasets: Dataset[]
): ElementCoverageDefinition | null {
  const base = DEFINITIONS[elementId];
  if (!base) return null;

  const ids = datasetSet(datasets);
  const items = base.items.map((item) => {
    if (!item.datasetIds || item.datasetIds.length === 0) return item;
    const linked = item.datasetIds.some((id) => ids.has(id));
    return linked ? item : { ...item, status: "pending" as CoverageItemStatus };
  });

  return {
    ...base,
    status: getElementCoverageStatus(elementId, datasets),
    items,
  };
}

export function getCoverageStatusLabel(status: ElementCoverageStatus): string {
  return status === "full"
    ? "제공 중"
    : status === "partial"
    ? "일부 제공"
    : "준비 중";
}
