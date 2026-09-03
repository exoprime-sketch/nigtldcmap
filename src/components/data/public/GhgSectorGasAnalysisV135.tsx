import { useId, useMemo } from "react";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import { formatPublicNumberV126 } from "../../../data/visualization/publicNumberFormatV126";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./ghg-sector-gas-analysis-v135.css";

interface Props {
  elementId: string;
  rows: SemanticObservationV125[];
}

const SECTOR_ORDER_V135 = ["energy", "ippu", "afolu", "waste"] as const;
const GAS_ORDER_V135 = ["co2", "ch4", "n2o", "hfcs"] as const;

type SectorKeyV135 = (typeof SECTOR_ORDER_V135)[number];
type GasKeyV135 = (typeof GAS_ORDER_V135)[number];

const SECTOR_LABELS_V135: Record<SectorKeyV135, string> = {
  energy: "에너지",
  ippu: "산업공정·제품사용",
  afolu: "농업·임업·기타토지이용",
  waste: "폐기물",
};

const GAS_LABELS_V135: Record<GasKeyV135, string> = {
  co2: "CO₂",
  ch4: "CH₄",
  n2o: "N₂O",
  hfcs: "HFCs",
};

/**
 * Categorical hues carry gas identity only. Emission direction is encoded by
 * position against the zero line, never by hue, so removals stay readable for
 * colour-vision-deficient users. Validated for CVD separation (worst adjacent
 * pair delta-E 9.4) against the public chart surface.
 */
const GAS_COLORS_V135: Record<GasKeyV135, string> = {
  co2: "#08805c",
  ch4: "#d97706",
  n2o: "#2563a6",
  hfcs: "#a23e63",
};

const SECTOR_GAS_PATTERN_V135 =
  /_sector_gas_ghg_(energy|ippu|afolu|waste)_(co2|ch4|n2o|hfcs)$/u;

type SectorGasCellV135 = {
  gas: GasKeyV135;
  sector: SectorKeyV135;
  value: number;
};

type SectorRowV135 = {
  key: SectorKeyV135;
  label: string;
  negative: SectorGasCellV135[];
  negativeTotal: number;
  net: number;
  positive: SectorGasCellV135[];
  positiveTotal: number;
};

function readSectorGasCellV135(
  row: SemanticObservationV125
): SectorGasCellV135 | null {
  const match = String(row.indicatorId || "").match(SECTOR_GAS_PATTERN_V135);
  if (!match) return null;
  if (typeof row.value !== "number" || !Number.isFinite(row.value)) return null;
  return {
    gas: match[2] as GasKeyV135,
    sector: match[1] as SectorKeyV135,
    value: row.value,
  };
}

export default function GhgSectorGasAnalysisV135({ elementId, rows }: Props) {
  const titleId = useId();

  const analysis = useMemo(() => {
    const cells = rows
      .map(readSectorGasCellV135)
      .filter((cell): cell is SectorGasCellV135 => cell !== null);
    if (cells.length === 0) return null;

    const sourceRow = rows.find((row) => readSectorGasCellV135(row) !== null);
    const unit =
      sourceRow?.semanticMeasure?.unit || sourceRow?.unit || "ktCO2e";
    const period = String(sourceRow?.year || sourceRow?.period || "");

    const sectors: SectorRowV135[] = SECTOR_ORDER_V135.map((sector) => {
      const sectorCells = cells.filter((cell) => cell.sector === sector);
      const positive = GAS_ORDER_V135.flatMap((gas) =>
        sectorCells.filter((cell) => cell.gas === gas && cell.value > 0)
      );
      const negative = GAS_ORDER_V135.flatMap((gas) =>
        sectorCells.filter((cell) => cell.gas === gas && cell.value < 0)
      );
      const positiveTotal = positive.reduce((sum, cell) => sum + cell.value, 0);
      const negativeTotal = negative.reduce((sum, cell) => sum + cell.value, 0);
      return {
        key: sector,
        label: SECTOR_LABELS_V135[sector],
        negative,
        negativeTotal,
        net: positiveTotal + negativeTotal,
        positive,
        positiveTotal,
      };
    }).filter((row) => row.positive.length > 0 || row.negative.length > 0);

    if (sectors.length === 0) return null;

    const gasTotals = GAS_ORDER_V135.map((gas) => ({
      gas,
      label: GAS_LABELS_V135[gas],
      value: cells
        .filter((cell) => cell.gas === gas)
        .reduce((sum, cell) => sum + cell.value, 0),
    })).filter((row) => row.value !== 0);

    const net = sectors.reduce((sum, row) => sum + row.net, 0);
    const largestEmittingSector = [...sectors].sort(
      (left, right) => right.positiveTotal - left.positiveTotal
    )[0];
    const principalGas = [...gasTotals].sort(
      (left, right) => right.value - left.value
    )[0];
    const activeGases = GAS_ORDER_V135.filter((gas) =>
      cells.some((cell) => cell.gas === gas)
    );

    return {
      activeGases,
      gasTotals,
      largestEmittingSector,
      net,
      period,
      principalGas,
      sectors,
      unit,
    };
  }, [rows]);

  if (!analysis) return null;

  const {
    activeGases,
    gasTotals,
    largestEmittingSector,
    net,
    period,
    principalGas,
    sectors,
    unit,
  } = analysis;

  const domainMinimum = Math.min(0, ...sectors.map((row) => row.negativeTotal));
  const domainMaximum = Math.max(0, ...sectors.map((row) => row.positiveTotal));
  const span = domainMaximum - domainMinimum || 1;

  const chartWidth = 720;
  const labelWidth = 176;
  const plotWidth = chartWidth - labelWidth - 104;
  const rowHeight = 46;
  const barHeight = 22;
  const chartHeight = sectors.length * rowHeight + 40;
  const zeroX = labelWidth + ((0 - domainMinimum) / span) * plotWidth;
  const scaleX = (value: number) => (value / span) * plotWidth;

  const gasMaximum = Math.max(...gasTotals.map((row) => Math.abs(row.value)), 1);

  return (
    <section
      className="ghg-sector-gas-v135"
      data-testid="ghg-sector-gas-analysis-v135"
      data-element-id={elementId}
      data-raw-matrix-primary="false"
      aria-labelledby={titleId}
    >
      <header className="ghg-sector-gas-v135__header">
        <h3 id={titleId}>{period ? `${period}년 ` : ""}부문별·가스별 배출량</h3>
        <p>
          어느 부문이 얼마나 배출하고 어떤 가스가 그 배출을 만드는지 함께
          확인합니다. 0선 왼쪽은 흡수량입니다.
        </p>
      </header>

      <dl className="ghg-sector-gas-v135__kpis" data-testid="ghg-kpi-strip-v135">
        <div>
          <dt>
            <PublicTermTextV134 text="순 GHG 배출량" />
          </dt>
          <dd>
            {formatPublicNumberV126(net, unit)}{" "}
            <small>
              <PublicTermTextV134 text={unit} />
            </small>
          </dd>
        </div>
        {largestEmittingSector && (
          <div>
            <dt>최대 배출 부문</dt>
            <dd>
              {largestEmittingSector.label}
              <small>
                {formatPublicNumberV126(
                  largestEmittingSector.positiveTotal,
                  unit
                )}{" "}
                <PublicTermTextV134 text={unit} />
              </small>
            </dd>
          </div>
        )}
        {principalGas && (
          <div>
            <dt>주요 가스</dt>
            <dd>
              <PublicTermTextV134 text={principalGas.label} />
              <small>
                {formatPublicNumberV126(principalGas.value, unit)}{" "}
                <PublicTermTextV134 text={unit} />
              </small>
            </dd>
          </div>
        )}
      </dl>

      <ul className="ghg-sector-gas-v135__legend" data-testid="ghg-legend-v135">
        {activeGases.map((gas) => (
          <li key={gas}>
            <i aria-hidden="true" style={{ background: GAS_COLORS_V135[gas] }} />
            <PublicTermTextV134 text={GAS_LABELS_V135[gas]} />
          </li>
        ))}
      </ul>

      <div className="ghg-sector-gas-v135__chart-scroll">
        <svg
          className="ghg-sector-gas-v135__chart"
          data-testid="ghg-sector-gas-chart-v135"
          role="img"
          aria-label={`부문별 가스별 배출량 발산형 누적 막대. 단위 ${unit}.`}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMinYMin meet"
        >
          <line
            className="ghg-sector-gas-v135__zero"
            x1={zeroX}
            x2={zeroX}
            y1={4}
            y2={sectors.length * rowHeight + 8}
          />
          {sectors.map((row, index) => {
            const y = index * rowHeight + 12;
            let positiveCursor = 0;
            let negativeCursor = 0;
            return (
              <g key={row.key}>
                <text
                  className="ghg-sector-gas-v135__row-label"
                  x={labelWidth - 12}
                  y={y + barHeight / 2 + 4}
                  textAnchor="end"
                >
                  {row.label}
                </text>
                {row.positive.map((cell) => {
                  const width = Math.max(scaleX(cell.value) - 2, 1);
                  const x = zeroX + scaleX(positiveCursor);
                  positiveCursor += cell.value;
                  return (
                    <rect
                      key={`${row.key}-${cell.gas}-pos`}
                      x={x}
                      y={y}
                      width={width}
                      height={barHeight}
                      rx={4}
                      fill={GAS_COLORS_V135[cell.gas]}
                    >
                      <title>
                        {`${row.label} · ${GAS_LABELS_V135[cell.gas]} ${formatPublicNumberV126(cell.value, unit)} ${unit}`}
                      </title>
                    </rect>
                  );
                })}
                {row.negative.map((cell) => {
                  const width = Math.max(scaleX(Math.abs(cell.value)) - 2, 1);
                  negativeCursor += Math.abs(cell.value);
                  const x = zeroX - scaleX(negativeCursor);
                  return (
                    <rect
                      key={`${row.key}-${cell.gas}-neg`}
                      x={x}
                      y={y}
                      width={width}
                      height={barHeight}
                      rx={4}
                      fill={GAS_COLORS_V135[cell.gas]}
                      opacity={0.55}
                    >
                      <title>
                        {`${row.label} · ${GAS_LABELS_V135[cell.gas]} 흡수 ${formatPublicNumberV126(Math.abs(cell.value), unit)} ${unit}`}
                      </title>
                    </rect>
                  );
                })}
                <text
                  className="ghg-sector-gas-v135__row-value"
                  x={zeroX + scaleX(row.positiveTotal) + 8}
                  y={y + barHeight / 2 + 4}
                >
                  {formatPublicNumberV126(row.net, unit)}
                </text>
              </g>
            );
          })}
          <text
            className="ghg-sector-gas-v135__axis-note"
            x={zeroX}
            y={sectors.length * rowHeight + 30}
            textAnchor="middle"
          >
            {`0 · 왼쪽 흡수량 / 오른쪽 배출량 (${unit})`}
          </text>
        </svg>
      </div>

      <section className="ghg-sector-gas-v135__secondary">
        <h4>가스별 배출구성</h4>
        <ul data-testid="ghg-gas-composition-v135">
          {gasTotals.map((row) => (
            <li key={row.gas}>
              <span className="ghg-sector-gas-v135__gas-label">
                <i
                  aria-hidden="true"
                  style={{ background: GAS_COLORS_V135[row.gas] }}
                />
                <PublicTermTextV134 text={row.label} />
              </span>
              <span className="ghg-sector-gas-v135__gas-track">
                <span
                  style={{
                    background: GAS_COLORS_V135[row.gas],
                    width: `${(Math.abs(row.value) / gasMaximum) * 100}%`,
                  }}
                />
              </span>
              <b>
                {formatPublicNumberV126(row.value, unit)}{" "}
                <PublicTermTextV134 text={unit} />
              </b>
            </li>
          ))}
        </ul>
      </section>

      <details className="ghg-sector-gas-v135__table">
        <summary>상세 배출량</summary>
        <div className="ghg-sector-gas-v135__table-scroll">
          <table>
            <caption>
              <PublicTermTextV134
                text={`${period ? `${period}년 ` : ""}부문별·가스별 배출량 (${unit})`}
              />
            </caption>
            <thead>
              <tr>
                <th scope="col">부문</th>
                {activeGases.map((gas) => (
                  <th key={gas} scope="col">
                    <PublicTermTextV134 text={GAS_LABELS_V135[gas]} />
                  </th>
                ))}
                <th scope="col">순배출</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  {activeGases.map((gas) => {
                    const cell = [...row.positive, ...row.negative].find(
                      (item) => item.gas === gas
                    );
                    return (
                      <td key={gas}>
                        {cell ? formatPublicNumberV126(cell.value, unit) : "—"}
                      </td>
                    );
                  })}
                  <td>{formatPublicNumberV126(row.net, unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
