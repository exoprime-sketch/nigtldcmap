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
    publicNotice: field('publicNotice'),
    cardText: (card?.textContent || '').replace(/\\s+/g, ' ').trim(),
    decisionFields: card ? card.querySelectorAll('[data-exclusion-field="decision"], [data-exclusion-field="reason"], [data-exclusion-field="decidedAt"]').length : 0,
    charts: within('svg[role="img"], canvas, [data-analysis-block], [data-chart-axes]'),
    tables: within('table'),
    downloadLinks: downloadNodes.length,
    analysisRoot: Boolean(document.querySelector('[data-testid="public-analysis-root"]')),
  };
})()`;

/**
 * A notice page passes when it states the decision's public line and nothing
 * of the decision record, and offers nothing else.
 *
 * V156-E (2026-09-29, 기준서 v1.1 표 13): the card is the title plus one public
 * line (`exclusion.publicNotice`). The former checks that the decision, the
 * reason and the date were shown and matched the decision file are replaced by
 * the reverse - the public line is shown and matches, and the record (reason,
 * basis, date, and the 결정·사유·결정일 labels) is not shown.
 */
export function excludedNoticeVerdictV156(snapshot, decision) {
  const problems = [];
  if (!snapshot?.page || !snapshot?.notice) problems.push("notice card missing");
  if (!snapshot?.publicNotice) problems.push("public notice missing");
  if (decision?.publicNotice && snapshot?.publicNotice && snapshot.publicNotice !== decision.publicNotice) problems.push("public notice differs from the decision file");
  const text = snapshot?.cardText || "";
  const leaked = [
    Number(snapshot?.decisionFields || 0) > 0 && "decision fields",
    /결정일|사유|결정\s/u.test(text) && "decision labels",
    decision?.reason && text.includes(decision.reason) && "internal reason",
    decision?.decidedAt && text.includes(decision.decidedAt) && "decision date",
    decision?.basis && text.includes(decision.basis) && "decision basis",
  ].filter(Boolean);
  if (leaked.length) problems.push(`decision record shown: ${leaked.join(", ")}`);
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
