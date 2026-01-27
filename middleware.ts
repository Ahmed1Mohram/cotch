import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

function randomId() {
  try {
    const c = globalThis.crypto as Crypto | undefined;
    if (c?.randomUUID) return c.randomUUID();
    if (c?.getRandomValues) {
      const bytes = new Uint8Array(16);
      c.getRandomValues(bytes);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    // no-op
  }

  const now = Date.parse(new Date().toISOString());
  return `${now.toString(16)}${Math.random().toString(16).slice(2)}`;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/Admin" || pathname.startsWith("/Admin/")) {
    const rest = pathname.slice("/Admin".length);
    const destination = `/admin${rest}`;
    return NextResponse.redirect(new URL(destination, request.url), 307);
  }

  if (pathname === "/blocked" || pathname.startsWith("/blocked/")) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const response = NextResponse.next();

  if (!url || !anonKey) {
    return response;
  }

  const cookieName = "fitcoach_device_id";
  const existingDeviceCookie = request.cookies.get(cookieName)?.value ?? "";
  let deviceId = existingDeviceCookie;
  const deviceCookieOptions = {
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 3,
    sameSite: "lax" as const,
  };

  if (!deviceId) {
    deviceId = randomId();
    response.cookies.set(cookieName, deviceId, deviceCookieOptions);
  }

  const supabase = createServerClient(url, anonKey, {
    cookieOptions: getAuthCookieOptions(url),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
    global: {
      headers: deviceId ? { "x-device-id": deviceId } : {},
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if user is admin first - admins should bypass ban checks
    // Use RPC function directly as it uses security definer and bypasses RLS
    let isAdmin = false;
    if (user?.id) {
      try {
        // Try RPC function first (uses security definer, bypasses RLS)
        let rpcRes = await supabase.rpc("is_admin", { uid: user.id });
        if (rpcRes.error) {
          // If that fails, try without parameter (uses auth.uid() internally)
          rpcRes = await supabase.rpc("is_admin");
        }
        isAdmin = Boolean(!rpcRes.error && rpcRes.data);
        
        // Fallback: Try direct table query if RPC fails (may fail due to RLS)
        if (!isAdmin) {
          try {
            const adminRes = await supabase
              .from("admin_users")
              .select("user_id")
              .eq("user_id", user.id)
              .maybeSingle();
            isAdmin = Boolean(!adminRes.error && adminRes.data);
          } catch {
            // Table query failed, keep isAdmin as false
          }
        }
      } catch (err) {
        // If admin check fails, assume not admin
        isAdmin = false;
        // Log error in development only
        if (process.env.NODE_ENV !== "production") {
          console.error("Admin check error:", err);
        }
      }
    }

    // Skip ALL ban checks for admins - they should have full access
    if (isAdmin) {
      return response;
    }

    // Only check bans for non-admin users
    const deviceBanRes = await supabase.rpc("is_device_banned");
    if (!deviceBanRes.error && Boolean(deviceBanRes.data)) {
      const redirect = NextResponse.redirect(new URL("/blocked", request.url), 307);
      if (!existingDeviceCookie && deviceId) {
        redirect.cookies.set(cookieName, deviceId, deviceCookieOptions);
      }
      return redirect;
    }

    if (user?.id) {
      const userBanRes = await supabase.rpc("is_user_banned", { uid: user.id });
      if (!userBanRes.error && Boolean(userBanRes.data)) {
        const redirect = NextResponse.redirect(new URL("/blocked", request.url), 307);
        if (!existingDeviceCookie && deviceId) {
          redirect.cookies.set(cookieName, deviceId, deviceCookieOptions);
        }
        return redirect;
      }
    }
  } catch {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|mp4)$).*)",
  ],
};
