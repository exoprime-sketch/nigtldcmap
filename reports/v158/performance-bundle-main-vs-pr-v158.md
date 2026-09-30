# 성능 감사 초기 번들 — main vs 이 PR (V158-ZIP)

`audit:performance:v128` `INITIAL_BUNDLE_REGRESSION`: 진입 파일(JS·CSS) gzip 합계를 기준값과 비교(허용 10% 이내). 두 빌드는 같은 명령(`npm run build`)으로 각 체크아웃에서 만들고 같은 감사 스크립트로 쟀다.

| 빌드 | 커밋 | JS gzip | CSS gzip | 합계 | 기준 대비 |
|---|---|---|---|---|---|
| 기준 | d66b83e (2026-08-31, V128-A) | 200,287 | 26,356 | 226,643 | — |
| main | origin/main 5b82ea6 | 472,931 | 41,735 | 514,666 | +127.08% |
| 이 PR | feat/v158-download-zip f23d0e6 | 472,904 | 41,735 | 514,639 | +127.07% |

- 이 PR − main: -27 바이트(gzip). CSS는 같고, JS는 원본 크기가 같다(2,295,162바이트). gzip 차이는 앱에 들어가는 데이터 디렉터리 사본(`src/data/datasetDirectoryV149.json`)의 지문 값이 바뀐 것뿐이다.
- **+127%는 main에도 있는 기존 상태다.** 이 감사는 CI에서도 참고용(`continue-on-error`)이다.
- main 체크아웃에서만 `DEPLOYMENT_SOURCE_MAP_POLICY`가 실패한 것은 새 체크아웃에 배포 감사 산출물이 없어서(`artifactCount: null`)이고, 코드 차이가 아니다(이 PR 트리에서는 PASS).
