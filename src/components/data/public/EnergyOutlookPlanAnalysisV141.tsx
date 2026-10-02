import ChartAxesV150 from "../../charts/ChartAxesV150";
import { useMemo, useState } from "react";

import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import {
  formatRangeV141,
  parseCTemplateRowsV141,
  rangeOfV141,
  type CTemplateRowV141,
} from "../../../data/visualization/cTemplateRowsV141";
import { wideRecordsOfEntitiesV162, type WideRecordV162 } from "../../../data/visualization/wideRecordsV162";
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
 *
 * From the 2026-09-30 delivery the sheet is the shared wide template (one row
 * per record, columns grouped by a bracketed block header) instead of the
 * long 속성1…속성23 attribute rows. `buildWideModelV162` reads that shape
 * directly through `wideRecordsOfEntitiesV162`; `buildLegacyModelV162` keeps
 * reading the old rows so a provider still on the old template renders the
 * same as before. Both builders return the same `PlanModelV162` shape so the
 * JSX below does not need to know which template produced it. The wide
 * delivery drops the price regulations and the emissions/trade rows the old
 * template carried; nothing is invented to fill the gap, the sections that
 * have no rows simply do not render (each is already length-guarded).
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

/** A computed year-over-year rate, shown with the range it was read from. */
interface GrowthRowV162 {
  key: string;
  subject: string;
  basis: string;
  valueText: string;
}

/** One policy/outlook statement: a document line or a local-survey finding. */
interface PolicyRowV162 {
  key: string;
  name: string;
  content: string;
  timeText: string;
  url: string;
}

interface PlanModelV162 {
  capacity: PlanItem[];
  demand: PlanItem[];
  reShare: PlanItem[];
  emissions: PlanItem[];
  trade: PlanItem[];
  assumptions: { name: string; valueText: string }[];
  growthRows: GrowthRowV162[];
  prices: PriceRow[];
  policyRows: PolicyRowV162[];
  planDocument: string;
  planUrl: string;
  agencyText: string;
  scenarioText: string;
  total: number;
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

function buildLegacyModelV162(entities: VietnamEntityV124[]): PlanModelV162 {
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
  const assumptions = rows
    .filter((row) => /GDP 성장률 가정/u.test(row.name))
    .map((row) => ({ name: row.name, valueText: `${row.valueText}%` }));
  const growth = rows.filter((row) => row.indicatorId === GROWTH_FAMILY || /CAGR|증가율/u.test(row.name));
  const growthRows: GrowthRowV162[] = growth
    .filter((row) => row.value !== null)
    .map((row) => {
      const basis = row.note.split(/\s*기준\s*2030/u)[0];
      const bound = basis.match(/\((하한|상한)\)\s*$/u)?.[1];
      const subject = bound ? basis.replace(/\((하한|상한)\)\s*$/u, "") : "계산 대상 미기재";
      return { key: row.recordId, subject, basis: bound ? `두 시점의 ${bound}값` : "미기재", valueText: `${row.value}%` };
    });
  const agency = rows.filter((row) => row.indicatorId === AGENCY_FAMILY);
  const agencyOf = (pattern: RegExp) => agency.find((row) => pattern.test(row.name))?.valueText || "";
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
  const policyRows: PolicyRowV162[] = [...regulations, ...textPolicy].map((row) => ({
    key: row.recordId,
    name: row.name,
    content: row.valueText || row.note || "—",
    timeText: row.timeText || "—",
    url: row.url,
  }));
  const planDocument = rows.map((row) => row.document).find((document) => document && /768/u.test(document)) || "Quyết định 768/QĐ-TTg";
  const planUrl = rows.find((row) => /768-ttg/u.test(row.url))?.url || "";
  return {
    capacity,
    demand,
    reShare,
    emissions,
    trade,
    assumptions,
    growthRows,
    prices,
    policyRows,
    planDocument,
    planUrl,
    agencyText: agencyOf(/기관/u),
    scenarioText: agencyOf(/시나리오/u),
    total: rows.length,
  };
}

function wideNumber(text: string | null): number | null {
  if (text === null) return null;
  const value = Number(text.replace(/,/gu, ""));
  return Number.isFinite(value) ? value : null;
}

/** A "하한/상한" (or a single point value) group under one block, read by its stated Korean base name. */
function wideRange(record: WideRecordV162, block: string, base: string, unitSuffix: string): { min: number; max: number } | null {
  const low = wideNumber(record.get(block, `${base} 하한${unitSuffix}`));
  const high = wideNumber(record.get(block, `${base} 상한${unitSuffix}`));
  if (low !== null && high !== null) return { min: Math.min(low, high), max: Math.max(low, high) };
  const point = wideNumber(record.get(block, `${base}${unitSuffix}`));
  return point !== null ? { min: point, max: point } : null;
}

/** A parenthetical that carries no Korean is the source's own-language term, not a screen label. */
function stripForeignParensV162(text: string): string {
  return text
    .replace(/\(([^()]*)\)/gu, (whole, inner: string) => (/[가-힣]/u.test(inner) ? whole : ""))
    .replace(/\s+/gu, " ")
    .trim();
}

const DEMAND_NAME_SUFFIX_V162 = /,\s*\d{4}년\s*수요\s*전망\s*$/u;
const GOAL_NAME_SUFFIX_V162 = /,\s*\d{4}년\s*목표\s*$/u;
const GROWTH_NAME_PREFIX_V162 = /^\d{4}→\d{4}\s*연평균\s*증가율,\s*/u;

function wideCapacityItems(records: WideRecordV162[]): PlanItem[] {
  const items = new Map<string, PlanItem>();
  records.forEach((record) => {
    const label = record.get("설비", "전원 (국문)");
    const yearText = record.get("설비", "대상 연도 (년)");
    const year = yearText ? Number(yearText) : NaN;
    if (!label || !Number.isFinite(year)) return;
    const range = wideRange(record, "설비", "설비용량", " (MW)");
    if (!range) return;
    const note = record.get("설비", "조건·비고") || "";
    const item = items.get(label) || { label, unit: "MW", byYear: new Map(), note };
    item.byYear.set(year, range);
    if (note) item.note = note;
    items.set(label, item);
  });
  return [...items.values()];
}

function wideDemandItems(records: WideRecordV162[]): PlanItem[] {
  const items = new Map<string, PlanItem>();
  records.forEach((record) => {
    const yearText = record.get("수요", "대상 연도 (년)");
    const year = yearText ? Number(yearText) : NaN;
    if (!Number.isFinite(year)) return;
    const label = stripForeignParensV162(record.name).replace(DEMAND_NAME_SUFFIX_V162, "").trim();
    if (!label) return;
    const isPeak = /최대전력|피크/u.test(label);
    const range = isPeak ? wideRange(record, "피크", "최대전력", " (MW)") : wideRange(record, "수요", "전력수요", "");
    if (!range) return;
    const unit = isPeak ? "MW" : record.get("수요", "전력수요 단위") || "";
    const item = items.get(label) || { label, unit, byYear: new Map(), note: "" };
    item.byYear.set(year, range);
    items.set(label, item);
  });
  return [...items.values()];
}

function wideReShareItems(records: WideRecordV162[]): PlanItem[] {
  const items = new Map<string, PlanItem>();
  records.forEach((record) => {
    const goalType = record.get("목표", "목표 유형");
    if (!goalType || !/재생에너지/u.test(goalType)) return;
    const yearText = record.get("목표", "대상 연도 (년)");
    const year = yearText ? Number(yearText) : NaN;
    const range = wideRange(record, "목표", "목표값", " (%)");
    if (!range || !Number.isFinite(year)) return;
    const label = stripForeignParensV162(record.name).replace(GOAL_NAME_SUFFIX_V162, "").trim() || goalType;
    const item = items.get(label) || { label, unit: "%", byYear: new Map(), note: "" };
    item.byYear.set(year, range);
    items.set(label, item);
  });
  return [...items.values()];
}

function wideGrowthRows(records: WideRecordV162[]): GrowthRowV162[] {
  const rows: GrowthRowV162[] = [];
  records.forEach((record) => {
    const low = wideNumber(record.get("성장률", "CAGR 하한 (%/년)"));
    const high = wideNumber(record.get("성장률", "CAGR 상한 (%/년)"));
    if (low === null || high === null) return;
    const basis = record.get("성장률", "산출 기준") || "미기재";
    const subject = stripForeignParensV162(record.name).replace(GROWTH_NAME_PREFIX_V162, "").trim() || "계산 대상 미기재";
    // The delivered bound labels do not guarantee 하한 <= 상한 (a lower
    // starting value can compound to a higher rate over the same 20 years).
    const range = { min: Math.min(low, high), max: Math.max(low, high) };
    rows.push({ key: record.entity.recordId, subject, basis, valueText: `${formatRangeV141(range, 2)}%/년` });
  });
  return rows;
}

function widePolicyRows(records: WideRecordV162[]): PolicyRowV162[] {
  const rows: PolicyRowV162[] = [];
  records.forEach((record) => {
    const outlookName = record.get("전망", "문서·항목명");
    if (outlookName) {
      const timeText = record.get("전망", "연도 (년)") || record.get("계획", "발행일") || record.get("계획", "계획 기간") || "—";
      rows.push({
        key: `${record.entity.recordId}-전망`,
        name: outlookName,
        content: record.get("전망", "값·내용") || "—",
        timeText,
        url: record.source.url || record.source.pageUrl || "",
      });
      return;
    }
    const surveyItem = record.get("현지조사", "항목");
    if (surveyItem) {
      const content = [
        record.get("현지조사", "2030 용량 목표"),
        record.get("현지조사", "2050 비전 목표"),
        record.get("현지조사", "이행 현황·병목"),
      ]
        .filter(Boolean)
        .join(" · ");
      rows.push({
        key: `${record.entity.recordId}-현지조사`,
        name: `현장 확인 · ${surveyItem}`,
        content: content || "—",
        timeText: "—",
        url: record.source.url || record.source.pageUrl || "",
      });
    }
  });
  return rows;
}

function buildWideModelV162(records: WideRecordV162[]): PlanModelV162 {
  const capacity = wideCapacityItems(records);
  const demand = wideDemandItems(records);
  const reShare = wideReShareItems(records);
  const growthRows = wideGrowthRows(records);
  const policyRows = widePolicyRows(records);
  const planRecord = records.find((record) => {
    const document = record.get("계획", "계획 문서명");
    return document !== null && /768/u.test(document);
  });
  const planDocument = (planRecord && planRecord.get("계획", "계획 문서명")) || "Quyết định 768/QĐ-TTg";
  const planUrl = records.find((record) => record.get("설비", "전원 (국문)") !== null)?.source.url || "";
  return {
    capacity,
    demand,
    reShare,
    emissions: [],
    trade: [],
    assumptions: [],
    growthRows,
    prices: [],
    policyRows,
    planDocument,
    planUrl,
    agencyText: (planRecord && planRecord.get("계획", "수립 기관")) || "",
    scenarioText: (planRecord && planRecord.get("계획", "시나리오·케이스")) || "",
    total: records.length,
  };
}

export default function EnergyOutlookPlanAnalysisV141({ entities, initialYear }: Props) {
  const [year, setYear] = useState<PlanYear>(initialYear === 2050 ? 2050 : 2030);
  const wideRecords = useMemo(() => wideRecordsOfEntitiesV162(entities), [entities]);
  const model = useMemo(
    () => (wideRecords.length > 0 ? buildWideModelV162(wideRecords) : buildLegacyModelV162(entities)),
    [wideRecords, entities]
  );

  if (!model.total) return null;

  const capacityAtYear = model.capacity
    .filter((item) => item.byYear.has(year))
    .map((item) => ({ ...item, range: item.byYear.get(year)! }))
    .sort((a, b) => b.range.max - a.range.max);
  const parts = capacityAtYear.filter((item) => !/^총 설비/u.test(item.label));
  const scaleMax = Math.max(...parts.map((item) => item.range.max), 1);
  const priceKinds: PriceRow["kind"][] = ["소매가격", "발전가격 상한(기술별)", "수입전력 상한"];

  return (
    <section className="pps132 eop141" data-testid="energy-outlook-plan-v141" data-source-rows={model.total}>
      <header className="pps132-heading">
        <span>주 분석</span>
        <h4><PublicTermTextV134 text="개정 PDP8의 전원별 설비 계획과 수요 전망" /></h4>
        <p>
          <PublicTermTextV134 text={`${model.planDocument}(개정 전력개발계획 PDP8, 2025) · 전망 기관 ${model.agencyText || "베트남 총리"} · ${model.scenarioText || "단일 계획, 하한–상한 범위 제시"}. 두 시점(2030·2050)의 계획값을 하한~상한으로 비교하며, 연도 사이를 추세로 잇지 않습니다.`} />
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
                ...model.assumptions.map((row) => `${row.name} ${row.valueText}`),
              ].filter(Boolean).join(" · ")}
            />
          </p>
        )}
        {model.growthRows.length > 0 && (
          <div className="pps132-table-wrap" data-analysis-block="table" data-testid="energy-outlook-derived-growth-v142">
            <table>
              <caption>2030–2050년 연평균 증가율 · 계획값으로 자체 계산</caption>
              <thead><tr><th scope="col">계산 대상</th><th scope="col">계산에 사용한 범위</th><th scope="col">연평균 증가율</th></tr></thead>
              <tbody>{model.growthRows.map((row) => (
                <tr key={row.key}><th scope="row">{row.subject}</th><td>{row.basis}</td><td>{row.valueText}</td></tr>
              ))}</tbody>
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

      {model.policyRows.length > 0 && (
        <section className="pps132-distribution pps132-distribution--table" data-analysis-block="comparison-table" data-testid="energy-outlook-regulations-v141">
          <h5>제도 문서·시장 공표 · {model.policyRows.length}건</h5>
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
                {model.policyRows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row"><PublicTermTextV134 text={row.name} /></th>
                    <td><PublicTermTextV134 text={row.content} /></td>
                    <td>{row.timeText}</td>
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
