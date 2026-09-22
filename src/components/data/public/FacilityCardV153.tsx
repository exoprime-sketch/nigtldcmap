import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { facilityCardRowsV153 } from "../../../data/visualization/facilityCardV153";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./detail-analysis-v153.css";

interface Props {
  elementId: string;
  entity: VietnamEntityV124;
  /** A heading above the rows, e.g. the site name; omitted when the list already names it. */
  title?: string | null;
  compact?: boolean;
}

/**
 * The label-form card (국가/명칭/유형/소유·운영/규모/연도/소재지/출처) every
 * single facility, organisation or project is shown with (V153). Rows come
 * from `facilityCardV153`; a missing value prints "미기재" in place, never a
 * shorter card.
 */
export default function FacilityCardV153({ elementId, entity, title, compact }: Props) {
  const rows = facilityCardRowsV153(elementId, entity);
  if (!rows.length) return null;
  return (
    <article className={`facility153${compact ? " facility153--compact" : ""}`} data-testid="facility-card-v153" data-element-id={elementId} data-record-id={entity.recordId}>
      {title ? <h4 className="facility153-title"><PublicTermTextV134 text={title} /></h4> : null}
      <dl className="facility153-rows">
        {rows.map((row) => (
          <div key={row.key} className="facility153-row" data-field={row.key} data-missing={row.missing ? "true" : "false"}>
            <dt>{row.label}</dt>
            <dd>
              {row.href ? (
                <>
                  <span>{row.value}</span>
                  {" · "}
                  <a href={row.href} target="_blank" rel="noreferrer">링크</a>
                </>
              ) : (
                <PublicTermTextV134 text={row.value} />
              )}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
