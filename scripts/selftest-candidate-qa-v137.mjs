#!/usr/bin/env node
/** QA-tool tests, not platform QA. Uses the repo's Chrome launcher by default.
 * QA_CDP_WS is optional: use a fresh, dedicated local QA tab only. The fixture replaces that tab content.
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readScreen,assertSnapshot,waitAnalysisReady,selectByKeyboard,evaluateQa,waitQa,classifyObservation} from './v137/qa-browser-contract-v137.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const out=resolve(root,'reports/final-data-integration/qa-harness-selftest');
mkdirSync(out,{recursive:true});
const html=`<!doctype html><meta charset="utf-8"><style>body{font:18px sans-serif}main{padding:30px}select{font-size:18px;width:250px;height:44px}</style>
<main><h1>QA 도구 자체검증 전용</h1><section data-testid="public-analysis-root" data-analysis-state="ready">
<label><span>검증 항목</span><select id="fixture-select"><option value="a">첫 값</option><option value="off" disabled>선택 불가</option><option value="b">둘째 값</option><option value="c">같은 수치의 다른 조건</option></select></label>
<section data-testid="public-context-kpis"><article id="answer">값 10 단위 건</article></section></section></main>
<script>
window.events=[];const r=document.querySelector('[data-testid="public-analysis-root"]');
document.querySelector('select').addEventListener('change',e=>{
 window.events.push({type:e.type,isTrusted:e.isTrusted,value:e.target.value});
 const v=e.target.value;
 r.setAttribute('aria-busy','true');
 if(!document.getElementById('pending')){const p=document.createElement('span');p.id='pending';p.dataset.testid='public-analysis-pending';p.textContent='불러오는 중';r.append(p);}
 setTimeout(()=>{document.getElementById('answer').textContent='값 '+(v==='a'?10:20)+' 단위 건';document.getElementById('pending')?.remove();r.setAttribute('aria-busy','false');},120);
});</script>`;
async function connect(url){
 const ws=new WebSocket(url);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
 let id=0;const pending=new Map();
 ws.addEventListener('message',e=>{const m=JSON.parse(String(e.data));if(!m.id)return;const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result||{});});
 return {send(method,params={}){return new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(new Error('CDP timeout '+method));},30000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}));});},close(){ws.close();}};
}
const tests=[];let browser,cdp,owns=false;
function record(name,fn){try{fn();tests.push({name,status:'PASS'});}catch(e){tests.push({name,status:'FAIL',error:String(e)});throw e;}}
try{
 if(process.env.QA_CDP_WS){cdp=await connect(process.env.QA_CDP_WS);}else{const runtime=await import('./v125/browser-runtime.mjs');browser=await runtime.launchHeadlessBrowser();cdp=browser.cdp;owns=true;}
 await cdp.send('Page.enable');await cdp.send('Runtime.enable');
 const tree=await cdp.send('Page.getFrameTree');
 await cdp.send('Page.setDocumentContent',{frameId:tree.frameTree.frame.id,html});
 await waitQa(cdp,`Boolean(document.getElementById('fixture-select'))`);
 await waitAnalysisReady(cdp);const before=await readScreen(cdp);
 record('SNAPSHOT_RETURNS_BODY',()=>assert.ok(before.body.includes('값 10')));
 record('MISSING_BODY_REJECTED',()=>assert.throws(()=>assertSnapshot({selects:[],headings:[]}),/CONTRACT_BROKEN/));
 record('EMPTY_DATA_NOT_FABRICATED',()=>assert.equal(before.kpis.length,1));
 const input=await selectByKeyboard(cdp,'#fixture-select','b');
 record('POINTER_KEYBOARD_CHANGES_NATIVE_VALUE',()=>assert.equal(input.after.value,'b'));
 record('DISABLED_OPTION_SKIPPED',()=>assert.equal(input.status,'CONTROL_CHANGED'));
 await waitAnalysisReady(cdp);const after=await readScreen(cdp);
 record('ASYNC_PENDING_MARKER_SETTLES',()=>assert.equal(after.pendingCount,0));
 record('ACTUAL_VALUE_CHANGED',()=>assert.ok(after.body.includes('값 20')));
 const events=await evaluateQa(cdp,'window.events');
 record('TRUSTED_NATIVE_CHANGE_EVENT',()=>assert.ok(events.some(e=>e.value==='b'&&e.isTrusted)));
 record('AUTOMATION_DOES_NOT_CLAIM_SEMANTIC_PASS',()=>assert.equal(classifyObservation(before,after,input).semanticReview,'PENDING'));
 const second=await selectByKeyboard(cdp,'#fixture-select','c');await waitAnalysisReady(cdp);const same=await readScreen(cdp);
 record('SAME_OUTPUT_IS_NOT_AUTOMATIC_FAILURE',()=>{const c=classifyObservation(after,same,second);assert.equal(c.observedDataChanged,false);assert.equal(c.filterSemantics,'PENDING_EXPECTED_RESULT');});
 const shot=await cdp.send('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(out,'fixture-only.png'),Buffer.from(shot.data,'base64'));
}catch(e){tests.push({name:'UNEXPECTED_TEST_ERROR',status:'FAIL',error:String(e)});process.exitCode=1;}
finally{
 if(owns&&browser)await browser.close();else if(cdp)cdp.close();
 const report={scope:'QA HELPER SELFTEST ONLY — NOT LIVE PLATFORM QA',generatedAt:new Date().toISOString(),passed:tests.filter(x=>x.status==='PASS').length,failed:tests.filter(x=>x.status==='FAIL').length,tests};
 writeFileSync(resolve(out,'selftest.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
