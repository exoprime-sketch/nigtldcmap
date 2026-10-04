import { describe, expect, it } from "@jest/globals";
import { publicLicenseTextV164 } from "./publicFieldPolicyV126";

describe("V164 licence text", () => {
  it("keeps the licence names and drops the delivery's licence review", () => {
    const delivered =
      "ADB 이용약관(개인·비상업 한정 · 재배포 금지) [사실/표현 분리] 자료는 기관명·소재지·연락처·직위·연도 등 사실 정보로 구성되며 원천의 서술형 표현물을 그대로 옮기지 않음. 「저작권법」 제2조제1호상 사실 자체는 저작물이 아니므로 원천 약관의 재배포 제한은 본 자료에 미치지 않는 것으로 판단(출처표시 조건부 표출). · " +
      "라이선스 미게시 — 덴마크 외교부 누리집에 저작권·이용약관 페이지 부재(사이트맵·푸터 전수 확인) [라이선스 X] 원천이 이용약관·저작권정책을 게시하지 않아 재이용 조건의 근거가 없다. 명시적 이용허락이 없으므로 기본 저작권에 따라 플랫폼 표출 '불가'로 판정한다. · " +
      "EU 문서 재사용 결정 2011/833/EU(출처표시 조건) 출처표시 외 추가 제약이 없어 표출·다운로드 모두 허용.";
    expect(publicLicenseTextV164(delivered)).toBe(
      "ADB 이용약관(개인·비상업 한정 · 재배포 금지) · 라이선스 미게시 — 덴마크 외교부 누리집에 저작권·이용약관 페이지 부재 · EU 문서 재사용 결정 2011/833/EU(출처표시 조건)"
    );
  });
  it("leaves a plain licence as it is", () => {
    expect(publicLicenseTextV164("CC BY 4.0")).toBe("CC BY 4.0");
    expect(publicLicenseTextV164("")).toBeNull();
  });
  it("reads a quoted original under a plain label", () => {
    expect(publicLicenseTextV164('Source: GDL. [GDL 이용조건 원문] "The indicators can be used"')).toBe('Source: GDL. 이용조건 원문: "The indicators can be used"');
  });
});
