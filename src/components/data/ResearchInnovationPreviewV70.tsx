import { useMemo } from "react";
import { PRIORITY_COUNTRIES } from "../../data/priorityCountries";
import type { VietnamDemoElement } from "../../types/vietnamDemo";
import {
  getTechnologyFilterGroups,
  getTechnologyName,
} from "../../utils/technologyData";
import { sampleNumber } from "../../utils/dataPreviewV53";
import {
  getResearchRecordTypeLabelV70,
  RESEARCH_RECORD_TYPE_OPTIONS,
} from "../../utils/researchInnovationV70";
import type {
  ResearchRecordType,
} from "../../utils/researchInnovationV70";
import "../../styles/research-innovation-v70.css";

interface ControlProps {
  recordType: ResearchRecordType;
  technologyId: string;
  onRecordTypeChange: (value: ResearchRecordType) => void;
  onTechnologyChange: (value: string) => void;
}

export function ResearchInnovationControlsV70({
  recordType,
  technologyId,
  onRecordTypeChange,
  onTechnologyChange,
}: ControlProps) {
  const technologyGroups = useMemo(() => getTechnologyFilterGroups(), []);

  return (
    <section className="v70-research-controls">
      <label>
        <span>자료 유형</span>
        <select
          value={recordType}
          onChange={(event) =>
            onRecordTypeChange(event.target.value as ResearchRecordType)
          }
        >
          {RESEARCH_RECORD_TYPE_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>기후기술</span>
        <select
          value={technologyId}
          onChange={(event) => onTechnologyChange(event.target.value)}
        >
          <option value="all">전체 기후기술</option>
          {technologyGroups.map((group) => (
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
    </section>
  );
}

interface OverviewProps {
  element: VietnamDemoElement;
  countryIso3: string;
  countryName: string;
  year: number;
  recordType: ResearchRecordType;
  technologyId: string;
}

export function ResearchInnovationOverviewV70({
  element,
  countryIso3,
  countryName,
  year,
  recordType,
  technologyId,
}: OverviewProps) {
  const technologyGroups = useMemo(() => getTechnologyFilterGroups(), []);
  const flatTechnologies = technologyGroups.flatMap(
    (group) => group.technologies
  );

  const technologyName =
    technologyId === "all" ? "전체 기후기술" : getTechnologyName(technologyId);

  const typeLabel = getResearchRecordTypeLabelV70(recordType);

  const counts = useMemo(() => {
    const seed = `${element.elementId}:${countryIso3}:${year}:${technologyId}`;

    return {
      paper: Math.round(sampleNumber(`${seed}:paper`, 25, 780)),
      patent: Math.round(sampleNumber(`${seed}:patent`, 8, 320)),
      cooperation: Math.round(sampleNumber(`${seed}:cooperation`, 4, 190)),
      korea: Math.round(sampleNumber(`${seed}:korea`, 1, 95)),
    };
  }, [element.elementId, countryIso3, year, technologyId]);

  const selectedCount =
    recordType === "paper"
      ? counts.paper
      : recordType === "patent"
      ? counts.patent
      : recordType === "cooperation"
      ? counts.cooperation
      : counts.paper + counts.patent + counts.cooperation;

  const trend = Array.from({ length: 8 }, (_, index) => ({
    year: year - 7 + index,
    value: Math.round(
      sampleNumber(
        `${
          element.elementId
        }:${countryIso3}:${technologyId}:${recordType}:trend:${
          year - 7 + index
        }`,
        10,
        Math.max(40, selectedCount * 1.15)
      )
    ),
  }));

  const comparison = PRIORITY_COUNTRIES.map((country) => ({
    ...country,
    value: Math.round(
      sampleNumber(
        `${element.elementId}:${country.iso3}:${technologyId}:${recordType}:${year}:compare`,
        8,
        Math.max(50, selectedCount * 1.4)
      )
    ),
  })).sort((a, b) => b.value - a.value);

  const institutions = [
    "국립 연구기관",
    "공과대학",
    "에너지 연구센터",
    "산업기술 연구소",
    "국제 공동연구기관",
  ]
    .map((name, index) => ({
      name,
      value: Math.round(
        sampleNumber(
          `${element.elementId}:${countryIso3}:${technologyId}:${recordType}:institution:${index}`,
          8,
          120
        )
      ),
    }))
    .sort((a, b) => b.value - a.value);

  const typeSequence: ResearchRecordType[] =
    recordType === "all"
      ? ["paper", "patent", "cooperation"]
      : [recordType, recordType, recordType];

  const rows = Array.from({ length: 3 }, (_, index) => {
    const itemType = typeSequence[index % typeSequence.length];

    const technology =
      technologyId === "all"
        ? flatTechnologies[(index * 3) % Math.max(flatTechnologies.length, 1)]
            ?.nameKo ?? "기후기술"
        : technologyName;

    return {
      type: getResearchRecordTypeLabelV70(itemType),
      technology,
      title:
        itemType === "paper"
          ? `${technology} 연구 논문 ${String.fromCharCode(65 + index)}`
          : itemType === "patent"
          ? `${technology} 특허 ${String.fromCharCode(65 + index)}`
          : `${technology} 국제협력 ${String.fromCharCode(65 + index)}`,
      institution: institutions[index]?.name ?? "연구기관",
      year: year - index,
      cooperation:
        itemType === "paper"
          ? `${Math.round(
              sampleNumber(
                `${countryIso3}:${technology}:${index}:coauthor`,
                18,
                82
              )
            )}% 국제공저`
          : itemType === "patent"
          ? index % 2 === 0
            ? "한국 공동출원"
            : "국제 공동출원"
          : index % 2 === 0
          ? "한국 기관 참여"
          : "다자 공동연구",
    };
  });

  return (
    <section className="v70-research-view">
      <div className="v70-research-kpis">
        <Kpi
          label="논문"
          value={`${counts.paper.toLocaleString("ko-KR")}건`}
          active={recordType === "all" || recordType === "paper"}
        />
        <Kpi
          label="특허"
          value={`${counts.patent.toLocaleString("ko-KR")}건`}
          active={recordType === "all" || recordType === "patent"}
        />
        <Kpi
          label="국제협력"
          value={`${counts.cooperation.toLocaleString("ko-KR")}건`}
          active={recordType === "all" || recordType === "cooperation"}
        />
        <Kpi
          label="한국 공동실적"
          value={`${counts.korea.toLocaleString("ko-KR")}건`}
          active
        />
      </div>

      <div className="v70-research-context">
        <div>
          <span>선택 기술</span>
          <b>{technologyName}</b>
        </div>
        <div>
          <span>자료 유형</span>
          <b>{typeLabel}</b>
        </div>
        <div>
          <span>대상국·기준연도</span>
          <b>
            {countryName} · {year}년
          </b>
        </div>
      </div>

      <div className="v70-research-grid">
        <article className="v70-panel">
          <header>
            <h4>{typeLabel} 추세</h4>
            <p>{technologyName} · 최근 8개 기준연도 · 예시값</p>
          </header>
          <ResearchLine rows={trend} />
        </article>

        <article className="v70-panel">
          <header>
            <h4>국가별 비교</h4>
            <p>
              {technologyName} · {typeLabel} · {year}년
            </p>
          </header>
          <ResearchBars rows={comparison} selectedIso3={countryIso3} />
        </article>
      </div>

      <div className="v70-research-grid lower">
        <article className="v70-panel">
          <header>
            <h4>주요 연구·혁신 기관</h4>
            <p>선택 조건 기준 활동량 예시</p>
          </header>
          <div className="v70-institutions">
            {institutions.map((institution, index) => (
              <div key={institution.name}>
                <span>{index + 1}</span>
                <b>{institution.name}</b>
                <strong>{institution.value}건</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="v70-panel">
          <header>
            <h4>자료 목록</h4>
            <p>세부 자료는 항목별로 제공 예정</p>
          </header>
          <div className="v70-record-list">
            {rows.map((row) => (
              <article key={`${row.type}:${row.title}`}>
                <div>
                  <span>{row.type}</span>
                  <b>{row.technology}</b>
                </div>
                <strong>{row.title}</strong>
                <small>
                  {row.institution} · {row.year} · {row.cooperation}
                </small>
              </article>
            ))}
          </div>
        </article>
      </div>

      <div className="v70-research-note">
        논문·특허·국제협력은 자료유형과 기후기술을 동일 조건으로 맞춘 뒤 비교
      </div>
    </section>
  );
}

function Kpi({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <article className={active ? "active" : ""}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>예시값</small>
    </article>
  );
}

function ResearchLine({ rows }: { rows: { year: number; value: number }[] }) {
  const width = 620;
  const height = 210;
  const pad = 16;
  const values = rows.map((row) => row.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const path = rows
    .map((row, index) => {
      const x =
        pad + (index / Math.max(1, rows.length - 1)) * (width - pad * 2);
      const y = height - pad - ((row.value - min) / range) * (height - pad * 2);

      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <>
      <svg className="v70-line" viewBox={`0 0 ${width} ${height}`}>
        <path d={path} />
      </svg>
      <div className="v70-line-years">
        <span>{rows[0]?.year}</span>
        <span>{rows[Math.floor(rows.length / 2)]?.year}</span>
        <span>{rows[rows.length - 1]?.year}</span>
      </div>
    </>
  );
}

function ResearchBars({
  rows,
  selectedIso3,
}: {
  rows: {
    iso3: string;
    nameKo: string;
    value: number;
  }[];
  selectedIso3: string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="v70-bars">
      {rows.map((row) => (
        <div
          key={row.iso3}
          className={row.iso3 === selectedIso3 ? "selected" : ""}
        >
          <span>{row.nameKo}</span>
          <i>
            <b
              style={{
                width: `${(row.value / max) * 100}%`,
              }}
            />
          </i>
          <strong>{row.value}건</strong>
        </div>
      ))}
    </div>
  );
}
