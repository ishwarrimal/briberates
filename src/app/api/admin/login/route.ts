import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken, checkPassword } from "@/lib/admin";
import { ipHash, rateLimit } from "@/lib/request";

export async function POST(req: Request) {
  if (!rateLimit(`login:${ipHash(req.headers)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const pw = typeof body.password === "string" ? body.password : "";

  if (!checkPassword(pw)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
