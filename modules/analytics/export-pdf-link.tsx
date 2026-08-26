"use client";

import type { MouseEvent, ReactNode } from "react";

import {
  getReferenceCountBucket,
  trackAnalyticsEvent,
  type AnalyticsProductType,
  type AnalyticsSource,
} from "./analytics";

type ExportPdfLinkProps = {
  href: string;
  referenceCount: number;
  productType?: AnalyticsProductType;
  source?: AnalyticsSource;
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
      stage: "final",
      product_type: productType,
      source,
      reference_count_bucket: getReferenceCountBucket(referenceCount),
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
        result: "success",
        stage: "final",
        product_type: productType,
        source,
        reference_count_bucket: getReferenceCountBucket(referenceCount),
      });
    } catch {
      trackAnalyticsEvent("export_pdf_failed", { result: "failed", stage: "final", product_type: productType, source, reason_code: "network" });
      window.location.assign(href);
    }
  }

  return <a href={href} onClick={download}>{children}</a>;
}
