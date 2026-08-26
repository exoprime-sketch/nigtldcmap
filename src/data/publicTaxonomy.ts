export type CategoryCode = "A" | "B" | "C" | "D" | "E";

export interface Category {
  code: CategoryCode;
  nameKo: string;
  nameEn: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  {
    code: "A",
    nameKo: "국가 기본정보",
    nameEn: "Country Basics",
    description: "인구, 행정구역, 경제·사회 등 국가 기본 현황",
  },
  {
    code: "B",
    nameKo: "기후·환경",
    nameEn: "Climate & Environment",
    description: "기후위험, 환경, 자연자원과 에너지 잠재력",
  },
  {
    code: "C",
    nameKo: "정책·제도",
    nameEn: "Policy & Institutions",
    description: "법률, 정책, 제도, 계획과 이행 체계",
  },
  {
    code: "D",
    nameKo: "시장·산업·재원",
    nameEn: "Market, Industry & Finance",
    description: "시장, 산업, 기업환경, 투자와 기후재원",
  },
  {
    code: "E",
    nameKo: "협력사업·이행",
    nameEn: "Cooperation & Implementation",
    description: "개발협력 사업, 파트너, 실행환경과 성과",
  },
];
