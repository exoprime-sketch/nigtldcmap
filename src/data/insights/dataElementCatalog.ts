import type {
  InsightDisplayType,
  InsightInterpretationLevel,
  InsightSection,
} from "../../types/cooperationInsight";

export interface DataElementCatalogItem {
  elementId: string;
  titleKo: string;

  category: "A" | "B" | "C" | "D" | "E";

  section: InsightSection;
  displayType: InsightDisplayType;
  interpretationLevel: InsightInterpretationLevel;

  technologyIds: string[];

  countryLevel: boolean;
  regionLevel: boolean;

  organizationData: boolean;
  projectData: boolean;
  financeData: boolean;

  useInOverview: boolean;
  useInRegion: boolean;
  useInPartnerProject: boolean;
  useInEvidence: boolean;

  comparableAcrossCountries: boolean;
  notes?: string;
}

/**
 * 최신 153개 데이터 항목을 등록하는 기준목록
 *
 * 주의
 * - 실제 값 저장 파일이 아님
 * - 각 데이터가 협력 인사이트의 어느 영역에 사용되는지 정의
 * - 기술과 직접 연결되지 않는 국가 공통자료는 technologyIds를 빈 배열로 유지
 */
export const DATA_ELEMENT_CATALOG: DataElementCatalogItem[] = [];
