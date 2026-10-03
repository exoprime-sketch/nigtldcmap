import { describe, expect, it } from "@jest/globals";
import { publicProcessWordingV162 } from "./processWordingV162";

describe("V164 public wording", () => {
  it("drops the delivery's missing-reason codes and keeps the words", () => {
    expect(publicProcessWordingV162("해당 여부는 미확인(M06) 이다")).toBe("해당 여부는 미확인 이다");
    expect(publicProcessWordingV162("수치는 공란(NP·M01). 기후재원")).toBe("수치는 공란. 기후재원");
    expect(publicProcessWordingV162("[숏리스트 상한] M03 구조적 부존")).toBe("[숏리스트 상한] 구조적 부존");
    expect(publicProcessWordingV162("M10 kV 설비")).toBe("M10 kV 설비");
  });
  it("reads an OSM track grade as its class", () => {
    expect(publicProcessWordingV162("도로 레이어 분류별 지물 수(track_grade1)")).toBe("도로 레이어 분류별 지물 수(임도 1등급)");
  });
});
