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
