// import { handle } from "hono/vercel";
// Start the server
// const port = env.PORT ? Number.parseInt(env.PORT, 10) : 3000;

/**
 * Vercel Serverless export
 * Vercel will pick this up automatically
 */

// biome-ignore lint/performance/noBarrelFile: <explanation>
export { app as default } from "./app";
