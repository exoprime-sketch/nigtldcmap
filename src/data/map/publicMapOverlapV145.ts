import { formatPublicNumberV126 } from "../visualization/publicNumberFormatV126";
import { publicMapFactValueV163 } from "./mapFactValueLabelsV163";

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

/** "담당 업무 미확인 — 원천 미게시": a fact that says nothing is not a line (V164). */
const NO_VALUE_FACT_V164 = /(?:^|\s)(?:미확인|미기재|미공개)(?:\s|$)|원천\s*미게시/u;
/** The two layers whose delivered field label does not match what the field holds. */
const FACT_LABEL_FIXES_V164: Readonly<Record<string, ReadonlyArray<readonly [string, string]>>> = {
  // E-004 officeProgram holds an office or programme name ("Viet Nam Resident Mission").
  "E-004": [["협력분야·업무 ", "사무소·프로그램 "]],
};

function factLinesV164(elementId: string, facts: readonly string[]): string[] {
  return facts
    .filter((fact) => !NO_VALUE_FACT_V164.test(fact))
    .map((fact) => {
      for (const [from, to] of FACT_LABEL_FIXES_V164[elementId] || []) if (fact.startsWith(from)) return `${to}${fact.slice(from.length)}`;
      return fact;
    });
}

const NAME_FACT_LABELS_V164 = /^(?:이름|명칭|기관명|시설명|사업명)\s+/u;
const PLACE_FACT_LABEL_V164 = /^성·시\(2025\)\s+/u;

/**
 * V164: the name a feature is shown under in the picker and the hover.
 *
 * - A feature with a name: the name, and no "이름 …" fact repeating it.
 * - A feature whose record has no name (OSM dams): "이름 없는 댐", with the
 *   place when the feature states one - never just the bare kind "댐".
 * - Properties without a `name` key (a bare attribute list): no identity, so
 *   the first attribute leads as before.
 */
function featureIdentityV164(
  properties: Record<string, unknown>,
  label: string,
  facts: readonly string[]
): { title: string; repeats: (fact: string) => boolean } | null {
  if (!Object.prototype.hasOwnProperty.call(properties, "name")) return null;
  const name = text(properties.name);
  const shown = text(label) || name;
  if (name) return { title: shown, repeats: (fact) => NAME_FACT_LABELS_V164.test(fact) && fact.replace(NAME_FACT_LABELS_V164, "").trim() === name };
  const kind = text(properties.kindLabel) || shown;
  if (!kind) return null;
  const place = text(properties.adm1Name34) ? publicMapFactValueV163("adm1Name34", text(properties.adm1Name34)) : "";
  return {
    title: `이름 없는 ${kind}${place ? ` · ${place}` : ""}`,
    // The kind and the place are in the title now.
    repeats: (fact) => facts.length > 0 && ((place !== "" && PLACE_FACT_LABEL_V164.test(fact) && fact.replace(PLACE_FACT_LABEL_V164, "").trim() === place) || fact.endsWith(` ${kind}`) && /^(?:종류|구분|유형)\s/u.test(fact)),
  };
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
      let facts = factLinesV164(input.elementId, input.facts || []);
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
      if (!value) {
        // V164: a feature that has a name leads with it. The first attribute used
        // to take the bold line ("협력분야·업무 Viet Nam Resident Mission" over
        // "ADB"), so the reader saw an attribute where the title belongs.
        const identity = featureIdentityV164(p, input.label, facts);
        if (identity) {
          value = identity.title;
          facts = facts.filter((fact) => !identity.repeats(fact));
          place = facts.shift() || "";
        } else if (facts.length) {
          value = facts.shift() || "";
        }
      }
      const context = [measure, period, input.regionNote].filter(Boolean).join(" · ");
      return { elementId: input.elementId, selectionKey: input.selectionKey, role: input.role, title: input.title, value, place, context, facts };
    });
}
