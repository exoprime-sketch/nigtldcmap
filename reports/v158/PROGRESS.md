# V158-B2 진행 상태 (방글라데시 지도 등록·공개 전환·10개국 확장 기준·배포 용량)

계획: `C:\Users\user\.claude\plans\tranquil-greeting-harp.md`(2026-09-29 승인) · 세션5 · wt-d3

## 목표·수용기준
- **PR-A 배포 용량 결정안**: 10개국 예측, Vercel(Hobby) 한도, 지연 로드·압축·외부 저장 중 1안 권고. 화면 변화 0.
- **PR-B 국가 일반화 계층**(VNM 화면 변화 0, BGD는 preparing)
  - 국가별 로더·provider
  - 국가별 카드 이름·출처(12개), 유형, 명세 문구 필터(타국 문단 숨김·보고)
  - 지역명 괄호 로마자, 벵골 글꼴, 비교 블록 연도 규칙
  - BGD 파생 자산
- **PR-C BGD 지도 43**: 등록 37·보류 6, 참고 지도 3, 윤곽 밖 제외 A-023 1·E-006 7. 새 빌더, v138은 수정하지 않음.
- **PR-D 공개 전환**: BGD live, 홈 국가 선택, 찾기 국가 탭(기본 = 현재 국가), 비교 블록, 추적표 BGD 열.
- **공통**
  - `finalize:v151` PR 직전 1회
  - BGD QA: 타국 표현 0, 괄호 비라틴 0, 벵골 깨짐 0, 6폭 넘침 0
  - 가짜 3번째 국가 시험
  - 병합은 "PR #N 병합" 지시 때만

## 완료
- B1(#38)·Vercel 단일화(#40) 병합
- PR-A 작성: `docs/DEPLOYMENT_CAPACITY_V158.md`, `scripts/v158/deployment-capacity-v158.mjs`, `reports/v158/deployment-capacity-v158.json`
  - build 948.7 MB, 10개국 2.19~7.12 GB → 압축 시 0.28~1.19 GB

## 진행 중
- PR-A push·PR·보고

## 대기·결정 필요
- PR-A 결정 3건: 압축안 채택, 기존 다운로드 주소 처리, Hobby 비상업 조건
- 동시 작업과 겹치는 파일
  - P8(`RealMapExplorerPage`·`DetailLocationMapV148`·`publicMapWorkspaceV126`·v138 빌더)
  - #42(`vietnamCountryDataProviderV122`)
  - ②(라우터·출처 패널·템플릿 변형·추적표)
  - 상대 PR이 병합된 뒤 main을 merge해서 푼다.
