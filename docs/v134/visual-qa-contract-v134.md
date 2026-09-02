# V134 release and visual QA contract

V134 treats browser/DOM behavior as release evidence and screenshot files as diagnostic artifacts.

## Blocking release path

Both `.github/workflows/ci.yml` and `.github/workflows/pages.yml` run:

1. `npm ci`
2. `npm run finalize:v134`
3. blocking deployment and security contract audits
4. the performance audit as a recorded, non-blocking advisory
5. `npm run build`

The V134 finalizer must retain generated-data and asset-integrity checks, functional browser audits, the V133 map focus/popup/layer-distinction regressions, map click-detail behavior, and the production build contract. It must not invoke a screenshot capture command.

The V128 bundle baseline remains useful as historical evidence, but later public-analysis releases have intentionally expanded the entry bundle. Until a new approved baseline is established, the workflow records that comparison without allowing the stale V128 threshold alone to block an otherwise valid V134 release.

## Non-blocking visual QA path

`.github/workflows/visual-qa.yml` independently builds the production target and runs `npm run capture:screenshots:v134`. The capture step uses `continue-on-error: true`, and the artifact upload runs with `if: always()`. A missing or timed-out screenshot is therefore reported without becoming a dependency of CI or Pages deployment.

Expected artifacts are written under `reports/v134/screenshots/`. The screenshot manifest records readiness evidence, per-file dimensions and hashes, runtime errors, and any capture failure.

## Contract audit

Run `npm run audit:visual-qa-contract:v134`. The audit writes `reports/v134/visual-qa-contract-v134.json` and requires:

- `SCREENSHOT_CAPTURE_IS_RELEASE_BLOCKER = false`
- `FUNCTIONAL_BROWSER_AUDIT_IS_RELEASE_BLOCKER = true`
- `finalize:v134` in both release workflows
- no screenshot capture command in either release workflow or the finalizer dependency chain
- a separate, always-uploaded, non-blocking V134 screenshot workflow

The screenshot capture itself is allowed to fail. The visual-QA contract audit is blocking because it verifies that the separation remains intact.
