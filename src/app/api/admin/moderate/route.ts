import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/admin";
import { approveReport, rejectReport } from "@/lib/queries";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (!isValidAdminCookie(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  const action = String(body.action);

  if (!Number.isInteger(id) || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (action === "approve") {
    await approveReport(id);
  } else {
    await rejectReport(id);
  }
  return NextResponse.json({ ok: true });
}
