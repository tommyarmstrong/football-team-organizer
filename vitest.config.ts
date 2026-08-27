import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // Vitest 4 dropped coverage.all; include all src files via include globs.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/lib/supabase/**",
        "src/components/ui/**",
        "src/test/**",
        "**/*.test.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./src/test/server-only-stub.ts"),
    },
  },
});
