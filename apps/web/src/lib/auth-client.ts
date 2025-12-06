import { passkeyClient } from "@better-auth/passkey/client";
import type { AuthConfig } from "@dealort/auth";
import {
  inferAdditionalFields,
  twoFactorClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_SERVER_URL,
  plugins: [
    inferAdditionalFields<AuthConfig>(),
    passkeyClient(),
    twoFactorClient(),
    usernameClient(),
  ],
});
