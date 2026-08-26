export interface AuthoritativeElementSearchItemV75 {
  elementId: string;
  displayTitle: string;
  category: string;
  categoryLabel: string;
  dataGroup: string;
  source: string;
  question: string;
  searchText: string;
  datasetIds: string[];
}

export const AUTHORITATIVE_ELEMENT_SEARCH_V75: AuthoritativeElementSearchItemV75[] =
  [
    {
      elementId: "A-001",
      displayTitle: "부패인식지수(CPI)",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.1.a.사회·경제 현황",
      source: "Transparency International · Corruption Perceptions Index (CPI)",
      question: "베트남의 부패인식 수준과 최근 변화는?",
      searchText:
        "CPI(Corruption Perceptions Index, 부패인식지수) CPI(Corruption Perceptions Index, 부패인식지수) A.1.a.사회·경제 현황 국가 기본정보 Transparency International Corruption Perceptions Index CPI 부패인식지수 베트남의 부패인식 수준과 최근 변화는? CPI 점수 세계 순위 최근 5년 변화",
      datasetIds: [],
    },
    {
      elementId: "A-002",
      displayTitle: "CPIA 국가 정책·제도 역량",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.1.a.사회·경제 현황",
      source: "World Bank CPIA",
      question: "베트남의 정책·제도 역량은 어느 수준인가?",
      searchText:
        "CPIA (Country Policy and Institutional Assessment, 국가 신용도·거버넌스 수준 지표) CPIA (Country Policy and Institutional Assessment, 국가 신용도·거버넌스 수준 지표) A.1.a.사회·경제 현황 국가 기본정보 World Bank CPIA World Bank CPIA 베트남의 정책·제도 역량은 어느 수준인가? CPIA 총점 핵심 정책클러스터 최근 변화",
      datasetIds: [],
    },
    {
      elementId: "A-003",
      displayTitle: "GDP·성장·1인당소득",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.1.a.사회·경제 현황",
      source: "World Bank WDI",
      question: "베트남 경제 규모와 성장 여건은 어떻게 변하고 있는가?",
      searchText:
        "GDP (현재/PPP, 성장률, 1인당 GDP) GDP (현재/PPP, 성장률, 1인당 GDP) A.1.a.사회·경제 현황 국가 기본정보 World Bank WDI World Bank WDI 베트남 경제 규모와 성장 여건은 어떻게 변하고 있는가? GDP 1인당 GDP GDP 성장률 GDP(PPP) GDP(현재 US$) GDP 성장률 1인당 GDP(현재 US$) World Bank World Bank World Bank",
      datasetIds: ["population-growth-api", "gdp-api", "gdp-growth-api"],
    },
    {
      elementId: "A-004",
      displayTitle: "빈곤율/극빈곤율",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.1.a.사회·경제 현황",
      source: "World Bank WDI",
      question: "빈곤·극빈곤 수준은 어떻게 변화하고 있는가?",
      searchText:
        "빈곤율/극빈곤율 빈곤율/극빈곤율 A.1.a.사회·경제 현황 국가 기본정보 World Bank WDI World Bank WDI 빈곤·극빈곤 수준은 어떻게 변화하고 있는가? 빈곤율 극빈곤율 최근 변화",
      datasetIds: [],
    },
    {
      elementId: "A-005",
      displayTitle: "산업구조 (농업/제조/서비스 비중)",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.1.a.사회·경제 현황",
      source: "World Bank WDI",
      question:
        "베트남 경제에서 농업·제조업·서비스업 비중은 어떻게 구성되는가?",
      searchText:
        "산업구조 (농업/제조/서비스 비중) 산업구조 (농업/제조/서비스 비중) A.1.a.사회·경제 현황 국가 기본정보 World Bank WDI World Bank WDI 베트남 경제에서 농업·제조업·서비스업 비중은 어떻게 구성되는가? 농업 비중 제조·산업 비중 서비스 비중",
      datasetIds: [],
    },
    {
      elementId: "A-006",
      displayTitle: "실업률/청년실업률",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.1.a.사회·경제 현황",
      source: "World Bank WDI",
      question: "전체·청년 실업 수준과 변화는 어떠한가?",
      searchText:
        "실업률/청년실업률 실업률/청년실업률 A.1.a.사회·경제 현황 국가 기본정보 World Bank WDI World Bank WDI 전체·청년 실업 수준과 변화는 어떠한가? 실업률 청년실업률 최근 변화",
      datasetIds: [],
    },
    {
      elementId: "A-007",
      displayTitle: "인구 (총인구, 도시화율)",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.1.a.사회·경제 현황",
      source: "World Bank WDI",
      question: "베트남의 인구 규모와 도시화는 어떻게 변화하고 있는가?",
      searchText:
        "인구 (총인구, 도시화율) 인구 (총인구, 도시화율) A.1.a.사회·경제 현황 국가 기본정보 World Bank WDI / Indicators API World Bank WDI 베트남의 인구 규모와 도시화는 어떻게 변화하고 있는가? 총인구 도시인구 비율 연간 인구증가율 총인구 도시인구 비율 인구증가율 World Bank World Bank World Bank",
      datasetIds: ["LDC-DS-A-001", "population-api", "urbanization-api"],
    },
    {
      elementId: "A-008",
      displayTitle: "지니계수",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.1.a.사회·경제 현황",
      source: "World Bank WDI",
      question: "소득불평등 수준과 최근 변화는 어떠한가?",
      searchText:
        "지니계수 지니계수 A.1.a.사회·경제 현황 국가 기본정보 World Bank WDI World Bank WDI 소득불평등 수준과 최근 변화는 어떠한가? 지니계수 조사연도 최근 변화",
      datasetIds: [],
    },
    {
      elementId: "A-009",
      displayTitle: "GHG 배출 강도 (GDP 대비, 1인당)",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.1.b.GHG 배출 현황",
      source: "EDGAR + World Bank WDI (가공)",
      question: "경제·인구 규모 대비 온실가스 배출강도는 어느 수준인가?",
      searchText:
        "GHG 배출 강도 (GDP 대비, 1인당) GHG 배출 강도 (GDP 대비, 1인당) A.1.b.GHG 배출 현황 국가 기본정보 EDGAR + World Bank WDI (가공) EDGAR + World Bank WDI (가공) 경제·인구 규모 대비 온실가스 배출강도는 어느 수준인가? GDP 대비 배출강도 1인당 배출량 총배출량",
      datasetIds: [],
    },
    {
      elementId: "A-010",
      displayTitle: "가스 유형별 GHG 배출량 (CO₂/CH₄/N₂O/F-gas)",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.1.b.GHG 배출 현황",
      source: "EDGAR (JRC)",
      question: "CO₂·CH₄·N₂O·F-gas 중 어떤 가스가 배출을 구성하는가?",
      searchText:
        "가스 유형별 GHG 배출량 (CO₂/CH₄/N₂O/F-gas) 가스 유형별 GHG 배출량 (CO₂/CH₄/N₂O/F-gas) A.1.b.GHG 배출 현황 국가 기본정보 EDGAR (JRC) EDGAR (JRC) CO₂·CH₄·N₂O·F-gas 중 어떤 가스가 배출을 구성하는가? CO₂ CH₄ N₂O F-gas",
      datasetIds: [],
    },
    {
      elementId: "A-011",
      displayTitle: "부문별 GHG 배출량 (에너지/산업공정/농업/폐기물)",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.1.b.GHG 배출 현황",
      source: "EDGAR (JRC)",
      question: "에너지·산업·농업·폐기물 중 배출이 어디에서 발생하는가?",
      searchText:
        "부문별 GHG 배출량 (에너지/산업공정/농업/폐기물) 부문별 GHG 배출량 (에너지/산업공정/농업/폐기물) A.1.b.GHG 배출 현황 국가 기본정보 EDGAR (JRC) EDGAR (JRC) 에너지·산업·농업·폐기물 중 배출이 어디에서 발생하는가? 에너지 산업공정 농업 폐기물",
      datasetIds: [],
    },
    {
      elementId: "A-012",
      displayTitle: "총 GHG 배출량 (LULUCF 제외)",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.1.b.GHG 배출 현황",
      source: "EDGAR (JRC)",
      question: "베트남의 총 온실가스 배출량은 어떻게 변화하고 있는가?",
      searchText:
        "총 GHG 배출량 (LULUCF 제외) 총 GHG 배출량 (LULUCF 제외) A.1.b.GHG 배출 현황 국가 기본정보 EDGAR (JRC) EDGAR (JRC) 베트남의 총 온실가스 배출량은 어떻게 변화하고 있는가? 총 GHG 배출량 최근 10년 변화 기준 범위",
      datasetIds: [],
    },
    {
      elementId: "A-013",
      displayTitle: "Climate Watch NDC-SDG linkage",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.1.c.SDG",
      source: "UNDESA SDG Index",
      question: "베트남 NDC의 감축·적응 조치가 어떤 SDG와 연결되는가?",
      searchText:
        "Climate Watch NDC-SDG linkage Climate Watch NDC-SDG linkage A.1.c.SDG 국가 기본정보 UNDESA SDG Index UNDESA SDG Index 베트남 NDC의 감축·적응 조치가 어떤 SDG와 연결되는가? NDC 조치 연결 SDG 연계 근거",
      datasetIds: [],
    },
    {
      elementId: "A-014",
      displayTitle: "UNDESA SDG Index Score",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.1.c.SDG",
      source: "UNDESA SDG Index",
      question: "베트남의 전체 SDG 달성수준은 어느 정도인가?",
      searchText:
        "UNDESA SDG Index Score UNDESA SDG Index Score A.1.c.SDG 국가 기본정보 UNDESA SDG Index UNDESA SDG Index 베트남의 전체 SDG 달성수준은 어느 정도인가? SDG Index Score 세계 순위 최근 변화",
      datasetIds: [],
    },
    {
      elementId: "A-015",
      displayTitle: "UNDESA SDG 세부목표별 달성도",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.1.c.SDG",
      source: "UNDESA SDG Index",
      question: "어떤 SDG에서 상대적으로 진전·과제가 나타나는가?",
      searchText:
        "UNDESA SDG 세부목표별 달성도 UNDESA SDG 세부목표별 달성도 A.1.c.SDG 국가 기본정보 UNDESA SDG Index UNDESA SDG Index 어떤 SDG에서 상대적으로 진전·과제가 나타나는가? SDG 1~17 상태 추세 주요 과제",
      datasetIds: [],
    },
    {
      elementId: "A-016",
      displayTitle: "1차 에너지 소비 구조",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.2.a.에너지·전력 정보",
      source: "Energy Institute / IEA",
      question: "베트남의 1차 에너지 소비는 어떤 에너지원으로 구성되는가?",
      searchText:
        "1차 에너지 소비 구조 1차 에너지 소비 구조 A.2.a.에너지·전력 정보 국가 기본정보 Energy Institute / IEA Energy Institute / IEA 베트남의 1차 에너지 소비는 어떤 에너지원으로 구성되는가? 석탄 석유 가스 재생에너지 기타",
      datasetIds: [],
    },
    {
      elementId: "A-017",
      displayTitle: "LCOE (균등화 발전비용)",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.2.a.에너지·전력 정보",
      source: "IRENA",
      question: "발전기술별 LCOE는 어느 수준이며 비용경쟁력은 어떻게 다른가?",
      searchText:
        "LCOE (균등화 발전비용) LCOE (균등화 발전비용) A.2.a.에너지·전력 정보 국가 기본정보 IRENA IRENA 발전기술별 LCOE는 어느 수준이며 비용경쟁력은 어떻게 다른가? 태양광 LCOE 풍력 LCOE 화력 LCOE 기준연도",
      datasetIds: [],
    },
    {
      elementId: "A-018",
      displayTitle: "기술별 발전 설비용량",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.2.a.에너지·전력 정보",
      source: "IRENA / WRI GPPD",
      question: "기술별 발전설비는 얼마나 설치되어 있고 어떻게 변화하는가?",
      searchText:
        "기술별 발전 설비용량 기술별 발전 설비용량 A.2.a.에너지·전력 정보 국가 기본정보 IRENA / WRI GPPD IRENA / WRI GPPD 기술별 발전설비는 얼마나 설치되어 있고 어떻게 변화하는가? 석탄 가스 수력 태양광 풍력 기타",
      datasetIds: [],
    },
    {
      elementId: "A-019",
      displayTitle: "송배전 손실률 (T&D Loss)",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.2.a.에너지·전력 정보",
      source: "World Bank WDI",
      question: "송배전 손실률은 어느 수준이며 개선·악화 추세는 어떠한가?",
      searchText:
        "송배전 손실률 (T&D Loss) 송배전 손실률 (T&D Loss) A.2.a.에너지·전력 정보 국가 기본정보 World Bank WDI / Indicators API World Bank WDI 송배전 손실률은 어느 수준이며 개선·악화 추세는 어떠한가? 송배전 손실률 최근 10년 변화 비교국 평균 송배전 손실률 World Bank",
      datasetIds: ["renewable-electricity-generated"],
    },
    {
      elementId: "A-020",
      displayTitle: "재생에너지 비중",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.2.a.에너지·전력 정보",
      source: "IRENA / Energy Institute",
      question: "전력생산에서 재생에너지가 차지하는 비중은 어떻게 변하는가?",
      searchText:
        "재생에너지 비중 재생에너지 비중 A.2.a.에너지·전력 정보 국가 기본정보 World Bank WDI / IEA 기반 지표 IRENA / Energy Institute 전력생산에서 재생에너지가 차지하는 비중은 어떻게 변하는가? 재생전력 비중 최근 추세 전원구성 재생에너지 전력 비중 World Bank",
      datasetIds: ["clean-cooking-access-generated"],
    },
    {
      elementId: "A-021",
      displayTitle: "전력 접근률",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.2.a.에너지·전력 정보",
      source: "World Bank WDI",
      question: "전력 접근률과 미접근 격차는 어느 수준인가?",
      searchText:
        "전력 접근률 전력 접근률 A.2.a.에너지·전력 정보 국가 기본정보 World Bank / Tracking SDG7 World Bank WDI 전력 접근률과 미접근 격차는 어느 수준인가? 전력 접근률 미접근 격차 최근 변화 전력 접근률 World Bank",
      datasetIds: ["permitting-example-json"],
    },
    {
      elementId: "A-022",
      displayTitle: "정전빈도 (SAIDI/SAIFI)",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.2.a.에너지·전력 정보",
      source: "World Bank WDI",
      question: "전력공급 신뢰도는 어느 수준이며 정전이 얼마나 빈번한가?",
      searchText:
        "정전빈도 (SAIDI/SAIFI) 정전빈도 (SAIDI/SAIFI) A.2.a.에너지·전력 정보 국가 기본정보 World Bank WDI World Bank WDI 전력공급 신뢰도는 어느 수준이며 정전이 얼마나 빈번한가? SAIDI SAIFI 최근 변화",
      datasetIds: [],
    },
    {
      elementId: "A-023",
      displayTitle: "발전소 위치·용량",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.2.b.에너지·전력 GIS 공간정보",
      source: "WRI GPPD / Global Energy Monitor",
      question: "발전소가 어디에 있고 기술별 용량은 어떻게 분포하는가?",
      searchText:
        "발전소 위치·용량 발전소 위치·용량 A.2.b.에너지·전력 GIS 공간정보 국가 기본정보 WRI GPPD / Global Energy Monitor WRI GPPD / Global Energy Monitor 발전소가 어디에 있고 기술별 용량은 어떻게 분포하는가? 발전소 위치 연료·기술 설비용량 운영상태",
      datasetIds: [],
    },
    {
      elementId: "A-024",
      displayTitle: "전력망 위치·미공급 지역",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.2.b.에너지·전력 GIS 공간정보",
      source: "WRI GPPD / OpenStreetMap",
      question: "전력망이 어디까지 도달하며 미공급 지역은 어디인가?",
      searchText:
        "전력망 위치·미공급 지역 전력망 위치·미공급 지역 A.2.b.에너지·전력 GIS 공간정보 국가 기본정보 WRI GPPD / OpenStreetMap WRI GPPD / OpenStreetMap 전력망이 어디까지 도달하며 미공급 지역은 어디인가? 송전망 배전망 변전소 미공급 지역",
      datasetIds: [],
    },
    {
      elementId: "A-025",
      displayTitle: "CCS 시설",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.3.a.인프라 GIS 공간정보",
      source: "OpenStreetMap",
      question: "CCS 관련 시설·저장·수송 인프라는 어디에 있는가?",
      searchText:
        "CCS 시설 CCS 시설 A.3.a.인프라 GIS 공간정보 국가 기본정보 OpenStreetMap OpenStreetMap CCS 관련 시설·저장·수송 인프라는 어디에 있는가? 포집시설 저장후보지 수송경로 운영상태",
      datasetIds: [],
    },
    {
      elementId: "A-026",
      displayTitle: "건물 풋프린트(Footprint)",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.3.a.인프라 GIS 공간정보",
      source: "OpenStreetMap",
      question: "건물은 어디에 밀집되어 있고 공간적 규모는 어떠한가?",
      searchText:
        "건물 풋프린트(Footprint) 건물 풋프린트(Footprint) A.3.a.인프라 GIS 공간정보 국가 기본정보 OpenStreetMap OpenStreetMap 건물은 어디에 밀집되어 있고 공간적 규모는 어떠한가? 건물 풋프린트 건물 밀도 용도 가용 시 행정구역",
      datasetIds: [],
    },
    {
      elementId: "A-027",
      displayTitle: "교통 인프라(railway O, road)",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.3.a.인프라 GIS 공간정보",
      source: "OpenStreetMap",
      question: "항만·도로·철도 등 물류 인프라는 어디에 있는가?",
      searchText:
        "교통 인프라(railway O, road) 교통 인프라(railway O, road) A.3.a.인프라 GIS 공간정보 국가 기본정보 OpenStreetMap OpenStreetMap 항만·도로·철도 등 물류 인프라는 어디에 있는가? 항만 도로 철도 공항",
      datasetIds: [],
    },
    {
      elementId: "A-028",
      displayTitle: "해안·수자원 인프라",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.3.a.인프라 GIS 공간정보",
      source: "OpenStreetMap / JRC",
      question: "해안·수자원 인프라가 어디에 분포하는가?",
      searchText:
        "해안·수자원 인프라 해안·수자원 인프라 A.3.a.인프라 GIS 공간정보 국가 기본정보 OpenStreetMap / JRC OpenStreetMap / JRC 해안·수자원 인프라가 어디에 분포하는가? 댐·저수지 상하수도 해안시설 수자원시설",
      datasetIds: [],
    },
    {
      elementId: "A-029",
      displayTitle: "FTA 체결 현황",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.4.a.한·개도국 교역액 및 FTA 체결 현황",
      source: "UN Comtrade",
      question: "한국과 베트남 간 FTA·무역협정 기반은 어떻게 구성되어 있는가?",
      searchText:
        "FTA 체결 현황 FTA 체결 현황 A.4.a.한·개도국 교역액 및 FTA 체결 현황 국가 기본정보 UN Comtrade UN Comtrade 한국과 베트남 간 FTA·무역협정 기반은 어떻게 구성되어 있는가? 협정명 발효일 적용범위 관련 관세·원산지",
      datasetIds: [],
    },
    {
      elementId: "A-030",
      displayTitle: "한-개도국 교역액",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.4.a.한·개도국 교역액 및 FTA 체결 현황",
      source: "UN Comtrade",
      question: "한국-베트남 교역규모와 주요 품목은 어떻게 변화하는가?",
      searchText:
        "한-개도국 교역액 한-개도국 교역액 A.4.a.한·개도국 교역액 및 FTA 체결 현황 국가 기본정보 UN Comtrade UN Comtrade 한국-베트남 교역규모와 주요 품목은 어떻게 변화하는가? 총 교역액 한국 수출 한국 수입 주요 품목",
      datasetIds: [],
    },
    {
      elementId: "A-031",
      displayTitle: "물류성과지수 (LPI)",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.4.b.공급망",
      source: "World Bank LPI",
      question: "베트남의 물류 성과는 어느 수준이며 어떤 부문이 약한가?",
      searchText:
        "물류성과지수 (LPI) 물류성과지수 (LPI) A.4.b.공급망 국가 기본정보 World Bank LPI World Bank LPI 베트남의 물류 성과는 어느 수준이며 어떤 부문이 약한가? LPI 총점 세관 인프라 국제운송 추적성 적시성",
      datasetIds: [],
    },
    {
      elementId: "A-032",
      displayTitle: "중간재 교역 규모",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.4.b.공급망",
      source: "OECD TiVA / UN Comtrade",
      question:
        "베트남의 중간재 교역은 어떤 품목·파트너 중심으로 이루어지는가?",
      searchText:
        "중간재 교역 규모 중간재 교역 규모 A.4.b.공급망 국가 기본정보 OECD TiVA / UN Comtrade OECD TiVA / UN Comtrade 베트남의 중간재 교역은 어떤 품목·파트너 중심으로 이루어지는가? 중간재 교역액 주요 품목 주요 파트너 최근 추세",
      datasetIds: [],
    },
    {
      elementId: "A-033",
      displayTitle: "해운 연결성 (LSCI)",
      category: "A",
      categoryLabel: "국가 기본정보",
      dataGroup: "A.4.b.공급망",
      source: "UNCTAD LSCI",
      question: "베트남의 해운 연결성은 어떻게 변화하고 있는가?",
      searchText:
        "해운 연결성 (LSCI) 해운 연결성 (LSCI) A.4.b.공급망 국가 기본정보 UNCTAD LSCI UNCTAD LSCI 베트남의 해운 연결성은 어떻게 변화하고 있는가? LSCI 최근 추세 지역 비교",
      datasetIds: [],
    },
    {
      elementId: "B-001",
      displayTitle: "건기/우기",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.1.a.기후 기초 정보",
      source: "World Bank CCKP",
      question: "베트남의 건기·우기는 언제이며 지역별 계절성이 어떻게 다른가?",
      searchText:
        "건기/우기 건기/우기 B.1.a.기후 기초 정보 기후·환경 World Bank CCKP World Bank CCKP 베트남의 건기·우기는 언제이며 지역별 계절성이 어떻게 다른가? 월별 강수 건기 우기 지역차",
      datasetIds: [],
    },
    {
      elementId: "B-002",
      displayTitle: "기후대(Climate zone),",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.1.a.기후 기초 정보",
      source: "World Bank CCKP",
      question: "베트남은 어떤 기후대에 속하고 지역별로 어떻게 나뉘는가?",
      searchText:
        "기후대(Climate zone), 기후대(Climate zone), B.1.a.기후 기초 정보 기후·환경 World Bank CCKP World Bank CCKP 베트남은 어떤 기후대에 속하고 지역별로 어떻게 나뉘는가? 기후대 지역 고도·해안 구분",
      datasetIds: [],
    },
    {
      elementId: "B-003",
      displayTitle: "연평균 기온·강수",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.1.a.기후 기초 정보",
      source: "World Bank CCKP",
      question: "월별 기온·강수의 평년 패턴은 어떠한가?",
      searchText:
        "연평균 기온·강수 연평균 기온·강수 B.1.a.기후 기초 정보 기후·환경 World Bank CCKP World Bank CCKP 월별 기온·강수의 평년 패턴은 어떠한가? 월평균 기온 월강수량 연평균 기온 연강수량",
      datasetIds: [],
    },
    {
      elementId: "B-004",
      displayTitle:
        "CMIP6 기반 과거/미래 기온(tas, tasmax, tasmin), 강수(pr), 풍속(sfcWind)), 일사량(rsds), 상대습도(hurs)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.1.b.과거·미래 기후",
      source: "World Bank CCKP",
      question: "기온·강수·풍속·일사·습도는 과거 대비 미래에 어떻게 변하는가?",
      searchText:
        "CMIP6 기반 과거/미래 기온(tas, tasmax, tasmin), 강수(pr), 풍속(sfcWind)), 일사량(rsds), 상대습도(hurs) CMIP6 기반 과거/미래 기온(tas, tasmax, tasmin), 강수(pr), 풍속(sfcWind)), 일사량(rsds), 상대습도(hurs) B.1.b.과거·미래 기후 기후·환경 World Bank CCKP World Bank CCKP 기온·강수·풍속·일사·습도는 과거 대비 미래에 어떻게 변하는가? tas/tasmax/tasmin 강수 풍속 일사 상대습도",
      datasetIds: [],
    },
    {
      elementId: "B-005",
      displayTitle: "가뭄: 연속 건조일수(CDD), 표준강수지수(SPEI12), 토양수분",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.1.c.기후 영향 인자",
      source: "World Bank CCKP",
      question: "가뭄 관련 극한지수는 현재·미래에 어떻게 변하는가?",
      searchText:
        "가뭄: 연속 건조일수(CDD), 표준강수지수(SPEI12), 토양수분 가뭄: 연속 건조일수(CDD), 표준강수지수(SPEI12), 토양수분 B.1.c.기후 영향 인자 기후·환경 World Bank CCKP World Bank CCKP 가뭄 관련 극한지수는 현재·미래에 어떻게 변하는가? CDD SPEI12 토양수분",
      datasetIds: [],
    },
    {
      elementId: "B-006",
      displayTitle:
        "폭염: 폭염일수(TX35, TX40), 열대야(TR20, TR25), Heat Index(HI35))",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.1.c.기후 영향 인자",
      source: "World Bank CCKP",
      question: "폭염 관련 극한지수는 현재·미래에 어떻게 변하는가?",
      searchText:
        "폭염: 폭염일수(TX35, TX40), 열대야(TR20, TR25), Heat Index(HI35)) 폭염: 폭염일수(TX35, TX40), 열대야(TR20, TR25), Heat Index(HI35)) B.1.c.기후 영향 인자 기후·환경 World Bank Climate Change Knowledge Portal World Bank CCKP 폭염 관련 극한지수는 현재·미래에 어떻게 변하는가? TX35/TX40 TR20/TR25 HI35 고온체감 35°C 이상 일수 World Bank Climate Change Knowledge Portal",
      datasetIds: ["natural-earth-source"],
    },
    {
      elementId: "B-007",
      displayTitle:
        "홍수: 최대 1일/5일 강수(RX1day, RX5day), 호우일수(R20mm, R50mm), 연속 습윤일수(CWD))",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.1.c.기후 영향 인자",
      source: "World Bank CCKP",
      question: "홍수·극한강수 관련 극한지수는 현재·미래에 어떻게 변하는가?",
      searchText:
        "홍수: 최대 1일/5일 강수(RX1day, RX5day), 호우일수(R20mm, R50mm), 연속 습윤일수(CWD)) 홍수: 최대 1일/5일 강수(RX1day, RX5day), 호우일수(R20mm, R50mm), 연속 습윤일수(CWD)) B.1.c.기후 영향 인자 기후·환경 World Bank CCKP World Bank CCKP 홍수·극한강수 관련 극한지수는 현재·미래에 어떻게 변하는가? RX1day/RX5day R20mm/R50mm CWD 홍수 취약지역 원천 및 방법론 확정 중",
      datasetIds: ["solar-ghi-generated"],
    },
    {
      elementId: "B-008",
      displayTitle: "NASA 해수면 상승 전망 (SSP 1~5)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.1.d.해수면 상승 전망",
      source: "NASA Sea Level Projection / IPCC AR6",
      question: "SSP별 해수면 상승 전망은 어떻게 달라지는가?",
      searchText:
        "NASA 해수면 상승 전망 (SSP 1~5) NASA 해수면 상승 전망 (SSP 1~5) B.1.d.해수면 상승 전망 기후·환경 NASA Sea Level Projection / IPCC AR6 NASA Sea Level Projection / IPCC AR6 SSP별 해수면 상승 전망은 어떻게 달라지는가? SSP1~5 2030/2050/2100 불확실성 범위",
      datasetIds: [],
    },
    {
      elementId: "B-009",
      displayTitle: "WWF 생물다양성·기후 리스크",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.2.a.물리적 리스크",
      source: "ND-GAIN",
      question: "베트남의 생물다양성·기후 리스크 수준과 구성요인은 무엇인가?",
      searchText:
        "WWF 생물다양성·기후 리스크 WWF 생물다양성·기후 리스크 B.2.a.물리적 리스크 기후·환경 ND-GAIN ND-GAIN 베트남의 생물다양성·기후 리스크 수준과 구성요인은 무엇인가? 현재 점수 순위/비교 구성요인 최근 변화",
      datasetIds: [],
    },
    {
      elementId: "B-010",
      displayTitle: "기후 리스크 지수 (CRI)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.2.a.물리적 리스크",
      source: "GermanWatch CRI",
      question: "베트남의 기후 리스크 지수 수준과 구성요인은 무엇인가?",
      searchText:
        "기후 리스크 지수 (CRI) 기후 리스크 지수 (CRI) B.2.a.물리적 리스크 기후·환경 GermanWatch CRI GermanWatch CRI 베트남의 기후 리스크 지수 수준과 구성요인은 무엇인가? 현재 점수 순위/비교 구성요인 최근 변화",
      datasetIds: [],
    },
    {
      elementId: "B-011",
      displayTitle: "기후 취약성 지수 (ND-GAIN)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.2.a.물리적 리스크",
      source: "ND-GAIN",
      question: "베트남의 ND-GAIN 취약성 수준과 구성요인은 무엇인가?",
      searchText:
        "기후 취약성 지수 (ND-GAIN) 기후 취약성 지수 (ND-GAIN) B.2.a.물리적 리스크 기후·환경 ND-GAIN ND-GAIN 베트남의 ND-GAIN 취약성 수준과 구성요인은 무엇인가? 현재 점수 순위/비교 구성요인 최근 변화",
      datasetIds: [],
    },
    {
      elementId: "B-012",
      displayTitle: "재해·재난 이력 (EM-DAT)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.2.a.물리적 리스크",
      source: "EM-DAT",
      question: "최근 주요 재해는 언제·어디서 발생했고 피해는 어느 정도였는가?",
      searchText:
        "재해·재난 이력 (EM-DAT) 재해·재난 이력 (EM-DAT) B.2.a.물리적 리스크 기후·환경 EM-DAT EM-DAT 최근 주요 재해는 언제·어디서 발생했고 피해는 어느 정도였는가? 재해유형 발생일 지역 사망·피해인구 경제손실",
      datasetIds: [],
    },
    {
      elementId: "B-013",
      displayTitle: "World Bank CBAM 영향 지수",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.2.b.전환 리스크",
      source: "World Bank WDI",
      question: "CBAM 노출이 큰 산업·수출 품목은 무엇인가?",
      searchText:
        "World Bank CBAM 영향 지수 World Bank CBAM 영향 지수 B.2.b.전환 리스크 기후·환경 World Bank WDI World Bank WDI CBAM 노출이 큰 산업·수출 품목은 무엇인가? CBAM 노출지수 대상품목 대EU 수출 산업별 노출",
      datasetIds: [],
    },
    {
      elementId: "B-014",
      displayTitle: "World Bank CCDR(Country Climate and Development) 내 \\\\",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.2.b.전환 리스크",
      source: "World Bank CCDR",
      question: "탄소가격 시나리오가 배출·GDP·세수에 어떤 영향을 주는가?",
      searchText:
        'World Bank CCDR(Country Climate and Development) 내 "탄소세 시뮬레이션 결과(배출감소율, GDP 영향, 세수 효과) World Bank CCDR(Country Climate and Development) 내 "탄소세 시뮬레이션 결과(배출감소율, GDP 영향, 세수 효과) B.2.b.전환 리스크 기후·환경 World Bank CCDR World Bank CCDR 탄소가격 시나리오가 배출·GDP·세수에 어떤 영향을 주는가? 탄소가격 배출감소율 GDP 영향 세수 효과',
      datasetIds: [],
    },
    {
      elementId: "B-015",
      displayTitle: "탄소 가격 수준 (ETS, Carbon Tax)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.2.b.전환 리스크",
      source: "World Bank WDI",
      question: "탄소세·ETS가 도입되어 있고 가격은 어느 수준인가?",
      searchText:
        "탄소 가격 수준 (ETS, Carbon Tax) 탄소 가격 수준 (ETS, Carbon Tax) B.2.b.전환 리스크 기후·환경 World Bank WDI World Bank WDI 탄소세·ETS가 도입되어 있고 가격은 어느 수준인가? 제도유형 가격/세율 대상부문 시행상태",
      datasetIds: [],
    },
    {
      elementId: "B-016",
      displayTitle:
        "화석연료 의존도(Fossil fuel energy consumption (% of total))",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.2.b.전환 리스크",
      source: "World Bank WDI",
      question: "에너지 소비에서 화석연료 의존도는 어떻게 변하고 있는가?",
      searchText:
        "화석연료 의존도(Fossil fuel energy consumption (% of total)) 화석연료 의존도(Fossil fuel energy consumption (% of total)) B.2.b.전환 리스크 기후·환경 World Bank WDI World Bank WDI 에너지 소비에서 화석연료 의존도는 어떻게 변하고 있는가? 화석연료 비중 최근 추세 에너지원 구성",
      datasetIds: [],
    },
    {
      elementId: "B-017",
      displayTitle: "WRI Aqueduct 물 스트레스 지수",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.3.a.수자원 취약성",
      source: "WRI AQUEDUCT",
      question: "물 스트레스가 높은 지역은 어디이며 수준은 어떠한가?",
      searchText:
        "WRI Aqueduct 물 스트레스 지수 WRI Aqueduct 물 스트레스 지수 B.3.a.수자원 취약성 기후·환경 WRI AQUEDUCT WRI AQUEDUCT 물 스트레스가 높은 지역은 어디이며 수준은 어떠한가? 물 스트레스 등급 유역 수요/공급 계절성",
      datasetIds: [],
    },
    {
      elementId: "B-018",
      displayTitle: "SSP GDP(PPP, PPP per cap) 전망 (SSP 1~5)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.3.b.SSP(공유 사회 경제 경로)기반 사회경제적 리스크",
      source: "IIASA",
      question: "SSP별 GDP·1인당 GDP 전망은 어떻게 달라지는가?",
      searchText:
        "SSP GDP(PPP, PPP per cap) 전망 (SSP 1~5) SSP GDP(PPP, PPP per cap) 전망 (SSP 1~5) B.3.b.SSP(공유 사회 경제 경로)기반 사회경제적 리스크 기후·환경 IIASA IIASA SSP별 GDP·1인당 GDP 전망은 어떻게 달라지는가? SSP1~5 GDP 1인당 GDP 2030/2050/2100",
      datasetIds: [],
    },
    {
      elementId: "B-019",
      displayTitle: "SSP 인구 전망 (SSP 1~5)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.3.b.SSP(공유 사회 경제 경로)기반 사회경제적 리스크",
      source: "IIASA",
      question: "SSP별 인구 전망은 어떻게 달라지는가?",
      searchText:
        "SSP 인구 전망 (SSP 1~5) SSP 인구 전망 (SSP 1~5) B.3.b.SSP(공유 사회 경제 경로)기반 사회경제적 리스크 기후·환경 IIASA IIASA SSP별 인구 전망은 어떻게 달라지는가? SSP1~5 인구 2030/2050/2100 증감률",
      datasetIds: [],
    },
    {
      elementId: "B-020",
      displayTitle: "EU/UN INFORM Risk Index (복합 리스크 지수)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.3.c.기타 관련 지표",
      source: "EU INFORM",
      question: "INFORM Risk Index로 본 베트남의 중장기 위험은 어느 수준인가?",
      searchText:
        "EU/UN INFORM Risk Index (복합 리스크 지수) EU/UN INFORM Risk Index (복합 리스크 지수) B.3.c.기타 관련 지표 기후·환경 EU INFORM EU INFORM INFORM Risk Index로 본 베트남의 중장기 위험은 어느 수준인가? 현재값 구성요인/시나리오 비교 기준연도",
      datasetIds: [],
    },
    {
      elementId: "B-021",
      displayTitle: "Global Data Lab의 GVI, Vulnerability Index",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.3.c.기타 관련 지표",
      source: "Scientific Data (Huisman et al., 2025)",
      question:
        "GVI Vulnerability Index로 본 베트남의 중장기 위험은 어느 수준인가?",
      searchText:
        "Global Data Lab의 GVI, Vulnerability Index Global Data Lab의 GVI, Vulnerability Index B.3.c.기타 관련 지표 기후·환경 Scientific Data (Huisman et al., 2025) Scientific Data (Huisman et al., 2025) GVI Vulnerability Index로 본 베트남의 중장기 위험은 어느 수준인가? 현재값 구성요인/시나리오 비교 기준연도",
      datasetIds: [],
    },
    {
      elementId: "B-022",
      displayTitle:
        "World Bank CCDR(Country Climate and Development)의 기후 피해 경제적 비용 (GDP 대비 %)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.3.c.기타 관련 지표",
      source: "World Bank CCDR",
      question: "기후피해 경제비용로 본 베트남의 중장기 위험은 어느 수준인가?",
      searchText:
        "World Bank CCDR(Country Climate and Development)의 기후 피해 경제적 비용 (GDP 대비 %) World Bank CCDR(Country Climate and Development)의 기후 피해 경제적 비용 (GDP 대비 %) B.3.c.기타 관련 지표 기후·환경 World Bank CCDR World Bank CCDR 기후피해 경제비용로 본 베트남의 중장기 위험은 어느 수준인가? 현재값 구성요인/시나리오 비교 기준연도",
      datasetIds: [],
    },
    {
      elementId: "B-023",
      displayTitle: "건기/우기 유량 차이",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.a.수문학",
      source: "HydroSHEDS / FAO AQUASTAT",
      question: "건기·우기 하천유량 차이는 어느 정도인가?",
      searchText:
        "건기/우기 유량 차이 건기/우기 유량 차이 B.4.a.수문학 기후·환경 HydroSHEDS / FAO AQUASTAT HydroSHEDS / FAO AQUASTAT 건기·우기 하천유량 차이는 어느 정도인가? 건기 유량 우기 유량 계절변동률 관측지점",
      datasetIds: [],
    },
    {
      elementId: "B-024",
      displayTitle: "농업 용수 비중(%)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.a.수문학",
      source: "HydroSHEDS / FAO AQUASTAT",
      question: "물 사용에서 농업용수가 차지하는 비중은 어느 정도인가?",
      searchText:
        "농업 용수 비중(%) 농업 용수 비중(%) B.4.a.수문학 기후·환경 HydroSHEDS / FAO AQUASTAT HydroSHEDS / FAO AQUASTAT 물 사용에서 농업용수가 차지하는 비중은 어느 정도인가? 농업용수 비중 산업용수 생활용수 최근 추세",
      datasetIds: [],
    },
    {
      elementId: "B-025",
      displayTitle: "유역 면적(km²)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.a.수문학",
      source: "HydroSHEDS / FAO AQUASTAT",
      question: "주요 유역의 규모와 공간범위는 어떻게 구성되는가?",
      searchText:
        "유역 면적(km²) 유역 면적(km²) B.4.a.수문학 기후·환경 HydroSHEDS / FAO AQUASTAT HydroSHEDS / FAO AQUASTAT 주요 유역의 규모와 공간범위는 어떻게 구성되는가? 유역명 면적 주요 하천 행정구역",
      datasetIds: [],
    },
    {
      elementId: "B-026",
      displayTitle: "유향(flow direction)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.a.수문학",
      source: "HydroSHEDS / FAO AQUASTAT",
      question: "하천의 유향·배수 네트워크는 어떻게 연결되는가?",
      searchText:
        "유향(flow direction) 유향(flow direction) B.4.a.수문학 기후·환경 HydroSHEDS / FAO AQUASTAT HydroSHEDS / FAO AQUASTAT 하천의 유향·배수 네트워크는 어떻게 연결되는가? 유향 하천망 상·하류 관계 유역",
      datasetIds: [],
    },
    {
      elementId: "B-027",
      displayTitle: "지하수 잠재량(m³/yr)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.a.수문학",
      source: "HydroSHEDS / FAO AQUASTAT",
      question: "지하수 잠재량과 지역 분포는 어떠한가?",
      searchText:
        "지하수 잠재량(m³/yr) 지하수 잠재량(m³/yr) B.4.a.수문학 기후·환경 HydroSHEDS / FAO AQUASTAT HydroSHEDS / FAO AQUASTAT 지하수 잠재량과 지역 분포는 어떠한가? 지하수 잠재량 대수층/지역 취수량 재충전",
      datasetIds: [],
    },
    {
      elementId: "B-028",
      displayTitle: "하천 유량(m³/s)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.a.수문학",
      source: "HydroSHEDS / FAO AQUASTAT",
      question: "주요 하천 유량은 어디에서 얼마나 발생하는가?",
      searchText:
        "하천 유량(m³/s) 하천 유량(m³/s) B.4.a.수문학 기후·환경 HydroSHEDS / FAO AQUASTAT HydroSHEDS / FAO AQUASTAT 주요 하천 유량은 어디에서 얼마나 발생하는가? 하천명/지점 유량 계절 기간",
      datasetIds: [],
    },
    {
      elementId: "B-029",
      displayTitle: "산림 유형별 면적(열대우림/맹그로브/이탄지 등),",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.b.산림",
      source: "Global Forest Watch / Hansen",
      question: "산림 유형은 어디에 얼마나 분포하는가?",
      searchText:
        "산림 유형별 면적(열대우림/맹그로브/이탄지 등), 산림 유형별 면적(열대우림/맹그로브/이탄지 등), B.4.b.산림 기후·환경 Global Forest Watch / Hansen Global Forest Watch / Hansen 산림 유형은 어디에 얼마나 분포하는가? 열대우림 맹그로브 이탄지 기타 산림",
      datasetIds: [],
    },
    {
      elementId: "B-030",
      displayTitle: "산림 이득(ha/yr)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.b.산림",
      source: "Global Forest Watch / Hansen",
      question: "산림 이득은 어디에서 얼마나 발생하는가?",
      searchText:
        "산림 이득(ha/yr) 산림 이득(ha/yr) B.4.b.산림 기후·환경 Global Forest Watch / Hansen Global Forest Watch / Hansen 산림 이득은 어디에서 얼마나 발생하는가? 연간 산림 이득 지역 최근 추세",
      datasetIds: [],
    },
    {
      elementId: "B-031",
      displayTitle: "산림 총 면적(ha)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.b.산림",
      source: "Global Forest Watch / Hansen",
      question: "전체 산림면적은 얼마이며 어떻게 변하는가?",
      searchText:
        "산림 총 면적(ha) 산림 총 면적(ha) B.4.b.산림 기후·환경 Global Forest Watch / Hansen Global Forest Watch / Hansen 전체 산림면적은 얼마이며 어떻게 변하는가? 산림 총면적 국토 대비 비율 최근 추세",
      datasetIds: [],
    },
    {
      elementId: "B-032",
      displayTitle: "수관 피복률(%)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.b.산림",
      source: "Global Forest Watch / Hansen",
      question: "수관피복률과 고밀도 산림지역은 어디인가?",
      searchText:
        "수관 피복률(%) 수관 피복률(%) B.4.b.산림 기후·환경 Global Forest Watch / Hansen Global Forest Watch / Hansen 수관피복률과 고밀도 산림지역은 어디인가? 수관피복률 임계치별 면적 지역",
      datasetIds: [],
    },
    {
      elementId: "B-033",
      displayTitle: "연간 산림 손실(ha/yr)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.b.산림",
      source: "Global Forest Watch / Hansen",
      question: "연간 산림손실은 어디에서 얼마나 발생하는가?",
      searchText:
        "연간 산림 손실(ha/yr) 연간 산림 손실(ha/yr) B.4.b.산림 기후·환경 Global Forest Watch / Hansen Global Forest Watch / Hansen 연간 산림손실은 어디에서 얼마나 발생하는가? 연간 손실면적 손실률 지역 최근 추세",
      datasetIds: [],
    },
    {
      elementId: "B-034",
      displayTitle: "탄소 저장량(tC/ha)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.b.산림",
      source: "Global Forest Watch / Hansen",
      question: "산림 탄소저장량은 어디에 얼마나 분포하는가?",
      searchText:
        "탄소 저장량(tC/ha) 탄소 저장량(tC/ha) B.4.b.산림 기후·환경 Global Forest Watch / Hansen Global Forest Watch / Hansen 산림 탄소저장량은 어디에 얼마나 분포하는가? tC/ha 총 탄소저장량 지역 산림유형",
      datasetIds: [],
    },
    {
      elementId: "B-035",
      displayTitle: "LULUCF 관련 면적 변화",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.c.토지이용",
      source: "ESA WorldCover / FAOSTAT",
      question: "LULUCF 관련 토지면적은 어떻게 변화하고 있는가?",
      searchText:
        "LULUCF 관련 면적 변화 LULUCF 관련 면적 변화 B.4.c.토지이용 기후·환경 ESA WorldCover / FAOSTAT ESA WorldCover / FAOSTAT LULUCF 관련 토지면적은 어떻게 변화하고 있는가? 산림→기타 기타→산림 농경지 변화 변화면적",
      datasetIds: [],
    },
    {
      elementId: "B-036",
      displayTitle: "토지이용 변화율(%/yr)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.c.토지이용",
      source: "ESA WorldCover / FAOSTAT",
      question: "토지이용 변화율이 높은 지역은 어디인가?",
      searchText:
        "토지이용 변화율(%/yr) 토지이용 변화율(%/yr) B.4.c.토지이용 기후·환경 ESA WorldCover / FAOSTAT ESA WorldCover / FAOSTAT 토지이용 변화율이 높은 지역은 어디인가? 변화율 변화유형 지역 기간",
      datasetIds: [],
    },
    {
      elementId: "B-037",
      displayTitle: "토지피복 분류별 면적(경작지/산림/초지/건물/수체/나지, ha)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.c.토지이용",
      source: "ESA WorldCover / FAOSTAT",
      question: "경작지·산림·초지·건물·수체 등 토지피복은 어떻게 구성되는가?",
      searchText:
        "토지피복 분류별 면적(경작지/산림/초지/건물/수체/나지, ha) 토지피복 분류별 면적(경작지/산림/초지/건물/수체/나지, ha) B.4.c.토지이용 기후·환경 ESA WorldCover / FAOSTAT ESA WorldCover / FAOSTAT 경작지·산림·초지·건물·수체 등 토지피복은 어떻게 구성되는가? 경작지 산림 초지 건물 수체 나지",
      datasetIds: [],
    },
    {
      elementId: "B-038",
      displayTitle:
        "바이오매스 자원 가용량 (농업잔재/임업잔재/도시폐기물/축산폐기물)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.d.에너지 자원량",
      source: "Energy Institute / IRENA Global Atlas",
      question: "베트남의 바이오매스 자원은 어디에 얼마나 분포하는가?",
      searchText:
        "바이오매스 자원 가용량 (농업잔재/임업잔재/도시폐기물/축산폐기물) 바이오매스 자원 가용량 (농업잔재/임업잔재/도시폐기물/축산폐기물) B.4.d.에너지 자원량 기후·환경 Energy Institute / IRENA Global Atlas Energy Institute / IRENA Global Atlas 베트남의 바이오매스 자원은 어디에 얼마나 분포하는가? 농업잔재 임업잔재 도시폐기물 축산폐기물",
      datasetIds: [],
    },
    {
      elementId: "B-039",
      displayTitle: "수력 잠재량",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.d.에너지 자원량",
      source: "IRENA Global Atlas",
      question: "베트남의 수력 자원은 어디에 얼마나 분포하는가?",
      searchText:
        "수력 잠재량 수력 잠재량 B.4.d.에너지 자원량 기후·환경 IRENA Global Atlas IRENA Global Atlas 베트남의 수력 자원은 어디에 얼마나 분포하는가? 기술적 잠재량 미개발 잠재량 유역/지점 기존설비",
      datasetIds: [],
    },
    {
      elementId: "B-040",
      displayTitle: "지열 잠재량",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.d.에너지 자원량",
      source: "IRENA Global Atlas / IGA",
      question: "베트남의 지열 자원은 어디에 얼마나 분포하는가?",
      searchText:
        "지열 잠재량 지열 잠재량 B.4.d.에너지 자원량 기후·환경 IRENA Global Atlas / IGA IRENA Global Atlas / IGA 베트남의 지열 자원은 어디에 얼마나 분포하는가? 잠재지역 온도/열류량 기술적 잠재량 기존개발",
      datasetIds: [],
    },
    {
      elementId: "B-041",
      displayTitle: "태양광 관련 지표 (GHI, DNI)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.d.에너지 자원량",
      source: "IRENA Global Atlas",
      question: "베트남의 태양광 자원은 어디에 얼마나 분포하는가?",
      searchText:
        "태양광 관련 지표 (GHI, DNI) 태양광 관련 지표 (GHI, DNI) B.4.d.에너지 자원량 기후·환경 World Bank / ESMAP / Solargis IRENA Global Atlas 베트남의 태양광 자원은 어디에 얼마나 분포하는가? GHI DNI PVOUT 지역 분포 태양광 발전 잠재량(PVOUT) 수평면 전일사량(GHI) World Bank · ESMAP · Solargis World Bank · ESMAP · Solargis",
      datasetIds: ["cckp-hi35-generated", "solar-pvout-generated"],
    },
    {
      elementId: "B-042",
      displayTitle: "풍력 자원 (풍속, 에너지밀도)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.d.에너지 자원량",
      source: "IRENA Global Atlas",
      question: "베트남의 풍력 자원은 어디에 얼마나 분포하는가?",
      searchText:
        "풍력 자원 (풍속, 에너지밀도) 풍력 자원 (풍속, 에너지밀도) B.4.d.에너지 자원량 기후·환경 IRENA Global Atlas IRENA Global Atlas 베트남의 풍력 자원은 어디에 얼마나 분포하는가? 풍속 에너지밀도 고도 지역 분포",
      datasetIds: [],
    },
    {
      elementId: "B-043",
      displayTitle: "화석연료 자원량 (석탄, 석유, LNG 등)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.d.에너지 자원량",
      source: "Energy Institute",
      question: "베트남의 화석연료 자원은 어디에 얼마나 분포하는가?",
      searchText:
        "화석연료 자원량 (석탄, 석유, LNG 등) 화석연료 자원량 (석탄, 석유, LNG 등) B.4.d.에너지 자원량 기후·환경 Energy Institute Energy Institute 베트남의 화석연료 자원은 어디에 얼마나 분포하는가? 석탄 석유 가스/LNG 매장량",
      datasetIds: [],
    },
    {
      elementId: "B-044",
      displayTitle: "광물명(리튬/코발트/니켈/구리/희토류/망간)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.e.광물 자원량",
      source: "USGS Mineral Commodity Summaries",
      question: "기후기술 공급망에 관련된 어떤 핵심광물이 존재하는가?",
      searchText:
        "광물명(리튬/코발트/니켈/구리/희토류/망간) 광물명(리튬/코발트/니켈/구리/희토류/망간) B.4.e.광물 자원량 기후·환경 USGS Mineral Commodity Summaries USGS Mineral Commodity Summaries 기후기술 공급망에 관련된 어떤 핵심광물이 존재하는가? 리튬 코발트 니켈 구리 희토류 망간",
      datasetIds: [],
    },
    {
      elementId: "B-045",
      displayTitle: "글로벌 순위",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.e.광물 자원량",
      source: "USGS Mineral Commodity Summaries",
      question: "핵심광물별 글로벌 생산·매장량 순위는 어느 수준인가?",
      searchText:
        "글로벌 순위 글로벌 순위 B.4.e.광물 자원량 기후·환경 USGS Mineral Commodity Summaries USGS Mineral Commodity Summaries 핵심광물별 글로벌 생산·매장량 순위는 어느 수준인가? 광물명 글로벌 순위 기준연도",
      datasetIds: [],
    },
    {
      elementId: "B-046",
      displayTitle: "매장량(확인/추정, tonnes)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.e.광물 자원량",
      source: "USGS Mineral Commodity Summaries",
      question: "핵심광물의 확인·추정 매장량은 어느 정도인가?",
      searchText:
        "매장량(확인/추정, tonnes) 매장량(확인/추정, tonnes) B.4.e.광물 자원량 기후·환경 USGS Mineral Commodity Summaries USGS Mineral Commodity Summaries 핵심광물의 확인·추정 매장량은 어느 정도인가? 광물명 확인 매장량 추정 매장량 단위",
      datasetIds: [],
    },
    {
      elementId: "B-047",
      displayTitle: "연간 생산량(tonnes/yr)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.e.광물 자원량",
      source: "USGS Mineral Commodity Summaries",
      question: "핵심광물 생산량은 얼마나 되고 어떻게 변하는가?",
      searchText:
        "연간 생산량(tonnes/yr) 연간 생산량(tonnes/yr) B.4.e.광물 자원량 기후·환경 USGS Mineral Commodity Summaries USGS Mineral Commodity Summaries 핵심광물 생산량은 얼마나 되고 어떻게 변하는가? 광물명 연간 생산량 최근 추세 글로벌 비중",
      datasetIds: [],
    },
    {
      elementId: "B-048",
      displayTitle: "주요 광산 위치(가용 시 좌표)",
      category: "B",
      categoryLabel: "기후·환경",
      dataGroup: "B.4.e.광물 자원량",
      source: "USGS Mineral Commodity Summaries",
      question: "주요 핵심광산은 어디에 위치하는가?",
      searchText:
        "주요 광산 위치(가용 시 좌표) 주요 광산 위치(가용 시 좌표) B.4.e.광물 자원량 기후·환경 USGS Mineral Commodity Summaries USGS Mineral Commodity Summaries 주요 핵심광산은 어디에 위치하는가? 광산명 광물 좌표 운영상태 생산량",
      datasetIds: [],
    },
    {
      elementId: "C-001",
      displayTitle: "제출 이력(제출년도/버전)",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.1.a.NDC (국가 온실가스 감축 목표)",
      source: "UNFCCC NDC Registry",
      question:
        "선택 국가의 NDC에서 어떤 감축·적응 목표와 기술·정책수단을 공식적으로 제시하는가?",
      searchText:
        "제출 이력(제출년도/버전)\nBAU 배출 전망(2030, MtCO₂e)\n감축 목표(무조건부/조건부, %)\n부문별 감축 전략·수단 목록\nNDC-SDG 연계 매핑, 적응 부문 목표\n이행 재원 소요(USD)\n기준연도, 대상 GHG, 대상 부문\n원본 링크(URL) 제출 이력(제출년도/버전) C.1.a.NDC (국가 온실가스 감축 목표) 정책·제도 UNFCCC NDC Registry Climate Watch 선택 국가의 NDC에서 어떤 감축·적응 목표와 기술·정책수단을 공식적으로 제시하는가? 제출 이력 무조건부/조건부 감축목표 부문별 수단 적응 목표 재원 소요 원문 근거 NDC 제출·목표·기술근거 UNFCCC NDC Registry",
      datasetIds: ["LDC-DS-C-001"],
    },
    {
      elementId: "C-002",
      displayTitle: "제출 이력(제출년도/문서 링크)",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.1.b.BTR (격년투명성보고서, 舊 BUR)",
      source: "UNFCCC BTR",
      question:
        "BTR에서 실제 배출·NDC 이행·지원 수요는 어떻게 보고되고 있는가?",
      searchText:
        "제출 이력(제출년도/문서 링크)\nGHG 총배출량(incl./excl. LULUCF, MtCO₂e, 시계열)\n부문별 배출량 (에너지/IPPU/농업/FOLU/폐기물),\nNDC 감축 달성량(부문별 ktCO₂e)\nSSP별 기온/강수 전망\n극한기후지수 변화\nGDP 손실 추정(%)\n적응 이행 프로그램 수\n재정 지원 수요/수혜(USD)\n원본 링크(URL) 제출 이력(제출년도/문서 링크) C.1.b.BTR (격년투명성보고서, 舊 BUR) 정책·제도 UNFCCC BTR UNFCCC BTR BTR에서 실제 배출·NDC 이행·지원 수요는 어떻게 보고되고 있는가? 제출 이력 GHG 시계열 부문별 배출 NDC 이행량 재정 지원 수요·수혜",
      datasetIds: ["LDC-DS-C-002-BTR"],
    },
    {
      elementId: "C-003",
      displayTitle: "제출 이력(제출년도/문서 링크)",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.1.c.NAP (국가 적응 계획)",
      source: "UNFCCC NAP",
      question: "NAP에서 어떤 취약부문·적응조치·투자수요를 우선하는가?",
      searchText:
        "제출 이력(제출년도/문서 링크)\n부문별 취약성 평가(등급)\n적응 우선 분야\n적응 우선 조치 목록(단기/중기/장기)\n부문별 적응 투자 소요(USD)\n적응 거버넌스 체계\nM&E 지표 체계\n이해관계자·젠더 분석\n원본 링크(URL) 제출 이력(제출년도/문서 링크) C.1.c.NAP (국가 적응 계획) 정책·제도 UNFCCC NAP UNFCCC NAP NAP에서 어떤 취약부문·적응조치·투자수요를 우선하는가? 취약성 우선분야 단·중·장기 조치 투자소요 거버넌스 M&E",
      datasetIds: ["LDC-DS-C-003-NAP"],
    },
    {
      elementId: "C-004",
      displayTitle: "장기 배출 경로(2050, BAU/감축/넷제로 시나리오별 MtCO₂e)",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.1.d.LT-LEDS (장기 저탄소 발전 전략)",
      source: "UNFCCC Long-term strategies portal",
      question: "2050 장기전략에서 어떤 탈탄소 경로와 핵심기술을 제시하는가?",
      searchText:
        "장기 배출 경로(2050, BAU/감축/넷제로 시나리오별 MtCO₂e)\n넷제로 목표 연도/범위\n에너지 믹스 전망(2050, RE/화석/원자력 %)\n부문별 탈탄소 경로\n핵심 감축 기술 목록\n공정전환 전략\n탄소 흡수/제거 목표(MtCO₂e)\n장기 투자 소요(USD)\n원본 링크(URL) 장기 배출 경로(2050, BAU/감축/넷제로 시나리오별 MtCO₂e) C.1.d.LT-LEDS (장기 저탄소 발전 전략) 정책·제도 UNFCCC Long-term strategies portal UNFCCC Long-term strategies portal 2050 장기전략에서 어떤 탈탄소 경로와 핵심기술을 제시하는가? 넷제로 목표 장기 배출경로 에너지믹스 부문별 경로 핵심기술 투자소요",
      datasetIds: ["LDC-DS-C-004-LTLEDS"],
    },
    {
      elementId: "C-005",
      displayTitle: "TNA/TAP 우선기술·장벽·Project Idea",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.1.e.TNA (기술 수요 평가)",
      source: "UNFCCC TNA",
      question:
        "TNA에서 선택 국가가 자체적으로 우선순위로 제시한 기술과 장벽은 무엇인가?",
      searchText:
        "수행 여부/수행 연도\n감축/적응 우선순위 기술 목록(기술명/부문/명시순위)\n38대 기후기술 원문검증 매핑\n기술 이전 장벽(Barrier Analysis 결과)\nTAP·Project Idea·이행기관·재원 단서\n원문 페이지·표·문장 근거\n원본 링크(URL) TNA TAP technology needs 우선기술 기술수요 기술이전 장벽 project idea 38대 기후기술 원문근거",
      datasetIds: ["LDC-DS-C-005-TNA"],
    },
    {
      elementId: "C-006",
      displayTitle: "ITMO 양자 협정 체결국, 체결 일자, 대상 부문/기술",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.1.e.파리협정 제6.2조/제6.4조 이행 체계·현황",
      source: "UNFCCC / Climate Watch",
      question: "Article 6.2/6.4 이행체계와 ITMO 이전 준비도는 어느 수준인가?",
      searchText:
        "ITMO 양자 협정 체결국, 체결 일자, 대상 부문/기술\nITMO 양자 협정 승인 기관(Authorization Body)\nITMO 이전 실적(tCO₂e)\n상응조정(Corresponding Adjustment) 체계 구축 여부\n국가 레지스트리 존재 여부 및 UNFCCC 연동 상태 ITMO 양자 협정 체결국, 체결 일자, 대상 부문/기술 C.1.e.파리협정 제6.2조/제6.4조 이행 체계·현황 정책·제도 UNFCCC / Climate Watch UNFCCC / Climate Watch Article 6.2/6.4 이행체계와 ITMO 이전 준비도는 어느 수준인가? 양자협정 승인기관 ITMO 이전실적 상응조정 국가 레지스트리",
      datasetIds: [],
    },
    {
      elementId: "C-007",
      displayTitle:
        "참여 여부, 등록된 활동명, 대상 분야(감축/적응/재정/기술/역량), 참여 기관, 등록 일자, 원본 링크(URL)",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.1.f.파리협정 제6.8조 비시장 접근법 참여 현황",
      source: "UNFCCC NMA Platform",
      question: "Article 6.8 비시장 접근법에 어떤 활동으로 참여하고 있는가?",
      searchText:
        "참여 여부, 등록된 활동명, 대상 분야(감축/적응/재정/기술/역량), 참여 기관, 등록 일자, 원본 링크(URL) 참여 여부, 등록된 활동명, 대상 분야(감축/적응/재정/기술/역량), 참여 기관, 등록 일자, 원본 링크(URL) C.1.f.파리협정 제6.8조 비시장 접근법 참여 현황 정책·제도 UNFCCC NMA Platform UNFCCC NMA Platform Article 6.8 비시장 접근법에 어떤 활동으로 참여하고 있는가? 참여여부 활동명 분야 참여기관 등록일",
      datasetIds: [],
    },
    {
      elementId: "C-008",
      displayTitle:
        "이니셔티브 명, 참여 상태(Active/Completed), 참여 연도, 기후 분야(감축/적응), 주제(에너지/산림/수송/도시 등), 참여 국가·기관 목록",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.1.g.Cooperative Climate Initiative 참여 현황",
      source: "UNFCCC NAZCA",
      question:
        "어떤 국제 기후 이니셔티브에 참여하고 있으며 주제·기관은 무엇인가?",
      searchText:
        "이니셔티브 명, 참여 상태(Active/Completed), 참여 연도, 기후 분야(감축/적응), 주제(에너지/산림/수송/도시 등), 참여 국가·기관 목록 이니셔티브 명, 참여 상태(Active/Completed), 참여 연도, 기후 분야(감축/적응), 주제(에너지/산림/수송/도시 등), 참여 국가·기관 목록 C.1.g.Cooperative Climate Initiative 참여 현황 정책·제도 UNFCCC NAZCA UNFCCC NAZCA 어떤 국제 기후 이니셔티브에 참여하고 있으며 주제·기관은 무엇인가? 이니셔티브 상태 연도 주제 참여기관",
      datasetIds: [],
    },
    {
      elementId: "C-009",
      displayTitle: "기후변화 법·규제·인센티브 현황",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.2.a.기후 법제도 현황",
      source:
        "NewClimate / OECD PINE / BTR(Mitigation Policy Implementation / 현지조사",
      question:
        "기후변화 관련 핵심 법령·규제·인센티브는 무엇이며 현재 시행상태는 어떠한가?",
      searchText:
        "법령명, 유형(법률/시행령/규제/인센티브), 대상 분야(감축/적응/에너지/산업), 시행 연도, 상태(시행중/폐지/계류), 주관 부처, 원본 링크(URL) 법령명, 유형(법률/시행령/규제/인센티브), 대상 분야(감축/적응/에너지/산업), 시행 연도, 상태(시행중/폐지/계류), 주관 부처, 원본 링크(URL) C.2.a.기후 법제도 현황 정책·제도 NewClimate / OECD PINE / BTR(Mitigation Policy Implementation / 현지조사 NewClimate / OECD PINE / BTR(Mitigation Policy Implementation / 현지조사 기후변화 관련 핵심 법령·규제·인센티브는 무엇이며 현재 시행상태는 어떠한가? 법령명 유형 대상분야 시행연도 상태 주관부처",
      datasetIds: [],
    },
    {
      elementId: "C-010",
      displayTitle:
        "법령명, 유형(EIA법/대기질/수질/폐기물/생물다양성), 시행 연도, 상태, 주관 부처, 원본 링크(URL)",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.2.b.기타 환경 관련 법제도 현황",
      source: "NewClimate / OECD PINE / 현지 정부",
      question:
        "EIA·대기·수질·폐기물·생물다양성 규제는 어떻게 구성되어 있는가?",
      searchText:
        "법령명, 유형(EIA법/대기질/수질/폐기물/생물다양성), 시행 연도, 상태, 주관 부처, 원본 링크(URL) 법령명, 유형(EIA법/대기질/수질/폐기물/생물다양성), 시행 연도, 상태, 주관 부처, 원본 링크(URL) C.2.b.기타 환경 관련 법제도 현황 정책·제도 NewClimate / OECD PINE / 현지 정부 NewClimate / OECD PINE / 현지 정부 EIA·대기·수질·폐기물·생물다양성 규제는 어떻게 구성되어 있는가? 법령명 규제영역 시행연도 상태 주관부처",
      datasetIds: [],
    },
    {
      elementId: "C-011",
      displayTitle:
        "치안·안전 정보(경보 등급(1~4단계: 여행유의/자제/철수권고/여행금지), 현지 치안 상황, 범죄 통계)",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.2.c.치안·안전 정보",
      source: "외교부 / 현지 자료",
      question:
        "사업지역의 치안·안전 위험을 국가·지역 수준에서 어떻게 확인해야 하는가?",
      searchText:
        "치안·안전 정보(경보 등급(1~4단계: 여행유의/자제/철수권고/여행금지), 현지 치안 상황, 범죄 통계) 치안·안전 정보(경보 등급(1~4단계: 여행유의/자제/철수권고/여행금지), 현지 치안 상황, 범죄 통계) C.2.c.치안·안전 정보 정책·제도 외교부 / 현지 자료 외교부 / 현지 자료 사업지역의 치안·안전 위험을 국가·지역 수준에서 어떻게 확인해야 하는가? 여행경보 주요 위험 지역별 주의사항 최근 사건",
      datasetIds: [],
    },
    {
      elementId: "C-012",
      displayTitle: "PPP 법률 유무/명칭",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.3.a.PPP 법제도·조달 체계",
      source: "WB PPP Resource Center",
      question: "PPP 사업의 법적·조달 프레임워크는 어떻게 운영되는가?",
      searchText:
        "PPP 법률 유무/명칭\nPPP 전담 기관\n조달 방식(경쟁입찰/협상/비공개)\n계약 유형(BOT/BOO/Concession\nVfM 평가 의무 여부\nPPP 프로젝트 이력(건수) PPP 법률 유무/명칭 C.3.a.PPP 법제도·조달 체계 정책·제도 WB PPP Resource Center WB PPP Resource Center PPP 사업의 법적·조달 프레임워크는 어떻게 운영되는가? PPP 법률 전담기관 조달방식 계약유형 VfM 사업이력",
      datasetIds: [],
    },
    {
      elementId: "C-013",
      displayTitle: "외국인 지분 제한",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.3.b.외국인 투자 규정",
      source: "World Bank Doing Business / 현지",
      question: "외국기업의 지분·투자·송금·보호 조건은 어떻게 규정되어 있는가?",
      searchText:
        "외국인 지분 제한\n투자 인센티브(세제 혜택/경제특구)\n투자 보호 협정(BIT)\n수익 송금 규정 외국인 지분 제한 C.3.b.외국인 투자 규정 정책·제도 World Bank Doing Business / 현지 World Bank Doing Business / 현지 외국기업의 지분·투자·송금·보호 조건은 어떻게 규정되어 있는가? 외국인지분 제한 투자인센티브 BIT 수익송금",
      datasetIds: [],
    },
    {
      elementId: "C-014",
      displayTitle: "환경영향평가(EIA) 절차",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.3.c.인허가 프로세스",
      source: "현지 정부 자료",
      question:
        "기후기술 사업을 추진할 때 어떤 인허가를 어떤 순서로 받아야 하는가?",
      searchText:
        "환경영향평가(EIA) 절차\n건축 허가 절차, 소요 기간(일수), 비용(USD)\n전력 사업 허가 절차, 소요 기간(일수), 비용(USD)\n토지 취득 절차, 소요 기간(일수), 비용(USD) 환경영향평가(EIA) 절차 C.3.c.인허가 프로세스 정책·제도 현지 정부 자료 현지 정부 자료 기후기술 사업을 추진할 때 어떤 인허가를 어떤 순서로 받아야 하는가? EIA 건축허가 전력사업 허가 토지취득 기간 비용 [예시] 기술·사업별 인허가 확인항목 NIGT 화면 구현용 예시",
      datasetIds: ["vnm-latest-ndc"],
    },
    {
      elementId: "C-015",
      displayTitle: "상기 문서들의 원본 링크(URL)",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.3.d.재생에너지 관련 법제도",
      source: "현지 에너지부·전력청 / IRENA",
      question: "재생에너지 정책·전망의 공식 원문은 어디에서 확인할 수 있는가?",
      searchText:
        "상기 문서들의 원본 링크(URL) 상기 문서들의 원본 링크(URL) C.3.d.재생에너지 관련 법제도 정책·제도 현지 에너지부·전력청 / IRENA 현지 에너지부·전력청 / IRENA 재생에너지 정책·전망의 공식 원문은 어디에서 확인할 수 있는가? 문서명 발행기관 발행일 적용기간 공식 URL",
      datasetIds: [],
    },
    {
      elementId: "C-016",
      displayTitle:
        "재생에너지 발주 및 확대 계획: 국가 RE 용량 목표(MW, 연도별), 입찰 일정(예정/진행/완료), 대상 기술, 사업자 선정 방식(경쟁입찰/FIT), 발주 기관",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.3.d.재생에너지 관련 법제도",
      source: "현지 에너지부·전력청 / IRENA",
      question: "재생에너지 용량목표·입찰·확대계획은 어떻게 예정되어 있는가?",
      searchText:
        "재생에너지 발주 및 확대 계획: 국가 RE 용량 목표(MW, 연도별), 입찰 일정(예정/진행/완료), 대상 기술, 사업자 선정 방식(경쟁입찰/FIT), 발주 기관 재생에너지 발주 및 확대 계획: 국가 RE 용량 목표(MW, 연도별), 입찰 일정(예정/진행/완료), 대상 기술, 사업자 선정 방식(경쟁입찰/FIT), 발주 기관 C.3.d.재생에너지 관련 법제도 정책·제도 현지 에너지부·전력청 / IRENA 현지 에너지부·전력청 / IRENA 재생에너지 용량목표·입찰·확대계획은 어떻게 예정되어 있는가? 용량목표 목표연도 입찰일정 대상기술 발주기관 선정방식",
      datasetIds: [],
    },
    {
      elementId: "C-017",
      displayTitle:
        "재생에너지 투자 인센티브: 인센티브 유형(FIT/FIP/RPS/세제/보조금/넷미터링), 대상 기술(태양광/풍력/수력/바이오), 인센티브 조건(가격/기간/용량), 시행 기관, 시행 연도, 상태",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.3.d.재생에너지 관련 법제도",
      source: "현지 에너지부·전력청 / IRENA",
      question: "재생에너지 투자 인센티브는 기술별로 어떤 조건을 제공하는가?",
      searchText:
        "재생에너지 투자 인센티브: 인센티브 유형(FIT/FIP/RPS/세제/보조금/넷미터링), 대상 기술(태양광/풍력/수력/바이오), 인센티브 조건(가격/기간/용량), 시행 기관, 시행 연도, 상태 재생에너지 투자 인센티브: 인센티브 유형(FIT/FIP/RPS/세제/보조금/넷미터링), 대상 기술(태양광/풍력/수력/바이오), 인센티브 조건(가격/기간/용량), 시행 기관, 시행 연도, 상태 C.3.d.재생에너지 관련 법제도 정책·제도 현지 에너지부·전력청 / IRENA 현지 에너지부·전력청 / IRENA 재생에너지 투자 인센티브는 기술별로 어떤 조건을 제공하는가? 인센티브 유형 대상기술 가격/기간/용량 조건 시행기관 상태",
      datasetIds: [],
    },
    {
      elementId: "C-018",
      displayTitle:
        "중장기 에너지 전망: 전망 기관(IEA/현지 정부), 전망 시나리오명, 에너지원별 수요 전망(TWh/Mtoe, 연도별), 발전 설비 확충 계획(기술별 MW), RE 비중 목표(%), 전력 수요 성장률(%)",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.3.d.재생에너지 관련 법제도",
      source: "현지 에너지부·전력청 / IRENA",
      question:
        "중장기 전력수요와 발전설비·재생에너지 비중은 어떻게 전망되는가?",
      searchText:
        "중장기 에너지 전망: 전망 기관(IEA/현지 정부), 전망 시나리오명, 에너지원별 수요 전망(TWh/Mtoe, 연도별), 발전 설비 확충 계획(기술별 MW), RE 비중 목표(%), 전력 수요 성장률(%) 중장기 에너지 전망: 전망 기관(IEA/현지 정부), 전망 시나리오명, 에너지원별 수요 전망(TWh/Mtoe, 연도별), 발전 설비 확충 계획(기술별 MW), RE 비중 목표(%), 전력 수요 성장률(%) C.3.d.재생에너지 관련 법제도 정책·제도 현지 에너지부·전력청 / IRENA 현지 에너지부·전력청 / IRENA 중장기 전력수요와 발전설비·재생에너지 비중은 어떻게 전망되는가? 전력수요 전망 기술별 설비계획 RE 비중목표 수요성장률 시나리오",
      datasetIds: [],
    },
    {
      elementId: "C-019",
      displayTitle: "탄소세 도입 여부 및 세율(USD/tCO₂)",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.4.a.탄소 시장 관련 법률·예산",
      source: "WB Carbon Pricing / OECD PINE / 현지조사",
      question:
        "탄소세·ETS·재생에너지 의무제도와 관련 예산은 어떻게 운영되는가?",
      searchText:
        "탄소세 도입 여부 및 세율(USD/tCO₂)\nETS 도입 여부, 대상 부문, 가격\nFIT/FIP/RPS 도입 여부\n탄소시장 관련 예산 규모 탄소세 도입 여부 및 세율(USD/tCO₂) C.4.a.탄소 시장 관련 법률·예산 정책·제도 WB Carbon Pricing / OECD PINE / 현지조사 WB Carbon Pricing / OECD PINE / 현지조사 탄소세·ETS·재생에너지 의무제도와 관련 예산은 어떻게 운영되는가? 탄소세 ETS 탄소가격 대상부문 RPS/FIT 예산",
      datasetIds: [],
    },
    {
      elementId: "C-020",
      displayTitle: "GHG 감축 사업 타당성 기초 정보",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.4.b.GHG 감축 사업 타당성 검증 기초 정보",
      source: "미정",
      question:
        "감축사업 타당성 판단에 필요한 MRV·기준선·추가성 정보가 얼마나 준비되어 있는가?",
      searchText:
        "GHG 감축 사업 타당성 기초 정보 GHG 감축 사업 타당성 기초 정보 C.4.b.GHG 감축 사업 타당성 검증 기초 정보 정책·제도 미정 미정 감축사업 타당성 판단에 필요한 MRV·기준선·추가성 정보가 얼마나 준비되어 있는가? 기준선 MRV 추가성 방법론 데이터 가용성",
      datasetIds: [],
    },
    {
      elementId: "C-021",
      displayTitle: "VCM 프로젝트 파이프라인",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.4.b.GHG 감축 사업 타당성 검증 기초 정보",
      source: "미정",
      question:
        "베트남의 VCM 프로젝트 파이프라인은 어떤 기술·단계로 구성되는가?",
      searchText:
        "VCM 프로젝트 파이프라인 VCM 프로젝트 파이프라인 C.4.b.GHG 감축 사업 타당성 검증 기초 정보 정책·제도 미정 미정 베트남의 VCM 프로젝트 파이프라인은 어떤 기술·단계로 구성되는가? 프로젝트 표준 기술 단계 예상 감축량",
      datasetIds: [],
    },
    {
      elementId: "C-022",
      displayTitle: "탄소시장 준비도",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.4.b.GHG 감축 사업 타당성 검증 기초 정보",
      source: "미정",
      question:
        "탄소시장 운영에 필요한 제도·인프라·기관 준비도는 어느 수준인가?",
      searchText:
        "탄소시장 준비도 탄소시장 준비도 C.4.b.GHG 감축 사업 타당성 검증 기초 정보 정책·제도 미정 미정 탄소시장 운영에 필요한 제도·인프라·기관 준비도는 어느 수준인가? 법제도 레지스트리 MRV 승인기관 거래·정산",
      datasetIds: [],
    },
    {
      elementId: "C-023",
      displayTitle: "한계저감비용 (MAC)",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.4.b.GHG 감축 사업 타당성 검증 기초 정보",
      source: "미정",
      question: "기술·부문별 한계저감비용은 어떻게 다른가?",
      searchText:
        "한계저감비용 (MAC) 한계저감비용 (MAC) C.4.b.GHG 감축 사업 타당성 검증 기초 정보 정책·제도 미정 미정 기술·부문별 한계저감비용은 어떻게 다른가? 기술/조치 MAC 감축잠재량 가정",
      datasetIds: [],
    },
    {
      elementId: "C-024",
      displayTitle:
        "REDD+ 현황: REDD+ 전략 수립 여부, FREL 제출 여부/제출년, 결과기반지불(RBP) 수혜 실적(tCO₂e/USD), 세이프가드 정보 시스템 구축 여부, 참여 기금(GCF/FCPF/BioCF)",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.4.c.탄소크레딧 관련 프로젝트·실적",
      source: "Verra / Gold Standard",
      question: "REDD+ 제도·FREL·RBP·세이프가드 이행은 어디까지 진행되었는가?",
      searchText:
        "REDD+ 현황: REDD+ 전략 수립 여부, FREL 제출 여부/제출년, 결과기반지불(RBP) 수혜 실적(tCO₂e/USD), 세이프가드 정보 시스템 구축 여부, 참여 기금(GCF/FCPF/BioCF) REDD+ 현황: REDD+ 전략 수립 여부, FREL 제출 여부/제출년, 결과기반지불(RBP) 수혜 실적(tCO₂e/USD), 세이프가드 정보 시스템 구축 여부, 참여 기금(GCF/FCPF/BioCF) C.4.c.탄소크레딧 관련 프로젝트·실적 정책·제도 Verra / Gold Standard Verra / Gold Standard REDD+ 제도·FREL·RBP·세이프가드 이행은 어디까지 진행되었는가? REDD+ 전략 FREL RBP 실적 세이프가드 참여기금",
      datasetIds: [],
    },
    {
      elementId: "C-025",
      displayTitle:
        "탄소크레딧 발행·소각 실적: 프로젝트명, 등록 표준(VCS/GS), 국가, 기술 분야, 발행량(tCO₂e), 소각량(tCO₂e), 빈티지(연도), 발행일",
      category: "C",
      categoryLabel: "정책·제도",
      dataGroup: "C.4.c.탄소크레딧 관련 프로젝트·실적",
      source: "Verra / Gold Standard",
      question:
        "탄소크레딧 프로젝트의 발행·소각 실적은 기술·표준별로 어떻게 구성되는가?",
      searchText:
        "탄소크레딧 발행·소각 실적: 프로젝트명, 등록 표준(VCS/GS), 국가, 기술 분야, 발행량(tCO₂e), 소각량(tCO₂e), 빈티지(연도), 발행일 탄소크레딧 발행·소각 실적: 프로젝트명, 등록 표준(VCS/GS), 국가, 기술 분야, 발행량(tCO₂e), 소각량(tCO₂e), 빈티지(연도), 발행일 C.4.c.탄소크레딧 관련 프로젝트·실적 정책·제도 Verra / Gold Standard Verra / Gold Standard 탄소크레딧 프로젝트의 발행·소각 실적은 기술·표준별로 어떻게 구성되는가? 프로젝트 표준 기술 발행량 소각량 빈티지",
      datasetIds: [],
    },
    {
      elementId: "D-001",
      displayTitle: "단위 사업당 CAPEX",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.1.a.기후기술 분야별 수익성 평가 기초 정보",
      source: "미정",
      question: "기후기술별 단위 사업 CAPEX는 어느 수준인가?",
      searchText:
        "단위 사업당 CAPEX 단위 사업당 CAPEX D.1.a.기후기술 분야별 수익성 평가 기초 정보 시장·산업·재원 미정 미정 기후기술별 단위 사업 CAPEX는 어느 수준인가? 기술 CAPEX 용량/단위 가격연도 범위",
      datasetIds: [],
    },
    {
      elementId: "D-002",
      displayTitle: "시장 성장률",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.1.a.기후기술 분야별 수익성 평가 기초 정보",
      source: "미정",
      question: "기후기술별 시장규모·성장률은 어떻게 변화하는가?",
      searchText:
        "시장 성장률 시장 성장률 D.1.a.기후기술 분야별 수익성 평가 기초 정보 시장·산업·재원 미정 미정 기후기술별 시장규모·성장률은 어떻게 변화하는가? 시장규모 성장률 기술 기간",
      datasetIds: [],
    },
    {
      elementId: "D-003",
      displayTitle: "예상 감축량",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.1.a.기후기술 분야별 수익성 평가 기초 정보",
      source: "미정",
      question: "기술·사업유형별 예상 감축량은 어느 정도인가?",
      searchText:
        "예상 감축량 예상 감축량 D.1.a.기후기술 분야별 수익성 평가 기초 정보 시장·산업·재원 미정 미정 기술·사업유형별 예상 감축량은 어느 정도인가? 기술 단위사업 감축량 기간 기준선",
      datasetIds: [],
    },
    {
      elementId: "D-004",
      displayTitle: "크레딧 가격 연동 수익성",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.1.a.기후기술 분야별 수익성 평가 기초 정보",
      source: "미정",
      question: "크레딧 가격 변화에 따라 사업 수익성이 어떻게 달라지는가?",
      searchText:
        "크레딧 가격 연동 수익성 크레딧 가격 연동 수익성 D.1.a.기후기술 분야별 수익성 평가 기초 정보 시장·산업·재원 미정 미정 크레딧 가격 변화에 따라 사업 수익성이 어떻게 달라지는가? 크레딧 가격 발행가능량 수익 손익분기",
      datasetIds: [],
    },
    {
      elementId: "D-005",
      displayTitle: "감축/적응 구분별 예산 배분 비율",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.1.b.기후대응·기후기술 관련 정부 예산",
      source: "Climate Watch / 현지 정부",
      question: "기후예산은 감축·적응에 어떻게 배분되는가?",
      searchText:
        "감축/적응 구분별 예산 배분 비율 감축/적응 구분별 예산 배분 비율 D.1.b.기후대응·기후기술 관련 정부 예산 시장·산업·재원 Climate Watch / 현지 정부 Climate Watch / 현지 정부 기후예산은 감축·적응에 어떻게 배분되는가? 감축 예산 적응 예산 기타 연도",
      datasetIds: [],
    },
    {
      elementId: "D-006",
      displayTitle: "기후 관련 조세 수입",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.1.b.기후대응·기후기술 관련 정부 예산",
      source: "Climate Watch / 현지 정부",
      question: "기후 관련 조세수입 규모와 추세는 어떠한가?",
      searchText:
        "기후 관련 조세 수입 기후 관련 조세 수입 D.1.b.기후대응·기후기술 관련 정부 예산 시장·산업·재원 Climate Watch / 현지 정부 Climate Watch / 현지 정부 기후 관련 조세수입 규모와 추세는 어떠한가? 조세 유형 수입규모 연도 용도 가용 시",
      datasetIds: [],
    },
    {
      elementId: "D-007",
      displayTitle:
        "기후예산태깅(CBT, Climate Budget Tagging) 도입 여부 및 수준",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.1.b.기후대응·기후기술 관련 정부 예산",
      source: "Climate Watch / 현지 정부",
      question: "기후예산태깅 체계는 도입되어 있고 어느 수준으로 운영되는가?",
      searchText:
        "기후예산태깅(CBT, Climate Budget Tagging) 도입 여부 및 수준 기후예산태깅(CBT, Climate Budget Tagging) 도입 여부 및 수준 D.1.b.기후대응·기후기술 관련 정부 예산 시장·산업·재원 Climate Watch / 현지 정부 Climate Watch / 현지 정부 기후예산태깅 체계는 도입되어 있고 어느 수준으로 운영되는가? 도입여부 적용부처 분류체계 보고·검증",
      datasetIds: [],
    },
    {
      elementId: "D-008",
      displayTitle: "주관 부처별 기후 예산 규모",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.1.b.기후대응·기후기술 관련 정부 예산",
      source: "Climate Watch / 현지 정부",
      question: "부처별 기후예산은 어디에 집중되어 있는가?",
      searchText:
        "주관 부처별 기후 예산 규모 주관 부처별 기후 예산 규모 D.1.b.기후대응·기후기술 관련 정부 예산 시장·산업·재원 Climate Watch / 현지 정부 Climate Watch / 현지 정부 부처별 기후예산은 어디에 집중되어 있는가? 부처 예산 감축/적응 연도",
      datasetIds: [],
    },
    {
      elementId: "D-009",
      displayTitle: "총 지출 규모, 연도별 추이",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.1.b.기후대응·기후기술 관련 정부 예산",
      source: "Climate Watch / 현지 정부",
      question: "기후 관련 총지출은 어떻게 변화하고 있는가?",
      searchText:
        "총 지출 규모, 연도별 추이 총 지출 규모, 연도별 추이 D.1.b.기후대응·기후기술 관련 정부 예산 시장·산업·재원 Climate Watch / 현지 정부 Climate Watch / 현지 정부 기후 관련 총지출은 어떻게 변화하고 있는가? 총 기후지출 GDP/예산 대비 연도 집행률 가용 시",
      datasetIds: [],
    },
    {
      elementId: "D-010",
      displayTitle: "화석연료 보조금 규모",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.1.b.기후대응·기후기술 관련 정부 예산",
      source: "Climate Watch / 현지 정부",
      question: "화석연료 보조금 규모는 어느 정도이며 변화 추세는 어떠한가?",
      searchText:
        "화석연료 보조금 규모 화석연료 보조금 규모 D.1.b.기후대응·기후기술 관련 정부 예산 시장·산업·재원 Climate Watch / 현지 정부 Climate Watch / 현지 정부 화석연료 보조금 규모는 어느 정도이며 변화 추세는 어떠한가? 보조금 규모 에너지원 GDP 대비 연도",
      datasetIds: [],
    },
    {
      elementId: "D-011",
      displayTitle: "국가별 ODA 규모·공여구조",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.1.c.해외 경쟁 정보",
      source: "OECD DAC2A / DAC3A",
      question:
        "이 국가에 어느 공여기관이 얼마나 ODA를 제공하고 있으며 실제 지출과 약정은 어떻게 변화했는가?",
      searchText:
        "국가별 ODA 규모 공여구조 실제 지출 약정 주요 공여기관 최근 5년 추세 OECD DAC2A DAC3A 시장·산업·재원 해외 경쟁 정보",
      datasetIds: ["LDC-DS-D-011-OECD-ODA"],
    },
    {
      elementId: "D-012",
      displayTitle:
        "경쟁국 민간기업의 개도국 진출 현황: 기업명, 국적, 진출 대상국, 기술 분야(RE/효율/폐기물), 프로젝트명, 용량(MW), 투자액(USD), 진출 형태(EPC/투자/라이선스)",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.1.c.해외 경쟁 정보",
      source: "OECD CRS / 현지 조사",
      question: "경쟁국 기업은 어떤 기후기술·프로젝트로 베트남에 진출했는가?",
      searchText:
        "경쟁국 민간기업의 개도국 진출 현황: 기업명, 국적, 진출 대상국, 기술 분야(RE/효율/폐기물), 프로젝트명, 용량(MW), 투자액(USD), 진출 형태(EPC/투자/라이선스) 경쟁국 민간기업의 개도국 진출 현황: 기업명, 국적, 진출 대상국, 기술 분야(RE/효율/폐기물), 프로젝트명, 용량(MW), 투자액(USD), 진출 형태(EPC/투자/라이선스) D.1.c.해외 경쟁 정보 시장·산업·재원 OECD CRS / 현지 조사 OECD CRS / 현지 조사 경쟁국 기업은 어떤 기후기술·프로젝트로 베트남에 진출했는가? 기업 국적 기술 프로젝트 용량/투자액 진출형태",
      datasetIds: [],
    },
    {
      elementId: "D-013",
      displayTitle: "GGGI Green Growth Index(녹색성장지수)",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.1.d.기타 관련 지수",
      source: "GGGI Green Growth Index",
      question: "Green Growth Index에서 베트남의 녹색전환 수준은 어떠한가?",
      searchText:
        "GGGI Green Growth Index(녹색성장지수) GGGI Green Growth Index(녹색성장지수) D.1.d.기타 관련 지수 시장·산업·재원 GGGI Green Growth Index GGGI Green Growth Index Green Growth Index에서 베트남의 녹색전환 수준은 어떠한가? 종합점수 효율성 환경보호 경제기회 사회포용",
      datasetIds: [],
    },
    {
      elementId: "D-014",
      displayTitle:
        "EDCF 프로젝트: 프로젝트명, 수원국, 섹터, 승인 금액(USD), 금리(%), 상환 기간(년), 거치 기간(년), 사업 기간, 시행기관, 상태(승인/집행/완료)",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.2.a.한국 국제협력 사업 추진 현황",
      source: "(예상) ODA Korea / KOICA / EDCF",
      question:
        "베트남에서 진행된 EDCF 사업은 무엇이며 규모·상태·기관은 어떻게 구성되는가?",
      searchText:
        "EDCF 프로젝트: 프로젝트명, 수원국, 섹터, 승인 금액(USD), 금리(%), 상환 기간(년), 거치 기간(년), 사업 기간, 시행기관, 상태(승인/집행/완료) EDCF 프로젝트: 프로젝트명, 수원국, 섹터, 승인 금액(USD), 금리(%), 상환 기간(년), 거치 기간(년), 사업 기간, 시행기관, 상태(승인/집행/완료) D.2.a.한국 국제협력 사업 추진 현황 시장·산업·재원 (예상) ODA Korea / KOICA / EDCF (예상) ODA Korea / KOICA / EDCF 베트남에서 진행된 EDCF 사업은 무엇이며 규모·상태·기관은 어떻게 구성되는가? 프로젝트명 섹터 승인금액 금리 상환·거치 시행기관 상태",
      datasetIds: [],
    },
    {
      elementId: "D-015",
      displayTitle:
        "ODA Korea 프로젝트: 사업명, 수원국, 시행기관(KOICA/EDCF/부처), 사업 유형(프로젝트/기술협력/연수), 사업 기간, 사업비(USD/KRW), 분야(DAC 섹터코드), 상태",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.2.a.한국 국제협력 사업 추진 현황",
      source: "(예상) ODA Korea / KOICA / EDCF",
      question:
        "베트남에서 진행된 ODA Korea 사업은 무엇이며 규모·상태·기관은 어떻게 구성되는가?",
      searchText:
        "ODA Korea 프로젝트: 사업명, 수원국, 시행기관(KOICA/EDCF/부처), 사업 유형(프로젝트/기술협력/연수), 사업 기간, 사업비(USD/KRW), 분야(DAC 섹터코드), 상태 ODA Korea 프로젝트: 사업명, 수원국, 시행기관(KOICA/EDCF/부처), 사업 유형(프로젝트/기술협력/연수), 사업 기간, 사업비(USD/KRW), 분야(DAC 섹터코드), 상태 D.2.a.한국 국제협력 사업 추진 현황 시장·산업·재원 (예상) ODA Korea / KOICA / EDCF (예상) ODA Korea / KOICA / EDCF 베트남에서 진행된 ODA Korea 사업은 무엇이며 규모·상태·기관은 어떻게 구성되는가? 사업명 시행기관 유형 기간 사업비 분야 상태",
      datasetIds: [],
    },
    {
      elementId: "D-016",
      displayTitle:
        "지자체·정부부처 프로젝트: 사업명, 수원국, 시행기관(부처/지자체명), 사업 유형, 사업 기간, 사업비, 분야",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.2.a.한국 국제협력 사업 추진 현황",
      source: "(예상) ODA Korea / KOICA / EDCF",
      question:
        "베트남에서 진행된 한국 정부·지자체 사업은 무엇이며 규모·상태·기관은 어떻게 구성되는가?",
      searchText:
        "지자체·정부부처 프로젝트: 사업명, 수원국, 시행기관(부처/지자체명), 사업 유형, 사업 기간, 사업비, 분야 지자체·정부부처 프로젝트: 사업명, 수원국, 시행기관(부처/지자체명), 사업 유형, 사업 기간, 사업비, 분야 D.2.a.한국 국제협력 사업 추진 현황 시장·산업·재원 (예상) ODA Korea / KOICA / EDCF (예상) ODA Korea / KOICA / EDCF 베트남에서 진행된 한국 정부·지자체 사업은 무엇이며 규모·상태·기관은 어떻게 구성되는가? 사업명 시행기관 유형 기간 사업비 분야",
      datasetIds: [],
    },
    {
      elementId: "D-017",
      displayTitle:
        "한국 ODA 기관 PCP/입찰 현황: 사업명, 대상국, 발주기관(KOICA/EDCF/부처), 분야, 예산 규모(USD), 입찰 유형(PCP/RFP/경쟁), 입찰 일정(공고일/마감일), 수행기관 자격 요건",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.2.a.한국 국제협력 사업 추진 현황",
      source: "(예상) ODA Korea / KOICA / EDCF",
      question:
        "베트남에서 진행된 한국 ODA PCP·입찰은 무엇이며 규모·상태·기관은 어떻게 구성되는가?",
      searchText:
        "한국 ODA 기관 PCP/입찰 현황: 사업명, 대상국, 발주기관(KOICA/EDCF/부처), 분야, 예산 규모(USD), 입찰 유형(PCP/RFP/경쟁), 입찰 일정(공고일/마감일), 수행기관 자격 요건 한국 ODA 기관 PCP/입찰 현황: 사업명, 대상국, 발주기관(KOICA/EDCF/부처), 분야, 예산 규모(USD), 입찰 유형(PCP/RFP/경쟁), 입찰 일정(공고일/마감일), 수행기관 자격 요건 D.2.a.한국 국제협력 사업 추진 현황 시장·산업·재원 (예상) ODA Korea / KOICA / EDCF (예상) ODA Korea / KOICA / EDCF 베트남에서 진행된 한국 ODA PCP·입찰은 무엇이며 규모·상태·기관은 어떻게 구성되는가? 사업명 발주기관 분야 예산 입찰유형 공고·마감 자격",
      datasetIds: [],
    },
    {
      elementId: "D-018",
      displayTitle:
        "Adaptation Fund 프로젝트: 프로젝트명, 국가, 실행기관(NIE/MIE 구분, 기관명), 승인 금액(USD), 분야(수자원/농업/재난관리/해안/생태계), 상태(Under Implementation/Completed), 기간, 수혜자 수",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.2.b.주요 국제기구 사업 추진 현황",
      source: "Adaptation Fund",
      question:
        "베트남에서 진행된 Adaptation Fund 사업은 무엇이며 규모·상태·기관은 어떻게 구성되는가?",
      searchText:
        "Adaptation Fund 프로젝트: 프로젝트명, 국가, 실행기관(NIE/MIE 구분, 기관명), 승인 금액(USD), 분야(수자원/농업/재난관리/해안/생태계), 상태(Under Implementation/Completed), 기간, 수혜자 수 Adaptation Fund 프로젝트: 프로젝트명, 국가, 실행기관(NIE/MIE 구분, 기관명), 승인 금액(USD), 분야(수자원/농업/재난관리/해안/생태계), 상태(Under Implementation/Completed), 기간, 수혜자 수 D.2.b.주요 국제기구 사업 추진 현황 시장·산업·재원 Adaptation Fund Adaptation Fund 베트남에서 진행된 Adaptation Fund 사업은 무엇이며 규모·상태·기관은 어떻게 구성되는가? 프로젝트 실행기관 승인금액 분야 상태 기간 수혜자",
      datasetIds: ["LDC-DS-D-018-AF"],
    },
    {
      elementId: "D-019",
      displayTitle:
        "CTCN 기술지원 요청: 요청 국가, NDE 기관명, 기술 분야(Sectors), 지원 단계(Phase: Scoping/TA Delivery/Completed), 예산(USD), 기술 유형(Technologies), 기간, TA 결과 요약",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.2.b.주요 국제기구 사업 추진 현황",
      source: "CTCN Open Data",
      question:
        "베트남에서 진행된 CTCN 기술지원은 무엇이며 규모·상태·기관은 어떻게 구성되는가?",
      searchText:
        "CTCN 기술지원 요청: 요청 국가, NDE 기관명, 기술 분야(Sectors), 지원 단계(Phase: Scoping/TA Delivery/Completed), 예산(USD), 기술 유형(Technologies), 기간, TA 결과 요약 CTCN 기술지원 요청: 요청 국가, NDE 기관명, 기술 분야(Sectors), 지원 단계(Phase: Scoping/TA Delivery/Completed), 예산(USD), 기술 유형(Technologies), 기간, TA 결과 요약 D.2.b.주요 국제기구 사업 추진 현황 시장·산업·재원 CTCN Open Data CTCN Open Data 베트남에서 진행된 CTCN 기술지원은 무엇이며 규모·상태·기관은 어떻게 구성되는가? 요청명 NDE 기술분야 단계 예산 기간 결과",
      datasetIds: ["LDC-DS-D-019-CTCN"],
    },
    {
      elementId: "D-020",
      displayTitle: "GCF 프로젝트 현황",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.2.b.주요 국제기구 사업 추진 현황",
      source: "Green Climate Fund",
      question:
        "베트남에서 진행된 GCF 사업은 무엇이며 규모·상태·기관은 어떻게 구성되는가?",
      searchText:
        "GCF 프로젝트: 프로젝트명(Ref No.), 국가, 인가기관(AE), GCF 승인 금액(USD), 공동재원(USD), 분야(mitigation/adaptation/cross-cutting), 결과영역(Result Area), 상태(Approved/Under Implementation/Completed), 이사회 승인일, 예상 수혜자 수, 예상 감축량(tCO₂e) GCF 프로젝트: 프로젝트명(Ref No.), 국가, 인가기관(AE), GCF 승인 금액(USD), 공동재원(USD), 분야(mitigation/adaptation/cross-cutting), 결과영역(Result Area), 상태(Approved/Under Implementation/Completed), 이사회 승인일, 예상 수혜자 수, 예상 감축량(tCO₂e) D.2.b.주요 국제기구 사업 추진 현황 시장·산업·재원 Green Climate Fund CTCN Open Data 베트남에서 진행된 GCF 사업은 무엇이며 규모·상태·기관은 어떻게 구성되는가? 프로젝트 인가기관 GCF 재원 공동재원 분야 상태 승인일 수혜자·감축량 GCF 프로젝트 현황 · 우선 10개국 Green Climate Fund",
      datasetIds: ["gcf-vnm-country-source"],
    },
    {
      elementId: "D-021",
      displayTitle: "주요 국제기구·MDB 프로젝트",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.2.b.주요 국제기구 사업 추진 현황",
      source: "World Bank Projects & Operations / ADB IATI",
      question:
        "이 국가에서 진행·준비 중인 World Bank·ADB 사업은 무엇이며 금융규모·상태·시행기관은 어떻게 구성되는가?",
      searchText:
        "주요 국제기구 MDB 프로젝트 World Bank ADB 프로젝트명 수원국 약정 승인금액 지출액 분야 기간 상태 시행기관 Projects API IATI 시장·산업·재원",
      datasetIds: ["LDC-DS-D-002"],
    },
    {
      elementId: "D-022",
      displayTitle:
        "MDB/DFI/PPP 투자 프로젝트: 프로젝트명, 수원국, 공여기관(WB/ADB/IFC 등), 섹터(DAC 5자리 코드), 투자액(commitment/disbursement, USD), 프로젝트 상태, 기간(시작/종료), 실행기관, Rio Marker(기후 태깅), 투자 유형(grant/loan/equity), 공동투자 참여 가능 여부 및 형태",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.3.a.기후기술 분야 투자 정보",
      source: "IATI / OECD CRS / 현지조사",
      question: "베트남의 MDB·DFI·PPP 투자 현황은 어떻게 구성되는가?",
      searchText:
        "MDB/DFI/PPP 투자 프로젝트: 프로젝트명, 수원국, 공여기관(WB/ADB/IFC 등), 섹터(DAC 5자리 코드), 투자액(commitment/disbursement, USD), 프로젝트 상태, 기간(시작/종료), 실행기관, Rio Marker(기후 태깅), 투자 유형(grant/loan/equity), 공동투자 참여 가능 여부 및 형태 MDB/DFI/PPP 투자 프로젝트: 프로젝트명, 수원국, 공여기관(WB/ADB/IFC 등), 섹터(DAC 5자리 코드), 투자액(commitment/disbursement, USD), 프로젝트 상태, 기간(시작/종료), 실행기관, Rio Marker(기후 태깅), 투자 유형(grant/loan/equity), 공동투자 참여 가능 여부 및 형태 D.3.a.기후기술 분야 투자 정보 시장·산업·재원 IATI / OECD CRS / 현지조사 IATI / OECD CRS / 현지조사 베트남의 MDB·DFI·PPP 투자 현황은 어떻게 구성되는가? 프로젝트 공여/투자기관 섹터 투자액 상태 기간 투자유형 공동투자 형태",
      datasetIds: [],
    },
    {
      elementId: "D-023",
      displayTitle: "ODA·기후기금 재원 현황",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.3.a.기후기술 분야 투자 정보",
      source: "GCF Open Data Library / Adaptation Fund / GEF",
      question: "베트남의 ODA·기후기금 재원 현황은 어떻게 구성되는가?",
      searchText:
        "ODA 및 기후기금(GCF, GEF, AF) 재원: 프로젝트명, 수원국, 기금명(GCF/GEF/AF/CIF), 승인 금액(USD), 공동재원(co-financing, USD), 분야(mitigation/adaptation/cross-cutting), 결과영역(Result Area), 인가기관(AE/Agency), 상태(Approved/Implementing/Completed), Readiness 구분, 공동투자 참여 가능 여부 및 형태 ODA 및 기후기금(GCF, GEF, AF) 재원: 프로젝트명, 수원국, 기금명(GCF/GEF/AF/CIF), 승인 금액(USD), 공동재원(co-financing, USD), 분야(mitigation/adaptation/cross-cutting), 결과영역(Result Area), 인가기관(AE/Agency), 상태(Approved/Implementing/Completed), Readiness 구분, 공동투자 참여 가능 여부 및 형태 D.3.a.기후기술 분야 투자 정보 시장·산업·재원 GCF Open Data Library GCF Open Data / OECD CRS 베트남의 ODA·기후기금 재원 현황은 어떻게 구성되는가? 프로젝트 기금 승인금액 공동재원 분야 기관 상태 Readiness 공동투자 형태 GCF 국가별 사업·재원 현황 Green Climate Fund",
      datasetIds: ["LDC-DS-E-002"],
    },
    {
      elementId: "D-024",
      displayTitle:
        "VC·임팩트 투자 현황: 투자 라운드(Seed/Series A-C), 투자자명, 투자 금액(USD), 대상 기업/기술, 국가, 투자 연도, 기후 분야(RE/효율/모빌리티/AgTech), 공동투자 참여 가능 여부 및 형태",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.3.a.기후기술 분야 투자 정보",
      source: "IATI / OECD CRS / 현지조사",
      question: "베트남의 VC·임팩트 투자 현황은 어떻게 구성되는가?",
      searchText:
        "VC·임팩트 투자 현황: 투자 라운드(Seed/Series A-C), 투자자명, 투자 금액(USD), 대상 기업/기술, 국가, 투자 연도, 기후 분야(RE/효율/모빌리티/AgTech), 공동투자 참여 가능 여부 및 형태 VC·임팩트 투자 현황: 투자 라운드(Seed/Series A-C), 투자자명, 투자 금액(USD), 대상 기업/기술, 국가, 투자 연도, 기후 분야(RE/효율/모빌리티/AgTech), 공동투자 참여 가능 여부 및 형태 D.3.a.기후기술 분야 투자 정보 시장·산업·재원 IATI / OECD CRS / 현지조사 IATI / OECD CRS / 현지조사 베트남의 VC·임팩트 투자 현황은 어떻게 구성되는가? 투자라운드 투자자 투자금액 기업/기술 연도 기후분야 공동투자",
      datasetIds: [],
    },
    {
      elementId: "D-025",
      displayTitle:
        "민간 인프라 투자 (PPI): 프로젝트명, 국가, 섹터(전력/수도/교통/통신), 투자 유형(Greenfield/Concession/Divestiture), 총 투자액(USD), 민간 투자액(USD), 계약 기간(년), 상태(Active/Cancelled/Distressed), Financial Close 연도, 스폰서/개발사, IDA 지위, 공동투자 참여 가능 여부 및 형태",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.3.a.기후기술 분야 투자 정보",
      source: "IATI / OECD CRS",
      question: "베트남의 민간 인프라 투자(PPI) 현황은 어떻게 구성되는가?",
      searchText:
        "민간 인프라 투자 (PPI): 프로젝트명, 국가, 섹터(전력/수도/교통/통신), 투자 유형(Greenfield/Concession/Divestiture), 총 투자액(USD), 민간 투자액(USD), 계약 기간(년), 상태(Active/Cancelled/Distressed), Financial Close 연도, 스폰서/개발사, IDA 지위, 공동투자 참여 가능 여부 및 형태 민간 인프라 투자 (PPI): 프로젝트명, 국가, 섹터(전력/수도/교통/통신), 투자 유형(Greenfield/Concession/Divestiture), 총 투자액(USD), 민간 투자액(USD), 계약 기간(년), 상태(Active/Cancelled/Distressed), Financial Close 연도, 스폰서/개발사, IDA 지위, 공동투자 참여 가능 여부 및 형태 D.3.a.기후기술 분야 투자 정보 시장·산업·재원 IATI / OECD CRS IATI / OECD CRS 베트남의 민간 인프라 투자(PPI) 현황은 어떻게 구성되는가? 프로젝트 섹터 투자유형 총·민간 투자액 계약기간 상태 Financial Close 스폰서",
      datasetIds: [],
    },
    {
      elementId: "D-026",
      displayTitle:
        "프로젝트명, 국가, 섹터, 보증 금액(USD), 보증 유형(수용/이전제한/계약위반/전쟁내란), 보증 기간, 투자자, 상태",
      category: "D",
      categoryLabel: "시장·산업·재원",
      dataGroup: "D.3.b.MIGA 정치적 리스크 보증 정보",
      source: "World Bank MIGA",
      question: "베트남의 MIGA 정치적 리스크 보증 현황은 어떻게 구성되는가?",
      searchText:
        "프로젝트명, 국가, 섹터, 보증 금액(USD), 보증 유형(수용/이전제한/계약위반/전쟁내란), 보증 기간, 투자자, 상태 프로젝트명, 국가, 섹터, 보증 금액(USD), 보증 유형(수용/이전제한/계약위반/전쟁내란), 보증 기간, 투자자, 상태 D.3.b.MIGA 정치적 리스크 보증 정보 시장·산업·재원 World Bank MIGA World Bank MIGA 베트남의 MIGA 정치적 리스크 보증 현황은 어떻게 구성되는가? 프로젝트 섹터 보증금액 보증유형 기간 투자자 상태",
      datasetIds: [],
    },
    {
      elementId: "E-001",
      displayTitle:
        "CTCN NDE (국가지정기구): 국가, 기관명, 소속 부처, 담당자(Focal Point)명, 직함, 이메일, 전화번호",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.1.a.공공 파트너",
      source: "CTCN",
      question:
        "베트남의 CTCN NDE는 누구이며 어떤 공식 역할·연락경로를 갖는가?",
      searchText:
        "CTCN NDE (국가지정기구): 국가, 기관명, 소속 부처, 담당자(Focal Point)명, 직함, 이메일, 전화번호 CTCN NDE (국가지정기구): 국가, 기관명, 소속 부처, 담당자(Focal Point)명, 직함, 이메일, 전화번호 E.1.a.공공 파트너 협력·실행기반 CTCN CTCN 베트남의 CTCN NDE는 누구이며 어떤 공식 역할·연락경로를 갖는가? 기관명 소속부처 담당자 직함 이메일 전화",
      datasetIds: [],
    },
    {
      elementId: "E-002",
      displayTitle:
        "DNA (국가지정기관): 국가, 기관명, 소속 부처, 담당자명, 직함, 이메일, 승인 절차 개요, 제6.4조 전환 상태",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.1.a.공공 파트너",
      source: "CTCN",
      question:
        "베트남의 Article 6 DNA는 누구이며 어떤 공식 역할·연락경로를 갖는가?",
      searchText:
        "DNA (국가지정기관): 국가, 기관명, 소속 부처, 담당자명, 직함, 이메일, 승인 절차 개요, 제6.4조 전환 상태 DNA (국가지정기관): 국가, 기관명, 소속 부처, 담당자명, 직함, 이메일, 승인 절차 개요, 제6.4조 전환 상태 E.1.a.공공 파트너 협력·실행기반 CTCN CTCN 베트남의 Article 6 DNA는 누구이며 어떤 공식 역할·연락경로를 갖는가? 기관명 소속부처 담당자 이메일 승인절차 6.4 전환상태",
      datasetIds: [],
    },
    {
      elementId: "E-003",
      displayTitle: "GCF 국가 지정기관(NDA)",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.1.a.공공 파트너",
      source: "CTCN",
      question: "베트남의 GCF NDA는 누구이며 어떤 공식 역할·연락경로를 갖는가?",
      searchText:
        "GCF NDA (국가지정기관): 국가, 기관명, 소속 부처, 담당자명, 직함, 이메일, 전화번호 GCF NDA (국가지정기관): 국가, 기관명, 소속 부처, 담당자명, 직함, 이메일, 전화번호 E.1.a.공공 파트너 협력·실행기반 Green Climate Fund CTCN 베트남의 GCF NDA는 누구이며 어떤 공식 역할·연락경로를 갖는가? 기관명 소속부처 담당자 직함 이메일 전화 베트남 GCF 국가 지정기관·직접접근기관 Green Climate Fund",
      datasetIds: ["gcf-country-source"],
    },
    {
      elementId: "E-004",
      displayTitle:
        "국제기구 현지사무소 담당자: 기관명(UNDP/UNEP/UNIDO/FAO/WB/ADB/GIZ/JICA/KOICA 등), 소재국, 도시, 사무소 주소, 기후·에너지 담당자 명, 직함, 이메일",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.1.b.민간 파트너",
      source: "UNDP/UNEP/UNIDO/FAO/WB/ADB/GIZ/JICA/KOICA 각 기구 웹사이트",
      question:
        "베트남의 국제기구 현지사무소는 누구이며 어떤 공식 역할·연락경로를 갖는가?",
      searchText:
        "국제기구 현지사무소 담당자: 기관명(UNDP/UNEP/UNIDO/FAO/WB/ADB/GIZ/JICA/KOICA 등), 소재국, 도시, 사무소 주소, 기후·에너지 담당자 명, 직함, 이메일 국제기구 현지사무소 담당자: 기관명(UNDP/UNEP/UNIDO/FAO/WB/ADB/GIZ/JICA/KOICA 등), 소재국, 도시, 사무소 주소, 기후·에너지 담당자 명, 직함, 이메일 E.1.b.민간 파트너 협력·실행기반 UNDP/UNEP/UNIDO/FAO/WB/ADB/GIZ/JICA/KOICA 각 기구 웹사이트 UNDP/UNEP/UNIDO/FAO/WB/ADB/GIZ/JICA/KOICA 각 기구 웹사이트 베트남의 국제기구 현지사무소는 누구이며 어떤 공식 역할·연락경로를 갖는가? 기관명 도시 주소 기후·에너지 담당자 직함 이메일",
      datasetIds: [],
    },
    {
      elementId: "E-005",
      displayTitle:
        "대학·연구기관·NGO: 기관명, 기관 유형(대학/연구소/싱크탱크/NGO), 소재국/도시, 전문 분야(기후/에너지/환경/농업), 주요 연구역량 또는 활동 범위, 국제 협력 실적 유무, 연락처",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.1.b.민간 파트너",
      source:
        "UNDP/UNEP/UNIDO/FAO/WB/ADB/GIZ/JICA/KOICA 각 기구 웹사이트 / 현지 조사",
      question:
        "베트남의 대학·연구기관·NGO는 누구이며 어떤 공식 역할·연락경로를 갖는가?",
      searchText:
        "대학·연구기관·NGO: 기관명, 기관 유형(대학/연구소/싱크탱크/NGO), 소재국/도시, 전문 분야(기후/에너지/환경/농업), 주요 연구역량 또는 활동 범위, 국제 협력 실적 유무, 연락처 대학·연구기관·NGO: 기관명, 기관 유형(대학/연구소/싱크탱크/NGO), 소재국/도시, 전문 분야(기후/에너지/환경/농업), 주요 연구역량 또는 활동 범위, 국제 협력 실적 유무, 연락처 E.1.b.민간 파트너 협력·실행기반 UNDP/UNEP/UNIDO/FAO/WB/ADB/GIZ/JICA/KOICA 각 기구 웹사이트 / 현지 조사 UNDP/UNEP/UNIDO/FAO/WB/ADB/GIZ/JICA/KOICA 각 기구 웹사이트 / 현지 조사 베트남의 대학·연구기관·NGO는 누구이며 어떤 공식 역할·연락경로를 갖는가? 기관명 유형 도시 전문분야 주요역량 국제협력 실적 연락처",
      datasetIds: [],
    },
    {
      elementId: "E-006",
      displayTitle:
        "현지 투자자 네트워크: 기관명, 기관 유형(VC/PE/DFI/상업은행/임팩트투자/AC), 투자 분야(기후/에너지/인프라/AgTech), 투자 규모(AUM, USD), 소재국/도시, 연락처, 기후기술 투자 실적 유무",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.1.b.민간 파트너",
      source:
        "UNDP/UNEP/UNIDO/FAO/WB/ADB/GIZ/JICA/KOICA 각 기구 웹사이트 / 현지조사",
      question:
        "베트남의 현지 투자자 네트워크는 누구이며 어떤 공식 역할·연락경로를 갖는가?",
      searchText:
        "현지 투자자 네트워크: 기관명, 기관 유형(VC/PE/DFI/상업은행/임팩트투자/AC), 투자 분야(기후/에너지/인프라/AgTech), 투자 규모(AUM, USD), 소재국/도시, 연락처, 기후기술 투자 실적 유무 현지 투자자 네트워크: 기관명, 기관 유형(VC/PE/DFI/상업은행/임팩트투자/AC), 투자 분야(기후/에너지/인프라/AgTech), 투자 규모(AUM, USD), 소재국/도시, 연락처, 기후기술 투자 실적 유무 E.1.b.민간 파트너 협력·실행기반 UNDP/UNEP/UNIDO/FAO/WB/ADB/GIZ/JICA/KOICA 각 기구 웹사이트 / 현지조사 UNDP/UNEP/UNIDO/FAO/WB/ADB/GIZ/JICA/KOICA 각 기구 웹사이트 / 현지조사 베트남의 현지 투자자 네트워크는 누구이며 어떤 공식 역할·연락경로를 갖는가? 기관명 유형 투자분야 AUM/투자규모 도시 기후투자 실적 연락처",
      datasetIds: [],
    },
    {
      elementId: "E-007",
      displayTitle: "GHG 인벤토리 작성 역량(Tier 1/2/3)",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.2.a.온실가스 산정 MRV 체계",
      source: "미정",
      question: "국가 GHG MRV·인벤토리·레지스트리·검증 체계는 어느 수준인가?",
      searchText:
        "GHG 인벤토리 작성 역량(Tier 1/2/3)\n국가 레지스트리 유무 제3자 검증 체계 유무\nBTR 제출 이력(제출/미제출)\nCBIT 지원 수혜 여부 GHG 인벤토리 작성 역량(Tier 1/2/3) E.2.a.온실가스 산정 MRV 체계 협력·실행기반 미정 미정 국가 GHG MRV·인벤토리·레지스트리·검증 체계는 어느 수준인가? 인벤토리 Tier 국가 레지스트리 제3자 검증 BTR 제출 CBIT 지원",
      datasetIds: [],
    },
    {
      elementId: "E-008",
      displayTitle: "기후기술 논문·특허·국제협력",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.2.b.논문·특허",
      source: "WIPO WIPSON / UNESCO/현지 기반 저널",
      question: "베트남 기후기술 연구·특허는 어떤 기술·기관에 집중되어 있는가?",
      searchText:
        "논문·특허 명, 기후기술 분야, 특허 출원인 국적, 특허 출원 연구기관·대학 명, 논문 국제 공저 비율, 한국과의 공동 출원·공저 여부 논문·특허 명, 기후기술 분야, 특허 출원인 국적, 특허 출원 연구기관·대학 명, 논문 국제 공저 비율, 한국과의 공동 출원·공저 여부 E.2.b.논문·특허 협력·실행기반 WIPO WIPSON / UNESCO/현지 기반 저널 WIPO WIPSON / UNESCO/현지 기반 저널 베트남 기후기술 연구·특허는 어떤 기술·기관에 집중되어 있는가? 논문/특허 수 기술분야 주요기관 국제공저 한국 공동실적",
      datasetIds: [],
    },
    {
      elementId: "E-009",
      displayTitle: "STEM 졸업자·연구자 수",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.2.c.개도국 기술 역량 평가 지표",
      source: "UNESCO",
      question: "STEM 졸업자·연구자 인력풀은 어느 정도인가?",
      searchText:
        "STEM 졸업자·연구자 수 STEM 졸업자·연구자 수 E.2.c.개도국 기술 역량 평가 지표 협력·실행기반 UNESCO UNESCO STEM 졸업자·연구자 인력풀은 어느 정도인가? STEM 졸업자 연구자 인구/취업자 대비 최근 추세",
      datasetIds: [],
    },
    {
      elementId: "E-010",
      displayTitle: "UNESCO UIS의 R&D 지출(GRED), WIPO 혁신지수(GII)",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.2.c.개도국 기술 역량 평가 지표",
      source: "미정",
      question: "R&D 투자와 국가 혁신역량은 어느 수준인가?",
      searchText:
        "UNESCO UIS의 R&D 지출(GRED), WIPO 혁신지수(GII) UNESCO UIS의 R&D 지출(GRED), WIPO 혁신지수(GII) E.2.c.개도국 기술 역량 평가 지표 협력·실행기반 미정 미정 R&D 투자와 국가 혁신역량은 어느 수준인가? R&D 지출 GDP 대비 R&D GII 점수 GII 순위",
      datasetIds: [],
    },
    {
      elementId: "E-011",
      displayTitle: "기술준비수준 (TRL)",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.2.c.개도국 기술 역량 평가 지표",
      source: "미정",
      question: "선택 기후기술의 현지 기술준비수준은 어느 정도인가?",
      searchText:
        "기술준비수준 (TRL) 기술준비수준 (TRL) E.2.c.개도국 기술 역량 평가 지표 협력·실행기반 미정 미정 선택 기후기술의 현지 기술준비수준은 어느 정도인가? 기술 TRL 근거기관/프로젝트 검증상태",
      datasetIds: [],
    },
    {
      elementId: "E-012",
      displayTitle: "직군별 종사자 수·임금",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.2.c.개도국 기술 역량 평가 지표",
      source: "ILO",
      question: "관련 직군의 인력규모와 임금수준은 어느 정도인가?",
      searchText:
        "직군별 종사자 수·임금 직군별 종사자 수·임금 E.2.c.개도국 기술 역량 평가 지표 협력·실행기반 ILO ILO 관련 직군의 인력규모와 임금수준은 어느 정도인가? 직군 종사자수 임금 지역 기간",
      datasetIds: [],
    },
    {
      elementId: "E-013",
      displayTitle: "숙련 기술인력 가용성(등급)",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.2.d.운영·유지보수 역량",
      source: "미정",
      question: "숙련인력·부품·정비·A/S 등 O&M 역량은 어느 수준인가?",
      searchText:
        "숙련 기술인력 가용성(등급)\n부품 조달 가능성(국내생산/수입의존)\n예방정비 체계 수준(등급)\nA/S 인프라(서비스센터/원격모니터링 유무)\n과거 유사시설 O&M 실적 숙련 기술인력 가용성(등급) E.2.d.운영·유지보수 역량 협력·실행기반 미정 미정 숙련인력·부품·정비·A/S 등 O&M 역량은 어느 수준인가? 숙련인력 부품조달 예방정비 A/S 인프라 유사시설 실적 [예시] 현지 운영·유지관리 역량 NIGT 화면 구현용 예시",
      datasetIds: ["gcf-project-source-1"],
    },
    {
      elementId: "E-014",
      displayTitle:
        "협정 유형(제6.2조 양자/기후변화 공동위/녹색성장 MOU), 체결국, 체결 일자, 대상 분야, 이행 상태(발효/만료/갱신), 원본 링크(URL)",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.3.a.양자협정 현황",
      source: "외교부 / NIGT",
      question: "한국-베트남 기후·에너지 양자협정은 무엇이며 현재 유효한가?",
      searchText:
        "협정 유형(제6.2조 양자/기후변화 공동위/녹색성장 MOU), 체결국, 체결 일자, 대상 분야, 이행 상태(발효/만료/갱신), 원본 링크(URL) 협정 유형(제6.2조 양자/기후변화 공동위/녹색성장 MOU), 체결국, 체결 일자, 대상 분야, 이행 상태(발효/만료/갱신), 원본 링크(URL) E.3.a.양자협정 현황 협력·실행기반 외교부 / NIGT 외교부 / NIGT 한국-베트남 기후·에너지 양자협정은 무엇이며 현재 유효한가? 협정유형 체결일 대상분야 이행상태 원문",
      datasetIds: [],
    },
    {
      elementId: "E-015",
      displayTitle:
        "NDC partnership의 참여 여부(Y/N) 및 Country Page 링크(URL)",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.3.b.기타 협력 체계",
      source: "NDC Partnership",
      question: "베트남은 NDC Partnership에 참여하고 어떤 지원을 받고 있는가?",
      searchText:
        "NDC partnership의 참여 여부(Y/N) 및 Country Page 링크(URL) NDC partnership의 참여 여부(Y/N) 및 Country Page 링크(URL) E.3.b.기타 협력 체계 협력·실행기반 NDC Partnership NDC Partnership 베트남은 NDC Partnership에 참여하고 어떤 지원을 받고 있는가? 참여여부 가입/협력 현황 Country Page 지원내용",
      datasetIds: [],
    },
    {
      elementId: "E-016",
      displayTitle: "한국 기후기술 TRL",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.4.a.한국 기후기술 역량",
      source: "미정",
      question: "한국 38대 기후기술의 TRL은 어느 수준인가?",
      searchText:
        "한국 기후기술 TRL 한국 기후기술 TRL E.4.a.한국 기후기술 역량 협력·실행기반 미정 미정 한국 38대 기후기술의 TRL은 어느 수준인가? 기후기술 한국 TRL 근거 기준연도",
      datasetIds: [],
    },
    {
      elementId: "E-017",
      displayTitle: "한국-경쟁국 기후기술 비교우위",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.4.a.한국 기후기술 역량",
      source: "미정",
      question: "선택 기후기술에서 한국의 경쟁국 대비 강점·약점은 무엇인가?",
      searchText:
        "한국-경쟁국 기후기술 비교우위 한국-경쟁국 기후기술 비교우위 E.4.a.한국 기후기술 역량 협력·실행기반 미정 미정 선택 기후기술에서 한국의 경쟁국 대비 강점·약점은 무엇인가? 기술 한국 주요 경쟁국 비교지표 근거",
      datasetIds: [],
    },
    {
      elementId: "E-018",
      displayTitle:
        "기업명, 진출국, 업종(RE/에너지효율/폐기물/수처리), 진출 형태(법인/지사/프로젝트), 설립연도, 연락처, 38대 기후기술 매칭",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.4.b.국내 기업 개도국 진출 현황",
      source: "KOTRA",
      question: "한국 기업은 베트남에 어떤 방식·기술로 진출해 있는가?",
      searchText:
        "기업명, 진출국, 업종(RE/에너지효율/폐기물/수처리), 진출 형태(법인/지사/프로젝트), 설립연도, 연락처, 38대 기후기술 매칭 기업명, 진출국, 업종(RE/에너지효율/폐기물/수처리), 진출 형태(법인/지사/프로젝트), 설립연도, 연락처, 38대 기후기술 매칭 E.4.b.국내 기업 개도국 진출 현황 협력·실행기반 KOTRA KOTRA 한국 기업은 베트남에 어떤 방식·기술로 진출해 있는가? 기업 업종/기술 진출형태 설립연도 프로젝트 연락처",
      datasetIds: [],
    },
    {
      elementId: "E-019",
      displayTitle:
        "기관명(KOTRA무역관/KOICA사무소/에너지공단/KEPCO/한수원 등), 소재국, 도시, 주소, 기후·에너지 담당자 유무, 연락처, 담당 업무 범위",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.4.c.개도국 내 한국 기관 사무소",
      source: "KOTRA / KOICA",
      question:
        "베트남 내 한국 공공기관 사무소는 어디에 있고 어떤 지원을 하는가?",
      searchText:
        "기관명(KOTRA무역관/KOICA사무소/에너지공단/KEPCO/한수원 등), 소재국, 도시, 주소, 기후·에너지 담당자 유무, 연락처, 담당 업무 범위 기관명(KOTRA무역관/KOICA사무소/에너지공단/KEPCO/한수원 등), 소재국, 도시, 주소, 기후·에너지 담당자 유무, 연락처, 담당 업무 범위 E.4.c.개도국 내 한국 기관 사무소 협력·실행기반 KOTRA / KOICA KOTRA / KOICA 베트남 내 한국 공공기관 사무소는 어디에 있고 어떤 지원을 하는가? 기관 도시 주소 담당분야 연락처 업무범위",
      datasetIds: [],
    },
    {
      elementId: "E-020",
      displayTitle:
        "지원기관 명(NIGT/GTC/KOTRA/KIAT/에너지공단 등), 지원 프로그램 명, 지원 유형(실증/FS/기술이전/금융), 지원 대상(기업/연구기관), 예산 규모, 신청 시기, 원본 링크(URL)",
      category: "E",
      categoryLabel: "협력·실행기반",
      dataGroup: "E.4.d.한국 공공·민간 지원체계",
      source: "미정",
      question:
        "한국에서 활용 가능한 해외 기후기술 지원프로그램은 무엇이며 언제 신청하는가?",
      searchText:
        "지원기관 명(NIGT/GTC/KOTRA/KIAT/에너지공단 등), 지원 프로그램 명, 지원 유형(실증/FS/기술이전/금융), 지원 대상(기업/연구기관), 예산 규모, 신청 시기, 원본 링크(URL) 지원기관 명(NIGT/GTC/KOTRA/KIAT/에너지공단 등), 지원 프로그램 명, 지원 유형(실증/FS/기술이전/금융), 지원 대상(기업/연구기관), 예산 규모, 신청 시기, 원본 링크(URL) E.4.d.한국 공공·민간 지원체계 협력·실행기반 미정 미정 한국에서 활용 가능한 해외 기후기술 지원프로그램은 무엇이며 언제 신청하는가? 지원기관 프로그램 지원유형 대상 예산 신청시기 공식링크",
      datasetIds: [],
    },
  ];
