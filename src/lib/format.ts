export function formatINR(amount: number | null): string {
  if (amount == null) return "—";
  return "₹" + amount.toLocaleString("en-IN");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function periodLabel(period: string): string {
  const [y, m] = period.split("-");
  const mi = Number(m) - 1;
  if (!y || Number.isNaN(mi) || mi < 0 || mi > 11) return period || "—";
  return `${MONTHS[mi]} ${y}`;
}

export function nowMonthYear(): string {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export const PAID_TO_LABEL: Record<string, string> = {
  "sro-staff": "SRO staff",
  agent: "Registration agent",
  middleman: "Middleman",
  other: "Other",
};
