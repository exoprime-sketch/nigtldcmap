/**
 * V156-D: the public set and the framework set, for audits and QA.
 *
 * The framework stays at the catalog's full length (152 for Viet Nam). An
 * element the project decided not to offer (publicStatus "excluded", or
 * "not-provided") is in no list, search, count, home card or download; its own
 * URL stays and shows one notice card with the decision, the reason and the
 * date. Audits that walk what the public sees use the public set derived here;
 * audits that account for the framework keep the full catalog. No count is
 * written as a literal: both are derived from catalog.json.
 */

export const NON_PUBLIC_STATUSES_V156 = Object.freeze(["excluded", "not-provided"]);

export function isPubliclyListedV156(element) {
  return !NON_PUBLIC_STATUSES_V156.includes(String(element?.publicStatus || ""));
}

/** Elements a reader can find: every list, search, count and home card uses this set. */
export function publicListedElementsV156(elements) {
  return (Array.isArray(elements) ? elements : []).filter(isPubliclyListedV156);
}

/** Elements decided not to be offered; each keeps a notice page. */
export function excludedElementsV156(elements) {
  return (Array.isArray(elements) ? elements : []).filter((element) => !isPubliclyListedV156(element));
}

export function excludedElementIdsV156(elements) {
  return excludedElementsV156(elements).map((element) => String(element.elementId));
}

/**
 * What an excluded element's detail URL shows. Everything is read inside the
 * page's own container, so the site header (which links to the download page)
 * is not mistaken for a download offer.
 */
export const EXCLUDED_NOTICE_SNAPSHOT_V156 = `(() => {
  const page = document.querySelector('[data-detail-excluded-v156="true"]');
  const card = document.querySelector('[data-testid="detail-excluded-v156"]');
  const field = (name) => (card?.querySelector('[data-exclusion-field="' + name + '"]')?.textContent || '').replace(/\\s+/g, ' ').trim();
  const within = (selector) => (page ? page.querySelectorAll(selector).length : 0);
  const downloadNodes = page
    ? [...page.querySelectorAll('a, button')].filter((node) => /download|다운로드|내려받/iu.test(((node.getAttribute('href') || '') + ' ' + (node.getAttribute('data-testid') || '') + ' ' + (node.textContent || ''))))
    : [];
  return {
    page: Boolean(page),
    notice: Boolean(card),
    decision: field('decision'),
    reason: field('reason'),
    decidedAt: field('decidedAt'),
    charts: within('svg[role="img"], canvas, [data-analysis-block], [data-chart-axes]'),
    tables: within('table'),
    downloadLinks: downloadNodes.length,
    analysisRoot: Boolean(document.querySelector('[data-testid="public-analysis-root"]')),
  };
})()`;

/** A notice page passes when it states all three facts and offers nothing else. */
export function excludedNoticeVerdictV156(snapshot, decision) {
  const problems = [];
  if (!snapshot?.page || !snapshot?.notice) problems.push("notice card missing");
  if (!snapshot?.decision) problems.push("decision missing");
  if (!snapshot?.reason) problems.push("reason missing");
  if (decision?.reason && snapshot?.reason && !snapshot.reason.includes(decision.reason)) problems.push("reason differs from the decision file");
  if (!snapshot?.decidedAt) problems.push("decision date missing");
  if (decision?.decidedAt && snapshot?.decidedAt && !snapshot.decidedAt.includes(decision.decidedAt)) problems.push("date differs from the decision file");
  if (Number(snapshot?.charts || 0) !== 0) problems.push(`charts ${snapshot.charts}`);
  if (Number(snapshot?.tables || 0) !== 0) problems.push(`tables ${snapshot.tables}`);
  if (Number(snapshot?.downloadLinks || 0) !== 0) problems.push(`download links ${snapshot.downloadLinks}`);
  if (snapshot?.analysisRoot) problems.push("analysis rendered");
  return { pass: problems.length === 0, problems };
}

/**
 * Opens every excluded element's detail URL and returns one row per element.
 * The runtime helpers are passed in so every CDP-based audit can share this.
 */
export async function auditExcludedNoticesV156({ cdp, baseUrl, elements, detailUrl, navigate, waitForValue, evaluateValue, onPage = null, timeoutMs = 25_000 }) {
  const rows = [];
  for (const element of excludedElementsV156(elements)) {
    const elementId = String(element.elementId);
    try {
      await navigate(cdp, detailUrl(baseUrl, elementId));
      await waitForValue(cdp, `Boolean(document.querySelector('[data-testid="detail-excluded-v156"]'))`, { timeoutMs });
      const snapshot = await evaluateValue(cdp, EXCLUDED_NOTICE_SNAPSHOT_V156);
      // A caller may also read the page for its own purpose (e.g. the glossary inventory).
      if (onPage) await onPage(elementId);
      rows.push({ elementId, ...excludedNoticeVerdictV156(snapshot, element.exclusion), snapshot });
    } catch (error) {
      rows.push({ elementId, pass: false, problems: [error instanceof Error ? error.message : String(error)], snapshot: null });
    }
  }
  return rows;
}
