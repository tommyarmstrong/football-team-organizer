import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Function arg logging dumps every action input to the terminal
  // (e.g. passwords on acceptInvitationWithPassword). Disable to avoid
  // leaking secrets into local/CI stdout.
  logging: {
    serverFunctions: false,
  },
  // Team and venue photos (up to 5 MB) are uploaded through Server Actions,
  // whose default 1 MB body limit would reject typical phone photos.
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  // The season report reads hand-written markdown from content/reports/ at
  // request time. Those files are not imported, so tell the tracer to ship
  // them with the serverless bundle.
  outputFileTracingIncludes: {
    "/team/report": ["./content/reports/**/*"],
    "/team/report/sample": ["./content/reports/**/*"],
  },
};

export default nextConfig;
