import type { DatasetMatchV170 } from "../../data/search/searchMatchV170";

/**
 * V170 ③: why a card is in the result - where the query was found, how many
 * of the dataset's records hold it, and the words around the first hit.
 */
export default function MatchEvidenceV170({ match, query }: { match: DatasetMatchV170; query: string }) {
  const snippet = match.snippet;
  // The name is the card's own title; repeating it adds nothing.
  const showSnippet = Boolean(snippet && match.where !== "이름" && (snippet.hit || snippet.post));
  return (
    <div className="sr170-evidence" data-testid="search-evidence-v170" data-tier={match.tier}>
      <span className="sr170-evidence__where">
        <strong>{match.where}에서 일치</strong>
        {match.records ? (
          <span data-testid="search-evidence-records-v170">
            원자료 {match.records.total.toLocaleString("ko-KR")}건 중 {match.records.matched.toLocaleString("ko-KR")}건
          </span>
        ) : null}
      </span>
      {match.tier === 3 ? (
        <p className="sr170-evidence__text">
          기후기술 분류에만 ‘{query.trim()}’ 관련 기술이 있고, 데이터 내용에는 검색어가 없습니다
        </p>
      ) : showSnippet && snippet ? (
        <p className="sr170-evidence__text">
          {snippet.pre}
          {snippet.hit ? <mark>{snippet.hit}</mark> : null}
          {snippet.post}
        </p>
      ) : null}
    </div>
  );
}
