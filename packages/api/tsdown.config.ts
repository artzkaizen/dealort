import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/**/*.ts",
    "!src/**/__tests__/**",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
  ],
  sourcemap: true,
  // Disable dts generation due to TypeScript serialization limits with complex ORPC router types
  // Types are still available at runtime via TypeScript's type system
  // Consumers can import types directly from source files if needed
  dts: false,
});
