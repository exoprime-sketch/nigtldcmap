# V128 롤백 가이드

## 원칙

롤백은 직전 검증된 Pages artifact와 Git 이력을 보존하면서 수행한다. production 파일을 수동으로 부분 덮어쓰거나 main을 force push하지 않는다. 앱 bundle과 `public/data/vietnam/v2` 자산은 하나의 원자적 release로 취급하여 서로 다른 버전을 섞지 않는다.

## 배포 전 준비

각 정상 배포마다 다음을 기록한다.

- commit SHA와 branch/tag(실제로 존재하는 경우)
- `npm run release:vietnam-pilot` 결과
- build/Pages artifact 식별자와 digest
- 배포 environment와 완료 시각
- manifest `generatedAt`
- 필수 smoke screenshot
- 배포에 사용한 workflow revision과 `PUBLIC_URL` repository variable
- Pages source·environment protection 설정 snapshot
- custom domain을 사용하는 경우 CNAME, DNS와 TLS 상태

GitHub Pages artifact retention과 environment history가 실제로 유지되는지 repository 설정에서 확인한다. retention을 확인하지 않은 상태에서 이전 artifact가 복구 가능하다고 가정하지 않는다.

base-path 또는 custom-domain 장애에서는 artifact만 되돌려도 복구되지 않을 수 있다. 직전 정상 배포 기록의 `PUBLIC_URL`, Pages source/environment, CNAME·DNS·TLS 설정을 현재 값과 대조하고, 설정 변경도 변경 이력과 승인 절차를 통해 복원한다. credential 값은 snapshot에 기록하지 않는다.

## 롤백 판단

즉시 롤백 후보:

- 앱이 열리지 않거나 반복 runtime exception 발생
- manifest/catalog/pack/geometry/download 주요 자산 404
- JSON/GeoJSON 요청이 HTML 반환
- 공개 행과 다운로드가 불일치
- 내부 provenance 또는 credential 노출
- 지도 blank 또는 검증 geometry 대신 잘못된 자료 표시
- 152개 route 또는 핵심 공개 navigation 중단

외부 source site 일시 장애처럼 정적 공개 artifact와 무관한 문제는 영향과 대체 안내를 먼저 평가한다.

## 가장 빠른 복구: 직전 Pages deployment

호스팅 환경이 이전 Pages deployment 재배포를 지원하고 artifact가 보존된 경우:

1. incident를 선언하고 현재·직전 정상 deployment ID와 SHA를 기록한다.
2. 신규 deployment를 중지하되 기존 기록을 삭제하지 않는다.
3. 직전 정상 artifact 전체를 동일 environment에 재배포한다.
4. 홈, manifest, A-002 상세, 지도, 다운로드, guide smoke를 수행한다.
5. 실제 복구 SHA·artifact·시각을 incident 기록에 남긴다.

정적 asset을 개별 파일 단위로 복원하지 않는다. CDN cache가 있다면 새 deployment가 확정된 뒤 versioned asset과 HTML cache 상태를 확인한다.

## Git 기반 영구 롤백

문제 변경이 main에 merge된 경우 새 rollback branch에서 `git revert`로 되돌린다. history를 보존하며 `git reset --hard`나 force push를 사용하지 않는다.

```powershell
git switch main
git pull --ff-only
git switch -c rollback/vietnam-pilot-<incident-id>
git revert <bad-commit-or-merge-sha>
npm ci
npm run release:vietnam-pilot
git status
git push origin rollback/vietnam-pilot-<incident-id>
```

Merge commit revert는 parent 선택이 필요하므로 실제 history를 확인해 `git revert -m <parent> <merge-sha>`를 사용한다. parent 번호를 추정하지 않는다.

보호된 PR 검토와 CI를 통과한 뒤 배포한다. 긴급 복구라도 사후에 audit 결과와 승인 기록을 보완한다.

## 데이터만 문제인 경우

데이터 rollback도 이전 release의 다음 자산을 한 세트로 복원한다.

- manifest, catalog, coverage, quality, rights, integrity
- packs와 search index
- downloads
- semantic assets
- geometry, spatial layers와 map-index
- acceptance와 reconciliation 보고서

새 앱 bundle이 새 schema만 기대하거나 이전 앱이 새 data schema를 읽지 못할 수 있으므로 호환성을 검증하지 않은 data-only rollback은 금지한다. 가장 안전한 기본값은 직전 정상 앱+데이터 artifact 전체 복원이다.

원본 `_source/`를 공개 복구 artifact로 사용하지 않는다. 원본은 재생성을 위한 제한 입력일 뿐이다.

## 롤백 검증

- live artifact의 SHA가 선택한 정상 release와 일치
- 홈 수치와 manifest 일치
- 152개 계상과 대표 상세 route
- JSON/GeoJSON/CSV 200 및 올바른 content type
- 지도 배경과 대표 전력·산림 layer
- safe download와 화면 행 reconciliation
- console application error 0
- technical provenance 노출 0

## 후속 조치

1. 원인을 코드, 데이터, base path, workflow, cache 또는 외부 dependency로 분류한다.
2. 실패를 재현하는 audit를 유지하거나 추가한다.
3. 수정 branch에서 전체 release gate를 실행한다.
4. 정상 배포 후 임시 운영 공지를 종료한다.
5. rollback과 재배포의 실제 SHA·PR·deployment·tag만 기록한다.

롤백이 완료됐다는 사실이나 live URL을 검증 전에 README·CHANGELOG에 기재하지 않는다.
