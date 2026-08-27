# A-024 transmission geometry provenance

- Dataset: World Bank Group / ENERGYDATA.INFO, **Vietnam - Electricity Transmission Network**
- Dataset page: <https://energydata.info/dataset/vietnam-electricity-transmission-network-2016>
- Resource: `9770a72f-e548-4cd8-8664-3d46693b8177`, **Transmission Network** (GeoJSON)
- Resource page: <https://energydata.info/dataset/vietnam-electricity-transmission-network-2016/resource/9770a72f-e548-4cd8-8664-3d46693b8177>
- Data year: 2016
- License: Creative Commons Attribution 4.0 (`CC-BY-4.0`)
- Attribution: World Bank Group / ENERGYDATA.INFO, Vietnam - Electricity Transmission Network (2016), CC BY 4.0
- Pinned source SHA-256: `5afa4f4e630ad27e3601dccbc36bf1312d7b7af801c397b09bf917d9269155c7`
- Valid GeoJSON document SHA-256: `75bb82054b3643337602bcbf67a0d7a9d2753e939f5fdc7c016dbb22fcde1815`
- Deterministic source capsule SHA-256: `155c2b5c84c205c77b52bfe701997301f0cd6eed917ca2463b4e2da648aec7ff`

The dataset describes existing transmission lines. The World Bank source says
the linework was digitized from a georeferenced PDF and can have isolated
horizontal or vertical displacement of 2–10 km. It is appropriate for approximate
visualization, not engineering, routing, cadastral, or other high-accuracy use.

The upstream file currently has the text `System.IO.MemoryStream` after the
otherwise valid GeoJSON document. The builder pins the complete source hash and
only accepts that exact trailing marker before decoding the valid JSON document.

The generated linework preserves every source coordinate. It does not connect
the workbook's start points, interpolate missing segments, or synthesize any
geometry. Length is calculated from each preserved line on the WGS84 ellipsoid
using Vincenty's inverse formula; this reproduces the length values retained in
the A-024 workbook projection.

`source/vnm-transmission-network-source.geojson.gz` is a deterministic offline
capsule of the valid World Bank GeoJSON document. It includes source, version,
license, attribution, accuracy, and integrity metadata. The normal build reads
this tracked source so `public/data/vietnam/v2/geometry/vnm-transmission-network.geojson`
can be removed and rebuilt without network access. Use `--refresh
--update-vendored-source` only when intentionally verifying the pinned upstream
payload.
