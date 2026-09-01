import type { VietnamCatalogElementV121 } from "../vietnam/vietnamTypesV121";

const CURATED_TITLES: Record<string, { title: string; short: string }> = {
  "A-001": { title: "부패인식지수(CPI)", short: "부패인식지수" },
  "A-002": { title: "국가 정책·제도 평가(CPIA)", short: "국가 정책·제도 평가" },
  "A-003": { title: "국내총생산 및 경제성장", short: "국내총생산" },
  "A-004": { title: "빈곤율 및 극빈곤율", short: "빈곤율" },
  "A-005": { title: "산업구조", short: "산업구조" },
  "A-006": { title: "고용 및 실업", short: "고용·실업" },
  "A-007": { title: "인구 및 도시화", short: "인구·도시화" },
  "A-008": { title: "소득 불평등(지니계수)", short: "지니계수" },
  "A-009": { title: "온실가스 배출집약도", short: "배출집약도" },
  "A-010": { title: "온실가스 종류별 배출량", short: "온실가스 배출량" },
  "A-011": { title: "부문별 온실가스 배출량", short: "부문별 배출량" },
  "A-012": { title: "온실가스 총배출량", short: "총배출량" },
  "A-013": { title: "NDC와 지속가능발전목표 연계", short: "NDC·SDG 연계" },
  "A-014": { title: "지속가능발전목표 지수", short: "SDG 지수" },
  "A-015": { title: "지속가능발전목표 세부 달성도", short: "SDG 달성도" },
  "A-016": { title: "1차 에너지 소비구조", short: "에너지 소비구조" },
  "A-017": { title: "발전원별 균등화 발전비용", short: "균등화 발전비용" },
  "A-018": { title: "발전설비 용량", short: "발전설비" },
  "A-019": { title: "송배전 손실률", short: "송배전 손실률" },
  "A-020": { title: "재생에너지 비중", short: "재생에너지 비중" },
  "A-021": { title: "전력 접근률", short: "전력 접근률" },
  "A-022": { title: "정전 빈도와 지속시간", short: "정전 현황" },
  "A-023": { title: "발전소 현황", short: "발전소" },
  "A-024": { title: "베트남 송전망", short: "송전망" },
  "A-025": { title: "탄소포집·저장 시설", short: "CCS 시설" },
  "A-026": { title: "건물 분포", short: "건물 분포" },
  "A-027": { title: "육상교통 인프라", short: "교통 인프라" },
  "A-028": { title: "해안·수자원 인프라", short: "해안·수자원 인프라" },
  "A-029": { title: "자유무역협정 체결 현황", short: "FTA 현황" },
  "A-030": { title: "한국과의 교역 규모", short: "한국 교역" },
  "A-031": { title: "물류성과지수", short: "물류성과지수" },
  "A-032": { title: "중간재 교역 규모", short: "중간재 교역" },
  "A-033": { title: "해운 연결성", short: "해운 연결성" },
  "B-001": { title: "건기와 우기", short: "건기·우기" },
  "B-002": { title: "기후대", short: "기후대" },
  "B-003": { title: "평균 기온과 강수량", short: "기온·강수" },
  "B-004": { title: "과거·미래 기후전망(CMIP6)", short: "기후전망" },
  "B-005": { title: "가뭄 위험", short: "가뭄" },
  "B-006": { title: "폭염 위험", short: "폭염" },
  "B-007": { title: "홍수·호우 위험", short: "홍수·호우" },
  "B-008": { title: "해수면 상승 전망", short: "해수면 상승" },
  "B-009": { title: "생물다양성·기후 위험", short: "생물다양성 위험" },
  "B-010": { title: "기후위험지수", short: "기후위험지수" },
  "B-011": { title: "기후취약성지수", short: "기후취약성" },
  "B-012": { title: "재해·재난 이력", short: "재해·재난" },
  "B-013": { title: "탄소국경조정제도 영향", short: "CBAM 영향" },
  "B-014": { title: "탄소세 도입 효과 전망", short: "탄소세 효과" },
  "B-015": { title: "탄소가격 수준", short: "탄소가격" },
  "B-016": { title: "화석연료 의존도", short: "화석연료 의존도" },
  "B-017": { title: "물 스트레스", short: "물 스트레스" },
  "B-018": { title: "장기 국내총생산 전망", short: "GDP 전망" },
  "B-019": { title: "장기 인구 전망", short: "인구 전망" },
  "B-020": { title: "복합 위험지수", short: "복합 위험" },
  "B-021": { title: "취약성지수", short: "취약성" },
  "B-022": { title: "기후피해의 경제적 비용", short: "기후피해 비용" },
  "B-029": { title: "산림 유형별 면적", short: "산림 유형" },
  "B-031": { title: "산림 총면적", short: "산림 면적" },
  "B-033": { title: "연간 산림손실", short: "산림손실" },
  "B-034": { title: "탄소 저장량", short: "탄소 저장량" },
  "B-037": { title: "토지피복 구성", short: "토지피복" },
  "B-038": { title: "바이오매스 자원 가용량", short: "바이오매스 자원" },
  "B-039": { title: "수력 잠재량", short: "수력 잠재량" },
  "B-040": { title: "지열 잠재량", short: "지열 잠재량" },
  "B-041": { title: "태양광 자원", short: "태양광 자원" },
  "B-042": { title: "풍력 자원", short: "풍력 자원" },
  "B-043": { title: "화석연료 자원량", short: "화석연료 자원" },
  "B-044": { title: "핵심 광물 종류", short: "핵심 광물" },
  "B-045": { title: "광물자원 국제순위", short: "광물 순위" },
  "B-046": { title: "광물 매장량", short: "광물 매장량" },
  "B-047": { title: "광물 생산량", short: "광물 생산량" },
  "B-048": { title: "주요 광산 위치", short: "주요 광산" },
  "C-001": { title: "국가 온실가스 감축목표(NDC)", short: "NDC" },
  "C-002": { title: "격년투명성보고서(BTR)", short: "BTR" },
  "C-003": { title: "국가적응계획(NAP)", short: "NAP" },
  "C-004": { title: "장기 저탄소 발전전략", short: "LT-LEDS" },
  "C-005": { title: "기후기술 수요 및 우선기술", short: "기후기술 수요" },
  "C-006": { title: "파리협정 제6조 양자협력 체계", short: "제6조 양자협력" },
  "C-007": { title: "파리협정 비시장 접근", short: "비시장 접근" },
  "C-008": { title: "국제 기후협력 이니셔티브", short: "기후협력 이니셔티브" },
  "C-009": { title: "기후변화 법·제도", short: "기후 법·제도" },
  "C-010": { title: "환경 법·제도", short: "환경 법·제도" },
  "C-011": { title: "치안·안전 정보", short: "치안·안전" },
  "C-012": { title: "민관협력·조달 제도", short: "PPP·조달" },
  "C-013": { title: "외국인 투자제도", short: "외국인 투자" },
  "C-014": { title: "사업 인허가 절차", short: "인허가 절차" },
  "C-015": { title: "정책·제도 원문자료", short: "정책 원문" },
  "C-016": { title: "재생에너지 발주·확대계획", short: "재생에너지 발주" },
  "C-017": { title: "재생에너지 투자 인센티브", short: "재생에너지 인센티브" },
  "C-018": { title: "중장기 에너지 전망", short: "에너지 전망" },
  "C-019": { title: "탄소시장 법·제도와 예산", short: "탄소시장 제도" },
  "C-020": { title: "온실가스 감축사업 기초정보", short: "감축사업 기초정보" },
  "C-021": { title: "자발적 탄소시장 사업목록", short: "VCM 사업목록" },
  "C-022": { title: "탄소시장 준비도", short: "탄소시장 준비도" },
  "C-023": { title: "한계저감비용", short: "한계저감비용" },
  "C-024": { title: "산림전용 방지 및 산림보전(REDD+)", short: "REDD+" },
  "C-025": { title: "탄소크레딧 사업 및 발행실적", short: "탄소크레딧 사업" },
  "D-013": { title: "녹색성장지수", short: "녹색성장지수" },
  "D-014": { title: "대외경제협력기금 사업", short: "EDCF 사업" },
  "D-015": { title: "한국 공적개발원조 사업", short: "한국 ODA 사업" },
  "D-016": { title: "정부·지방자치단체 협력사업", short: "정부·지자체 사업" },
  "D-017": { title: "한국 ODA 사업기획·입찰", short: "ODA 기획·입찰" },
  "D-018": { title: "적응기금 사업", short: "적응기금 사업" },
  "D-019": { title: "CTCN 기술지원", short: "CTCN 기술지원" },
  "D-020": { title: "녹색기후기금 사업", short: "GCF 사업" },
  "D-021": { title: "국제기구·개발은행 사업", short: "국제기구·MDB 사업" },
  "D-022": { title: "개발금융·민관협력 투자사업", short: "개발금융·PPP 사업" },
  "D-023": { title: "국제협력·기후재원 사업", short: "국제협력·기후재원" },
  "D-024": { title: "벤처·임팩트 투자", short: "벤처·임팩트 투자" },
  "D-025": { title: "민간 인프라 투자", short: "민간 인프라 투자" },
  "D-026": { title: "정치적 위험 보증사업", short: "정치적 위험 보증" },
  "E-001": { title: "CTCN 국가지정기구", short: "CTCN NDE" },
  "E-002": { title: "파리협정 국가지정기관", short: "DNA" },
  "E-003": { title: "녹색기후기금 국가지정기관", short: "GCF NDA" },
  "E-004": { title: "국제기구 현지사무소", short: "국제기구 사무소" },
  "E-005": { title: "대학·연구기관·시민사회", short: "연구·시민사회 기관" },
  "E-006": { title: "현지 투자자 네트워크", short: "투자자 네트워크" },
  "E-007": { title: "온실가스 산정·보고·검증 체계", short: "MRV 체계" },
  "E-008": { title: "기후기술 논문·특허", short: "논문·특허" },
  "E-009": { title: "과학기술 인력", short: "과학기술 인력" },
  "E-010": { title: "연구개발·혁신 역량", short: "연구개발·혁신" },
  "E-011": { title: "기술준비수준", short: "기술준비수준" },
  "E-012": { title: "기술인력과 임금", short: "기술인력·임금" },
  "E-013": { title: "운영·유지보수 역량", short: "운영·유지보수" },
  "E-014": { title: "기후·녹색성장 양자협정", short: "양자협정" },
  "E-015": { title: "NDC 파트너십 참여", short: "NDC 파트너십" },
  "E-016": { title: "한국 기후기술 성숙도", short: "한국 기술성숙도" },
  "E-017": { title: "한국 기후기술 비교우위", short: "한국 기술 비교우위" },
  "E-018": { title: "한국 기업의 현지 진출", short: "한국 기업 진출" },
  "E-019": { title: "한국 기관 현지사무소", short: "한국 기관 사무소" },
  "E-020": { title: "한국의 공공·민간 지원제도", short: "한국 지원제도" },
};

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function removeFieldInventory(value: string): string {
  return compactWhitespace(
    value
      .replace(/\[[\s\S]*$/u, "")
      .replace(/;[\s\S]*$/u, "")
      .replace(/\((?:프로젝트명|위치|용량|국가|기관|지표|변수)[\s\S]*$/u, "")
  );
}

function normalizeAcronymTitle(value: string): string {
  const raw = compactWhitespace(value);
  if (/^CPI\s*\(/i.test(raw)) return "부패인식지수(CPI)";
  if (/^CPIA\s*\(/i.test(raw)) return "국가 정책·제도 평가(CPIA)";
  if (/^GDP(?:\b|\[)/i.test(raw)) return "국내총생산 및 경제성장";
  return raw;
}

export function publicDatasetTitleV122(
  elementId: string,
  rawLabel: string
): string {
  const curated = CURATED_TITLES[elementId];
  if (curated) return curated.title;
  const withoutInventory = removeFieldInventory(rawLabel);
  return normalizeAcronymTitle(withoutInventory) || "데이터";
}

export function publicDatasetShortTitleV122(
  elementId: string,
  rawLabel: string
): string {
  const curated = CURATED_TITLES[elementId];
  if (curated) return curated.short;
  const title = publicDatasetTitleV122(elementId, rawLabel);
  return title.length > 34 ? `${title.slice(0, 33).trim()}…` : title;
}

export function publicDatasetDescriptionV122(
  item: Pick<
    VietnamCatalogElementV121,
    "sectionLabel" | "groupLabel" | "categoryLabel"
  >
): string {
  const candidates = [item.sectionLabel, item.groupLabel, item.categoryLabel]
    .map((value) => compactWhitespace(value || ""))
    .filter(Boolean);
  const unique = Array.from(new Set(candidates));
  return unique.length > 0
    ? `${unique.slice(0, 2).join(" · ")} 관련 자료`
    : "관련 자료";
}

export function publicCountrySlugV122(iso3: string): string {
  const normalized = iso3.trim().toUpperCase();
  const known: Record<string, string> = {
    VNM: "vietnam",
    BGD: "bangladesh",
    PHL: "philippines",
    KHM: "cambodia",
    IDN: "indonesia",
    LAO: "laos",
    LKA: "sri-lanka",
    IND: "india",
    MYS: "malaysia",
    EGY: "egypt",
  };
  return known[normalized] || normalized.toLowerCase();
}

export function safePublicFilenamePartV122(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return normalized || "data";
}

export function removeInternalSearchTokensV122(value: string): string {
  return compactWhitespace(
    value
      .replace(/\b[A-E]-\d{3}(?:_[a-z0-9_]+)?\b/gi, " ")
      .replace(/\bvnm-v121-[a-z0-9-]+\b/gi, " ")
      .replace(/\b(?:record|provider|shard|pack)[_-]?[a-z0-9_-]+\b/gi, " ")
  );
}
