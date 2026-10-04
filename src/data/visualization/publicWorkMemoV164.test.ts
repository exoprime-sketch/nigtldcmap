import { isWorkMemoOnlyV164, publicMarksV164, publicWorkMemoV164 } from "./publicWorkMemoV164";

/**
 * V164-3: working memos cut from public text. Every case is a string the
 * delivery shipped; the second half of each test names the fact that has to
 * survive the cut.
 */
describe("publicWorkMemoV164", () => {
  it("empties a cell that only records how a column was migrated", () => {
    expect(publicWorkMemoV164("구서식 열 「[참여] 협의 기간」에서 이관")).toBe("");
    expect(publicWorkMemoV164('구서식 열 "[투자] 가스 비중 (%)"에서 이관')).toBe("");
    expect(isWorkMemoOnlyV164("구서식 열 「[재원] 총 소요 2023-2050 (십억 USD)」에서 이관")).toBe(true);
  });

  it("cuts a cross reference to another element and keeps the statement", () => {
    expect(publicWorkMemoV164("NAP 전체 개입 과제 수 — C-003과 동일 수치")).toBe("NAP 전체 개입 과제 수");
    expect(publicWorkMemoV164("C-013 참조, 연결매출 7.5억 EUR 이상 다국적기업그룹, 최저 실효세율 15%로 CIT 우대 효과 상쇄")).toBe(
      "연결매출 7.5억 EUR 이상 다국적기업그룹, 최저 실효세율 15%로 CIT 우대 효과 상쇄"
    );
    expect(publicWorkMemoV164("Net Metering Guidelines 2018 (SREDA·전력국) — 세부 운영 규정은 C-017 참조")).toBe(
      "Net Metering Guidelines 2018 (SREDA·전력국)"
    );
    expect(publicWorkMemoV164("C-017 · C-018")).toBe("");
    expect(publicWorkMemoV164("재생에너지 투자 인센티브(C-017)의 법적 근거")).toBe("재생에너지 투자 인센티브의 법적 근거");
  });

  it("empties a source line that is only the compiler's check", () => {
    expect(publicWorkMemoV164("raw 원문 대조")).toBe("");
    expect(publicWorkMemoV164("raw 원문 제1면 대조")).toBe("");
    expect(publicWorkMemoV164("문서포털 메타(번호·일자)")).toBe("");
    expect(publicWorkMemoV164("현 납품본 기재")).toBe("");
    expect(publicWorkMemoV164("문서포털 메타·현 납품본 기재")).toBe("");
  });

  it("cuts the raw-file parenthesis from a citation and keeps the citation", () => {
    expect(
      publicWorkMemoV164("CCKP CMIP6 annual core, historical 1950-2014 및 SSP median 시계열 (raw JSON 4종에서 기준기간·전망기간 평균 직접 산출)")
    ).toBe("CCKP CMIP6 annual core, historical 1950-2014 및 SSP median 시계열");
    // the decree number inside the parenthesis is a fact; only the raw pointer goes
    expect(publicWorkMemoV164("총발전량 전망은 개정 PDP8(768/QĐ-TTg, C-016 raw) p.3-4")).toBe("총발전량 전망은 개정 PDP8(768/QĐ-TTg) p.3-4");
    expect(publicWorkMemoV164("정치선언 §18 · RMP §1 p.13-14 (C-004 raw)")).toBe("정치선언 §18 · RMP §1 p.13-14");
  });

  it("cuts a fetch failure sentence and keeps the sentence that states the finding", () => {
    const text =
      "지정 출처인 SREDA NDRE(ndre.sreda.gov.bd)가 자동화 접근에 HTTP 403(봇 차단)을 반환하여 공식 수치를 원본으로 확보하지 못함. 대체로 IRENA 통계를 수록하였으며, 두 출처는 집계 정의가 달라 서로 대체하지 않음.";
    const result = publicWorkMemoV164(text);
    expect(result).toBe("IRENA 통계를 수록하였으며, 두 출처는 집계 정의가 달라 서로 대체하지 않음.");
    expect(result).not.toMatch(/HTTP|봇 차단|확보하지/u);
    expect(
      publicWorkMemoV164("방글라데시 경찰청(police.gov.bd)이 2026-09-03 재확인 시점에 응답하지 않아 원본을 확보하지 못함. 표준 데이터요소 「범죄 통계」는 World Bank VC.IHR.PSRC.P5로 충족함.")
    ).toBe("표준 데이터요소 「범죄 통계」는 World Bank VC.IHR.PSRC.P5로 충족함.");
  });

  it("cuts an open review flag from a status and keeps the status", () => {
    expect(publicWorkMemoV164("시행중 (모법 대체에 따른 재확인 필요)")).toBe("시행중");
    expect(publicWorkMemoV164("시행중(확인 필요)")).toBe("시행중");
    expect(publicWorkMemoV164("확인 필요")).toBe("");
    expect(publicWorkMemoV164("투자방글라데시법 2026 상태 확인 필요")).toBe("");
    expect(publicWorkMemoV164("IRENA를 상정할 수 없음(대안 경로 검토 필요)")).toBe("IRENA를 상정할 수 없음");
  });

  it("cuts a dash tail that is the memo and keeps the head", () => {
    expect(
      publicWorkMemoV164("해당국(BGD) 발효일: 원천 미제공 — ADB ARIC 은 협정 단위 최초 발효일만 제공하므로 해당국 발효일은 각국 관보·협정 사무국 공고로 별도 확인 필요")
    ).toBe("해당국(BGD) 발효일: 원천 미제공");
  });

  it("keeps the result of a check that is reported after the memo", () => {
    expect(publicWorkMemoV164("미제출(2026-08-19 UNFCCC 장기전략 포털 당사국 목록 전수 대조 — 제출 80건 중 Bangladesh 행 없음)")).toBe(
      "미제출(제출 80건 중 Bangladesh 행 없음)"
    );
  });

  it("cuts origin tags and the sentence they open when it is a memo", () => {
    expect(publicWorkMemoV164("[국제] 원천 미제공 — 문서에 제3자 검증 절차 기재 없음")).toBe("원천 미제공 — 문서에 제3자 검증 절차 기재 없음");
    // a check note whose head is the memo is a memo through and through
    expect(
      publicWorkMemoV164(
        "[공식] Certification Body 세부 스코프 페이지 접근 실패로 완전 부재 단정 불가 — 원천 간 표기가 상이하다"
      )
    ).toBe("");
    expect(
      publicWorkMemoV164(
        "[상충] 현장 확인 결과(2026-08-04 전달)는 국내 ETS 출범을 2028년으로 보고하여 상이하며 본 파일 r5(Decree 119/2025)·r11 일정과 맞지 않아 본값은 법령 기준이다"
      )
    ).toBe("");
  });

  it("keeps an English raw material and the facts around a memo list", () => {
    expect(publicWorkMemoV164("raw ore not exportable; raw zircon ore not exportable")).toBe("raw ore not exportable; raw zircon ore not exportable");
    expect(publicWorkMemoV164("Medium and large industries using natural gas and other minerals as raw material")).toBe(
      "Medium and large industries using natural gas and other minerals as raw material"
    );
    // a list keeps its clean parts when the memo is not the first one
    expect(publicWorkMemoV164("회원국 7개국 · 서명 1975-07-31 · 발효 1976-06-17 · 본 파일 r5 참조")).toBe(
      "회원국 7개국 · 서명 1975-07-31 · 발효 1976-06-17"
    );
  });

  it("keeps the leading clause of a sentence whose later clause is the memo", () => {
    expect(publicWorkMemoV164("명시 조항 없음, 통합본 전문 검색(giá trị đồng tiền · value for money) 불검출")).toBe("명시 조항 없음");
    expect(publicWorkMemoV164("투자정책승인·외국인 시장접근·세제 인센티브·토지임대 보장, raw는 C-013 폴더 보유")).toBe(
      "투자정책승인·외국인 시장접근·세제 인센티브·토지임대 보장"
    );
    // a number with a thousands comma is not a clause boundary
    expect(publicWorkMemoV164("소요재원 3,927.4 백만 USD (C-001 참조)")).toBe("소요재원 3,927.4 백만 USD");
  });

  it("drops a memo sentence that runs through a middle-dot list", () => {
    expect(publicWorkMemoV164("수록하지 않음. 재확보 대상 1차 출처: BTR1 제2장 · 국가 경제·기후 영향 평가 보고서")).toBe("수록하지 않음.");
  });

  it("does not touch a value, a date, a negative number or a clean sentence", () => {
    const clean = [
      "-12.5",
      "2025-10-08",
      "Decision 500/QĐ-TTg ngày 15/05/2023",
      "S.R.O. 211-Ain/Aykar-2/2026",
      "회원국(7): Bangladesh, India, Sri Lanka",
      "BAU 대비 3.5%·소요재원 3,927.4 백만 USD",
      "시행 2025-07-01 (결의 효력 2025-06-12)",
    ];
    for (const text of clean) expect(publicWorkMemoV164(text)).toBe(text);
  });

  it("is idempotent", () => {
    const samples = [
      "NAP 전체 개입 과제 수 — C-003과 동일 수치",
      "시행중 (모법 대체에 따른 재확인 필요)",
      "총발전량 전망은 개정 PDP8(768/QĐ-TTg, C-016 raw) p.3-4",
      "미제출(2026-08-19 UNFCCC 장기전략 포털 당사국 목록 전수 대조 — 제출 80건 중 Bangladesh 행 없음)",
    ];
    for (const text of samples) {
      const once = publicWorkMemoV164(text);
      expect(publicWorkMemoV164(once)).toBe(once);
    }
  });

  it("cuts the dash tail of one list item without taking the items before it", () => {
    const note =
      "구분: 양자 · 사건일 — 검토 개시: 2018; WTO 통보: 미통보 · 협정 최초 발효일: 해당 없음(미발효) · 해당국(BGD) 발효일: 원천 미제공 — ADB ARIC 은 협정 단위 최초 발효일만 제공하므로 별도 확인 필요 · 수집 기준일: 2026-09-18 · 원천: ADB ARIC FTA Database";
    const cleaned = publicWorkMemoV164(note);
    for (const fact of ["사건일 — 검토 개시: 2018", "WTO 통보: 미통보", "협정 최초 발효일: 해당 없음(미발효)", "해당국(BGD) 발효일: 원천 미제공", "수집 기준일: 2026-09-18", "원천: ADB ARIC FTA Database"]) {
      expect(cleaned).toContain(fact);
    }
    expect(cleaned).not.toMatch(/확인 필요|단위 최초/u);
  });

  it("cuts the note on keeping an earlier collection and keeps the statement it qualifies", () => {
    expect(publicWorkMemoV164("해당국 발효일: 2024-11-17 (종전 수집 근거 유지 — 해당국 기준 발효일)")).toBe("해당국 발효일: 2024-11-17 (해당국 기준 발효일)");
  });
});

describe("publicMarksV164", () => {
  it("writes the block separator as the note's own separator and drops the ISO code after 해당국", () => {
    expect(publicMarksV164("비고: 상품무역협정 기준 ▣ 상태(통일): 발효")).toBe("비고: 상품무역협정 기준 · 상태(통일): 발효");
    expect(publicMarksV164("해당국(VNM) 발효일: 2024-11-17")).toBe("해당국 발효일: 2024-11-17");
  });

  it("leaves text with neither mark as it is", () => {
    for (const text of ["회원국(7): Bangladesh", "해당국 발효일: 원천 미제공", "전국(VNM) 합계"]) expect(publicMarksV164(text)).toBe(text);
  });

  it("takes the scraped HTML out of a value and keeps every name in it (VNM D-025 sector)", () => {
    expect(publicMarksV164('Energy/Electricity, Roads/electricity-generation">Bridge and highway, <br/>Electricity generation')).toBe(
      "Energy/Electricity, Roads, Bridge and highway, Electricity generation"
    );
    expect(publicMarksV164("<td>Afforestation and reforestation programme</td>")).toBe("Afforestation and reforestation programme");
    expect(publicMarksV164("Line one<br>Line two")).toBe("Line one Line two");
  });

  it("keeps a placeholder the source states in a URL template (C-009 portal note)", () => {
    const note = "진입점 vbpl.vn/van-ban/dia-phuong (?province=<slug>), 성별 개별 포털 vbpl.vn/<slug>/Pages/Home.aspx.";
    expect(publicMarksV164(note)).toBe(note);
  });

  it("does not read a comparison or a quoted figure as markup", () => {
    for (const text of ["감축률 <10% 구간", "a < b and c > d", '인용문 "10 > 5" 참고', "5<6, 7>3"]) expect(publicMarksV164(text)).toBe(text);
  });
});
