import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const SECRET = "11111111111";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { secret, action, adminUserId, deviceId } = body;

    if (secret !== SECRET) {
      return NextResponse.json({ error: "Unauthorized: Invalid secret" }, { status: 401 });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client setup failed" }, { status: 500 });
    }

    // ── ACTION: FETCH ALL LOCKS & DEVICES ──────────────────────────
    if (action === "fetch") {
      // 1. Fetch Admin Device Locks
      const { data: lockRows } = await supabase
        .from("admin_device_locks")
        .select("admin_user_id, allowed_device_id, created_at, updated_at")
        .order("created_at", { ascending: false });

      // 2. Fetch Active Devices (user_devices)
      const { data: deviceRows } = await supabase
        .from("user_devices")
        .select("device_id, user_id, user_agent, first_seen, last_seen, updated_at")
        .order("last_seen", { ascending: false })
        .limit(50);

      // Collect user IDs for profile lookup
      const userIds = Array.from(
        new Set([
          ...(lockRows ?? []).map((r: any) => r.admin_user_id),
          ...(deviceRows ?? []).map((r: any) => r.user_id),
        ].filter(Boolean))
      );

      let profileMap: Record<string, { full_name: string | null; phone: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("user_id, full_name, phone")
          .in("user_id", userIds);

        (profiles ?? []).forEach((p: any) => {
          profileMap[p.user_id] = {
            full_name: p.full_name ?? null,
            phone: p.phone ?? null,
          };
        });
      }

      // Merge lock rows with profiles
      const formattedLocks = (lockRows ?? []).map((r: any) => ({
        admin_user_id: r.admin_user_id,
        allowed_device_id: r.allowed_device_id,
        created_at: r.created_at ?? r.updated_at ?? null,
        full_name: profileMap[r.admin_user_id]?.full_name ?? null,
        phone: profileMap[r.admin_user_id]?.phone ?? null,
      }));

      // Merge active devices with profiles
      const formattedDevices = (deviceRows ?? []).map((r: any) => ({
        device_id: r.device_id,
        user_id: r.user_id,
        user_agent: r.user_agent ?? null,
        first_seen: r.first_seen ?? null,
        last_seen: r.last_seen ?? r.updated_at ?? null,
        full_name: profileMap[r.user_id]?.full_name ?? null,
        phone: profileMap[r.user_id]?.phone ?? null,
      }));

      return NextResponse.json({
        ok: true,
        adminLocks: formattedLocks,
        activeDevices: formattedDevices,
      });
    }

    // ── ACTION: CLEAR SINGLE ADMIN DEVICE LOCK ──────────────────────
    if (action === "clear_lock") {
      let query = supabase.from("admin_device_locks").delete();
      if (adminUserId) {
        query = query.eq("admin_user_id", adminUserId);
      } else {
        query = query.neq("admin_user_id", "00000000-0000-0000-0000-000000000000");
      }
      const { error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // ── ACTION: REMOVE SINGLE ACTIVE DEVICE ─────────────────────────
    if (action === "remove_device") {
      if (!deviceId) {
        return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
      }

      // Delete from user_devices
      await supabase.from("user_devices").delete().eq("device_id", deviceId);

      // Also delete from admin_device_locks if this device held a lock
      await supabase.from("admin_device_locks").delete().eq("allowed_device_id", deviceId);

      return NextResponse.json({ ok: true });
    }

    // ── ACTION: CLEAR ALL LOCKS & ALL DEVICES ───────────────────────
    if (action === "clear_all") {
      await supabase
        .from("admin_device_locks")
        .delete()
        .neq("admin_user_id", "00000000-0000-0000-0000-000000000000");

      await supabase
        .from("user_devices")
        .delete()
        .neq("device_id", "invalid_dummy_id");

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
