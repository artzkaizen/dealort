// import { env } from "@dealort/utils/env";
import { app } from "./app";

const port = 3000;

// biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`🚀 Server running at http://localhost:${port}`);
