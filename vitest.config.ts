import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "src/**/*.test.ts", "tests/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "@core": new URL("./packages/core", import.meta.url).pathname
    }
  }
});
