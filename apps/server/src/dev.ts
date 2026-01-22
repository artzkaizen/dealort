// import { env } from "@dealort/utils/env";
import { createApp } from "./app";

const { app } = createApp();

const port = 3000;

// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`🚀 Server running at http://localhost:${port}`);
