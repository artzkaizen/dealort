import { passkey } from "@better-auth/passkey";
import { db } from "@dealort/db";
import * as schema from "@dealort/db/schema/auth";
import { env } from "@dealort/utils/env";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { twoFactor, username } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { sendWelcomeEmail } from "./emails/service";

const authConfig: BetterAuthOptions = {
  appName: "Dealort",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  user: {
    additionalFields: {
      theme: {
        type: "string",
        required: true,
        defaultValue() {
          return "system";
        },
      },
      bio: {
        type: "string",
        required: false,
        defaultValue() {
          return "";
        },
      },
    },
  },
  socialProviders: {
    google: {
      prompt: "consent",
      clientId: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: (profile) => ({
        theme: "system",
        username:
          profile.name?.toLowerCase().replace(/ /g, "") +
          Math.random().toString(36).substring(2, 15),
        bio: "",
      }),
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID as string,
      clientSecret: env.GITHUB_CLIENT_SECRET as string,
      mapProfileToUser: (profile) => ({
        theme: "system",
        username:
          profile.name?.toLowerCase().replace(/ /g, "") +
          Math.random().toString(36).substring(2, 15),
        bio: "",
      }),
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  plugins: [passkey(), twoFactor(), username(), tanstackStartCookies()],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/sign-up")) {
        const user = ctx.context.newSession?.user ?? {
          name: ctx.context.user?.name ?? "",
          email: ctx.context.user?.email ?? "",
        };
        if (user != null) {
          await sendWelcomeEmail({
            to: user.email as string,
            name: user.name as string,
          });
        }
      }
    }),
  },
  rateLimit: {
    storage: "database",
  },
  // Email notifications (welcome & security warnings) are handled via middleware
  // in apps/server/src/index.ts which intercepts auth responses
};

export const auth = betterAuth<BetterAuthOptions>(authConfig);

// Export the auth configuration type for client-side type inference
export type AuthConfig = typeof authConfig;
