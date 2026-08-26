import type { View } from "../../app/navigation";

interface PlanningContextBarV42Props {
  currentView: View;
  countryIso3: string | null;
  technologyId: string | null;
  onOpenExplorer: () => void;
  onOpenCountry: () => void;
}

/**
 * v58
 * 공개 이용자 화면에서는 중복되는 상단 문맥 안내 바를 노출하지 않는다.
 * 국가·기후기술 선택 상태는 각 화면의 필터/페이지 문맥과 URL 상태로 유지한다.
 */
export default function PlanningContextBarV42(
  _props: PlanningContextBarV42Props
) {
  return null;
}
