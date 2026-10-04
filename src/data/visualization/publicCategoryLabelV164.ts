/**
 * V164-3: Korean names for the English classification values the delivery
 * shipped untranslated ("Mitigation", "Under implementation", "Low - Medium
 * (10-20%)", "Yes", "Asia" ...).
 *
 * The rule is narrow on purpose:
 * - a value is translated only when the WHOLE value is a known classification
 *   (compared without case or extra spaces), a list of known ones ("Adaptation,
 *   Mitigation"), or a grade with its range ("Low (<10%)");
 * - an institution, a project, a document or any other proper name is not in the
 *   dictionary and is never touched; a sentence is never translated;
 * - nothing is guessed: a value that is not listed stays as it was delivered.
 *
 * This is a display layer. Downloads keep the delivered values.
 *
 * This file imports nothing so any renderer can use it.
 */

const ENTRIES_V164: ReadonlyArray<readonly [string, string]> = [
  // --- objective / approach (NDC, CTCN, GCF) ---
  ["Mitigation", "감축"],
  ["Adaptation", "적응"],
  ["Both", "감축·적응 모두"],
  ["Cross-cutting", "분야 공통"],
  ["Adaptation, resilience and sustainability", "적응·회복력·지속가능성"],
  ["Disaster risk reduction", "재난위험 경감"],
  ["Community based", "지역사회 기반"],
  ["Community-based", "지역사회 기반"],
  ["Endogenous technologies", "토착 기술"],
  ["Gender", "성평등"],
  ["Ecosystems and biodiversity", "생태계·생물다양성"],
  // --- NDC / A-013 vocabulary ---
  ["Action", "이행 조치"],
  ["Needs & Gaps", "필요·격차"],
  ["Future", "향후 계획"],
  ["Existing", "기존 조치"],
  ["indc", "INDC"],
  ["first_ndc", "최초 NDC"],
  ["Forest and land use", "산림·토지이용"],
  ["Energy Efficiency", "에너지 효율"],
  ["Renewable Energy", "재생에너지"],
  ["Oceans and Fisheries", "해양·수산"],
  ["Cities and Urban Development", "도시·도시개발"],
  ["Rural Development", "농촌개발"],
  ["Education", "교육"],
  ["Health", "보건"],
  // --- sectors ---
  ["Energy", "에너지"],
  ["Transport", "교통"],
  ["Transportation", "교통"],
  ["Industry", "산업"],
  ["Agriculture", "농업"],
  ["Agriculture and forestry", "농림업"],
  ["Waste", "폐기물"],
  ["Waste management", "폐기물 관리"],
  ["Water", "물"],
  ["Water resources", "수자원"],
  ["Infrastructure", "기반시설"],
  ["Coastal zones", "연안 지역"],
  ["Energy efficiency", "에너지 효율"],
  ["Early warning and Environmental assessment", "조기경보·환경평가"],
  ["Water and sewerage", "상하수도"],
  ["Municipal Solid Waste", "생활폐기물"],
  ["ICT", "정보통신기술(ICT)"],
  ["Information and communication technology (ICT)", "정보통신기술(ICT)"],
  ["All sectors", "전 부문"],
  ["Economy-wide", "경제 전반"],
  ["Forests and land use", "산림·토지이용"],
  ["Buildings, cities, industries, and appliances", "건물·도시·산업·가전"],
  ["Coal-based", "석탄 기반"],
  ["Gas-based", "가스 기반"],
  ["Telecommunications", "통신"],
  ["Power", "전력"],
  ["Power Plants", "발전소"],
  ["Manufacturing", "제조업"],
  ["Railways", "철도"],
  ["Roads", "도로"],
  ["Bridges", "교량"],
  ["Ports", "항만"],
  ["Airports", "공항"],
  ["Broadcasting", "방송"],
  ["Urban", "도시"],
  ["Commodity Loans", "상품 차관"],
  ["Electric Power And Gas", "전력·가스"],
  ["Other Electric Power And Gas", "기타 전력·가스"],
  ["Social Services", "사회서비스"],
  ["Mining And Manufacturing", "광업·제조업"],
  ["Agriculture, Forestry And Fisheries", "농림수산업"],
  ["Irrigation And Flood Control", "관개·홍수 방어"],
  ["Public Health And Medicine", "보건·의료"],
  ["Water Supply, Sewerage And Sanitation", "상수도·하수·위생"],
  ["Transmission Lines And Distribution Systems", "송배전망"],
  ["Urban/Rural Community Infrastructure", "도시·농촌 공동체 기반시설"],
  ["Strengthening Of Administrative Management", "행정관리 강화"],
  ["Financial Markets", "금융시장"],
  ["Multi-sector", "다부문"],
  ["Environmental Conservation In Multisector", "다부문 환경보전"],
  ["Other Services", "기타 서비스"],
  ["Others", "기타"],
  ["Other", "기타"],
  // --- status ---
  ["Completed", "완료"],
  ["Complete", "완료"],
  ["Review", "검토"],
  ["Implementation", "이행"],
  ["Design", "설계"],
  ["Finalisation", "마무리"],
  ["Under implementation", "이행 중"],
  ["Approved", "승인"],
  ["Active", "진행 중"],
  ["Not Active", "비활성"],
  ["Closed", "종료"],
  ["Dropped", "중단"],
  ["Proposed", "제안"],
  ["Pipeline", "준비 단계"],
  ["Cancelled", "취소"],
  ["Concluded", "종결"],
  ["Planned", "계획"],
  ["Terminated", "종료"],
  ["In force", "발효"],
  ["Signed (not in force)", "서명(미발효)"],
  ["In negotiation", "협상 중"],
  ["Under negotiation", "협상 중"],
  ["Signed", "서명"],
  ["Unknown", "알 수 없음"],
  ["Not reported", "보고 없음"],
  ["Project Approved", "사업 승인"],
  ["Grand Total", "합계"],
  // --- scope ---
  ["National", "전국"],
  ["Sub-national", "지방 단위"],
  ["Regional", "지역"],
  ["Global", "전 세계"],
  // --- CTCN support types ---
  ["Feasibility of technology options", "기술 대안 타당성 검토"],
  ["Decision-making tools and/or information provision", "의사결정 도구·정보 제공"],
  ["Technology identification and prioritisation", "기술 식별·우선순위 설정"],
  ["Sectoral roadmaps and strategies", "부문별 로드맵·전략"],
  ["Research and development of technologies", "기술 연구개발"],
  ["Private sector engagement and market creation", "민간 참여·시장 조성"],
  ["Piloting and deployment of technologies in local conditions", "현지 여건에 맞춘 기술 시범·보급"],
  // --- finance instruments (GCF, lending) ---
  ["Grants", "무상지원"],
  ["Senior Loans", "선순위 대출"],
  ["in-kind", "현물"],
  ["Guarantees", "보증"],
  ["Equity", "지분투자"],
  ["Results-Based Payment", "성과기반 지급"],
  ["Loan", "대출"],
  ["Sovereign", "공공부문 대출(정부 보증)"],
  ["Nonsovereign", "민간부문 대출(정부 비보증)"],
  ["Risk Management", "위험관리"],
  ["Investment Project Financing", "투자사업 금융"],
  ["Specific Investment Loan", "특정 투자 대출"],
  ["Development Policy Lending", "개발정책 차관"],
  ["Program-for-Results Financing", "성과기반 프로그램 금융"],
  ["Financial Intermediary Loan", "금융중개 대출"],
  ["Sector Investment and Maintenance Loan", "부문 투자·유지 대출"],
  ["Learning and Innovation Loan", "학습·혁신 대출"],
  ["Emergency Recovery Loan", "긴급복구 대출"],
  ["Adaptable Program Loan", "가변 프로그램 대출"],
  ["Technical Assistance Loan", "기술지원 대출"],
  ["Structural Adjustment Loan", "구조조정 대출"],
  ["General untied", "일반 비구속"],
  ["General, untied", "일반 비구속"],
  ["Untied", "비구속"],
  ["Partially Untied", "부분 비구속"],
  ["Tied", "구속"],
  ["Japan tied", "일본 구속"],
  ["Bilateral Tied", "양자 구속"],
  ["Tied aid (Japan)", "일본 구속성 원조"],
  ["Project Brief", "사업 개요서"],
  ["Environmental and Social Review Summary", "환경·사회 검토 요약"],
  // --- ODA donor groups (D-011) ---
  ["Official donors", "공적 공여기관"],
  ["Multilateral organisations", "다자기구"],
  ["Multilaterals organisations", "다자기구"],
  ["DAC Members", "DAC 회원국"],
  ["DAC countries", "DAC 회원국"],
  ["DAC members/countries", "DAC 회원국"],
  ["Non-DAC countries", "비DAC 국가"],
  // --- investor / institution types (a type, never a name) ---
  ["DFI", "개발금융기관(DFI)"],
  ["VC", "벤처캐피털(VC)"],
  ["PE", "사모펀드(PE)"],
  ["AC", "액셀러레이터(AC)"],
  ["IFI", "국제금융기관(IFI)"],
  ["MDB", "다자개발은행(MDB)"],
  ["Impact investment firm", "임팩트 투자회사"],
  ["Company", "기업"],
  ["Organization", "기관"],
  ["Organisation", "기관"],
  ["City", "도시"],
  ["Investor", "투자자"],
  ["Province", "성"],
  ["Division", "주(Division)"],
  ["Country", "국가"],
  // --- flags and absence ---
  ["Yes", "예"],
  ["No", "아니오"],
  ["N/A", "해당 없음"],
  ["Not Applicable", "해당 없음"],
  ["Not Available", "미제공"],
  ["No Data", "자료 없음"],
  ["Not Active", "비활성"],
  // --- regions and countries named as a category ---
  ["Asia", "아시아"],
  ["South Asia", "남아시아"],
  ["Bangladesh", "방글라데시"],
  ["Viet Nam", "베트남"],
  ["Vietnam", "베트남"],
  ["Japan", "일본"],
  ["China", "중국"],
  ["India", "인도"],
  ["Thailand", "태국"],
  ["Singapore", "싱가포르"],
  ["United Kingdom", "영국"],
  ["United States of America", "미국"],
  ["United States", "미국"],
  ["Korea, Republic of", "대한민국"],
  ["EU (European Union)", "EU(유럽연합)"],
  ["United Arab Emirates", "아랍에미리트"],
  ["Hong Kong SAR, China", "홍콩(중국 특별행정구)"],
  ["Egypt, Arab Republic of", "이집트"],
  ["Germany", "독일"],
  ["France", "프랑스"],
  ["Netherlands", "네덜란드"],
  ["Mauritius", "모리셔스"],
  ["Philippines", "필리핀"],
  ["Lao People's Democratic Republic (the)", "라오스"],
  ["Lao People's Democratic Republic", "라오스"],
  ["People's Republic of China", "중국"],
  ["Republic of Korea", "대한민국"],
  ["Hong Kong, China", "홍콩(중국)"],
  ["Brunei Darussalam", "브루나이"],
  ["Cambodia", "캄보디아"],
  ["Indonesia", "인도네시아"],
  ["Malaysia", "말레이시아"],
  ["Myanmar", "미얀마"],
  ["Australia", "호주"],
  ["New Zealand", "뉴질랜드"],
  ["Canada", "캐나다"],
  ["Chile", "칠레"],
  ["Mexico", "멕시코"],
  ["Peru", "페루"],
  ["Papua New Guinea", "파푸아뉴기니"],
  ["Afghanistan", "아프가니스탄"],
  ["Mongolia", "몽골"],
  ["Bhutan", "부탄"],
  ["Maldives", "몰디브"],
  ["Nepal", "네팔"],
  ["Pakistan", "파키스탄"],
  ["Sri Lanka", "스리랑카"],
  ["Armenia", "아르메니아"],
  ["Kazakhstan", "카자흐스탄"],
  ["Kyrgyz Republic", "키르기스스탄"],
  ["Belarus", "벨라루스"],
  ["Russian Federation", "러시아"],
  ["Türkiye", "튀르키예"],
  ["Turkiye", "튀르키예"],
  ["Egypt", "이집트"],
  ["Nigeria", "나이지리아"],
  ["Israel", "이스라엘"],
  ["Switzerland", "스위스"],
  ["Norway", "노르웨이"],
  ["Iceland", "아이슬란드"],
  ["Liechtenstein", "리히텐슈타인"],
  ["Brazil", "브라질"],
  ["Argentina", "아르헨티나"],
  ["Paraguay", "파라과이"],
  ["Uruguay", "우루과이"],
  // --- cities named as a category ---
  ["Dhaka", "다카"],
  ["Manila", "마닐라"],
  ["Beijing", "베이징"],
  ["Washington, D.C.", "워싱턴 D.C."],
  ["Incheon (Songdo)", "인천(송도)"],
  ["Ho Chi Minh City", "호찌민"],
  ["Hanoi", "하노이"],
  ["Zurich", "취리히"],
  ["Paris", "파리"],
  ["London", "런던"],
  // --- language codes of a source document ---
  ["en", "영어"],
  ["vi", "베트남어"],
  // --- grades with no range ---
  ["Insignificant Trend", "유의미한 추세 없음"],
  ["No Risk", "위험 없음"],
];

/** The comparison key: no case, no repeated or surrounding spaces. */
function keyOf(text: string): string {
  return text.replace(/\s+/gu, " ").trim().toLowerCase();
}

const DICTIONARY_V164: ReadonlyMap<string, string> = new Map(ENTRIES_V164.map(([english, korean]) => [keyOf(english), korean]));

/** Water-risk style grades: "Low - Medium (10-20%)" reads "낮음~중간 (10-20%)". */
const GRADE_V164: ReadonlyArray<readonly [string, string]> = [
  ["extremely high", "매우 높음"],
  ["medium - high", "중간~높음"],
  ["low - medium", "낮음~중간"],
  ["low", "낮음"],
  ["medium", "중간"],
  ["high", "높음"],
];
const GRADE_PATTERN_V164 = new RegExp(`^(${GRADE_V164.map(([english]) => english).join("|")})\\s*(\\(.+\\))?$`, "iu");

/** "more than 2 in 1,000" -> "1,000분의 2 초과"; "3 in 10,000 to 2 in 1,000" -> "10,000분의 3 ~ 1,000분의 2". */
function koreanRangeV164(range: string): string {
  return range
    .replace(/more than\s+(\d[\d,]*)\s+in\s+(\d[\d,]*)/giu, "$2분의 $1 초과")
    .replace(/(\d[\d,]*)\s+in\s+(\d[\d,]*)/gu, "$2분의 $1")
    .replace(/\s+to\s+/gu, " ~ ");
}

/** Splits a value that is a list of classification values. */
const LIST_SEPARATOR_V164 = /\s*[;|]\s*|\s*,\s+/u;

function koreanSingleV164(text: string): string | null {
  const direct = DICTIONARY_V164.get(keyOf(text));
  if (direct) return direct;
  const grade = GRADE_PATTERN_V164.exec(text.trim());
  if (grade) {
    const base = GRADE_V164.find(([english]) => english === keyOf(grade[1]));
    if (base) return grade[2] ? `${base[1]} ${koreanRangeV164(grade[2])}` : base[1];
  }
  return null;
}

/** The parts of a list; a name that holds a comma ("Hong Kong, China") stays one part. */
function splitKnownV164(text: string): string[] {
  const raw = text.split(LIST_SEPARATOR_V164).filter(Boolean);
  const parts: string[] = [];
  for (let index = 0; index < raw.length; index += 1) {
    const pair = index + 1 < raw.length ? `${raw[index]}, ${raw[index + 1]}` : "";
    if (pair && DICTIONARY_V164.has(keyOf(pair))) {
      parts.push(pair);
      index += 1;
    } else parts.push(raw[index]);
  }
  return parts;
}

/**
 * The Korean name of a classification value, or the value itself when it is not
 * one the dictionary knows. A list ("Adaptation, Mitigation", "PE;VC") is
 * translated only when every part is known.
 */
export function koreanCategoryV164(value: string): string {
  const text = String(value ?? "");
  const trimmed = text.trim();
  if (!trimmed || !/^[A-Za-z]/u.test(trimmed)) return text;
  const whole = koreanSingleV164(trimmed);
  if (whole) return whole;
  const parts = splitKnownV164(trimmed);
  if (parts.length < 2) return text;
  const translated = parts.map((part) => koreanSingleV164(part));
  return translated.every((part): part is string => part !== null) ? translated.join("·") : text;
}

/**
 * A list of names of one kind (the member countries of an agreement) where the
 * known ones read in Korean and the others stay as delivered: "Mongolia, Taipei,China"
 * is "몽골·Taipei,China". A list with no known name is returned as it was.
 */
export function koreanListV164(value: string): string {
  const text = String(value ?? "");
  const trimmed = text.trim();
  if (!trimmed || !/^[A-Za-z]/u.test(trimmed)) return text;
  const parts = splitKnownV164(trimmed);
  const translated = parts.map((part) => koreanSingleV164(part));
  if (parts.length < 2 || translated.every((part) => part === null)) return koreanCategoryV164(text);
  return parts.map((part, index) => translated[index] ?? part).join("·");
}

/**
 * A card title "prefix — Suffix" / "prefix: Suffix" whose last part is a known
 * classification ("PPI 부문별 사업 건수 — Energy", "민간참여 인프라 투자 실적 2019:
 * Water and sewerage"): the suffix is translated, the rest is left as it is.
 */
export function koreanTitleV164(title: string): string {
  const text = String(title ?? "");
  const match = /^(.*?(?:\s[—–]\s|:\s))([A-Za-z][^—–:]*)$/u.exec(text);
  if (!match) return text;
  const translated = koreanCategoryV164(match[2]);
  return translated === match[2] ? text : `${match[1]}${translated}`;
}
