import { useEffect, useState } from "react";
import { PUBLIC_NAVIGATION_V114 } from "../../app/navigation";
import type { View } from "../../app/navigation";
import GlobalQuickSearchV41 from "../search/GlobalQuickSearchV41";
import "../../styles/brand-v15.css";
import "../../styles/global-search-v41.css";

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onOpenDataset: (datasetId: string) => void;
  onOpenCountry: (iso3: string) => void;
  onExploreSearch: (
    query: string,
    countryIso3: string | null,
    technologyId: string | null
  ) => void;
}

export default function Header({
  currentView,
  onNavigate,
  onOpenDataset,
  onOpenCountry,
  onExploreSearch,
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="site-header site-header-v41">
        <div className="header-inner header-inner-v41">
          <button
            type="button"
            className="brand brand-v15"
            onClick={() => onNavigate("home")}
            aria-label="개도국 전략지도 홈"
          >
            <img
              className="brand-symbol-v15"
              src="/assets/brand/nigt-symbol.png"
              alt=""
              aria-hidden="true"
            />
            <span className="brand-copy">
              <strong>개도국 전략지도</strong>
              <small>국가녹색기술연구소 · 기후기술 협력 데이터</small>
            </span>
          </button>

          <nav className="main-nav" aria-label="주 메뉴">
            {PUBLIC_NAVIGATION_V114.map((item) => {
              const active =
                currentView === item.view ||
                (item.view === "explorer" &&
                  ["dataset-detail", "element-detail"].includes(currentView));

              return (
                <button
                  key={item.view}
                  type="button"
                  className={active ? "nav-button active" : "nav-button"}
                  onClick={() => onNavigate(item.view)}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            className="header-search-v41-trigger"
            onClick={() => setSearchOpen(true)}
            aria-label="국가·기후기술·데이터 통합 검색"
          >
            <span aria-hidden="true">⌕</span>
            <strong>검색</strong>
            <kbd>Ctrl K</kbd>
          </button>
        </div>
      </header>

      <GlobalQuickSearchV41
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenCountry={onOpenCountry}
        onOpenDataset={onOpenDataset}
        onExploreSearch={onExploreSearch}
      />
    </>
  );
}
