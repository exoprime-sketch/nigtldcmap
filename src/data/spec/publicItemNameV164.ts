import { getCardSpecForCountryV158 } from "./countrySpecV158";
import type { CountrySpecItemV158 } from "./countrySpecV158";

/** The parts of a catalogue item the public name is read from. */
export interface PublicNameItemV164 extends CountrySpecItemV158 {
  countryIso3: string;
  publicTitle: string;
}

/**
 * The name a dataset carries on every public list: the V159 card's base name
 * for the item's own country, else the catalogue title.
 *
 * The finder cards, the detail header and the home cards already read this; the
 * download list and the header search read the catalogue title alone, so one
 * dataset had two names ("세계 거버넌스 지표(WGI)" on the finder card,
 * "국가 거버넌스 지표(WGI)" on the download row). One function, used by all.
 */
export function publicItemNameV164(item: PublicNameItemV164): string {
  return getCardSpecForCountryV158(item.elementId, item.countryIso3, item)?.baseName || item.publicTitle;
}
