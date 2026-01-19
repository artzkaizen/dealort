import "dotenv/config";
import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod/v4";

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().min(1),
    NODE_ENV: z.enum(["development", "production"]).optional(),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    CORS_ORIGIN: z.string().min(1),
    PORT: z.string().optional().default("3000"),
    DATABASE_URL: z
      .string()
      .regex(/^(postgresql|postgres):\/\//)
      .min(1), // PostgreSQL connection string
    ARCJET_KEY: z
      .string()
      .optional()
      .refine(
        (val) => {
          // Require ARCJET_KEY in production
          if (process.env.NODE_ENV === "production") {
            return val !== undefined && val.length > 0;
          }
          return true; // Optional in development
        },
        {
          message: "ARCJET_KEY is required in production environment",
        }
      ),
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.string().email().optional(), // Optional, defaults to Resend domain
    UPLOADTHING_TOKEN: z.string().min(1),
    UPLOADTHING_CALLBACK_URL: z.string().min(1),
    SENTRY_DSN: z.string().url().optional(), // Optional error tracking
  },

  client: {
    // NEXT_PUBLIC_VITE_SERVER_URL: z.string().min(1),
  },

  experimental__runtimeEnv: {
    NEXT_PUBLIC_VITE_SERVER_URL: process.env.VITE_SERVER_URL,
    // NEXT_PUBLIC_SUBDOMAIN: process.env.NEXT_PUBLIC_SUBDOMAIN,
  },
});
