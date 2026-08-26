import type { VietnamExplorerItem } from "../../utils/vietnamExplorerV49";
import { CATEGORIES } from "../../data/publicTaxonomy";
import {
  getFinalDisplayTitle,
  getFinalPreviewMode,
  modeLabel,
  toCountryNeutralQuestion,
} from "../../utils/dataPreviewV53";

interface Props {
  item: VietnamExplorerItem;
  countryIso3: string;
  countryName: string;
  onOpenElement?: (elementId: string, countryIso3: string) => void;
}

export default function VietnamExplorerCardV49({
  item,
  countryIso3,
  countryName,
  onOpenElement,
}: Props) {
  const { element, datasets, actual, coverageStatus } = item;
  const allCountryMode = countryIso3 === "all";
  const topic =
    CATEGORIES.find((category) => category.code === element.category)?.nameKo ??
    element.categoryLabel;

  function openDetail() {
    // v101: 전체 국가 모드에서도 데이터 항목 상세 화면을 열 수 있어야 한다.
    // 기존 상세 렌더러는 국가 문맥을 요구하므로 초기 표시국(VNM)을 사용하되,
    // Explorer의 국가 필터 상태는 App에서 별도로 유지되어 돌아오면 '전체'가 복원된다.
    const detailCountryIso3 = allCountryMode ? "VNM" : countryIso3;

    if (typeof onOpenElement === "function") {
      onOpenElement(element.elementId, detailCountryIso3);
      return;
    }

    // v79 release guard:
    // App wiring이 회귀해도 클릭 자체가 런타임 오류로 끝나지 않도록
    // 동일한 공개 URL 계약으로 안전하게 이동합니다.
    const params = new URLSearchParams();
    params.set("element", element.elementId);
    params.set("country", detailCountryIso3);
    params.set("from", "explorer");

    window.location.href = `${
      window.location.pathname
    }?${params.toString()}#element-detail`;
  }

  return (
    <article className="dataset-card dataset-card-user-v32 v49-explorer-card">
      <div className="dataset-card-head">
        <div className="badge-row">
          <span className="user-topic-badge">{topic}</span>
          {allCountryMode ? (
            <span className="neutral-badge">국가별 제공상태 상이</span>
          ) : (
            <span
              className={
                coverageStatus === "full"
                  ? "v49-actual-badge"
                  : coverageStatus === "partial"
                  ? "v64-partial-badge"
                  : "v49-demo-badge"
              }
            >
              {coverageStatus === "full"
                ? "제공 중"
                : coverageStatus === "partial"
                ? "일부 제공"
                : "준비 중"}
            </span>
          )}
          {element.gis && <span className="neutral-badge">지도 연계</span>}
        </div>
      </div>

      <button type="button" className="dataset-title" onClick={openDetail}>
        {getFinalDisplayTitle(element)}
      </button>

      <span className="dataset-title-en">
        {actual
          ? element.presentation.primaryViewLabel
          : modeLabel(getFinalPreviewMode(element))}
      </span>

      <p className="dataset-summary v49-question">
        {toCountryNeutralQuestion(element.presentation.userQuestion)}
      </p>

      <dl className="dataset-meta dataset-meta-user-v32">
        <div>
          <dt>범위</dt>
          <dd>{allCountryMode ? "전체 우선 구축국" : countryName}</dd>
        </div>
        <div>
          <dt>기준</dt>
          <dd>
            {allCountryMode
              ? "상세에서 국가별 확인"
              : actual && datasets[0]
              ? datasets[0].referenceYear
              : "제공 예정"}
          </dd>
        </div>
        <div>
          <dt>{actual ? "출처" : "예정 출처"}</dt>
          <dd>{item.sourceOrganizations.join(" · ") || "추후 확정"}</dd>
        </div>
      </dl>

      <div className="dataset-card-footer dataset-card-footer-user-v32">
        <div className="user-card-cues">
          {allCountryMode ? (
            <>
              <span>상위 데이터 항목</span>
              <span>상세에서 국가 변경 가능</span>
            </>
          ) : coverageStatus === "full" ? (
            <>
              <span>
                관련 데이터{" "}
                {datasets.length > 1 ? `${datasets.length}건` : "제공"}
              </span>
              {datasets.some((dataset) => Boolean(dataset.sourceUrl)) && (
                <span>원자료 확인</span>
              )}
            </>
          ) : coverageStatus === "partial" ? (
            <>
              <span>일부 데이터 제공</span>
              <span>포함 항목별 상태 확인</span>
            </>
          ) : (
            <span>자료 준비 중</span>
          )}
          {element.gis && <span>지도 연계</span>}
        </div>

        <button type="button" className="text-button" onClick={openDetail}>
          "상세 보기 →"
        </button>
      </div>
    </article>
  );
}
