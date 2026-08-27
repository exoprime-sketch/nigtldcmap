# Viet Nam ADM1 63-unit canonical source

`vnm-adm1-63-source.geojson` is the tracked, normalized canonical boundary used
to reconstruct the public V124 geometry asset. `vnm-adm1-aliases-source.json`
is its deterministic join dictionary.

The pinned input is geoBoundaries VNM ADM1 boundary ID
`VNM-ADM1-63759600`, commit `9469f09`, boundary year 2008, and build date
2023-12-12. Its source SHA-256 is
`25dbc2fec9862016710118fc98042d3e803830c72361c91c4e864ae668fa9541`.
The source contains 64 shapes but 63 unique ADM1 codes: Côn Đảo and
Bà Rịa–Vũng Tàu both use `VN-43`. The builder preserves both real polygon
coordinate sets in one MultiPolygon for that ADM1 code. No coordinates are
generated, interpolated, or connected.

The source boundary metadata identifies the individual boundary as Public
Domain. geoBoundaries computer code and derivative works are distributed under
CC BY 4.0 and require attribution. Attribution used by this project:

> geoBoundaries (William & Mary geoLab), VNM ADM1, boundary year 2008, build
> 2023-12-12; Runfola et al. (2020), PLOS ONE 15(4): e0231866.

References:

- https://www.geoboundaries.org/api/current/gbOpen/VNM/ADM1/
- https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/VNM/ADM1/geoBoundaries-VNM-ADM1-metaData.json
- https://www.geoboundaries.org/
- https://doi.org/10.1371/journal.pone.0231866
- https://creativecommons.org/licenses/by/4.0/

Rebuild and validate with:

```text
python -m pip install -r tools/vietnam_spatial/requirements-adm1.txt
python tools/vietnam_spatial/build_adm1.py
```
