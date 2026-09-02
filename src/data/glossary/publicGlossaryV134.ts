import { CLIMATE_GLOSSARY_V74 } from "../../utils/climateGlossaryV74";

export type PublicGlossaryCategoryV134 =
  | "development-finance"
  | "economy"
  | "climate-policy"
  | "climate-risk"
  | "energy-technology"
  | "organisation"
  | "trade-investment"
  | "data-format"
  | "unit";

export interface PublicGlossaryEntryV134 {
  id: string;
  term: string;
  englishName: string;
  koreanName: string;
  definition: string;
  category: PublicGlossaryCategoryV134;
  aliases: readonly string[];
  catalogVisible?: boolean;
}

type PublicGlossarySeedV134 = Omit<PublicGlossaryEntryV134, "aliases"> & {
  aliases?: readonly string[];
};

function seedV134(
  entry: PublicGlossarySeedV134
): PublicGlossaryEntryV134 {
  return {
    ...entry,
    aliases: Array.from(new Set([entry.term, ...(entry.aliases ?? [])])),
  };
}

/**
 * V134 public seed. English expansions and Korean names follow the names used by
 * the relevant international organisation or the established Korean public-data
 * convention. Definitions deliberately describe interpretation, not internal
 * storage fields.
 */
const REQUIRED_PUBLIC_GLOSSARY_V134: PublicGlossaryEntryV134[] = [
  seedV134({
    id: "oda",
    term: "ODA",
    englishName: "Official Development Assistance",
    koreanName: "공적개발원조",
    definition:
      "개도국의 경제발전과 복지 증진을 주목적으로 하는 정부 원조입니다.",
    category: "development-finance",
  }),
  seedV134({
    id: "oecd",
    term: "OECD",
    englishName: "Organisation for Economic Co-operation and Development",
    koreanName: "경제협력개발기구",
    definition:
      "경제·사회 정책 기준과 국제 통계를 개발하는 국제기구입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "dac",
    term: "DAC",
    englishName: "Development Assistance Committee",
    koreanName: "개발원조위원회",
    definition:
      "OECD 내에서 공적개발원조의 기준과 통계를 다루는 위원회입니다.",
    category: "development-finance",
  }),
  seedV134({
    id: "crs",
    term: "CRS",
    englishName: "Creditor Reporting System",
    koreanName: "채권자보고시스템",
    definition:
      "OECD DAC이 개발협력 활동을 건별·분야별로 집계하는 통계 체계입니다.",
    category: "development-finance",
  }),
  seedV134({
    id: "oof",
    term: "OOF",
    englishName: "Other Official Flows",
    koreanName: "기타공적자금",
    definition:
      "공적기관의 개도국 자금 흐름 중 ODA 조건을 충족하지 않는 자금입니다.",
    category: "development-finance",
  }),
  seedV134({
    id: "cpi",
    term: "CPI",
    englishName: "Corruption Perceptions Index",
    koreanName: "부패인식지수",
    definition:
      "공공부문의 부패 인식 수준을 0~100점으로 나타내며 점수가 높을수록 청렴하다고 평가되는 지수입니다.",
    category: "economy",
  }),
  seedV134({
    id: "cpia",
    term: "CPIA",
    englishName: "Country Policy and Institutional Assessment",
    koreanName: "국가정책·제도평가",
    definition:
      "경제성장과 빈곤감소를 지원하는 국가의 정책·제도 여건을 평가한 지수입니다.",
    category: "economy",
  }),
  seedV134({
    id: "gdp",
    term: "GDP",
    englishName: "Gross Domestic Product",
    koreanName: "국내총생산",
    definition:
      "일정 기간 동안 국가 경제에서 생산된 최종 상품과 서비스의 가치입니다.",
    category: "economy",
  }),
  seedV134({
    id: "gni",
    term: "GNI",
    englishName: "Gross National Income",
    koreanName: "국민총소득",
    definition:
      "국민이 국내외에서 벌어들인 총소득을 나타내는 경제지표입니다.",
    category: "economy",
  }),
  seedV134({
    id: "ghg",
    term: "GHG",
    englishName: "Greenhouse Gas",
    koreanName: "온실가스",
    definition:
      "대기의 열을 흡수·방출해 기후변화에 영향을 주는 기체를 통칭합니다.",
    category: "climate-policy",
  }),
  seedV134({
    id: "ndc",
    term: "NDC",
    englishName: "Nationally Determined Contribution",
    koreanName: "국가결정기여",
    definition:
      "파리협정에 따라 각 국가가 제시하는 온실가스 감축과 적응 목표입니다.",
    category: "climate-policy",
  }),
  seedV134({
    id: "sdg",
    term: "SDG",
    englishName: "Sustainable Development Goals",
    koreanName: "지속가능발전목표",
    definition:
      "유엔 2030 의제가 제시한 17개 지속가능발전 목표입니다.",
    category: "climate-policy",
  }),
  seedV134({
    id: "btr",
    term: "BTR",
    englishName: "Biennial Transparency Report",
    koreanName: "격년투명성보고서",
    definition:
      "파리협정 투명성체계에 따라 2년마다 제출하는 국가 기후행동 보고서입니다.",
    category: "climate-policy",
  }),
  seedV134({
    id: "nap",
    term: "NAP",
    englishName: "National Adaptation Plan",
    koreanName: "국가적응계획",
    definition:
      "중·장기 기후변화 적응 수요와 우선 조치를 정리한 국가 계획입니다.",
    category: "climate-policy",
  }),
  seedV134({
    id: "mrv",
    term: "MRV",
    englishName: "Measurement, Reporting and Verification",
    koreanName: "측정·보고·검증",
    definition:
      "온실가스 배출과 감축성과를 측정하고 보고하며 검증하는 체계입니다.",
    category: "climate-policy",
  }),
  seedV134({
    id: "cbam",
    term: "CBAM",
    englishName: "Carbon Border Adjustment Mechanism",
    koreanName: "탄소국경조정제도",
    definition:
      "수입품의 내재배출량에 탄소비용을 반영하는 국경 조정제도입니다.",
    category: "trade-investment",
  }),
  seedV134({
    id: "lulucf",
    term: "LULUCF",
    englishName: "Land Use, Land-Use Change and Forestry",
    koreanName: "토지이용·토지이용변화·산림",
    definition:
      "산림·농지·초지 등 토지이용의 온실가스 배출과 흡수를 다루는 부문입니다.",
    category: "climate-policy",
  }),
  seedV134({
    id: "redd-plus",
    term: "REDD+",
    englishName:
      "Reducing Emissions from Deforestation and Forest Degradation, plus conservation and sustainable forest management",
    koreanName: "산림전용·산림황폐화 배출 감축 플러스",
    definition:
      "산림전용과 황폐화로 인한 배출을 줄이고 산림탄소를 보전·증진하는 체계입니다.",
    category: "climate-policy",
    aliases: ["REDD-plus", "REDD Plus"],
  }),
  seedV134({
    id: "gvi",
    term: "GVI",
    englishName: "GDL Vulnerability Index",
    koreanName: "글로벌데이터랩 취약성지수",
    definition:
      "사회경제적 기후취약성을 0~100으로 나타내며 높을수록 취약합니다.",
    category: "climate-risk",
  }),
  seedV134({
    id: "spei",
    term: "SPEI",
    englishName: "Standardised Precipitation-Evapotranspiration Index",
    koreanName: "표준강수증발산지수",
    definition:
      "강수량과 잠재증발산을 함께 반영해 평년 대비 건조·습윤 상태를 나타내는 표준화 지수입니다.",
    category: "climate-risk",
  }),
  seedV134({
    id: "spi",
    term: "SPI",
    englishName: "Standardised Precipitation Index",
    koreanName: "표준강수지수",
    definition:
      "일정 누적기간의 강수량을 표준화해 평년 대비 건조·습윤 상태를 나타냅니다.",
    category: "climate-risk",
  }),
  seedV134({
    id: "cmip6",
    term: "CMIP6",
    englishName: "Coupled Model Intercomparison Project Phase 6",
    koreanName: "제6차 결합모델 상호비교사업",
    definition:
      "다수 기후모델의 과거 재현과 미래 전망을 비교하는 국제 기후모델 프로젝트입니다.",
    category: "climate-risk",
  }),
  seedV134({
    id: "ssp",
    term: "SSP",
    englishName: "Shared Socioeconomic Pathways",
    koreanName: "공통사회경제경로",
    definition:
      "인구·경제·기술·정책 변화를 가정한 미래 사회경제 경로입니다.",
    category: "climate-risk",
  }),
  seedV134({
    id: "lcoe",
    term: "LCOE",
    englishName: "Levelized Cost of Electricity",
    koreanName: "균등화 발전비용",
    definition:
      "발전소 수명기간의 총비용을 총 발전량으로 나눈 전력 단위당 비용입니다.",
    category: "energy-technology",
  }),
  seedV134({
    id: "ccs",
    term: "CCS",
    englishName: "Carbon Capture and Storage",
    koreanName: "탄소포집·저장",
    definition:
      "배출원의 이산화탄소를 포집해 장기간 저장하는 기술 체계입니다.",
    category: "energy-technology",
  }),
  seedV134({
    id: "ccus",
    term: "CCUS",
    englishName: "Carbon Capture, Utilisation and Storage",
    koreanName: "탄소포집·활용·저장",
    definition:
      "포집한 이산화탄소를 활용하거나 장기간 저장하는 기술 체계입니다.",
    category: "energy-technology",
  }),
  seedV134({
    id: "trl",
    term: "TRL",
    englishName: "Technology Readiness Level",
    koreanName: "기술준비수준",
    definition:
      "연구·실증·상용화에 이르는 기술의 성숙도를 단계별로 나타낸 척도입니다.",
    category: "energy-technology",
  }),
  seedV134({
    id: "gcf",
    term: "GCF",
    englishName: "Green Climate Fund",
    koreanName: "녹색기후기금",
    definition:
      "개도국의 온실가스 감축과 기후변화 적응을 지원하는 국제 기후기금입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "ctcn",
    term: "CTCN",
    englishName: "Climate Technology Centre and Network",
    koreanName: "기후기술센터·네트워크",
    definition:
      "개도국이 요청하는 기후기술 지원을 연결하는 UNFCCC 기술메커니즘 실행기구입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "adb",
    term: "ADB",
    englishName: "Asian Development Bank",
    koreanName: "아시아개발은행",
    definition:
      "아시아·태평양 지역의 개발사업과 정책을 지원하는 다자개발은행입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "edcf",
    term: "EDCF",
    englishName: "Economic Development Cooperation Fund",
    koreanName: "대외경제협력기금",
    definition:
      "개도국의 경제·사회 인프라 개발을 양허성 차관으로 지원하는 한국의 기금입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "koica",
    term: "KOICA",
    englishName: "Korea International Cooperation Agency",
    koreanName: "한국국제협력단",
    definition:
      "무상원조와 기술협력 사업을 시행하는 한국의 공적개발원조 전담기관입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "iati",
    term: "IATI",
    englishName: "International Aid Transparency Initiative",
    koreanName: "국제원조투명성이니셔티브",
    definition:
      "개발협력 자금과 사업 정보를 공통 형식으로 공개하는 국제 표준·협력체입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "ppp-project",
    term: "PPP",
    englishName: "Public-Private Partnership",
    koreanName: "민관협력",
    definition:
      "공공부문과 민간부문이 장기 계약을 통해 인프라·공공서비스를 조달·운영하는 방식입니다.",
    category: "trade-investment",
  }),
  seedV134({
    id: "ppp-economy",
    term: "PPP",
    englishName: "Purchasing Power Parity",
    koreanName: "구매력평가",
    definition:
      "국가별 물가수준 차이를 보정해 화폐의 실질 구매력을 비교하는 환산 기준입니다.",
    category: "economy",
    aliases: [],
  }),
  seedV134({
    id: "fta",
    term: "FTA",
    englishName: "Free Trade Agreement",
    koreanName: "자유무역협정",
    definition:
      "체결 당사국 간 관세와 비관세 무역장벽을 완화하는 협정입니다.",
    category: "trade-investment",
  }),
  seedV134({
    id: "vcm",
    term: "VCM",
    englishName: "Voluntary Carbon Market",
    koreanName: "자발적 탄소시장",
    definition:
      "법적 의무가 아닌 자발적 목표를 위해 탄소크레딧을 발행·거래·상쇄하는 시장입니다.",
    category: "trade-investment",
  }),
  seedV134({
    id: "mac",
    term: "MAC",
    englishName: "Marginal Abatement Cost",
    koreanName: "한계저감비용",
    definition:
      "온실가스 1톤을 추가로 감축하는 데 드는 증분 비용입니다.",
    category: "trade-investment",
  }),
  seedV134({
    id: "re",
    term: "RE",
    englishName: "Renewable Energy",
    koreanName: "재생에너지",
    definition:
      "태양광·풍력·수력 등 지속적으로 보충되는 에너지원입니다.",
    category: "energy-technology",
  }),
  seedV134({
    id: "fit",
    term: "FIT",
    englishName: "Feed-in Tariff",
    koreanName: "발전차액지원제도",
    definition:
      "재생에너지 전력을 정해진 기간과 가격으로 매입해 보상하는 제도입니다.",
    category: "energy-technology",
  }),
  seedV134({
    id: "research-development",
    term: "R&D",
    englishName: "Research and Development",
    koreanName: "연구개발",
    definition:
      "새로운 지식과 기술·제품·공정을 만들거나 개선하는 활동입니다.",
    category: "energy-technology",
  }),
  seedV134({
    id: "operation-maintenance",
    term: "O&M",
    englishName: "Operation and Maintenance",
    koreanName: "운영·유지보수",
    definition:
      "설비와 인프라를 정상 상태로 운영하고 점검·정비하는 활동입니다.",
    category: "energy-technology",
  }),
  seedV134({
    id: "usd",
    term: "USD",
    englishName: "United States Dollar",
    koreanName: "미국 달러",
    definition: "미국의 법정통화이며 국제 금액 비교에 널리 쓰입니다.",
    category: "unit",
  }),
  seedV134({
    id: "vnd",
    term: "VND",
    englishName: "Vietnamese Dong",
    koreanName: "베트남 동",
    definition: "베트남의 법정통화 단위입니다.",
    category: "unit",
  }),
  seedV134({
    id: "mw",
    term: "MW",
    englishName: "Megawatt",
    koreanName: "메가와트",
    definition: "100만 와트에 해당하며 주로 발전설비 용량을 나타내는 단위입니다.",
    category: "unit",
  }),
  seedV134({
    id: "gw",
    term: "GW",
    englishName: "Gigawatt",
    koreanName: "기가와트",
    definition: "10억 와트, 즉 1,000 MW에 해당하는 발전설비 용량 단위입니다.",
    category: "unit",
  }),
  seedV134({
    id: "kv",
    term: "kV",
    englishName: "Kilovolt",
    koreanName: "킬로볼트",
    definition: "1,000볼트에 해당하며 송·배전망의 전압을 나타내는 단위입니다.",
    category: "unit",
  }),
  seedV134({
    id: "gwh",
    term: "GWh",
    englishName: "Gigawatt-hour",
    koreanName: "기가와트시",
    definition: "100만 kWh에 해당하는 전력량 단위입니다.",
    category: "unit",
  }),
  seedV134({
    id: "twh",
    term: "TWh",
    englishName: "Terawatt-hour",
    koreanName: "테라와트시",
    definition: "10억 kWh, 즉 1,000 GWh에 해당하는 전력량 단위입니다.",
    category: "unit",
  }),
  seedV134({
    id: "hectare",
    term: "ha",
    englishName: "Hectare",
    koreanName: "헥타르",
    definition: "10,000 m²에 해당하는 면적 단위입니다.",
    category: "unit",
  }),
  seedV134({
    id: "hectare-per-year",
    term: "ha/yr",
    englishName: "Hectares per year",
    koreanName: "연간 헥타르",
    definition: "1년 동안 변한 산림·토지 면적을 나타내는 단위입니다.",
    category: "unit",
  }),
  seedV134({
    id: "tco2e",
    term: "tCO₂e",
    englishName: "Tonne of carbon dioxide equivalent",
    koreanName: "톤 이산화탄소환산량",
    definition:
      "온실가스의 영향을 이산화탄소 1톤과 같은 기준으로 환산한 단위입니다.",
    category: "unit",
    aliases: ["tCO2e", "tCO₂eq", "tCO2eq"],
  }),
  seedV134({
    id: "ktco2e",
    term: "ktCO₂e",
    englishName: "Kilotonne of carbon dioxide equivalent",
    koreanName: "천 톤 이산화탄소환산량",
    definition: "1,000 tCO₂e에 해당하는 온실가스 배출·감축량 단위입니다.",
    category: "unit",
    aliases: ["ktCO2e", "ktCO₂eq", "ktCO2eq"],
  }),
  seedV134({
    id: "mtco2e",
    term: "MtCO₂e",
    englishName: "Million tonnes of carbon dioxide equivalent",
    koreanName: "백만 톤 이산화탄소환산량",
    definition: "100만 tCO₂e에 해당하는 온실가스 배출·감축량 단위입니다.",
    category: "unit",
    aliases: ["MtCO2e", "MtCO₂eq", "MtCO2eq"],
  }),
  seedV134({
    id: "celsius",
    term: "°C",
    englishName: "Degree Celsius",
    koreanName: "섭씨도",
    definition: "온도와 온도 변화량을 나타내는 단위입니다.",
    category: "unit",
  }),
];

/** High-frequency names found in the 152-item catalog and public UI. */
const CATALOG_PUBLIC_GLOSSARY_V134: PublicGlossaryEntryV134[] = [
  seedV134({ id: "afd", term: "AFD", englishName: "Agence française de développement", koreanName: "프랑스개발청", definition: "프랑스의 공공 개발금융기관으로 개발협력 사업과 정책금융을 지원합니다.", category: "organisation" }),
  seedV134({ id: "afolu", term: "AFOLU", englishName: "Agriculture, Forestry and Other Land Use", koreanName: "농업·산림·기타 토지이용", definition: "농업과 산림, 기타 토지이용에서 발생하는 온실가스 배출·흡수를 함께 다루는 부문입니다.", category: "climate-policy" }),
  seedV134({ id: "asean", term: "ASEAN", englishName: "Association of Southeast Asian Nations", koreanName: "동남아시아국가연합", definition: "동남아시아 국가들의 경제·사회·안보 협력을 위한 지역 협력체입니다.", category: "organisation" }),
  seedV134({ id: "bau", term: "BAU", englishName: "Business as Usual", koreanName: "기준전망", definition: "추가 정책이나 조치가 없다고 가정한 기준 시나리오입니다.", category: "climate-policy" }),
  seedV134({ id: "bess", term: "BESS", englishName: "Battery Energy Storage System", koreanName: "배터리 에너지저장장치", definition: "전력을 배터리에 저장했다가 필요한 시점에 공급하는 설비입니다.", category: "energy-technology" }),
  seedV134({ id: "bur", term: "BUR", englishName: "Biennial Update Report", koreanName: "격년갱신보고서", definition: "개도국이 온실가스 배출과 기후행동 현황을 2년 주기로 갱신해 제출하던 보고서입니다.", category: "climate-policy", aliases: ["BUR1", "BUR2", "BUR3"] }),
  seedV134({ id: "cdm", term: "CDM", englishName: "Clean Development Mechanism", koreanName: "청정개발체제", definition: "교토의정서에 따라 개도국 감축사업의 실적을 탄소배출권으로 인정한 제도입니다.", category: "climate-policy" }),
  seedV134({ id: "cgiar", term: "CGIAR", englishName: "CGIAR global research partnership", koreanName: "국제농업연구협의그룹", definition: "식량안보와 지속가능한 농업을 연구하는 국제 연구기관 연합입니다.", category: "organisation" }),
  seedV134({ id: "ch4", term: "CH₄", englishName: "Methane", koreanName: "메탄", definition: "이산화탄소보다 온난화 영향이 큰 주요 온실가스입니다.", category: "climate-policy", aliases: ["CH4"] }),
  seedV134({ id: "hfc", term: "HFCs", englishName: "Hydrofluorocarbons", koreanName: "수소불화탄소", definition: "냉매 등에 사용되며 종류에 따라 온실효과가 큰 합성 온실가스 군입니다.", category: "climate-policy", aliases: ["HFC", "HFC-23", "HFC-125", "HFC-227ea"] }),
  seedV134({ id: "co2", term: "CO₂", englishName: "Carbon dioxide", koreanName: "이산화탄소", definition: "화석연료 연소와 토지이용 변화 등에서 배출되는 대표적인 온실가스입니다.", category: "climate-policy", aliases: ["CO2"] }),
  seedV134({ id: "cop", term: "COP", englishName: "Conference of the Parties", koreanName: "당사국총회", definition: "유엔기후변화협약 당사국들이 기후정책과 이행을 논의하는 총회입니다.", category: "climate-policy", aliases: ["COP26", "COP27", "COP28", "COP29", "COP30"] }),
  seedV134({ id: "daly", term: "DALY", englishName: "Disability-Adjusted Life Year", koreanName: "장애보정생존연수", definition: "조기사망과 질병·장애로 잃은 건강수명을 합산한 보건지표입니다.", category: "economy" }),
  seedV134({ id: "drr", term: "DRR", englishName: "Disaster Risk Reduction", koreanName: "재난위험경감", definition: "재난의 노출·취약성·피해를 줄이기 위한 정책과 활동입니다.", category: "climate-risk" }),
  seedV134({ id: "evn", term: "EVN", englishName: "Vietnam Electricity", koreanName: "베트남전력공사", definition: "베트남의 발전·송전·배전 체계를 담당하는 국영 전력기업입니다.", category: "organisation" }),
  seedV134({ id: "fdi", term: "FDI", englishName: "Foreign Direct Investment", koreanName: "외국인직접투자", definition: "외국 투자자가 기업 경영과 장기 사업에 직접 참여하는 투자입니다.", category: "trade-investment" }),
  seedV134({ id: "gdl", term: "GDL", englishName: "Global Data Lab", koreanName: "글로벌데이터랩", definition: "국가 하위지역의 사회경제·인구·취약성 지표를 제공하는 연구 데이터 플랫폼입니다.", category: "organisation" }),
  seedV134({ id: "gfw", term: "GFW", englishName: "Global Forest Watch", koreanName: "글로벌산림감시", definition: "위성자료와 공개 데이터를 이용해 산림 변화를 제공하는 국제 모니터링 플랫폼입니다.", category: "organisation" }),
  seedV134({ id: "gis", term: "GIS", englishName: "Geographic Information System", koreanName: "지리정보시스템", definition: "위치정보와 속성정보를 함께 저장·분석·표현하는 정보시스템입니다.", category: "data-format" }),
  seedV134({ id: "giz", term: "GIZ", englishName: "Deutsche Gesellschaft für Internationale Zusammenarbeit", koreanName: "독일국제협력공사", definition: "독일 정부를 대신해 국제개발협력과 기술협력 사업을 수행하는 기관입니다.", category: "organisation" }),
  seedV134({ id: "gso", term: "GSO", englishName: "General Statistics Office of Viet Nam", koreanName: "베트남 통계총국", definition: "베트남의 공식 국가통계를 생산·공표하는 정부 통계기관입니다.", category: "organisation" }),
  seedV134({ id: "gggi", term: "GGGI", englishName: "Global Green Growth Institute", koreanName: "글로벌녹색성장기구", definition: "개도국의 저탄소·회복력 있는 녹색성장 전환을 지원하는 국제기구입니다.", category: "organisation" }),
  seedV134({ id: "gms", term: "GMS", englishName: "Greater Mekong Subregion", koreanName: "메콩강확대유역", definition: "캄보디아·중국·라오스·미얀마·태국·베트남이 참여하는 메콩 지역 협력범위입니다.", category: "organisation" }),
  seedV134({ id: "gwp", term: "GWP", englishName: "Global Warming Potential", koreanName: "지구온난화지수", definition: "온실가스가 일정 기간 대기에 미치는 온난화 영향을 이산화탄소와 비교한 값입니다.", category: "climate-policy" }),
  seedV134({ id: "hdi", term: "HDI", englishName: "Human Development Index", koreanName: "인간개발지수", definition: "기대수명·교육·소득을 종합해 인간개발 수준을 나타내는 지수입니다.", category: "economy" }),
  seedV134({ id: "ibrd", term: "IBRD", englishName: "International Bank for Reconstruction and Development", koreanName: "국제부흥개발은행", definition: "세계은행그룹에서 중소득국과 신용도 있는 저소득국에 금융·지식을 제공하는 기관입니다.", category: "organisation" }),
  seedV134({ id: "ict", term: "ICT", englishName: "Information and Communications Technology", koreanName: "정보통신기술", definition: "정보를 수집·처리·전송하는 컴퓨팅과 통신 기술을 통칭합니다.", category: "energy-technology" }),
  seedV134({ id: "ifad", term: "IFAD", englishName: "International Fund for Agricultural Development", koreanName: "국제농업개발기금", definition: "농촌 빈곤감소와 농업·식량체계 개선을 지원하는 유엔 전문기구입니다.", category: "organisation" }),
  seedV134({ id: "ilo", term: "ILO", englishName: "International Labour Organization", koreanName: "국제노동기구", definition: "노동기준과 양질의 일자리, 사회보호를 다루는 유엔 전문기구입니다.", category: "organisation" }),
  seedV134({ id: "iom", term: "IOM", englishName: "International Organization for Migration", koreanName: "국제이주기구", definition: "안전하고 질서 있는 이주와 이주민 지원을 담당하는 유엔 관련기구입니다.", category: "organisation" }),
  seedV134({ id: "imf", term: "IMF", englishName: "International Monetary Fund", koreanName: "국제통화기금", definition: "국제 금융안정과 통화협력, 회원국 경제정책을 지원하는 국제기구입니다.", category: "organisation" }),
  seedV134({ id: "indc", term: "INDC", englishName: "Intended Nationally Determined Contribution", koreanName: "자발적 국가결정기여", definition: "파리협정 채택 전에 각 국가가 제출한 온실가스 감축·적응 기여안입니다.", category: "climate-policy" }),
  seedV134({ id: "jetp", term: "JETP", englishName: "Just Energy Transition Partnership", koreanName: "공정에너지전환파트너십", definition: "석탄 중심 에너지체계의 공정한 전환을 국제 공공·민간 재원으로 지원하는 협력체계입니다.", category: "development-finance" }),
  seedV134({ id: "jica", term: "JICA", englishName: "Japan International Cooperation Agency", koreanName: "일본국제협력기구", definition: "일본의 유상·무상원조와 기술협력을 수행하는 개발협력기관입니다.", category: "organisation" }),
  seedV134({ id: "jcm", term: "JCM", englishName: "Joint Crediting Mechanism", koreanName: "공동크레딧메커니즘", definition: "일본과 협력국의 감축사업 성과를 양국이 합의한 방식으로 산정·배분하는 제도입니다.", category: "climate-policy" }),
  seedV134({ id: "kepco", term: "KEPCO", englishName: "Korea Electric Power Corporation", koreanName: "한국전력공사", definition: "한국의 전력 송배전과 판매를 담당하는 공기업입니다.", category: "organisation" }),
  seedV134({ id: "kita", term: "KITA", englishName: "Korea International Trade Association", koreanName: "한국무역협회", definition: "한국 기업의 무역과 해외진출을 지원하는 민간 경제단체입니다.", category: "organisation" }),
  seedV134({ id: "kotra", term: "KOTRA", englishName: "Korea Trade-Investment Promotion Agency", koreanName: "대한무역투자진흥공사", definition: "한국 기업의 해외진출과 외국인투자 유치를 지원하는 공공기관입니다.", category: "organisation" }),
  seedV134({ id: "lng", term: "LNG", englishName: "Liquefied Natural Gas", koreanName: "액화천연가스", definition: "천연가스를 냉각해 액체로 만든 연료로 저장·운송에 이용됩니다.", category: "energy-technology" }),
  seedV134({ id: "mard", term: "MARD", englishName: "Ministry of Agriculture and Rural Development of Viet Nam", koreanName: "베트남 농업농촌개발부", definition: "베트남의 농업·산림·수자원·농촌개발 정책을 담당한 정부부처입니다.", category: "organisation" }),
  seedV134({ id: "moit", term: "MOIT", englishName: "Ministry of Industry and Trade of Viet Nam", koreanName: "베트남 산업무역부", definition: "베트남의 산업·에너지·무역 정책을 담당하는 정부부처입니다.", category: "organisation" }),
  seedV134({ id: "monre", term: "MONRE", englishName: "Ministry of Natural Resources and Environment of Viet Nam", koreanName: "베트남 천연자원환경부", definition: "베트남의 토지·환경·기후변화 정책을 담당한 정부부처입니다.", category: "organisation" }),
  seedV134({ id: "mou", term: "MOU", englishName: "Memorandum of Understanding", koreanName: "양해각서", definition: "기관 간 협력의 목적과 역할을 합의해 기록한 문서입니다.", category: "trade-investment" }),
  seedV134({ id: "mrc", term: "MRC", englishName: "Mekong River Commission", koreanName: "메콩강위원회", definition: "메콩강 하류 국가들이 수자원을 공동 관리하기 위해 설립한 정부 간 기구입니다.", category: "organisation" }),
  seedV134({ id: "n2o", term: "N₂O", englishName: "Nitrous oxide", koreanName: "아산화질소", definition: "농업 토양과 산업공정 등에서 배출되는 주요 온실가스입니다.", category: "climate-policy", aliases: ["N2O"] }),
  seedV134({ id: "nama", term: "NAMA", englishName: "Nationally Appropriate Mitigation Action", koreanName: "국가적정감축행동", definition: "개도국의 국가 여건에 맞게 설계한 온실가스 감축 정책·사업입니다.", category: "climate-policy" }),
  seedV134({ id: "ngo", term: "NGO", englishName: "Non-Governmental Organization", koreanName: "비정부기구", definition: "정부에 속하지 않고 공익·개발·환경 등 목적을 위해 활동하는 민간 조직입니다.", category: "organisation" }),
  seedV134({ id: "npv", term: "NPV", englishName: "Net Present Value", koreanName: "순현재가치", definition: "미래 현금흐름을 현재가치로 환산해 비용을 뺀 투자경제성 지표입니다.", category: "economy" }),
  seedV134({ id: "ocha", term: "OCHA", englishName: "United Nations Office for the Coordination of Humanitarian Affairs", koreanName: "유엔 인도주의업무조정국", definition: "재난·분쟁 상황의 국제 인도주의 대응과 정보공유를 조정하는 유엔 사무국입니다.", category: "organisation" }),
  seedV134({ id: "pm25", term: "PM2.5", englishName: "Particulate matter 2.5 micrometres or smaller", koreanName: "초미세먼지", definition: "지름이 2.5마이크로미터 이하인 미세 입자로 대기질과 건강영향 지표에 사용됩니다.", category: "climate-risk" }),
  seedV134({ id: "sdsn", term: "SDSN", englishName: "Sustainable Development Solutions Network", koreanName: "지속가능발전해법네트워크", definition: "지속가능발전목표 이행을 위한 연구와 정책해법을 연결하는 국제 네트워크입니다.", category: "organisation" }),
  seedV134({ id: "sfm", term: "SFM", englishName: "Sustainable Forest Management", koreanName: "지속가능한 산림경영", definition: "산림의 생태·경제·사회 기능을 장기적으로 유지하도록 관리하는 방식입니다.", category: "climate-policy" }),
  seedV134({ id: "sme", term: "SME", englishName: "Small and Medium-sized Enterprise", koreanName: "중소기업", definition: "규모 기준에 따라 대기업보다 작은 기업을 통칭합니다.", category: "economy" }),
  seedV134({ id: "un", term: "UN", englishName: "United Nations", koreanName: "유엔", definition: "국제평화·개발·인권과 국제협력을 위한 정부 간 국제기구입니다.", category: "organisation" }),
  seedV134({ id: "unctad", term: "UNCTAD", englishName: "United Nations Conference on Trade and Development", koreanName: "유엔무역개발회의", definition: "개도국의 무역·투자·개발정책을 지원하고 국제 통계를 제공하는 유엔기구입니다.", category: "organisation" }),
  seedV134({ id: "undp", term: "UNDP", englishName: "United Nations Development Programme", koreanName: "유엔개발계획", definition: "빈곤감소·거버넌스·기후·지속가능발전을 지원하는 유엔 개발기구입니다.", category: "organisation" }),
  seedV134({ id: "unep", term: "UNEP", englishName: "United Nations Environment Programme", koreanName: "유엔환경계획", definition: "환경정책과 국제 환경협력을 이끄는 유엔의 환경 전담기구입니다.", category: "organisation" }),
  seedV134({ id: "unicef", term: "UNICEF", englishName: "United Nations Children's Fund", koreanName: "유엔아동기금", definition: "아동의 생존·보호·교육·보건을 지원하는 유엔기구입니다.", category: "organisation" }),
  seedV134({ id: "unido", term: "UNIDO", englishName: "United Nations Industrial Development Organization", koreanName: "유엔산업개발기구", definition: "포용적이고 지속가능한 산업개발을 지원하는 유엔 전문기구입니다.", category: "organisation" }),
  seedV134({ id: "unodc", term: "UNODC", englishName: "United Nations Office on Drugs and Crime", koreanName: "유엔마약범죄사무소", definition: "마약·범죄·부패 대응을 지원하는 유엔 사무소입니다.", category: "organisation" }),
  seedV134({ id: "unops", term: "UNOPS", englishName: "United Nations Office for Project Services", koreanName: "유엔프로젝트조달기구", definition: "인프라·조달·프로젝트 관리를 지원하는 유엔 운영기관입니다.", category: "organisation" }),
  seedV134({ id: "uspto", term: "USPTO", englishName: "United States Patent and Trademark Office", koreanName: "미국 특허상표청", definition: "미국의 특허와 상표 출원·등록을 담당하는 연방기관입니다.", category: "organisation" }),
  seedV134({ id: "vast", term: "VAST", englishName: "Vietnam Academy of Science and Technology", koreanName: "베트남과학기술원", definition: "베트남의 자연과학·기술 연구를 수행하는 국가 연구기관입니다.", category: "organisation" }),
  seedV134({ id: "vcci", term: "VCCI", englishName: "Vietnam Chamber of Commerce and Industry", koreanName: "베트남상공회의소", definition: "베트남 기업의 경영환경과 무역·투자 활동을 지원하는 경제단체입니다.", category: "organisation" }),
  seedV134({ id: "vnu", term: "VNU", englishName: "Vietnam National University", koreanName: "베트남국립대학교", definition: "하노이와 호찌민시에 국가대학 체계를 둔 베트남의 국립 종합대학입니다.", category: "organisation" }),
  seedV134({ id: "wdi", term: "WDI", englishName: "World Development Indicators", koreanName: "세계개발지표", definition: "세계은행이 제공하는 국가별 경제·사회·환경 개발지표 모음입니다.", category: "economy" }),
  seedV134({ id: "who", term: "WHO", englishName: "World Health Organization", koreanName: "세계보건기구", definition: "국제 보건기준과 질병 대응을 담당하는 유엔 전문기구입니다.", category: "organisation" }),
  seedV134({ id: "wri", term: "WRI", englishName: "World Resources Institute", koreanName: "세계자원연구소", definition: "기후·에너지·산림·도시·물 분야의 연구와 공개 데이터를 제공하는 기관입니다.", category: "organisation" }),
  seedV134({ id: "wto", term: "WTO", englishName: "World Trade Organization", koreanName: "세계무역기구", definition: "국제 무역규범과 분쟁해결, 무역정책 검토를 담당하는 국제기구입니다.", category: "organisation" }),
  seedV134({
    id: "csv",
    term: "CSV",
    englishName: "Comma-Separated Values",
    koreanName: "쉼표로 구분한 값",
    definition: "표 형태의 데이터를 쉼표로 구분해 저장하는 텍스트 파일 형식입니다.",
    category: "data-format",
  }),
  seedV134({
    id: "json",
    term: "JSON",
    englishName: "JavaScript Object Notation",
    koreanName: "자바스크립트 객체 표기법",
    definition: "키와 값의 구조로 데이터를 교환하는 텍스트 형식입니다.",
    category: "data-format",
  }),
  seedV134({
    id: "geojson",
    term: "GeoJSON",
    englishName: "Geographic JSON",
    koreanName: "지리공간 JSON 형식",
    definition: "점·선·면 지리객체와 속성을 JSON으로 표현하는 공간데이터 형식입니다.",
    category: "data-format",
  }),
  seedV134({
    id: "ipcc",
    term: "IPCC",
    englishName: "Intergovernmental Panel on Climate Change",
    koreanName: "기후변화에 관한 정부 간 협의체",
    definition: "기후변화의 과학·영향·대응 지식을 평가하는 유엔 협의체입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "fao",
    term: "FAO",
    englishName: "Food and Agriculture Organization of the United Nations",
    koreanName: "유엔식량농업기구",
    definition: "식량·농업·산림·수산 정책과 국제 통계를 다루는 유엔 전문기구입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "faostat",
    term: "FAOSTAT",
    englishName: "FAO Statistical Database",
    koreanName: "FAO 통계 데이터베이스",
    definition: "유엔식량농업기구가 제공하는 식량·농업·산림 국제 통계 데이터베이스입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "usgs",
    term: "USGS",
    englishName: "United States Geological Survey",
    koreanName: "미국 지질조사국",
    definition: "지질·수자원·지형·재해 정보를 제공하는 미국 연방 과학기관입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "nasa",
    term: "NASA",
    englishName: "National Aeronautics and Space Administration",
    koreanName: "미국 항공우주국",
    definition: "위성관측·지구과학·우주 데이터를 제공하는 미국 연방 기관입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "jrc",
    term: "JRC",
    englishName: "Joint Research Centre",
    koreanName: "유럽연합 공동연구센터",
    definition: "유럽연합 정책에 과학적 근거와 데이터를 제공하는 집행위원회 연구조직입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "iiasa",
    term: "IIASA",
    englishName: "International Institute for Applied Systems Analysis",
    koreanName: "국제응용시스템분석연구소",
    definition: "기후·에너지·인구 등 복합 시스템을 분석하는 국제 연구기관입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "wwf",
    term: "WWF",
    englishName: "World Wide Fund for Nature",
    koreanName: "세계자연기금",
    definition: "자연보전과 생물다양성 보호를 위해 활동하는 국제 비정부기구입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "eu",
    term: "EU",
    englishName: "European Union",
    koreanName: "유럽연합",
    definition: "유럽 회원국이 경제·정치·법제 협력을 수행하는 연합체입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "esmap",
    term: "ESMAP",
    englishName: "Energy Sector Management Assistance Program",
    koreanName: "에너지부문관리지원프로그램",
    definition: "세계은행이 운영하는 저탄소·지속가능 에너지 기술지원 프로그램입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "ccdr",
    term: "CCDR",
    englishName: "Country Climate and Development Report",
    koreanName: "국가 기후·개발 보고서",
    definition: "기후와 개발 목표을 함께 달성하기 위한 우선과제를 분석한 세계은행 국가보고서입니다.",
    category: "climate-policy",
  }),
  seedV134({
    id: "cckp",
    term: "CCKP",
    englishName: "Climate Change Knowledge Portal",
    koreanName: "기후변화지식포털",
    definition: "세계은행이 국가별 기후관측과 미래전망 데이터를 제공하는 포털입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "cpeir",
    term: "CPEIR",
    englishName: "Climate Public Expenditure and Institutional Review",
    koreanName: "기후 공공지출·제도 검토",
    definition: "기후 관련 공공지출과 제도·예산 체계를 분석하는 평가 방법입니다.",
    category: "climate-policy",
  }),
  seedV134({
    id: "inform",
    term: "INFORM",
    englishName: "Index for Risk Management",
    koreanName: "위기관리 위험지수",
    definition: "위험·취약성·대응역량을 종합해 인도주의적 위기 위험을 비교하는 지수입니다.",
    category: "climate-risk",
  }),
  seedV134({
    id: "mpi-index",
    term: "MPI",
    englishName: "Multidimensional Poverty Index",
    koreanName: "다차원빈곤지수",
    definition: "건강·교육·생활수준의 복합적 빈곤 상태를 나타내는 지수입니다.",
    category: "economy",
  }),
  seedV134({
    id: "mpi-ministry",
    term: "MPI",
    englishName: "Ministry of Planning and Investment of Viet Nam",
    koreanName: "베트남 기획투자부",
    definition:
      "베트남의 국가계획·공공투자·개발협력 정책을 담당했던 정부부처입니다.",
    category: "organisation",
  }),
  seedV134({
    id: "mtoe",
    term: "Mtoe",
    englishName: "Million tonnes of oil equivalent",
    koreanName: "백만 톤 석유환산량",
    definition: "여러 에너지원의 열량을 원유 100만 톤의 에너지로 환산한 단위입니다.",
    category: "unit",
  }),
  seedV134({
    id: "kwh",
    term: "kWh",
    englishName: "Kilowatt-hour",
    koreanName: "킬로와트시",
    definition: "1 kW의 전력을 1시간 사용한 전력량 단위입니다.",
    category: "unit",
  }),
  seedV134({
    id: "watt-per-square-metre",
    term: "W/m²",
    englishName: "Watts per square metre",
    koreanName: "제곱미터당 와트",
    definition: "면적 1 m²당 복사에너지 또는 전력의 세기를 나타내는 단위입니다.",
    category: "unit",
  }),
  seedV134({ id: "api", term: "API", englishName: "Application Programming Interface", koreanName: "응용프로그램 인터페이스", definition: "서로 다른 소프트웨어가 정해진 방식으로 데이터와 기능을 주고받는 연결 규칙입니다.", category: "data-format" }),
  seedV134({ id: "aquastat", term: "AQUASTAT", englishName: "FAO Global Information System on Water and Agriculture", koreanName: "FAO 물·농업 정보시스템", definition: "국가별 수자원과 농업용수 통계를 제공하는 유엔식량농업기구의 국제 정보시스템입니다.", category: "organisation" }),
  seedV134({ id: "bot", term: "BOT", englishName: "Build-Operate-Transfer", koreanName: "건설·운영·이전", definition: "민간이 시설을 건설·운영한 뒤 약정 기간 후 공공에 이전하는 사업방식입니다.", category: "trade-investment" }),
  seedV134({ id: "cagr", term: "CAGR", englishName: "Compound Annual Growth Rate", koreanName: "연평균 복합성장률", definition: "시작값과 종료값 사이의 연평균 성장속도를 복리 기준으로 환산한 값입니다.", category: "economy" }),
  seedV134({ id: "ccgt", term: "CCGT", englishName: "Combined Cycle Gas Turbine", koreanName: "가스복합화력", definition: "가스터빈과 증기터빈을 결합해 연료 이용효율을 높인 발전방식입니다.", category: "energy-technology" }),
  seedV134({ id: "cci-lc", term: "CCI-LC", englishName: "Climate Change Initiative Land Cover", koreanName: "기후변화 이니셔티브 토지피복", definition: "유럽우주국 기후변화 이니셔티브가 위성관측으로 구축한 토지피복 자료입니다.", category: "climate-risk", aliases: ["CCI_LC"] }),
  seedV134({ id: "ctf", term: "CTF", englishName: "Clean Technology Fund", koreanName: "청정기술기금", definition: "개도국의 저탄소 기술 보급과 에너지전환 투자를 지원하는 기후투자기금입니다.", category: "development-finance" }),
  seedV134({ id: "co2e", term: "CO₂e", englishName: "Carbon dioxide equivalent", koreanName: "이산화탄소환산량", definition: "여러 온실가스의 온난화 영향을 같은 양의 이산화탄소로 환산한 값입니다.", category: "unit", aliases: ["CO2e", "CO2eq", "CO₂eq"] }),
  seedV134({ id: "co2e-per-year", term: "CO₂e/yr", englishName: "Carbon dioxide equivalent per year", koreanName: "연간 이산화탄소환산량", definition: "1년 동안의 온실가스 배출·감축량을 이산화탄소환산량으로 나타낸 단위입니다.", category: "unit", aliases: ["CO2e/yr", "CO2eq/yr"] }),
  seedV134({ id: "co2-eor", term: "CO2-EOR", englishName: "Carbon dioxide enhanced oil recovery", koreanName: "이산화탄소 활용 석유회수증진", definition: "이산화탄소를 주입해 유전의 원유 회수율을 높이는 기술입니다.", category: "energy-technology" }),
  seedV134({ id: "epsg", term: "EPSG", englishName: "European Petroleum Survey Group geodetic parameter registry", koreanName: "좌표계 식별자 등록체계", definition: "좌표참조체계와 좌표변환 방법을 고유 코드로 식별하는 국제 등록체계입니다.", category: "data-format" }),
  seedV134({ id: "ev", term: "EV", englishName: "Electric Vehicle", koreanName: "전기자동차", definition: "외부에서 충전한 전기나 차량 내 전력으로 구동하는 자동차입니다.", category: "energy-technology" }),
  seedV134({ id: "fid", term: "FID", englishName: "Final Investment Decision", koreanName: "최종투자결정", definition: "사업주가 프로젝트의 본격적인 건설·투자 집행을 최종 승인하는 단계입니다.", category: "trade-investment" }),
  seedV134({ id: "frl", term: "FRL", englishName: "Forest Reference Level", koreanName: "산림기준수준", definition: "산림부문 감축성과를 비교하기 위해 설정하는 기준 배출·흡수 수준입니다.", category: "climate-policy" }),
  seedV134({ id: "gerd", term: "GERD", englishName: "Gross Domestic Expenditure on Research and Development", koreanName: "국내총 연구개발비", definition: "한 국가 안에서 수행된 연구개발 활동에 지출한 총액입니다.", category: "economy" }),
  seedV134({ id: "ippu", term: "IPPU", englishName: "Industrial Processes and Product Use", koreanName: "산업공정·제품사용", definition: "연료 연소 외 산업공정과 제품 사용에서 발생하는 온실가스를 다루는 부문입니다.", category: "climate-policy" }),
  seedV134({ id: "irai", term: "IRAI", englishName: "IDA Resource Allocation Index", koreanName: "IDA 자원배분지수", definition: "세계은행의 국가정책·제도평가 결과를 바탕으로 IDA 자원배분에 활용하는 지수입니다.", category: "economy" }),
  seedV134({ id: "irwr", term: "IRWR", englishName: "Internal Renewable Water Resources", koreanName: "국내 재생가능 수자원", definition: "한 국가 영토 안에서 강수로 생성되는 장기평균 재생가능 수자원량입니다.", category: "climate-risk" }),
  seedV134({ id: "modis", term: "MODIS", englishName: "Moderate Resolution Imaging Spectroradiometer", koreanName: "중해상도 영상분광복사계", definition: "토지·해양·대기 변화를 관측하는 NASA 위성 센서입니다.", category: "climate-risk" }),
  seedV134({ id: "pv", term: "PV", englishName: "Photovoltaic", koreanName: "태양광 발전", definition: "태양빛을 반도체 소자로 직접 전기로 변환하는 발전기술입니다.", category: "energy-technology" }),
  seedV134({ id: "redd", term: "REDD", englishName: "Reducing Emissions from Deforestation and Forest Degradation", koreanName: "산림전용·산림황폐화 배출 감축", definition: "산림전용과 산림황폐화로 발생하는 온실가스 배출을 줄이는 활동입니다.", category: "climate-policy" }),
  seedV134({ id: "unfc", term: "UNFC", englishName: "United Nations Framework Classification for Resources", koreanName: "유엔 자원분류체계", definition: "에너지·광물 자원의 사업성, 실행가능성, 지질지식을 함께 분류하는 유엔 체계입니다.", category: "organisation" }),
  seedV134({ id: "bidv", term: "BIDV", englishName: "Bank for Investment and Development of Vietnam", koreanName: "베트남투자개발은행", definition: "베트남의 기업·인프라·개발금융을 제공하는 상업은행입니다.", category: "organisation" }),
  seedV134({ id: "danida", term: "DANIDA", englishName: "Danish International Development Agency", koreanName: "덴마크 국제개발협력기관", definition: "덴마크 정부의 국제개발협력 정책과 사업을 담당하는 기관입니다.", category: "organisation" }),
  seedV134({ id: "edgar", term: "EDGAR", englishName: "Emissions Database for Global Atmospheric Research", koreanName: "세계 대기연구 배출 데이터베이스", definition: "유럽연합 공동연구센터가 국가·부문별 온실가스와 대기오염물질 배출량을 제공하는 데이터베이스입니다.", category: "organisation" }),
  seedV134({ id: "emdat", term: "EM-DAT", englishName: "Emergency Events Database", koreanName: "국제 재난 데이터베이스", definition: "세계 재난의 발생과 인명·경제 피해를 기록하는 국제 재난 데이터베이스입니다.", category: "organisation" }),
  seedV134({ id: "efta", term: "EFTA", englishName: "European Free Trade Association", koreanName: "유럽자유무역연합", definition: "유럽 국가 간 자유무역과 경제협력을 위한 정부 간 기구입니다.", category: "organisation" }),
  seedV134({ id: "erea", term: "EREA", englishName: "Electricity and Renewable Energy Authority of Viet Nam", koreanName: "베트남 전력·재생에너지국", definition: "베트남의 전력과 재생에너지 정책을 담당한 정부 전문기관입니다.", category: "organisation" }),
  seedV134({ id: "erav", term: "ERAV", englishName: "Electricity Regulatory Authority of Viet Nam", koreanName: "베트남 전력규제국", definition: "베트남 전력시장과 전기요금·전력계통 규제를 담당하는 기관입니다.", category: "organisation" }),
  seedV134({ id: "ieefa", term: "IEEFA", englishName: "Institute for Energy Economics and Financial Analysis", koreanName: "에너지경제·재무분석연구소", definition: "에너지시장과 전환투자의 경제·재무 영향을 분석하는 연구기관입니다.", category: "organisation" }),
  seedV134({ id: "icap", term: "ICAP", englishName: "International Carbon Action Partnership", koreanName: "국제탄소행동파트너십", definition: "배출권거래제를 운영하거나 도입하려는 정부가 제도 경험과 탄소시장 정보를 공유하는 국제 협력체입니다.", category: "organisation" }),
  seedV134({ id: "igrac", term: "IGRAC", englishName: "International Groundwater Resources Assessment Centre", koreanName: "국제지하수자원평가센터", definition: "국제 지하수 정보와 평가·모니터링 협력을 지원하는 전문센터입니다.", category: "organisation" }),
  seedV134({ id: "iha", term: "IHA", englishName: "International Hydropower Association", koreanName: "국제수력발전협회", definition: "지속가능한 수력발전 지식과 산업 협력을 지원하는 국제협회입니다.", category: "organisation" }),
  seedV134({ id: "noaa", term: "NOAA", englishName: "National Oceanic and Atmospheric Administration", koreanName: "미국 해양대기청", definition: "해양·대기·기후 관측과 예보 자료를 제공하는 미국 연방기관입니다.", category: "organisation" }),
  seedV134({ id: "nma", term: "NMA", englishName: "Non-Market Approach", koreanName: "비시장접근법", definition: "파리협정 제6.8조에 따라 감축성과의 이전 없이 재원·기술·역량강화 등을 연계하는 국가 간 기후협력 방식입니다.", category: "climate-policy", aliases: ["NMAs"] }),
  seedV134({ id: "nazca", term: "NAZCA", englishName: "Non-State Actor Zone for Climate Action", koreanName: "비국가행위자 기후행동 포털", definition: "도시·기업·지역·투자자 등 비국가행위자의 기후행동과 약속을 등록·공개하는 유엔기후변화협약 포털입니다.", category: "organisation" }),
  seedV134({ id: "opec", term: "OPEC", englishName: "Organization of the Petroleum Exporting Countries", koreanName: "석유수출국기구", definition: "회원 산유국의 석유정책 협력을 위한 정부 간 기구입니다.", category: "organisation" }),
  seedV134({ id: "pidg", term: "PIDG", englishName: "Private Infrastructure Development Group", koreanName: "민간인프라개발그룹", definition: "저소득국의 민간 인프라 투자와 사업개발을 지원하는 국제 협력기구입니다.", category: "development-finance" }),
  seedV134({ id: "pmi", term: "PMI", englishName: "Partnership for Market Implementation", koreanName: "시장메커니즘 이행 파트너십", definition: "국가가 개발목표에 맞는 탄소가격제도를 설계·시험·이행하도록 지원하는 세계은행 프로그램입니다.", category: "development-finance" }),
  seedV134({ id: "g2b", term: "G2B", englishName: "Government-to-Business e-Procurement System", koreanName: "국가종합전자조달시스템 나라장터", definition: "한국 공공기관의 입찰·계약·조달정보를 기업과 연결하는 전자조달시스템입니다.", category: "organisation" }),
  seedV134({ id: "msci", term: "MSCI", englishName: "MSCI Inc.", koreanName: "글로벌 금융지수·데이터 제공기관", definition: "투자 의사결정에 쓰이는 금융지수, 시장·기후 데이터와 분석서비스를 제공하는 기관입니다.", category: "organisation" }),
  seedV134({ id: "rmit", term: "RMIT", englishName: "Royal Melbourne Institute of Technology", koreanName: "RMIT 대학교", definition: "베트남에도 캠퍼스를 운영하는 호주의 공립 연구대학입니다.", category: "organisation" }),
  seedV134({ id: "uis", term: "UIS", englishName: "UNESCO Institute for Statistics", koreanName: "유네스코 통계연구소", definition: "교육·과학·문화 분야의 국제 비교 통계를 제공하는 유네스코 기관입니다.", category: "organisation" }),
  seedV134({ id: "article-6-4", term: "A6.4", englishName: "Paris Agreement Article 6.4 mechanism", koreanName: "파리협정 제6.4조 메커니즘", definition: "유엔 감독 아래 온실가스 감축실적을 발급·이전하는 파리협정의 국제 탄소시장 메커니즘입니다.", category: "climate-policy" }),
  seedV134({ id: "ar6", term: "AR6", englishName: "IPCC Sixth Assessment Report", koreanName: "IPCC 제6차 평가보고서", definition: "기후변화의 과학적 근거와 영향·적응·감축 지식을 종합한 기후변화에 관한 정부간 협의체의 평가보고서입니다.", category: "climate-policy" }),
  seedV134({ id: "carp", term: "CARP", englishName: "Centralized Accounting and Reporting Platform", koreanName: "중앙집중식 산정·보고 플랫폼", definition: "파리협정 제6조의 국제 이전 감축실적을 기록하고 보고하는 유엔기후변화협약 플랫폼입니다.", category: "climate-policy" }),
  seedV134({ id: "cbt", term: "CBT", englishName: "Climate Budget Tagging", koreanName: "기후예산태깅", definition: "예산사업이 기후변화 대응에 기여하는지 분류·표시해 관련 지출을 추적하는 제도입니다.", category: "development-finance" }),
  seedV134({ id: "cgls", term: "CGLS", englishName: "Copernicus Global Land Service", koreanName: "코페르니쿠스 전지구 토지서비스", definition: "위성관측을 이용해 토지피복·식생·물순환 등 전지구 육상 정보를 제공하는 서비스입니다.", category: "organisation" }),
  seedV134({ id: "cred", term: "CRED", englishName: "Centre for Research on the Epidemiology of Disasters", koreanName: "재난역학연구센터", definition: "재난의 발생과 인명·경제 피해를 연구하고 국제 재난자료를 관리하는 연구기관입니다.", category: "organisation" }),
  seedV134({ id: "cri", term: "CRI", englishName: "Climate Risk Index", koreanName: "기후위험지수", definition: "극한기상으로 인한 인명·경제 피해를 국가별로 비교하는 지수입니다.", category: "climate-risk" }),
  seedV134({ id: "cru", term: "CRU", englishName: "Climatic Research Unit", koreanName: "기후연구소", definition: "영국 이스트앵글리아대학교에서 장기 기후 관측자료와 분석자료를 제공하는 연구기관입니다.", category: "organisation" }),
  seedV134({ id: "csrd", term: "CSRD", englishName: "Centre for Social Research and Development", koreanName: "사회연구·개발센터", definition: "베트남에서 지역사회 참여와 사회·환경 분야의 지속가능한 발전을 지원하는 시민사회 연구기관입니다.", category: "organisation" }),
  seedV134({ id: "dae", term: "DAE", englishName: "Direct Access Entity", koreanName: "직접접근기구", definition: "국제기후기금의 재원에 국가가 직접 접근하도록 인증받은 국가·지역 기관입니다.", category: "development-finance" }),
  seedV134({ id: "dcc-vietnam", term: "DCC", englishName: "Department of Climate Change of Viet Nam", koreanName: "베트남 기후변화국", definition: "베트남의 기후변화 정책과 국제 기후협약 이행을 담당하는 정부 조직입니다.", category: "organisation" }),
  seedV134({ id: "depp", term: "DEPP", englishName: "Danish Energy Partnership Programme", koreanName: "덴마크 에너지 파트너십 프로그램", definition: "덴마크와 협력국의 에너지전환·에너지효율 정책 협력을 지원하는 프로그램입니다.", category: "organisation" }),
  seedV134({ id: "doi", term: "DOI", englishName: "Digital Object Identifier", koreanName: "디지털 객체 식별자", definition: "논문·보고서 등 디지털 자료를 지속적으로 식별하고 연결하는 고유 식별자입니다.", category: "data-format" }),
  seedV134({ id: "dtu", term: "DTU", englishName: "Technical University of Denmark", koreanName: "덴마크공과대학교", definition: "에너지·환경·공학 연구와 공개 풍력자료 등에 참여하는 덴마크의 공과대학교입니다.", category: "organisation" }),
  seedV134({ id: "eaaif", term: "EAAIF", englishName: "Emerging Africa & Asia Infrastructure Fund", koreanName: "아프리카·아시아 신흥시장 인프라기금", definition: "아프리카와 아시아의 지속가능한 인프라 사업에 장기 금융을 제공하는 기금입니다.", category: "development-finance" }),
  seedV134({ id: "eeas", term: "EEAS", englishName: "European External Action Service", koreanName: "유럽대외관계청", definition: "유럽연합의 외교·안보 정책과 대외 협력을 지원하는 기관입니다.", category: "organisation" }),
  seedV134({ id: "ej", term: "EJ", englishName: "Exajoule", koreanName: "엑사줄", definition: "10의 18제곱 줄에 해당하는 대규모 에너지량 단위입니다.", category: "unit" }),
  seedV134({ id: "era5", term: "ERA5", englishName: "ECMWF Reanalysis version 5", koreanName: "유럽중기예보센터 제5세대 재분석자료", definition: "관측자료와 수치예보모델을 결합해 과거 대기·육상 상태를 일관되게 재구성한 기후자료입니다.", category: "climate-risk" }),
  seedV134({ id: "esp-energy", term: "ESP", englishName: "Energy Support Programme", koreanName: "에너지 지원 프로그램", definition: "에너지정책·전력계획·재생에너지 역량을 지원하는 국제협력 프로그램입니다.", category: "organisation" }),
  seedV134({ id: "fao-lex", term: "FAOLEX", englishName: "FAO Legal and Policy Database", koreanName: "FAO 법률·정책 데이터베이스", definition: "식량·농업·천연자원 관련 국가 법률과 정책문서를 제공하는 유엔식량농업기구 데이터베이스입니다.", category: "organisation" }),
  seedV134({ id: "gcc-carbon", term: "GCC", englishName: "Global Carbon Council", koreanName: "글로벌탄소위원회", definition: "온실가스 감축사업을 등록하고 탄소크레딧을 발급하는 국제 탄소표준 운영기관입니다.", category: "organisation" }),
  seedV134({ id: "gdis", term: "GDIS", englishName: "Geocoded Disasters dataset", koreanName: "지오코딩 재난 데이터셋", definition: "재난 발생자료에 국가 하위지역 위치를 연결한 공간 재난 데이터셋입니다.", category: "climate-risk" }),
  seedV134({ id: "geo-green-growth", term: "GEO", englishName: "Green Economic Opportunities", koreanName: "녹색경제 기회", definition: "녹색투자·혁신·고용 등 경제전환 기회를 평가하는 녹색성장지수의 한 차원입니다.", category: "economy" }),
  seedV134({ id: "grace-fo", term: "GRACE-FO", englishName: "Gravity Recovery and Climate Experiment Follow-On", koreanName: "중력장 복원·기후실험 후속위성", definition: "지구 중력장 변화를 관측해 지하수와 빙상 등 물 저장량 변화를 추정하는 위성 임무입니다.", category: "climate-risk" }),
  seedV134({ id: "grdc", term: "GRDC", englishName: "Global Runoff Data Centre", koreanName: "세계유출자료센터", definition: "국가 수문기관이 제공한 하천 유량자료를 수집·제공하는 국제 자료센터입니다.", category: "organisation" }),
  seedV134({ id: "hcmc", term: "HCMC", englishName: "Ho Chi Minh City", koreanName: "호찌민시", definition: "베트남 남부의 중앙직할시를 뜻하는 통용 영문 약칭입니다.", category: "organisation" }),
  seedV134({ id: "hcmut", term: "HCMUT", englishName: "Ho Chi Minh City University of Technology", koreanName: "호찌민시 공과대학교", definition: "베트남국립대학교 호찌민시 산하의 공학·기술 교육연구기관입니다.", category: "organisation" }),
  seedV134({ id: "hnx", term: "HNX", englishName: "Hanoi Stock Exchange", koreanName: "하노이증권거래소", definition: "베트남 하노이에서 증권·채권·파생상품 시장을 운영하는 거래소입니다.", category: "organisation" }),
  seedV134({ id: "hust", term: "HUST", englishName: "Hanoi University of Science and Technology", koreanName: "하노이과학기술대학교", definition: "베트남 하노이의 공학·과학기술 중심 대학입니다.", category: "organisation" }),
  seedV134({ id: "ida", term: "IDA", englishName: "International Development Association", koreanName: "국제개발협회", definition: "세계은행그룹에서 저소득국에 양허성 차관과 보조금을 제공하는 기관입니다.", category: "development-finance" }),
  seedV134({ id: "iae-vietnam", term: "IAE", englishName: "Institute for Agricultural Environment", koreanName: "농업환경연구소", definition: "베트남의 농업환경과 지속가능한 농업기술을 연구하는 기관입니다.", category: "organisation" }),
  seedV134({ id: "ilostat", term: "ILOSTAT", englishName: "ILO Department of Statistics database", koreanName: "국제노동기구 통계 데이터베이스", definition: "고용·임금·노동시장 관련 국제 비교통계를 제공하는 국제노동기구 데이터베이스입니다.", category: "organisation" }),
  seedV134({ id: "imhen", term: "IMHEN", englishName: "Viet Nam Institute of Meteorology, Hydrology and Climate Change", koreanName: "베트남 기상수문기후변화연구원", definition: "베트남의 기상·수문·기후변화 연구와 정책지원을 수행하는 연구기관입니다.", category: "organisation" }),
  seedV134({ id: "irena-stat", term: "IRENASTAT", englishName: "IRENA Statistics", koreanName: "국제재생에너지기구 통계", definition: "재생에너지 설비용량·발전량 등 국가별 에너지통계를 제공하는 국제재생에너지기구 데이터베이스입니다.", category: "organisation" }),
  seedV134({ id: "isfl", term: "ISFL", englishName: "Initiative for Sustainable Forest Landscapes", koreanName: "지속가능한 산림경관 이니셔티브", definition: "산림·토지이용 부문의 배출감축과 지속가능한 경관관리를 지원하는 국제 프로그램입니다.", category: "development-finance" }),
  seedV134({ id: "istee", term: "ISTEE", englishName: "Institute of Science and Technology for Energy and Environment", koreanName: "에너지·환경 과학기술연구소", definition: "에너지와 환경 분야의 과학기술 연구·정책지원을 수행하는 베트남 연구기관입니다.", category: "organisation" }),
  seedV134({ id: "jsc", term: "JSC", englishName: "Joint Stock Company", koreanName: "주식회사", definition: "주식을 발행해 자본을 구성하는 회사 형태를 뜻하는 영문 약칭입니다.", category: "trade-investment" }),
  seedV134({ id: "kdb", term: "KDB", englishName: "Korea Development Bank", koreanName: "한국산업은행", definition: "산업개발과 기업금융을 지원하는 대한민국의 정책금융기관입니다.", category: "organisation" }),
  seedV134({ id: "keiti", term: "KEITI", englishName: "Korea Environmental Industry & Technology Institute", koreanName: "한국환경산업기술원", definition: "환경기술 개발·산업육성·해외진출과 환경정책 사업을 지원하는 한국 공공기관입니다.", category: "organisation" }),
  seedV134({ id: "kiat", term: "KIAT", englishName: "Korea Institute for Advancement of Technology", koreanName: "한국산업기술진흥원", definition: "산업기술 혁신과 국제 기술협력·사업화를 지원하는 한국 공공기관입니다.", category: "organisation" }),
  seedV134({ id: "mae-vietnam", term: "MAE", englishName: "Ministry of Agriculture and Environment of Viet Nam", koreanName: "베트남 농업환경부", definition: "베트남의 농업·환경·천연자원과 기후변화 정책을 담당하는 중앙정부 부처입니다.", category: "organisation" }),
  seedV134({ id: "mof-vietnam", term: "MOF", englishName: "Ministry of Finance of Viet Nam", koreanName: "베트남 재무부", definition: "베트남의 재정·예산·세제와 국가금융 정책을 담당하는 중앙정부 부처입니다.", category: "organisation" }),
  seedV134({ id: "mofa", term: "MOFA", englishName: "Ministry of Foreign Affairs", koreanName: "외교부", definition: "외교정책과 국제협력을 담당하는 정부 부처를 뜻하는 영문 약칭입니다.", category: "organisation" }),
  seedV134({ id: "mot-vietnam", term: "MOT", englishName: "Ministry of Transport of Viet Nam", koreanName: "베트남 교통부", definition: "베트남의 도로·철도·항공·해운 등 교통정책을 담당한 중앙정부 부처입니다.", category: "organisation" }),
  seedV134({ id: "mrds", term: "MRDS", englishName: "Mineral Resources Data System", koreanName: "광물자원 데이터시스템", definition: "광산·광상과 광종 정보를 제공하는 미국 지질조사국의 광물자원 데이터베이스입니다.", category: "organisation" }),
  seedV134({ id: "nccs", term: "NCCS", englishName: "National Climate Change Strategy", koreanName: "국가기후변화전략", definition: "국가의 기후변화 감축·적응 목표와 장기 이행방향을 정한 전략입니다.", category: "climate-policy" }),
  seedV134({ id: "ncei", term: "NCEI", englishName: "National Centers for Environmental Information", koreanName: "미국 국립환경정보센터", definition: "기후·해양·지구물리 관측자료를 보존하고 제공하는 미국의 국가 자료센터입니다.", category: "organisation" }),
  seedV134({ id: "ncp-green-growth", term: "NCP", englishName: "Natural Capital Protection", koreanName: "자연자본 보호", definition: "생태계·생물다양성·환경질 보전 수준을 평가하는 녹색성장지수의 한 차원입니다.", category: "economy" }),
  seedV134({ id: "nigt", term: "NIGT", englishName: "National Institute of Green Technology", koreanName: "국가녹색기술연구소", definition: "녹색기술 정책연구와 국제 기후기술협력을 수행하는 한국의 정부출연연구기관입니다.", category: "organisation" }),
  seedV134({ id: "nso-vietnam", term: "NSO", englishName: "National Statistics Office of Viet Nam", koreanName: "베트남 국가통계국", definition: "베트남의 국가 공식통계를 생산·공표하는 중앙 통계기관입니다.", category: "organisation" }),
  seedV134({ id: "osac", term: "OSAC", englishName: "Overseas Security Advisory Council", koreanName: "해외안보자문위원회", definition: "해외 활동기관과 여행자에게 국가별 보안위험 정보를 제공하는 미국의 민관협력 자문체계입니다.", category: "organisation" }),
  seedV134({ id: "pdp8", term: "PDP8", englishName: "Viet Nam Power Development Plan VIII", koreanName: "베트남 제8차 국가전력개발계획", definition: "베트남의 발전원·전력망·재생에너지 개발방향과 목표를 정한 국가 전력계획입니다.", category: "energy-technology" }),
  seedV134({ id: "pri-insurance", term: "PRI", englishName: "Political Risk Insurance", koreanName: "정치적 위험보험", definition: "수용·송금제한·계약위반 등 정치적 사건으로 발생한 해외투자 손실을 보장하는 보험입니다.", category: "trade-investment" }),
  seedV134({ id: "pvn", term: "PVN", englishName: "Viet Nam Oil and Gas Group", koreanName: "베트남석유가스그룹", definition: "베트남의 석유·가스 탐사·개발·정제와 에너지사업을 수행하는 국영기업입니다.", category: "organisation" }),
  seedV134({ id: "reo", term: "REO", englishName: "Rare Earth Oxides", koreanName: "희토류 산화물", definition: "희토류 자원량과 생산량을 산화물 환산량으로 나타낼 때 쓰는 표기입니다.", category: "unit" }),
  seedV134({ id: "sedac", term: "SEDAC", englishName: "Socioeconomic Data and Applications Center", koreanName: "사회경제 데이터·응용센터", definition: "인구·환경·재난 관련 지리공간 사회경제자료를 제공하는 NASA 자료센터입니다.", category: "organisation" }),
  seedV134({ id: "snv", term: "SNV", englishName: "SNV Netherlands Development Organisation", koreanName: "네덜란드 개발협력기구 SNV", definition: "농식품·에너지·물 분야의 포용적이고 지속가능한 개발을 지원하는 국제개발기관입니다.", category: "organisation" }),
  seedV134({ id: "ssc-vietnam", term: "SSC", englishName: "State Securities Commission of Viet Nam", koreanName: "베트남 국가증권위원회", definition: "베트남 증권시장과 거래기관을 감독하는 국가 규제기관입니다.", category: "organisation" }),
  seedV134({ id: "tap", term: "TAP", englishName: "Technology Action Plan", koreanName: "기술실행계획", definition: "기술수요평가에서 우선기술의 보급장벽·조치·재원과 이행주체를 구체화한 계획입니다.", category: "climate-policy" }),
  seedV134({ id: "tou", term: "TOU", englishName: "Terms of Use", koreanName: "이용약관", definition: "서비스·자료의 이용과 재사용에 적용되는 조건을 정한 문서입니다.", category: "data-format" }),
  seedV134({ id: "umd", term: "UMD", englishName: "University of Maryland", koreanName: "메릴랜드대학교", definition: "위성 기반 산림피복·손실 자료의 연구와 생산에 참여하는 미국의 연구대학입니다.", category: "organisation" }),
  seedV134({ id: "vdb", term: "VDB", englishName: "Vietnam Development Bank", koreanName: "베트남개발은행", definition: "베트남의 국가 개발사업과 정책금융을 지원하는 국영 개발은행입니다.", category: "organisation" }),
  seedV134({ id: "vkist", term: "VKIST", englishName: "Vietnam-Korea Institute of Science and Technology", koreanName: "한·베 과학기술연구원", definition: "베트남의 산업기술 연구·사업화를 위해 한국과 베트남이 협력해 설립한 연구기관입니다.", category: "organisation" }),
  seedV134({ id: "vncpc", term: "VNCPC", englishName: "Vietnam Cleaner Production Centre", koreanName: "베트남 청정생산센터", definition: "기업의 자원효율·청정생산과 지속가능한 생산전환을 지원하는 전문기관입니다.", category: "organisation" }),
  seedV134({ id: "vneec", term: "VNEEC", englishName: "Vietnam Energy and Environment Consultancy", koreanName: "베트남 에너지·환경 컨설팅기관", definition: "에너지효율·재생에너지·환경 분야의 기술자문과 사업을 수행하는 베트남 기관입니다.", category: "organisation" }),
  seedV134({ id: "vnmc", term: "VNMC", englishName: "Viet Nam National Mekong Committee", koreanName: "베트남 국가메콩위원회", definition: "메콩강위원회 협력과 베트남의 메콩 수자원 정책 조정을 담당하는 국가위원회입니다.", category: "organisation" }),
  seedV134({ id: "vnua", term: "VNUA", englishName: "Vietnam National University of Agriculture", koreanName: "베트남국립농업대학교", definition: "농업·식품·환경 분야 교육과 연구를 수행하는 베트남의 국립대학교입니다.", category: "organisation" }),
  seedV134({ id: "vnx", term: "VNX", englishName: "Vietnam Exchange", koreanName: "베트남증권거래소", definition: "하노이와 호찌민 증권거래소를 총괄하는 베트남의 국영 증권거래소입니다.", category: "organisation" }),
  seedV134({ id: "vsdc", term: "VSDC", englishName: "Vietnam Securities Depository and Clearing Corporation", koreanName: "베트남예탁결제원", definition: "베트남 증권시장의 예탁·청산·결제 업무를 담당하는 기관입니다.", category: "organisation" }),
  seedV134({ id: "vsea", term: "VSEA", englishName: "Vietnam Sustainable Energy Alliance", koreanName: "베트남 지속가능에너지연합", definition: "재생에너지·에너지효율과 공정한 에너지전환을 촉진하는 베트남 시민사회 연합입니다.", category: "organisation" }),
  seedV134({ id: "vusta", term: "VUSTA", englishName: "Vietnam Union of Science and Technology Associations", koreanName: "베트남 과학기술협회연합", definition: "베트남의 과학기술 전문협회와 지식인 단체를 연결하는 연합기관입니다.", category: "organisation" }),
  seedV134({ id: "wb", term: "WB", englishName: "World Bank", koreanName: "세계은행", definition: "개도국의 빈곤감축과 지속가능한 발전을 위해 금융·지식·자료를 제공하는 국제개발기관입니다.", category: "organisation" }),
  seedV134({ id: "wepa", term: "WEPA", englishName: "Water Environment Partnership in Asia", koreanName: "아시아 물환경 파트너십", definition: "아시아 국가의 수질관리 정책과 물환경 정보를 공유하는 지역 협력체입니다.", category: "organisation" }),
  seedV134({ id: "wits", term: "WITS", englishName: "World Integrated Trade Solution", koreanName: "세계통합무역솔루션", definition: "국제 무역·관세자료를 조회·분석할 수 있는 세계은행의 통계 플랫폼입니다.", category: "organisation" }),
  seedV134({ id: "unep-ccc", term: "CCC", englishName: "UNEP Copenhagen Climate Centre", koreanName: "유엔환경계획 코펜하겐 기후센터", definition: "저탄소·기후회복력 정책과 파리협정 이행을 지원하는 유엔환경계획 전문센터입니다.", category: "organisation" }),
  seedV134({ id: "cegr", term: "CEGR", englishName: "Centre for Energy and Green Growth Research", koreanName: "에너지·녹색성장연구센터", definition: "에너지전환과 녹색성장 정책을 연구하는 베트남 연구기관입니다.", category: "organisation" }),
  seedV134({ id: "cres", term: "CRES", englishName: "Centre for Natural Resources and Environmental Studies", koreanName: "천연자원·환경연구센터", definition: "천연자원 관리와 환경·지속가능발전을 연구하는 베트남 연구기관입니다.", category: "organisation" }),
  seedV134({ id: "d8", term: "D8", englishName: "Eight-direction flow model", koreanName: "8방향 흐름모형", definition: "각 격자의 물이 경사가 가장 급한 인접 8방향 중 하나로 흐른다고 표현하는 수문 공간모형입니다.", category: "climate-risk" }),
  seedV134({ id: "gvip", term: "GVIP", englishName: "GVI Projections Database", koreanName: "GVI 전망 데이터베이스", definition: "공통사회경제경로별 사회경제적 취약성지수 전망을 2020년부터 2100년까지 제공하는 글로벌데이터랩 자료입니다.", category: "climate-risk" }),
  seedV134({ id: "maifi", term: "MAIFI", englishName: "Momentary Average Interruption Frequency Index", koreanName: "고객당 평균 순간정전 빈도지수", definition: "일정 기간 고객 한 명당 평균적으로 발생한 순간정전 횟수를 나타내는 전력 신뢰도 지수입니다.", category: "energy-technology" }),
  seedV134({ id: "mdpi", term: "MDPI", englishName: "MDPI academic publisher", koreanName: "MDPI 학술출판사", definition: "과학·기술·의학 등 여러 분야의 동료심사 학술지를 발행하는 공개접근 학술출판사입니다.", category: "organisation" }),
  seedV134({ id: "nzp", term: "NZP", englishName: "Net Zero Pathway", koreanName: "넷제로 경로", definition: "온실가스 순배출을 0으로 줄이는 목표에 맞춘 정책·경제 전환 시나리오입니다.", category: "climate-policy" }),
  seedV134({ id: "pgvi", term: "PGVI", englishName: "Projected Global Vulnerability Index", koreanName: "전망 사회경제적 취약성지수", definition: "공통사회경제경로에 따른 미래 사회경제적 취약성을 0~100으로 전망하며 값이 높을수록 취약성이 큽니다.", category: "climate-risk" }),
  seedV134({ id: "rfs", term: "RFS", englishName: "WWF Risk Filter Suite", koreanName: "WWF 위험 필터 도구모음", definition: "기업·금융기관이 사업장과 공급망의 물·생물다양성 관련 자연위험을 선별·비교하는 공개 분석도구입니다.", category: "climate-risk" }),
  seedV134({ id: "tr23", term: "TR23", englishName: "Tropical nights above 23°C", koreanName: "최저기온 23°C 초과 열대야", definition: "일 최저기온이 23°C를 넘은 밤의 발생일수를 나타내는 고온 기후지표입니다.", category: "climate-risk" }),
  seedV134({ id: "vc", term: "VC", englishName: "Venture Capital", koreanName: "벤처캐피털", definition: "성장 가능성이 높은 초기·혁신기업에 지분 방식으로 투자하는 모험자본입니다.", category: "trade-investment" }),
  seedV134({ id: "ecmwf", term: "ECMWF", englishName: "European Centre for Medium-Range Weather Forecasts", koreanName: "유럽중기예보센터", definition: "회원국과 국제사회에 수치예보와 기후 재분석자료를 제공하는 정부 간 기상기관입니다.", category: "organisation" }),
  seedV134({ id: "ei", term: "EI", englishName: "Energy Institute", koreanName: "에너지연구협회", definition: "에너지 산업의 전문지식·통계·표준과 교육을 제공하는 국제 전문기관입니다.", category: "organisation" }),
  seedV134({ id: "copernicus-ems", term: "EMS", englishName: "Copernicus Emergency Management Service", koreanName: "코페르니쿠스 긴급관리서비스", definition: "위성자료를 이용해 홍수·산불·재난위험의 지도와 조기경보 정보를 제공하는 유럽 서비스입니다.", category: "organisation" }),
  seedV134({ id: "evn-hanoi", term: "EVNHANOI", englishName: "Hanoi Power Corporation", koreanName: "하노이전력공사", definition: "베트남전력공사 산하에서 하노이 지역 전력공급을 담당하는 배전회사입니다.", category: "organisation" }),
  seedV134({ id: "evn-spc", term: "EVNSPC", englishName: "Southern Power Corporation", koreanName: "남부전력공사", definition: "베트남전력공사 산하에서 베트남 남부 지역 전력공급을 담당하는 배전회사입니다.", category: "organisation" }),
  seedV134({ id: "fs", term: "FS", englishName: "Feasibility Study", koreanName: "타당성조사", definition: "사업의 기술·경제·재무·환경적 실행가능성을 검토하는 사전 조사입니다.", category: "trade-investment" }),
  seedV134({ id: "ggis", term: "GGIS", englishName: "Global Groundwater Information System", koreanName: "세계 지하수 정보시스템", definition: "국가와 초국경 대수층의 지하수 자료·지도·지식을 제공하는 국제 지하수 정보포털입니다.", category: "organisation" }),
  seedV134({ id: "gitcc", term: "GITCC", englishName: "Global Industrial Technology Cooperation Center", koreanName: "글로벌산업기술협력센터", definition: "한국과 해외 연구기관의 공동 산업기술 연구개발과 협력거점을 지원하는 센터입니다.", category: "organisation" }),
  seedV134({ id: "ipcc-gl", term: "GL", englishName: "IPCC Guidelines", koreanName: "IPCC 국가 온실가스 인벤토리 지침", definition: "국가 온실가스 배출·흡수량을 일관되게 산정·보고하기 위한 국제 방법론 지침입니다.", category: "climate-policy" }),
  seedV134({ id: "hdr", term: "HDR", englishName: "Hot Dry Rock", koreanName: "고온건조암", definition: "지하의 고온 암반에 물을 순환시켜 열에너지를 회수하는 지열자원 유형입니다.", category: "energy-technology" }),
  seedV134({ id: "hess-journal", term: "HESS", englishName: "Hydrology and Earth System Sciences", koreanName: "수문학·지구시스템과학 학술지", definition: "수문순환과 지구시스템 연구를 다루는 동료심사 공개접근 학술지입니다.", category: "organisation" }),
  seedV134({ id: "ievn", term: "IE/IEVN", englishName: "Institute of Energy of Viet Nam", koreanName: "베트남 에너지연구원", definition: "베트남의 국가 에너지·전력계획과 에너지정책 연구를 수행하는 전문기관입니다.", category: "organisation", aliases: ["IE/IEVN", "IEVN"] }),
  seedV134({ id: "ifia-project", term: "IFIA", englishName: "Innovative Financial Incentives for Adaptation", koreanName: "적응을 위한 혁신적 금융 인센티브 사업", definition: "습지 생계의 기후적응을 촉진하기 위해 금융 인센티브를 활용하는 국제협력 사업입니다.", category: "development-finance" }),
  seedV134({ id: "jwg", term: "JWG", englishName: "Joint Working Group", koreanName: "공동작업반", definition: "여러 기관이나 국가가 공동 의제를 실무적으로 협의·이행하기 위해 구성한 작업반입니다.", category: "organisation" }),
  seedV134({ id: "lc", term: "LC", englishName: "Land Cover", koreanName: "토지피복", definition: "산림·농경지·도시·수역처럼 지표면을 실제로 덮고 있는 유형을 분류한 정보입니다.", category: "climate-risk" }),
  seedV134({ id: "merf", term: "MERF", englishName: "Mekong Earth Regeneration Fund", koreanName: "메콩 지구재생기금", definition: "메콩 지역의 생태계 회복과 지속가능한 지역사업을 지원하는 기금입니다.", category: "development-finance" }),
  seedV134({ id: "mie", term: "MIE", englishName: "Multilateral Implementing Entity", koreanName: "다자이행기구", definition: "국제기후기금의 사업을 제안·관리하도록 인증받은 다자개발기관 또는 유엔기구입니다.", category: "development-finance" }),
  seedV134({ id: "pmc-project", term: "PMC", englishName: "Project Management Consulting", koreanName: "사업관리용역", definition: "개발사업의 일정·품질·비용·성과를 전문적으로 관리하고 발주기관을 지원하는 용역입니다.", category: "trade-investment" }),
  seedV134({ id: "pmc-literature", term: "PMC", englishName: "PubMed Central", koreanName: "펍메드 센트럴", definition: "생명과학·의학 분야의 공개 논문 원문을 보존·제공하는 미국 국립의학도서관 저장소입니다.", category: "organisation" }),
  seedV134({ id: "ip-industry", term: "IP", englishName: "Industrial Processes", koreanName: "산업공정", definition: "연료 연소가 아니라 제품 생산·공정 반응에서 발생하는 온실가스 배출 부문입니다.", category: "climate-policy" }),
  seedV134({ id: "ip-intellectual-property", term: "IP", englishName: "Intellectual Property", koreanName: "지식재산", definition: "특허·상표·디자인·저작물처럼 창작과 혁신의 결과에 인정되는 법적 권리를 통칭합니다.", category: "economy" }),
  seedV134({ id: "ceic", term: "CEIC", englishName: "CEIC Data", koreanName: "CEIC 경제통계 데이터베이스", definition: "국가·산업·금융시장별 거시경제와 기업 통계를 제공하는 상업 데이터 서비스입니다.", category: "organisation" }),
  seedV134({ id: "esru", term: "ESRU", englishName: "Efficient and Sustainable Resource Use", koreanName: "효율적·지속가능한 자원이용", definition: "에너지·물질·토지 등 자원을 효율적이고 지속가능하게 사용하는 수준을 평가하는 녹색성장지수의 한 차원입니다.", category: "economy" }),
  seedV134({ id: "pmu", term: "PMU", englishName: "Project Management Unit", koreanName: "사업관리단", definition: "개발사업의 조달·일정·재정·성과관리를 담당하도록 발주기관이 구성한 전담조직입니다.", category: "organisation" }),
  seedV134({ id: "vets", term: "VETS", englishName: "Vietnam Technology Solutions Joint Stock Company", koreanName: "베트남 기술솔루션 주식회사", definition: "원천 기관명에 기재된 베트남 기술솔루션 기업의 공식 영문 약칭입니다.", category: "organisation" }),
];

const LEGACY_CATEGORY_BY_TERM_V134: Partial<
  Record<string, PublicGlossaryCategoryV134>
> = {
  GHI: "climate-risk",
  DNI: "climate-risk",
  PVOUT: "energy-technology",
  CDD: "climate-risk",
  TX35: "climate-risk",
  TX40: "climate-risk",
  TR20: "climate-risk",
  TR25: "climate-risk",
  HI35: "climate-risk",
  RX1day: "climate-risk",
  RX5day: "climate-risk",
  R20mm: "climate-risk",
  R50mm: "climate-risk",
  CWD: "climate-risk",
  SAIDI: "energy-technology",
  SAIFI: "energy-technology",
  LPI: "economy",
  LSCI: "economy",
  "ND-GAIN": "climate-risk",
  GII: "economy",
  STEM: "economy",
};

const REQUIRED_IDS_V134 = new Set(
  [...REQUIRED_PUBLIC_GLOSSARY_V134, ...CATALOG_PUBLIC_GLOSSARY_V134].map(
    (entry) => entry.id
  )
);
const REQUIRED_TERMS_V134 = new Set(
  [...REQUIRED_PUBLIC_GLOSSARY_V134, ...CATALOG_PUBLIC_GLOSSARY_V134].map(
    (entry) => entry.term
  )
);

const LEGACY_PUBLIC_GLOSSARY_V134: PublicGlossaryEntryV134[] =
  CLIMATE_GLOSSARY_V74.filter(
    (entry) =>
      !REQUIRED_TERMS_V134.has(entry.term) &&
      entry.term !== "SPEI12" &&
      !["CO₂e", "tCO₂e", "MtCO₂e"].includes(entry.term)
  ).map((entry) =>
    seedV134({
      id: `catalog-${entry.key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      term: entry.term,
      englishName: entry.english,
      koreanName: entry.korean,
      definition: entry.bullets[0] ?? entry.korean,
      category:
        LEGACY_CATEGORY_BY_TERM_V134[entry.term] ??
        (/(GCF|GEF|ADB|IFC|UNFCCC|IEA|IRENA|WIPO|UNESCO)/.test(
          entry.term
        )
          ? "organisation"
          : /(ODA|EDCF|MDB|DFI|PPI|MIGA|DAC|FCPF|BioCF|CIF)/.test(
              entry.term
            )
          ? "development-finance"
          : /(NDC|BTR|NAP|REDD|FREL|RBP|SIS|ITMO|MRV|GHG|LULUCF|ETS|VCS)/.test(
              entry.term
            )
          ? "climate-policy"
          : "energy-technology"),
      aliases: entry.aliases.filter(
        (alias) => /[A-Za-z]/.test(alias) && alias.length <= 28
      ),
    })
  );

/** Public directory and tooltip registry (required seed first, catalog additions after). */
export const PUBLIC_GLOSSARY_V134: readonly PublicGlossaryEntryV134[] = [
  ...REQUIRED_PUBLIC_GLOSSARY_V134,
  ...CATALOG_PUBLIC_GLOSSARY_V134,
  ...LEGACY_PUBLIC_GLOSSARY_V134.filter(
    (entry) => !REQUIRED_IDS_V134.has(entry.id)
  ),
].sort((left, right) => left.term.localeCompare(right.term, "en"));

export const PUBLIC_GLOSSARY_BY_ID_V134 = new Map(
  PUBLIC_GLOSSARY_V134.map((entry) => [entry.id, entry])
);

export function normalizePublicTermAliasV134(value: string): string {
  return value
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/₁₂/g, "12")
    .replace(/₂/g, "2")
    .replace(/\s+/g, " ");
}

const PUBLIC_GLOSSARY_BY_ALIAS_V134 = (() => {
  const aliases = new Map<string, PublicGlossaryEntryV134>();
  for (const entry of PUBLIC_GLOSSARY_V134) {
    if (
      entry.id === "ppp-economy" ||
      entry.id === "mpi-index" ||
      entry.id === "mpi-ministry" ||
      entry.id === "pmc-project" ||
      entry.id === "pmc-literature" ||
      entry.id === "ip-industry" ||
      entry.id === "ip-intellectual-property"
    ) {
      continue;
    }
    for (const alias of entry.aliases) {
      const normalized = normalizePublicTermAliasV134(alias);
      if (!aliases.has(normalized)) aliases.set(normalized, entry);
    }
  }
  return aliases;
})();

export function getPublicGlossaryByAliasV134(
  value: string
): PublicGlossaryEntryV134 | null {
  return (
    PUBLIC_GLOSSARY_BY_ALIAS_V134.get(normalizePublicTermAliasV134(value)) ??
    null
  );
}

export function listPublicGlossaryAliasesV134(): string[] {
  const aliases = PUBLIC_GLOSSARY_V134.flatMap((entry) => entry.aliases);
  const rawAndNormalized = aliases.flatMap((alias) => [
    alias,
    normalizePublicTermAliasV134(alias),
  ]);
  return Array.from(new Set(rawAndNormalized)).sort(
    (left, right) => right.length - left.length || left.localeCompare(right)
  );
}
