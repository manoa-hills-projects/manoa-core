import { createAuthClient } from "better-auth/react";
import { env } from "@/env";

const defaultApiUrl = env.VITE_API_URL || "http://localhost:8787/api";
const resolvedApiOrigin = env.VITE_API_ORIGIN || new URL(defaultApiUrl).origin;

export const authClient = createAuthClient({
	baseURL: resolvedApiOrigin,
});
