/** Browser evidence is collected through the in-app browser, not by this file.
 * Reuse per-element questions, add multiple primary-source design references,
 * and keep runtime observations separate from expert acceptance requirements. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { reviewedElements } from '../v144/element-review-plan-v144.mjs';

const refs = {
  wdi: ['World Bank WDI', 'https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=VN&view=chart', '국가·연도·지표 선택, 시계열과 데이터표'],
  oecd: ['OECD Data Explorer', 'https://data-explorer.oecd.org/', '통계 차원 선택, 비교와 다운로드'],
  ilo: ['ILOSTAT', 'https://ilostat.ilo.org/dataviz/getyouth/', '연령·성별·추정기준을 구분한 노동 통계'],
  iea: ['IEA Energy Statistics Data Browser', 'https://www.iea.org/data-and-statistics/data-tools/energy-statistics-data-browser', '에너지원별 규모·구성·연도 분석'],
  irena: ['IRENA Renewable Power Generation Costs', 'https://www.irena.org/Digital-Report/Renewable-Power-Generation-Costs-in-2024', '기술별 단위 비용과 범위·시점 구분'],
  edgar: ['EDGAR', 'https://edgar.jrc.ec.europa.eu/emissions_data_and_maps', '가스·부문별 배출 추이와 지도'],
  cw: ['WRI Climate Watch', 'https://wri-sites.s3.us-east-1.amazonaws.com/climatewatch.org/www.climatewatch.org/climate-watch/wri_metadata/CW_GHG_Method_Note.pdf', '온실가스 집계 범위·단위·원천 구분'],
  cckp: ['World Bank CCKP', 'https://climateknowledgeportal.worldbank.org/guidance-note', '관측·전망, 지역·기간·시나리오별 분석'],
  copernicus: ['Copernicus Climate Atlas', 'https://climate.copernicus.eu/copernicus-interactive-climate-atlas-guide-powerful-new-c3s-tool', '선택 변수의 공간 분포·시계열·기준기간 연결'],
  gfw: ['Global Forest Watch', 'https://content.globalforestwatch.org/wp-content/uploads/2020/09/GFW-User-Guide-English.pdf', '선택 지역 지도와 산림 변화 분석'],
  fra: ['FAO Forest Resources Assessment', 'https://www.fao.org/forest-resources-assessment/data/', '산림 정의·분류·기간별 비교'],
  aqueduct: ['WRI Aqueduct', 'https://www.wri.org/aqueduct/help-center/water-risk-indicators', '물 위험 평가구역과 지표·등급 구분'],
  aquastat: ['FAO AQUASTAT', 'https://www.fao.org/land-water/resources/tools/databases/aquastat/en', '수자원·취수·관측 단위별 표와 시계열'],
  gcf: ['GCF Open Data Library', 'https://data.greenclimate.fund/public', '사업별 승인·집행·기간·분야와 지리적 범위'],
  wbprojects: ['World Bank Projects & Operations', 'https://datacatalog.worldbank.org/search/dataset/0037800/world-bank-projects-operations', '국가·분야·상태·금액별 사업 탐색'],
  oda: ['OECD ODA at a glance', 'https://www.oecd.org/en/data/dashboards/official-development-assistance-at-a-glance.html', '공여자·수원국·분야별 규모와 구성'],
  laws: ['Climate Change Laws of the World', 'https://climate-laws.org/', '문서·관할·유형·시행시점 중심 탐색'],
  policies: ['IEA Policies database', 'https://www.iea.org/policies', '국가·연도·시행상태·관할을 구분한 정책표'],
  ndc: ['UNFCCC NDC Registry', 'https://unfccc.int/NDCREG', '국가·버전·상태·제출일과 원문'],
  nde: ['CTCN NDE / technical assistance directory', 'https://www.ctc-n.org/file-download/download/public/25589', '기관 역할·기술지원·국가 구분 (디렉터리 구조 참고, 연락처 최신화 자료 아님)'],
  dna: ['UNFCCC Designated National Authorities', 'https://unfccc.int/es/node/627860', '기관·주소·담당자·승인 역할 구분'],
  wipo: ['WIPO IP Statistics', 'https://www.wipo.int/en/web/ip-statistics/about', '특허·출원주체·연도·기술 분류와 누락 처리'],
  uis: ['UNESCO UIS Data Browser', 'https://databrowser.uis.unesco.org/', '국가·지표별 선·막대 차트, 인력·투자·성별과 지표 분모 구분'],
  gem: ['Global Energy Monitor GIPT', 'https://globalenergymonitor.org/projects/global-integrated-power-tracker', '발전소명·발전원·설비용량·상태·위치'],
  wri: ['WRI Global Power Plant Database', 'https://datasets.wri.org/datasets/global-power-plant-database', '시설별 용량·발전원·소유·기준연도, 원천 범위'],
  resource: ['Resource Watch', 'https://resourcewatch.org/about/howto', '레이어 중첩·대상 속성·자료정보 연결'],
  wto: ['WTO Merchandise Trade', 'https://data.wto.org/dataset/commerchandise', '수출·수입·금액·물량과 연간/분기 구분'],
  portal: ['공공데이터포털', 'https://www.data.go.kr/tcs/dss/selectDataSetList.do', '검색조건·자료기간·제공기관·다운로드 명칭'],
  solar: ['Global Solar Atlas', 'https://globalsolaratlas.info/', '위치별 일사·태양광 지표 구분'],
  wind: ['Global Wind Atlas', 'https://globalwindatlas.info/about/dataset', '풍속·풍력밀도와 측정 높이 구분'],
};
// Repeated data families deliberately share proven interaction patterns. They
// do not inherit another element's numbers, chart validity, or acceptance.
const families = {
  wdi:['wdi','oecd'], ilo:['ilo','wdi'], energy:['iea','irena'], emissions:['edgar','cw'],
  climate:['cckp','copernicus'], forest:['gfw','fra'], water:['aqueduct','aquastat'],
  projects:['wbprojects','gcf'], oda:['oda','gcf'], cost:['irena','iea'],
  policy:['laws','policies'], unfccc:['ndc','policies'], directory:['nde','dna'],
  wipo:['wipo','uis'], resource:['resource','gem'], trade:['wto','wdi'],
  portal:['portal','policies'], solar:['solar','wind'],
};
const overrides = { 'A-023':['gem','wri'], 'A-024':['resource','iea'], 'B-042':['wind','resource'], 'E-009':['uis','ilo'], 'C-016':['policies','resource'], 'D-018':['gcf','wbprojects'] };
const evidencePath = resolve('output/public-review-20260918/v148/browser-review-v148.json');
const evidence = JSON.parse(readFileSync(evidencePath,'utf8'));
const layers = JSON.parse(readFileSync(resolve('public/data/vietnam/v2/map-index.json'),'utf8')).layers;
const rows = reviewedElements.map((plan) => {
  const runtime = evidence.routes.find((r) => r.id === plan.elementId);
  const layer = layers.find((l) => l.elementId === plan.elementId);
  return { ...plan, references: (overrides[plan.elementId] || families[plan.benchmark]).map((k) => ({ name:refs[k][0],url:refs[k][1],pattern:refs[k][2] })),
    runtime:runtime || null, smallMapExpected:Boolean(layer),
    mapInterpretation:layer?.mapTargetV138?.limitation || layer?.publicSpatialNotice || null,
    verificationBoundary:'실제 기본 화면·기록된 상호작용 검증. 152개 원천의 최신성 재승인이나 모든 필터 조합 검증은 아님.' };
});
if (rows.length !== 152 || new Set(rows.map(r=>r.elementId)).size !== 152) throw Error('152개 항목 필요');
if (rows.some(r=>r.references.length < 2 || !r.publicQuestion)) throw Error('개별 질문·복수 참고 누락');
const issues = rows.filter(r=>!r.runtime || r.runtime.state !== 'ready' || r.runtime.overflow || (r.smallMapExpected && !r.runtime.map));
const output=resolve('reports/v148'); mkdirSync(output,{recursive:true});
const report={ generatedAt:new Date().toISOString(), scope:'local candidate', count:rows.length, mapCount:layers.length, issues:issues.map(r=>r.elementId), rows, interactions:evidence.interactions, responsive:evidence.responsive, consoleErrors:evidence.consoleErrors };
writeFileSync(resolve(output,'detail-and-map-review-152-v148.json'),JSON.stringify(report,null,2)+'\n');
const clean=(s)=>String(s||'').replaceAll('|','／').replaceAll('\n',' ');
writeFileSync(resolve(output,'detail-and-map-review-152-v148.md'),[
  '# 152개 상세보기 · 지도 검토 V148','',
  '- 벤치마킹은 자료 유형별 복수 공식 사례를 대조하고, 각 항목 고유의 질문·분석·해석 조건에 연결했다. 152개 별도 사이트를 조사했다는 의미가 아니다.',
  '- 지도 42개 연결. B-017 원래 평가구역 경계와 B-023/025/028 유역 경계는 새로 확보하지 않았으며, 임의 경계를 생성하지 않는다.',
  '- 기본 경로 확인과 전문가 분석 충족은 별개이다. 관측한 제목·표·선택 변화는 JSON 근거에 남기고, 자료 제약과 미검증 조합은 완료 수치에 섞지 않는다.','',
  '| 항목 | 사용자가 확인할 질문 | 분석 구성 | 해석 원칙 | 복수 참고 사례 | 작은 지도 | 기본 화면 |',
  '|---|---|---|---|---|---|---|',
  ...rows.map(r=>`| ${r.elementId} | ${clean(r.publicQuestion)} | ${clean(r.requiredAnalysis)} | ${clean(r.interpretationRule)} | ${r.references.map(x=>`[${x.name}](${x.url})`).join(' · ')} | ${r.runtime?.map ? '표시 확인' : r.smallMapExpected ? '미확인' : '대상 아님'} | ${r.runtime?.state || '미확인'} |`),
  '',`기본 경로·지도·넘침 점검 잔여: ${issues.map(r=>r.elementId).join(', ') || '없음'}`,'',
].join('\n'));
console.log(JSON.stringify({count:rows.length,mapCount:layers.length,issues:issues.map(r=>r.elementId)}));
