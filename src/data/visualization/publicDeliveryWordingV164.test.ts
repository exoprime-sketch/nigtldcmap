import { describe, expect, it } from "@jest/globals";
import { publicDeliveryWordingV164 } from "./publicDeliveryWordingV164";

describe("publicDeliveryWordingV164", () => {
  it("reads the procurement words as the platform's own data", () => {
    expect(publicDeliveryWordingV164("4차 납품분은 고용률(%)과 임금을 담았다.")).toBe("이번 수록 자료는 고용률(%)과 임금을 담았다.");
    expect(publicDeliveryWordingV164("4차 납품분에서 Tier 1 값만 있다.")).toBe("이번 수록 자료에서 Tier 1 값만 있다.");
    expect(publicDeliveryWordingV164("4차 납품분이 전수가 아니다")).toBe("이번 수록 자료가 전수가 아니다");
    expect(publicDeliveryWordingV164("라이선스 조항 때문에 이번 납품에서 값이 제거됐다.")).toBe("라이선스 조항 때문에 이번 수록 자료에서 값이 제거됐다.");
    expect(publicDeliveryWordingV164("미공급 지역은 이번 납품물에 없다.")).toBe("미공급 지역은 이번 수록 자료에 없다.");
    expect(publicDeliveryWordingV164("납품된 성 단위 지표는 5종")).toBe("수록된 성 단위 지표는 5종");
    expect(publicDeliveryWordingV164("표출에서 제외(납품 7개국분은 유지)")).toBe("표출에서 제외(수록된 7개국분은 유지)");
  });
  it("leaves a text without the words as it is", () => {
    expect(publicDeliveryWordingV164("값은 2024년 기준이다.")).toBe("값은 2024년 기준이다.");
    expect(publicDeliveryWordingV164(null)).toBe("");
  });
});
