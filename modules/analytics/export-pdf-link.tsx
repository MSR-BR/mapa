"use client";

import type { MouseEvent, ReactNode } from "react";

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
};

function filenameFromDisposition(value: string | null) {
  const match = value?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ? decodeURIComponent(match[1]) : "mapa-da-pesquisa.pdf";
}

export function ExportPdfLink({ href, referenceCount, productType = "unknown", source = "dashboard", children }: ExportPdfLinkProps) {
  async function download(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    trackAnalyticsEvent("export_pdf_started", {
      app_stage: "final",
      app_macro_stage: "4",
      app_step: "final_map",
      app_product_type: productType,
      app_surface: source,
      app_reference_count_bucket: getReferenceCountBucket(referenceCount),
    });

    try {
      const response = await fetch(href, { credentials: "same-origin" });
      if (!response.ok) throw new Error("export_failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filenameFromDisposition(response.headers.get("content-disposition"));
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      trackAnalyticsEvent("export_pdf_completed", {
        app_result: "success",
        app_stage: "final",
        app_macro_stage: "4",
        app_step: "final_map",
        app_product_type: productType,
        app_surface: source,
        app_reference_count_bucket: getReferenceCountBucket(referenceCount),
      });
    } catch {
      trackAnalyticsEvent("export_pdf_failed", { app_result: "failed", app_stage: "final", app_macro_stage: "4", app_step: "final_map", app_product_type: productType, app_surface: source, app_reason_code: "network" });
      window.location.assign(href);
    }
  }

  return <a href={href} onClick={download}>{children}</a>;
}
