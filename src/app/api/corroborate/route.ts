import { NextResponse } from "next/server";
import { insertCorroboration } from "@/lib/queries";
import { ipHash, rateLimit } from "@/lib/request";

const DIRECTIONS = ["same", "more", "less"] as const;
type Direction = (typeof DIRECTIONS)[number];

export async function POST(req: Request) {
  const hash = ipHash(req.headers);

  if (!rateLimit(`corr:${hash}`, 40, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const officeId = Number(body.officeId);
  const subItemId = Number(body.subItemId);
  const direction = String(body.direction) as Direction;

  if (
    !Number.isInteger(officeId) ||
    !Number.isInteger(subItemId) ||
    !DIRECTIONS.includes(direction)
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  insertCorroboration({ officeId, subItemId, direction, ipHash: hash });
  return NextResponse.json({ ok: true });
}
