import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  age_years: number | null;
  height_cm: number | null;
  weight_kg: number | null;
};

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function GET(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 },
    );
  }

  const authSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminRow, error: adminError } = await authSupabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !adminRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requestUrl = new URL(req.url);
  const limitParam = requestUrl.searchParams.get("limit");
  const includeProfilesParam = requestUrl.searchParams.get("includeProfiles");

  let limit = Number(limitParam ?? 2000);
  if (!Number.isFinite(limit) || limit <= 0) limit = 2000;
  limit = Math.min(5000, Math.max(1, Math.floor(limit)));

  const includeProfiles = includeProfilesParam !== "0";

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const users: Array<any> = [];
  const perPage = Math.min(1000, limit);

  for (let page = 1; page <= 50 && users.length < limit; page += 1) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = data?.users ?? [];
    users.push(...list);

    if (list.length < perPage) break;
  }

  const limitedUsers = users.slice(0, limit);
  const userIds = limitedUsers.map((u) => String(u.id)).filter(Boolean);

  const profileByUser = new Map<string, ProfileRow>();
  if (includeProfiles && userIds.length) {
    try {
      for (const ids of chunk(userIds, 200)) {
        const res = await adminSupabase
          .from("user_profiles")
          .select("user_id,full_name,phone,age_years,height_cm,weight_kg")
          .in("user_id", ids);
        if (res.error) {
          throw new Error(res.error.message);
        }
        for (const p of (res.data ?? []) as ProfileRow[]) profileByUser.set(String(p.user_id), p);
      }
    } catch {
      profileByUser.clear();
    }
  }

  const out = limitedUsers.map((u) => {
    const id = String(u.id);
    const email = u.email ? String(u.email) : null;
    const phone = u.phone ? String(u.phone) : null;
    const created_at = u.created_at ? String(u.created_at) : null;
    const last_sign_in_at = u.last_sign_in_at ? String(u.last_sign_in_at) : null;

    return {
      id,
      email,
      phone,
      created_at,
      last_sign_in_at,
      profile: profileByUser.get(id) ?? null,
    };
  });

  return NextResponse.json({ users: out, total: out.length });
}
