import { useMemo, useState } from "react";
import type { VietnamDemoElement } from "../../types/vietnamDemo";
import {
  getTechnologyFilterGroups,
  getTechnologyName,
} from "../../utils/technologyData";
import { getContextualKindV73 } from "../../utils/contextualPresentationV73";
import "../../styles/contextual-preview-v73.css";

interface Props {
  element: VietnamDemoElement;
  countryName: string;
}

export default function ContextualDataPreviewV73({
  element,
  countryName,
}: Props) {
  const kind = getContextualKindV73(element.elementId);

  if (kind === "season") {
    return <SeasonalityPreview countryName={countryName} />;
  }

  if (kind === "climatology") {
    return <ClimatologyPreview countryName={countryName} />;
  }

  if (kind === "disaster") {
    return <DisasterPreview countryName={countryName} />;
  }

  if (kind === "ndc") {
    return <NdcPreview countryName={countryName} />;
  }

  if (kind === "safety") {
    return <SafetyPreview countryName={countryName} />;
  }

  if (kind === "permitting") {
    return <PermittingPreview countryName={countryName} />;
  }

  if (kind === "partnership") {
    return <PartnershipPreview countryName={countryName} />;
  }

  return null;
}

function SeasonalityPreview({ countryName }: { countryName: string }) {
  const [region, setRegion] = useState("국가 평균");

  const months = [
    ["1월", "건기", 42],
    ["2월", "건기", 35],
    ["3월", "전환", 58],
    ["4월", "전환", 78],
    ["5월", "우기", 126],
    ["6월", "우기", 168],
    ["7월", "우기", 192],
    ["8월", "우기", 184],
    ["9월", "우기", 158],
    ["10월", "우기", 131],
    ["11월", "전환", 79],
    ["12월", "건기", 51],
  ];

  return (
    <section className="v73-context-view">
      <FilterRow>
        <label>
          <span>지역</span>
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            <option>국가 평균</option>
            <option>북부</option>
            <option>중부</option>
            <option>남부</option>
          </select>
        </label>
      </FilterRow>

      <div className="v73-kpis">
        <Kpi label="건기" value="12–2월" note={`${countryName} · 예시`} />
        <Kpi label="우기" value="5–10월" note={region} />
        <Kpi label="최다 강수월" value="7월" note="월강수량 예시" />
        <Kpi
          label="지역차"
          value="확인 필요"
          note="실제 지역자료 연결 시 제공"
        />
      </div>

      <section className="v73-month-profile">
        <header>
          <h4>월별 강수·계절 구분</h4>
          <p>{region} · 월별 상세값은 데이터 제공 시 확인 가능</p>
        </header>

        <div className="v73-months">
          {months.map(([month, season, rain]) => (
            <article key={month} className={`season-${season}`}>
              <b>{month}</b>
              <span>{season}</span>
              <i>
                <em style={{ height: `${Math.max(15, Number(rain) / 2)}px` }} />
              </i>
              <small>{rain} mm</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function ClimatologyPreview({ countryName }: { countryName: string }) {
  const [region, setRegion] = useState("국가 평균");

  const temperature = [
    24.1, 25.0, 26.4, 27.8, 28.6, 28.2, 27.8, 27.7, 27.2, 26.6, 25.4, 24.5,
  ];
  const rainfall = [34, 27, 45, 75, 132, 171, 194, 186, 157, 126, 73, 45];

  return (
    <section className="v73-context-view">
      <FilterRow>
        <label>
          <span>지역</span>
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            <option>국가 평균</option>
            <option>북부</option>
            <option>중부</option>
            <option>남부</option>
          </select>
        </label>
      </FilterRow>

      <div className="v73-kpis">
        <Kpi
          label="연평균 기온"
          value="26.5°C"
          note={`${countryName} · 예시`}
        />
        <Kpi label="연강수량" value="1,265 mm" note={region} />
        <Kpi label="가장 더운 달" value="5월 · 28.6°C" note="예시" />
        <Kpi label="최다 강수월" value="7월 · 194 mm" note="예시" />
      </div>

      <div className="v73-two-panel">
        <SeriesPanel title="월평균 기온" values={temperature} unit="°C" />
        <SeriesPanel title="월강수량" values={rainfall} unit="mm" />
      </div>
    </section>
  );
}

function DisasterPreview({ countryName }: { countryName: string }) {
  const [type, setType] = useState("전체 재해");
  const [period, setPeriod] = useState("최근 10년");

  const events = [
    ["홍수", "2025-09-18", "중부", "18만 명", "USD 125M"],
    ["태풍", "2024-07-11", "동부", "31만 명", "USD 240M"],
    ["가뭄", "2023-04-02", "남부", "12만 명", "USD 72M"],
    ["산사태", "2022-10-28", "산악지역", "4.8만 명", "USD 31M"],
    ["폭염", "2021-05-16", "대도시권", "영향인구 확인", "경제손실 확인"],
  ];

  const filtered =
    type === "전체 재해" ? events : events.filter((event) => event[0] === type);

  return (
    <section className="v73-context-view">
      <FilterRow>
        <label>
          <span>재해유형</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {["전체 재해", "홍수", "태풍", "가뭄", "산사태", "폭염"].map(
              (item) => (
                <option key={item}>{item}</option>
              )
            )}
          </select>
        </label>

        <label>
          <span>기간</span>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          >
            <option>최근 10년</option>
            <option>최근 20년</option>
            <option>전체 제공기간</option>
          </select>
        </label>
      </FilterRow>

      <div className="v73-kpis">
        <Kpi
          label="확인 재해"
          value={`${filtered.length}건`}
          note={`${countryName} · ${period}`}
        />
        <Kpi label="피해인구" value="누적 65.8만 명" note="예시 합계" />
        <Kpi label="경제손실" value="USD 468M" note="예시 합계" />
        <Kpi
          label="최근 재해"
          value={filtered[0]?.[0] ?? "—"}
          note={filtered[0]?.[1] ?? "—"}
        />
      </div>

      <RecordTable
        headers={["재해유형", "발생일", "지역", "피해·영향인구", "경제손실"]}
        rows={filtered}
      />
    </section>
  );
}

function NdcPreview({ countryName }: { countryName: string }) {
  const [version, setVersion] = useState("최신 제출본");

  return (
    <section className="v73-context-view">
      <FilterRow>
        <label>
          <span>NDC 버전</span>
          <select
            value={version}
            onChange={(event) => setVersion(event.target.value)}
          >
            <option>최신 제출본</option>
            <option>이전 제출본</option>
          </select>
        </label>
      </FilterRow>

      <div className="v73-kpis">
        <Kpi label="제출본" value={version} note={`${countryName} · 예시`} />
        <Kpi
          label="무조건부 목표"
          value="2030 목표 확인"
          note="목표연도·기준연도"
        />
        <Kpi
          label="조건부 목표"
          value="국제지원 조건 확인"
          note="재원·기술·역량"
        />
        <Kpi label="적응" value="적응 목표 포함" note="부문·우선분야" />
      </div>

      <section className="v73-evidence-matrix">
        {[
          ["제출 이력", "버전·제출일·원문", "UNFCCC 공식 제출자료"],
          ["감축목표", "무조건부·조건부·기준연도", "NDC 목표 문단"],
          ["부문별 수단", "전력·산업·수송·농업·LULUCF", "부문별 감축수단"],
          ["적응 목표", "취약부문·우선조치", "적응 장/절"],
          ["재원 소요", "조건부 이행재원·지원수요", "재원·지원 장/절"],
        ].map(([item, value, evidence]) => (
          <article key={item}>
            <b>{item}</b>
            <strong>{value}</strong>
            <span>{evidence}</span>
            <small>공식 문서의 근거 위치 제공 예정</small>
          </article>
        ))}
      </section>
    </section>
  );
}

function SafetyPreview({ countryName }: { countryName: string }) {
  const [region, setRegion] = useState("전국");

  return (
    <section className="v73-context-view">
      <FilterRow>
        <label>
          <span>지역</span>
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            <option>전국</option>
            <option>수도권</option>
            <option>주요 산업지역</option>
            <option>접경·주의지역</option>
          </select>
        </label>
      </FilterRow>

      <div className="v73-kpis">
        <Kpi
          label="여행경보"
          value="공식 등급 확인"
          note={`${countryName} · 최신 기준`}
        />
        <Kpi label="주요 위험" value="치안·시위·자연재해" note={region} />
        <Kpi label="최근 사건" value="공식 공지 확인" note="발생일·지역" />
        <Kpi label="출처" value="외교부·현지 당국" note="최신 공지 우선" />
      </div>

      <section className="v73-safety-list">
        {[
          ["일반 치안", "절도·사기·야간 이동", "주요 도시·관광지별 최신 공지"],
          ["시위·집회", "집회·교통통제", "발생지역·일정 확인"],
          ["산업지역 안전", "사업장·이동경로", "현지 보안·교통상황 확인"],
          ["재난·기상", "홍수·태풍·폭염", "계절별 위험과 경보 확인"],
        ].map(([item, risk, note]) => (
          <article key={item}>
            <b>{item}</b>
            <span>{risk}</span>
            <small>{note}</small>
          </article>
        ))}
      </section>
    </section>
  );
}

function PermittingPreview({ countryName }: { countryName: string }) {
  const groups = useMemo(() => getTechnologyFilterGroups(), []);
  const [projectType, setProjectType] = useState("발전·에너지 사업");
  const [technologyId, setTechnologyId] = useState("all");

  const technologyName =
    technologyId === "all" ? "전체 기후기술" : getTechnologyName(technologyId);

  const rows = [
    [
      "환경영향평가(EIA)",
      "조건부/필수",
      "환경부·지방 환경기관",
      "60–180일",
      "심사·평가비 별도",
      "초기 검토 · 부지/기본설계와 병행",
      "사업유형·규모·입지",
    ],
    [
      "토지·부지 승인",
      "필수",
      "토지·지방정부 기관",
      "30–120일",
      "보상·등록비 별도",
      "초기 확보 · EIA와 병행 가능",
      "소유권·용도·보상",
    ],
    [
      "건축·개발 허가",
      "조건부",
      "지방정부·건축기관",
      "30–90일",
      "허가수수료 확인",
      "부지조건·EIA 요구사항 반영 후",
      "시설·건축공사",
    ],
    [
      "전력사업·발전 허가",
      projectType.includes("발전") ? "필수" : "해당 시",
      "에너지·전력 규제기관",
      "60–150일",
      "면허수수료 확인",
      "사업계획·기술조건 확정 후",
      "발전·판매·자가용",
    ],
    [
      "계통연계 승인",
      projectType.includes("발전") ? "필수" : "해당 시",
      "송배전사업자",
      "45–180일",
      "접속검토비 확인",
      "초기 접속검토 후 본승인 · 타 허가와 병행",
      "접속용량·계통영향",
    ],
    [
      "기타 분야별 허가",
      "기술별",
      "소관부처·지방기관",
      "개별 확인",
      "개별 확인",
      "기술·입지별 상이",
      technologyName,
    ],
  ];

  return (
    <section className="v73-context-view">
      <FilterRow>
        <label>
          <span>사업유형</span>
          <select
            value={projectType}
            onChange={(event) => setProjectType(event.target.value)}
          >
            <option>발전·에너지 사업</option>
            <option>산업 감축사업</option>
            <option>건물·효율사업</option>
            <option>수자원·적응사업</option>
          </select>
        </label>

        <label>
          <span>기후기술</span>
          <select
            value={technologyId}
            onChange={(event) => setTechnologyId(event.target.value)}
          >
            <option value="all">전체 기후기술</option>
            {groups.map((group) => (
              <optgroup key={group.category} label={group.category}>
                {group.technologies.map((technology) => (
                  <option key={technology.id} value={technology.id}>
                    {technology.nameKo}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </FilterRow>

      <div className="v73-kpis">
        <Kpi label="사업유형" value={projectType} note={countryName} />
        <Kpi label="선택 기술" value={technologyName} note="사업조건별 검토" />
        <Kpi label="핵심 인허가" value="6개 유형" note="예시 구조" />
        <Kpi
          label="처리기간"
          value="허가별 상이"
          note="병행·선후행 조건 확인"
        />
      </div>

      <RecordTable
        headers={[
          "인허가",
          "필요 여부",
          "담당기관",
          "예상 기간",
          "비용·수수료",
          "선후행·병행",
          "적용조건",
        ]}
        rows={rows}
      />

      <div className="v73-note">
        EIA·토지·건축·전력사업·계통연계는 모두 일렬의 단일 절차가 아니라
        사업조건에 따라 병행·선후행되는 별도 인허가
      </div>
    </section>
  );
}

function PartnershipPreview({ countryName }: { countryName: string }) {
  return (
    <section className="v73-context-view">
      <div className="v73-kpis">
        <Kpi
          label="참여 여부"
          value="참여 확인"
          note={`${countryName} · 예시`}
        />
        <Kpi label="Country Page" value="공식 페이지" note="원문 링크 제공" />
        <Kpi label="지원 활동" value="3개 분야" note="예시" />
        <Kpi label="최근 협력" value="2025" note="기준연도 예시" />
      </div>

      <section className="v73-partnership">
        {[
          ["NDC 이행", "정책·계획 수립 및 이행지원"],
          ["기후재원", "투자계획·재원연계·프로젝트 준비"],
          ["역량강화", "MRV·거버넌스·기관역량"],
          ["Country Page", "공식 참여상태·지원활동 원문 확인"],
        ].map(([item, detail]) => (
          <article key={item}>
            <b>{item}</b>
            <span>{detail}</span>
            <small>지원 프로그램·파트너·기간 근거 연결 예정</small>
          </article>
        ))}
      </section>
    </section>
  );
}

function FilterRow({ children }: { children: React.ReactNode }) {
  return <div className="v73-filter-row">{children}</div>;
}

function Kpi({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function RecordTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <section className="v73-record-table">
      <div
        className="v73-record-head"
        style={{
          gridTemplateColumns: `repeat(${headers.length}, minmax(150px, 1fr))`,
        }}
      >
        {headers.map((header) => (
          <b key={header}>{header}</b>
        ))}
      </div>

      {rows.map((row, index) => (
        <div
          className="v73-record-row"
          key={`${row[0]}:${index}`}
          style={{
            gridTemplateColumns: `repeat(${headers.length}, minmax(150px, 1fr))`,
          }}
        >
          {row.map((cell, cellIndex) => (
            <span key={cellIndex}>{cell}</span>
          ))}
        </div>
      ))}
    </section>
  );
}

function SeriesPanel({
  title,
  values,
  unit,
}: {
  title: string;
  values: number[];
  unit: string;
}) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const width = 600;
  const height = 190;
  const pad = 14;

  const path = values
    .map((value, index) => {
      const x =
        pad + (index / Math.max(1, values.length - 1)) * (width - pad * 2);
      const y = height - pad - ((value - min) / range) * (height - pad * 2);

      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <article className="v73-series">
      <header>
        <h4>{title}</h4>
        <span>
          {values[values.length - 1]} {unit}
        </span>
      </header>
      <svg viewBox={`0 0 ${width} ${height}`}>
        <path d={path} />
      </svg>
      <div>
        <span>1월</span>
        <span>6월</span>
        <span>12월</span>
      </div>
    </article>
  );
}
