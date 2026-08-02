import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Function arg logging dumps every action input to the terminal
  // (e.g. passwords on acceptInvitationWithPassword). Disable to avoid
  // leaking secrets into local/CI stdout.
  logging: {
    serverFunctions: false,
  },
};

export default nextConfig;
