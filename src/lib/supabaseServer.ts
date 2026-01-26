import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const cookieStore = await cookies();

  const deviceId = cookieStore.get("fitcoach_device_id")?.value ?? "";

  return createServerClient(url, anonKey, {
    cookieOptions: getAuthCookieOptions(url),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => (cookieStore as any).set(name, value, options));
        } catch {
          // no-op
        }
      },
    },
    global: {
      headers: deviceId ? { "x-device-id": deviceId } : {},
    },
  });
}
