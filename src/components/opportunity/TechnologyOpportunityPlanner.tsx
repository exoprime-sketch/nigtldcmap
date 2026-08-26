import { useState } from "react";
import type { ChangeEvent } from "react";
import { PRIORITY_COUNTRIES } from "../../data/priorityCountries";
import TechnologyOpportunityPanel from "./TechnologyOpportunityPanel";

interface TechnologyOpportunityPlannerProps {
  onOpenCountry: (iso3: string) => void;
}

export default function TechnologyOpportunityPlanner({
  onOpenCountry,
}: TechnologyOpportunityPlannerProps) {
  const [iso3, setIso3] = useState<string>("VNM");
  const country =
    PRIORITY_COUNTRIES.find((item) => item.iso3 === iso3) ??
    PRIORITY_COUNTRIES[0];

  return (
    <div className="page-shell opportunity-v28-planner-page">
      <header className="opportunity-v28-planner-heading">
        <div>
          <span className="eyebrow dark">사업기획 지원</span>
          <h1>기술별 사업기회</h1>
          <p>
            국가와 기후기술 분야을 선택해 수요·정책·기관·인허가·재원·부족한
            정보와 다음 행동을 한 번에 확인
          </p>
        </div>
        <label>
          <span>우선 구축국</span>
          <select
            value={iso3}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setIso3(event.target.value)
            }
          >
            {PRIORITY_COUNTRIES.map((item) => (
              <option key={item.iso3} value={item.iso3}>
                {item.nameKo} · {item.iso3}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="opportunity-v28-guidance">
        <strong>판단 원칙</strong>
        <span>국가 평균값은 1차 참고</span>
        <span>기술별 직접 수요와 기관 근거 우선</span>
        <span>확인되지 않은 정보는 추정하지 않고 추가 확인 필요로 표시</span>
        <span>하나의 종합점수 대신 근거별 확인상태 제공</span>
      </div>

      <TechnologyOpportunityPanel
        key={iso3}
        iso3={iso3}
        countryNameKo={country.nameKo}
        initialTechnologyId="solar-pv"
      />

      <div className="opportunity-v28-country-link">
        <button
          type="button"
          className="secondary-button"
          onClick={() => onOpenCountry(iso3)}
        >
          {country.nameKo} 국가 프로필 확인
        </button>
      </div>
    </div>
  );
}
