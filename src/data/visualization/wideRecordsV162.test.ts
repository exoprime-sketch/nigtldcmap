import { describe, expect, it } from "@jest/globals";

import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { readWideRecordsV162 } from "./wideRecordsV162";
import c017Fixture from "./__fixtures__/wideRecordC017V162.json";

type FieldDef = { sourceField: string; label: string; normalizedKey: string };

// A synthetic field list shaped like the 2026-09-30 wide delivery: a [식별]
// name/type pair, one content block, an administrative code the reader must
// hide, a [기술] bookkeeping block, a [결측] bookkeeping block and a full
// [출처] block.
const FIELD_DEFINITIONS: FieldDef[] = [
  { sourceField: "attr_1", label: "[식별] 레코드ID", normalizedKey: "식별_레코드ID" },
  { sourceField: "attr_2", label: "[식별] 레코드명", normalizedKey: "식별_레코드명" },
  { sourceField: "attr_3", label: "[식별] 레코드 유형", normalizedKey: "식별_레코드_유형" },
  { sourceField: "attr_4", label: "[인센티브] 유형", normalizedKey: "인센티브_유형" },
  { sourceField: "attr_5", label: "[가격] 단가 (VND/kWh)", normalizedKey: "가격_단가_VND_kWh" },
  { sourceField: "attr_6", label: "[지역] 지역명 (현행)", normalizedKey: "지역_지역명_현행" },
  { sourceField: "attr_7", label: "[지역] 행정코드 (현행)", normalizedKey: "지역_행정코드_현행" },
  { sourceField: "attr_8", label: "[출처] 원문 문서명", normalizedKey: "출처_원문_문서명" },
  { sourceField: "attr_9", label: "[출처] 원문 URL", normalizedKey: "출처_원문_URL" },
  { sourceField: "attr_10", label: "[출처] raw 파일명", normalizedKey: "출처_raw_파일명" },
  { sourceField: "attr_11", label: "[출처] 인용 위치", normalizedKey: "출처_인용_위치" },
  { sourceField: "attr_12", label: "[기술] 기술코드 판단 유형", normalizedKey: "기술_기술코드_판단_유형" },
  { sourceField: "attr_13", label: "[결측] framework 필수 속성 결측 (코드·사유)", normalizedKey: "결측_필수_속성_결측" },
];

function entity(overrides: Partial<VietnamEntityV124> & { recordId: string; normalizedAttributes: Record<string, unknown> }): VietnamEntityV124 {
  return {
    elementId: "C-099",
    entityType: "entity",
    countryIso3: "VNM",
    name: null,
    rawAttributes: {},
    missingReasonCode: null,
    note: null,
    loadStatus: "published",
    warnings: [],
    rightsStatus: "public-release-approved",
    rightsNote: "",
    downloadEligible: true,
    mapEligible: false,
    provenance: {
      sourcePackage: "vietnam-data.zip",
      sourceFileOriginal: "C-099_test.xlsx",
      sourceFileDecoded: "C-099_test.xlsx",
      sourceSheet: "1.2_entity(레코드형)",
      sourceRow: 1,
      elementId: "C-099",
    },
    ...overrides,
  };
}

const RECORD_ONE = entity({
  recordId: "VNM-C099-TEST-001",
  note: "raw `C-099_x.pdf` 처리 메모 — 현지조사(Field Survey Items_v1.0)",
  normalizedAttributes: {
    식별_레코드ID: "VNM-C099-TEST-001",
    식별_레코드명: "테스트 인센티브 A",
    식별_레코드_유형: "국가 목표",
    인센티브_유형: "FIT",
    가격_단가_VND_kWh: 2086,
    지역_지역명_현행: "하노이",
    지역_행정코드_현행: "VN-HN",
    출처_원문_문서명: "테스트 근거 문서",
    출처_원문_URL: "https://example.org/decree.pdf",
    출처_raw_파일명: "raw `C-099_x.pdf`",
    출처_인용_위치: "제3조",
    기술_기술코드_판단_유형: "직접, 원천 자체 분류",
    결측_필수_속성_결측: null,
  },
});

const RECORD_TWO = entity({
  recordId: "VNM-C099-TEST-002",
  normalizedAttributes: {
    식별_레코드ID: "VNM-C099-TEST-002",
    식별_레코드명: "테스트 인센티브 B",
    식별_레코드_유형: "지역 배분",
    인센티브_유형: "세액공제",
    가격_단가_VND_kWh: null,
    지역_지역명_현행: null,
    지역_행정코드_현행: null,
    출처_원문_문서명: null,
    출처_원문_URL: null,
    출처_raw_파일명: null,
    출처_인용_위치: null,
    기술_기술코드_판단_유형: null,
    결측_필수_속성_결측: null,
  },
});

describe("readWideRecordsV162 - what a reader never sees", () => {
  const records = readWideRecordsV162([RECORD_ONE, RECORD_TWO], FIELD_DEFINITIONS);

  it("never puts the [식별] record id, an administrative code, a [기술] block or the record's own note in blocks", () => {
    const serializedBlocks = JSON.stringify(records.map((record) => record.blocks));
    expect(serializedBlocks).not.toContain("VNM-C099-TEST-001");
    expect(serializedBlocks).not.toContain("VNM-C099-TEST-002");
    expect(serializedBlocks).not.toContain("VN-HN");
    expect(records.every((record) => !record.blocks.some((block) => block.block === "식별"))).toBe(true);
    expect(records.every((record) => !record.blocks.some((block) => block.block === "기술"))).toBe(true);
    expect(records.every((record) => !record.blocks.some((block) => block.block === "결측"))).toBe(true);
    expect(
      records.every((record) => !record.blocks.some((block) => block.values.some((value) => /행정\s*코드/.test(value.attribute))))
    ).toBe(true);
    // The delivered raw file pointer, whether in [출처] or the note field, never surfaces.
    expect(serializedBlocks).not.toMatch(/raw\s*`/u);
    expect(JSON.stringify(records.map((record) => record.source))).not.toMatch(/raw\s*`/u);
    expect(serializedBlocks).not.toContain("현지조사");
  });

  it("reads name and type from [식별], and the [출처] block becomes source", () => {
    const [first, second] = records;
    expect(first.name).toBe("테스트 인센티브 A");
    expect(first.type).toBe("국가 목표");
    expect(first.source).toEqual({
      document: "테스트 근거 문서",
      url: "https://example.org/decree.pdf",
      pageUrl: null,
      citation: "제3조",
    });
    expect(second.name).toBe("테스트 인센티브 B");
    expect(second.type).toBe("지역 배분");
    expect(second.source).toEqual({ document: null, url: null, pageUrl: null, citation: null });
  });

  it("keeps the record's content blocks, with the block name as the section title", () => {
    const [first] = records;
    const incentiveBlock = first.blocks.find((block) => block.block === "인센티브");
    expect(incentiveBlock?.values).toEqual([{ attribute: "유형", value: "FIT", href: undefined }]);
    const priceBlock = first.blocks.find((block) => block.block === "가격");
    expect(priceBlock?.values).toEqual([{ attribute: "단가 (VND/kWh)", value: "2086", href: undefined }]);
    const regionBlock = first.blocks.find((block) => block.block === "지역");
    // The administrative code is hidden; only the region name is left.
    expect(regionBlock?.values).toEqual([{ attribute: "지역명 (현행)", value: "하노이", href: undefined }]);
  });

  it("get() reads one attribute by block, and hides the same attributes as blocks", () => {
    const [first] = records;
    expect(first.get("인센티브", "유형")).toBe("FIT");
    expect(first.get("지역", "지역명 (현행)")).toBe("하노이");
    expect(first.get("지역", "행정코드 (현행)")).toBeNull();
    expect(first.get("없음", "없음")).toBeNull();
  });

  it("drops a block with nothing public left, rather than an empty section", () => {
    const [, second] = records;
    expect(second.blocks.some((block) => block.block === "인센티브")).toBe(true);
    expect(second.blocks.some((block) => block.block === "가격")).toBe(false);
    expect(second.blocks.some((block) => block.block === "지역")).toBe(false);
  });
});

describe("readWideRecordsV162 - not the wide template", () => {
  it("returns [] for field definitions that are not the wide template's own header shape", () => {
    const plainFields: FieldDef[] = [
      { sourceField: "attr_1", label: "국가", normalizedKey: "국가" },
      { sourceField: "attr_2", label: "연도", normalizedKey: "연도" },
    ];
    expect(readWideRecordsV162([RECORD_ONE], plainFields)).toEqual([]);
  });

  it("returns [] when fieldDefinitions is missing entirely", () => {
    expect(readWideRecordsV162([RECORD_ONE], undefined)).toEqual([]);
  });
});

describe("readWideRecordsV162 - a real 2026-09-30 C-017 delivery record", () => {
  // Decoded from the V162 staging packs (one C-017-FIT
  // record's meta.fieldDefinitions and normalizedAttributes), copied into
  // __fixtures__/wideRecordC017V162.json rather than re-decoded per test run.
  const fixtureEntity = entity({
    recordId: String((c017Fixture.normalizedAttributes as Record<string, unknown>)["식별_레코드ID"]),
    elementId: "C-017",
    normalizedAttributes: c017Fixture.normalizedAttributes as Record<string, unknown>,
  });

  it("renders no record id and no raw-file pointer for a real delivered record", () => {
    const [record] = readWideRecordsV162([fixtureEntity], c017Fixture.fieldDefinitions as FieldDef[]);
    expect(record).toBeDefined();
    const rendered = JSON.stringify({ name: record.name, type: record.type, blocks: record.blocks, source: record.source });
    expect(rendered).not.toMatch(/VNM-C\d{3}-/u);
    expect(rendered).not.toMatch(/raw\s*`/u);
  });
});

describe("withoutFileNamesV162 (V162: file names never on screen)", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { withoutFileNamesV162, sourceLinkTextV162 } = require("./wideRecordsV162");
  it("empties a cell that is only a file name", () => {
    expect(withoutFileNamesV162("C-012_PPP 법제도·조달 체계_WB_PPP_Legal_Framework_Snapshot_Vietnam.pdf(3쪽)")).toBe("");
  });
  it("removes a file name in a parenthesis or as a token, keeping the sentence", () => {
    expect(withoutFileNamesV162("768/QĐ-TTg 부록 II(C-016_재생에너지 발주 및 확대 계획_pl1-2.pdf) Bảng 1~5, 「Bắc Giang」 행")).toBe(
      "768/QĐ-TTg 부록 II Bảng 1~5, 「Bắc Giang」 행"
    );
    expect(withoutFileNamesV162("SB61 일본 제출문서(4.SB61_Art.6.8_Japan.pdf)·GCNMA-8 사무국 자료")).toBe("SB61 일본 제출문서·GCNMA-8 사무국 자료");
  });
  it("leaves URLs and ordinary text alone", () => {
    expect(withoutFileNamesV162("https://unfccc.int/sites/default/files/resource/NAP_Vietnam_2025_EN.pdf")).toBe(
      "https://unfccc.int/sites/default/files/resource/NAP_Vietnam_2025_EN.pdf"
    );
    expect(withoutFileNamesV162("국가 적응계획(NAP) 2021–2030")).toBe("국가 적응계획(NAP) 2021–2030");
  });
  it("names a link by the document title, else as the original PDF", () => {
    expect(sourceLinkTextV162("https://x.org/a.pdf", "국가 적응계획")).toBe("국가 적응계획");
    expect(sourceLinkTextV162("https://x.org/a.pdf")).toBe("원문 PDF");
    expect(sourceLinkTextV162("https://x.org/page")).toBe("원문");
  });
});

describe("V162 public wording of the supplier's process and migration log", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { publicProcessWordingV162 } = require("./wideRecordsV162");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { publicRecordNoteV161 } = require("./publicFieldPolicyV126");
  it("names a field-survey record the way its block title does", () => {
    expect(publicProcessWordingV162("현지조사, A. Physical Security & Violent Crime")).toBe("현장 확인 — A. Physical Security & Violent Crime");
    expect(publicProcessWordingV162("현지조사 필요 항목")).toBe("현장 확인 항목");
    expect(publicProcessWordingV162("NIP 2016으로 표기. 개별 업종은 BGD-C013-EQ-RSV-01~04 · CTL-01~22 행으로 전개")).toBe("NIP 2016으로 표기.");
    expect(publicProcessWordingV162("게시 파일명이 Bangladesh_BTR1_Interim.pdf 로 잠정본 성격이며")).toBe("게시 파일명상 잠정본 성격이며");
  });
  it("drops the delivery's migration log from a record note, keeping its statements", () => {
    expect(
      publicRecordNoteV161(
        "최신 제출본은 BUR3(2021-04-16). [구분자 통일] 구서식 구분자 「C-002_report_submission」 [열→행 전개] 구서식 열 「[재원] BTR1 준비 지원액」 (레코드ID VNM-C002-BTR1)"
      )
    ).toBe("최신 제출본은 BUR3(2021-04-16).");
    expect(publicRecordNoteV161("재계산 결과. 공표 인벤토리 시계열(1994·2000)은 C-002_inventory_timeseries 행에 수록.")).toBe("재계산 결과.");
    expect(publicRecordNoteV161("Decree 119/2025/ND-CP 로 도입(본 파일 r5). Thông tư 11/2026(2026-02-13 서명, 본 파일 r23).")).toBe(
      "Decree 119/2025/ND-CP 로 도입. Thông tư 11/2026(2026-02-13 서명)."
    );
    expect(publicRecordNoteV161("판권면을 재확인한 결과 Germanwatch_CRI2026_full_report.pdf 에 CC 표기가 없다.")).toBe("판권면을 재확인한 결과 에 CC 표기가 없다.");
  });
});

describe("V163 (3a): a [지역] block's 개편 전/현행 pair collapses to one 지역명 for a country with no reform", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { mergeRegionNameValuesV163 } = require("./wideRecordsV162");
  it("keeps '현행' and drops '개편 전', renamed to the plain '지역명'", () => {
    const values = [
      { attribute: "지역명 (개편 전)", value: "다카" },
      { attribute: "지역명 (현행)", value: "다카" },
      { attribute: "행정코드 (현행)", value: "BGD.3_1" },
    ];
    expect(mergeRegionNameValuesV163(values)).toEqual([
      { attribute: "지역명", value: "다카" },
      { attribute: "행정코드 (현행)", value: "BGD.3_1" },
    ]);
  });
  it("falls back to '개편 전' alone when '현행' is absent", () => {
    expect(mergeRegionNameValuesV163([{ attribute: "지역명 (개편 전)", value: "치타공" }])).toEqual([
      { attribute: "지역명", value: "치타공" },
    ]);
  });
  it("leaves a block with neither name attribute untouched", () => {
    const values = [{ attribute: "행정코드 (현행)", value: "BGD.3_1" }];
    expect(mergeRegionNameValuesV163(values)).toBe(values);
  });
});
