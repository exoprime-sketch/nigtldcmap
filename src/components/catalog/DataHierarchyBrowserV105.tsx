import { CATEGORIES } from "../../data/publicTaxonomy";
import type { VietnamExplorerItem } from "../../utils/vietnamExplorerV49";
import {
  buildDataHierarchyV105,
  findHierarchyGroupV105,
  findHierarchySectionV105,
} from "../../utils/dataHierarchyV105";
import type {
  HierarchyCoverageCounts,
} from "../../utils/dataHierarchyV105";
import VietnamExplorerCardV49 from "./VietnamExplorerCardV49";

interface Props {
  items: VietnamExplorerItem[];
  selectedSection: string | null;
  selectedGroup: string | null;
  countryIso3: string;
  countryName: string;
  onSelectSection: (sectionId: string | null) => void;
  onSelectGroup: (groupId: string | null) => void;
  onOpenElement: (elementId: string, countryIso3: string) => void;
}

function coverageText(counts: HierarchyCoverageCounts): string {
  const parts: string[] = [];
  if (counts.full > 0) parts.push(`제공 중 ${counts.full}`);
  if (counts.partial > 0) parts.push(`일부 제공 ${counts.partial}`);
  if (counts.pending > 0) parts.push(`준비 중 ${counts.pending}`);
  return parts.join(" · ") || "제공상태 확인 중";
}

function categoryName(code: string): string {
  return CATEGORIES.find((item) => item.code === code)?.nameKo ?? "관련 데이터";
}

/**
 * v106 public hierarchy UX
 *
 * section/group의 A.1, A.1.a 같은 코드는 관리·라우팅용 stable id로만 유지하고
 * 외부 이용자 화면에는 노출하지 않는다.
 */
export default function DataHierarchyBrowserV105({
  items,
  selectedSection,
  selectedGroup,
  countryIso3,
  countryName,
  onSelectSection,
  onSelectGroup,
  onOpenElement,
}: Props) {
  const sections = buildDataHierarchyV105(items);
  const section = findHierarchySectionV105(sections, selectedSection);
  const group = findHierarchyGroupV105(section, selectedGroup);

  function resetToSections() {
    onSelectGroup(null);
    onSelectSection(null);
  }

  function resetToGroups() {
    onSelectGroup(null);
  }

  if (group) {
    return (
      <div className="v105-hierarchy-browser" data-level="element">
        <nav
          className="v105-hierarchy-breadcrumb"
          aria-label="데이터 탐색 경로"
        >
          <button type="button" onClick={resetToSections}>
            데이터 분야
          </button>
          <span aria-hidden="true">/</span>
          <button type="button" onClick={resetToGroups}>
            {section?.label}
          </button>
          <span aria-hidden="true">/</span>
          <strong>{group.label}</strong>
        </nav>

        <div className="v105-hierarchy-heading">
          <div>
            <span className="v105-level-kicker">데이터 선택</span>
            <h2>{group.label}</h2>
            <p>
              확인할 데이터를 선택하면 제공 값, 화면 예시와 원 출처를 확인할 수
              있습니다
            </p>
          </div>
          <div
            className="v105-level-count"
            aria-label={`${group.items.length}개 데이터`}
          >
            <strong>{group.items.length}</strong>
            <span>개 데이터</span>
          </div>
        </div>

        <button
          type="button"
          className="v105-back-level"
          onClick={resetToGroups}
        >
          ← 데이터 그룹으로 돌아가기
        </button>

        <div className="results-list v105-element-list">
          {group.items.map((item) => (
            <VietnamExplorerCardV49
              key={item.element.elementId}
              item={item}
              countryIso3={countryIso3}
              countryName={countryName}
              onOpenElement={onOpenElement}
            />
          ))}
        </div>
      </div>
    );
  }

  if (section) {
    return (
      <div className="v105-hierarchy-browser" data-level="group">
        <nav
          className="v105-hierarchy-breadcrumb"
          aria-label="데이터 탐색 경로"
        >
          <button type="button" onClick={resetToSections}>
            데이터 분야
          </button>
          <span aria-hidden="true">/</span>
          <strong>{section.label}</strong>
        </nav>

        <div className="v105-hierarchy-heading">
          <div>
            <span className="v105-level-kicker">데이터 그룹 선택</span>
            <h2>{section.label}</h2>
            <p>
              관심 있는 데이터 그룹을 선택하면 포함된 데이터를 확인할 수
              있습니다
            </p>
          </div>
          <div
            className="v105-level-count"
            aria-label={`${section.groups.length}개 데이터 그룹`}
          >
            <strong>{section.groups.length}</strong>
            <span>개 그룹</span>
          </div>
        </div>

        <button
          type="button"
          className="v105-back-level"
          onClick={resetToSections}
        >
          ← 데이터 분야로 돌아가기
        </button>

        <div className="v105-hierarchy-grid">
          {section.groups.map((item) => (
            <button
              type="button"
              key={item.id}
              className="v105-hierarchy-card v105-group-card"
              onClick={() => onSelectGroup(item.id)}
            >
              <div className="v105-card-topline">
                <span className="v105-card-eyebrow">
                  {item.items.length}개 데이터
                </span>
              </div>
              <h3>{item.label}</h3>
              <p className="v105-card-status">{coverageText(item.coverage)}</p>
              <div className="v105-card-preview" aria-hidden="true">
                {item.items.slice(0, 3).map((element) => (
                  <span key={element.element.elementId}>
                    {element.element.titleShort || element.element.title}
                  </span>
                ))}
                {item.items.length > 3 && (
                  <span>외 {item.items.length - 3}개</span>
                )}
              </div>
              <div className="v105-card-action">
                데이터 보기 <span aria-hidden="true">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="v105-hierarchy-browser" data-level="section">
      <nav className="v105-hierarchy-breadcrumb" aria-label="데이터 탐색 경로">
        <strong>데이터 분야</strong>
      </nav>

      <div className="v105-hierarchy-heading">
        <div>
          <span className="v105-level-kicker">데이터 분야 선택</span>
          <h2>어떤 분야의 데이터를 찾고 계신가요?</h2>
          <p>
            관심 분야를 선택한 뒤 관련 데이터 그룹과 세부 데이터를 확인하세요
          </p>
        </div>
        <div
          className="v105-level-count"
          aria-label={`${sections.length}개 데이터 분야`}
        >
          <strong>{sections.length}</strong>
          <span>개 분야</span>
        </div>
      </div>

      <div className="v105-hierarchy-grid v105-section-grid">
        {sections.map((item) => (
          <button
            type="button"
            key={item.id}
            className="v105-hierarchy-card v105-section-card"
            onClick={() => {
              onSelectGroup(null);
              onSelectSection(item.id);
            }}
          >
            <div className="v105-card-topline">
              <span className="v105-card-eyebrow">
                {categoryName(item.category)}
              </span>
            </div>
            <h3>{item.label}</h3>
            <div className="v105-card-metrics">
              <span>
                <strong>{item.groups.length}</strong>개 데이터 그룹
              </span>
              <span>
                <strong>{item.items.length}</strong>개 데이터
              </span>
              {item.gisCount > 0 && <span>지도 연계 {item.gisCount}</span>}
            </div>
            <p className="v105-card-status">{coverageText(item.coverage)}</p>
            <div
              className="v105-card-preview v105-group-preview"
              aria-hidden="true"
            >
              {item.groups.slice(0, 3).map((child) => (
                <span key={child.id}>{child.label}</span>
              ))}
              {item.groups.length > 3 && (
                <span>외 {item.groups.length - 3}개 그룹</span>
              )}
            </div>
            <div className="v105-card-action">
              데이터 그룹 보기 <span aria-hidden="true">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
