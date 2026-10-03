import { osmClassLabelV162 } from "../visualization/osmClassLabelsV162";

/**
 * V163-T2 (13·17): source classification values a map fact prints as they were
 * delivered ("Riverine flood", "river", "shelved - inferred 2 y", "Processing
 * Plant", "원천 geolocation_source: WRI") read as words. Display rules only:
 * the value is the same fact, named in Korean; an unknown value stays as
 * written, and a source record id (MRDS dep_id) is an internal key, not a fact
 * for the reader.
 *
 * Names follow each source's own definitions: EM-DAT disaster classification
 * (CRED, "Disaster subtype"), Global Energy Monitor tracker status, OSM tags.
 */
const EMDAT_SUBTYPES_V163: Readonly<Record<string, string>> = {
  "riverine flood": "하천 범람",
  "flash flood": "돌발 홍수",
  "coastal flood": "해안 홍수",
  "flood (general)": "홍수(일반)",
  "ground movement": "지반 흔들림(지진동)",
  "tsunami": "지진해일",
  "tropical cyclone": "열대성 저기압(사이클론·태풍)",
  "extra-tropical storm": "온대성 폭풍",
  "convective storm": "대류성 폭풍",
  "storm (general)": "폭풍(일반)",
  "landslide (wet)": "산사태(강우)",
  "landslide (dry)": "산사태(건조)",
  "mudslide": "토석류",
  "drought": "가뭄",
  "heat wave": "폭염",
  "cold wave": "한파",
  "severe winter conditions": "혹한",
  "wildfire (general)": "산불(일반)",
  "forest fire": "산불",
};

const GEM_STATUS_V163: Readonly<Record<string, string>> = {
  // Global CCS Institute facility status (A-025).
  planned: "계획",
  operational: "운영",
  "in construction": "건설 중",
  "advanced development": "개발 후기",
  "early development": "개발 초기",
  completed: "완료",
  suspended: "중단",
  operating: "운영",
  construction: "건설 중",
  "pre-construction": "착공 전",
  announced: "발표",
  shelved: "보류",
  cancelled: "취소",
  mothballed: "가동 중단",
  retired: "폐지",
};

const MINE_TYPES_V163: Readonly<Record<string, string>> = {
  "processing plant": "가공 설비",
  "surface": "노천",
  "underground": "갱내",
  "surface-underground": "노천·갱내",
  "placer": "사광",
};

const COUNTRY_KO_V163: Readonly<Record<string, string>> = {
  Bangladesh: "방글라데시",
  China: "중국",
  India: "인도",
  Japan: "일본",
  "South Korea": "한국",
  Korea: "한국",
  Singapore: "싱가포르",
  Malaysia: "말레이시아",
  Thailand: "태국",
  "Viet Nam": "베트남",
  Vietnam: "베트남",
  "Saudi Arabia": "사우디아라비아",
  "United Arab Emirates": "아랍에미리트",
  "United States": "미국",
  "United Kingdom": "영국",
  Germany: "독일",
  France: "프랑스",
  Netherlands: "네덜란드",
  Norway: "노르웨이",
  Denmark: "덴마크",
  Australia: "호주",
  Canada: "캐나다",
  "Hong Kong": "홍콩",
  Turkey: "튀르키예",
};

// Carbon-credit registry project types (Verra / Gold Standard "Type").
const CREDIT_TYPES_V163: Readonly<Record<string, string>> = {
  "leak detection & repair in gas systems": "가스 배관 누출 탐지·보수",
  cookstoves: "고효율 조리기구(쿡스토브)",
  "solar - centralized": "태양광(집중형)",
  "solar - distributed": "태양광(분산형)",
  composting: "퇴비화",
  "afforestation/reforestation": "신규조림·재조림",
  "electric vehicles & charging": "전기차·충전",
  "sustainable agriculture": "지속가능 농업",
  wind: "풍력",
  hydropower: "수력",
  biogas: "바이오가스",
  "landfill gas": "매립가스",
  "energy efficiency": "에너지 효율",
  "waste heat recovery": "폐열 회수",
  biomass: "바이오매스",
  "rice cultivation": "벼 재배(메탄 저감)",
  "clean water": "깨끗한 물 공급",
  "fuel switching": "연료 전환",
};

const CODING_MEMO_V163 = /억지\s*매핑|tech_ids?\b|별첨\s*\d|대응\s*불명확/u;

function gemStatusLabelV163(value: string): string | null {
  const text = value.trim().toLowerCase();
  if (GEM_STATUS_V163[text]) return GEM_STATUS_V163[text];
  // GEM's inferred status: "shelved - inferred 2 y" = no news for two years.
  const inferred = text.match(/^(shelved|cancelled)\s*-\s*inferred\s*(\d+)\s*y$/u);
  if (inferred) return `${GEM_STATUS_V163[inferred[1]]}(${inferred[2]}년간 진행 소식 없음)`;
  return null;
}

/** A map fact's value as a reader sees it; `key` is the fact field key. */
export function publicMapFactValueV163(key: string, value: string): string {
  const text = String(value ?? "").trim();
  if (!text) return text;
  const lower = text.toLowerCase();
  switch (key) {
    case "disasterSubtype":
    case "disasterType":
      return EMDAT_SUBTYPES_V163[lower] || text;
    case "featureClass":
    case "fclass":
      return osmClassLabelV162(text);
    case "status": {
      const label = gemStatusLabelV163(text);
      return label || text;
    }
    case "technology":
      return CREDIT_TYPES_V163[lower] || text;
    case "nationality":
      // GEM owner nationality: "China(20%)", "United States; Bangladesh".
      return text.replace(/[A-Z][A-Za-z.]*(?: [A-Z][A-Za-z.]*)*/gu, (name) => COUNTRY_KO_V163[name] || name);
    case "locationBasis":
      return text
        .replace(/^원천 geolocation_source:\s*(.+)$/u, "원천 제공 좌표($1)")
        .replace(/\(geolocation_source 미기재\)/u, "(근거 미기재)");
    case "climateTechBasis":
    case "note":
      // V163-T3: the compiler's coding memo ("tech_id 공란(별첨2 R4: 억지 매핑
      // 금지)") is not a fact about the site.
      return text
        .split(/(?<=[.。])\s+|\s+·\s+/u)
        .filter((part) => part.trim() && !CODING_MEMO_V163.test(part))
        .join(" ")
        .trim();
    case "remarks":
    case "siteNote":
      return text
        .split(/\s+·\s+/u)
        .filter((part) => !/^MRDS dep_id\s*\d+$/iu.test(part.trim()) && !/^GADM gid\b/iu.test(part.trim()))
        .map((part) => MINE_TYPES_V163[part.trim().toLowerCase()] || part)
        .join(" · ")
        .replace(/운영형태\s+([A-Za-z][A-Za-z -]*[A-Za-z])/u, (_m, kind: string) => `운영형태 ${MINE_TYPES_V163[kind.toLowerCase()] || kind}`)
        // The source's own status word in brackets after its Korean name
        // ("부존 확인(occurrence)") is a raw key, as with OSM classes.
        .replace(/([가-힣)])\(([a-z][a-z -]*)\)/gu, "$1");
    default:
      return text;
  }
}
