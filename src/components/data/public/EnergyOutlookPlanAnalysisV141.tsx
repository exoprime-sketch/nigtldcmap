import ChartAxesV150 from "../../charts/ChartAxesV150";
import { useMemo, useState } from "react";

import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import {
  formatRangeV141,
  parseCTemplateRowsV141,
  rangeOfV141,
  type CTemplateRowV141,
} from "../../../data/visualization/cTemplateRowsV141";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./public-portfolio-summary-v132.css";
import "./energy-outlook-plan-v141.css";

/**
 * C-018: the revised PDP8's long-term power plan and outlook, and the 2024-25
 * power price regulations, read from the delivery's attribute rows.
 *
 * The delivery holds two kinds of thing under one element: the plan the
 * Prime Minister's Decision 768/QĐ-TTg states (capacity by technology in 2030
 * and 2050 as a lower and upper bound, demand, RE share, emissions, trade) and
 * a set of price regulations (retail price band, generation ceiling prices
 * by technology, import ceilings) in VND/kWh or UScent/kWh. The screen used
 * to open on a 121-row policy list and price cards without units; the plan is
 * now the primary analysis and each price states its unit and its document
 * (V141). Nothing is projected or interpolated: the plan's two years are
 * compared as bounds, not drawn as a trend.
 */
interface Props {
  entities: VietnamEntityV124[];
  /** The plan year a card handed over (2030 or 2050); 2030 otherwise. */
  initialYear?: number | null;
}

type PlanYear = 2030 | 2050;

interface PlanItem {
  label: string;
  unit: string;
  byYear: Map<number, { min: number; max: number }>;
  note: string;
}

interface PriceRow {
  label: string;
  kind: "소매가격" | "발전가격 상한(기술별)" | "수입전력 상한";
  unit: string;
  range: { min: number; max: number };
  document: string | null;
  note: string;
  url: string;
  time: string;
}

const CAPACITY_FAMILY = "C-018_generation_capacity_plan";
const DEMAND_FAMILY = "C-018_projection_scenario";
const GROWTH_FAMILY = "C-018_power_demand_growth";
const RE_SHARE_FAMILY = "C-018_re_share_target";
const AGENCY_FAMILY = "C-018_projection_agency";

const isPriceRow = (row: CTemplateRowV141) =>
  row.value !== null && /가격|상한가/u.test(row.name) && !/성장률|증가율/u.test(row.name);

function priceKind(row: CTemplateRowV141): PriceRow["kind"] {
  if (/수입전력/u.test(row.name)) return "수입전력 상한";
  if (/소매/u.test(row.name)) return "소매가격";
  return "발전가격 상한(기술별)";
}

function demandUnit(name: string): string {
  if (/최대전력|피크/u.test(name)) return "MW";
  return "십억 kWh";
}

function groupByItem(rows: CTemplateRowV141[], unitOf: (row: CTemplateRowV141) => string): PlanItem[] {
  const items = new Map<string, PlanItem>();
  const byKey = new Map<string, CTemplateRowV141[]>();
  rows.forEach((row) => {
    if (row.value === null || row.year === null) return;
    const key = `${row.name}|${row.year}`;
    const group = byKey.get(key) || [];
    group.push(row);
    byKey.set(key, group);
  });
  byKey.forEach((group, key) => {
    const [label, year] = key.split("|");
    const range = rangeOfV141(group);
    if (!range) return;
    const item = items.get(label) || { label, unit: unitOf(group[0]), byYear: new Map(), note: group[0].note };
    item.byYear.set(Number(year), range);
    items.set(label, item);
  });
  return [...items.values()];
}

export default function EnergyOutlookPlanAnalysisV141({ entities, initialYear }: Props) {
  const [year, setYear] = useState<PlanYear>(initialYear === 2050 ? 2050 : 2030);
  const model = useMemo(() => {
    const rows = parseCTemplateRowsV141(entities);
    const capacityRows = rows.filter((row) => row.indicatorId === CAPACITY_FAMILY && !/배출/u.test(row.name));
    const emissionRows = rows.filter((row) => row.indicatorId === CAPACITY_FAMILY && /배출/u.test(row.name));
    const capacity = groupByItem(capacityRows, () => "MW");
    const demand = groupByItem(rows.filter((row) => row.indicatorId === DEMAND_FAMILY), (row) => demandUnit(row.name));
    const reShare = groupByItem(
      rows.filter((row) => row.indicatorId === RE_SHARE_FAMILY).map((row) => ({ ...row, name: "재생에너지 비중 목표(수력 제외)" })),
      () => "%"
    );
    const emissions = groupByItem(
      emissionRows.map((row) => ({ ...row, name: "전력부문 온실가스 배출 전망" })),
      () => "백만톤 CO₂"
    );
    // Trade plan rows are filed under a "demand projection" family but state
    // import/export capacity by year; the source's own words name them.
    const trade = groupByItem(
      rows.filter((row) => /^(수입|수출)$/u.test(row.name)).map((row) => ({ ...row, name: row.name === "수입" ? "전력 수입 계획" : "전력 수출 계획" })),
      () => "MW"
    );
    const assumptions = rows.filter((row) => /GDP 성장률 가정/u.test(row.name));
    const growth = rows.filter((row) => row.indicatorId === GROWTH_FAMILY || /CAGR|증가율/u.test(row.name));
    const agency = rows.filter((row) => row.indicatorId === AGENCY_FAMILY);
    const prices: PriceRow[] = [];
    const priceGroups = new Map<string, CTemplateRowV141[]>();
    rows.filter(isPriceRow).forEach((row) => {
      const group = priceGroups.get(row.name) || [];
      group.push(row);
      priceGroups.set(row.name, group);
    });
    priceGroups.forEach((group, label) => {
      const range = rangeOfV141(group);
      if (!range) return;
      const first = group[0];
      // The unit is what the source states in the row's own words: VND/kWh
      // for domestic prices, UScent/kWh for the Lao import ceilings.
      const unit = /UScent|US cent|cent\/kWh/u.test(group.map((row) => row.note).join(" ")) || /수입전력/u.test(label) ? "UScent/kWh" : "VND/kWh";
      prices.push({ label, kind: priceKind(first), unit, range, document: group.map((row) => row.document).find(Boolean) || null, note: first.note, url: first.url, time: first.timeText });
    });
    const regulations = rows.filter(
      (row) => row.value === null && /PPA|산정 통칙|계약서|공표 주기|구조화 데이터|정책 방향|수출 조건/u.test(row.name)
    );
    const textPolicy = rows.filter((row) => row.value === null && !regulations.includes(row) && row.indicatorId !== AGENCY_FAMILY && !/CAGR|증가율/u.test(row.name));
    const planDocument = rows.map((row) => row.document).find((document) => document && /768/u.test(document)) || "Quyết định 768/QĐ-TTg";
    const planUrl = rows.find((row) => /768-ttg/u.test(row.url))?.url || "";
    return { capacity, demand, reShare, emissions, trade, assumptions, growth, agency, prices, regulations, textPolicy, planDocument, planUrl, total: rows.length };
  }, [entities]);

  if (!model.total) return null;

  const capacityAtYear = model.capacity
    .filter((item) => item.byYear.has(year))
    .map((item) => ({ ...item, range: item.byYear.get(year)! }))
    .sort((a, b) => b.range.max - a.range.max);
  const totalItem = capacityAtYear.find((item) => /^총 설비/u.test(item.label));
  const parts = capacityAtYear.filter((item) => !/^총 설비/u.test(item.label));
  const scaleMax = Math.max(...parts.map((item) => item.range.max), 1);
  const agencyOf = (pattern: RegExp) => model.agency.find((row) => pattern.test(row.name))?.valueText || "";
  const priceKinds: PriceRow["kind"][] = ["소매가격", "발전가격 상한(기술별)", "수입전력 상한"];

  return (
    <section className="pps132 eop141" data-testid="energy-outlook-plan-v141" data-source-rows={model.total}>
      <header className="pps132-heading">
        <span>주 분석</span>
        <h4><PublicTermTextV134 text="개정 PDP8의 전원별 설비 계획과 수요 전망" /></h4>
        <p>
          <PublicTermTextV134 text={`${model.planDocument}(개정 전력개발계획 PDP8, 2025) · 전망 기관 ${agencyOf(/기관/u) || "베트남 총리"} · ${agencyOf(/시나리오/u) || "단일 계획, 하한–상한 범위 제시"}. 두 시점(2030·2050)의 계획값을 하한~상한으로 비교하며, 연도 사이를 추세로 잇지 않습니다.`} />
        </p>
      </header>


      <section className="eop141__plan" aria-labelledby="eop141-plan-title">
        <div className="eop141__controls">
          <h5 id="eop141-plan-title">전원별 설비용량 계획 · {year}년 · <PublicTermTextV134 text="MW" />(하한~상한)</h5>
          <label className="cdp-field">
            <span className="cdp-field__label">계획 연도</span>
            <select className="cdp-select" value={year} onChange={(event) => setYear(Number(event.target.value) as PlanYear)} data-testid="energy-outlook-year-v141">
              <option value={2030}>2030</option>
              <option value={2050}>2050</option>
            </select>
          </label>
        </div>
        <ChartAxesV150 x="계획 설비용량" y="전원" unit="MW" />
        <ol className="eop141__bars" data-analysis-block="category-bar" aria-label={`${year}년 전원별 설비용량 계획`}>
          {parts.map((item) => (
            <li key={item.label}>
              <span className="eop141__label"><PublicTermTextV134 text={item.label} /></span>
              <span className="eop141__track" aria-hidden="true">
                <i style={{ left: `${(item.range.min / scaleMax) * 100}%`, width: `${Math.max(((item.range.max - item.range.min) / scaleMax) * 100, 0.6)}%` }} />
              </span>
              <span className="eop141__value">{formatRangeV141(item.range)} <PublicTermTextV134 text="MW" /></span>
            </li>
          ))}
        </ol>
        <p className="pps132-note">
          총 설비는 전원 합계가 아닌 원문의 총량이며, 각 전원의 하한·상한은 서로 다른 조합의 값이므로 더하지 않습니다. 원문에 한 값만 있는 전원은 하한과 상한이 같습니다.
        </p>
        <details className="sv125-chart-table" data-analysis-block="table" data-testid="energy-outlook-plan-table-v141">
          <summary>표로 보기 · 전원별 설비용량 계획 · 2030·2050년 · <PublicTermTextV134 text="MW" /></summary>
          <div className="pps132-table-wrap">
            <table>
              <caption>개정 PDP8 전원별 설비용량 계획 · 하한~상한 · 단위 <PublicTermTextV134 text="MW" /></caption>
              <thead>
                <tr>
                  <th scope="col">전원</th>
                  <th scope="col">2030년</th>
                  <th scope="col">2050년</th>
                  <th scope="col">단위</th>
                </tr>
              </thead>
              <tbody>
                {[...model.capacity].sort((a, b) => (b.byYear.get(2050)?.max ?? 0) - (a.byYear.get(2050)?.max ?? 0)).map((item) => (
                  <tr key={item.label}>
                    <th scope="row"><PublicTermTextV134 text={item.label} /></th>
                    <td>{item.byYear.has(2030) ? formatRangeV141(item.byYear.get(2030)!) : "—"}</td>
                    <td>{item.byYear.has(2050) ? formatRangeV141(item.byYear.get(2050)!) : "—"}</td>
                    <td><PublicTermTextV134 text="MW" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="pps132-distribution pps132-distribution--table" data-testid="energy-outlook-demand-v141">
        <h5>수요 전망·목표·배출·전력 교역 계획</h5>
        <div className="pps132-table-wrap" data-analysis-block="table">
          <table>
            <thead>
              <tr>
                <th scope="col">항목</th>
                <th scope="col">2030</th>
                <th scope="col">2035</th>
                <th scope="col">2050</th>
                <th scope="col">단위</th>
              </tr>
            </thead>
            <tbody>
              {[...model.demand, ...model.reShare, ...model.emissions, ...model.trade].map((item) => (
                <tr key={item.label}>
                  <th scope="row"><PublicTermTextV134 text={item.label} /></th>
                  {[2030, 2035, 2050].map((column) => (
                    <td key={column}>{item.byYear.has(column) ? formatRangeV141(item.byYear.get(column)!, 1) : "—"}</td>
                  ))}
                  <td><PublicTermTextV134 text={item.unit} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {model.assumptions.length > 0 && (
          <p className="pps132-note">
            <PublicTermTextV134
              text={[
                ...model.assumptions.map((row) => `${row.name} ${row.valueText}%`),
              ].filter(Boolean).join(" · ")}
            />
          </p>
        )}
        {model.growth.length > 0 && (
          <div className="pps132-table-wrap" data-analysis-block="table" data-testid="energy-outlook-derived-growth-v142">
            <table>
              <caption>2030–2050년 연평균 증가율 · 계획값으로 자체 계산</caption>
              <thead><tr><th scope="col">계산 대상</th><th scope="col">계산에 사용한 범위</th><th scope="col">연평균 증가율</th></tr></thead>
              <tbody>{model.growth.filter((row) => row.value !== null).map((row) => {
                const basis = row.note.split(/\s*기준\s*2030/u)[0];
                const bound = basis.match(/\((하한|상한)\)\s*$/u)?.[1];
                const subject = bound ? basis.replace(/\((하한|상한)\)\s*$/u, "") : "계산 대상 미기재";
                return <tr key={row.recordId}><th scope="row">{subject}</th><td>{bound ? `두 시점의 ${bound}값` : "미기재"}</td><td>{row.value}%</td></tr>;
              })}</tbody>
            </table>
            <p className="pps132-note">계산식: [(2050년 값 ÷ 2030년 값)^(1/20) − 1] × 100. 원문에 제시된 증가율이 아니며, 하한·상한은 계산에 사용한 계획값의 구분입니다.</p>
          </div>
        )}
      </section>

      {model.prices.length > 0 && (
        <section className="pps132-distribution pps132-distribution--table" data-analysis-block="table" data-testid="energy-outlook-prices-v141">
          <h5>전력가격 규정 · 2024–2025 · 같은 단위·가격 종류 안에서만 비교</h5>
          <div className="pps132-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">가격 종류</th>
                  <th scope="col">항목</th>
                  <th scope="col">하한~상한</th>
                  <th scope="col">단위</th>
                  <th scope="col">시점</th>
                  <th scope="col">근거 문서</th>
                </tr>
              </thead>
              <tbody>
                {priceKinds.flatMap((kind) =>
                  model.prices
                    .filter((price) => price.kind === kind)
                    .sort((a, b) => b.range.max - a.range.max)
                    .map((price) => (
                      <tr key={`${kind}-${price.label}`}>
                        <td>{kind}</td>
                        <th scope="row"><PublicTermTextV134 text={price.label} /></th>
                        <td>{formatRangeV141(price.range, 2)}</td>
                        <td><PublicTermTextV134 text={price.unit} /></td>
                        <td>{price.time || "—"}</td>
                        <td>
                          {price.document ? <PublicTermTextV134 text={price.document} /> : "원문 참조"}
                          {price.url && (
                            <>
                              {" · "}
                              <a href={price.url} target="_blank" rel="noreferrer">원문</a>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          <p className="pps132-note"><PublicTermTextV134 text="소매가격 밴드·평균 소매가격은 판매 단계, 발전가격 상한은 기술별 발전 단계, 수입전력 상한은 라오스 수입분(UScent/kWh)으로 서로 다른 가격입니다." /></p>
        </section>
      )}

      {(model.regulations.length > 0 || model.textPolicy.length > 0) && (
        <section className="pps132-distribution pps132-distribution--table" data-analysis-block="comparison-table" data-testid="energy-outlook-regulations-v141">
          <h5>제도 문서·시장 공표 · {model.regulations.length + model.textPolicy.length}건</h5>
          <div className="pps132-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">항목</th>
                  <th scope="col">확인 내용</th>
                  <th scope="col">시점</th>
                  <th scope="col">원문</th>
                </tr>
              </thead>
              <tbody>
                {[...model.regulations, ...model.textPolicy].map((row) => (
                  <tr key={row.recordId}>
                    <th scope="row"><PublicTermTextV134 text={row.name} /></th>
                    <td><PublicTermTextV134 text={row.valueText || row.note || "—"} /></td>
                    <td>{row.timeText || "—"}</td>
                    <td>{row.url ? <a href={row.url} target="_blank" rel="noreferrer">원문</a> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}
