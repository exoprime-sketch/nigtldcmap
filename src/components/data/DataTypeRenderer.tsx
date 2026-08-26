import { useEffect, useState } from "react";
import NdcPolicyPanel from "../ndc/NdcPolicyPanel";
import SolarPotentialPreview from "../solar/SolarPotentialPreview";
import { getDatasetRepresentationTypes } from "../../data/dataTypeTaxonomy";
import {
  datasetHasLoadablePayloadV121,
  loadDatasetPayloadV121,
  publicVietnamDataErrorMessageV121,
} from "../../data/vietnam/vietnamDataLoaderV121";
import { PRIORITY_COUNTRIES } from "../../data/priorityCountries";
import { isCooperationPolicyDatasetV109 } from "../../data/policy/cooperationPolicyEvidenceV109";
import { isIndicatorId } from "../../data/indicators/registry";
import type { DataRepresentationType, Dataset } from "../../types/dataset";
import type { SolarIndicatorId } from "../../types/solar";
import { openExternalUrl } from "../../utils/browser";
import IndicatorDatasetPreviewV33 from "./IndicatorDatasetPreviewV33";
import GcfPortfolioPreviewV33 from "./GcfPortfolioPreviewV33";
import CooperationPolicyEvidenceV109 from "./CooperationPolicyEvidenceV109";
import TnaTechnologyNeedsV110 from "./TnaTechnologyNeedsV110";
import InternationalSupportPortfolioV112 from "./InternationalSupportPortfolioV112";
import OdaDonorPortfolioV113 from "./OdaDonorPortfolioV113";
import MdbProjectPortfolioV113 from "./MdbProjectPortfolioV113";
import PolicyDocumentPreviewV33 from "./PolicyDocumentPreviewV33";
import UserPayloadRendererV33 from "./UserPayloadRendererV33";
import DatasetExamplePreviewV102 from "./DatasetExamplePreviewV102";
import WorldBankPopulationUrbanizationV48 from "./WorldBankPopulationUrbanizationV48";
import type { V33LoadedPayload } from "./UserPayloadRendererV33";
import "../../styles/data-detail-v33.css";
import "../../styles/vietnam-full-load-v47.css";
import "../../styles/public-trust-v92.css";

interface DataTypeRendererProps {
  dataset: Dataset;
  countryIso3?: string | null;
  countryName?: string | null;
  elementId?: string;
  elementName?: string;
}

export default function DataTypeRenderer({
  dataset,
  countryIso3 = null,
  countryName = null,
  elementId = "",
  elementName,
}: DataTypeRendererProps) {
  const resolvedElementId = elementId || dataset.elementId || "";
  const representationTypes = getDatasetRepresentationTypes(dataset);
  const primaryType =
    dataset.primaryRepresentationType ?? representationTypes[0] ?? "text";
  const [payload, setPayload] = useState<V33LoadedPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localCountryIso3, setLocalCountryIso3] = useState(countryIso3 ?? "");

  useEffect(() => {
    setLocalCountryIso3(countryIso3 ?? "");
  }, [countryIso3, dataset.id]);

  useEffect(() => {
    let cancelled = false;

    if (!datasetHasLoadablePayloadV121(dataset)) {
      setPayload(null);
      setLoading(false);
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setPayload(null);
    setError(null);

    void loadDatasetPayloadV121<V33LoadedPayload>(dataset)
      .then((result) => {
        if (cancelled) return;
        setPayload(result);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        console.error("Dataset payload load failed", reason);
        setError(publicVietnamDataErrorMessageV121(reason));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    dataset.dataAssetRef?.elementId,
    dataset.dataAssetRef?.provider,
    dataset.dataAssetRef?.section,
    dataset.dataPayloadUrl,
    dataset.id,
  ]);

  if (loading) {
    return (
      <div className="v33-empty-state" role="status">
        <strong>데이터 불러오는 중</strong>
      </div>
    );
  }

  if (error) {
    return (
      <div className="v33-empty-state warning">
        <strong>데이터를 불러오지 못했습니다</strong>
        <span>{error}</span>
      </div>
    );
  }

  if (payload) {
    return (
      <UserPayloadRendererV33
        dataset={dataset}
        payload={payload}
        primaryType={primaryType}
      />
    );
  }

  const needsCountryContext = datasetNeedsCountryContext(dataset);
  const effectiveCountryIso3 = countryIso3 ?? (localCountryIso3 || null);
  const effectiveCountry = PRIORITY_COUNTRIES.find(
    (item) => item.iso3 === effectiveCountryIso3
  );

  if (needsCountryContext && !effectiveCountryIso3) {
    return (
      <section className="v33-source-only" aria-label="국가 선택">
        <strong>확인할 국가를 선택해 주세요</strong>
        <p>
          특정 국가를 자동으로 선택하지 않습니다. 국가를 선택하면 해당 국가의
          실제 값·추세·정책·재원 정보를 표시합니다.
        </p>
        <label className="v33-dataset-controls single-line">
          <span>국가</span>
          <select
            value=""
            onChange={(event) => setLocalCountryIso3(event.target.value)}
            aria-label="데이터 상세 국가 선택"
          >
            <option value="">국가 선택</option>
            {PRIORITY_COUNTRIES.map((item) => (
              <option key={item.iso3} value={item.iso3}>
                {item.nameKo}
              </option>
            ))}
          </select>
        </label>
      </section>
    );
  }

  return (
    <ExistingDatasetRenderer
      dataset={dataset}
      primaryType={primaryType}
      countryIso3={effectiveCountryIso3}
      countryName={countryName ?? effectiveCountry?.nameKo ?? null}
      elementId={resolvedElementId}
      elementName={elementName}
    />
  );
}

function datasetNeedsCountryContext(dataset: Dataset): boolean {
  return (
    dataset.id === "LDC-DS-A-001" ||
    dataset.id === "LDC-DS-C-001" ||
    dataset.id === "LDC-DS-D-018-AF" ||
    dataset.id === "LDC-DS-D-019-CTCN" ||
    dataset.id === "LDC-DS-D-011-OECD-ODA" ||
    dataset.id === "LDC-DS-D-002" ||
    dataset.id === "LDC-DS-E-002" ||
    isCooperationPolicyDatasetV109(dataset.id) ||
    dataset.previewKind === "indicator" ||
    dataset.previewKind === "gcf-portfolio" ||
    dataset.indicatorId === "solar-pvout" ||
    dataset.indicatorId === "solar-ghi"
  );
}

function ExistingDatasetRenderer({
  dataset,
  primaryType,
  countryIso3,
  countryName,
  elementId,
  elementName,
}: {
  dataset: Dataset;
  primaryType: DataRepresentationType;
  countryIso3: string | null;
  countryName: string | null;
  elementId: string;
  elementName?: string;
}) {
  if (dataset.id === "LDC-DS-A-001") {
    return (
      <WorldBankPopulationUrbanizationV48
        countryIso3={countryIso3 ?? "VNM"}
        countryName={countryName ?? "베트남"}
      />
    );
  }

  if (dataset.id === "LDC-DS-C-001") {
    return <NdcPolicyPanel mode="dataset" iso3={countryIso3} />;
  }

  if (
    dataset.indicatorId === "solar-pvout" ||
    dataset.indicatorId === "solar-ghi"
  ) {
    return (
      <SolarPotentialPreview
        indicatorId={dataset.indicatorId as SolarIndicatorId}
        initialCountryIso3={countryIso3}
      />
    );
  }

  if (
    dataset.previewKind === "indicator" &&
    isIndicatorId(dataset.indicatorId)
  ) {
    return (
      <IndicatorDatasetPreviewV33
        indicatorId={dataset.indicatorId}
        initialCountryIso3={countryIso3}
        elementId={elementId}
        elementName={elementName}
      />
    );
  }

  if (dataset.id === "LDC-DS-D-018-AF") {
    return (
      <InternationalSupportPortfolioV112
        mode="adaptation-fund"
        initialCountryIso3={countryIso3}
      />
    );
  }

  if (dataset.id === "LDC-DS-D-019-CTCN") {
    return (
      <InternationalSupportPortfolioV112
        mode="ctcn"
        initialCountryIso3={countryIso3}
      />
    );
  }

  if (dataset.id === "LDC-DS-D-011-OECD-ODA") {
    return <OdaDonorPortfolioV113 initialCountryIso3={countryIso3} />;
  }

  if (dataset.id === "LDC-DS-D-002") {
    return <MdbProjectPortfolioV113 initialCountryIso3={countryIso3} />;
  }

  if (dataset.id === "LDC-DS-E-002") {
    return (
      <InternationalSupportPortfolioV112
        mode="climate-funds"
        initialCountryIso3={countryIso3}
      />
    );
  }

  if (dataset.previewKind === "gcf-portfolio") {
    return <GcfPortfolioPreviewV33 initialCountryIso3={countryIso3} />;
  }

  if (dataset.id === "LDC-DS-C-005-TNA") {
    return <TnaTechnologyNeedsV110 initialCountryIso3={countryIso3} />;
  }

  if (isCooperationPolicyDatasetV109(dataset.id)) {
    return (
      <CooperationPolicyEvidenceV109
        datasetId={dataset.id}
        initialCountryIso3={countryIso3}
      />
    );
  }

  if (dataset.previewKind === "policy-document") {
    return <PolicyDocumentPreviewV33 dataset={dataset} />;
  }

  return (
    <DatasetMetadataFallbackV101
      dataset={dataset}
      primaryType={primaryType}
      countryIso3={countryIso3}
      countryName={countryName}
    />
  );
}

function DatasetMetadataFallbackV101({
  dataset,
  primaryType,
  countryIso3,
  countryName,
}: {
  dataset: Dataset;
  primaryType: DataRepresentationType;
  countryIso3: string | null;
  countryName: string | null;
}) {
  return (
    <section className="v92-metadata-fallback" aria-label="데이터 안내">
      <div>
        <h3>데이터 안내</h3>
        <p>공식 출처와 자료의 기본정보를 확인할 수 있습니다</p>
      </div>
      <dl>
        <div>
          <dt>출처기관</dt>
          <dd>{dataset.sourceOrganization || "확인 중"}</dd>
        </div>
        <div>
          <dt>기준·기간</dt>
          <dd>{dataset.referenceYear || dataset.period || "확인 중"}</dd>
        </div>
        <div>
          <dt>이용조건</dt>
          <dd>{dataset.license || "원천기관 이용조건 확인"}</dd>
        </div>
      </dl>
      {dataset.sourceUrl && (
        <div className="v92-fallback-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => openExternalUrl(dataset.sourceUrl)}
          >
            {primaryType === "geospatial"
              ? "원자료 지도 확인 ↗"
              : "원자료 확인 ↗"}
          </button>
        </div>
      )}
      <DatasetExamplePreviewV102
        dataset={dataset}
        countryIso3={countryIso3}
        countryName={countryName}
      />
    </section>
  );
}
