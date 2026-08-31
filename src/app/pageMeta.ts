import type { View } from "./navigation";

const SERVICE_NAME = "개도국 기후기술 협력 플랫폼";
const DEFAULT_DESCRIPTION =
  "개도국의 기후·에너지·정책·사업·재원·기관·지역정보를 검색하고 지도·데이터 다운로드에서 활용";

interface PageMetaInput {
  view: View;
  datasetTitle?: string | null;
  countryIso3?: string | null;
}

export interface PageMeta {
  title: string;
  description: string;
}

export function getPageMeta({
  view,
  datasetTitle,
  countryIso3,
}: PageMetaInput): PageMeta {
  switch (view) {
    case "explorer":
      return {
        title: `데이터 찾기 | ${SERVICE_NAME}`,
        description: "국가·기후기술·주제·출처기관 기준으로 공개 근거자료 검색",
      };
    case "dataset-detail":
      return {
        title: `${datasetTitle ?? "데이터 상세"} | ${SERVICE_NAME}`,
        description: "실제 값·기준시점·출처·산정방법·이용조건·유의사항 확인",
      };
    case "element-detail":
      return {
        title: `데이터 항목 상세 | ${SERVICE_NAME}`,
        description:
          "152개 상위 데이터 항목의 국가별 값·근거·포함 데이터·출처·다운로드 확인",
      };
    case "map":
      return {
        title: `데이터 지도 | ${SERVICE_NAME}`,
        description:
          "공간표현이 가능한 기후·에너지·정책·사업·재원 자료를 지도에서 확인",
      };
    case "compare":
      return {
        title: `데이터 다운로드 | ${SERVICE_NAME}`,
        description:
          "과거 국가 비교 링크는 데이터 다운로드로 연결되며, 국가 비교는 각 데이터 상세에서 이용",
      };
    case "country":
      return {
        title: `${countryIso3 ?? "국가"} 프로필 | ${SERVICE_NAME}`,
        description:
          "선택 국가와 기후기술에 연결된 적용여건·정책·사업·기관·지역 근거 확인",
      };
    case "download":
      return {
        title: `데이터 다운로드 | ${SERVICE_NAME}`,
        description:
          "선택한 공개 데이터의 국가·기간·파일형식을 설정하여 재사용",
      };
    case "guide":
      return {
        title: `데이터 이용안내 | ${SERVICE_NAME}`,
        description:
          "베트남 파일럿 데이터의 제공 범위·상태·결측·이용조건·지도 정확도 안내",
      };
    case "insights":
      return {
        title: `협력 인사이트 | ${SERVICE_NAME}`,
        description:
          "국가×기후기술 기준으로 확인된 수요·적용여건·정책·사업·기관·지역 근거와 추가 확인사항 검토",
      };
    case "not-found":
      return {
        title: `페이지를 찾을 수 없음 | ${SERVICE_NAME}`,
        description: DEFAULT_DESCRIPTION,
      };
    default:
      return {
        title: SERVICE_NAME,
        description: DEFAULT_DESCRIPTION,
      };
  }
}

export function applyDocumentMeta(meta: PageMeta): void {
  document.title = meta.title;

  let description = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]'
  );

  if (!description) {
    description = document.createElement("meta");
    description.name = "description";
    document.head.appendChild(description);
  }

  description.content = meta.description;
}
