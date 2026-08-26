export interface DownloadHubContextV118 {
  countryIso3?: string | null;
  elementId?: string | null;
  datasetId?: string | null;
}

export function buildDownloadHubUrlV118(
  context: DownloadHubContextV118 = {}
): string {
  const params = new URLSearchParams();
  if (context.countryIso3)
    params.set("country", context.countryIso3.toUpperCase());
  if (context.elementId) params.set("element", context.elementId);
  if (context.datasetId) params.set("dataset", context.datasetId);
  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ""}#download`;
}

/**
 * 별도 파일생성은 다운로드 허브 한 곳에서만 수행한다.
 * pushState 후 popstate를 발생시켜 App의 기존 URL 복원 로직을 재사용한다.
 */
export function openDownloadHubV118(
  context: DownloadHubContextV118 = {}
): void {
  const nextUrl = buildDownloadHubUrlV118(context);
  window.history.pushState(null, "", nextUrl);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}
