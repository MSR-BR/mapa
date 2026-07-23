import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/projects/[id]/exports/[format]": ["./node_modules/pdfkit/js/data/*.afm"],
  },
  serverExternalPackages: ["pdfkit"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
