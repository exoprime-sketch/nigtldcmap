import type { View } from "../app/navigation";
import "../styles/not-found.css";

interface NotFoundPageProps {
  onNavigate: (view: View) => void;
}

export default function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <div className="page-shell not-found-page">
      <span className="not-found-code" aria-hidden="true">
        404
      </span>
      <h1>페이지 확인 불가</h1>
      <p>잘못된 주소 또는 이동된 페이지</p>
      <div className="not-found-actions">
        <button
          type="button"
          className="primary-button"
          onClick={() => onNavigate("home")}
        >
          홈으로 이동
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("explorer")}
        >
          데이터 찾기
        </button>
      </div>
    </div>
  );
}
