# V144 Preview 배포

- 배포 상태: READY, Vercel 대시보드에서 직접 확인
- 대상: Preview, 기존 nigtldcmap 프로젝트
- URL: https://nigtldcmap-cqam9j9av-exoprime-5142s-projects.vercel.app/
- 대시보드: https://vercel.com/exoprime-5142s-projects/nigtldcmap/DKZNXhAyMHC5DRfSVmVnQ1x6vheN
- 배포 ID: DKZNXhAyMHC5DRfSVmVnQ1x6vheN
- 브랜치: codex/v144-preview-20260917
- 커밋: 5528c5d8377c2146d54a0ee2c376c10e90d68fcd
- 프레임워크: Create React App / react-scripts
- Vercel 표시 배포 소요시간: 1분 14초
- 배포 번들: main.658256a0.js — 로컬 검증본과 같은 파일명

## 배포 방식과 보존

사용자의 배포 요청에 따라 기존 GitHub–Vercel 연동을 사용했다. 현재의 미커밋 V142/V143/V144 코드를 포함한 배포용 스냅샷을 별도 Git index로 만들고, 새 브랜치에 비강제 push했다. 기존 작업 브랜치 feat/home-map-analysis-v139, HEAD 920d330 및 실제 staging 상태와 작업 파일은 그대로 보존했다. main 병합, PR 생성, Production 승격, 요금제 변경, 배포 보호 해제는 하지 않았다.

이 파일은 배포 후 작성한 로컬 기록이며 이번 배포 커밋에 포함되지 않는다. reports/v144/IMPLEMENTATION_AND_REVIEW_V144.md의 ‘배포하지 않음’ 문구는 이전 구현 작업 종료 시점의 기록이고, 이후 본 배포를 수행했다.

## 온라인 기본 확인

- 로그인된 Vercel 브라우저에서 Preview에 직접 접속.
- 홈: 전체 152개, 지도 42개, 다운로드 가능 147개 표시.
- Finder → A-006: 2025 ILO 전체 1.52%, 2024 선택 시 1.6% 및 전년 차이 변경.
- Finder → E-008: 144건, 2021–2026년, 수록 논문·특허 출처 표시.
- E-008 상세: 논문 114건·특허 30건, 첫 연구 분야 ‘기후변화 취약성·위험성 평가’, 연도별 논문 표의 32/23/27/19/7/6건 확인.
- 지도: 국가 선택과 범주별 목록 표시. 전력 인프라 선택 시 송전망+발전소 2개 레이어, 송전망 606구간 표시를 DOM 및 스크린샷으로 확인.
- 해당 QA 탭 콘솔 error 기록 0건.

전체 152개 분석 수용, 전체 배포 회귀검사 또는 Linux E2E를 통과했다는 의미는 아니다. 기존 검토보고서의 남은 쟁점은 유지한다. 해당 브랜치 push만으로 PR용 CI는 실행되지 않는다.

브라우저 기록: output/public-review-20260917/v144/deployment-preview-qa.json

화면 캡처: output/public-review-20260917/v144/deployment-preview-map.png

Preview는 프로젝트의 기존 접근 보호 정책을 유지하므로 다른 브라우저에서는 Vercel 로그인이 필요할 수 있다.
