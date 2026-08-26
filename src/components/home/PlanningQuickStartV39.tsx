import { useMemo, useState } from "react";
import { PRIORITY_COUNTRIES } from "../../data/priorityCountries";
import { getTechnologyFilterGroups } from "../../utils/technologyData";

interface PlanningQuickStartV39Props {
  onStart: (countryIso3: string, technologyId: string) => void;
}

export default function PlanningQuickStartV39({
  onStart,
}: PlanningQuickStartV39Props) {
  const [countryIso3, setCountryIso3] = useState("");
  const [technologyId, setTechnologyId] = useState("");
  const technologyGroups = useMemo(() => getTechnologyFilterGroups(), []);
  const ready = Boolean(countryIso3 && technologyId);

  return (
    <section
      className="planning-quick-v39"
      aria-labelledby="planning-quick-v39-title"
    >
      <div className="planning-quick-v39-heading">
        <span>협력 검토 바로 시작</span>
        <strong id="planning-quick-v39-title">국가 × 기후기술 선택</strong>
        <p>수요·적용여건·정책·사업·기관·지역·인허가 근거를 한 흐름으로 확인</p>
      </div>

      <div className="planning-quick-v39-controls">
        <label>
          <span>협력대상국</span>
          <select
            value={countryIso3}
            onChange={(event) => setCountryIso3(event.target.value)}
          >
            <option value="">국가 선택</option>
            {PRIORITY_COUNTRIES.map((country) => (
              <option key={country.iso3} value={country.iso3}>
                {country.nameKo}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>기후기술</span>
          <select
            value={technologyId}
            onChange={(event) => setTechnologyId(event.target.value)}
          >
            <option value="">기후기술 선택</option>
            {technologyGroups.map((group) => (
              <optgroup key={group.category} label={group.category}>
                {group.technologies.map((technology) => (
                  <option key={technology.id} value={technology.id}>
                    {technology.nameKo}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        className="planning-quick-v39-submit"
        disabled={!ready}
        onClick={() => ready && onStart(countryIso3, technologyId)}
      >
        협력 검토 시작 →
      </button>

      <small>
        선택은 추천·우선순위 판정이 아니라 검토 조건 설정 · 플랫폼에 연결된
        공개근거만 사용
      </small>
    </section>
  );
}
