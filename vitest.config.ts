import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const resolvePath = (...segments: string[]) => path.resolve(rootDir, ...segments);

export default defineConfig({
  resolve: {
    alias: {
      "@shared": resolvePath("packages/shared"),
      "@services": resolvePath("services"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});