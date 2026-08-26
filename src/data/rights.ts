import type { RightsStatus } from "../types/dataset";

export interface RightsDisplay {
  label: string;
  title: string;
  description: string;
}

export const RIGHTS: Record<RightsStatus, RightsDisplay> = {
  allowed: {
    label: "다운로드 가능",
    title: "공개 다운로드 가능",
    description: "이용조건 확인 후 파일 다운로드 가능",
  },
  metadata_only: {
    label: "원 데이터 연결",
    title: "원 데이터 링크 제공",
    description: "메타데이터·원 데이터 링크 제공 · 원본 파일 재배포 제외",
  },
  restricted: {
    label: "접근 제한",
    title: "승인 사용자 한정",
    description: "이용 목적·권한 확인 후 접근 가능",
  },
  rights_unknown: {
    label: "제공 준비 중",
    title: "다운로드 준비 중",
    description: "라이선스·재배포 조건 확인 후 다운로드 제공",
  },
};
