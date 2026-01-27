import type { ReactNode } from "react";
import { redirect } from "next/navigation";

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
      } catch {
        // Table query failed
      }
    }
  } catch {
    // Admin check failed
  }

  if (!isAdmin) {
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
}
