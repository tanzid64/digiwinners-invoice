import { createAuthClient } from "better-auth/react";

// Same-origin: handler is mounted at /api/auth/* so no baseURL needed.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
