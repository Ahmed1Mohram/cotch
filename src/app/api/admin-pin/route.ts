import { NextResponse, type NextRequest } from "next/server";

const ADMIN_USER = "01005209608";
const ADMIN_PASS = "01005209608";
// Cookie يصلح 3 سنين
const MAX_AGE = 60 * 60 * 24 * 365 * 3;
export const COOKIE_NAME = "fitcoach_admin_pin";
// القيمة المشفرة (بسيطة)
const TOKEN = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString("base64");

export function getAdminPinToken() {
  return TOKEN;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = body as { username?: string; password?: string };

  if (username?.trim() === ADMIN_USER && password?.trim() === ADMIN_PASS) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, TOKEN, {
      httpOnly: true,
      path: "/",
      maxAge: MAX_AGE,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  }

  return NextResponse.json({ ok: false, error: "بيانات خاطئة" }, { status: 401 });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
