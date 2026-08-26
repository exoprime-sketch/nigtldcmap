import type { Dataset, PublicationStatus } from "../types/dataset";

const PUBLIC_VISIBLE_STATUSES = new Set<PublicationStatus>([
  "published",
  "catalog_only",
]);

export interface DatasetStatusDisplay {
  label: string;
  title: string;
  description: string;
  className: string;
}

export function isDatasetPubliclyVisible(dataset: Dataset): boolean {
  if (!PUBLIC_VISIBLE_STATUSES.has(dataset.publicationStatus)) {
    return false;
  }

  /*
   * 공개 화면 방어선
   * - 예시 Dataset은 registry 필드가 잘못 변경되더라도 ID·제목 기준으로 한 번 더 차단
   * - synthetic / example / internal 상태는 공개 목록·검색·상세·다운로드에서 제외
   */
  if (
    dataset.id.startsWith("LDC-EXAMPLE") ||
    dataset.titleKo.trim().startsWith("[예시]") ||
    dataset.titleEn.trim().toLowerCase().startsWith("[example]")
  ) {
    return false;
  }

  if (
    dataset.isSynthetic === true ||
    dataset.sourceType === "synthetic_example" ||
    dataset.dataStatus === "synthetic_example" ||
    dataset.accessLevel === "example" ||
    dataset.accessLevel === "internal"
  ) {
    return false;
  }

  return true;
}

export function isDatasetDownloadable(dataset: Dataset): boolean {
  if (
    !isDatasetPubliclyVisible(dataset) ||
    dataset.publicationStatus !== "published" ||
    dataset.rightsStatus !== "allowed"
  ) {
    return false;
  }

  if (dataset.downloadMode === "generated") {
    const generatedDatasetIds = new Set([
      "LDC-DS-A-001",
      "LDC-DS-D-011-OECD-ODA",
      "LDC-DS-D-002",
    ]);
    return Boolean(dataset.indicatorId) || generatedDatasetIds.has(dataset.id);
  }

  if (dataset.downloadMode === "static_file") {
    return Boolean(dataset.resourceUrl);
  }

  return false;
}

export function isDatasetSourceLinkAvailable(dataset: Dataset): boolean {
  return (
    isDatasetPubliclyVisible(dataset) &&
    dataset.downloadMode === "source_link" &&
    Boolean(dataset.sourceUrl)
  );
}

export function datasetCoversCountry(
  dataset: Dataset,
  countryNameKo: string,
  countryNameEn?: string
): boolean {
  if (dataset.geographicCoverage === "global") return true;

  return dataset.countries.some(
    (name) => name === countryNameKo || name === countryNameEn
  );
}

export function getDatasetStatusDisplay(
  dataset: Dataset
): DatasetStatusDisplay {
  switch (dataset.publicationStatus) {
    case "published":
      return {
        label: "다운로드 가능",
        title: "플랫폼에서 이용",
        description: "이용조건 확인 후 데이터 파일 다운로드 가능",
        className: "allowed",
      };
    case "catalog_only":
      return {
        label: "원자료 확인",
        title: "원천기관에서 이용",
        description: "플랫폼에서 내용을 확인하고 원천기관의 공식 자료로 이동",
        className: "metadata_only",
      };
    case "restricted":
      return {
        label: "이용 제한",
        title: "이용 제한",
        description: "현재 공개 화면에서 제공하지 않는 자료",
        className: "restricted",
      };
    case "withdrawn":
      return {
        label: "제공 중단",
        title: "제공 중단",
        description: "현재 제공이 중단된 자료",
        className: "restricted",
      };
    default:
      return {
        label: "제공 준비 중",
        title: "제공 준비 중",
        description: "출처·품질·이용조건 확인 후 공개",
        className: "rights_unknown",
      };
  }
}

export function compareDatasetUpdatedAt(a: Dataset, b: Dataset): number {
  if (!a.updatedAt && !b.updatedAt) {
    return a.titleKo.localeCompare(b.titleKo, "ko");
  }
  if (!a.updatedAt) return 1;
  if (!b.updatedAt) return -1;
  return b.updatedAt.localeCompare(a.updatedAt);
}
