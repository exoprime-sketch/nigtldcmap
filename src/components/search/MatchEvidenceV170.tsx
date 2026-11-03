import type { DatasetMatchV170 } from "../../data/search/searchMatchV170";

/**
 * V170 ③: why a card is in the result - where the query was found, how many
 * of the dataset's entries hold it, and the words around the first hit.
 * V170-2: "설명에 '태양광' 포함", "수록 내용 56건 중 22건에 '태양광' 포함".
 */
export default function MatchEvidenceV170({ match, query }: { match: DatasetMatchV170; query: string }) {
  const q = `‘${query.trim()}’`;
  const snippet = match.snippet;
  const records = match.records;
  const count = (n: number) => n.toLocaleString("ko-KR");
  // The name is the card's own title; repeating it adds nothing.
  const showSnippet = Boolean(snippet && match.where !== "데이터명" && (snippet.hit || snippet.post));
  const headline =
    match.tier === 2 && records
      ? `수록 내용 ${count(records.total)}건 중 ${count(records.matched)}건에 ${q} 포함`
      : `${match.where}에 ${q} 포함`;
  return (
    <div className="sr170-evidence" data-testid="search-evidence-v170" data-tier={match.tier}>
      {match.tier === 3 ? (
        <p className="sr170-evidence__text">
          기후기술 분류에만 {q} 관련 기술이 있으며, 데이터 내용에는 검색어가 없습니다
        </p>
      ) : (
        <>
          <span className="sr170-evidence__where">
            <strong>{headline}</strong>
            {match.tier === 1 && records ? (
              <span data-testid="search-evidence-records-v170">
                수록 내용 {count(records.total)}건 중 {count(records.matched)}건에도 포함
              </span>
            ) : null}
          </span>
          {showSnippet && snippet ? (
            <p className="sr170-evidence__text">
              {snippet.pre}
              {snippet.hit ? <mark>{snippet.hit}</mark> : null}
              {snippet.post}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
