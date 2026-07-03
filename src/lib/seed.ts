import type { Pool } from "pg";

/**
 * Schema + demo seed for Postgres (Supabase).
 *
 * Everything here except the two real Banaswadi data-points (from the site
 * owner's own registration) is flagged is_sample = 1. Before going live with
 * real crowd data, wipe the demo rows with:
 *   DELETE FROM reports WHERE is_sample = 1;
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  short_desc TEXT NOT NULL DEFAULT '',
  official_fee_note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS sub_items (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  official_fee_note TEXT NOT NULL DEFAULT '',
  UNIQUE(service_id, slug)
);

CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS offices (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city_id INTEGER NOT NULL REFERENCES cities(id),
  service_id INTEGER NOT NULL REFERENCES services(id)
);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  sub_item_id INTEGER NOT NULL REFERENCES sub_items(id),
  office_id INTEGER NOT NULL REFERENCES offices(id),
  official_fee INTEGER,
  extra_paid INTEGER NOT NULL,
  paid_to TEXT NOT NULL DEFAULT 'other',
  period TEXT NOT NULL DEFAULT '',
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  is_sample INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corroborations (
  id SERIAL PRIMARY KEY,
  sub_item_id INTEGER NOT NULL REFERENCES sub_items(id),
  office_id INTEGER NOT NULL REFERENCES offices(id),
  direction TEXT NOT NULL,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_lookup ON reports(office_id, sub_item_id, status);
CREATE INDEX IF NOT EXISTS idx_corr_lookup ON corroborations(office_id, sub_item_id);

-- Taxonomy moderation: user-added departments/offices/etc. start as 'pending'
-- and only appear publicly once approved. Existing rows default to 'approved'.
ALTER TABLE services  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE sub_items ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE offices   ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE cities    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';
`;

export async function ensureSchema(pool: Pool): Promise<void> {
  await pool.query(SCHEMA);
}

const SUB_ITEMS = [
  {
    slug: "sale-deed",
    name: "Sale Deed Registration",
    official_fee_note:
      "Official: stamp duty 5% + registration fee 1% of property value.",
  },
  {
    slug: "modt",
    name: "MODT (Memorandum of Deposit of Title Deed)",
    official_fee_note: "Official: 0.1%–0.5% of loan amount as stamp duty.",
  },
  {
    slug: "khata-transfer",
    name: "Khata Transfer",
    official_fee_note: "Official: BBMP charges ~2% of stamp duty value.",
  },
  {
    slug: "encumbrance-certificate",
    name: "Encumbrance Certificate (EC)",
    official_fee_note: "Official: ₹35 + ₹35 per year searched (approx).",
  },
];

const OFFICES = [
  { slug: "banaswadi-sro", name: "Sub-Registrar Office, Banaswadi", area: "Banaswadi" },
  { slug: "shivajinagar-sro", name: "Sub-Registrar Office, Shivajinagar", area: "Shivajinagar" },
  { slug: "jayanagar-sro", name: "Sub-Registrar Office, Jayanagar", area: "Jayanagar" },
  { slug: "basavanagudi-sro", name: "Sub-Registrar Office, Basavanagudi", area: "Basavanagudi" },
  { slug: "whitefield-sro", name: "Sub-Registrar Office, Whitefield", area: "Whitefield" },
];

const SAMPLE_REPORTS: Record<string, Record<string, number[]>> = {
  "banaswadi-sro": {
    "sale-deed": [28000, 32000, 35000, 25000, 31000],
    modt: [7000, 8500, 10000, 9000],
    "khata-transfer": [12000, 15000],
  },
  "shivajinagar-sro": {
    "sale-deed": [40000, 45000, 38000, 50000],
    modt: [9000, 11000, 8000],
  },
  "jayanagar-sro": {
    "sale-deed": [33000, 36000, 30000],
    "encumbrance-certificate": [500, 800, 1000],
  },
  "basavanagudi-sro": {
    "sale-deed": [27000, 29000],
  },
  "whitefield-sro": {
    modt: [12000, 14000, 13000, 15000, 11000],
    "sale-deed": [42000, 48000, 44000],
  },
};

const REAL_REPORTS = [
  { office: "banaswadi-sro", subItem: "sale-deed", extra: 30000, note: "Own registration, sale deed." },
  { office: "banaswadi-sro", subItem: "modt", extra: 8000, note: "Own registration, MODT with bank loan." },
];

const PAID_TO = ["sro-staff", "agent", "middleman"];
const PERIODS = ["2025-11", "2026-01", "2026-02", "2026-03", "2026-05", "2026-06"];

export async function seedIfEmpty(pool: Pool): Promise<void> {
  const { rows } = await pool.query<{ c: string }>(
    "SELECT COUNT(*)::text AS c FROM services",
  );
  if (Number(rows[0].c) > 0) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const cityId = (
      await client.query<{ id: number }>(
        "INSERT INTO cities (slug, name, state) VALUES ($1, $2, $3) RETURNING id",
        ["bengaluru", "Bengaluru", "Karnataka"],
      )
    ).rows[0].id;

    const serviceId = (
      await client.query<{ id: number }>(
        `INSERT INTO services (slug, name, category, short_desc, official_fee_note)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          "property-registration",
          "Property Registration",
          "property-registration",
          "Registering a property sale, mortgage or transfer at the Sub-Registrar Office (SRO).",
          "Official charges are stamp duty + registration fee set by the Karnataka govt. Amounts below are the EXTRA, over-and-above these official fees, that people report paying.",
        ],
      )
    ).rows[0].id;

    const subItemId: Record<string, number> = {};
    for (const s of SUB_ITEMS) {
      subItemId[s.slug] = (
        await client.query<{ id: number }>(
          "INSERT INTO sub_items (service_id, slug, name, official_fee_note) VALUES ($1, $2, $3, $4) RETURNING id",
          [serviceId, s.slug, s.name, s.official_fee_note],
        )
      ).rows[0].id;
    }

    const officeId: Record<string, number> = {};
    for (const o of OFFICES) {
      officeId[o.slug] = (
        await client.query<{ id: number }>(
          "INSERT INTO offices (slug, name, area, city_id, service_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
          [o.slug, o.name, o.area, cityId, serviceId],
        )
      ).rows[0].id;
    }

    const insertReport = (
      subItem: number,
      office: number,
      extra: number,
      paidTo: string,
      period: string,
      note: string | null,
      isSample: number,
    ) =>
      client.query(
        `INSERT INTO reports
          (sub_item_id, office_id, extra_paid, paid_to, period, note, status, is_sample)
         VALUES ($1, $2, $3, $4, $5, $6, 'approved', $7)`,
        [subItem, office, extra, paidTo, period, note, isSample],
      );

    let i = 0;
    for (const [oSlug, byItem] of Object.entries(SAMPLE_REPORTS)) {
      for (const [siSlug, amounts] of Object.entries(byItem)) {
        for (const amt of amounts) {
          await insertReport(
            subItemId[siSlug],
            officeId[oSlug],
            amt,
            PAID_TO[i % PAID_TO.length],
            PERIODS[i % PERIODS.length],
            null,
            1,
          );
          i++;
        }
      }
    }

    for (const r of REAL_REPORTS) {
      await insertReport(
        subItemId[r.subItem],
        officeId[r.office],
        r.extra,
        "sro-staff",
        "2026-06",
        r.note,
        0,
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
