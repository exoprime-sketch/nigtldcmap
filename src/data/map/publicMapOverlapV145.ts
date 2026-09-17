import { formatPublicNumberV126 } from "../visualization/publicNumberFormatV126";

export interface MapOverlapInputV145 {
  elementId: string;
  selectionKey: string;
  role: "primary" | "context";
  label: string;
  title: string;
  properties: Record<string, unknown>;
  facts?: string[];
  unit?: string;
  measure?: string;
  period?: string;
  regionNote?: string;
}

export interface MapOverlapSummaryV145 {
  elementId: string;
  selectionKey: string;
  role: "primary" | "context";
  title: string;
  value: string;
  place: string;
  context: string;
  facts: string[];
}

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function number(value: unknown): number | null {
  // Number(null), Number("") and Number(false) are all zero, not observations.
  if (value === null || value === undefined || typeof value === "boolean" || text(value) === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function quantity(value: unknown, unit: string): string {
  const parsed = number(value);
  return parsed === null ? "" : `${formatPublicNumberV126(parsed, unit)}${unit ? ` ${unit}` : ""}`;
}

/** Only summarize the features under the pointer; never borrow a country total.
 * Primary-first is a presentation rule, independent of the last clicked feature.
 * The map and click chooser use the same selected-feature values and labels.
 */
export function mapOverlapSummariesV145(inputs: MapOverlapInputV145[]): MapOverlapSummaryV145[] {
  return [...inputs]
    .sort((a, b) => Number(b.role === "primary") - Number(a.role === "primary"))
    .map((input) => {
      const p = input.properties;
      const period = text(p.period ?? p.referenceYear) || input.period || "";
      const measure = input.measure || text(p.variableLabel);
      let value = "";
      let place = input.label;
      let facts = [...(input.facts || [])];
      if (p.cluster === true || p.cluster === "true") {
        value = quantity(p.point_count, "개 위치");
        place = "위치 묶음";
      } else if (input.elementId === "A-024") {
        value = [quantity(p.voltageKv ?? p.voltage, "kV"), quantity(p.lengthKm ?? p.length, "km")].filter(Boolean).join(" · ");
        // The feature label already contains voltage/length for unnamed lines.
        place = text(p.name) || "송전선로";
        facts = [];
      } else if (input.elementId === "A-023") {
        value = quantity(p.capacityMw ?? p.mw, "MW");
        if (value) facts = facts.map((fact) => fact.split(" · ").filter((part) => !part.startsWith("용량 ")).join(" · ")).filter(Boolean);
      } else if (Object.prototype.hasOwnProperty.call(p, "value") || Object.prototype.hasOwnProperty.call(p, "hasValue")) {
        const missing = p.hasValue === false || p.hasValue === "false";
        value = missing ? "선택한 항목의 자료 없음" : quantity(p.value, input.unit || text(p.unit));
        if (!value) value = "선택한 항목의 자료 없음";
        // Choropleth tooltipFields include internal adm1Name/value/unit keys.
        // These are already expressed by place, value and context below.
        facts = [];
      }
      // Institutions and project participation areas need meaningful attributes,
      // not a fabricated number. Preserve the source's approval/role wording.
      if (!value && facts.length) value = facts.shift() || "";
      const context = [measure, period, input.regionNote].filter(Boolean).join(" · ");
      return { elementId: input.elementId, selectionKey: input.selectionKey, role: input.role, title: input.title, value, place, context, facts };
    });
}
