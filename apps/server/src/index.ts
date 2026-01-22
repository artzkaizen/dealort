import { handle } from "hono/vercel";
import { createApp } from "./app";

const { app } = createApp();

// Start the server
// const port = env.PORT ? Number.parseInt(env.PORT, 10) : 3000;

/**
 * Vercel Serverless export
 * Vercel will pick this up automatically
 */
export default handle(app);
