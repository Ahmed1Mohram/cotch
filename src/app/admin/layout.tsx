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
  const cookieStore = await cookies();

  // Supabase auth
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin-pin-login");
  }

  // Use RPC function first (uses security definer, bypasses RLS)
  let isAdmin = false;
  try {
    let rpcRes = await supabase.rpc("is_admin", { uid: user.id });
    if (rpcRes.error) {
      rpcRes = await supabase.rpc("is_admin");
    }
    isAdmin = Boolean(!rpcRes.error && rpcRes.data);

    if (!isAdmin) {
      try {
        const { data: adminRow, error: adminError } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        isAdmin = Boolean(!adminError && adminRow);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Admin check - table query error:", err);
        }
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Admin check - general error:", err);
    }
  }

  if (!isAdmin) {
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
    const deviceId = cookieStore.get("fitcoach_device_id")?.value ?? "";
    const isMultiBrowserAdmin = user?.email === "01005209608@admin.fitcoach.local";

    if (deviceId && !isMultiBrowserAdmin) {
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
