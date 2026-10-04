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
  ["first_ndc", "1차 NDC"],
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
  // --- sector and focal-area names of the finance portfolios (D-023 ... D-026) ---
  ["Banking", "은행업"],
  ["Chemicals", "화학"],
  ["Forestry", "임업"],
  ["Insurance", "보험"],
  ["Biodiversity", "생물다양성"],
  ["Climate Change", "기후변화"],
  ["Land Degradation", "토지 황폐화"],
  ["Chemicals and Waste", "화학물질·폐기물"],
  ["Transport & Storage", "운송·저장"],
  ["Disaster Prevention & Preparedness", "재난 예방·대비"],
  ["General environment protection", "일반 환경보호"],
  ["Environmental research", "환경 연구"],
  ["Other Multisector", "기타 다부문"],
  ["Unallocated / Unspecified", "미배분·미분류"],
  ["Environmental policy and administrative management", "환경정책 및 행정관리"],
  ["Forestry policy and administrative management", "산림정책 및 행정관리"],
  ["Financial Institutions Group", "금융기관 그룹"],
  ["Health Care and Social Assistance", "보건·사회복지"],
  ["Agribusiness and Forestry", "농업·임업 기업"],
  ["Energy efficiency and climate change", "에너지 효율·기후변화"],
  ["Advisory Services", "자문 서비스"],
  ["Investment", "투자"],
  ["Multilateral", "다자"],
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
  ["Pending", "대기 중"],
  ["Concept Approved", "개념 승인"],
  ["Project Under Implementation", "사업 이행 중"],
  ["Pipeline/Identification", "준비·발굴 단계"],
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
  // D-011 lists both groups; one Korean name for the two made the legend print
  // "DAC 회원국 · 계열 1/2", so each keeps the words its own name carries.
  ["DAC countries", "DAC 국가"],
  ["DAC members/countries", "DAC 회원국"],
  ["DAC EU countries", "DAC 소속 EU 국가"],
  ["DAC EU countries and EU Institutions", "DAC 소속 EU 국가·EU 기구"],
  ["EU Institutions", "EU 기구"],
  ["Other multilateral organisations", "기타 다자기구"],
  ["Regional Development Banks", "지역개발은행"],
  ["European Union (evolving composition)", "유럽연합(구성 변동)"],
  ["IMF Concessional Trust Funds", "IMF 양허성 신탁기금"],
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
  // B-025's "개체 구분": a river basin or a country
  ["Basin", "유역"],
  ["Basin(국가 문헌)", "유역(국가 문헌)"],
  ["Country(국가 문헌)", "국가(국가 문헌)"],
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
  ["Arid and Low Water Use", "건조·물 사용 적음"],
  // --- WWF Biodiversity Risk Filter 경관(Scape) 위험 (B-009) ---
  ["Scape Physical Risk", "경관 단위 물리적 위험"],
  ["Scape Regulatory Deficiency Risk", "경관 단위 규제 미비 위험"],
  ["Scape Reputational Risk", "경관 단위 평판 위험"],
  // --- OECD 환경 관련 세목 (D-006) ---
  ["Taxes on Energy (including fuel for transport)", "에너지 관련 세(수송 연료 포함)"],
  ["Taxes on Pollution", "오염 관련 세"],
  ["Taxes on Resources", "자원 관련 세"],
  ["Taxes on Transport (excluding fuel for transport)", "수송 관련 세(수송 연료 제외)"],
];

/**
 * V164-3 round 2: the values the second screen review still found in English.
 * Whole classification values only (a name, a project and a sentence are never
 * listed), grouped by the screens they were found on.
 */
const ENTRIES_ROUND2_V164: ReadonlyArray<readonly [string, string]> = [
  // --- countries and country groups as donors, investors, nationalities (D-011, D-012, D-026) ---
  ["Austria", "오스트리아"],
  ["Belgium", "벨기에"],
  ["Bulgaria", "불가리아"],
  ["Croatia", "크로아티아"],
  ["Cyprus", "키프로스"],
  ["Czechia", "체코"],
  ["Czech Republic", "체코"],
  ["Denmark", "덴마크"],
  ["Estonia", "에스토니아"],
  ["Finland", "핀란드"],
  ["Greece", "그리스"],
  ["Hungary", "헝가리"],
  ["Ireland", "아일랜드"],
  ["Italy", "이탈리아"],
  ["Korea", "한국"],
  ["South Korea", "한국"],
  ["Kuwait", "쿠웨이트"],
  ["Latvia", "라트비아"],
  ["Lithuania", "리투아니아"],
  ["Luxembourg", "룩셈부르크"],
  ["Malta", "몰타"],
  ["Poland", "폴란드"],
  ["Portugal", "포르투갈"],
  ["Qatar", "카타르"],
  ["Romania", "루마니아"],
  ["Russia", "러시아"],
  ["Saudi Arabia", "사우디아라비아"],
  ["Slovak Republic", "슬로바키아"],
  ["Slovenia", "슬로베니아"],
  ["Spain", "스페인"],
  ["Sweden", "스웨덴"],
  ["Burundi", "부룬디"],
  ["Virgin Islands (British)", "영국령 버진아일랜드"],
  ["To be determined", "미정"],
  // --- D-018 / D-020 / D-021 / D-023 sector, status and result-area values ---
  ["Water management", "물 관리"],
  ["Transboundary Water Management", "월경 수자원 관리"],
  ["Urban development", "도시개발"],
  ["Water Supply & Sanitation", "상수도·위생"],
  ["Banking & Financial Services", "은행·금융 서비스"],
  ["Fishing", "어업"],
  ["Energy generation, renewable sources", "재생에너지 발전"],
  ["Energy distribution", "에너지 배급"],
  ["Government & Civil Society", "정부·시민사회"],
  ["Multiple Foci", "복수 초점"],
  ["Mitigation - General", "감축 — 일반"],
  ["Mitigation - REDD", "감축 — REDD"],
  ["Livelihoods of people and communities", "주민·지역사회 생계"],
  ["Ecosystems and ecosystem services", "생태계·생태계서비스"],
  ["Infrastructure and built environment", "기반시설·건조 환경"],
  ["Health, food, and water security", "보건·식량·물 안보"],
  ["Energy generation and access", "에너지 생산·접근성"],
  ["International Waters", "국제 수역"],
  ["Concept Proposed", "개념 제안"],
  ["Proposal Approved", "제안서 승인"],
  ["EDA: Proposal Submitted,Proposal Approved", "EDA: 제안서 제출·제안서 승인"],
  ["Grant approved - Large Grants for Innovation,Project Under Implementation", "혁신 대형 보조금 승인·사업 이행 중"],
  ["Full-size Project", "정규 사업"],
  ["Medium-size Project", "중규모 사업"],
  ["Enabling Activity", "역량 강화 활동"],
  ["Rehabilitation Loan", "복구 대출"],
  ["Sector Adjustment Loan", "부문 조정 대출"],
  ["Agribusiness, Manufacturing, Services", "농산업·제조업·서비스업"],
  ["Complex Project", "복합 사업"],
  ["Transformational Project", "혁신적 변화 사업"],
  ["Summary of Proposed Guarantee", "제안 보증 요약"],
  // --- C-025 registry statuses (the same word is delivered as CODE and as Words) ---
  ["Gold Standard Certified Design", "Gold Standard 설계 인증"],
  ["Gold Standard Certified Project", "Gold Standard 사업 인증"],
  ["Listed", "목록 등재"],
  ["Registered", "등록"],
  ["Registration requested", "등록 요청"],
  ["Under development", "개발 중"],
  ["Under validation", "타당성 검토 중"],
  ["Late to verify", "검증 지연"],
  ["Verification approval requested", "검증 승인 요청"],
  ["Units Transferred from Approved GHG Program", "승인된 온실가스 프로그램에서 이전"],
  ["Withdrawn", "철회"],
  ["Issued", "발행"],
  ["Awaiting issuance request", "발행 요청 대기"],
  // --- D-024 investment rounds, sectors and instruments ---
  ["Seed", "시드"],
  ["Pre-Series A", "프리 시리즈 A"],
  ["Series A", "시리즈 A"],
  ["Series B", "시리즈 B"],
  ["Series C", "시리즈 C"],
  ["Debt financing", "부채 금융"],
  ["Finance", "금융"],
  ["Equity Investments", "지분투자"],
  ["Finance and Insurance", "금융·보험"],
  ["Agriculture, Forestry, Fishing and Hunting", "농림어업"],
  ["Wholesale Trade", "도매업"],
  ["Educational Services", "교육 서비스"],
  // --- D-025 technology and investment type (World Bank PPI) ---
  ["Natural Gas", "천연가스"],
  ["Diesel", "디젤"],
  ["Coal", "석탄"],
  ["Wind", "풍력"],
  ["Biomass", "바이오매스"],
  ["Waste", "폐기물"],
  ["Solar, PV", "태양광(PV)"],
  ["Hydro, Small (<50MW)", "소수력(50MW 미만)"],
  ["Hydro, Large (>50MW)", "대수력(50MW 초과)"],
  ["Greenfield project (Build, operate, and transfer)", "신규 건설(건설·운영·이전, BOT)"],
  ["Greenfield project (Build, own, and operate)", "신규 건설(건설·소유·운영, BOO)"],
  ["Greenfield project (Rental)", "신규 건설(임대)"],
  ["Greenfield project (Merchant)", "신규 건설(상업 판매)"],
  ["Greenfield project (Not Available)", "신규 건설(방식 미기재)"],
  ["Divestiture (Partial)", "지분 매각(일부)"],
  ["Brownfield (Build, rehabilitate, operate, and transfer)", "기존 시설 개량(건설·개보수·운영·이전)"],
  ["Brownfield (Rehabilitate, operate, and transfer)", "기존 시설 개량(개보수·운영·이전)"],
  // PPI sector paths, one segment at a time ("Energy / Electricity / Electricity generation")
  ["Electricity", "전력"],
  ["Electricity generation", "발전"],
  ["Electricity distribution", "배전"],
  ["Electricity transmission", "송전"],
  ["Natural gas distribution and transmission", "천연가스 공급·수송"],
  ["Natural gas transmission", "천연가스 수송"],
  ["Treatment plant", "처리시설"],
  ["Potable water treatment plant", "상수 처리장"],
  ["Treatment", "처리"],
  ["Disposal", "처분"],
  ["Terminal", "터미널"],
  ["Channel dredging and terminal", "수로 준설·터미널"],
  ["Highway", "고속도로"],
  ["Bridge", "교량"],
  // --- D-026 investor countries named inside a list handled above; E-003 roles ---
  ["Operational Focal Point", "실무 연락관(Operational Focal Point)"],
];

/**
 * Index and pillar names that read in Korean only in front of a Korean tail
 * ("Pillar 1 Institutions 순위", "Governance 부문 점수"); a bare "People" or
 * "Impact" is not translated anywhere else.
 */
const INDEX_TERMS_V164: ReadonlyArray<readonly [string, string]> = [
  ["Innovation Input Sub-Index", "혁신 투입 하위지수"],
  ["Innovation Output Sub-Index", "혁신 산출 하위지수"],
  ["Pillar 1 Institutions", "부문 1 제도"],
  ["Pillar 2 Human capital & research", "부문 2 인적자본·연구"],
  ["Pillar 3 Infrastructure", "부문 3 인프라"],
  ["Pillar 4 Market sophistication", "부문 4 시장 성숙도"],
  ["Pillar 5 Business sophistication", "부문 5 기업 성숙도"],
  ["Pillar 6 Knowledge & technology outputs", "부문 6 지식·기술 산출"],
  ["Pillar 7 Creative outputs", "부문 7 창의 산출"],
  ["Governance", "거버넌스"],
  ["Impact", "영향"],
  ["People", "인재"],
  ["Technology", "기술"],
];

/** The comparison key: no case, no repeated or surrounding spaces. */
function keyOf(text: string): string {
  return text.replace(/\s+/gu, " ").trim().toLowerCase();
}

// The first entry of a name stands: round 2 adds names, it does not re-translate one.
const DICTIONARY_V164: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [english, korean] of [...ENTRIES_V164, ...ENTRIES_ROUND2_V164]) {
    const key = keyOf(english);
    if (!map.has(key)) map.set(key, korean);
  }
  return map;
})();
const INDEX_TERMS_MAP_V164: ReadonlyMap<string, string> = new Map(INDEX_TERMS_V164.map(([english, korean]) => [keyOf(english), korean]));

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

/**
 * The position of a water-risk grade from low to extremely high ("Low (<10%)" 1,
 * "Low - Medium (10-20%)" 2, ... "Extremely High (>80%)" 6), or null for a value
 * that is not a grade ("No Data"). A grade table lists its rows in this order
 * instead of the order the source file happened to hold them.
 */
export function gradeRankV164(value: string): number | null {
  const grade = GRADE_PATTERN_V164.exec(String(value ?? "").trim());
  if (!grade) return null;
  const order = ["low", "low - medium", "medium", "medium - high", "high", "extremely high"];
  const index = order.indexOf(keyOf(grade[1]));
  return index < 0 ? null : index + 1;
}

/** "more than 2 in 1,000" -> "1,000분의 2 초과"; "3 in 10,000 to 2 in 1,000" -> "10,000분의 3 ~ 1,000분의 2". */
function koreanRangeV164(range: string): string {
  return range
    .replace(/more than\s+(\d[\d,]*)\s+in\s+(\d[\d,]*)/giu, "$2분의 $1 초과")
    .replace(/(\d[\d,]*)\s+in\s+(\d[\d,]*)/gu, "$2분의 $1")
    .replace(/\s+to\s+/gu, " ~ ");
}

/** Splits a value that is a list of classification values. */
const LIST_SEPARATOR_V164 = /\s*[;|]\s*|\s*,\s+/u;

/**
 * "Energy / Electricity / Electricity generation" (a sector path): translated
 * only when every segment is a known name; an empty segment ("Disposal/") is
 * dropped and a segment that repeats the one before it ("ICT / ICT") is said once.
 */
function koreanPathV164(text: string): string | null {
  if (!text.includes("/") || /:\/\//u.test(text)) return null;
  const segments = text.split(/\s*\/\s*/u).map((segment) => segment.trim()).filter(Boolean);
  // Two segments are usually alternatives ("Yes/No"), not a path.
  if (segments.length < 3) return null;
  const names: string[] = [];
  for (const segment of segments) {
    const known = DICTIONARY_V164.get(keyOf(segment));
    if (!known) return null;
    if (names[names.length - 1] !== known) names.push(known);
  }
  return names.join(" › ");
}

/**
 * A known name followed by words the delivery already wrote in Korean:
 * "Series B(신규 라운드)" reads "시리즈 B(신규 라운드)", "Pillar 1 Institutions 순위"
 * reads "부문 1 제도 순위". Only a whole known head is translated.
 */
function koreanWithKoreanTailV164(text: string): string | null {
  const completed = /^Completed\s*\(\s*완료\s+([^)]+)\)$/iu.exec(text);
  if (completed) return `완료 (${completed[1].trim()})`;
  const parenthesis = /^([A-Za-z][^()가-힣]*?)\s*(\([가-힣][^()]*\))$/u.exec(text);
  if (parenthesis) {
    const head = DICTIONARY_V164.get(keyOf(parenthesis[1]));
    if (head) return `${head}${parenthesis[2]}`;
  }
  const spaced = /^([A-Za-z][^가-힣]*?)\s+([가-힣].*)$/u.exec(text);
  if (spaced) {
    const head = INDEX_TERMS_MAP_V164.get(keyOf(spaced[1])) || DICTIONARY_V164.get(keyOf(spaced[1]));
    if (head) return `${head} ${spaced[2]}`;
  }
  return null;
}

function koreanSingleV164(text: string): string | null {
  const direct = DICTIONARY_V164.get(keyOf(text));
  if (direct) return direct;
  const grade = GRADE_PATTERN_V164.exec(text.trim());
  if (grade) {
    const base = GRADE_V164.find(([english]) => english === keyOf(grade[1]));
    if (base) return grade[2] ? `${base[1]} ${koreanRangeV164(grade[2])}` : base[1];
  }
  return koreanPathV164(text.trim()) || koreanWithKoreanTailV164(text.trim());
}

/**
 * The names the dictionary holds that themselves contain a comma ("Hong Kong,
 * China", "Hydro, Small (<50MW)", "Buildings, cities, industries, and
 * appliances"), longest first, so a list is split around them and never
 * through them.
 */
const COMMA_NAME_PATTERNS_V164: ReadonlyArray<RegExp> = [...DICTIONARY_V164.keys()]
  .filter((key) => key.includes(","))
  .sort((left, right) => right.length - left.length)
  .map((name) => {
    const body = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&").replace(/\s+/gu, "\\s+");
    return new RegExp(`(^|[;|]\\s*|,\\s+|\\s)(${body})(?=$|\\s*[;|]|,\\s)`, "giu");
  });

/** The parts of a list; a known name that holds a comma stays one part. */
function splitKnownV164(text: string): string[] {
  const atoms: string[] = [];
  let protectedText = text;
  COMMA_NAME_PATTERNS_V164.forEach((pattern) => {
    protectedText = protectedText.replace(pattern, (_match, lead: string, name: string) => {
      atoms.push(name);
      return `${lead}\u0001${atoms.length - 1}\u0001`;
    });
  });
  return protectedText
    .split(LIST_SEPARATOR_V164)
    .filter(Boolean)
    .map((part) => part.replace(/\u0001(\d+)\u0001/gu, (_match, index: string) => atoms[Number(index)]));
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
 * A description written as "label: value · label: value" (A-013's rows read
 * "부문: Energy Efficiency · 기후대응: Adaptation · 상태: Future · NDC 원문: ...")
 * whose values are classifications the dictionary knows. Only a part that is a
 * short label and a WHOLE known value is translated; the text of a part such as
 * "NDC 원문: Viet Nam has determined ..." and every part without a label stay as
 * delivered.
 */
export function koreanLabeledValuesV164(text: string): string {
  const value = String(text ?? "");
  if (!value.includes(":")) return value;
  return value
    .split(/(\s+·\s+)/u)
    .map((part) => {
      const match = /^(\s*[^:：·]{1,16}[:：]\s*)([A-Za-z][^:：·]*?)(\s*)$/u.exec(part);
      if (!match) return part;
      const translated = koreanSingleV164(match[2]);
      return translated ? `${match[1]}${translated}${match[3]}` : part;
    })
    .join("");
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

/**
 * The comparison key of a classification value written two ways by one source
 * ("GOLD_STANDARD_CERTIFIED_DESIGN" and "Gold Standard Certified Design",
 * "LISTED" and "Listed"): no case, no underscores, no repeated spaces. Two values
 * with one key are one classification, so a count over them is one bar.
 */
export function categoryVariantKeyV164(value: string): string {
  return String(value ?? "").replace(/[_\s]+/gu, " ").trim().toLowerCase();
}

/**
 * A company's nationality as the source writes it - "Vietnam(100%)", "Thailand",
 * "태국", "Denmark; Vietnam", "Thailand(90%); Vietnam(10%)", "Vietnam[추정]" -
 * as Korean country names without the ownership share. The share is a property
 * of a stake, not of the nationality, and it split one nationality into several
 * bars; a nationality the source marked as an estimate keeps that mark. A country
 * the dictionary does not know stays as written.
 */
export function nationalityLabelV164(value: string): string {
  const text = String(value ?? "").trim();
  if (!text) return String(value ?? "");
  const estimated = /\[추정\]\s*$/u.test(text);
  const body = text.replace(/\s*\[추정\]\s*$/u, "").trim();
  const names: string[] = [];
  for (const part of body.split(/\s*[;/]\s*/u).filter(Boolean)) {
    const name = part.replace(/\s*\(\s*\d+(?:\.\d+)?\s*%\s*\)\s*$/u, "").trim();
    if (!name) continue;
    const korean = koreanCategoryV164(name);
    if (!names.includes(korean)) names.push(korean);
  }
  if (names.length === 0) return text;
  const joined = names.join("·");
  return estimated ? `${joined} (추정)` : joined;
}

/**
 * An investment round without the delivery's own annotation: "Series B(신규
 * 라운드)" and "Series B" are the same kind of round.
 */
export function investmentRoundLabelV164(value: string): string {
  return String(value ?? "").replace(/\s*\(\s*신규\s*라운드\s*\)\s*$/u, "").trim();
}
