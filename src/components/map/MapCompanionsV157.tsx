import { useState } from "react";

import companionsContract from "../../data/map/mapCompanionsV157.json";
import { PublicTermTextV134 } from "../help/PublicTermV134";
import { formatPublicNumberV126 } from "../../data/visualization/publicNumberFormatV126";
import "./map-companions-v157.css";

/**
 * V157 4단계: the datasets that travel with a layer because they cannot be mapped.
 *
 * Twelve of the review's 72 map targets state no region, so they are not drawn -
 * but the reader looking at the layer next to them is exactly the reader they are
 * for. Each card says what the dataset is, its latest national value as the source
 * states it, and links to its detail page. A dataset whose source carries no number
 * says so; nothing is filled in.
 *
 * The section shows the primary companion and up to two others, with the rest behind
 * "더 보기", so it never pushes the map's own answer off the panel.
 */
interface CompanionHeadlineV157 {
  /** What the number is, in the source's own words. */
  indicatorLabel?: string;
  value: number | null;
  unit?: string;
  period?: string;
  source?: string;
  sourceUrl?: string;
  otherIndicatorCount?: number;
  reason?: string | null;
}

interface CompanionV157 {
  elementId: string;
  publicName: string;
  role: "primary" | "secondary";
  form: string;
  note: string;
  matchOn?: string;
  quotationOnly?: boolean;
  status: string;
  statusReason: string;
  headline: CompanionHeadlineV157;
  detailUrl: string;
  recordCount: number;
  observationCount: number;
}

const CONTRACT_V157 = companionsContract as {
  layers: { elementId: string; companions: CompanionV157[] }[];
};

const COMPANIONS_BY_LAYER_V157 = new Map(
  CONTRACT_V157.layers.map((row) => [row.elementId, row.companions])
);

export function mapCompanionsForLayerV157(elementId: string): CompanionV157[] {
  return COMPANIONS_BY_LAYER_V157.get(elementId) ?? [];
}

/** Every element that appears as a companion somewhere, for the QA's coverage check. */
export function mapCompanionElementIdsV157(): string[] {
  return [
    ...new Set(CONTRACT_V157.layers.flatMap((row) => row.companions.map((item) => item.elementId))),
  ].sort();
}

function headlineTextV157(headline: CompanionHeadlineV157): string {
  if (headline.value === null || headline.value === undefined) return "원천 미제공";
  const unit = headline.unit ? ` ${headline.unit}` : "";
  return `${formatPublicNumberV126(headline.value, headline.unit || "")}${unit}`;
}

export default function MapCompanionsV157({
  elementId,
  layerTitle,
}: {
  elementId: string;
  layerTitle: string;
}) {
  const companions = mapCompanionsForLayerV157(elementId);
  const [expanded, setExpanded] = useState(false);
  if (companions.length === 0) return null;
  const shown = expanded ? companions : companions.slice(0, 3);
  return (
    <section
      className="mc157"
      data-testid="map-companions-v157"
      data-element-id={elementId}
      data-companion-count={companions.length}
    >
      <h3 className="mc157__title">연관 데이터</h3>
      <p className="mc157__lead">
        <PublicTermTextV134
          text={`${layerTitle}와 함께 보는 자료입니다. 지역 정보가 없어 지도에는 올리지 않고 값만 보여 줍니다.`}
        />
      </p>
      <ul className="mc157__list">
        {shown.map((companion) => (
          <li key={companion.elementId} data-companion-element={companion.elementId}>
            <p className="mc157__name">
              <PublicTermTextV134 text={companion.publicName} />
              {companion.role === "secondary" && <span className="mc157__role">부</span>}
            </p>
            <p className="mc157__value">
              {companion.headline.indicatorLabel ? (
                <span className="mc157__measure">
                  <PublicTermTextV134 text={companion.headline.indicatorLabel} />
                </span>
              ) : null}
              <strong data-testid="map-companion-value-v157">
                {headlineTextV157(companion.headline)}
              </strong>
              {companion.headline.period ? (
                <span className="mc157__period">{companion.headline.period}</span>
              ) : null}
            </p>
            <p className="mc157__note">
              <PublicTermTextV134
                text={
                  companion.headline.value === null
                    ? companion.headline.reason || companion.statusReason
                    : companion.note
                }
              />
            </p>
            {companion.headline.source && (
              <p className="mc157__source">
                <PublicTermTextV134 text={companion.headline.source} />
              </p>
            )}
            <a className="mc157__link" href={companion.detailUrl}>
              상세보기
            </a>
          </li>
        ))}
      </ul>
      {companions.length > 3 && (
        <button
          type="button"
          className="cdp-button cdp-button--secondary cdp-button--compact"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
        >
          {expanded ? "접기" : `더 보기 (${companions.length - 3}개)`}
        </button>
      )}
    </section>
  );
}
