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

  const isAdminArea =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/");

  const isAdminApi = pathname === "/api/admin" || pathname.startsWith("/api/admin/");

  // السماح لصفحة Login والـ API الخاصة بها دون أي checks
  if (
    pathname === "/admin-pin-login" ||
    pathname.startsWith("/admin-pin-login/")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/Admin" || pathname.startsWith("/Admin/")) {
    const rest = pathname.slice("/Admin".length);
    const destination = `/admin${rest}`;
    return NextResponse.redirect(new URL(destination, request.url), 307);
  }

  if (pathname === "/blocked" || pathname.startsWith("/blocked/")) {
    return NextResponse.next();
  }

  if (pathname === "/admin-request" || pathname.startsWith("/admin-request/")) {
    return NextResponse.next();
  }

  if (pathname === "/admin-device-blocked" || pathname.startsWith("/admin-device-blocked/")) {
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
      if (!isAdminArea) return response;

      try {
        const { data: lockRow, error: lockErr } = await supabase
          .from("admin_device_locks")
          .select("allowed_device_id")
          .eq("admin_user_id", user?.id ?? "")
          .maybeSingle();

        if (lockErr) {
          if (process.env.NODE_ENV !== "production") {
            console.error("admin_device_locks select failed:", lockErr);
          }
          if (isAdminApi) {
            return NextResponse.json({ error: "ADMIN_DEVICE_LOCK_ERROR" }, { status: 500 });
          }
          const redirect = NextResponse.redirect(new URL("/admin-device-blocked", request.url), 307);
          if (!existingDeviceCookie && deviceId) {
            redirect.cookies.set(cookieName, deviceId, deviceCookieOptions);
          }
          return redirect;
        }

        if (!lockErr && lockRow?.allowed_device_id) {
          if (lockRow.allowed_device_id !== deviceId) {
            if (isAdminApi) {
              return NextResponse.json(
                { error: "ADMIN_DEVICE_BLOCKED" },
                { status: 403 },
              );
            }

            const redirect = NextResponse.redirect(new URL("/admin-device-blocked", request.url), 307);
            if (!existingDeviceCookie && deviceId) {
              redirect.cookies.set(cookieName, deviceId, deviceCookieOptions);
            }
            return redirect;
          }
          return response;
        }

        if (!lockErr && user?.id && deviceId) {
          const ins = await supabase.from("admin_device_locks").insert({
            admin_user_id: user.id,
            allowed_device_id: deviceId,
          });

          if (ins.error) {
            const code = String((ins.error as any)?.code ?? "");
            const msg = String(ins.error.message ?? "");
            const msgLc = msg.toLowerCase();
            const isDup = code === "23505" || msgLc.includes("duplicate") || msgLc.includes("already exists");

            if (!isDup) {
              if (process.env.NODE_ENV !== "production") {
                console.error("admin_device_locks insert failed:", ins.error);
              }
              if (isAdminApi) {
                return NextResponse.json({ error: "ADMIN_DEVICE_LOCK_ERROR" }, { status: 500 });
              }
              const redirect = NextResponse.redirect(new URL("/admin-device-blocked", request.url), 307);
              if (!existingDeviceCookie && deviceId) {
                redirect.cookies.set(cookieName, deviceId, deviceCookieOptions);
              }
              return redirect;
            }

            const { data: lockRow2, error: lockErr2 } = await supabase
              .from("admin_device_locks")
              .select("allowed_device_id")
              .eq("admin_user_id", user?.id ?? "")
              .maybeSingle();

            if (lockErr2) {
              if (process.env.NODE_ENV !== "production") {
                console.error("admin_device_locks reselect failed:", lockErr2);
              }
              if (isAdminApi) {
                return NextResponse.json({ error: "ADMIN_DEVICE_LOCK_ERROR" }, { status: 500 });
              }
              const redirect = NextResponse.redirect(new URL("/admin-device-blocked", request.url), 307);
              if (!existingDeviceCookie && deviceId) {
                redirect.cookies.set(cookieName, deviceId, deviceCookieOptions);
              }
              return redirect;
            }

            if (lockRow2?.allowed_device_id && lockRow2.allowed_device_id !== deviceId) {
              if (isAdminApi) {
                return NextResponse.json({ error: "ADMIN_DEVICE_BLOCKED" }, { status: 403 });
              }
              const redirect = NextResponse.redirect(new URL("/admin-device-blocked", request.url), 307);
              if (!existingDeviceCookie && deviceId) {
                redirect.cookies.set(cookieName, deviceId, deviceCookieOptions);
              }
              return redirect;
            }
          }
        }
      } catch {
        if (isAdminApi) {
          return NextResponse.json({ error: "ADMIN_DEVICE_LOCK_ERROR" }, { status: 500 });
        }
        const redirect = NextResponse.redirect(new URL("/admin-device-blocked", request.url), 307);
        if (!existingDeviceCookie && deviceId) {
          redirect.cookies.set(cookieName, deviceId, deviceCookieOptions);
        }
        return redirect;
      }

      return response;
    }

    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      if (!user?.id) return response;

      try {
        await supabase.from("admin_access_requests").insert({
          requester_user_id: user.id,
          status: "pending",
          reviewed_by: null,
          reviewed_at: null,
        });
      } catch {
      }

      const redirect = NextResponse.redirect(new URL("/admin-request", request.url), 307);
      if (!existingDeviceCookie && deviceId) {
        redirect.cookies.set(cookieName, deviceId, deviceCookieOptions);
      }
      return redirect;
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
