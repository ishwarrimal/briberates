import { NextResponse } from "next/server";
import { createReportWithTaxonomy } from "@/lib/queries";
import { ipHash, rateLimit, verifyTurnstile } from "@/lib/request";
import type { PaidTo } from "@/lib/types";

const VALID_PAID_TO: PaidTo[] = ["sro-staff", "agent", "middleman", "other"];
const MAX_AMOUNT = 100_000_000; // ₹10 crore sanity ceiling

/** Clean a user-supplied name: collapse whitespace, strip control chars, cap length. */
function cleanName(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\x00-\x1F\x7F]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

/** Resolve an entity field to either {id} (existing) or {name} (new). */
function entityRef(
  raw: unknown,
  max: number,
): { id?: number; name?: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.id != null && obj.id !== "") {
    const id = Number(obj.id);
    if (Number.isInteger(id) && id > 0) return { id };
  }
  const name = cleanName(obj.name, max);
  if (name) return { name };
  return null;
}

export async function POST(req: Request) {
  const hash = ipHash(req.headers);

  if (!rateLimit(`report:${hash}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const ok = await verifyTurnstile(
    typeof body.turnstileToken === "string" ? body.turnstileToken : undefined,
    req.headers,
  );
  if (!ok) {
    return NextResponse.json(
      { error: "Bot check failed. Please retry." },
      { status: 400 },
    );
  }

  // --- taxonomy: each field is {id} for existing, or {name} for a new entry ---
  const service = entityRef(body.service, 120);
  const subItem = entityRef(body.subItem, 160);
  const officeRef = entityRef(body.office, 160);

  const cityRaw =
    body.city && typeof body.city === "object"
      ? (body.city as Record<string, unknown>)
      : {};
  const cityBase = entityRef(cityRaw, 100);
  const city =
    cityBase == null
      ? null
      : cityBase.id != null
        ? { id: cityBase.id }
        : { name: cityBase.name, state: cleanName(cityRaw.state, 80) };

  if (!service || !subItem || !officeRef || !city) {
    return NextResponse.json(
      { error: "Please fill in the department, service, office and city." },
      { status: 400 },
    );
  }
  if ("name" in city && city.name && !city.state) {
    return NextResponse.json(
      { error: "Please include the state for a new city." },
      { status: 400 },
    );
  }

  const office =
    officeRef.id != null
      ? { id: officeRef.id }
      : { name: officeRef.name, area: cleanName((body.office as Record<string, unknown>)?.area, 120) };

  // --- amounts ---
  const extraPaid = Number(body.extraPaid);
  const officialFee =
    body.officialFee == null || body.officialFee === ""
      ? null
      : Number(body.officialFee);
  const paidTo = String(body.paidTo ?? "other") as PaidTo;
  const period = typeof body.period === "string" ? body.period.slice(0, 7) : "";
  const note = cleanName(body.note, 500) || null;

  if (!Number.isFinite(extraPaid) || extraPaid < 0 || extraPaid > MAX_AMOUNT) {
    return NextResponse.json(
      { error: "Please enter a valid amount." },
      { status: 400 },
    );
  }
  if (officialFee != null && (!Number.isFinite(officialFee) || officialFee < 0)) {
    return NextResponse.json(
      { error: "Official fee looks invalid." },
      { status: 400 },
    );
  }

  try {
    await createReportWithTaxonomy({
      city,
      service,
      subItem,
      office,
      officialFee: officialFee != null ? Math.round(officialFee) : null,
      extraPaid: Math.round(extraPaid),
      paidTo: VALID_PAID_TO.includes(paidTo) ? paidTo : "other",
      period,
      note,
      ipHash: hash,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not save your report. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
