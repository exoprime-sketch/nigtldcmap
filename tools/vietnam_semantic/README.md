# Vietnam V125 semantic build

Run from the repository root:

```text
python tools/vietnam_semantic/build_semantic_v125.py
```

The build reads the tracked V124 catalog, bundle index, compressed element
packs, and V100 presentation registry. It does not modify V124 source assets.
It writes:

- a compact semantic index and one lazy-loaded shard per framework element;
- 152 visualization contracts;
- the semantic integrity summary and V125 audit reports;
- a lightweight TypeScript summary registry for synchronous Data Finder cards.

E-012 uses a closed indicator-id grammar. Occupation and sex values extracted
from each applicable id are checked against the corresponding source note; a
mismatch terminates the build. All other source-note parsing is performed here
once and emitted as sparse structured overrides, never repeated in React.

Outputs use a fixed generation timestamp, Unicode NFC normalization, explicit
sort keys, and stable JSON key ordering. Repeated runs over identical V124
inputs produce byte-identical assets.
