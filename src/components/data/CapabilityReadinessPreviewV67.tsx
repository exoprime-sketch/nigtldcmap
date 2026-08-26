import { useMemo } from "react";
import type { VietnamDemoElement } from "../../types/vietnamDemo";
import { getCapabilityDefinitionV67 } from "../../utils/capabilityPresentationV67";
import {
  getTechnologyFilterGroups,
  getTechnologyName,
} from "../../utils/technologyData";
import { sampleNumber } from "../../utils/dataPreviewV53";
import { getCountryDataScope } from "../../utils/countryDataScopeV60";
import "../../styles/capability-preview-v67.css";

export interface CapabilityFilterStateV72 {
  selectorValue: string;
  technologyCategory: "all" | "감축" | "적응" | "융복합";
  technologyId: string;
  year: number;
}

interface Props {
  element: VietnamDemoElement;
  countryName: string;
  filters: CapabilityFilterStateV72;
}

interface ControlsProps {
  element: VietnamDemoElement;
  filters: CapabilityFilterStateV72;
  onChange: (next: CapabilityFilterStateV72) => void;
}

interface ViewRow {
  item: string;
  value: string;
  evidence: string;
  gap?: string;
}

interface ViewModel {
  scopeLabel: string;
  cards: Array<{
    label: string;
    value: string;
    note: string;
  }>;
  matrixHeaders: [string, string, string, string];
  rows: ViewRow[];
  detailHeaders: string[];
  detailRows: string[][];
  selectionSummary: string;
}

const TECH_CAPABILITY_IDS = new Set(["C-020", "E-011", "E-013", "E-016"]);

const YEAR_OPTIONS = [2025, 2024, 2023, 2022];

export function getDefaultCapabilityFilterStateV72(
  elementId: string
): CapabilityFilterStateV72 {
  const definition = getCapabilityDefinitionV67(elementId);

  return {
    selectorValue: definition?.selector?.options[0] ?? "",
    technologyCategory: "all",
    technologyId: "all",
    year: 2025,
  };
}

export function CapabilityControlsV72({
  element,
  filters,
  onChange,
}: ControlsProps) {
  const definition = getCapabilityDefinitionV67(element.elementId);
  const technologyGroups = useMemo(() => getTechnologyFilterGroups(), []);

  if (!definition) return null;

  if (TECH_CAPABILITY_IDS.has(element.elementId)) {
    const availableTechnologies =
      filters.technologyCategory === "all"
        ? technologyGroups.flatMap((group) => group.technologies)
        : technologyGroups.find(
            (group) => group.category === filters.technologyCategory
          )?.technologies ?? [];

    return (
      <section className="v72-capability-controls">
        <label>
          <span>기술군</span>
          <select
            value={filters.technologyCategory}
            onChange={(event) =>
              onChange({
                ...filters,
                technologyCategory: event.target.value as
                  | "all"
                  | "감축"
                  | "적응"
                  | "융복합",
                technologyId: "all",
              })
            }
          >
            <option value="all">전체</option>
            <option value="감축">감축</option>
            <option value="적응">적응</option>
            <option value="융복합">융복합</option>
          </select>
        </label>

        <label>
          <span>기후기술</span>
          <select
            value={filters.technologyId}
            onChange={(event) =>
              onChange({
                ...filters,
                technologyId: event.target.value,
              })
            }
          >
            <option value="all">전체 기후기술</option>
            {availableTechnologies.map((technology) => (
              <option key={technology.id} value={technology.id}>
                {technology.nameKo}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>기준연도</span>
          <select
            value={filters.year}
            onChange={(event) =>
              onChange({
                ...filters,
                year: Number(event.target.value),
              })
            }
          >
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
        </label>
      </section>
    );
  }

  if (element.elementId === "E-007") {
    return (
      <section className="v72-capability-controls two">
        <label>
          <span>부문</span>
          <select
            value={filters.selectorValue}
            onChange={(event) =>
              onChange({
                ...filters,
                selectorValue: event.target.value,
              })
            }
          >
            {definition.selector?.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>기준연도</span>
          <select
            value={filters.year}
            onChange={(event) =>
              onChange({
                ...filters,
                year: Number(event.target.value),
              })
            }
          >
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
        </label>
      </section>
    );
  }

  if (definition.selector) {
    return (
      <section className="v72-capability-controls one">
        <label>
          <span>{definition.selector.label}</span>
          <select
            value={filters.selectorValue}
            onChange={(event) => {
              const raw = event.target.value;
              const maybeYear = Number(raw);

              onChange({
                ...filters,
                selectorValue: raw,
                year:
                  Number.isFinite(maybeYear) && maybeYear > 2000
                    ? maybeYear
                    : filters.year,
              });
            }}
          >
            {definition.selector.options.map((option) => (
              <option key={option} value={option}>
                {/^\d{4}$/.test(option) ? `${option}년` : option}
              </option>
            ))}
          </select>
        </label>
      </section>
    );
  }

  return null;
}

export function CapabilityOverviewV67({
  element,
  countryName,
  filters,
}: Props) {
  const definition = getCapabilityDefinitionV67(element.elementId);

  if (!definition) return null;

  const view = buildViewModel(element.elementId, countryName, filters);

  return (
    <section className="v67-capability-view">
      <div className="v72-selection-summary">
        <span>선택 조건</span>
        <b>{view.selectionSummary}</b>
      </div>

      <div className="v67-capability-kpis">
        {view.cards.map((card) => (
          <article key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.note}</small>
          </article>
        ))}
      </div>

      <section className="v67-capability-matrix">
        <div className="v67-matrix-head">
          {view.matrixHeaders.map((header) => (
            <span key={header}>{header}</span>
          ))}
        </div>

        {view.rows.map((row) => (
          <div className="v67-matrix-row" key={row.item}>
            <b>{row.item}</b>
            <strong>{row.value}</strong>
            <span>{row.evidence}</span>
            <small>{row.gap ?? "—"}</small>
          </div>
        ))}
      </section>

      <div className="v67-capability-caution">
        <b>해석 시 유의사항</b>
        <span>{definition.caution}</span>
      </div>
    </section>
  );
}

export function CapabilityDetailV67({ element, countryName, filters }: Props) {
  const definition = getCapabilityDefinitionV67(element.elementId);

  if (!definition) return null;

  const view = buildViewModel(element.elementId, countryName, filters);

  return (
    <section className="v67-capability-detail">
      <header>
        <div>
          <span>{view.scopeLabel}</span>
          <h4>{definition.detailLabel}</h4>
        </div>
        <small>{view.selectionSummary} · 예시 화면</small>
      </header>

      <div className="v67-detail-table">
        <div
          className="v67-detail-head"
          style={{
            gridTemplateColumns: `repeat(${view.detailHeaders.length}, minmax(140px, 1fr))`,
          }}
        >
          {view.detailHeaders.map((header) => (
            <b key={header}>{header}</b>
          ))}
        </div>

        {view.detailRows.map((row, rowIndex) => (
          <div
            className="v67-detail-row"
            key={rowIndex}
            style={{
              gridTemplateColumns: `repeat(${view.detailHeaders.length}, minmax(140px, 1fr))`,
            }}
          >
            {row.map((cell, cellIndex) => (
              <span key={cellIndex}>{cell}</span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function buildViewModel(
  elementId: string,
  countryName: string,
  filters: CapabilityFilterStateV72
): ViewModel {
  const scopeLabel =
    getCountryDataScope(elementId) === "korea_common" ? "한국" : countryName;

  if (elementId === "E-016" || elementId === "E-011") {
    return buildTrlView(elementId, scopeLabel, filters);
  }

  if (elementId === "E-013") {
    return buildOmView(scopeLabel, filters);
  }

  if (elementId === "C-020") {
    return buildFeasibilityView(scopeLabel, filters);
  }

  if (elementId === "E-007") {
    return buildMrvView(scopeLabel, filters);
  }

  if (elementId === "D-007") {
    return buildCbtView(scopeLabel, filters);
  }

  if (elementId === "C-022") {
    return buildCarbonMarketView(scopeLabel, filters);
  }

  if (elementId === "C-006") {
    return buildArticle6View(scopeLabel, filters);
  }

  return {
    scopeLabel,
    cards: [],
    matrixHeaders: [
      "검토 항목",
      "운영·준비 현황",
      "함께 확인할 근거",
      "추가 확인",
    ],
    rows: [],
    detailHeaders: [],
    detailRows: [],
    selectionSummary: scopeLabel,
  };
}

function buildTrlView(
  elementId: "E-016" | "E-011",
  scopeLabel: string,
  filters: CapabilityFilterStateV72
): ViewModel {
  const groups = getTechnologyFilterGroups();

  const basePool =
    filters.technologyCategory === "all"
      ? groups.flatMap((group) => group.technologies)
      : groups.find((group) => group.category === filters.technologyCategory)
          ?.technologies ?? [];

  const pool =
    filters.technologyId === "all"
      ? basePool
      : basePool.filter((technology) => technology.id === filters.technologyId);

  const technologyRows = pool.map((technology) => {
    const trl = calculateTrl(elementId, technology.id, filters.year);

    return {
      id: technology.id,
      name: technology.nameKo,
      trl,
      stage: trlStage(trl),
      evidence:
        elementId === "E-016"
          ? "국내 실증·상용·수출 프로젝트 근거"
          : "현지 실증·상용 프로젝트·기관 근거",
    };
  });

  const count89 = technologyRows.filter((row) => row.trl >= 8).length;
  const count67 = technologyRows.filter(
    (row) => row.trl >= 6 && row.trl <= 7
  ).length;
  const count5 = technologyRows.filter((row) => row.trl <= 5).length;

  const selectedTechnology =
    filters.technologyId === "all" ? null : technologyRows[0] ?? null;

  const categoryLabel =
    filters.technologyCategory === "all"
      ? "전체 기술군"
      : filters.technologyCategory;

  const selectionSummary = [
    scopeLabel,
    categoryLabel,
    selectedTechnology?.name ?? "전체 기후기술",
    `${filters.year}년`,
  ].join(" · ");

  const cards = selectedTechnology
    ? [
        {
          label: "선택 기술",
          value: selectedTechnology.name,
          note: scopeLabel,
        },
        {
          label: elementId === "E-016" ? "한국 TRL" : "현지 TRL",
          value: `TRL ${selectedTechnology.trl}`,
          note: `${filters.year}년 · 화면 예시`,
        },
        {
          label: "검증단계",
          value: selectedTechnology.stage,
          note: "TRL 판정 단계",
        },
        {
          label: "근거 유형",
          value: "프로젝트·기관",
          note: "실증·상용근거",
        },
      ]
    : [
        {
          label: "TRL 8–9",
          value: `${count89}개 기술`,
          note: `${scopeLabel} · ${categoryLabel}`,
        },
        {
          label: "TRL 6–7",
          value: `${count67}개 기술`,
          note: `${scopeLabel} · ${categoryLabel}`,
        },
        {
          label: "TRL 5 이하",
          value: `${count5}개 기술`,
          note: `${scopeLabel} · ${categoryLabel}`,
        },
        {
          label: "기준연도",
          value: String(filters.year),
          note: `${technologyRows.length}개 기술`,
        },
      ];

  const visibleRows = technologyRows.slice(0, 12);

  return {
    scopeLabel,
    cards,
    matrixHeaders: ["기후기술", "TRL", "판정근거", "추가 확인"],
    rows: visibleRows.map((row) => ({
      item: row.name,
      value: `TRL ${row.trl}`,
      evidence: row.evidence,
      gap:
        row.trl >= 8
          ? "현지적합성·가격경쟁력"
          : row.trl >= 6
          ? "대규모 실증·상용 레퍼런스"
          : "파일럿·성능검증",
    })),
    detailHeaders: [
      "기후기술",
      elementId === "E-016" ? "한국 TRL" : "현지 TRL",
      "근거기관/프로젝트",
      "검증단계",
      "기준연도",
    ],
    detailRows: visibleRows.map((row) => [
      row.name,
      String(row.trl),
      row.evidence,
      row.stage,
      String(filters.year),
    ]),
    selectionSummary,
  };
}

function buildOmView(
  scopeLabel: string,
  filters: CapabilityFilterStateV72
): ViewModel {
  const technologyName =
    filters.technologyId === "all"
      ? filters.technologyCategory === "all"
        ? "전체 기후기술"
        : `${filters.technologyCategory} 기술군`
      : getTechnologyName(filters.technologyId);

  const statusSets = [
    ["충분", "부분 확보", "제한"],
    ["양호", "부분 확보", "제한"],
    ["운영", "부분 운영", "미흡"],
    ["충분", "제한", "미확인"],
    ["다수 확인", "일부 확인", "추가 확인"],
  ];

  const items = [
    ["숙련인력", "자격인력·교육기관·현장인력", "고급 진단인력"],
    ["부품조달", "현지 재고·수입기간·공급사", "핵심부품 현지화"],
    ["예방정비", "정비주기·CMMS·계약", "예지정비"],
    ["A/S 인프라", "서비스센터·응답시간", "지방 서비스망"],
    ["유사시설 실적", "운영기간·가동률·고장실적", "장기 실적"],
  ];

  const rows = items.map((item, index) => {
    const pick = Math.floor(
      sampleNumber(`E-013:${technologyName}:${filters.year}:${index}`, 0, 2.99)
    );

    return {
      item: item[0],
      value: statusSets[index][pick],
      evidence: item[1],
      gap: item[2],
    };
  });

  return {
    scopeLabel,
    cards: rows.slice(0, 4).map((row) => ({
      label: row.item,
      value: row.value,
      note: `${technologyName} · ${filters.year}년`,
    })),
    matrixHeaders: ["O&M 항목", "현황", "확인할 근거", "주요 공백"],
    rows,
    detailHeaders: ["역량항목", "현황", "근거", "확인기관/시설", "주요 공백"],
    detailRows: rows.map((row, index) => [
      row.item,
      row.value,
      row.evidence,
      `기관·시설 ${String.fromCharCode(65 + index)}`,
      row.gap ?? "—",
    ]),
    selectionSummary: `${scopeLabel} · ${technologyName} · ${filters.year}년`,
  };
}

function buildFeasibilityView(
  scopeLabel: string,
  filters: CapabilityFilterStateV72
): ViewModel {
  const technologyName =
    filters.technologyId === "all"
      ? filters.technologyCategory === "all"
        ? "전체 기후기술"
        : `${filters.technologyCategory} 기술군`
      : getTechnologyName(filters.technologyId);

  const items = [
    ["기준선", "기준선 시나리오·활동자료·배출계수", "시설 원값"],
    ["MRV", "모니터링 변수·주기·계측기", "QA/QC 계획"],
    ["추가성", "규제·재무·관행 분석", "투자분석"],
    ["방법론", "VCS·GS·Article 6 방법론", "적용가능성 확인"],
    ["데이터 가용성", "에너지사용·생산량·활동자료", "시설 단위 원자료"],
  ];

  const states = ["준비", "부분 준비", "보완 필요", "검토 필요"];

  const rows = items.map((item, index) => {
    const pick = Math.floor(
      sampleNumber(`C-020:${technologyName}:${filters.year}:${index}`, 0, 3.99)
    );

    return {
      item: item[0],
      value: states[pick],
      evidence: item[1],
      gap: item[2],
    };
  });

  return {
    scopeLabel,
    cards: rows.slice(0, 4).map((row) => ({
      label: row.item,
      value: row.value,
      note: `${technologyName} · ${filters.year}년`,
    })),
    matrixHeaders: ["검토항목", "준비상태", "필요 근거", "주요 공백"],
    rows,
    detailHeaders: [
      "검토항목",
      "필요 근거",
      "현재 상태",
      "추가 확보",
      "판정 유의",
    ],
    detailRows: rows.map((row) => [
      row.item,
      row.evidence,
      row.value,
      row.gap ?? "—",
      "검증 전 확정 금지",
    ]),
    selectionSummary: `${scopeLabel} · ${technologyName} · ${filters.year}년`,
  };
}

function buildMrvView(
  scopeLabel: string,
  filters: CapabilityFilterStateV72
): ViewModel {
  const sector = filters.selectorValue || "전체";

  const sectors = [
    ["에너지", "Tier 2", "국가 에너지통계", "국가/기본값 혼용", "운영"],
    ["산업공정", "Tier 1–2", "생산통계", "기본·국가값", "부분"],
    ["농업·LULUCF", "Tier 1", "토지·농업통계", "IPCC 기본값", "보완 필요"],
    ["폐기물", "Tier 1–2", "폐기물통계", "국가/기본값", "부분"],
  ];

  const filtered =
    sector === "전체" ? sectors : sectors.filter((row) => row[0] === sector);

  const selected = filtered[0];

  const cards =
    sector === "전체"
      ? [
          {
            label: "국가 레지스트리",
            value: "운영",
            note: `${scopeLabel} · ${filters.year}년`,
          },
          { label: "QA/QC", value: "절차 있음", note: "국가 인벤토리" },
          { label: "BTR", value: "제출", note: "보고체계" },
          { label: "CBIT 지원", value: "수혜", note: "역량강화" },
        ]
      : [
          {
            label: "선택 부문",
            value: sector,
            note: `${scopeLabel} · ${filters.year}년`,
          },
          {
            label: "인벤토리 Tier",
            value: selected?.[1] ?? "확인 필요",
            note: "부문별 방법론",
          },
          {
            label: "활동자료",
            value: selected?.[2] ?? "확인 필요",
            note: "자료원",
          },
          {
            label: "QA/QC",
            value: selected?.[4] ?? "확인 필요",
            note: "검증 수준",
          },
        ];

  return {
    scopeLabel,
    cards,
    matrixHeaders: ["부문", "Tier·방법론", "활동자료·배출계수", "QA/QC"],
    rows: filtered.map((row) => ({
      item: row[0],
      value: row[1],
      evidence: `${row[2]} · ${row[3]}`,
      gap: row[4],
    })),
    detailHeaders: [
      "부문",
      "Tier",
      "활동자료",
      "배출계수",
      "QA/QC",
      "근거연도",
    ],
    detailRows: filtered.map((row) => [
      row[0],
      row[1],
      row[2],
      row[3],
      row[4],
      String(filters.year),
    ]),
    selectionSummary: `${scopeLabel} · ${sector} · ${filters.year}년`,
  };
}

function buildCbtView(
  scopeLabel: string,
  filters: CapabilityFilterStateV72
): ViewModel {
  const year = Number(filters.selectorValue) || filters.year;

  const profile: Record<
    number,
    {
      stage: string;
      ministries: number;
      cycle: string;
      reporting: string;
    }
  > = {
    2023: {
      stage: "시범 도입",
      ministries: 8,
      cycle: "편성 단계",
      reporting: "내부 보고",
    },
    2024: {
      stage: "부분 도입",
      ministries: 12,
      cycle: "편성·승인",
      reporting: "연례 공개",
    },
    2025: {
      stage: "부분 확대",
      ministries: 15,
      cycle: "편성·승인·집행",
      reporting: "연례 공개·내부검토",
    },
  };

  const current = profile[year] ?? profile[2025];

  const rows = [
    {
      item: "제도·법적 근거",
      value: current.stage,
      evidence: "예산편성 지침·근거조항·도입연도",
      gap: "법적 의무수준",
    },
    {
      item: "태깅 적용 범위",
      value: `${current.ministries}개 부처`,
      evidence: "적용부처·경상/자본예산·지방정부 범위",
      gap: "지방정부 포함범위",
    },
    {
      item: "분류체계",
      value: "감축·적응·교차",
      evidence: "분류기준·태그·중복처리",
      gap: "세부 taxonomy",
    },
    {
      item: "예산주기 통합",
      value: current.cycle,
      evidence: "기획·편성·승인·집행·결산",
      gap: "결산 연계",
    },
    {
      item: "공개·보고",
      value: current.reporting,
      evidence: "공개문서·주기·세부 공개수준",
      gap: "사업단위 공개",
    },
    {
      item: "검증·QA",
      value: "재무부 내부 검토",
      evidence: "검토기관·절차·외부검증",
      gap: "외부검증",
    },
  ];

  return {
    scopeLabel,
    cards: [
      {
        label: "도입 단계",
        value: current.stage,
        note: `${scopeLabel} · ${year}년`,
      },
      {
        label: "적용 범위",
        value: `${current.ministries}개 부처`,
        note: "화면 예시",
      },
      { label: "분류체계", value: "감축·적응·교차", note: "화면 예시" },
      { label: "공개·보고", value: current.reporting, note: "화면 예시" },
    ],
    matrixHeaders: ["제도 항목", "운영 현황", "확인할 근거", "추가 확인"],
    rows,
    detailHeaders: [
      "항목",
      "운영 현황",
      "적용범위/기관",
      "근거문서",
      "기준연도",
    ],
    detailRows: rows.map((row) => [
      row.item,
      row.value,
      row.item === "태깅 적용 범위"
        ? `${current.ministries}개 부처`
        : "재무부·관계부처",
      "예산지침·CBT 문서",
      String(year),
    ]),
    selectionSummary: `${scopeLabel} · ${year}년`,
  };
}

function buildCarbonMarketView(
  scopeLabel: string,
  filters: CapabilityFilterStateV72
): ViewModel {
  const year = Number(filters.selectorValue) || filters.year;

  const maturity = {
    2023: ["법제도 마련", "계획", "시범", "지정"],
    2024: ["부분 구축", "구축 중", "운영", "지정"],
    2025: ["시행", "운영 준비", "운영", "지정"],
  }[year] ?? ["시행", "운영 준비", "운영", "지정"];

  const rows = [
    {
      item: "법제도",
      value: maturity[0],
      evidence: "탄소시장법·시행령·세부지침",
    },
    {
      item: "레지스트리",
      value: maturity[1],
      evidence: "계정·발행·이전·취소 기능",
    },
    {
      item: "MRV",
      value: maturity[2],
      evidence: "방법론·검증기관·보고규칙",
    },
    {
      item: "승인기관",
      value: maturity[3],
      evidence: "담당부처·승인절차·처리기한",
    },
    {
      item: "거래·정산",
      value: year >= 2025 ? "부분 운영" : "준비",
      evidence: "거래플랫폼·결제·세무·회계",
    },
  ];

  return {
    scopeLabel,
    cards: rows.slice(0, 4).map((row) => ({
      label: row.item,
      value: row.value,
      note: `${scopeLabel} · ${year}년`,
    })),
    matrixHeaders: ["구성요소", "운영상태", "확인할 근거", "추가 확인"],
    rows: rows.map((row) => ({
      ...row,
      gap:
        row.value.includes("준비") || row.value.includes("구축")
          ? "운영실적"
          : "최신 이행상태",
    })),
    detailHeaders: ["구성요소", "현황", "담당기관", "근거문서", "기준연도"],
    detailRows: rows.map((row, index) => [
      row.item,
      row.value,
      `기관 ${String.fromCharCode(65 + index)}`,
      row.evidence,
      String(year),
    ]),
    selectionSummary: `${scopeLabel} · ${year}년`,
  };
}

function buildArticle6View(
  scopeLabel: string,
  filters: CapabilityFilterStateV72
): ViewModel {
  const latest = filters.selectorValue !== "이전 기준";

  const agreementCount = latest ? 2 : 1;
  const registry = latest ? "구축 중" : "계획";
  const transfer = latest ? "추가 확인" : "미확인";

  const rows = [
    {
      item: "법·제도 기반",
      value: latest ? "승인절차 마련" : "기초지침",
      evidence: "법령·정부지침·승인기관",
    },
    {
      item: "양자협정",
      value: `${agreementCount}개 협정`,
      evidence: "상대국·체결일·대상부문·원문",
    },
    {
      item: "상응조정",
      value: latest ? "절차 규정" : "검토 중",
      evidence: "회계방식·보고주기·책임기관",
    },
    {
      item: "레지스트리·추적",
      value: registry,
      evidence: "등록·이전·취소·고유번호 관리",
    },
    {
      item: "보고·검증",
      value: latest ? "보고체계 확인" : "초기 체계",
      evidence: "Initial Report·BTR·검증절차",
    },
    {
      item: "이전 경험",
      value: transfer,
      evidence: "승인·이전량·상대국·거래일",
    },
  ];

  return {
    scopeLabel,
    cards: [
      {
        label: "양자협정",
        value: `${agreementCount}건`,
        note: `${scopeLabel} · ${filters.selectorValue}`,
      },
      { label: "승인기관", value: latest ? "지정" : "검토", note: "화면 예시" },
      { label: "국가 레지스트리", value: registry, note: "화면 예시" },
      { label: "ITMO 이전실적", value: transfer, note: "화면 예시" },
    ],
    matrixHeaders: ["이행요소", "현황", "확인할 근거", "추가 확인"],
    rows: rows.map((row) => ({
      ...row,
      gap:
        row.value.includes("검토") || row.value.includes("확인")
          ? "최신 공식자료"
          : "—",
    })),
    detailHeaders: [
      "협정/거래",
      "상대국",
      "체결·승인일",
      "대상부문·기술",
      "상태",
      "원문",
    ],
    detailRows: Array.from({ length: agreementCount }, (_, index) => [
      `협정 ${String.fromCharCode(65 + index)}`,
      `상대국 ${String.fromCharCode(65 + index)}`,
      latest ? `202${4 + index}-0${6 + index}-15` : "2023-08-10",
      index === 0 ? "에너지" : "산업·폐기물",
      latest ? "이행 중" : "체결",
      "공식 원문 ↗",
    ]),
    selectionSummary: `${scopeLabel} · ${filters.selectorValue}`,
  };
}

function calculateTrl(
  elementId: string,
  technologyId: string,
  year: number
): number {
  const baseline = sampleNumber(
    `${elementId}:${technologyId}:${year}:trl`,
    elementId === "E-016" ? 5.8 : 4.8,
    elementId === "E-016" ? 9.45 : 9.1
  );

  return Math.max(4, Math.min(9, Math.round(baseline)));
}

function trlStage(trl: number): string {
  if (trl >= 9) return "상용운영";
  if (trl === 8) return "상용·대규모 실증";
  if (trl === 7) return "대규모 실증";
  if (trl === 6) return "파일럿";
  return "시제품·검증";
}
