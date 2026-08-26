import { useEffect, useMemo, useState } from "react";
import { loadCountries } from "../../data/countries";
import { loadSolarPotentialDataset } from "../../data/potential/solarPotential";
import type { Country } from "../../types/country";
import type {
  SolarIndicatorId,
  SolarPotentialCountryRecord,
  SolarPotentialDataset,
  SolarPotentialStatistics,
} from "../../types/solar";
import "../../styles/solar-potential-v26.css";

interface SolarPotentialPreviewProps {
  indicatorId: SolarIndicatorId;
  initialCountryIso3?: string | null;
}

const MONTH_LABELS: Array<{
  id: keyof SolarPotentialCountryRecord["monthlyPvoutDailyKwhKwp"];
  label: string;
}> = [
  { id: "jan", label: "1월" },
  { id: "feb", label: "2월" },
  { id: "mar", label: "3월" },
  { id: "apr", label: "4월" },
  { id: "may", label: "5월" },
  { id: "jun", label: "6월" },
  { id: "jul", label: "7월" },
  { id: "aug", label: "8월" },
  { id: "sep", label: "9월" },
  { id: "oct", label: "10월" },
  { id: "nov", label: "11월" },
  { id: "dec", label: "12월" },
];

function getValue(
  record: SolarPotentialCountryRecord,
  indicatorId: SolarIndicatorId
): number | null {
  return indicatorId === "solar-pvout"
    ? record.pvoutLevel1DailyKwhKwp
    : record.ghiDailyKwhM2;
}

function getUnit(indicatorId: SolarIndicatorId): string {
  return indicatorId === "solar-pvout" ? "kWh/kWp/day" : "kWh/m²/day";
}

function getTitle(indicatorId: SolarIndicatorId): string {
  return indicatorId === "solar-pvout"
    ? "태양광 발전 잠재량(PVOUT)"
    : "수평면 전일사량(GHI)";
}

function getStats(
  record: SolarPotentialCountryRecord,
  indicatorId: SolarIndicatorId
): SolarPotentialStatistics {
  return indicatorId === "solar-pvout"
    ? record.pvoutDistributionDailyKwhKwp
    : record.ghiDistributionDailyKwhM2;
}

function formatValue(value: number | null, unit: string): string {
  return value === null ? "자료 없음" : `${value.toFixed(2)} ${unit}`;
}

export default function SolarPotentialPreview({
  indicatorId,
  initialCountryIso3 = null,
}: SolarPotentialPreviewProps) {
  const [dataset, setDataset] = useState<SolarPotentialDataset | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedIso3, setSelectedIso3] = useState(initialCountryIso3 ?? "VNM");
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [solarResult, countryResult] = await Promise.all([
        loadSolarPotentialDataset(),
        loadCountries(),
      ]);

      if (cancelled) return;

      setDataset(solarResult);
      setCountries(countryResult.countries);
      setWarning(countryResult.warning ?? null);
      setLoading(false);
    }

    void load().catch((error: unknown) => {
      if (cancelled) return;
      setWarning(
        error instanceof Error
          ? error.message
          : "태양광 잠재력 미리보기 로딩 실패"
      );
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const countryNameIndex = useMemo(
    () => new Map(countries.map((country) => [country.iso3, country.nameKo])),
    [countries]
  );

  const records = dataset?.data ?? [];
  const availableRecords = useMemo(
    () =>
      records
        .filter((record) => getValue(record, indicatorId) !== null)
        .sort((a, b) =>
          (countryNameIndex.get(a.iso3) ?? a.countryName).localeCompare(
            countryNameIndex.get(b.iso3) ?? b.countryName,
            "ko"
          )
        ),
    [countryNameIndex, indicatorId, records]
  );

  useEffect(() => {
    if (availableRecords.length === 0) return;
    if (
      !initialCountryIso3 &&
      !availableRecords.some((record) => record.iso3 === selectedIso3)
    ) {
      setSelectedIso3(
        availableRecords.some((record) => record.iso3 === "VNM")
          ? "VNM"
          : availableRecords[0].iso3
      );
    }
  }, [availableRecords, selectedIso3, initialCountryIso3]);

  const selectedRecord =
    availableRecords.find((record) => record.iso3 === selectedIso3) ?? null;
  const selectedValue = selectedRecord
    ? getValue(selectedRecord, indicatorId)
    : null;
  const selectedStats = selectedRecord
    ? getStats(selectedRecord, indicatorId)
    : null;
  const unit = getUnit(indicatorId);

  const topRecords = useMemo(
    () =>
      [...availableRecords]
        .sort(
          (a, b) =>
            (getValue(b, indicatorId) ?? -Infinity) -
            (getValue(a, indicatorId) ?? -Infinity)
        )
        .slice(0, 10),
    [availableRecords, indicatorId]
  );

  const monthlyValues = selectedRecord
    ? MONTH_LABELS.map((month) => ({
        label: month.label,
        value: selectedRecord.monthlyPvoutDailyKwhKwp[month.id],
      }))
    : [];
  const monthlyMax = Math.max(
    1,
    ...monthlyValues.map((item) => item.value ?? 0)
  );

  if (loading) {
    return <p role="status">태양광 잠재력 데이터 로딩 중</p>;
  }

  return (
    <div className="solar-preview-v26">
      {warning && <div className="detail-preview-warning">{warning}</div>}

      <div className="solar-preview-heading">
        <div>
          <span>국가별 기술 잠재력</span>
          <h2>{getTitle(indicatorId)}</h2>
          <p>장기 평균 · Global PV Potential Study · 연구 공개 2020</p>
        </div>
        <label>
          <span>국가</span>
          <select
            value={selectedIso3}
            onChange={(event) => setSelectedIso3(event.target.value)}
          >
            {availableRecords.map((record) => (
              <option key={record.iso3} value={record.iso3}>
                {countryNameIndex.get(record.iso3) ?? record.countryName} ·{" "}
                {record.iso3}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedRecord && (
        <>
          <section className="solar-preview-summary">
            <article>
              <span>{getTitle(indicatorId)}</span>
              <strong>{formatValue(selectedValue, unit)}</strong>
              <small>
                {countryNameIndex.get(selectedRecord.iso3) ??
                  selectedRecord.countryName}
              </small>
            </article>
            <article>
              <span>국가 중간값</span>
              <strong>
                {formatValue(selectedStats?.median ?? null, unit)}
              </strong>
              <small>국가 내부 분포 중앙값</small>
            </article>
            <article>
              <span>상위 25% 지점</span>
              <strong>{formatValue(selectedStats?.p75 ?? null, unit)}</strong>
              <small>국가 내 상대적으로 우수한 지역 참고</small>
            </article>
            <article>
              <span>계절성 지수</span>
              <strong>
                {selectedRecord.seasonalityIndex === null
                  ? "자료 없음"
                  : selectedRecord.seasonalityIndex.toFixed(2)}
              </strong>
              <small>월별 최고·최저 PVOUT 비율</small>
            </article>
          </section>

          {indicatorId === "solar-pvout" && (
            <section className="solar-monthly-section">
              <div>
                <h3>월별 PVOUT</h3>
                <p>장기 월평균 · 계절 변동 확인</p>
              </div>
              <div className="solar-monthly-chart">
                {monthlyValues.map((item) => (
                  <div key={item.label} className="solar-monthly-column">
                    <span>
                      {item.value === null ? "-" : item.value.toFixed(2)}
                    </span>
                    <i
                      style={{
                        height: `${Math.max(
                          2,
                          ((item.value ?? 0) / monthlyMax) * 100
                        )}%`,
                      }}
                    />
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="solar-top-countries">
            <div>
              <h3>국가별 상위 10개</h3>
              <p>{getTitle(indicatorId)} 원값 기준</p>
            </div>
            <div className="resource-table-wrapper">
              <table className="resource-table">
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>국가</th>
                    <th>ISO3</th>
                    <th>{getTitle(indicatorId)}</th>
                  </tr>
                </thead>
                <tbody>
                  {topRecords.map((record, index) => (
                    <tr key={record.iso3}>
                      <td>{index + 1}</td>
                      <td>
                        {countryNameIndex.get(record.iso3) ??
                          record.countryName}
                      </td>
                      <td>{record.iso3}</td>
                      <td>
                        {formatValue(getValue(record, indicatorId), unit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="solar-preview-note">
            <strong>해석 유의</strong>
            <span>
              국가 평균 장기값 · 사업 타당성 판단에는
              부지·계통·인허가·비용·현장조사 추가 필요
            </span>
          </div>
        </>
      )}
    </div>
  );
}
