#!/usr/bin/env bash
# P8-2: rebuild everything that reads map-index after a map-layer change
# (the map-layers-onward part of refresh-data-v156.mjs, without stage/build/semantic).
set -e
node scripts/v138/build-map-layers-v138.mjs --data public/data/vietnam/v2 | head -1
node scripts/v139/build-home-preview-v139.mjs --data public/data/vietnam/v2 > /dev/null
node scripts/v157/build-map-content-contract-v157.mjs > /dev/null
node scripts/v157/build-map-companions-v157.mjs > /dev/null
node scripts/v157/align-contract-map-roles-v157.mjs > /dev/null
node scripts/v150-1/dataset-directory-v150-1.mjs build > /dev/null
node scripts/generate-vietnam-asset-integrity-v133.mjs --data public/data/vietnam/v2 > /dev/null
node scripts/v140/build-card-summaries-v140.mjs > /dev/null
node scripts/generate-vietnam-asset-integrity-v133.mjs --data public/data/vietnam/v2 | tail -1 | cut -c1-80
