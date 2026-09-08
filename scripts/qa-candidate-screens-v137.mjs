#!/usr/bin/env node
/** Evidence collection over the candidate build — NOT a semantic acceptance gate.
 * Replaces the 8c9a8ec collector whose READ_SCREEN did not return body.
 * Uses the project's existing Chrome transport, no new package dependencies.
 * Default: seven-route pilot. --all visits all catalog routes, with bounded
 * native-select interactions and per-route evidence. Meaning remains PENDING.
 */
import {mkdirSync,writeFileSync,readFileSync,existsSync,readdirSync,statSync,appendFileSync} from 'node:fs';
import {resolve,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {startStaticBuildServer,launchHeadlessBrowser,navigate,setViewport} from './v125/browser-runtime.mjs';
import {readScreen,waitAnalysisReady,selectByKeyboard,classifyObservation,QaHarnessError} from './v137/qa-browser-contract-v137.mjs';

const ROOT=resolve(fileURLToPath(new URL('..',import.meta.url)));
const argv=process.argv.slice(2);
function opt(name,fallback){const i=argv.indexOf(name);return i<0?fallback:argv[i+1];}
const BUILD=resolve(ROOT,opt('--build-root','.verify/candidate/build'));
const width=Number(opt('--width','1440')),height=Number(opt('--height','1000'));
const maxSelects=Number(opt('--max-selects','2'));
if(!Number.isInteger(width)||width<320||!Number.isInteger(height)||height<300||!Number.isInteger(maxSelects)||maxSelects<0||maxSelects>20)throw new Error('Invalid viewport/selector bound');
const DATA=resolve(BUILD,'data/vietnam/v2');
const readJson=p=>JSON.parse(readFileSync(p,'utf8'));
const digest=b=>createHash('sha256').update(b).digest('hex');
function walk(root){return readdirSync(root,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en')).flatMap(e=>{const p=resolve(root,e.name);if(e.isSymbolicLink())throw new Error('Candidate must not contain symlinks');return e.isDirectory()?walk(p):[p];});}
function treeHash(root){const hash=createHash('sha256');for(const p of walk(root)){hash.update(relative(root,p).split(sep).join('/'));hash.update('\0');hash.update(digest(readFileSync(p)));hash.update('\n');}return hash.digest('hex');}
const required=['index.html','data/vietnam/v2/manifest.json','data/vietnam/v2/catalog.json','data/vietnam/v2/semantic/indicator-semantics-v125.json'];
for(const p of required){const full=resolve(BUILD,p);if(!existsSync(full)||statSync(full).size===0)throw new Error('CANDIDATE_ASSET_MISSING: '+p);if(p.endsWith('.json'))readJson(full);}
const catalog=readJson(resolve(DATA,'catalog.json'));
if(!Array.isArray(catalog.elements))throw new Error('CATALOG_CONTRACT: elements array missing');
const ids=catalog.elements.map(e=>e.elementId);
if(new Set(ids).size!==ids.length)throw new Error('CATALOG_CONTRACT: duplicate IDs');
const selected=argv.includes('--all')?ids:String(opt('--ids','A-016,B-005,D-011,A-017,B-034,D-022,D-025')).split(',').map(x=>x.trim()).filter(Boolean);
if(selected.some(id=>!ids.includes(id)))throw new Error('Requested element outside candidate catalog');
const manifest=readJson(resolve(DATA,'manifest.json'));
const fingerprint=treeHash(DATA);
const runId=new Date().toISOString().replace(/[:.]/g,'-')+'-'+fingerprint.slice(0,12);
const OUT=resolve(ROOT,opt('--out','reports/final-data-integration/qa-verified'),runId);
mkdirSync(resolve(OUT,'screenshots'),{recursive:true});mkdirSync(resolve(OUT,'snapshots'),{recursive:true});
let sourceSha='UNKNOWN';try{sourceSha=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();}catch{}
const staticAssets=walk(resolve(BUILD,'static')).filter(p=>/\.(js|css)$/.test(p)).map(p=>({path:relative(BUILD,p).split(sep).join('/'),sha256:digest(readFileSync(p))}));
const environment={schema:'nigt-evidence-run-1',runId,startedAt:new Date().toISOString(),sourceSha,
 buildRoot:relative(ROOT,BUILD).split(sep).join('/'),dataFingerprint:fingerprint,staticAssets,viewport:{width,height},
 requestedElementCount:selected.length,catalogElementCount:ids.length,mode:argv.includes('--all')?'ALL_ROUTES_BOUNDED_INTERACTIONS':'PILOT',
 maxSelectorsPerRoute:maxSelects,productionUpdated:false,liveProductionQA:'NOT_RUN',
 candidatePromotionBlocked:manifest.promotionBlocked??'NOT_DECLARED',
 semanticReview:'PENDING',testMeaning:'Controls and observed content are recorded. No expected-result oracle supplied: data correctness is not passed.'};
writeFileSync(resolve(OUT,'environment.json'),JSON.stringify(environment,null,2));

let server=null,browser=null;const rows=[];let fatal=null;
function persistRow(row){rows.push(row);appendFileSync(resolve(OUT,'coverage.ndjson'),JSON.stringify(row)+'\n');writeFileSync(resolve(OUT,'progress.json'),JSON.stringify({completed:rows.length,total:selected.length,next:selected[rows.length]||null,runId},null,2));}
async function screenshot(cdp,name){const r=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const bytes=Buffer.from(r.data,'base64');if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new QaHarnessError('INVALID_SCREENSHOT_PNG');const p=resolve(OUT,'screenshots',name);writeFileSync(p,bytes);return {path:relative(OUT,p).split(sep).join('/'),sha256:digest(bytes),bytes:bytes.length};}
function saveSnapshot(id,state,s){const path=resolve(OUT,'snapshots',`${id}-${state}.json`);writeFileSync(path,JSON.stringify(s,null,2));return relative(OUT,path).split(sep).join('/');}
function csv(rows){const columns=['elementId','visitStatus','inputStatus','meaningReview','expectedResultCheck','evidenceStatus','controlCount','harnessError'];const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';return columns.join(',')+'\n'+rows.map(r=>columns.map(k=>cell(r[k])).join(',')).join('\n')+'\n';}
try{
 server=await startStaticBuildServer(BUILD);browser=await launchHeadlessBrowser();
 const cdp=browser.cdp;await setViewport(cdp,width,height);
 // Asset response validation catches the existing SPA server's HTML-for-JSON
 // fallback. This prevents blaming every route for a broken candidate build.
 for(const path of required.filter(x=>x.endsWith('.json'))){
   const r=await fetch(new URL(path,server.url+'/'),{signal:AbortSignal.timeout(10000)});
   if(!r.ok || !/json/i.test(r.headers.get('content-type')||''))throw new QaHarnessError('ASSET_RESPONSE_NOT_JSON',{path,httpStatus:r.status});
   await r.json();
 }
 for(const id of selected){
   const row={elementId:id,visitStatus:'PENDING',inputStatus:'PENDING',meaningReview:'PENDING',expectedResultCheck:'PENDING',evidenceStatus:'PENDING',controlCount:0,interactions:[],screenshots:[],harnessError:null,pageRuntimeEvents:[]};
   const errorStart=browser.runtimeErrors?.length||0;
   try{
     const url=new URL(server.url+'/');url.searchParams.set('view','data');url.searchParams.set('country','VNM');url.searchParams.set('element',id);url.hash='element-detail';
     await navigate(cdp,url.toString());await waitAnalysisReady(cdp,45000);
     let before=await readScreen(cdp);row.visitStatus='READY_OBSERVED';row.controlCount=before.selects.length;row.defaultSnapshot=saveSnapshot(id,'default',before);
     try{row.screenshots.push(await screenshot(cdp,`${id}-default.png`));}catch(e){row.screenshotError=String(e);}
     const candidates=before.selects.filter(s=>!s.disabled&&!s.multiple&&s.options.some(o=>!o.disabled&&o.value!==s.value)).slice(0,maxSelects);
     if(!candidates.length)row.inputStatus='NO_SUPPORTED_SELECT';
     for(let i=0;i<candidates.length;i++){
       // Re-read after every operation: React may have re-rendered the control.
       const current=await readScreen(cdp);
       const c=current.selects.find(s=>s.selector===candidates[i].selector);
       if(!c){row.interactions.push({status:'CONTROL_CHANGED_STRUCTURE',meaningReview:'PENDING'});continue;}
       const target=c.options.find(o=>!o.disabled&&o.value!==c.value);if(!target)continue;
       const input=await selectByKeyboard(cdp,c.selector,target.value);
       await waitAnalysisReady(cdp,45000);const after=await readScreen(cdp);
       const observed=classifyObservation(current,after,input);
       row.interactions.push({label:c.label,dimensionKey:c.dimensionKey,selector:c.selector,targetLabel:target.label,...input,...observed,snapshot:saveSnapshot(id,'selected-'+i,after)});
       try{row.screenshots.push(await screenshot(cdp,`${id}-selected-${i}.png`));}catch(e){row.screenshotError=String(e);}
     }
     if(candidates.length)row.inputStatus=row.interactions.every(i=>i.status==='CONTROL_CHANGED'||i.status==='ALREADY_SELECTED')?'CONTROL_INPUT_OBSERVED':'PARTIAL_INPUT_OBSERVED';
     row.evidenceStatus=row.screenshots.length?'CAPTURED':'CAPTURE_PENDING';
   }catch(e){row.harnessError={name:e.name,message:e.message,detail:e.detail||null};row.inputStatus='HARNESS_OR_TARGET_UNRESOLVED';row.evidenceStatus=row.screenshots.length?'PARTIAL':'PENDING';}
   row.pageRuntimeEvents=(browser.runtimeErrors||[]).slice(errorStart);persistRow(row);
   process.stderr.write(`${rows.length}/${selected.length} ${id}: ${row.visitStatus} / ${row.inputStatus}; meaning=PENDING\n`);
 }
}catch(e){fatal={name:e.name,message:e.message,detail:e.detail||null};}
finally{
 if(browser)await browser.close();if(server)await server.close();
 const harnessErrors=rows.filter(r=>r.harnessError).length+(fatal?1:0);
 const pageRuntimeEvents=rows.reduce((n,r)=>n+r.pageRuntimeEvents.length,0);
 const summary={...environment,endedAt:new Date().toISOString(),visited:rows.filter(r=>r.visitStatus==='READY_OBSERVED').length,
 completed:rows.length,inputObserved:rows.filter(r=>r.inputStatus==='CONTROL_INPUT_OBSERVED').length,
 meaningReviewed:0,filterExpectedResultPassed:0,evidenceCaptured:rows.filter(r=>r.screenshots.length).length,harnessErrors,pageRuntimeEvents,fatal,
 collectorStatus:harnessErrors?'INCOMPLETE':'COLLECTION_FINISHED',releaseStatus:'NOT_EVALUATED',
 warning:'No unit count, text change, screenshot existence, or input receipt is a semantic PASS.'};
 writeFileSync(resolve(OUT,'coverage.csv'),csv(rows));writeFileSync(resolve(OUT,'summary.json'),JSON.stringify(summary,null,2));
 console.log(JSON.stringify({output:relative(ROOT,OUT),...summary},null,2));
 process.exitCode=harnessErrors?2:pageRuntimeEvents?1:0;
}
