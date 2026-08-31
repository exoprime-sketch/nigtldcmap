import type { View } from "../../app/navigation";
import { SERVICE_LINKS } from "../../config/serviceLinks";
import "../../styles/brand-v15.css";
import "../../styles/footer-v20.css";

interface FooterProps {
  onNavigate: (view: View) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-grid footer-grid-v15">
        <div className="footer-brand-block footer-brand-v15">
          <span className="footer-logo-frame-v15">
            <img
              src="/assets/brand/nigt-logo-full.png"
              alt="국가녹색기술연구소"
            />
          </span>
          <div>
            <strong>개도국 기후기술 협력 플랫폼</strong>
            <p>국가·기술별 근거자료 탐색·비교·협력 검토</p>
          </div>
        </div>
        <nav aria-label="하단 메뉴">
          <button type="button" onClick={() => onNavigate("explorer")}>
            데이터 찾기
          </button>
          <button type="button" onClick={() => onNavigate("map")}>
            지도
          </button>
          <button type="button" onClick={() => onNavigate("download")}>
            데이터 다운로드
          </button>
          <button type="button" onClick={() => onNavigate("guide")}>
            데이터 이용안내
          </button>
        </nav>
      </div>
      <div className="page-shell footer-bottom">
        <span>© 2026 국가녹색기술연구소</span>
        <div>
          {SERVICE_LINKS.contactEmail && (
            <a href={`mailto:${SERVICE_LINKS.contactEmail}`}>문의</a>
          )}
        </div>
      </div>
    </footer>
  );
}
