import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import type {
  VietnamDemoElement,
  VietnamFullLoadDemo,
} from "../../types/vietnamDemo";
import { loadVietnamFullLoadDemo } from "../../utils/vietnamDemoV47";
import VietnamDataSpecificPreviewV48 from "../data/VietnamDataSpecificPreviewV48";

type CategoryFilter = "all" | "A" | "B" | "C" | "D" | "E";
type StatusFilter = "all" | "actual_connected" | "demo_only";

export default function VietnamFullLoadPanelV47() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<VietnamFullLoadDemo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<VietnamDemoElement | null>(null);

  useEffect(() => {
    if (!open || data || loading) return;

    setLoading(true);
    void loadVietnamFullLoadDemo()
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "베트남 데이터 예시를 불러오지 못했습니다"
        );
        setLoading(false);
      });
  }, [open, data, loading]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const normalized = query.trim().toLowerCase();

    return data.elements.filter((element) => {
      const text = [
        element.title,
        element.dataGroup,
        element.section,
        element.effectiveSource,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!normalized || text.includes(normalized)) &&
        (category === "all" || element.category === category) &&
        (status === "all" || element.status === status)
      );
    });
  }, [data, query, category, status]);

  return (
    <section className={`v47-full-load-panel ${open ? "is-open" : ""}`}>
      <div className="v47-full-load-head">
        <div>
          <span className="v47-prototype-label">내부 예시</span>
          <h2>베트남 데이터 이용 예시</h2>
          <p>
            최신 152개 수집요소가 모두 들어왔을 때 데이터 찾기·상세 화면이
            어떻게 보여야 하는지 현재 플랫폼 안에서 검토
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "예시 접기" : "데이터 예시 보기"}
        </button>
      </div>

      {!open ? (
        <div className="v47-full-load-summary">
          <span>
            <b>152</b>
            전체 수집요소
          </span>
          <span>
            <b>10</b>
            현재 실제 연결
          </span>
          <span>
            <b>142</b>
            화면 시연
          </span>
          <p>표시된 숫자와 개수는 실제 베트남 현황이 아닌 이용화면 예시</p>
        </div>
      ) : (
        <>
          {loading && (
            <div className="v47-demo-loading" role="status">
              152개 데이터 요소 불러오는 중
            </div>
          )}

          {error && <div className="v47-demo-error">{error}</div>}

          {data && (
            <>
              <div className="v47-full-load-disclaimer">
                <b>표시 구분</b>
                <span>
                  녹색 ‘실제 데이터’는 현재 플랫폼에 공식·공공자료가 연결된 항목
                </span>
                <span>
                  노란색 ‘화면 예시’는 실제 베트남 값이 아니며 최종 수집자료가
                  들어올 화면의 형태만 시연
                </span>
              </div>

              <div className="v47-full-load-controls">
                <label>
                  <span>검색</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="예: 인허가, 태양광, GCF, O&M, 파트너"
                  />
                </label>

                <label>
                  <span>사업기획 영역</span>
                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as CategoryFilter)
                    }
                  >
                    <option value="all">전체</option>
                    {data.categories.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label} · {item.count}개
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>표시 상태</span>
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as StatusFilter)
                    }
                  >
                    <option value="all">전체</option>
                    <option value="actual_connected">실제 데이터</option>
                    <option value="demo_only">화면 예시</option>
                  </select>
                </label>
              </div>

              <div className="v47-full-load-result-head">
                <b>{filtered.length}개</b>
                <span>
                  실제 데이터{" "}
                  {
                    filtered.filter(
                      (item) => item.status === "actual_connected"
                    ).length
                  }
                  개 · 화면 예시{" "}
                  {
                    filtered.filter((item) => item.status === "demo_only")
                      .length
                  }
                  개
                </span>
              </div>

              <div className="v47-full-load-list">
                {filtered.map((element) => (
                  <article key={element.elementId} className="v47-element-card">
                    <div className="v47-element-card-meta">
                      <span>{element.categoryLabel}</span>
                      <b
                        className={
                          element.status === "actual_connected"
                            ? "actual"
                            : "demo"
                        }
                      >
                        {element.status === "actual_connected"
                          ? "실제 데이터"
                          : "화면 예시"}
                      </b>
                    </div>
                    <h3>{element.titleShort}</h3>
                    <p className="v48-card-question">
                      {element.presentation.userQuestion}
                    </p>
                    <small>{element.presentation.primaryViewLabel}</small>
                    <button type="button" onClick={() => setSelected(element)}>
                      데이터 예시 보기
                    </button>
                  </article>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="v47-demo-empty">
                  조건에 맞는 데이터 요소가 없습니다
                </div>
              )}
            </>
          )}
        </>
      )}

      {selected && (
        <div
          className="v47-demo-modal-backdrop"
          role="presentation"
          onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
            if (event.currentTarget === event.target) setSelected(null);
          }}
        >
          <div
            className="v47-demo-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.titleShort} 화면 예시`}
          >
            <div className="v47-demo-modal-head">
              <div>
                <span>{selected.categoryLabel}</span>
                <h2>{selected.titleShort}</h2>
                <p>{selected.dataGroup}</p>
              </div>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>
            <VietnamDataSpecificPreviewV48 element={selected} compact />
          </div>
        </div>
      )}
    </section>
  );
}
