/**
 * V152: the point symbol shapes that tell co-displayed layers apart (V129) and
 * their canvas images (moved from RealMapExplorerPage).
 */
import type { Map as MapLibreMap } from "maplibre-gl";
import type { CountryMapLayerV122 } from "../../data/countries/countryDataTypesV122";
import { rendererOf } from "./contract";
import type { PublicMapSymbolShapeV129 } from "./types";

export function publicMapSymbolShapeV129(
  layer: CountryMapLayerV122
): PublicMapSymbolShapeV129 {
  const renderer = rendererOf(layer);
  if (renderer === "line") return "line";
  // Adaptation Fund activity sites use the same diamond in the map and
  // legend; regional participation areas remain visible behind the symbol.
  if (layer.elementId === "D-018") return "diamond";
  if (
    renderer === "admin1-choropleth" ||
    renderer === "partial-choropleth" ||
    renderer === "regional-scope"
  ) {
    return "area";
  }
  if (["B-048", "D-018"].includes(layer.elementId)) return "diamond";
  if (["C-025", "D-023"].includes(layer.elementId)) return "square";
  // V138 point families: stations and hydrological sites as triangles,
  // organisations and offices as squares, events and facilities as circles.
  if (["B-008", "B-023", "B-028", "B-025"].includes(layer.elementId)) return "triangle";
  if (["E-004", "E-005", "E-006", "E-018", "E-019"].includes(layer.elementId)) {
    return "square";
  }
  return "circle";
}

export function ensurePublicPointSymbolImageV129(
  map: MapLibreMap,
  imageId: string,
  shape: PublicMapSymbolShapeV129,
  color: string
): void {
  if (shape === "circle" || map.hasImage(imageId)) return;
  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, size, size);
  context.fillStyle = color;
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2.4;
  context.beginPath();
  if (shape === "diamond") {
    context.moveTo(size / 2, 2);
    context.lineTo(size - 2, size / 2);
    context.lineTo(size / 2, size - 2);
    context.lineTo(2, size / 2);
  } else if (shape === "triangle") {
    context.moveTo(size / 2, 2);
    context.lineTo(size - 2, size - 3);
    context.lineTo(2, size - 3);
  } else {
    context.rect(3, 3, size - 6, size - 6);
  }
  context.closePath();
  context.fill();
  context.stroke();
  map.addImage(imageId, context.getImageData(0, 0, size, size), {
    pixelRatio: 2,
  });
}
