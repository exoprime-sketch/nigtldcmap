import { useEffect, useState } from "react";
import directory from "./datasetDirectoryV149.json";

export type UsageRankV149 = { elementId: string; count: number };
export type PublicUsageV149 = { status: "ready"; windowDays: number; from: string; through: string; detail: UsageRankV149[]; map: UsageRankV149[] };
export const datasetDatesV149 = new Map(directory.map(d => [d.elementId, d.updatedAt]));
export const mapDatasetIdsV149 = new Set(directory.filter(d => d.map).map(d => d.elementId));
export function usePublicUsageV149() {
  const [usage, setUsage] = useState<PublicUsageV149 | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    void fetch("/api/usage", {signal:controller.signal}).then(async r => {
      if (!r.ok || !r.headers.get("content-type")?.includes("application/json")) {
        // A static host answers with the app shell; drain it so the request
        // completes instead of holding an unread stream open.
        await r.body?.cancel().catch(() => undefined);
        return;
      }
      const data = await r.json();
      if (data.status === "ready" && Array.isArray(data.detail) && Array.isArray(data.map)) setUsage(data);
    }).catch(() => undefined).finally(() => clearTimeout(timeout));
    return () => { controller.abort(); clearTimeout(timeout); };
  }, []);
  return usage;
}
const sent = new Map<string, number>();
export function useDatasetUsageV149(kind: "detail" | "map", elementId: string | null, ready: boolean) {
  useEffect(() => {
    if (!ready || !elementId || navigator.webdriver || navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
    const key = `${kind}:${elementId}`;
    const timer = setTimeout(() => {
      if (document.visibilityState !== "visible" || Date.now() - (sent.get(key) || 0) < 1800000) return;
      let visitor: string;
      try {
        visitor = sessionStorage.getItem("cdp-usage-visitor-v149") || crypto.randomUUID();
        sessionStorage.setItem("cdp-usage-visitor-v149", visitor);
      } catch { return; } // No tracking if session storage is disabled.
      sent.set(key, Date.now());
      void fetch("/api/usage", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({kind,elementId,visitor}), keepalive:true})
        .then(r => { if (!r.ok) sent.delete(key); }).catch(() => { sent.delete(key); });
    }, 2000);
    return () => clearTimeout(timer);
  }, [kind, elementId, ready]);
}

export function sortHomeItemsV149<T extends {elementId:string; publicTitle:string}>(items:T[], mode:"views"|"latest", ranks:UsageRankV149[], dates:Map<string,string|null> = datasetDatesV149):T[] {
  const counts = new Map(ranks.map(r => [r.elementId,r.count]));
  return [...items].sort((a,b) => {
    if (mode === "views") { const difference = (counts.get(b.elementId)||0)-(counts.get(a.elementId)||0); if (difference) return difference; }
    const difference = (Date.parse(dates.get(b.elementId)||"")||0)-(Date.parse(dates.get(a.elementId)||"")||0);
    return difference || a.publicTitle.localeCompare(b.publicTitle,"ko");
  });
}
