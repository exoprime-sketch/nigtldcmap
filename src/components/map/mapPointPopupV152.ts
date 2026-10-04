/**
 * V152: the hover/click popup for one point feature, shared by the big map and
 * the mini map so both say the same thing about the same site: the site's map
 * icon in the title and, for facilities/organisations/projects, the label-form
 * card (facilityCardV153) with every field - an empty one prints "미기재".
 */
import type { CountryEntityV122, CountryMapLayerV122 } from "../../data/countries/countryDataTypesV122";
import { mapFactsV148, mapSourceLineV148 } from "../../data/map/mapPresentationV148";
import { mapIconCategoryV152, mapIconSvg } from "../../data/map/mapIconsV152";
import { facilityCardRowsV153, facilityCardSpecV153 } from "../../data/visualization/facilityCardV153";
import { publicTextV126 } from "../../data/visualization/publicFieldPolicyV126";
import { publicMapLayerTitleV126 } from "../../data/visualization/publicMapWorkspaceV126";
import { LAYER_COLORS } from "../../map/layers/colors";
import { createMapFeaturePopupV148 } from "./mapFeaturePopupV148";

export function mapPointPopupTitleV152(layer: CountryMapLayerV122, properties: Record<string, unknown>): string {
  return publicTextV126(properties.name) || publicMapLayerTitleV126(layer.elementId, layer.publicShortTitle);
}

export function createMapPointPopupV152({
  layer,
  properties,
  primary,
  entity,
  compact = false,
}: {
  layer: CountryMapLayerV122;
  properties: Record<string, unknown>;
  primary: boolean;
  /** The drawn record, when the caller has it: enables the label-form card. */
  entity?: CountryEntityV122 | null;
  /** A short hover card: the rows after 국가·명칭 (the title already names it), at most three. */
  compact?: boolean;
}): HTMLDivElement {
  const category = mapIconCategoryV152(layer.elementId, properties, LAYER_COLORS[layer.elementId] || "#176a4b");
  const allRows = entity && facilityCardSpecV153(layer.elementId) ? facilityCardRowsV153(layer.elementId, entity) : undefined;
  const rows = compact && allRows ? allRows.filter((row) => !["country", "name"].includes(row.key)).slice(0, 3) : allRows;
  // A card that shows 소재지 already says where it is; the note would repeat it.
  const locationShown = Boolean(rows?.some((row) => row.key === "location" && !row.missing));
  // V164-3: the short card says where and from whom from the card itself when
  // the drawn feature does not carry those lines (Bangladesh A-023 sites).
  const locationRow = allRows?.find((row) => row.key === "location" && !row.missing);
  const sourceRow = allRows?.find((row) => row.key === "source" && !row.missing);
  // V164: the title is the feature's name, so a 이름 row carrying the same
  // text (A-027 roads) says it twice and pushes a real row out of the three.
  const title = mapPointPopupTitleV152(layer, properties);
  const facts = mapFactsV148(layer, properties).filter(
    (fact) => fact.key !== "sourceLabel" && !(fact.key === "name" && fact.value.trim() === title.trim())
  );
  // V164: locationLabelV151 is the whole phrase ("소재 …", "국외 지점 (…)",
  // "해상 지점 (…)"). A point outside every province whose facts already carry
  // a 소재 line (B-008 "소재 중부 — 다낭") is not told its place twice.
  const outside = properties.locationOutsideV164 === true;
  const factsStateLocation = facts.some((fact) => fact.label === "소재" || fact.label === "소재지");
  const location =
    (outside && factsStateLocation ? "" : publicTextV126(properties.locationLabelV151)) ||
    (compact && locationRow ? `소재 ${locationRow.value.replace(/\s·\s개편 후 34개 기준.*$/u, "")}` : "");
  // V164: Bangladesh organisation points carry the delivery's own precision
  // ("행정구역(구역) 중심점") instead of the `approximate` flag; both mean the
  // point is the area's representative position, not the office or site itself.
  const representativePoint = Boolean(properties.approximate) || /중심점/u.test(String(properties.locationPrecision ?? ""));
  const sourceLine = mapSourceLineV148(properties) || (compact && sourceRow ? sourceRow.value.split(" · ")[0] : "");
  return createMapFeaturePopupV148({
    elementId: layer.elementId,
    selectionKey: String(properties.selectionKey ?? properties.recordId ?? ""),
    title,
    dataset: publicMapLayerTitleV126(layer.elementId, layer.publicShortTitle),
    primary,
    facts,
    source: sourceLine,
    rows: rows?.map((row) => ({ key: row.key, label: row.label, value: row.value, missing: row.missing })),
    iconSvg: category ? mapIconSvg(category.iconId, { size: 16, color: "#20343a" }) : undefined,
    note: [representativePoint ? "소재 지역의 대표 위치" : "", !locationShown && location ? location : ""].filter(Boolean).join(" · ") || undefined,
  });
}
