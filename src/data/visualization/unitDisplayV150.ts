import unitDisplay from "./unitDisplayV150.json";

// Display spelling of a source unit. Only exact equivalents are aliased
// (백만 kW = GW, 십억 kWh = TWh, "Mt CO2eq" = MtCO₂e); a qualifier such as
// "(순)" or "(2030)" is kept, and CO₂-only units are never widened to CO₂e.
// Values, precision and downloads keep the source unit untouched.
const ALIASES: Record<string, string> = unitDisplay.aliases;

export function displayUnitV150(unit: string | null | undefined): string {
  const raw = String(unit ?? "").trim();
  if (!raw) return raw;
  const direct = ALIASES[raw];
  if (direct) return direct;
  const qualified = raw.match(/^(.*?)(\s*\([^)]*\))$/u);
  if (qualified) {
    const base = ALIASES[qualified[1].trim()];
    if (base) return `${base}${qualified[2].trim()}`;
  }
  return raw;
}
