# Visual baselines

Windows and Linux keep separate Playwright baselines because font rasterization
and fallback font metrics differ. Neither platform's baseline replaces the other.

The initial Linux baselines were reviewed from GitHub Actions run 34810594996,
artifact 10334448305, commit c061be7a55fb8fb4aeaba55738228ba878534c2f.
The five actual images show the loaded home, finder, A-016, D-011 and download
screens at 1440x1000. Titles, Korean text, cards, controls and data summaries are
present, with no loading/error overlay or horizontal clipping. They establish
the previously missing Linux reference, not an automatic update on each run.

Keep screenshot comparisons enabled. Review actual/diff images before accepting
any future update; never update snapshots unconditionally in CI.

The Linux home baseline was replaced after the V139 home redesign (short
search hero, static transmission map, eight preview cards). It was reviewed
from GitHub Actions run 34936592005, artifact 10383374988 (job 104275738620,
commit 3ff37cae): the actual image shows the loaded home at 1440x1000 with the
title, search, map preview, status strip and the first card row, with no
loading or error overlay. The Windows home baseline was regenerated locally
from the same source tree. The other four baselines are unchanged.
