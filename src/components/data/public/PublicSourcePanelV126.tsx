import type {
  VietnamEntityV124,
  VietnamIndicatorMetaV124,
  VietnamObservationV124,
} from "../../../data/vietnam/vietnamTypesV124";
import {
  publicSourceOrganizationV136_1,
  publicSourceUrlV126,
  publicTextV126,
} from "../../../data/visualization/publicFieldPolicyV126";
import {
  PublicTermExpandedTextV134,
  PublicTermTextV134,
} from "../../help/PublicTermV134";

interface Props {
  indicators: VietnamIndicatorMetaV124[];
  observations: VietnamObservationV124[];
  entities: VietnamEntityV124[];
  spatialUnit?: string;
  /** What the headline figure counted, moved here out of the KPI subtitle. */
  aggregationBasis?: string[];
}

export default function PublicSourcePanelV126({
  indicators,
  observations,
  entities,
  spatialUnit,
  aggregationBasis = [],
}: Props) {
  // Organisation names arrive with the compiler's note about which sheet column
  // varies per row - "(레코드별 상이 - attr_19 참조)". The names are real; the
  // notes were never meant for a reader.
  const organizations = uniquePublicValuesV126(
    [
      ...indicators.map((item) => item.sourceOrg),
      ...observations.map((item) => item.provenance.sourceOrg),
      ...entities.map((item) => item.provenance.sourceOrg),
    ].map((value) => publicSourceOrganizationV136_1(value))
  );
  const urls = Array.from(
    new Set(
      [
        ...indicators.map((item) => item.sourceUrl),
        ...observations.map((item) => item.provenance.sourceUrl),
        ...entities.map((item) => item.provenance.sourceUrl),
      ]
        .map((value) => publicSourceUrlV126(value))
        .filter((value): value is string => Boolean(value))
    )
  );
  const populatedYears = uniquePublicValuesV126(
    observations
      .filter(
        (item) =>
          item.value !== null && item.value !== undefined && item.value !== ""
      )
      .map((item) => item.year || item.period)
  );
  const years =
    populatedYears.length > 0
      ? populatedYears
      : uniquePublicValuesV126(indicators.map((item) => item.referenceYear));
  const units = uniquePublicValuesV126([
    ...indicators.map((item) => item.unit),
    ...observations.map((item) => item.unit),
  ]);
  const licenses = uniquePublicValuesV126([
    ...indicators.map((item) => item.licenseCode),
    // Attribution lines carry the same per-row sheet note as the organisation
    // names - "Source: 각 기관 공식 웹사이트 및 공개 보도 (레코드별 상이)".
    ...indicators.map((item) => publicSourceOrganizationV136_1(item.attributionText)),
  ]);

  return (
    <details
      className="pav126-source pav126-source--details-v135"
      data-testid="detail-metadata-v135"
    >
      <summary>자료정보</summary>
      <section
        className="pav126-source__content-v135"
        data-testid="public-source-panel"
      >
        <div className="pav126-section-heading">
          <span>자료정보</span>
          <h3>출처와 이용조건</h3>
        </div>
        <dl>
        <div>
          <dt>제공기관</dt>
          <dd>
            <PublicTermTextV134
              text={organizations.join(" · ") || "공개 자료에 기관명이 명시되지 않음"}
            />
          </dd>
        </div>
        <div>
          <dt>자료기간</dt>
          <dd>{summarizeYearsV126(years)}</dd>
        </div>
        <div>
          <dt>단위</dt>
          <dd>
            <PublicTermTextV134 text={units.join(" · ") || "미기재"} />
          </dd>
        </div>
        {spatialUnit && (
          <div>
            <dt>자료 범위</dt>
            <dd><PublicTermTextV134 text={publicSpatialUnitLabelV135(spatialUnit)} /></dd>
          </div>
        )}
        {aggregationBasis.length > 0 && (
          <div>
            <dt>산정기준</dt>
            <dd>
              <PublicTermTextV134 text={aggregationBasis.join(" · ")} />
            </dd>
          </div>
        )}
        {licenses.length > 0 && (
          <div>
            <dt>이용조건</dt>
            <dd>
              <PublicTermTextV134 text={licenses.join(" · ")} />
            </dd>
          </div>
        )}
        </dl>
        {urls.length > 0 && (
          <div className="pav126-source__links">
          {urls.slice(0, 4).map((url, index) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              <PublicTermExpandedTextV134
                text={`${organizations[index] || organizations[0] || "공식 원문"} 확인`}
              />
            </a>
          ))}
          </div>
        )}
      </section>
    </details>
  );
}

function publicSpatialUnitLabelV135(value: string): string {
  const labels: Record<string, string> = {
    nation: "국가",
    country: "국가",
    national: "국가",
    region: "권역",
    province: "성·시",
    adm1: "성·시",
    city: "도시",
    district: "시·군·구",
    facility: "시설",
    site: "지점",
    point: "지점",
  };
  return labels[value.trim().toLocaleLowerCase("en-US")] || value;
}

function uniquePublicValuesV126(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) =>
          value === null || value === undefined
            ? null
            : publicTextV126(String(value))
        )
        .filter((value): value is string => Boolean(value))
    )
  );
}

function summarizeYearsV126(values: string[]): string {
  const years = values
    .flatMap((value) => value.match(/(?:19|20|21)\d{2}/gu) || [])
    .map(Number)
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  if (years.length === 0) return values.slice(0, 8).join(" · ") || "미기재";
  const first = years[0];
  const last = years[years.length - 1];
  return first === last ? String(first) : `${first}~${last}`;
}
