import { PublicTermHelpV134 } from "../../help/PublicTermV134";
import { useMemo, useState } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { useRegionTextV162 } from "../../../data/geo/regionDisplayV162";
import {
  firstAttributeV162,
  regionSystemOfV162,
  rowsForPreReformViewV162,
} from "../../../data/geo/regionSystemV162";
import { formatValueV121 } from "../../../utils/vietnamActualV121";
import { publicRegionNameV138 } from "./PublicRegionScenarioSummaryV138";

export interface ProvinceRecordColumnV162 {
  key: string;
  label: string;
  numeric?: boolean;
}

export interface ProvinceRecordTableSpecV162 {
  /** The indicator whose rows are one value per province (and period). */
  indicatorId: string;
  /** A column that splits the rows into periods; one period is shown at a time. */
  periodKey?: string;
  periodLabel?: string;
  columns: ProvinceRecordColumnV162[];
  caption: string;
}

/**
 * V162: the province rows a delivery added beside an element's national view
 * (B-002 climate zones by province, B-024 rice area by province). They were
 * only in the download; this lists them as the source states them - the 63
 * pre-2025 provinces (rowsForPreReformViewV162), one period at a time, with
 * no value derived. The 34-unit rows stay in the download.
 */
export const PROVINCE_RECORD_TABLES_V162: Record<string, ProvinceRecordTableSpecV162> = {
  "B-002": {
    indicatorId: "B-002_koppen_adm1",
    periodKey: "기간",
    periodLabel: "기간",
    columns: [
      { key: "우세_기후대", label: "우세 기후대" },
      { key: "우세_기후대_점유율", label: "우세 기후대 점유율(%)", numeric: true },
      { key: "기후대_수", label: "기후대 수", numeric: true },
    ],
    caption: "성·시별 우세 기후대(쾨펜) · 개편 전 63개 성·시",
  },
  "B-024": {
    indicatorId: "B-024_irrigated_area_subnat",
    periodKey: "기준연도",
    periodLabel: "기준연도",
    columns: [{ key: "값", label: "벼 재배면적(ha, 관개면적 대용)", numeric: true }],
    caption: "성·시별 벼 재배면적(통계청, 관개면적 대용) · 개편 전 63개 성·시",
  },
};

const REGION_KEYS_V162 = ["지역명_현지어", "지역명_베트남어", "지역명", "지역명_로마자"];

export default function ProvinceRecordTableV162({ elementId, entities }: { elementId: string; entities: VietnamEntityV124[] }) {
  const spec = PROVINCE_RECORD_TABLES_V162[elementId];
  const regionText = useRegionTextV162(elementId);
  const rows = useMemo(
    () =>
      spec
        ? rowsForPreReformViewV162(entities).filter(
            (row) => row.indicatorId === spec.indicatorId && regionSystemOfV162(row) === "adm1-prev"
          )
        : [],
    [entities, spec]
  );
  const periods = useMemo(
    () =>
      spec?.periodKey
        ? [...new Set(rows.map((row) => String(row.normalizedAttributes?.[spec.periodKey!] ?? "").trim()).filter(Boolean))]
        : [],
    [rows, spec]
  );
  const [period, setPeriod] = useState<string>("");
  // The period control belongs to the opened table; a closed fold shows
  // only its summary line, never a control the reader cannot see.
  const [open, setOpen] = useState(false);
  const selected = period && periods.includes(period) ? period : periods[periods.length - 1] || "";
  if (!spec || rows.length === 0) return null;
  const shown = spec.periodKey
    ? rows.filter((row) => String(row.normalizedAttributes?.[spec.periodKey!] ?? "").trim() === selected)
    : rows;
  return (
    <details className="detail146 detail146-details" data-testid="province-record-table-v162" data-record-count={rows.length} onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}>
      <summary>
        성·시별 원자료 값 · {shown.length.toLocaleString("ko-KR")}개 성·시(개편 전){selected ? ` · ${selected}` : ""}
      </summary>
      {open && periods.length > 1 ? (
        <label className="detail146-select">
          {spec.periodLabel || "기간"}
          <select aria-label={`성·시 원자료 ${spec.periodLabel || "기간"}`} value={selected} onChange={(event) => setPeriod(event.target.value)}>
            {periods.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {/* A native option cannot hold a help button; it sits beside the control. */}
      {open && periods.length > 1 ? <PublicTermHelpV134 text={selected} /> : null}
      <div className="detail146-table">
        <table>
          <caption>{spec.caption}</caption>
          <thead>
            <tr>
              <th scope="col">성·시</th>
              {spec.columns.map((column) => (
                <th key={column.key} scope="col">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.recordId}>
                <th scope="row">{regionText(publicRegionNameV138(firstAttributeV162(row.normalizedAttributes, REGION_KEYS_V162) || row.name || ""))}</th>
                {spec.columns.map((column) => {
                  const value = row.normalizedAttributes?.[column.key];
                  return <td key={column.key}>{value === null || value === undefined || value === "" ? "미기재" : column.numeric ? formatValueV121(value) : String(value)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
