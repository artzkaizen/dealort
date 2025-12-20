import { auth } from "@dealort/auth";
import { apiLogger } from "@dealort/utils/logger";
import { publicProcedure } from "../index";

export const authRouter = {
  // Starts a social sign-in flow. Input should be:
  // { provider: 'google' | 'github', callbackURL?: string, newUserCallbackURL?: string }
  signInSocial: publicProcedure.handler(async ({ input }) => {
    const body = input as {
      provider: "google" | "github";
      callbackURL?: string;
      newUserCallbackURL?: string;
    };

    // Delegate to better-auth's programmatic API and return its response.
    const response = await auth.api.signInSocial({ body });
    apiLogger.debug({ provider: body.provider }, "Social sign-in called");
    return response;
  }),
};

export type AuthRouter = typeof authRouter;
