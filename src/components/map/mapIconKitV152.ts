/**
 * V152: the icon pieces the static mini map needs (sprite, legend, category
 * rules), bundled behind one dynamic import so pages whose map has no sites
 * (lines, provinces) never download the glyphs.
 */
export { default as MapIconSpriteV152 } from "./MapIconSpriteV152";
export { default as MapIconLegendV152 } from "./MapIconLegendV152";
export {
  MAP_ICON_INK_V152,
  mapIconCategoryV152,
  mapIconImageIdV152,
  mapIconLegendEntriesV152,
} from "../../data/map/mapIconsV152";
