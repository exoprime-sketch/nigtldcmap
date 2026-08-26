import { SERVICE_LINKS } from "../config/serviceLinks";
import type { Dataset } from "../types/dataset";

export function openDatasetFeedbackV43(dataset: Dataset) {
  const email = SERVICE_LINKS.contactEmail?.trim();
  if (!email || typeof window === "undefined") return;

  const subject = `[개도국 전략지도] 자료 오류·갱신 의견 - ${dataset.titleKo}`;
  const body = [
    "개도국 전략지도 자료 관련 의견",
    "",
    `자료명: ${dataset.titleKo}`,
    `출처기관: ${dataset.sourceOrganization}`,
    `기준: ${dataset.referenceYear || dataset.period || "확인 필요"}`,
    `현재 화면: ${window.location.href}`,
    dataset.sourceUrl ? `원 데이터: ${dataset.sourceUrl}` : "",
    "",
    "확인 요청 또는 수정 의견:",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  window.location.href = `mailto:${encodeURIComponent(
    email
  )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
