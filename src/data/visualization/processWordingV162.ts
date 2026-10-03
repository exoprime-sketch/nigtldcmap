/**
 * V162: the supplier's process word in a record's own name or type ("현지조사,
 * A. Physical Security …", "현지조사 필요 항목") reads under the reader's name,
 * the same one the block title uses (현지조사 → 현장 확인 자료). The findings
 * themselves stay; only the word for how they were gathered changes.
 */
export function publicProcessWordingV162(text: string): string {
  return text
    .replace(/현지조사\s*필요\s*항목/gu, "현장 확인 항목")
    .replace(/^현지조사\s*[,，]\s*/u, "현장 확인 — ")
    .replace(/현지\s*컨설턴트\s*/gu, "")
    .replace(/현지조사/gu, "현장 확인")
    // A statement about a published file's name keeps its point, not the name
    // ("게시 파일명이 Bangladesh_BTR1_Interim.pdf 로 잠정본 성격" → "게시 파일명상 잠정본 성격").
    .replace(/파일명이\s+(?!https?:)[^\s()（）]+\.(?:pdf|xlsx?|csv|docx?)\s*로\s*/gu, "파일명상 ")
    // A clause that points at other rows by the delivery's record ids
    // ("개별 업종은 BGD-C013-EQ-RSV-01~04 · CTL-01~22 행으로 전개").
    .replace(/\s*[^.。·]*\b(?:VNM|BGD)-[A-E]\d{3}-[^.。]*[.。]?/gu, "")
    // V164: the delivery's missing-reason codes ("미확인(M06)", "공란(NP·M01)",
    // "M03 구조적 부존") are for the data sheet; the words around them stay.
    .replace(/\s*\((?:NP|M(?:0[1-9]|1\d))(?:\s*·\s*(?:NP|M(?:0[1-9]|1\d)))*\)/gu, "")
    .replace(/(^|[\s\]·(])(?:CF\/)?M(?:0[1-9]|1\d)\s+(?=[가-힣])/gu, "$1")
    // An OSM tag value in a label ("track_grade1") reads as the class it names.
    .replace(/track_grade([1-5])/gu, "임도 $1등급")
    .trim();
}
