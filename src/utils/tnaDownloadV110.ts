import { getMappedClimateTechnologyNameV110 } from "../data/policy/tnaTechnologyNeedsV110";
import type {
  TnaCountryProfileV110,
  TnaTechnologyRecordV110,
} from "../data/policy/tnaTechnologyNeedsV110";
import {
  TNA_CURRENTNESS_METHOD_NOTE_KO_V111,
  TNA_CURRENTNESS_REVIEWED_AT_V111,
  TNA_GCF_JOIN_NOTE_KO_V111,
  getTnaCurrentnessEvidenceV111,
  getVerifiedGcfMatchesForTnaV111,
} from "../data/policy/tnaCurrentnessV111";
import {
  INTERNATIONAL_SUPPORT_CAUTION_V112,
  getSupportForCountryTechnologyV112,
} from "../data/support/internationalSupportV112";
import { downloadBlob } from "./browser";

export type TnaDownloadFormatV110 = "CSV" | "JSON";

function protectSpreadsheetFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function csvCell(value: unknown): string {
  const safe = protectSpreadsheetFormula(value == null ? "" : String(value));
  return `"${safe.replace(/"/g, '""')}"`;
}

function toFlatRow(
  profile: TnaCountryProfileV110,
  item: TnaTechnologyRecordV110
) {
  const currentness = getTnaCurrentnessEvidenceV111(item.id);
  const gcfMatches = getVerifiedGcfMatchesForTnaV111(
    profile.countryIso3,
    item.mappedTechnologyId
  );

  return {
    country_iso3: profile.countryIso3,
    country_name_ko: profile.countryNameKo,
    track: item.track,
    sector_ko: item.sectorKo,
    source_technology_name: item.sourceTechnologyName,
    source_technology_name_ko: item.sourceTechnologyNameKo,
    source_priority_rank: item.priorityRank ?? "",
    selected_for_tap: item.selectedForTap,
    mapped_38_technology_id: item.mappedTechnologyId ?? "",
    mapped_38_technology_name_ko:
      getMappedClimateTechnologyNameV110(item.mappedTechnologyId) ?? "",
    mapping_confidence: item.mappingConfidence,
    tna_evidence_anchor_ko: item.evidenceAnchorKo,
    tna_source_pages: item.sourcePages,
    tna_source_url: item.sourceUrl,
    currentness_status: currentness?.status ?? "",
    currentness_status_ko: currentness?.statusLabelKo ?? "",
    currentness_interpretation_ko: currentness?.interpretationKo ?? "",
    currentness_evidence_anchor_ko: currentness?.evidenceAnchorKo ?? "",
    current_policy_sources:
      currentness?.sources
        .map(
          (source) =>
            `${source.type} · ${source.title} · ${source.publishedAt} · ${source.pages}`
        )
        .join(" | ") ?? "",
    current_policy_source_urls:
      currentness?.sources.map((source) => source.url).join(" | ") ?? "",
    currentness_reviewed_at: currentness?.reviewedAt ?? "",
    verified_gcf_project_ids: gcfMatches
      .map((project) => project.projectId)
      .join(" | "),
    verified_gcf_project_titles: gcfMatches
      .map((project) => project.projectTitle)
      .join(" | "),
    verified_gcf_project_relations: gcfMatches
      .map((project) => project.relation)
      .join(" | "),
    verified_gcf_evidence_basis: gcfMatches
      .map((project) => project.evidenceBasis)
      .join(" | "),
    verified_gcf_project_urls: gcfMatches
      .map((project) => project.sourceUrl)
      .join(" | "),
    gcf_join_note_ko: TNA_GCF_JOIN_NOTE_KO_V111,
    note_ko: item.noteKo,
  };
}

export function downloadTnaCountryV111(
  profile: TnaCountryProfileV110,
  format: TnaDownloadFormatV110
): number {
  const rows = profile.technologies.map((item) => toFlatRow(profile, item));
  const filename = `tna-tap-${profile.countryIso3}-currentness-gcf-v111`;

  if (format === "JSON") {
    const technologies = profile.technologies.map((item) => ({
      ...item,
      mappedTechnologyNameKo:
        getMappedClimateTechnologyNameV110(item.mappedTechnologyId) ?? null,
      currentness: getTnaCurrentnessEvidenceV111(item.id),
      verifiedGcfProjects: getVerifiedGcfMatchesForTnaV111(
        profile.countryIso3,
        item.mappedTechnologyId
      ),
    }));

    const payload = {
      metadata: {
        title: `${profile.countryNameKo} TNA/TAP 기술수요 · 최신 정책 현재성 · 기존 GCF 사업 연결`,
        tnaSource: "UNFCCC TT:CLEAR official country reports",
        tnaSourceReviewAsOf: profile.sourceReviewAsOf,
        currentnessReviewAsOf: TNA_CURRENTNESS_REVIEWED_AT_V111,
        mappingRule:
          "38대 기후기술 매핑은 원문 의미가 직접 또는 기능적으로 대응하는 경우만 수행하며 불명확하면 미매핑",
        currentnessRule: TNA_CURRENTNESS_METHOD_NOTE_KO_V111,
        gcfJoinRule: TNA_GCF_JOIN_NOTE_KO_V111,
        caution:
          "현재성·GCF 연결은 근거 탐색을 돕는 상태정보이며 협력 우선순위 점수, 사업 추천, 특정 TNA 세부기술과 GCF 프로젝트의 동일성 판정이 아님",
      },
      country: {
        iso3: profile.countryIso3,
        nameKo: profile.countryNameKo,
        coverageLabelKo: profile.coverageLabelKo,
      },
      officialTnaDocuments: profile.officialDocuments,
      technologies,
      barriers: profile.barriers,
      projectIdeas: profile.projectIdeas,
    };

    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      }),
      `${filename}.json`
    );
    return rows.length;
  }

  const fallback = {
    country_iso3: "",
    country_name_ko: "",
    track: "",
    sector_ko: "",
    source_technology_name: "",
    source_technology_name_ko: "",
    source_priority_rank: "",
    selected_for_tap: "",
    mapped_38_technology_id: "",
    mapped_38_technology_name_ko: "",
    mapping_confidence: "",
    tna_evidence_anchor_ko: "",
    tna_source_pages: "",
    tna_source_url: "",
    currentness_status: "",
    currentness_status_ko: "",
    currentness_interpretation_ko: "",
    currentness_evidence_anchor_ko: "",
    current_policy_sources: "",
    current_policy_source_urls: "",
    currentness_reviewed_at: "",
    verified_gcf_project_ids: "",
    verified_gcf_project_titles: "",
    verified_gcf_project_relations: "",
    verified_gcf_evidence_basis: "",
    verified_gcf_project_urls: "",
    gcf_join_note_ko: "",
    note_ko: "",
  };

  const headers = Object.keys(rows[0] ?? fallback);
  const csv =
    "\uFEFF" +
    [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((key) => csvCell((row as Record<string, unknown>)[key]))
          .join(",")
      ),
    ].join("\n");

  downloadBlob(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    `${filename}.csv`
  );
  return rows.length;
}

/**
 * v110 compatibility alias.
 * New callers should use downloadTnaCountryV111 so the filename and metadata
 * clearly indicate that currentness and verified GCF joins are included.
 */
export function downloadTnaCountryV110(
  profile: TnaCountryProfileV110,
  format: TnaDownloadFormatV110
): number {
  return downloadTnaCountryV111(profile, format);
}

/**
 * v112 download: v111 currentness/GCF fields plus official CTCN·Adaptation Fund·GEF
 * evidence joined only by country × verified 38-technology id.
 */
export function downloadTnaCountryV112(
  profile: TnaCountryProfileV110,
  format: TnaDownloadFormatV110
): number {
  const rows = profile.technologies.map((item) => {
    const base = toFlatRow(profile, item);
    const support = item.mappedTechnologyId
      ? getSupportForCountryTechnologyV112(
          profile.countryIso3,
          item.mappedTechnologyId
        )
      : [];
    return {
      ...base,
      verified_support_organizations: support
        .map((value) => value.sourceOrganization)
        .join(" | "),
      verified_support_project_ids: support
        .map((value) => value.projectId)
        .join(" | "),
      verified_support_project_titles: support
        .map((value) => value.projectTitle)
        .join(" | "),
      verified_support_statuses: support
        .map((value) => value.status ?? "")
        .join(" | "),
      verified_support_source_urls: support
        .map((value) => value.sourceUrl)
        .join(" | "),
      support_join_note_ko: INTERNATIONAL_SUPPORT_CAUTION_V112,
    };
  });
  const filename = `tna-tap-${profile.countryIso3}-currentness-international-support-v112`;

  if (format === "JSON") {
    const technologies = profile.technologies.map((item) => ({
      ...item,
      mappedTechnologyNameKo:
        getMappedClimateTechnologyNameV110(item.mappedTechnologyId) ?? null,
      currentness: getTnaCurrentnessEvidenceV111(item.id),
      verifiedGcfProjects: getVerifiedGcfMatchesForTnaV111(
        profile.countryIso3,
        item.mappedTechnologyId
      ),
      verifiedInternationalSupport: item.mappedTechnologyId
        ? getSupportForCountryTechnologyV112(
            profile.countryIso3,
            item.mappedTechnologyId
          )
        : [],
    }));
    const payload = {
      metadata: {
        title: `${profile.countryNameKo} TNA/TAP 기술수요 · 최신 정책 · 기존 국제지원/기후기금 근거`,
        version: "v112",
        tnaSourceReviewAsOf: profile.sourceReviewAsOf,
        currentnessReviewAsOf: TNA_CURRENTNESS_REVIEWED_AT_V111,
        currentnessRule: TNA_CURRENTNESS_METHOD_NOTE_KO_V111,
        gcfJoinRule: TNA_GCF_JOIN_NOTE_KO_V111,
        internationalSupportJoinRule: INTERNATIONAL_SUPPORT_CAUTION_V112,
        caution:
          "현재성·기존 지원/사업 연결은 근거 탐색을 위한 상태정보이며 협력 우선순위 점수나 신규 사업 추천이 아님",
      },
      country: {
        iso3: profile.countryIso3,
        nameKo: profile.countryNameKo,
        coverageLabelKo: profile.coverageLabelKo,
      },
      officialTnaDocuments: profile.officialDocuments,
      technologies,
      barriers: profile.barriers,
      projectIdeas: profile.projectIdeas,
    };
    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      }),
      `${filename}.json`
    );
    return rows.length;
  }

  const headers = Object.keys(rows[0] ?? { country_iso3: "" });
  const csv =
    "\uFEFF" +
    [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((key) => csvCell((row as Record<string, unknown>)[key]))
          .join(",")
      ),
    ].join("\n");
  downloadBlob(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    `${filename}.csv`
  );
  return rows.length;
}
