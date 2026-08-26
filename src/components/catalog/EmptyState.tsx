interface EmptyStateProps {
  onClear: () => void;
}

export default function EmptyState({ onClear }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">0</span>
      <h2>검색 결과 없음</h2>
      <p>검색어를 줄이거나 선택한 필터를 초기화해 보세요</p>
      <button type="button" className="primary-button" onClick={onClear}>
        모든 조건 초기화
      </button>
    </div>
  );
}
