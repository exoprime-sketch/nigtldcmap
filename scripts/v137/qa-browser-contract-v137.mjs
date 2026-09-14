/** Read-only browser QA helpers. They do not judge data meaning or edit app state.
 * Input is sent through Chrome's Input domain; DOM evaluation only reads state,
 * reads hit targets, or scrolls an existing control into the viewport.
 */
import { createHash } from 'node:crypto';

export class QaHarnessError extends Error {
  constructor(message, detail = {}) { super(message); this.name = 'QaHarnessError'; this.detail = detail; }
}

export async function evaluateQa(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true});
  if (r.exceptionDetails) {
    throw new QaHarnessError(r.exceptionDetails.exception?.description || r.exceptionDetails.text || 'QA expression failed');
  }
  if (!r.result) throw new QaHarnessError('CDP result missing');
  return r.result.value;
}

// This deliberately returns body. Its omission made every old before/after
// comparison undefined === undefined, and caused body.includes() to throw.
export const READ_SCREEN = `(() => {
  const visible = el => {
    if (!(el instanceof Element)) return false;
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
  };
  const clean = v => String(v || '').replace(/\\s+/gu,' ').trim();
  const txt = el => clean(el?.innerText ?? el?.textContent);
  const main = document.querySelector('main') || document.body;
  const analysis = document.querySelector('[data-testid="public-analysis-root"]');
  const fullBody = txt(main);
  const path = el => {
    const parts = [];
    for (let n=el; n && n.nodeType===1; n=n.parentElement) {
      if (n.id && document.querySelectorAll('#'+CSS.escape(n.id)).length===1) {
        parts.unshift('#'+CSS.escape(n.id)); break;
      }
      const tag=n.tagName.toLowerCase();
      const siblings=n.parentElement ? [...n.parentElement.children].filter(x=>x.tagName===n.tagName) : [n];
      parts.unshift(tag+':nth-of-type('+(siblings.indexOf(n)+1)+')');
    }
    return parts.join(' > ');
  };
  const selects=[...main.querySelectorAll('select')].filter(visible).map(s=>({
    selector:path(s), id:s.id || null,
    label:clean(s.getAttribute('aria-label') ||
      s.labels?.[0]?.querySelector('span')?.textContent ||
      s.labels?.[0]?.childNodes?.[0]?.textContent || s.getAttribute('name') || ''),
    dimensionKey:s.getAttribute('data-public-dimension-key'),
    testId:s.getAttribute('data-testid'),
    value:s.value, shown:txt(s.selectedOptions[0]), disabled:s.disabled, multiple:s.multiple,
    options:[...s.options].map(o=>({value:o.value,label:txt(o),disabled:o.disabled || (o.parentElement?.tagName==='OPTGROUP' && o.parentElement.disabled)}))
  }));
  const texts = selector => [...main.querySelectorAll(selector)].filter(visible).map(txt).filter(Boolean);
  return {
    schema:'nigt-screen-snapshot-1', url:location.href,
    title:txt(main.querySelector('h1')), body:fullBody.slice(0,200000), bodyTruncated:fullBody.length>200000,
    bodyLength:fullBody.length, viewport:{width:innerWidth,height:innerHeight},
    analysisState:analysis?.getAttribute('data-analysis-state') || null,
    analysisElementId:analysis?.getAttribute('data-element-id') || null,
    pendingCount:document.querySelectorAll('[data-testid="public-analysis-pending"]').length,
    busyCount:analysis?.querySelectorAll('[aria-busy="true"]').length || 0,
    headings:texts('h2,h3,h4,h5'), selects,
    // No assumption that a unit must be in an h5, or that every dataset is numeric.
    kpis:texts('[data-testid="public-context-kpis"] article, [data-testid="public-metric-cards"] article, [data-portfolio-kpi]'),
    chartTexts:texts('svg text, [class*="contract-bars"] > *, [data-testid*="portfolio-year"]'),
    tableRows:texts('tbody tr').slice(0,200),
    emptyNotices:texts('[data-public-empty-reason], .sv125-empty, [role="status"]'),
    canvasCount:[...main.querySelectorAll('canvas')].filter(visible).length,
    horizontalOverflow:document.documentElement.scrollWidth > innerWidth+2
  };
})()`;

export function assertSnapshot(s) {
  if (!s || typeof s.body !== 'string' || !Array.isArray(s.selects) || !Array.isArray(s.headings)) {
    throw new QaHarnessError('SCREEN_SNAPSHOT_CONTRACT_BROKEN: body/selects/headings required');
  }
  return s;
}
export async function readScreen(cdp) { return assertSnapshot(await evaluateQa(cdp, READ_SCREEN)); }

export async function waitQa(cdp, expression, {timeoutMs=20000, pollMs=100}={}) {
  const start=Date.now(); let value;
  while (Date.now()-start<timeoutMs) {
    value=await evaluateQa(cdp,expression);
    if (value) return value;
    await new Promise(r=>setTimeout(r,pollMs)); // polling interval, not a fixed readiness sleep
  }
  throw new QaHarnessError('QA_CONDITION_TIMEOUT', {timeoutMs,lastValue:value});
}
export async function waitAnalysisReady(cdp, timeoutMs=45000) {
  return waitQa(cdp,`(() => {
    const r=document.querySelector('[data-testid="public-analysis-root"]');
    return Boolean(r && r.getAttribute('data-analysis-state')==='ready' &&
      !r.querySelector('[data-testid="public-analysis-pending"]') &&
      !r.querySelector('[aria-busy="true"]'));
  })()`,{timeoutMs});
}

const KEYS={Escape:27,Home:36,ArrowDown:40,Tab:9,Enter:13,ArrowUp:38};
export async function pressKey(cdp,key) {
  if (!KEYS[key]) throw new QaHarnessError('Unsupported QA key',{key});
  const p={key,code:key,windowsVirtualKeyCode:KEYS[key],nativeVirtualKeyCode:KEYS[key]};
  await cdp.send('Input.dispatchKeyEvent',{...p,type:'keyDown'});
  await cdp.send('Input.dispatchKeyEvent',{...p,type:'keyUp'});
}
export async function pointerClick(cdp,x,y) {
  if (![x,y].every(Number.isFinite)) throw new QaHarnessError('Invalid pointer coordinate');
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y,button:'none',buttons:0,pointerType:'mouse'});
  await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1,pointerType:'mouse'});
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',buttons:0,clickCount:1,pointerType:'mouse'});
}

export async function selectByKeyboard(cdp, selector, targetValue, {timeoutMs=15000,maxKeyPresses=400}={}) {
  if (typeof selector!=='string' || !selector) throw new QaHarnessError('Selector required');
  const q=JSON.stringify(selector), v=JSON.stringify(String(targetValue));
  const inspect=`(() => {
    const all=document.querySelectorAll(${q});
    if(all.length!==1) return {count:all.length};
    const s=all[0];
    if(!(s instanceof HTMLSelectElement)) return {count:1,notSelect:true};
    return {count:1,value:s.value,multiple:s.multiple,disabled:s.disabled,
      options:[...s.options].map(o=>({value:o.value,disabled:o.disabled ||
        (o.parentElement?.tagName==='OPTGROUP' && o.parentElement.disabled)}))};
  })()`;
  const before=await evaluateQa(cdp,inspect);
  if(before.count!==1 || before.notSelect) throw new QaHarnessError('Native select target is not unique',before);
  if(before.disabled || before.multiple) return {status:'UNSUPPORTED_CONTROL',before};
  const enabled=before.options.filter(o=>!o.disabled);
  const matches=enabled.filter(o=>o.value===String(targetValue));
  if(matches.length!==1) throw new QaHarnessError('Target option missing or ambiguous',{before,targetValue});
  const ordinal=enabled.findIndex(o=>o.value===String(targetValue));
  if(ordinal>maxKeyPresses) return {status:'UNSUPPORTED_LONG_SELECT',ordinal};
  if(before.value===String(targetValue)) return {status:'ALREADY_SELECTED',before,after:before};

  // Scroll is the only DOM mutation. No setter, selectedIndex, dispatchEvent,
  // React hook, hidden test button, or synthetic change event is used.
  await evaluateQa(cdp,`document.querySelector(${q}).scrollIntoView({block:'center',inline:'nearest',behavior:'instant'})`);
  const target=await waitQa(cdp,`(() => {
    const s=document.querySelector(${q}); if(!s) return false;
    const r=s.getBoundingClientRect(); if(r.width<2 || r.height<2) return false;
    const x=r.left+r.width/2, y=r.top+r.height/2;
    if(x<0 || y<0 || x>=innerWidth || y>=innerHeight) return false;
    const hit=document.elementFromPoint(x,y);
    return hit===s || s.contains(hit) ? {x,y} : false;
  })()`,{timeoutMs});
  await pointerClick(cdp,target.x,target.y);
  await pressKey(cdp,'Escape'); // close the native option popup, retaining focus
  const focused=await evaluateQa(cdp,`document.activeElement===document.querySelector(${q})`);
  if(!focused) throw new QaHarnessError('Pointer did not focus the select',{selector,target});
  await pressKey(cdp,'Home');
  for(let i=0;i<ordinal;i++) await pressKey(cdp,'ArrowDown');
  await pressKey(cdp,'Tab'); // commit via native blur; do not submit a containing form
  await waitQa(cdp,`document.querySelector(${q})?.value===${v}`,{timeoutMs});
  const after=await evaluateQa(cdp,inspect);
  return {status:'CONTROL_CHANGED',before,after,targetValue:String(targetValue),method:'CDP_POINTER_AND_KEYBOARD',keyPresses:ordinal+3};
}

export function observedDataHash(s) {
  assertSnapshot(s);
  return createHash('sha256').update(JSON.stringify({kpis:s.kpis,charts:s.chartTexts,rows:s.tableRows})).digest('hex');
}
export function classifyObservation(before,after,input) {
  assertSnapshot(before); assertSnapshot(after);
  const changed=observedDataHash(before)!==observedDataHash(after);
  // The same numeric output may be correct for two options. A changed label may
  // also mask an unfiltered table. Neither is a semantic verdict.
  return {inputStatus:input.status,observedDataChanged:changed,
    semanticReview:'PENDING',filterSemantics:'PENDING_EXPECTED_RESULT',
    note:changed?'Observed data surface changed; source-based check still required.':'No observed data-surface change; not a product failure without a source-based expectation.'};
}
