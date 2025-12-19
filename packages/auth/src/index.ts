import { passkey } from "@better-auth/passkey";
import { db } from "@dealort/db";
import * as schema from "@dealort/db/schema/auth";
import { env } from "@dealort/utils/env";
import { type BetterAuthOptions, betterAuth, type User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { organization, twoFactor, username } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import {
  sendDeleteAccountVerificationEmail,
  sendInvitationEmail,
  sendResetPasswordEmail,
  sendWelcomeEmail,
} from "./emails/service";

const validUsernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const numbersOnlyRegex = /^\d+$/;

// TODO: enable email/password login/signup later

/**
 * Generates a unique username for a user
 * @param name - The name of the user
 * @returns A unique username
 */
const generateUsername = (name: string) => {
  let newName = "";
  if (name.length > 10) {
    newName =
      name
        .toLowerCase()
        .replace(/ /g, "-")
        .slice(0, 10)
        .replace(/^-+|-+$/g, "") +
      Math.random().toString(36).substring(2, 6).slice(0, 15);
    return newName;
  }

  newName =
    // The regex / /g matches all spaces, and replaces them with dashes (removes all spaces).
    // The regex /^-+|-+$/g matches one or more dashes at the start (^-+) OR at the end (|-+$) of the string, and removes them.
    name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/^-+|-+$/g, "") +
    Math.random().toString(36).substring(2, 15).slice(0, 15);
  return newName;
};

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
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({
        user,
        url,
      }: {
        user: User;
        url: string;
      }) => {
        await sendDeleteAccountVerificationEmail({
          to: user.email as string,
          name: user.name as string,
          verificationLink: url,
        });
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({
        to: user.email as string,
        name: user.name as string,
        verificationLink: url,
      });
    },
    resetPasswordTokenExpiresIn: 20 * 60, // 20 minutes in seconds
  },
  socialProviders: {
    google: {
      prompt: "consent",
      clientId: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: (profile) => ({
        theme: "system",
        username: generateUsername(profile.name),
        bio: "",
      }),
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID as string,
      clientSecret: env.GITHUB_CLIENT_SECRET as string,
      mapProfileToUser: (profile) => ({
        theme: "system",
        username: generateUsername(profile.name),
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
  plugins: [
    passkey(),
    twoFactor(),
    username({
      usernameValidator: (username: string) => {
        if (username.length < 3) return false;
        if (username.length > 15) return false;
        // Disallow all chars except letters, numbers, dashes, and underscores
        if (!validUsernameRegex.test(username)) return false;
        // Cannot be only numbers
        if (numbersOnlyRegex.test(username)) return false;
        return true;
      },
      usernameNormalization(username) {
        return username
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/^-+|-+$/g, "");
      },
    }),
    organization({
      allowUserToCreateOrganization: true,
      memberLimit: 15,
      async sendInvitationEmail(data) {
        const inviteLink = `${env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;
        const res = await sendInvitationEmail({
          to: data.email,
          invitationUrl: inviteLink,
          invitedBy: data.inviter.user.name,
          invitationExpiresAt: new Date(
            data.invitation.expiresAt
          ).toISOString(),
          organizationName: data.organization.name,
        });

        console.log("sendInvitationEmail", res.data?.id, res.error);
        // return res;
      },
      schema: {
        organization: {
          additionalFields: {
            slug: {
              type: "string",
              unique: true,
              required: true,
              defaultValue() {
                return "";
              },
            },
            isDev: {
              type: "boolean",
              required: true,
              defaultValue() {
                return false;
              },
            },
            tagline: {
              type: "string",
              required: true,
              defaultValue() {
                return "";
              },
            },
            description: {
              type: "string",
              required: false,
              defaultValue() {
                return "";
              },
            },
            category: {
              type: "string[]",
              required: true,
              defaultValue() {
                return [];
              },
            },
            isOpenSource: {
              type: "boolean",
              required: true,
              defaultValue() {
                return false;
              },
            },
            rating: {
              type: "number",
              required: true,
              defaultValue() {
                return 0;
              },
            },
            impressions: {
              type: "number",
              required: true,
              defaultValue() {
                return 0;
              },
            },
            releaseDate: {
              type: "date",
              required: false,
              defaultValue() {
                return null;
              },
            },
            isListed: {
              type: "boolean",
              required: true,
              defaultValue() {
                return false;
              },
            },
            gallery: {
              type: "string[]",
              required: false,
              defaultValue() {
                return [];
              },
            },
          },
        },
      },
    }),
    tanstackStartCookies(),
  ],

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
