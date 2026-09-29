## 요약
- B2 계획 PR-B: 비기본 국가를 `public/data/countries.json` 레지스트리만으로 화면에 올리는 국가 일반화 계층과, 방글라데시(BGD) 파생 자산.
- **베트남 화면 변화 0**(production 빌드 151화면 서명 비교). BGD는 `preparing` 그대로라 공개 화면에서 선택할 수 없다.
- PR-A(#44) 위에 쌓은 브랜치다. #44 병합 뒤 main을 merge한다.

## 바뀐 것
- 국가별 로더·provider: 국가별 캐시 키, 자산 URL 국가 루트 가드, 레지스트리 로드 뒤 provider 등록, 처음 연 `?country=` 재해석, 찾기·상세·다운로드 국가 목록 갱신
- 국가별 표시 계층(10개국 확장 기준)
  - 국가 고유 12요소(용역사 기준 11 + C-015)는 그 나라 요소명·출처
  - 안내('데이터 준비 중'·제외)는 그 나라 카탈로그 상태를 따른다(#43 `statusNotice` 모델)
  - 타국 이름·지명이 든 명세 문단·사례와 검수 문구는 숨긴다(원문 무수정, 기본 국가 화면은 무적용)
  - 지역명 괄호는 로마자만, Noto Sans Bengali 자체 호스팅(`unicode-range`, 베트남 화면은 글꼴을 받지 않음)
  - 비교 블록: 공통 연도가 없으면 국가별 최신값·연도, 출처 각주, 자기 나라가 없는 비교는 표시하지 않음
- BGD 파생 자산: semantic·카드 요약·dataset-directory·presentation·integrity(생성기 `--country`)
- 데이터 규칙 위반 수정: 카드 요약 C-007이 없는 등재 건수를 '0건'으로 보이던 것을 일반 항목 카드로
- 점검 스크립트: `country-qa-v158`(비기본 국가 화면 QA), `fake-country-check-v158`(가짜 3번째 국가), `screen-signature-v158` 주소 수정

## 검증
- tsc 0 · 단위 663/663 · eslint 0(바뀐 파일)
- 베트남 화면 서명: 151화면(홈·찾기·지도·다운로드·이용안내·상세 146) 차이 0
- BGD 화면 QA 7/7: 찾기 119 · 상세 152 런타임 오류 0 · 타국 표현 0(원자료 유래 10건 허용·기록) · 괄호 비라틴 0(원자료 유래 6건) · 벵골 4페이지 정상 · 6폭 넘침 0 · 비교 표본 4종
- 가짜 3번째 국가 11/11 · BGD 데이터 검증기 52/52
- `finalize:v151`: 통과(1회) — release 80/80 · role-split 53/53 · analysis QA 필수 실패 35(기준선 41 이내, 새 실패 0) · boundary-34 21/22(브라우저 1건 생략) · boundary-policy 24/24

## Preview·확인 경로
- Preview: https://nigtldcmap-ibl63iqqs-exoprime-5142s-projects.vercel.app (커밋 `9a25c32`, Vercel 로그인 필요)
- **화면 변화 0**: 베트남 공개 화면(홈·찾기·상세·지도·다운로드·이용안내)은 그대로다. BGD는 `preparing`이라 `?country=BGD`도 베트남 화면으로 열린다.
- 참고(비공개 상태 미리보기, 로컬 빌드에서 레지스트리만 브라우저 안에서 live로 바꿔 1440px 캡처): `reports/v158/screens/b2b-bgd-*.png` — 찾기, A-001 비교, C-015 국가 고유 이름, C-017 벵골 문자, C-020 데이터 준비 중, E-012 단위 불일치

## 기대값 변경
- `reports/v158/EXPECTATION_CHANGES_V158-B2.md` 6행(사유 기록)

## 결정 필요
1. 본부장 2026 제외 6건의 BGD 적용 여부(PR-D 전). BGD는 A-017·E-008 자료가 있어, 적용하지 않으면 공개 시 두 요소가 보인다.
2. main 기존 불일치(베트남 semantic·dataset-directory 6요소)는 fix-forward 대상으로 따로 처리할지

자세한 내용: `reports/v158/REVIEW_V158-B2B.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
