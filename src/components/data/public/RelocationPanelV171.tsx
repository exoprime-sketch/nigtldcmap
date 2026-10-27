import { useEffect, useState } from "react";
import type { CountryEntityV122 } from "../../../data/countries/countryDataTypesV122";
import { loadRelocatedRecordsV171 } from "../../../data/countries/countryDataFacadeV122";
import { relocationFromV171, relocationIntoV171 } from "../../../data/relocation/recordRelocationV171";
import { withDirectoryKeysV164 } from "../../../data/visualization/directoryEntitiesV164";
import { CdmActivitiesTableV164, VisualizationFrameV125 } from "../semantic/SemanticContractRendererV125";
import PublicEntityCardGridV131 from "./PublicEntityCardGridV131";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

/**
 * V171: where the 2026-10-23 decision put the rows E-001 and E-002 used to
 * carry. On E-001/E-002 a note says where they are now, with a link; on
 * E-005/C-025 the delivered rows are listed under their own heading, apart
 * from the element's own records (recordRelocationV171).
 */
export default function RelocationPanelV171({
  elementId,
  countryIso3,
  entities,
  onOpenElement,
}: {
  elementId: string;
  countryIso3: string;
  entities: CountryEntityV122[];
  onOpenElement: (elementId: string, countryIso3: string) => void;
}) {
  const from = relocationFromV171(elementId);
  const into = relocationIntoV171(elementId);
  const [moved, setMoved] = useState<CountryEntityV122[]>([]);

  useEffect(() => {
    setMoved([]);
    if (!into) return undefined;
    let alive = true;
    void loadRelocatedRecordsV171(countryIso3, elementId, entities)
      .then((records) => {
        if (alive) setMoved(records);
      })
      .catch(() => {
        // The element's own analysis stands without the moved rows.
      });
    return () => {
      alive = false;
    };
  }, [countryIso3, elementId, entities, into]);

  if (from) {
    return (
      <div className="cdp-relocation171" role="note" data-testid="relocation-notice-v171" data-target-element={from.targetElementId}>
        <p>
          <PublicTermTextV134 text={from.sourceNotice} />
        </p>
        <button type="button" className="cdp-button cdp-button--secondary" onClick={() => onOpenElement(from.targetElementId, countryIso3)}>
          {from.targetTitle} 바로가기
        </button>
      </div>
    );
  }

  if (!into || moved.length === 0) return null;

  if (into.kind === "cdm-activities") {
    return (
      <div className="cdp-relocation171-section" data-testid="relocated-records-v171" data-kind={into.kind} data-record-count={moved.length}>
        <VisualizationFrameV125 eyebrow={into.sectionEyebrow} title={`${into.sectionTitle} · ${moved.length.toLocaleString("ko-KR")}건`} block="cards-list">
          <p className="sv125-contract-help">
            <PublicTermTextV134 text={into.sectionNote} />
          </p>
          <CdmActivitiesTableV164 entities={moved} headed={false} />
        </VisualizationFrameV125>
      </div>
    );
  }

  const located = moved.filter((record) => record.latitude !== null && record.latitude !== undefined).length;
  return (
    <div className="cdp-relocation171-section" data-testid="relocated-records-v171" data-kind={into.kind} data-record-count={moved.length}>
      <VisualizationFrameV125 eyebrow={into.sectionEyebrow} title={`${into.sectionTitle} · ${moved.length.toLocaleString("ko-KR")}곳`} block="cards-list">
        <p className="sv125-contract-help">
          <PublicTermTextV134 text={into.sectionNote} />
          {located === 0 ? " 소재지 좌표가 없어 지도에는 표시하지 않습니다." : null}
        </p>
        <PublicEntityCardGridV131 entities={moved.map(withDirectoryKeysV164)} template="directory" limit={30} />
      </VisualizationFrameV125>
    </div>
  );
}
