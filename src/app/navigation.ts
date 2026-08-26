export type View =
  | "home"
  | "explorer"
  | "dataset-detail"
  | "element-detail"
  | "map"
  | "compare"
  | "country"
  | "download"
  | "insights"
  | "not-found";

export const LEGACY_COMPARE_ROUTE_TARGET_V114: View = "download";

export const PUBLIC_NAVIGATION_V114: Array<{ view: View; label: string }> = [
  { view: "explorer", label: "데이터 찾기" },
  { view: "map", label: "데이터 지도" },
  { view: "download", label: "데이터 다운로드" },
];

export const VALID_VIEWS: View[] = [
  "home",
  "explorer",
  "dataset-detail",
  "element-detail",
  "map",
  "compare",
  "country",
  "download",
  "insights",

  "not-found",
];

/**
 * 현재 URL hash를 공개 플랫폼의 View로 변환함.
 * 과거 오류로 생성될 수 있는 #undefined / #null은 홈으로 복구함.
 * 그 밖의 알 수 없는 hash는 404 화면으로 보냅니다.
 */
export function getViewFromLocation(): View {
  const hash = window.location.hash.replace(/^#/, "").trim();

  if (!hash || hash === "undefined" || hash === "null") {
    return "home";
  }

  // 과거 버전에서 페이지 내부 이동에 사용한 fragment도 안전하게 복구함.
  // 현재 버전은 내부 섹션 이동 시 URL hash를 바꾸지 않음.
  // v102: 협력 인사이트 화면은 공개 내비게이션에서 제거됨.
  // 과거 공유 링크는 404 대신 데이터 찾기로 안전하게 복구한다.
  if (hash === "insights" || hash.startsWith("insight-")) {
    return "explorer";
  }

  if (hash.startsWith("country-")) {
    return "country";
  }

  // v77: 과거 공유 링크 #guide는 삭제된 이용안내 페이지 대신
  // 실제 데이터 탐색 화면으로 안전하게 보냅니다.
  if (hash === "guide") {
    return "explorer";
  }

  // v114: 별도 국가 비교 페이지는 데이터 상세 내 비교기능으로 통합했다.
  // 과거 #compare 공유링크는 새 데이터 다운로드 허브로 안전하게 연결한다.
  if (hash === "compare") {
    return LEGACY_COMPARE_ROUTE_TARGET_V114;
  }

  return VALID_VIEWS.includes(hash as View) ? (hash as View) : "not-found";
}

/**
 * 이전 단계의 App.tsx와의 호환성을 위한 별칭임.
 * 새 코드는 getViewFromLocation을 사용함.
 */
export const getInitialView = getViewFromLocation;
