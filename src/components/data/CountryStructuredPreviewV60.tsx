import { useMemo, useState } from "react";
import type { VietnamDemoElement } from "../../types/vietnamDemo";
import "../../styles/country-structured-v60.css";

const STRUCTURED_IDS = new Set(["C-002", "C-003", "C-024", "C-025"]);

export function isStructuredCountryPreviewV60(elementId: string): boolean {
  return STRUCTURED_IDS.has(elementId);
}

export function getStructuredModeLabelV60(elementId: string): string {
  switch (elementId) {
    case "C-002":
      return "BTR 핵심정보 · 원문 근거";
    case "C-003":
      return "적응 우선순위 · 투자수요";
    case "C-024":
      return "REDD+ 이행상태 · 실적";
    case "C-025":
      return "발행·소각 실적 · 프로젝트 목록";
    default:
      return "국가별 핵심정보";
  }
}

export function CountryStructuredOverviewV60({
  element,
  countryName,
}: {
  element: VietnamDemoElement;
  countryName: string;
}) {
  if (element.elementId === "C-002") {
    return <BtrOverview countryName={countryName} />;
  }

  if (element.elementId === "C-003") {
    return <NapOverview countryName={countryName} />;
  }

  if (element.elementId === "C-024") {
    return <ReddOverview countryName={countryName} />;
  }

  if (element.elementId === "C-025") {
    return <CarbonCreditOverview countryName={countryName} />;
  }

  return null;
}

export function CountryStructuredDetailV60({
  element,
  countryName,
}: {
  element: VietnamDemoElement;
  countryName: string;
}) {
  if (element.elementId === "C-002") {
    return <BtrDetail countryName={countryName} />;
  }

  if (element.elementId === "C-003") {
    return <NapDetail countryName={countryName} />;
  }

  if (element.elementId === "C-024") {
    return <ReddDetail countryName={countryName} />;
  }

  if (element.elementId === "C-025") {
    return <CarbonCreditDetail countryName={countryName} />;
  }

  return null;
}

function BtrOverview({ countryName }: { countryName: string }) {
  const [version, setVersion] = useState("최신 제출본");

  return (
    <>
      <ContextFilter
        label="보고서"
        value={version}
        onChange={setVersion}
        options={["최신 제출본", "이전 제출본"]}
      />

      <section className="v60-kpi-grid">
        <Kpi label="제출본" value="BTR 최신본" note={`${countryName} · 예시`} />
        <Kpi label="GHG 인벤토리" value="1990–2022" note="보고기간 예시" />
        <Kpi label="NDC 이행" value="진척도 확인" note="부문별 이행량" />
        <Kpi label="지원 정보" value="수요·수혜 구분" note="재정·기술·역량" />
      </section>

      <section className="v60-evidence-list">
        <EvidenceRow
          number="01"
          title="제출 이력"
          value="보고서 버전 · 제출일 · UNFCCC 공식 링크"
        />
        <EvidenceRow
          number="02"
          title="GHG 시계열"
          value="총배출량 · 부문별 배출 · 인벤토리 기준연도"
        />
        <EvidenceRow
          number="03"
          title="NDC 이행"
          value="목표 대비 진척 · 부문별 이행실적"
        />
        <EvidenceRow
          number="04"
          title="지원 수요·수혜"
          value="필요재원 · 수혜재원 · 기술·역량 지원"
        />
      </section>
    </>
  );
}

function BtrDetail({ countryName }: { countryName: string }) {
  const rows = [
    ["제출본", "BTR 최신본", "제출일 · 공식 URL"],
    ["인벤토리 기간", "1990–2022", "MtCO₂e · 방법론"],
    ["최신 총배출량", "예시값", "LULUCF 포함 여부"],
    ["NDC 이행량", "예시값", "목표·부문별 기준"],
    ["재정 지원 수요", "예시 USD", "필요/수혜 구분"],
    ["기술·역량 지원", "지원분야 예시", "기관·프로그램"],
  ];

  return (
    <StructuredTable
      title={`${countryName} BTR 상세`}
      headers={["항목", "표시값", "함께 확인"]}
      rows={rows}
    />
  );
}

function NapOverview({ countryName }: { countryName: string }) {
  const [version, setVersion] = useState("최신 NAP");

  return (
    <>
      <ContextFilter
        label="문서 버전"
        value={version}
        onChange={setVersion}
        options={["최신 NAP", "이전 버전"]}
      />

      <section className="v60-tags-section">
        <h4>취약부문</h4>
        <div>
          {["수자원", "농업", "해안", "도시", "보건"].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="v60-kpi-grid">
        <Kpi label="우선분야" value="5개 분야" note={`${countryName} · 예시`} />
        <Kpi label="단기 조치" value="3개" note="예시" />
        <Kpi label="중·장기 조치" value="9개" note="예시" />
        <Kpi label="투자수요" value="USD 2.4B" note="예시값" />
      </section>

      <section className="v60-action-list">
        <ActionCard
          phase="단기"
          title="취약지역 위험평가·조기경보 강화"
          detail="담당기관 · 기간 · 투자수요"
        />
        <ActionCard
          phase="중기"
          title="기후회복력 인프라·수자원 사업"
          detail="우선지역 · 사업유형 · 이행기관"
        />
        <ActionCard
          phase="장기"
          title="적응 거버넌스·M&E 체계 고도화"
          detail="지표 · 보고주기 · 책임기관"
        />
      </section>
    </>
  );
}

function NapDetail({ countryName }: { countryName: string }) {
  const rows = [
    ["취약성", "분야·지역별 취약성", "지표·평가근거"],
    ["우선분야", "수자원·농업·해안 등", "우선순위 근거"],
    ["단기 조치", "프로그램·사업 목록", "담당기관·기간"],
    ["중·장기 조치", "프로그램·사업 목록", "목표연도"],
    ["투자소요", "예시 USD", "분야별 재원"],
    ["거버넌스", "주관부처·협의체", "역할"],
    ["M&E", "지표·보고주기", "평가체계"],
  ];

  return (
    <StructuredTable
      title={`${countryName} NAP 상세`}
      headers={["항목", "표시내용", "함께 확인"]}
      rows={rows}
    />
  );
}

function ReddOverview({ countryName }: { countryName: string }) {
  const [period, setPeriod] = useState("최신 기준");

  return (
    <>
      <ContextFilter
        label="기준시점"
        value={period}
        onChange={setPeriod}
        options={["최신 기준", "이전 보고주기"]}
      />

      <section className="v60-status-grid">
        <StatusCard
          label="REDD+ 전략"
          status="수립"
          detail="전략명 · 채택연도 · 공식 원문"
        />
        <StatusCard
          label="FREL"
          status="제출"
          detail="제출연도 · 기준기간 · tCO₂e"
        />
        <StatusCard
          label="RBP 실적"
          status="수혜 실적 확인"
          detail="tCO₂e · USD · 지급기관"
        />
        <StatusCard
          label="세이프가드"
          status="SIS 확인"
          detail="시스템 운영상태 · 최신 보고"
        />
      </section>

      <section className="v60-fund-list">
        <h4>참여 기금·프로그램</h4>
        <div>
          {["GCF", "FCPF", "BioCF"].map((fund) => (
            <span key={fund}>{fund}</span>
          ))}
        </div>
      </section>

      <div className="v60-context-note">
        {countryName}의 REDD+ 제도·FREL·RBP·세이프가드·참여기금을 동일
        기준시점에서 확인
      </div>
    </>
  );
}

function ReddDetail({ countryName }: { countryName: string }) {
  const rows = [
    ["REDD+ 전략", "수립 여부 · 전략명", "채택연도 · 원문"],
    ["FREL", "제출 여부 · 제출연도", "기준기간 · 기준배출량"],
    ["RBP", "감축성과 tCO₂e", "수혜액 USD · 지급기관"],
    ["세이프가드", "SIS 구축·운영상태", "최신 보고서"],
    ["참여기금", "GCF / FCPF / BioCF", "프로그램·상태"],
  ];

  return (
    <StructuredTable
      title={`${countryName} REDD+ 상세`}
      headers={["항목", "핵심정보", "근거·단위"]}
      rows={rows}
    />
  );
}

function CarbonCreditOverview({ countryName }: { countryName: string }) {
  const [standard, setStandard] = useState("전체 표준");
  const [vintage, setVintage] = useState("전체 빈티지");

  const projects = useMemo(
    () => [
      {
        name: "프로젝트 A",
        standard: "VCS",
        technology: "재생에너지",
        issuance: "520,000 tCO₂e",
        retirement: "210,000 tCO₂e",
        vintage: "2024",
      },
      {
        name: "프로젝트 B",
        standard: "Gold Standard",
        technology: "에너지효율",
        issuance: "310,000 tCO₂e",
        retirement: "125,000 tCO₂e",
        vintage: "2023",
      },
      {
        name: "프로젝트 C",
        standard: "VCS",
        technology: "산림",
        issuance: "680,000 tCO₂e",
        retirement: "330,000 tCO₂e",
        vintage: "2025",
      },
    ],
    []
  );

  return (
    <>
      <section className="v60-double-filter">
        <ContextFilter
          label="등록 표준"
          value={standard}
          onChange={setStandard}
          options={["전체 표준", "VCS", "Gold Standard"]}
        />
        <ContextFilter
          label="빈티지"
          value={vintage}
          onChange={setVintage}
          options={["전체 빈티지", "2025", "2024", "2023"]}
        />
      </section>

      <section className="v60-kpi-grid">
        <Kpi
          label="등록 프로젝트"
          value="12건"
          note={`${countryName} · 예시`}
        />
        <Kpi label="누적 발행량" value="1.51 MtCO₂e" note="예시값" />
        <Kpi label="누적 소각량" value="0.67 MtCO₂e" note="예시값" />
        <Kpi label="활성 표준" value="2개" note="VCS · GS" />
      </section>

      <section className="v60-credit-list">
        {projects.map((project) => (
          <article key={project.name}>
            <div>
              <b>{project.name}</b>
              <span>{project.standard}</span>
            </div>
            <p>{project.technology}</p>
            <dl>
              <div>
                <dt>발행량</dt>
                <dd>{project.issuance}</dd>
              </div>
              <div>
                <dt>소각량</dt>
                <dd>{project.retirement}</dd>
              </div>
              <div>
                <dt>빈티지</dt>
                <dd>{project.vintage}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
    </>
  );
}

function CarbonCreditDetail({ countryName }: { countryName: string }) {
  const rows = [
    ["프로젝트 A", "VCS", "재생에너지", "520,000", "210,000", "2024"],
    ["프로젝트 B", "Gold Standard", "에너지효율", "310,000", "125,000", "2023"],
    ["프로젝트 C", "VCS", "산림", "680,000", "330,000", "2025"],
  ];

  return (
    <StructuredTable
      title={`${countryName} 탄소크레딧 프로젝트`}
      headers={[
        "프로젝트",
        "표준",
        "기술",
        "발행량(tCO₂e)",
        "소각량(tCO₂e)",
        "빈티지",
      ]}
      rows={rows}
    />
  );
}

function ContextFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="v60-context-filter">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
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

function EvidenceRow({
  number,
  title,
  value,
}: {
  number: string;
  title: string;
  value: string;
}) {
  return (
    <article>
      <span>{number}</span>
      <div>
        <b>{title}</b>
        <p>{value}</p>
        <small>공식 원문 · 한국어 의미 · 페이지/절</small>
      </div>
    </article>
  );
}

function ActionCard({
  phase,
  title,
  detail,
}: {
  phase: string;
  title: string;
  detail: string;
}) {
  return (
    <article>
      <span>{phase}</span>
      <b>{title}</b>
      <small>{detail}</small>
    </article>
  );
}

function StatusCard({
  label,
  status,
  detail,
}: {
  label: string;
  status: string;
  detail: string;
}) {
  return (
    <article>
      <span>{label}</span>
      <strong>{status}</strong>
      <small>{detail}</small>
    </article>
  );
}

function StructuredTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <section className="v60-structured-table">
      <header>
        <span>상세</span>
        <h4>{title}</h4>
      </header>

      <div
        className="v60-table-head"
        style={{
          gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))`,
        }}
      >
        {headers.map((header) => (
          <b key={header}>{header}</b>
        ))}
      </div>

      {rows.map((row, rowIndex) => (
        <div
          className="v60-table-row"
          key={rowIndex}
          style={{
            gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))`,
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
