import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AppErrorBoundary from "./components/common/AppErrorBoundary";
import { runReleaseAuditV88 } from "./utils/releaseAuditV88";
import { runOperationalFinalizationAuditV102 } from "./utils/operationalFinalizationAuditV102";
import { runDataPresentationAuditV100 } from "./utils/dataPresentationAuditV100";
import {
  isWebSandboxQaRequestedV121,
  mountWebSandboxQaV121,
} from "./utils/webSandboxFinalizationV121";
import "./styles.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root was not found.");

const isDevelopmentPreview =
  window.location.hostname === "localhost" ||
  window.location.hostname.endsWith(".csb.app");

const isWebSandboxQa = isWebSandboxQaRequestedV121();

if (isWebSandboxQa) {
  void mountWebSandboxQaV121(rootElement);
} else {
  if (isDevelopmentPreview) {
    void runReleaseAuditV88();
    void runOperationalFinalizationAuditV102();
    runDataPresentationAuditV100();
  }

  createRoot(rootElement).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>
  );
}
