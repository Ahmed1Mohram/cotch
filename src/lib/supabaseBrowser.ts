import { createBrowserClient } from "@supabase/ssr";

import { getOrCreateDeviceId } from "@/lib/deviceId";

function getAuthCookieOptions(supabaseUrl: string) {
  let projectRef = "";
  try {
    projectRef = new URL(supabaseUrl).hostname.split(".")[0] ?? "";
  } catch {
    projectRef = "";
  }

  const name = projectRef ? `sb-${projectRef}-auth-token` : "sb-auth-token";
  const maxAge = 60 * 60 * 24 * 365 * 3;

  return {
    name,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const deviceId = getOrCreateDeviceId();

  return createBrowserClient(url, anonKey, {
    cookieOptions: getAuthCookieOptions(url),
    global: {
      headers: deviceId ? { "x-device-id": deviceId } : {},
    },
  });
}
