/** Generates documentation from browser observations, never from renderer presence alone.
 * Browser evidence is collected through the in-app browser; this script opens no browser.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { reviewedElements, benchmarks } from '../v144/element-review-plan-v144.mjs';

const evidence = JSON.parse(readFileSync(resolve('output/public-review-20260917/v147/browser-review-v147.json'), 'utf8'));
const changed = {
  'A-020':'발전량/설비용량 기준 변경 시 각 계열의 최신 제공연도로 이동; 결측 연도 선택과 구분',
  'A-030':'무역 분류와 중복되는 정의 필터 제거; 수출·수입 선택 시 공백 발생 방지',
  'A-033':'분기와 중복되는 정의 필터 제거; Q1~Q4 선택 시 공백 발생 방지',
  'D-013':'녹색성장 세부항목 선택 시 종합·차원·부문 수준을 원자료의 대응 분류로 동기화',
  'A-015':'17개 SDG 목표 선택·세부지표 점수 정렬·101개 지표의 기준연도 표',
  'A-025':'실증·후보·연구를 구분한 상태표; 운영시설 수로 합산하지 않음',
  'A-027':'도로·철도 자료 종류 선택과 지물 유형별 규모; 파일 메타데이터를 주 분석에서 제외',
  'A-028':'자연지물·수로 유형 비교; 지물 건수를 실제 시설 수로 표시하지 않음',
  'A-031':'중복 1~5점 선택기 제거; 분야별 추이와 같은 해 6개 분야·종합점수 비교',
  'B-001':'12개월 강수 막대·기온 곡선·건기/우기 구분·월별 표; 1991~2020년 평년값 명시',
  'B-021':'국가 추이와 별도로 6개 권역 GVI·24개 기준연도 비교',
  'B-025':'전체 유역·베트남 내 문헌 면적·GIS 면적 선택; 8대 유역 비교표',
  'B-026':'63개 성·시 선택·8방향 유향 비율 비교; 유량과 구분',
  'B-029':'성·시 분포와 전국 9개 계열 분리; 전국 연도별 차트·표',
  'B-037':'성·시 분포와 전국 56개 계열 분리; 위성제품별 시계열을 합치지 않음',
  'B-039':'성·시 잠재량과 전국 18개 계열 분리; 개소 수/MW 충돌 1계열 비교 제외',
  'B-040':'심도별 성·시 지온과 전국 34개 계열 분리; 확인 매장량으로 해석하지 않음',
  'C-002':'2016 BUR3 4개 부문·4개 가스 선택; 흡수 음수·빈 셀 유지; 다른 보고 내용은 접힘',
  'D-001':'6개 기술 투자비 중앙값과 표본 하한·상한 비교; 충돌하는 중복 필터 제거',
  'D-002':'카드 선택은 유지하면서 다른 기술의 같은 기간 CAGR 비교; 중복 기술 코드 필터 제거',
  'D-003':'연간/20년 감축량을 분리하고 같은 단위·연도 기술 비교',
  'D-004':'20년 누적 크레딧 수익의 CAPEX 대비 회수율 정의와 기술·가격 시나리오별 비교',
  'E-009':'성별 STEM 비중 비교; 성별 각각의 졸업자가 분모; 연구자 절대수·인구 대비 값은 별도 표',
};
const overrides = {
  'A-015':['SDSN SDG Dashboard','https://dashboards.sdgindex.org/chapters/part-5-methods/'],
  'A-031':['World Bank LPI (기존 조사형 지표)','https://databank.worldbank.org/metadataglossary/world-development-indicators/series/LP.LPI.OVRL.XQ'],
  'B-021':['Global Data Lab GVI','https://globaldatalab.org/gvi/about/'],
  'B-025':['HydroSHEDS','https://www.hydrosheds.org/products/hydrosheds'],
  'B-026':['HydroSHEDS D8','https://data.hydrosheds.org/file/technical-documentation/HydroSHEDS_TechDoc_v1_4.pdf'],
  'B-029':['FAOSTAT Land Cover','https://files-faostat.fao.org/production/LC/LC_e.pdf'],
  'B-037':['FAOSTAT Land Cover','https://files-faostat.fao.org/production/LC/LC_e.pdf'],
  'E-009':['UNESCO UIS','https://databrowser.uis.unesco.org/glossary'],
};
const rows = evidence.routes.map((r) => {
  const plan = reviewedElements.find((p) => p.elementId === r.id);
  const benchmark = overrides[r.id] || benchmarks[plan?.benchmark];
  return {
    elementId:r.id, title:r.title, benchmark, question:plan?.publicQuestion,
    requiredAnalysis:plan?.requiredAnalysis, interpretationRule:plan?.interpretationRule,
    change:changed[r.id] || '기존 개별 분석 유지·회귀 점검', headings:r.headings,
    state:r.state, noKpi:r.kpis.length===0, noPageOverflow:!r.overflow, build:r.build,
    controls:evidence.interactions.filter((x)=>x.id===r.id),
    sourceCheck:evidence.numericChecks.find((x)=>x.id===r.id) || null,
    boundary:'기본 진입 화면·기록된 선택 동작의 검사. 모든 필터 조합이나 원기관 최신 원자료 전건의 재승인 아님.',
  };
}).sort((a,b)=>a.elementId.localeCompare(b.elementId));
if (rows.length!==152 || new Set(rows.map(r=>r.elementId)).size!==152) throw Error('152개 고유 화면 근거 필요');
if (rows.some(r=>!r.question || !r.benchmark || !r.noKpi || !r.noPageOverflow || r.state!=='ready')) throw Error('기준·기본 UI 검증 누락');
if (new Set(rows.map(r=>r.build)).size!==1) throw Error('서로 다른 빌드 근거 혼합');
if (evidence.numericChecks.some(r=>!r.pass)) throw Error('원자료 대조 실패');
const output=resolve('reports/v147');mkdirSync(output,{recursive:true});
writeFileSync(resolve(output,'detail-review-152-v147.json'),JSON.stringify({generatedAt:new Date().toISOString(),build:rows[0].build,scope:'local candidate',rows,numericChecks:evidence.numericChecks,responsive:evidence.responsive,notes:evidence.notes},null,2)+'\n');
const clean=v=>String(v||'').replaceAll('|','／').replaceAll('\n',' ');
writeFileSync(resolve(output,'detail-review-152-v147.md'),[
  '# 상세보기 152개 검토표 · V147','',
  `- 기준 빌드: ${rows[0].build} / 로컬 후보. Production 반영 여부와 별도.`,
  '- 벤치마킹 링크는 분석·해석 기준이다. 152개 외부 사이트를 새로 방문했다거나 모든 원자료를 최신화했다는 뜻이 아니다.',
  '- 자료 부족은 빈 차트로 채우지 않는다. 실제 숫자가 없는 정책·기관 자료는 검색·분류표가 주 분석이다.',
  '- 소스 검산은 아래에 명시된 범위만 완료 판정하며, 기타 데이터는 기존 검산과 이번 회귀 검사를 구분한다.','',
  '| 코드 | 데이터 | 사용자가 확인할 질문 | 분석 / 이번 보완 | 실제 기본 화면 | 기준 사례 |',
  '|---|---|---|---|---|---|',
  ...rows.map(r=>`| ${r.elementId} | ${clean(r.title)} | ${clean(r.question)} | ${clean(changed[r.elementId]||r.requiredAnalysis)} | ${clean(r.headings.join(' · ') || '상태·목록 안내')} | [${clean(r.benchmark[0])}](${r.benchmark[1]}) |`),
  '', '## 이번 원자료-화면 대조','',
  '| 코드 | 범위 | 확인 항목 수 | 결과 |','|---|---|---:|---|',
  ...evidence.numericChecks.map(r=>`| ${r.id} | ${r.scope} | ${r.cells} | ${r.pass?'일치':'불일치'} |`),
  '', '## 판정 경계','',
  '- 152개 로딩 성공이나 차트 수를 데이터 분석 적합성의 단독 근거로 쓰지 않는다.',
  '- 단일 시점은 같은 조건의 비교표·막대, 연도별 수치는 시계열, 계획·문서는 조건표·연대기, 기관·사업은 필터·목록으로 구분했다.',
  '- B-017 평가구역 경계, B-023/025/028 유역 경계 부재는 이 상세 분석 작업으로 해결되지 않았다.',
  '- B-039 전국 개소 수/MW 충돌 항목은 원자료 확인 전 비교 제외. 원자료 파일을 임의 수정하지 않았다.',
  '- 이번 로컬 검증은 GitHub Linux CI·Preview·Production 검증을 대체하지 않는다.',''
].join('\n'));
console.log(JSON.stringify({routes:rows.length,changed:Object.keys(changed).length,build:rows[0].build,numericChecks:evidence.numericChecks.length,cells:evidence.numericChecks.reduce((n,r)=>n+r.cells,0)}));
