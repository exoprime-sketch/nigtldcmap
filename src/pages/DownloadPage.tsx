import { useEffect, useMemo, useRef, useState } from "react";
import {
  countryCatalogKeyV122,
  loadCatalogForCountrySelectionV122,
  loadCountryElementBundleV122,
  publicCountryDataErrorMessageV122,
} from "../data/countries/countryDataFacadeV122";
import {
  getCountryDataProviderByIdV122,
  getCountryDataProviderV122,
  listCountryDataProvidersV122,
} from "../data/countries/countryDataProviderRegistryV122";
import type { CountryCatalogItemV122 } from "../data/countries/countryDataTypesV122";
import { safePublicFilenamePartV122 } from "../data/countries/publicLabelsV122";
import type {
  VietnamEntityV121,
  VietnamIndicatorMetaV121,
  VietnamObservationV121,
} from "../data/vietnam/vietnamTypesV121";
import {
  downloadDateV121,
  entitiesToCsvV121,
  entityDisplayNameV121,
  formatValueForExportV121,
  normalizedSearchV121,
  observationsToCsvV121,
  technologyLabelV121,
  triggerTextDownloadV121,
} from "../utils/vietnamActualV121";
import "../styles/country-data-platform-v122.css";

interface DownloadPageProps {
  initialDatasetId: string | null;
  initialElementId?: string | null;
  initialCountryIso3?: string | null;
}

type PeriodMode = "all" | "year" | "range";
type OutputFormat = "CSV" | "JSON";

type PreparedDownload = {
  element: CountryCatalogItemV122;
  allowedMeta: VietnamIndicatorMetaV121[];
  metadataById: Map<string, VietnamIndicatorMetaV121>;
  observations: VietnamObservationV121[];
  entities: VietnamEntityV121[];
};

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value?.trim())))
  ).sort((a, b) => a.localeCompare(b, "ko"));
}

function canDownloadMeta(meta: VietnamIndicatorMetaV121): boolean {
  return (
    meta.redistributionAllowed === "가능" && meta.downloadAllowed === "가능"
  );
}

function entityYear(row: VietnamEntityV121): number | null {
  const attrs = row.normalizedAttributes || {};
  for (const key of [
    "referenceYear",
    "eventYear",
    "year",
    "approvalYear",
    "commissioningYear",
  ]) {
    const value = Number(attrs[key]);
    if (Number.isInteger(value)) return value;
  }
  const date = String(attrs.approvalDate || attrs.publicationDate || "");
  const match = date.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

function inPeriod(
  value: number | null | undefined,
  mode: PeriodMode,
  year: number,
  fromYear: number,
  toYear: number
): boolean {
  if (mode === "all") return true;
  if (value === null || value === undefined) return false;
  if (mode === "year") return value === year;
  return (
    value >= Math.min(fromYear, toYear) && value <= Math.max(fromYear, toYear)
  );
}

function publicProvenance(
  row: VietnamObservationV121 | VietnamEntityV121,
  meta?: VietnamIndicatorMetaV121
) {
  return {
    sourceOrganization: row.provenance.sourceOrg || meta?.sourceOrg || null,
    sourceUrl: row.provenance.sourceUrl || meta?.sourceUrl || null,
    citation: row.provenance.citationLocator || meta?.citationLocator || null,
    referenceYear: row.provenance.referenceYear || meta?.referenceYear || null,
    license: row.provenance.licenseCode || meta?.licenseCode || null,
    attribution: meta?.attributionText || null,
    sourceFile: row.provenance.sourceFileDecoded,
    sourceSheet: row.provenance.sourceSheet,
    sourceRow: row.provenance.sourceRow,
  };
}

function combinedCsv(items: PreparedDownload[]): string {
  const headers = [
    "country_iso3",
    "country_name",
    "data_name",
    "record_type",
    "indicator_name",
    "year",
    "value",
    "unit",
    "name",
    "attributes_json",
    "missing_reason_code",
    "note",
    "source_org",
    "source_url",
    "citation_locator",
    "license_code",
    "attribution_text",
    "source_file",
    "source_sheet",
    "source_row",
  ];
  const escape = (value: unknown) => {
    const text = formatValueForExportV121(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [headers.join(",")];
  items.forEach(({ element, observations, entities, metadataById }) => {
    observations.forEach((row) => {
      const meta = metadataById.get(row.indicatorId);
      const source = publicProvenance(row, meta);
      lines.push(
        [
          row.countryIso3 || element.countryIso3,
          element.countryNameKo,
          element.publicTitle,
          "observation",
          meta?.labelKo,
          row.year ?? row.period,
          row.value,
          row.unit || meta?.unit,
          null,
          null,
          row.missingReasonCode,
          row.note,
          source.sourceOrganization,
          source.sourceUrl,
          source.citation,
          source.license,
          source.attribution,
          source.sourceFile,
          source.sourceSheet,
          source.sourceRow,
        ]
          .map(escape)
          .join(",")
      );
    });
    entities.forEach((row) => {
      const meta = row.indicatorId
        ? metadataById.get(row.indicatorId)
        : undefined;
      const source = publicProvenance(row, meta);
      lines.push(
        [
          row.countryIso3 || element.countryIso3,
          element.countryNameKo,
          element.publicTitle,
          "entity",
          meta?.labelKo,
          entityYear(row),
          null,
          meta?.unit,
          entityDisplayNameV121(row),
          row.normalizedAttributes,
          row.missingReasonCode,
          row.note,
          source.sourceOrganization,
          source.sourceUrl,
          source.citation,
          source.license,
          source.attribution,
          source.sourceFile,
          source.sourceSheet,
          source.sourceRow,
        ]
          .map(escape)
          .join(",")
      );
    });
  });
  return `\uFEFF${lines.join("\n")}\n`;
}

function selectionKey(item: CountryCatalogItemV122): string {
  return countryCatalogKeyV122(item.providerId, item.elementId);
}

export default function DownloadPage({
  initialDatasetId: _initialDatasetId,
  initialElementId = null,
  initialCountryIso3 = null,
}: DownloadPageProps) {
  const providers = useMemo(() => listCountryDataProvidersV122(), []);
  const normalizedInitialCountry = initialCountryIso3?.toUpperCase() || "";
  const [countrySelection, setCountrySelection] = useState(
    getCountryDataProviderV122(normalizedInitialCountry)
      ? normalizedInitialCountry
      : "all"
  );
  const [catalog, setCatalog] = useState<CountryCatalogItemV122[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [group, setGroup] = useState("all");
  const [periodMode, setPeriodMode] = useState<PeriodMode>("all");
  const [year, setYear] = useState(new Date().getFullYear());
  const [fromYear, setFromYear] = useState(2000);
  const [toYear, setToYear] = useState(new Date().getFullYear());
  const [sourceOrganization, setSourceOrganization] = useState("all");
  const [technologyId, setTechnologyId] = useState("all");
  const [format, setFormat] = useState<OutputFormat>("CSV");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const initialSelectionAppliedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    void loadCatalogForCountrySelectionV122(countrySelection)
      .then((items) => {
        if (cancelled) return;
        const downloadable = items.filter((item) => item.hasDownloadableData);
        setCatalog(downloadable);
        setSelectedKeys((current) => {
          const allowed = new Set<string>(downloadable.map(selectionKey));
          return new Set<string>(
            (Array.from(current as Set<string>) as string[]).filter((key) =>
              allowed.has(key)
            )
          );
        });
        if (!initialSelectionAppliedRef.current && initialElementId) {
          const initialItem = downloadable.find(
            (item) =>
              item.elementId === initialElementId &&
              (!normalizedInitialCountry ||
                item.countryIso3 === normalizedInitialCountry)
          );
          if (initialItem)
            setSelectedKeys(new Set([selectionKey(initialItem)]));
          initialSelectionAppliedRef.current = true;
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          console.error("Download catalog load failed", reason);
          setError(
            publicCountryDataErrorMessageV122(
              reason,
              "다운로드할 데이터를 불러오지 못했습니다"
            )
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countrySelection, initialElementId, normalizedInitialCountry]);

  const groups = useMemo(
    () =>
      unique(
        catalog
          .filter(
            (item) => category === "all" || item.categoryCode === category
          )
          .map((item) => item.groupLabel)
      ),
    [catalog, category]
  );
  const sources = useMemo(
    () => unique(catalog.flatMap((item) => item.sourceOrganizations)),
    [catalog]
  );
  const technologies = useMemo(
    () => unique(catalog.flatMap((item) => item.technologyIds)),
    [catalog]
  );
  const years = useMemo(
    () =>
      unique(catalog.flatMap((item) => item.raw.referenceYears))
        .map(Number)
        .filter(Number.isInteger)
        .sort((a, b) => b - a),
    [catalog]
  );

  const filtered = useMemo(() => {
    const normalized = normalizedSearchV121(query);
    return catalog.filter((item) => {
      if (category !== "all" && item.categoryCode !== category) return false;
      if (group !== "all" && item.groupLabel !== group) return false;
      if (
        sourceOrganization !== "all" &&
        !item.sourceOrganizations.includes(sourceOrganization)
      ) {
        return false;
      }
      if (
        technologyId !== "all" &&
        !item.technologyIds.includes(technologyId)
      ) {
        return false;
      }
      if (!normalized) return true;
      return normalizedSearchV121(
        [
          item.publicTitle,
          item.publicDescription,
          item.countryNameKo,
          item.categoryLabel,
          item.sectionLabel,
          item.groupLabel,
          ...item.sourceOrganizations,
          ...item.technologyIds.map(technologyLabelV121),
        ].join(" ")
      ).includes(normalized);
    });
  }, [catalog, category, group, query, sourceOrganization, technologyId]);

  const selectedCatalog = useMemo(
    () => catalog.filter((item) => selectedKeys.has(selectionKey(item))),
    [catalog, selectedKeys]
  );
  const licenses = unique(
    selectedCatalog.flatMap((item) => item.raw.rights.licenses)
  );
  const attributions = unique(
    selectedCatalog.flatMap((item) => item.raw.rights.attributionTexts)
  );
  const sourceUrls = unique(selectedCatalog.flatMap((item) => item.sourceUrls));

  function toggleSelection(item: CountryCatalogItemV122): void {
    const key = selectionKey(item);
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function download(): Promise<void> {
    if (selectedCatalog.length === 0) {
      setError("다운로드할 데이터를 선택해 주세요");
      return;
    }
    setDownloading(true);
    setError("");
    try {
      const bundles = await Promise.all(
        selectedCatalog.map(async (element) => ({
          element,
          bundle: await loadCountryElementBundleV122(
            element.countryIso3,
            element.elementId
          ),
        }))
      );
      const prepared: PreparedDownload[] = bundles.map(
        ({ element, bundle }) => {
          const allowedMeta = bundle.meta.indicators.filter((meta) => {
            if (!canDownloadMeta(meta)) return false;
            if (
              sourceOrganization !== "all" &&
              meta.sourceOrg !== sourceOrganization
            ) {
              return false;
            }
            if (
              technologyId !== "all" &&
              !meta.technologyIds.includes(technologyId)
            ) {
              return false;
            }
            return true;
          });
          const metadataById = new Map<string, VietnamIndicatorMetaV121>(
            allowedMeta.map((meta) => [meta.indicatorId, meta])
          );
          const observations = bundle.observations.records.filter(
            (row) =>
              row.downloadEligible &&
              metadataById.has(row.indicatorId) &&
              inPeriod(row.year, periodMode, year, fromYear, toYear)
          );
          const entities = bundle.entities.records.filter((row) => {
            if (!row.downloadEligible) return false;
            const meta = row.indicatorId
              ? metadataById.get(row.indicatorId)
              : undefined;
            if (row.indicatorId && !meta) return false;
            const rowSource = meta?.sourceOrg || row.provenance.sourceOrg || "";
            if (
              sourceOrganization !== "all" &&
              rowSource !== sourceOrganization
            ) {
              return false;
            }
            if (
              technologyId !== "all" &&
              (!meta || !meta.technologyIds.includes(technologyId))
            ) {
              return false;
            }
            return inPeriod(
              entityYear(row),
              periodMode,
              year,
              fromYear,
              toYear
            );
          });
          return { element, allowedMeta, metadataById, observations, entities };
        }
      );

      const nonEmpty = prepared.filter(
        (item) => item.observations.length > 0 || item.entities.length > 0
      );
      if (nonEmpty.length === 0) {
        setError("선택한 조건에 맞는 다운로드 자료가 없습니다");
        return;
      }

      const date = downloadDateV121();
      const countryIso3s = unique(
        nonEmpty.map((item) => item.element.countryIso3)
      );
      const singleProvider =
        nonEmpty.length > 0
          ? getCountryDataProviderByIdV122(nonEmpty[0].element.providerId)
          : null;
      const countryPart =
        countryIso3s.length === 1 && singleProvider
          ? singleProvider.countryPublicSlug
          : "selected-countries";
      const dataPart =
        nonEmpty.length === 1
          ? safePublicFilenamePartV122(
              nonEmpty[0].element.publicSlug || nonEmpty[0].element.publicTitle
            )
          : "selected-data";
      const filename = `${countryPart}_${dataPart}_${date}`;

      if (format === "CSV") {
        let csv: string;
        if (
          nonEmpty.length === 1 &&
          nonEmpty[0].observations.length > 0 &&
          nonEmpty[0].entities.length === 0
        ) {
          csv = observationsToCsvV121(
            nonEmpty[0].observations,
            nonEmpty[0].metadataById,
            nonEmpty[0].element.publicTitle
          );
        } else if (
          nonEmpty.length === 1 &&
          nonEmpty[0].entities.length > 0 &&
          nonEmpty[0].observations.length === 0
        ) {
          csv = entitiesToCsvV121(
            nonEmpty[0].entities,
            nonEmpty[0].metadataById,
            nonEmpty[0].element.publicTitle
          );
        } else {
          csv = combinedCsv(nonEmpty);
        }
        triggerTextDownloadV121(
          `${filename}.csv`,
          csv,
          "text/csv;charset=utf-8"
        );
      } else {
        const countries = unique(
          nonEmpty.map(
            (item) =>
              `${item.element.countryIso3}|${item.element.countryNameKo}`
          )
        ).map((value) => {
          const [iso3, name] = value.split("|", 2);
          return { iso3, name };
        });
        const payload = {
          schemaVersion: "public-v1",
          countries,
          generatedAt: new Date().toISOString(),
          data: nonEmpty.map((item) => ({
            country: {
              iso3: item.element.countryIso3,
              name: item.element.countryNameKo,
            },
            dataName: item.element.publicTitle,
            indicators: item.allowedMeta.map((meta) => ({
              name: meta.labelKo,
              nameEn: meta.labelEn || null,
              unit: meta.unit || null,
              sourceOrganization: meta.sourceOrg,
              sourceUrl: meta.sourceUrl || null,
              referenceYear: meta.referenceYear || null,
              license: meta.licenseCode || null,
              attribution: meta.attributionText || null,
              limitations: meta.caveat || meta.missingNote || null,
            })),
            observations: item.observations.map((row) => {
              const meta = item.metadataById.get(row.indicatorId);
              return {
                indicatorName: meta?.labelKo || null,
                countryIso3: row.countryIso3,
                year: row.year ?? null,
                period: row.period ?? null,
                value: row.value,
                unit: row.unit || meta?.unit || null,
                missingReason: row.missingReasonCode || null,
                note: row.note || null,
                provenance: publicProvenance(row, meta),
              };
            }),
            entities: item.entities.map((row) => {
              const meta = row.indicatorId
                ? item.metadataById.get(row.indicatorId)
                : undefined;
              return {
                indicatorName: meta?.labelKo || null,
                countryIso3: row.countryIso3 || item.element.countryIso3,
                name: entityDisplayNameV121(row),
                latitude: row.latitude ?? null,
                longitude: row.longitude ?? null,
                geometryType: row.geometryType || null,
                crs: row.crs || null,
                attributes: row.normalizedAttributes,
                rawAttributes: row.rawAttributes,
                missingReason: row.missingReasonCode || null,
                note: row.note || null,
                provenance: publicProvenance(row, meta),
              };
            }),
          })),
        };
        triggerTextDownloadV121(
          `${filename}.json`,
          JSON.stringify(payload, null, 2),
          "application/json;charset=utf-8"
        );
      }
    } catch (reason) {
      console.error("Country data download failed", reason);
      setError(
        publicCountryDataErrorMessageV122(
          reason,
          "다운로드할 데이터를 불러오지 못했습니다"
        )
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="page-shell cdp-page">
      <section className="cdp-hero">
        <h1>데이터 다운로드</h1>
        <p>필요한 데이터를 선택해 CSV 또는 JSON으로 내려받을 수 있습니다</p>
      </section>

      {error && (
        <div className="cdp-alert cdp-alert--error" role="alert">
          <strong>{error}</strong>
        </div>
      )}

      <section className="cdp-panel cdp-step">
        <h2>1. 데이터 선택</h2>
        <div className="cdp-filter-grid cdp-filter-grid--primary">
          <label className="cdp-field cdp-field--wide">
            <span className="cdp-field__label">검색</span>
            <input
              className="cdp-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="데이터명, 기관명, 사업명 또는 지역명 검색"
            />
          </label>
          <label className="cdp-field">
            <span className="cdp-field__label">국가</span>
            <select
              className="cdp-select"
              value={countrySelection}
              onChange={(event) => {
                setCountrySelection(event.target.value);
                setSelectedKeys(new Set());
              }}
            >
              <option value="all">전체</option>
              {providers.map((provider) => (
                <option key={provider.countryIso3} value={provider.countryIso3}>
                  {provider.countryNameKo}
                </option>
              ))}
            </select>
          </label>
          <label className="cdp-field">
            <span className="cdp-field__label">대분류</span>
            <select
              className="cdp-select"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setGroup("all");
              }}
            >
              <option value="all">전체</option>
              {unique(catalog.map((item) => item.categoryCode)).map((code) => (
                <option key={code} value={code}>
                  {catalog.find((item) => item.categoryCode === code)
                    ?.categoryLabel || code}
                </option>
              ))}
            </select>
          </label>
          <label className="cdp-field">
            <span className="cdp-field__label">데이터 그룹</span>
            <select
              className="cdp-select"
              value={group}
              onChange={(event) => setGroup(event.target.value)}
            >
              <option value="all">전체</option>
              {groups.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="cdp-empty">다운로드 목록을 불러오는 중입니다</div>
        ) : (
          <div className="cdp-download-list">
            {filtered.map((item) => {
              const key = selectionKey(item);
              const selected = selectedKeys.has(key);
              return (
                <label
                  className={`cdp-download-item ${
                    selected ? "is-selected" : ""
                  }`}
                  key={key}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleSelection(item)}
                  />
                  <span>
                    <strong>{item.publicTitle}</strong>
                    <small>
                      {[
                        providers.length > 1 ? item.countryNameKo : null,
                        item.latestYear,
                        item.sourceOrganizations[0],
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </span>
                </label>
              );
            })}
            {filtered.length === 0 && (
              <div className="cdp-empty">조건에 맞는 데이터가 없습니다</div>
            )}
          </div>
        )}
      </section>

      <section className="cdp-panel cdp-step">
        <h2>2. 범위 선택</h2>
        <div className="cdp-filter-grid cdp-filter-grid--secondary">
          <label className="cdp-field">
            <span className="cdp-field__label">기간</span>
            <select
              className="cdp-select"
              value={periodMode}
              onChange={(event) =>
                setPeriodMode(event.target.value as PeriodMode)
              }
            >
              <option value="all">전체기간</option>
              <option value="year">특정연도</option>
              <option value="range">기간 지정</option>
            </select>
          </label>
          {periodMode === "year" && (
            <label className="cdp-field">
              <span className="cdp-field__label">자료연도</span>
              <select
                className="cdp-select"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
              >
                {(years.length > 0 ? years : [year]).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          )}
          {periodMode === "range" && (
            <>
              <label className="cdp-field">
                <span className="cdp-field__label">시작연도</span>
                <input
                  className="cdp-input"
                  type="number"
                  value={fromYear}
                  onChange={(event) => setFromYear(Number(event.target.value))}
                />
              </label>
              <label className="cdp-field">
                <span className="cdp-field__label">종료연도</span>
                <input
                  className="cdp-input"
                  type="number"
                  value={toYear}
                  onChange={(event) => setToYear(Number(event.target.value))}
                />
              </label>
            </>
          )}
          <label className="cdp-field">
            <span className="cdp-field__label">자료 제공기관</span>
            <select
              className="cdp-select"
              value={sourceOrganization}
              onChange={(event) => setSourceOrganization(event.target.value)}
            >
              <option value="all">전체</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>
          <label className="cdp-field">
            <span className="cdp-field__label">기후기술</span>
            <select
              className="cdp-select"
              value={technologyId}
              onChange={(event) => setTechnologyId(event.target.value)}
            >
              <option value="all">전체</option>
              {technologies.map((id) => (
                <option key={id} value={id}>
                  {technologyLabelV121(id)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="cdp-panel cdp-step">
        <h2>3. 형식과 출처</h2>
        <div className="cdp-filter-grid cdp-filter-grid--secondary">
          <label className="cdp-field">
            <span className="cdp-field__label">파일 형식</span>
            <select
              className="cdp-select"
              value={format}
              onChange={(event) =>
                setFormat(event.target.value as OutputFormat)
              }
            >
              <option value="CSV">CSV</option>
              <option value="JSON">JSON</option>
            </select>
          </label>
        </div>

        {selectedCatalog.length > 0 && (
          <div className="cdp-source-grid">
            {licenses.length > 0 && (
              <article>
                <h3>라이선스</h3>
                <p>{licenses.join(" · ")}</p>
              </article>
            )}
            {attributions.length > 0 && (
              <article>
                <h3>출처표시</h3>
                <ul>
                  {attributions.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              </article>
            )}
            {sourceUrls.length > 0 && (
              <article>
                <h3>공식 원자료</h3>
                <ul>
                  {sourceUrls.slice(0, 10).map((url) => (
                    <li key={url}>
                      <a href={url} target="_blank" rel="noreferrer">
                        원자료 확인
                      </a>
                    </li>
                  ))}
                </ul>
              </article>
            )}
          </div>
        )}

        <div className="cdp-download-footer">
          <span className="cdp-download-summary">
            {selectedCatalog.length > 0
              ? `${selectedCatalog.length.toLocaleString(
                  "ko-KR"
                )}개 데이터 선택`
              : "다운로드할 데이터를 선택해 주세요"}
          </span>
          <button
            type="button"
            className="cdp-button cdp-button--primary"
            disabled={downloading || selectedKeys.size === 0}
            onClick={() => void download()}
          >
            {downloading ? "파일을 만드는 중입니다" : "다운로드"}
          </button>
        </div>
      </section>
    </div>
  );
}
