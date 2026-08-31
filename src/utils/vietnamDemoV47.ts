import type { Dataset } from "../types/dataset";
import type {
  VietnamDemoElement,
  VietnamFullLoadDemo,
} from "../types/vietnamDemo";
import {
  AUTHORITATIVE_ELEMENT_ID_BY_DATASET_V88,
  getAuthoritativeElementIdV88,
} from "./elementDatasetRegistryV88";
import { publicAssetUrlV128 } from "./publicAssetUrlV128";

const DEMO_URL = publicAssetUrlV128(
  "data/catalog/authoritative-elements-v101.json"
);

let demoPromise: Promise<VietnamFullLoadDemo> | null = null;

/**
 * 하위 코드 호환용 export.
 * v88부터 실제 source of truth는 elementDatasetRegistryV88.ts임.
 */
export const AUTHORITATIVE_ELEMENT_ID_BY_DATASET =
  AUTHORITATIVE_ELEMENT_ID_BY_DATASET_V88;

/**
 * 기존 함수명을 유지하되 v88 단일 registry를 사용한다.
 */
export function getAuthoritativeElementId(dataset: Dataset): string {
  return getAuthoritativeElementIdV88(dataset);
}

export function loadVietnamFullLoadDemo(): Promise<VietnamFullLoadDemo> {
  if (!demoPromise) {
    demoPromise = fetch(DEMO_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`데이터 항목 카탈로그 응답 오류 ${response.status}`);
        }
        return (await response.json()) as VietnamFullLoadDemo;
      })
      .catch((error) => {
        demoPromise = null;
        throw error;
      });
  }
  return demoPromise;
}

export async function getVietnamDemoElementForDataset(
  dataset: Dataset
): Promise<VietnamDemoElement | null> {
  const id = getAuthoritativeElementId(dataset);
  if (id.startsWith("SUPPORT-")) return null;

  const demo = await loadVietnamFullLoadDemo();
  return demo.elements.find((element) => element.elementId === id) ?? null;
}

export function isVietnamDemoElementActual(
  element: VietnamDemoElement
): boolean {
  return element.status === "actual_connected";
}

export const VIETNAM_DEMO_CATEGORY_LABELS: Record<string, string> = {
  A: "국가 기본정보",
  B: "기후·환경",
  C: "정책·제도",
  D: "시장·산업·재원",
  E: "협력·실행기반",
};
