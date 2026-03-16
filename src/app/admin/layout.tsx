import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { AdminShell } from "@/features/admin/ui/AdminShell";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fadmin");
  }

  // Use RPC function first (uses security definer, bypasses RLS)
  let isAdmin = false;
  try {
    // Try RPdC function with parameter
    let rpcRes = await supabase.rpc("is_admin", { uid: user.id });
    if (rpcRes.error) {
      // If that fails, try without parameter (uses auth.uid() internally)
      rpcRes = await supabase.rpc("is_admin");
    }
    isAdmin = Boolean(!rpcRes.error && rpcRes.data);

    // Fallback: Try direct table query if RPC fails (may fail due to RLS)
    if (!isAdmin) {
      try {
        const { data: adminRow, error: adminError } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        isAdmin = Boolean(!adminError && adminRow);

        // Log for debugging in development
        if (process.env.NODE_ENV !== "production") {
          console.log("Admin check - RPC failed, table query result:", {
            hasRow: Boolean(adminRow),
            error: adminError?.message,
            userId: user.id,
          });
        }
      } catch (err) {
        // Table query failed
        if (process.env.NODE_ENV !== "production") {
          console.error("Admin check - table query error:", err);
        }
      }
    } else {
      // Log for debugging in development
      if (process.env.NODE_ENV !== "production") {
        console.log("Admin check - RPC success:", {
          isAdmin,
          userId: user.id,
        });
      }
    }
  } catch (err) {
    // Admin check failed
    if (process.env.NODE_ENV !== "production") {
      console.error("Admin check - general error:", err);
    }
  }

  if (!isAdmin) {
    // Log for debugging
    if (process.env.NODE_ENV !== "production") {
      console.log("Admin check failed - redirecting to home. User ID:", user.id);
    }

    try {
      await supabase.from("admin_access_requests").insert({
        requester_user_id: user.id,
        status: "pending",
        reviewed_by: null,
        reviewed_at: null,
      });
    } catch { }

    redirect("/admin-request");
  }

  try {
    const cookieStore = await cookies();
    const deviceId = cookieStore.get("fitcoach_device_id")?.value ?? "";

    if (deviceId) {
      const { data: lockRow, error: lockErr } = await supabase
        .from("admin_device_locks")
        .select("allowed_device_id")
        .eq("admin_user_id", user.id)
        .maybeSingle();

      if (!lockErr && lockRow?.allowed_device_id) {
        if (lockRow.allowed_device_id !== deviceId) {
          redirect("/admin-device-blocked");
        }
      } else if (!lockErr) {
        await supabase.from("admin_device_locks").insert({
          admin_user_id: user.id,
          allowed_device_id: deviceId,
        });
      }
    }
  } catch { }

  return <AdminShell>{children}</AdminShell>;
}
