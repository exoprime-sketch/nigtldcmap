/**
 * GENERATED FILE — do not edit by hand.
 *
 * Regenerate with:
 *   node scripts/v152/build-map-icons-v152.mjs
 *
 * Source SVGs:
 *   - Tabler Icons (MIT) — node_modules/@tabler/icons/icons/outline/*.svg
 *   - Material Symbols (Apache-2.0) — scripts/v152/icons/material/*.svg
 *   - Custom (자체 제작 / composite) — scripts/v152/icons/custom/*.svg
 *
 * See docs/MAP_ICON_CONTRACT_V152.md for the licence table and how to add
 * an icon. Every path's `d` string is ready for `new Path2D(d)`.
 */

export type MapIconIdV152 =
  | "alert-triangle"
  | "barrel"
  | "bolt"
  | "bug"
  | "building"
  | "building-bank"
  | "building-skyscraper"
  | "certificate"
  | "cloud-down"
  | "coal"
  | "coin"
  | "droplet"
  | "droplets"
  | "flame"
  | "flame-barrel"
  | "flask"
  | "flood"
  | "gauge"
  | "heart-handshake"
  | "landslide"
  | "pick"
  | "plant-2"
  | "radioactive"
  | "recycle"
  | "ripple"
  | "school"
  | "solar-panel-2"
  | "storm"
  | "sun-high"
  | "temperature-sun"
  | "tornado"
  | "virus"
  | "volcano"
  | "windmill"
  | "world";

export interface MapIconPartTransformV152 {
  /** Uniform scale applied to the original source path before translation. */
  scale: number;
  /** Translation in the icon's own viewBox units, applied after scaling. */
  translate: [number, number];
}

export interface MapIconGlyphV152 {
  viewBox: string;
  mode: "stroke" | "fill";
  /** Path `d` strings, already usable with `new Path2D(d)`. */
  paths: string[];
  /**
   * Per-path transform record for hand-built composites (same length as
   * `paths` when present). Informational: `paths` already has the
   * transform baked in, since Path2D cannot apply one at draw time.
   */
  partTransforms?: MapIconPartTransformV152[];
  source: "Tabler Icons" | "Material Symbols" | "자체 제작";
  sourceName: string;
  license: "MIT" | "Apache-2.0" | "CC0-1.0";
  version: string;
}

export const MAP_ICON_PATHS_V152: Record<MapIconIdV152, MapIconGlyphV152> = {
  "alert-triangle": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M12 9v4",
      "M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0",
      "M12 16h.01"
    ],
    "source": "Tabler Icons",
    "sourceName": "alert-triangle",
    "license": "MIT",
    "version": "3.48.0"
  },
  "barrel": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M7.278 4h9.444a2 2 0 0 1 1.841 1.22c.958 2.26 1.437 4.52 1.437 6.78c0 2.26 -.479 4.52 -1.437 6.78a2 2 0 0 1 -1.841 1.22h-9.444a2 2 0 0 1 -1.841 -1.22c-.958 -2.26 -1.437 -4.52 -1.437 -6.78c0 -2.26 .479 -4.52 1.437 -6.78a2 2 0 0 1 1.841 -1.22",
      "M14 4c.667 2.667 1 5.333 1 8s-.333 5.333 -1 8",
      "M10 4c-.667 2.667 -1 5.333 -1 8s.333 5.333 1 8",
      "M4.5 16h15",
      "M19.5 8h-15"
    ],
    "source": "Tabler Icons",
    "sourceName": "barrel",
    "license": "MIT",
    "version": "3.48.0"
  },
  "bolt": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"
    ],
    "source": "Tabler Icons",
    "sourceName": "bolt",
    "license": "MIT",
    "version": "3.48.0"
  },
  "bug": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M9 9v-1a3 3 0 0 1 6 0v1",
      "M8 9h8a6 6 0 0 1 1 3v3a5 5 0 0 1 -10 0v-3a6 6 0 0 1 1 -3",
      "M3 13l4 0",
      "M17 13l4 0",
      "M12 20l0 -6",
      "M4 19l3.35 -2",
      "M20 19l-3.35 -2",
      "M4 7l3.75 2.4",
      "M20 7l-3.75 2.4"
    ],
    "source": "Tabler Icons",
    "sourceName": "bug",
    "license": "MIT",
    "version": "3.48.0"
  },
  "building": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M3 21l18 0",
      "M9 8l1 0",
      "M9 12l1 0",
      "M9 16l1 0",
      "M14 8l1 0",
      "M14 12l1 0",
      "M14 16l1 0",
      "M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16"
    ],
    "source": "Tabler Icons",
    "sourceName": "building",
    "license": "MIT",
    "version": "3.48.0"
  },
  "building-bank": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M3 21l18 0",
      "M3 10l18 0",
      "M5 6l7 -3l7 3",
      "M4 10l0 11",
      "M20 10l0 11",
      "M8 14l0 3",
      "M12 14l0 3",
      "M16 14l0 3"
    ],
    "source": "Tabler Icons",
    "sourceName": "building-bank",
    "license": "MIT",
    "version": "3.48.0"
  },
  "building-skyscraper": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M3 21l18 0",
      "M5 21v-14l8 -4v18",
      "M19 21v-10l-6 -4",
      "M9 9l0 .01",
      "M9 12l0 .01",
      "M9 15l0 .01",
      "M9 18l0 .01"
    ],
    "source": "Tabler Icons",
    "sourceName": "building-skyscraper",
    "license": "MIT",
    "version": "3.48.0"
  },
  "certificate": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M12 15a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
      "M13 17.5v4.5l2 -1.5l2 1.5v-4.5",
      "M10 19h-5a2 2 0 0 1 -2 -2v-10c0 -1.1 .9 -2 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -1 1.73",
      "M6 9l12 0",
      "M6 12l3 0",
      "M6 15l2 0"
    ],
    "source": "Tabler Icons",
    "sourceName": "certificate",
    "license": "MIT",
    "version": "3.48.0"
  },
  "cloud-down": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M12 18.004h-5.343c-2.572 -.004 -4.657 -2.011 -4.657 -4.487c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.38 0 2.573 .813 3.13 1.99",
      "M19 16v6",
      "M22 19l-3 3l-3 -3"
    ],
    "source": "Tabler Icons",
    "sourceName": "cloud-down",
    "license": "MIT",
    "version": "3.48.0"
  },
  "coal": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M3 21h18",
      "M5 21v-7h9v7",
      "M16 21v-16h3v16",
      "M17.5 5c-1 -.8 1 -1.6 0 -2.4c-1 -.8 1 -1.6 0 -2.4"
    ],
    "source": "자체 제작",
    "sourceName": "coal",
    "license": "CC0-1.0",
    "version": "1.0.0"
  },
  "coin": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",
      "M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1",
      "M12 7v10"
    ],
    "source": "Tabler Icons",
    "sourceName": "coin",
    "license": "MIT",
    "version": "3.48.0"
  },
  "droplet": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M7.502 19.423c2.602 2.105 6.395 2.105 8.996 0c2.602 -2.105 3.262 -5.708 1.566 -8.546l-4.89 -7.26c-.42 -.625 -1.287 -.803 -1.936 -.397a1.376 1.376 0 0 0 -.41 .397l-4.893 7.26c-1.695 2.838 -1.035 6.441 1.567 8.546"
    ],
    "source": "Tabler Icons",
    "sourceName": "droplet",
    "license": "MIT",
    "version": "3.48.0"
  },
  "droplets": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M4.072 20.3a2.999 2.999 0 0 0 3.856 0a3.002 3.002 0 0 0 .67 -3.798l-2.095 -3.227a.6 .6 0 0 0 -1.005 0l-2.098 3.227a3.003 3.003 0 0 0 .671 3.798",
      "M16.072 20.3a2.999 2.999 0 0 0 3.856 0a3.002 3.002 0 0 0 .67 -3.798l-2.095 -3.227a.6 .6 0 0 0 -1.005 0l-2.098 3.227a3.003 3.003 0 0 0 .671 3.798",
      "M10.072 10.3a2.999 2.999 0 0 0 3.856 0a3.002 3.002 0 0 0 .67 -3.798l-2.095 -3.227a.6 .6 0 0 0 -1.005 0l-2.098 3.227a3.003 3.003 0 0 0 .671 3.798l.001 0"
    ],
    "source": "Tabler Icons",
    "sourceName": "droplets",
    "license": "MIT",
    "version": "3.48.0"
  },
  "flame": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.294 -2.333 5.588c0 3.704 3.134 6.706 7 6.706c3.866 0 7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235"
    ],
    "source": "Tabler Icons",
    "sourceName": "flame",
    "license": "MIT",
    "version": "3.48.0"
  },
  "flame-barrel": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M3.87 9h8.26 a1.75 1.75 0 0 1 1.61 1.07 c0.84 1.98 1.26 3.95 1.26 5.93 c0 1.98 -0.42 3.95 -1.26 5.93 a1.75 1.75 0 0 1 -1.61 1.07 h-8.26 a1.75 1.75 0 0 1 -1.61 -1.07 c-0.84 -1.98 -1.26 -3.95 -1.26 -5.93 c0 -1.98 0.42 -3.95 1.26 -5.93 a1.75 1.75 0 0 1 1.61 -1.07",
      "M9.75 9c0.58 2.33 0.88 4.67 0.88 7 s-0.29 4.67 -0.87 7",
      "M6.25 9c-0.58 2.33 -0.87 4.67 -0.87 7 s0.29 4.67 0.88 7",
      "M1.44 19.5h13.13",
      "M14.56 12.5h-13.12",
      "M16.99 6.1c1.33 -1.89 0.1 -4.46 -0.57 -5.1 c0 1.94 -1.27 3.02 -2.09 3.82 c-0.82 0.8 -1.33 1.88 -1.33 3.19 c0 2.11 1.79 3.82 3.99 3.82 c2.2 0 3.99 -1.71 3.99 -3.82 c0 -0.98 -0.7 -2.51 -1.33 -3.19 c-1.19 1.91 -1.86 1.91 -2.66 1.27"
    ],
    "partTransforms": [
      {
        "scale": 0.875,
        "translate": [
          -2.5,
          5.5
        ]
      },
      {
        "scale": 0.875,
        "translate": [
          -2.5,
          5.5
        ]
      },
      {
        "scale": 0.875,
        "translate": [
          -2.5,
          5.5
        ]
      },
      {
        "scale": 0.875,
        "translate": [
          -2.5,
          5.5
        ]
      },
      {
        "scale": 0.875,
        "translate": [
          -2.5,
          5.5
        ]
      },
      {
        "scale": 0.57,
        "translate": [
          10.15,
          -0.14
        ]
      }
    ],
    "source": "Tabler Icons",
    "sourceName": "flame + barrel",
    "license": "MIT",
    "version": "3.48.0"
  },
  "flask": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M9 3l6 0",
      "M10 9l4 0",
      "M10 3v6l-4 11a.7 .7 0 0 0 .5 1h11a.7 .7 0 0 0 .5 -1l-4 -11v-6"
    ],
    "source": "Tabler Icons",
    "sourceName": "flask",
    "license": "MIT",
    "version": "3.48.0"
  },
  "flood": {
    "viewBox": "0 -960 960 960",
    "mode": "fill",
    "paths": [
      "M80-80v-60q34-3 54.5-21.5T208-180q53 0 75.5 20t60.5 20q38 0 60.5-20t75.5-20q53 0 76 20t60 20q38 0 60.5-25t75.5-25q53 0 73.5 23.5T880-140v60q-42 0-68.5-25T752-130q-33 0-58 25t-78 25q-53 0-78-20t-58-20q-33 0-58 20t-78 20q-53 0-78-20t-58-20q-33 0-59.5 20T80-80Zm264-190q-53 0-78-20t-58-20q-33 0-59.5 20T80-270v-60q34-3 54.5-21.5T208-370q11 0 22.5 1.5T251-364l-51-185-62 77-47-38 300-370 445 170-22 56-92-35 86 321q18 10 36.5 24t35.5 13v61q-42 0-68.5-25T752-320q-33 0-58 25t-78 25q-53 0-78-20t-58-20q-33 0-58 20t-78 20Zm0-60q31 0 55.5-17.5T456-369l-37-136 136-36 55 211q38 4 62.5-22t69.5-28l-90-336-241-93-164 202 74 274q7 2 12 2.5t11 .5Zm151-237Z"
    ],
    "source": "Material Symbols",
    "sourceName": "flood",
    "license": "Apache-2.0",
    "version": "0.47.5"
  },
  "gauge": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",
      "M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
      "M13.41 10.59l2.59 -2.59",
      "M7 12a5 5 0 0 1 5 -5"
    ],
    "source": "Tabler Icons",
    "sourceName": "gauge",
    "license": "MIT",
    "version": "3.48.0"
  },
  "heart-handshake": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572",
      "M12 6l-3.293 3.293a1 1 0 0 0 0 1.414l.543 .543c.69 .69 1.81 .69 2.5 0l1 -1a3.182 3.182 0 0 1 4.5 0l2.25 2.25",
      "M12.5 15.5l2 2",
      "M15 13l2 2"
    ],
    "source": "Tabler Icons",
    "sourceName": "heart-handshake",
    "license": "MIT",
    "version": "3.48.0"
  },
  "landslide": {
    "viewBox": "0 -960 960 960",
    "mode": "fill",
    "paths": [
      "M80-80h800L640-400l-200-80-120-160H80v560Zm60-60v-101l100 32 375-124 145 193H140Zm100-131-100-34v-96l100 32 173-56 122 55-295 99Zm500-129 180-80v-160l-180-40-100 80v120l100 80Zm-500-31-100-34v-115h150l82 105-132 44Zm508-27-58-45v-73l63-50 117 26v87l-122 55ZM480-640l200-80v-200l-200-40-120 80v160l120 80Zm5-56-75-51v-106l81-54 139 28v125l-145 58Z"
    ],
    "source": "Material Symbols",
    "sourceName": "landslide",
    "license": "Apache-2.0",
    "version": "0.47.5"
  },
  "pick": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M13 8l-9.383 9.418a2.091 2.091 0 0 0 0 2.967a2.11 2.11 0 0 0 2.976 0l9.407 -9.385",
      "M9 3h4.586a1 1 0 0 1 .707 .293l6.414 6.414a1 1 0 0 1 .293 .707v4.586a2 2 0 1 1 -4 0v-3l-5 -5h-3a2 2 0 1 1 0 -4"
    ],
    "source": "Tabler Icons",
    "sourceName": "pick",
    "license": "MIT",
    "version": "3.48.0"
  },
  "plant-2": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M2 9a10 10 0 1 0 20 0",
      "M12 19a10 10 0 0 1 10 -10",
      "M2 9a10 10 0 0 1 10 10",
      "M12 4a9.7 9.7 0 0 1 2.99 7.5",
      "M9.01 11.5a9.7 9.7 0 0 1 2.99 -7.5"
    ],
    "source": "Tabler Icons",
    "sourceName": "plant-2",
    "license": "MIT",
    "version": "3.48.0"
  },
  "radioactive": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M13.5 14.6l3 5.19a9 9 0 0 0 4.5 -7.79h-6a3 3 0 0 1 -1.5 2.6",
      "M13.5 9.4l3 -5.19a9 9 0 0 0 -9 0l3 5.19a3 3 0 0 1 3 0",
      "M10.5 14.6l-3 5.19a9 9 0 0 1 -4.5 -7.79h6a3 3 0 0 0 1.5 2.6"
    ],
    "source": "Tabler Icons",
    "sourceName": "radioactive",
    "license": "MIT",
    "version": "3.48.0"
  },
  "recycle": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M12 17l-2 2l2 2",
      "M10 19h9a2 2 0 0 0 1.75 -2.75l-.55 -1",
      "M8.536 11l-.732 -2.732l-2.732 .732",
      "M7.804 8.268l-4.5 7.794a2 2 0 0 0 1.506 2.89l1.141 .024",
      "M15.464 11l2.732 .732l.732 -2.732",
      "M18.196 11.732l-4.5 -7.794a2 2 0 0 0 -3.256 -.14l-.591 .976"
    ],
    "source": "Tabler Icons",
    "sourceName": "recycle",
    "license": "MIT",
    "version": "3.48.0"
  },
  "ripple": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M3 7c3 -2 6 -2 9 0s6 2 9 0",
      "M3 17c3 -2 6 -2 9 0s6 2 9 0",
      "M3 12c3 -2 6 -2 9 0s6 2 9 0"
    ],
    "source": "Tabler Icons",
    "sourceName": "ripple",
    "license": "MIT",
    "version": "3.48.0"
  },
  "school": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M22 9l-10 -4l-10 4l10 4l10 -4v6",
      "M6 10.6v5.4a6 3 0 0 0 12 0v-5.4"
    ],
    "source": "Tabler Icons",
    "sourceName": "school",
    "license": "MIT",
    "version": "3.48.0"
  },
  "solar-panel-2": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M8 2a4 4 0 1 0 8 0",
      "M4 3h1",
      "M19 3h1",
      "M12 9v1",
      "M17.2 7.2l.707 .707",
      "M6.8 7.2l-.7 .7",
      "M4.28 21h15.44a1 1 0 0 0 .97 -1.243l-1.5 -6a1 1 0 0 0 -.97 -.757h-12.44a1 1 0 0 0 -.97 .757l-1.5 6a1 1 0 0 0 .97 1.243",
      "M4 17h16",
      "M10 13l-1 8",
      "M14 13l1 8"
    ],
    "source": "Tabler Icons",
    "sourceName": "solar-panel-2",
    "license": "MIT",
    "version": "3.48.0"
  },
  "storm": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
      "M5 12a7 7 0 1 0 14 0a7 7 0 1 0 -14 0",
      "M5.369 14.236c-1.839 -3.929 -1.561 -7.616 -.704 -11.236",
      "M18.63 9.76c1.837 3.928 1.561 7.615 .703 11.236"
    ],
    "source": "Tabler Icons",
    "sourceName": "storm",
    "license": "MIT",
    "version": "3.48.0"
  },
  "sun-high": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M14.828 14.828a4 4 0 1 0 -5.656 -5.656a4 4 0 0 0 5.656 5.656",
      "M6.343 17.657l-1.414 1.414",
      "M6.343 6.343l-1.414 -1.414",
      "M17.657 6.343l1.414 -1.414",
      "M17.657 17.657l1.414 1.414",
      "M4 12h-2",
      "M12 4v-2",
      "M20 12h2",
      "M12 20v2"
    ],
    "source": "Tabler Icons",
    "sourceName": "sun-high",
    "license": "MIT",
    "version": "3.48.0"
  },
  "temperature-sun": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M4 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 1 0 -4 0v8.5",
      "M4 9h4",
      "M13 16a4 4 0 1 0 0 -8a4.07 4.07 0 0 0 -1 .124",
      "M13 3v1",
      "M21 12h1",
      "M13 20v1",
      "M19.4 5.6l-.7 .7",
      "M18.7 17.7l.7 .7"
    ],
    "source": "Tabler Icons",
    "sourceName": "temperature-sun",
    "license": "MIT",
    "version": "3.48.0"
  },
  "tornado": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M21 4l-18 0",
      "M13 16l-6 0",
      "M11 20l4 0",
      "M6 8l14 0",
      "M4 12l12 0"
    ],
    "source": "Tabler Icons",
    "sourceName": "tornado",
    "license": "MIT",
    "version": "3.48.0"
  },
  "virus": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M7 12a5 5 0 1 0 10 0a5 5 0 1 0 -10 0",
      "M12 7v-4",
      "M11 3h2",
      "M15.536 8.464l2.828 -2.828",
      "M17.657 4.929l1.414 1.414",
      "M17 12h4",
      "M21 11v2",
      "M15.535 15.536l2.829 2.828",
      "M19.071 17.657l-1.414 1.414",
      "M12 17v4",
      "M13 21h-2",
      "M8.465 15.536l-2.829 2.828",
      "M6.343 19.071l-1.413 -1.414",
      "M7 12h-4",
      "M3 13v-2",
      "M8.464 8.464l-2.828 -2.828",
      "M4.929 6.343l1.414 -1.413"
    ],
    "source": "Tabler Icons",
    "sourceName": "virus",
    "license": "MIT",
    "version": "3.48.0"
  },
  "volcano": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M9 8v-1a2 2 0 1 0 -4 0",
      "M15 8v-1a2 2 0 1 1 4 0",
      "M4 20l3.472 -7.812a2 2 0 0 1 1.828 -1.188h5.4a2 2 0 0 1 1.828 1.188l3.472 7.812",
      "M6.192 15.064a2.14 2.14 0 0 1 .475 -.064c.527 -.009 1.026 .178 1.333 .5c.307 .32 .806 .507 1.333 .5c.527 .007 1.026 -.18 1.334 -.5c.307 -.322 .806 -.509 1.333 -.5c.527 -.009 1.026 .178 1.333 .5c.308 .32 .807 .507 1.334 .5c.527 .007 1.026 -.18 1.333 -.5c.307 -.322 .806 -.509 1.333 -.5c.161 .003 .32 .025 .472 .064",
      "M12 8v-4"
    ],
    "source": "Tabler Icons",
    "sourceName": "volcano",
    "license": "MIT",
    "version": "3.48.0"
  },
  "windmill": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M12 12c2.76 0 5 -2.01 5 -4.5s-2.24 -4.5 -5 -4.5v9",
      "M12 12c0 2.76 2.01 5 4.5 5s4.5 -2.24 4.5 -5h-9",
      "M12 12c-2.76 0 -5 2.01 -5 4.5s2.24 4.5 5 4.5v-9",
      "M12 12c0 -2.76 -2.01 -5 -4.5 -5s-4.5 2.24 -4.5 5h9"
    ],
    "source": "Tabler Icons",
    "sourceName": "windmill",
    "license": "MIT",
    "version": "3.48.0"
  },
  "world": {
    "viewBox": "0 0 24 24",
    "mode": "stroke",
    "paths": [
      "M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0",
      "M3.6 9h16.8",
      "M3.6 15h16.8",
      "M11.5 3a17 17 0 0 0 0 18",
      "M12.5 3a17 17 0 0 1 0 18"
    ],
    "source": "Tabler Icons",
    "sourceName": "world",
    "license": "MIT",
    "version": "3.48.0"
  }
};
