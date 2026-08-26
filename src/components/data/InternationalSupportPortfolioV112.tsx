import * as React from "react";
import LegacyPortfolio from "./InternationalSupportPortfolioLegacyV120";
import AdaptationFundPortfolioV120 from "./AdaptationFundPortfolioV120";

export function InternationalSupportPortfolioV112(props: any) {
  return (
    <>
      <AdaptationFundPortfolioV120
        data={props.data ?? props.dataset ?? props.portfolio}
        records={props.records ?? props.items}
      />
      <LegacyPortfolio {...props} />
    </>
  );
}

export default InternationalSupportPortfolioV112;