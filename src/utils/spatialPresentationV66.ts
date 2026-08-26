import type { VietnamDemoElement } from "../types/vietnamDemo";

export type SpatialGeometryFamily =
  | "point"
  | "network"
  | "mixed"
  | "polygon"
  | "raster";

export interface SpatialPresentationDefinition {
  family: SpatialGeometryFamily;
  publicTitle?: string;
  mapLabel: string;
  detailLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  layers: string[];
  columns: string[];
  metricOptions?: string[];
}

const DEFINITIONS: Record<string, SpatialPresentationDefinition> = {
  "A-023": {
    family: "point",
    publicTitle: "발전소 위치·용량",
    mapLabel: "발전소 지도",
    detailLabel: "시설 목록",
    emptyTitle: "발전소 좌표 데이터 준비 중",
    emptyDescription:
      "실제 발전소 좌표가 연결되면 지도에 시설을 표시하고 기술·설비용량·운영상태를 함께 제공합니다",
    layers: ["발전소"],
    columns: [
      "발전소명",
      "연료·기술",
      "설비용량(MW)",
      "운영상태",
      "위도",
      "경도",
    ],
  },
  "A-024": {
    family: "network",
    publicTitle: "전력망·변전소·미공급 지역",
    mapLabel: "전력망 지도",
    detailLabel: "레이어·속성",
    emptyTitle: "전력망 공간 데이터 준비 중",
    emptyDescription:
      "송전망·배전망·변전소·미공급 지역의 실제 공간 레이어가 연결되면 지도에서 중첩 확인할 수 있습니다",
    layers: ["송전망", "배전망", "변전소", "미공급 지역"],
    columns: ["객체명", "유형", "전압/용량", "상태", "행정구역", "공간정보"],
  },
  "A-025": {
    family: "mixed",
    publicTitle: "CCS·CO₂ 수송·저장 인프라",
    mapLabel: "CCS 인프라 지도",
    detailLabel: "시설·경로",
    emptyTitle: "CCS 공간 데이터 준비 중",
    emptyDescription:
      "포집시설·저장후보지·CO₂ 수송경로의 실제 위치·경로가 연결되면 시설 간 거리와 연계성을 확인할 수 있습니다",
    layers: ["포집시설", "저장후보지", "수송경로"],
    columns: [
      "시설/경로명",
      "유형",
      "용량",
      "운영상태",
      "위치/구간",
      "좌표/geometry",
    ],
  },
  "A-026": {
    family: "polygon",
    publicTitle: "건물 분포·밀도",
    mapLabel: "건물 분포 지도",
    detailLabel: "지역·속성",
    emptyTitle: "건물 풋프린트 데이터 준비 중",
    emptyDescription:
      "건물 폴리곤이 연결되면 실제 건물 분포·밀도·용도·행정구역을 지도와 표에서 함께 확인할 수 있습니다",
    layers: ["건물 풋프린트", "건물 밀도"],
    columns: ["행정구역", "건물 수", "건물면적", "밀도", "용도", "기준시점"],
  },
  "A-027": {
    family: "network",
    publicTitle: "교통·물류 인프라 위치",
    mapLabel: "교통 인프라 지도",
    detailLabel: "레이어·시설",
    emptyTitle: "교통 인프라 공간 데이터 준비 중",
    emptyDescription:
      "항만·도로·철도·공항 레이어가 연결되면 물류 접근성과 운송경로를 함께 확인할 수 있습니다",
    layers: ["항만", "도로", "철도", "공항"],
    columns: [
      "시설/구간명",
      "유형",
      "상태",
      "행정구역",
      "주요속성",
      "공간정보",
    ],
  },
  "A-028": {
    family: "mixed",
    publicTitle: "해안·수자원 인프라 위치",
    mapLabel: "해안·수자원 인프라 지도",
    detailLabel: "시설 목록",
    emptyTitle: "해안·수자원 인프라 데이터 준비 중",
    emptyDescription:
      "댐·저수지·상하수도·해안시설의 실제 위치가 연결되면 기존 인프라와 대상지역을 함께 검토할 수 있습니다",
    layers: ["댐·저수지", "상하수도", "해안시설", "수자원시설"],
    columns: ["시설명", "유형", "규모/용량", "상태", "행정구역", "좌표"],
  },
  "B-002": {
    family: "polygon",
    publicTitle: "기후대 분포",
    mapLabel: "기후대 지도",
    detailLabel: "지역·기후대",
    emptyTitle: "기후대 공간 데이터 준비 중",
    emptyDescription:
      "기후대 경계가 연결되면 지역별 기후대와 고도·해안 조건을 지도에서 확인할 수 있습니다",
    layers: ["기후대"],
    columns: ["지역", "기후대", "고도", "해안/내륙", "면적", "기준"],
  },
  "B-017": {
    family: "polygon",
    publicTitle: "물 스트레스 지역 분포",
    mapLabel: "물 스트레스 지도",
    detailLabel: "유역·속성",
    emptyTitle: "물 스트레스 공간 데이터 준비 중",
    emptyDescription:
      "Aqueduct 유역별 값이 연결되면 물 스트레스 등급·수요/공급·계절성을 실제 유역 경계와 함께 표시합니다",
    layers: ["물 스트레스 등급"],
    columns: ["유역", "물 스트레스 등급", "수요", "공급", "계절성", "기준"],
    metricOptions: ["물 스트레스 등급", "수요/공급", "계절성"],
  },
  "B-025": {
    family: "polygon",
    publicTitle: "유역 경계·면적",
    mapLabel: "유역 지도",
    detailLabel: "유역 목록",
    emptyTitle: "유역 경계 데이터 준비 중",
    emptyDescription:
      "HydroSHEDS 유역 경계가 연결되면 유역명·면적·주요 하천·행정구역을 함께 제공합니다",
    layers: ["유역 경계", "주요 하천"],
    columns: [
      "유역명",
      "면적(km²)",
      "주요 하천",
      "행정구역",
      "상·하류",
      "geometry",
    ],
  },
  "B-026": {
    family: "network",
    publicTitle: "하천 유향·배수 네트워크",
    mapLabel: "배수 네트워크 지도",
    detailLabel: "하천망·속성",
    emptyTitle: "유향·하천망 데이터 준비 중",
    emptyDescription:
      "유향·하천망 데이터가 연결되면 상·하류 관계와 유역 연결성을 실제 선형 네트워크로 표시합니다",
    layers: ["유향", "하천망", "유역"],
    columns: ["하천/구간", "유향", "상류", "하류", "유역", "geometry"],
  },
  "B-027": {
    family: "raster",
    publicTitle: "지하수 잠재량 분포",
    mapLabel: "지하수 잠재량 지도",
    detailLabel: "지역별 값",
    emptyTitle: "지하수 자원 레이어 준비 중",
    emptyDescription:
      "대수층·지역별 지하수 잠재량이 연결되면 색상 레이어와 지역별 값으로 제공합니다",
    layers: ["지하수 잠재량"],
    columns: [
      "대수층/지역",
      "잠재량(m³/yr)",
      "취수량",
      "재충전",
      "기준",
      "출처",
    ],
    metricOptions: ["지하수 잠재량", "취수량", "재충전"],
  },
  "B-028": {
    family: "mixed",
    publicTitle: "하천 유량·관측지점",
    mapLabel: "하천 유량 지도",
    detailLabel: "지점·시계열",
    emptyTitle: "하천 유량 공간 데이터 준비 중",
    emptyDescription:
      "관측지점과 하천망이 연결되면 지점별 유량·계절·기간을 지도와 시계열에서 함께 제공합니다",
    layers: ["하천망", "유량 관측지점"],
    columns: ["하천/지점", "유량(m³/s)", "계절", "기간", "위도", "경도"],
  },
  "B-029": {
    family: "polygon",
    publicTitle: "산림 유형별 분포",
    mapLabel: "산림 유형 지도",
    detailLabel: "지역·면적",
    emptyTitle: "산림 유형 레이어 준비 중",
    emptyDescription:
      "열대우림·맹그로브·이탄지 등 산림유형 레이어가 연결되면 지역별 면적을 함께 제공합니다",
    layers: ["열대우림", "맹그로브", "이탄지", "기타 산림"],
    columns: ["지역", "산림유형", "면적(ha)", "비율", "기준연도", "geometry"],
  },
  "B-030": {
    family: "raster",
    publicTitle: "산림 이득 분포",
    mapLabel: "산림 이득 지도",
    detailLabel: "지역별 값",
    emptyTitle: "산림 이득 레이어 준비 중",
    emptyDescription:
      "연간 산림 이득 공간자료가 연결되면 지역별 이득면적과 최근 추세를 제공합니다",
    layers: ["연간 산림 이득"],
    columns: ["지역", "산림 이득(ha/yr)", "기간", "최근 추세", "기준", "출처"],
  },
  "B-031": {
    family: "raster",
    publicTitle: "산림 면적 분포",
    mapLabel: "산림 면적 지도",
    detailLabel: "지역별 값",
    emptyTitle: "산림 면적 레이어 준비 중",
    emptyDescription:
      "산림 면적 공간자료가 연결되면 지역별 총면적·국토 대비 비율·추세를 제공합니다",
    layers: ["산림 총면적"],
    columns: [
      "지역",
      "산림면적(ha)",
      "국토 대비 비율",
      "기간",
      "최근 추세",
      "출처",
    ],
  },
  "B-032": {
    family: "raster",
    publicTitle: "수관 피복률 분포",
    mapLabel: "수관 피복률 지도",
    detailLabel: "지역·임계치",
    emptyTitle: "수관 피복 레이어 준비 중",
    emptyDescription:
      "수관 피복률 레이어가 연결되면 임계치별 산림면적과 고밀도 산림지역을 표시합니다",
    layers: ["수관 피복률"],
    columns: ["지역", "수관피복률(%)", "임계치", "면적(ha)", "기준", "출처"],
    metricOptions: ["수관피복률", "임계치별 면적"],
  },
  "B-033": {
    family: "raster",
    publicTitle: "산림 손실 분포",
    mapLabel: "산림 손실 지도",
    detailLabel: "지역별 손실",
    emptyTitle: "산림 손실 레이어 준비 중",
    emptyDescription:
      "연간 산림손실 공간자료가 연결되면 지역별 손실면적·손실률·최근 추세를 제공합니다",
    layers: ["연간 산림 손실"],
    columns: ["지역", "손실면적(ha/yr)", "손실률", "기간", "최근 추세", "출처"],
  },
  "B-034": {
    family: "raster",
    publicTitle: "산림 탄소저장량 분포",
    mapLabel: "산림 탄소 지도",
    detailLabel: "지역·탄소량",
    emptyTitle: "산림 탄소 레이어 준비 중",
    emptyDescription:
      "산림 탄소밀도 레이어가 연결되면 tC/ha·총 탄소저장량·산림유형을 지역별로 제공합니다",
    layers: ["탄소 저장량"],
    columns: ["지역", "tC/ha", "총 탄소저장량", "산림유형", "기준", "출처"],
  },
  "B-035": {
    family: "polygon",
    publicTitle: "LULUCF 토지이용 변화",
    mapLabel: "토지이용 변화 지도",
    detailLabel: "변화유형·면적",
    emptyTitle: "LULUCF 변화 레이어 준비 중",
    emptyDescription:
      "토지피복 시계열이 연결되면 산림→기타·기타→산림 등 변화유형별 면적을 공간적으로 제공합니다",
    layers: ["산림→기타", "기타→산림", "농경지 변화"],
    columns: [
      "지역",
      "변화유형",
      "변화면적(ha)",
      "시작연도",
      "종료연도",
      "geometry",
    ],
  },
  "B-036": {
    family: "polygon",
    publicTitle: "토지이용 변화율 분포",
    mapLabel: "토지이용 변화율 지도",
    detailLabel: "지역·변화율",
    emptyTitle: "토지이용 변화율 레이어 준비 중",
    emptyDescription:
      "토지이용 변화자료가 연결되면 변화율이 높은 지역과 변화유형을 지도와 표에서 제공합니다",
    layers: ["토지이용 변화율"],
    columns: ["지역", "변화율(%/yr)", "변화유형", "기간", "면적", "geometry"],
  },
  "B-037": {
    family: "polygon",
    publicTitle: "토지피복 분포",
    mapLabel: "토지피복 지도",
    detailLabel: "분류별 면적",
    emptyTitle: "토지피복 레이어 준비 중",
    emptyDescription:
      "경작지·산림·초지·건물·수체·나지 레이어가 연결되면 분류별 면적과 지역 분포를 제공합니다",
    layers: ["경작지", "산림", "초지", "건물", "수체", "나지"],
    columns: ["지역", "토지피복", "면적(ha)", "비율", "기준연도", "geometry"],
  },
  "B-038": {
    family: "raster",
    publicTitle: "바이오매스 자원 분포",
    mapLabel: "바이오매스 자원 지도",
    detailLabel: "지역·자원량",
    emptyTitle: "바이오매스 자원 레이어 준비 중",
    emptyDescription:
      "농업·임업·도시·축산 폐자원 자료가 연결되면 자원유형별 가용량과 지역 분포를 제공합니다",
    layers: ["농업잔재", "임업잔재", "도시폐기물", "축산폐기물"],
    columns: ["지역", "자원유형", "가용량", "단위", "기간", "출처"],
  },
  "B-039": {
    family: "mixed",
    publicTitle: "수력 잠재량·후보지",
    mapLabel: "수력 잠재량 지도",
    detailLabel: "유역·후보지",
    emptyTitle: "수력 잠재량 공간 데이터 준비 중",
    emptyDescription:
      "유역·후보지 자료가 연결되면 기술적·미개발 잠재량과 기존설비를 함께 표시합니다",
    layers: ["수력 잠재량", "후보지", "기존설비"],
    columns: [
      "유역/지점",
      "기술적 잠재량",
      "미개발 잠재량",
      "기존설비",
      "상태",
      "공간정보",
    ],
  },
  "B-040": {
    family: "raster",
    publicTitle: "지열 잠재지역",
    mapLabel: "지열 잠재량 지도",
    detailLabel: "지역별 잠재량",
    emptyTitle: "지열 자원 레이어 준비 중",
    emptyDescription:
      "온도·열류량·기술적 잠재량 공간자료가 연결되면 지열 후보지역과 기존개발 현황을 제공합니다",
    layers: ["온도/열류량", "기술적 잠재량", "기존개발"],
    columns: [
      "지역",
      "온도/열류량",
      "기술적 잠재량",
      "기존개발",
      "기준",
      "출처",
    ],
    metricOptions: ["온도/열류량", "기술적 잠재량"],
  },
  "B-041": {
    family: "raster",
    publicTitle: "태양광 자원·발전 잠재량",
    mapLabel: "태양광 자원 지도",
    detailLabel: "지역별 자원",
    emptyTitle: "고해상도 태양광 공간 레이어 준비 중",
    emptyDescription:
      "GHI·DNI·PVOUT의 지역별 공간자료가 연결되면 색상 레이어와 지역별 값을 제공합니다",
    layers: ["GHI", "DNI", "PVOUT"],
    columns: ["지역", "GHI", "DNI", "PVOUT", "단위", "기준"],
    metricOptions: ["GHI", "DNI", "PVOUT"],
  },
  "B-042": {
    family: "raster",
    publicTitle: "풍력 자원 분포",
    mapLabel: "풍력 자원 지도",
    detailLabel: "지역별 자원",
    emptyTitle: "풍력 자원 레이어 준비 중",
    emptyDescription:
      "풍속·에너지밀도 공간자료가 연결되면 고도별 자원수준과 후보지역을 제공합니다",
    layers: ["풍속", "에너지밀도"],
    columns: ["지역", "풍속(m/s)", "에너지밀도(W/m²)", "고도", "기준", "출처"],
    metricOptions: ["풍속", "에너지밀도"],
  },
  "B-043": {
    family: "mixed",
    publicTitle: "화석연료 자원 분포",
    mapLabel: "화석연료 자원 지도",
    detailLabel: "광구·자원량",
    emptyTitle: "화석연료 자원 공간 데이터 준비 중",
    emptyDescription:
      "광구·분지·매장지 공간자료가 연결되면 석탄·석유·가스 자원량과 위치를 제공합니다",
    layers: ["석탄", "석유", "가스/LNG"],
    columns: [
      "광구/지역",
      "자원유형",
      "매장량",
      "단위",
      "개발상태",
      "공간정보",
    ],
  },
  "B-048": {
    family: "point",
    publicTitle: "주요 광산 위치",
    mapLabel: "광산 지도",
    detailLabel: "광산 목록",
    emptyTitle: "광산 좌표 데이터 준비 중",
    emptyDescription:
      "광산별 실제 좌표가 연결되면 광물·운영상태·생산량과 함께 지도와 목록에서 제공합니다",
    layers: ["광산"],
    columns: ["광산명", "광물", "운영상태", "생산량", "위도", "경도"],
  },
};

export function getSpatialPresentationV66(
  elementId: string
): SpatialPresentationDefinition | null {
  return DEFINITIONS[elementId] ?? null;
}

export function isSpatialElementV66(element: VietnamDemoElement): boolean {
  return Boolean(DEFINITIONS[element.elementId]);
}

export function getSpatialPublicTitleV66(elementId: string): string | null {
  return DEFINITIONS[elementId]?.publicTitle ?? null;
}

export function getSpatialDetailTabLabelV66(elementId: string): string {
  return DEFINITIONS[elementId]?.detailLabel ?? "목록·속성";
}
