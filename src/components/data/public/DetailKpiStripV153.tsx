import { useEffect, useMemo, useState } from "react";
import { loadCardSummariesV140 } from "../../../data/cardSummariesV140";
import type { CardSummaryV140 } from "../../../data/cardSummariesV140";
import type {
  VietnamEntityV124,
  VietnamObservationV124,
} from "../../../data/vietnam/vietnamTypesV124";
import { displayUnitV150 } from "../../../data/visualization/unitDisplayV150";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

/**
 * V153-D1: the small row of core figures under the hero - three or four
 * values, each with its unit and its basis. Nothing here is computed anew:
 * the leading figure is the card's verified headline (the same figure the
 * finder card shows and the analysis QA checks on the detail), the period is
 * the card's, and the counts are the loaded records as they are. A dataset
 * without values shows its status line and no figure.
 */
interface Props {
  elementId: string;
  observations: VietnamObservationV124[];
  entities: VietnamEntityV124[];
  /** Province series count one indicator per province; the family count is what a reader means by "지표". */
  indicatorFamilyCount: number;
}

export interface KpiTileV153 {
  key: string;
  value: string;
  unit: string;
  label: string;
}

/** "41 점" → "점", "41,350 MW" → "MW", "54건" → "건", "3.2%" → "%". */
export function trailingUnitV153(value: string): string {
  const text = String(value || "").trim();
  const match = text.match(/(?:\d[\d,.]*)\s*([^\d\s,.][^\d]*)$/u);
  return match ? match[1].trim() : "";
}

function isPopulatedObservation(row: VietnamObservationV124): boolean {
  if (row.value === null || row.value === undefined || row.value === "") return false;
  return typeof row.value !== "number" || Number.isFinite(row.value);
}

function isPopulatedEntity(row: VietnamEntityV124): boolean {
  if (typeof row.name === "string" && row.name.trim()) return true;
  return Object.values(row.normalizedAttributes || {}).some((value) => {
    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    return typeof value !== "number" || Number.isFinite(value);
  });
}

export function kpiTilesV153(
  card: CardSummaryV140 | null,
  observations: VietnamObservationV124[],
  entities: VietnamEntityV124[],
  indicatorFamilyCount: number
): KpiTileV153[] {
  if (!card || card.kind === "status") return [];
  const tiles: KpiTileV153[] = [];
  // The unit as the headline states it: the measure's unit when the headline
  // ends with it (long units carry digits of their own), else the trailing
  // token, else the measure's unit for a bare count.
  const statedUnit = [card.measure?.unit, card.preview?.unit]
    .map((unit) => displayUnitV150(unit || ""))
    .find((unit) => unit && card.headline.value.trim().endsWith(unit));
  const headlineUnit = statedUnit || trailingUnitV153(card.headline.value) || displayUnitV150(card.measure?.unit || card.preview?.unit || "");
  const headlineHasNumber = /\d/u.test(card.headline.value);
  if (headlineHasNumber && headlineUnit) {
    tiles.push({ key: "headline", value: card.headline.value, unit: headlineUnit, label: card.headline.label });
  }
  if (card.period && card.period !== "—" && /\d{4}/u.test(card.period)) {
    // A period stated as a date ("2026-08-10 기준") is a reference day, not years.
    const dated = !/년/u.test(card.period) && /\d{4}-\d{2}-\d{2}/u.test(card.period);
    tiles.push(dated
      ? { key: "period", value: `${card.period.match(/\d{4}-\d{2}-\d{2}/u)?.[0]} 기준일`, unit: "일", label: "자료 기준일" }
      : { key: "period", value: card.period, unit: "년", label: "자료기간" });
  }
  const populatedObservations = observations.filter(isPopulatedObservation).length;
  const populatedEntities = entities.filter(isPopulatedEntity).length;
  if (populatedObservations > 0) {
    tiles.push({ key: "observations", value: `${populatedObservations.toLocaleString("ko-KR")}건`, unit: "건", label: "공개 관측값" });
  } else if (populatedEntities > 0) {
    tiles.push({ key: "entities", value: `${populatedEntities.toLocaleString("ko-KR")}건`, unit: "건", label: "공개 목록" });
  }
  if (populatedObservations > 0 && indicatorFamilyCount > 0) {
    tiles.push({ key: "indicators", value: `${indicatorFamilyCount.toLocaleString("ko-KR")}종`, unit: "종", label: "지표 수" });
  } else if (populatedObservations > 0 && populatedEntities > 0) {
    tiles.push({ key: "entities", value: `${populatedEntities.toLocaleString("ko-KR")}건`, unit: "건", label: "공개 목록" });
  }
  return tiles.slice(0, 4);
}

export default function DetailKpiStripV153({ elementId, observations, entities, indicatorFamilyCount }: Props) {
  const [card, setCard] = useState<CardSummaryV140 | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    setCard(undefined);
    loadCardSummariesV140()
      .then((cards) => {
        if (!cancelled) setCard(cards.get(elementId) ?? null);
      })
      .catch(() => {
        if (!cancelled) setCard(null);
      });
    return () => {
      cancelled = true;
    };
  }, [elementId]);
  const tiles = useMemo(
    () => kpiTilesV153(card ?? null, observations, entities, indicatorFamilyCount),
    [card, entities, indicatorFamilyCount, observations]
  );
  if (card === undefined) return null;
  if (card?.kind === "status") {
    return (
      <p className="dl153-kpi-status" data-testid="detail-kpi-status-v153" role="note">
        <PublicTermTextV134 text={`자료상태 · ${card.headline.value} · ${card.headline.label}`} />
      </p>
    );
  }
  if (tiles.length === 0) return null;
  return (
    <section className="dl153-kpi" data-testid="detail-kpi-v153" aria-label="핵심 수치" data-kpi-count={tiles.length}>
      {tiles.map((tile) => (
        <div className="dl153-kpi__tile" key={tile.key} data-testid="detail-kpi-tile-v153" data-kpi-key={tile.key} data-kpi-unit={tile.unit}>
          <strong><PublicTermTextV134 text={tile.value} /></strong>
          <span><PublicTermTextV134 text={tile.label} /></span>
        </div>
      ))}
    </section>
  );
}
