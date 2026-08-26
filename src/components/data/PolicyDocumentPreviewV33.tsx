import { useEffect, useState } from "react";
import { loadPolicyPreviewForDataset } from "../../data/policy/policyPreviewData";
import type { PolicyDocumentPreview } from "../../data/policy/policyPreviewData";
import type { Dataset } from "../../types/dataset";

export default function PolicyDocumentPreviewV33({
  dataset,
}: {
  dataset: Dataset;
}) {
  const [preview, setPreview] = useState<PolicyDocumentPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadPolicyPreviewForDataset(dataset.id).then((result) => {
      if (cancelled) return;
      setPreview(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [dataset.id]);

  if (loading) return <p role="status">정책·문서 근거 로딩 중</p>;
  if (!preview) {
    return <SourceOnly dataset={dataset} />;
  }

  return (
    <div className="v33-policy-document-view">
      <section className="v33-document-hero">
        <div>
          <span>{preview.documentType}</span>
          <h2>{preview.documentTitle}</h2>
          <p>
            {[
              preview.countryNameKo,
              preview.documentDate,
              preview.sourceOrganization,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <a href={preview.sourceUrl} target="_blank" rel="noreferrer">
          공식 문서 확인 ↗
        </a>
      </section>

      {preview.sections.length > 0 ? (
        <div className="v33-evidence-list document-evidence">
          {preview.sections.map((section) => (
            <article key={section.id}>
              <header>
                <div>
                  <span className="v33-eyebrow">{section.headingKo}</span>
                  <strong>
                    {section.verificationStatus === "verified"
                      ? "원문 근거 확인"
                      : "추가 검토 필요"}
                  </strong>
                </div>
              </header>
              <div className="v33-bilingual-grid">
                <section>
                  <span>원문</span>
                  <p lang={section.originalLanguage || undefined}>
                    {section.originalText || "공식 문서에서 확인"}
                  </p>
                </section>
                <section>
                  <span>한국어 의미</span>
                  <p>{section.translationKo || "한국어 참고내용 없음"}</p>
                </section>
              </div>
              <footer>
                <small>
                  {section.sourcePage
                    ? `근거 위치 · ${section.sourcePage}`
                    : "문서 위치 확인 필요"}
                </small>
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <div className="v33-source-only compact">
          <strong>현재 제공되는 주요 내용 없음</strong>
          <p>
            문서 기본정보와 공식 문서 링크를 제공합니다 · 주요 내용은 확인되는
            대로 이 화면에 표시합니다
          </p>
        </div>
      )}

      <div className="v33-neutral-note">
        한국어 내용은 이해 지원용 참고 · 최종 정책 해석은 공식 원문 기준
      </div>
    </div>
  );
}

function SourceOnly({ dataset }: { dataset: Dataset }) {
  return (
    <div className="v33-source-only">
      <strong>공식 원문에서 확인</strong>
      <p>문서 기본정보를 제공하며 최신 원문은 원천기관 자료에서 확인</p>
      {dataset.sourceUrl && (
        <a href={dataset.sourceUrl} target="_blank" rel="noreferrer">
          공식 문서 확인 ↗
        </a>
      )}
    </div>
  );
}
