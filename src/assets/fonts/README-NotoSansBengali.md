# Noto Sans Bengali (self-hosted subset)

V158-B2 WP3: Bangladesh region and entity names can carry Bengali script
(e.g. B-035/B-036 `지역명`, B-028 `지점_유역명`). The existing font stack
(`src/styles.css`, Inter / Pretendard / Noto Sans KR / Apple SD Gothic Neo /
Malgun Gothic / Arial) has no Bengali coverage, so those glyphs would render
as tofu boxes. These two files add just enough Bengali coverage, loaded only
when Bengali text actually appears (see `unicode-range` in
`src/styles/fonts-bengali-v158.css`), so Vietnam's pages never fetch them.

## Source

- Upstream project: [notofonts/bengali](https://github.com/notofonts/bengali) (Google's official Noto Fonts monorepo build)
- Release: `NotoSansBengali-v3.011` (published 2026-01-09)
- Release asset: `NotoSansBengali-v3.011.zip`
  <https://github.com/notofonts/bengali/releases/download/NotoSansBengali-v3.011/NotoSansBengali-v3.011.zip>
- License: SIL Open Font License 1.1 (`OFL.txt` in the release, copied here unchanged as `OFL-NotoSansBengali.txt`)
- Files subset from the release's `NotoSansBengali/hinted/ttf/` build (the standard-width, hinted static instances):
  - `NotoSansBengali-Regular.ttf` → `NotoSansBengali-400.woff2`
  - `NotoSansBengali-SemiBold.ttf` → `NotoSansBengali-600.woff2`

### SHA-256 (as downloaded / extracted, before subsetting)

| File | SHA-256 |
| --- | --- |
| `NotoSansBengali-v3.011.zip` | `2aca24bf71665e66c32e14862ee58857dd8b8b07b6321ec7c96f3121ad6683b1` |
| `NotoSansBengali/hinted/ttf/NotoSansBengali-Regular.ttf` | `b55c62ee531e3214da6c0701daecea89a52ba42db7d8206b92e6b51f397a3193` |
| `NotoSansBengali/hinted/ttf/NotoSansBengali-SemiBold.ttf` | `77235a5e06ceef2ef4e53e62cbd08c7d1a6523a3034f1c822d5234247984793d` |

The zip's SHA-256 matches the `digest` GitHub reports for the release asset
(`sha256:2aca24bf71665e66c32e14862ee58857dd8b8b07b6321ec7c96f3121ad6683b1`),
confirmed via `GET /repos/notofonts/bengali/releases/latest`.

## Subsetting

Tool: `fonttools` 4.61.1 (`pyftsubset` via `python -m fontTools.subset`), `brotli` 1.2.0 for woff2 compression.

```
python -m fontTools.subset NotoSansBengali-Regular.ttf \
  --unicodes="U+0980-09FF,U+200C-200D,U+25CC" \
  --output-file=NotoSansBengali-400.woff2 --flavor=woff2 \
  --layout-features='*' --glyph-names --symbol-cmap --legacy-cmap \
  --notdef-glyph --notdef-outline --recommended-glyphs \
  --name-IDs='*' --name-legacy --name-languages='*'
```

(and the same for `NotoSansBengali-SemiBold.ttf` → `NotoSansBengali-600.woff2`).

The Unicode range covers the Bengali block (U+0980-09FF), the zero-width
joiner/non-joiner used in Bengali conjuncts (U+200C-200D), and the dotted
circle used to display an isolated combining mark (U+25CC). `--layout-features='*'`
keeps the GSUB/GPOS rules that form Bengali conjuncts and vowel signs
correctly; dropping them would still show glyphs but with wrong shaping.

Both subsets were checked with `fontTools.ttLib` against a short sample
(বাংলাদেশ ঢাকা কক্সবাজার - "Bangladesh Dhaka Cox's Bazar") and cover every
character with no missing glyphs.

### SHA-256 (published, subset files)

| File | SHA-256 | Size |
| --- | --- | --- |
| `NotoSansBengali-400.woff2` | `967dec7cb8ce1fd303acebe770c28eda7798e2cfb602f5fd0b6541fc6d32e4ce` | 51,808 bytes |
| `NotoSansBengali-600.woff2` | `99b0f481c3ae7ccadd892032a0deebbadb653412370946a64cd725c251153772` | 54,772 bytes |

## Usage

`src/styles/fonts-bengali-v158.css` declares `@font-face` rules for these two
files with the same `unicode-range`, `font-family: "Noto Sans Bengali"`, and
`font-display: swap`. `src/styles.css` lists `"Noto Sans Bengali"` in the body
font stack, after `"Malgun Gothic"` and before `Arial`, so a browser only asks
for these files once it needs to paint a Bengali codepoint from the page - a
page with no Bengali text (every Vietnam screen) never requests them.
