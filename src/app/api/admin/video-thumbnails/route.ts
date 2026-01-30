import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serverAnonKey = process.env.SUPABASE_ANON_KEY ?? anonKey;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 },
    );
  }

  if (!serverAnonKey) {
    return NextResponse.json({ error: "Missing SUPABASE_ANON_KEY" }, { status: 500 });
  }

  if (anonKey && anonKey === serviceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is misconfigured (it matches the anon key)." },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const authSupabase = authHeader.trim()
    ? createClient(supabaseUrl, serverAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      })
    : await createSupabaseServerClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let isAdmin = false;
  try {
    let rpcRes = await authSupabase.rpc("is_admin", { uid: user.id });
    if (rpcRes.error) {
      rpcRes = await authSupabase.rpc("is_admin");
    }
    isAdmin = Boolean(!rpcRes.error && rpcRes.data);
  } catch {
    isAdmin = false;
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, userId: user.id });
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serverAnonKey = process.env.SUPABASE_ANON_KEY ?? anonKey;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 },
    );
  }

  if (!serverAnonKey) {
    return NextResponse.json({ error: "Missing SUPABASE_ANON_KEY" }, { status: 500 });
  }

  if (anonKey && anonKey === serviceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is misconfigured (it matches the anon key)." },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const authSupabase = authHeader.trim()
    ? createClient(supabaseUrl, serverAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      })
    : await createSupabaseServerClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let isAdmin = false;
  try {
    let rpcRes = await authSupabase.rpc("is_admin", { uid: user.id });
    if (rpcRes.error) {
      rpcRes = await authSupabase.rpc("is_admin");
    }
    isAdmin = Boolean(!rpcRes.error && rpcRes.data);
  } catch {
    isAdmin = false;
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const fileAny = form.get("file");
  const pathAny = form.get("path");

  const path = typeof pathAny === "string" ? pathAny.trim() : "";
  if (!path || path.startsWith("/") || path.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (!fileAny || typeof (fileAny as any).arrayBuffer !== "function") {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const file = fileAny as File;
  const contentType = typeof file.type === "string" && file.type.trim() ? file.type : undefined;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const up = await adminSupabase.storage.from("video-thumbnails").upload(path, buffer, {
    upsert: true,
    contentType,
  });

  if (up.error) {
    return NextResponse.json(
      {
        error: up.error.message,
        hint: "If this mentions row-level security, verify you are using the Service Role key and not the anon key.",
      },
      { status: 400 },
    );
  }

  const pub = adminSupabase.storage.from("video-thumbnails").getPublicUrl(path);
  const publicUrl = pub.data.publicUrl ? String(pub.data.publicUrl) : "";

  return NextResponse.json({ path, publicUrl });
}
