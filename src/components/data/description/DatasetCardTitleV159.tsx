import type { DatasetCardSpecV159 } from "../../../data/spec/specTypesV159";
import "./data-description-v159.css";

export interface DatasetCardTitleV159Props {
  card: DatasetCardSpecV159;
  /** Heading level for the finder card title; default matches a card grid item. */
  titleAs?: "h2" | "h3" | "h4";
}

/** Finder card title: source line (small) above the raw dataset name, card definition below. */
export default function DatasetCardTitleV159({ card, titleAs = "h3" }: DatasetCardTitleV159Props) {
  const Title = titleAs;
  return (
    <div className="dct159" data-testid="dataset-card-title-v159">
      <p className="dct159-source">{card.sourceLabel}</p>
      <Title className="dct159-name">{card.baseName}</Title>
      <p className="dct159-definition">{card.shortDefinitionCard}</p>
    </div>
  );
}
