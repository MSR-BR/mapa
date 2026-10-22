"use client";
import { WorkflowHttpError, workflowClientFailure } from "@/modules/research-workflow/request-failure";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";

import {
  getReferenceCountBucket,
  trackAnalyticsEvent,
  type AnalyticsProductType,
  type AnalyticsSurface,
} from "./analytics";

type ExportPdfLinkProps = {
  href: string;
  referenceCount: number;
  productType?: AnalyticsProductType;
  source?: AnalyticsSurface;
  children: ReactNode;
  format?: "pdf" | "docx";
  disabled?: boolean;
  beforeDownload?: () => Promise<void | boolean>;
  onFailure?: (message: string) => void;
};

function filenameFromDisposition(value: string | null, format: "pdf" | "docx") {
  const match = value?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ? decodeURIComponent(match[1]) : `mapa-da-pesquisa.${format}`;
}

export function ExportPdfLink({ href, referenceCount, productType = "unknown", source = "dashboard", children, format = "pdf", disabled = false, beforeDownload, onFailure }: ExportPdfLinkProps) {
  const downloading = useRef(false);
  const [pending, setPending] = useState(false);
  async function download(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (disabled || downloading.current) return;
    downloading.current = true;
    setPending(true);
    let downloadStarted = false;
    const trackStart = () => { downloadStarted = true; if (format === "pdf") trackAnalyticsEvent("export_pdf_started", {
      app_stage: "final",
      app_macro_stage: "4",
      app_step: "final_map",
      app_product_type: productType,
      app_surface: source,
      app_reference_count_bucket: getReferenceCountBucket(referenceCount),
    }); };

    try {
      if (await beforeDownload?.() === false) return;
      trackStart();
      const response = await fetch(href, { credentials: "same-origin" });
      if (!response.ok) {
        // An HTML error page still has a useful HTTP status; never label it as a network error.
        const payload = await response.json().catch(() => null) as { errorCode?: string; code?: string } | null;
        throw new WorkflowHttpError(response.status, payload?.errorCode ?? payload?.code);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filenameFromDisposition(response.headers.get("content-disposition"), format);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      if (format === "pdf") trackAnalyticsEvent("export_pdf_completed", {
        app_result: "success",
        app_stage: "final",
        app_macro_stage: "4",
        app_step: "final_map",
        app_product_type: productType,
        app_surface: source,
        app_reference_count_bucket: getReferenceCountBucket(referenceCount),
      });
    } catch (error) {
      if (format === "pdf" && downloadStarted) trackAnalyticsEvent("export_pdf_failed", { app_result: "failed", app_stage: "final", app_macro_stage: "4", app_step: "final_map", app_product_type: productType, app_surface: source, app_reason_code: workflowClientFailure(error).reason });
      if (onFailure) onFailure(error instanceof Error && error.message !== "export_failed" ? error.message : "Não foi possível baixar o relatório. Seus textos continuam salvos; tente novamente.");
      else window.location.assign(href);
    } finally {
      downloading.current = false;
      setPending(false);
    }
  }

  return <a href={href} onClick={download} aria-disabled={disabled || pending} aria-busy={pending}>{pending ? "Preparando relatório…" : children}</a>;
}
