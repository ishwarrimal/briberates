import type { PoolClient } from "pg";
import { query, queryOne, getPool, ready } from "./db";
import { computeStats } from "./aggregate";
import { slugify } from "./format";
import type {
  City,
  Office,
  Service,
  SubItem,
  SubItemRate,
  PaidTo,
} from "./types";

// ---- public reads (approved taxonomy only) ----

export function getServices(): Promise<Service[]> {
  return query<Service>(
    "SELECT * FROM services WHERE status = 'approved' ORDER BY name",
  );
}

export function getServiceBySlug(slug: string): Promise<Service | undefined> {
  return queryOne<Service>(
    "SELECT * FROM services WHERE slug = $1 AND status = 'approved'",
    [slug],
  );
}

export function getCityBySlug(slug: string): Promise<City | undefined> {
  return queryOne<City>(
    "SELECT * FROM cities WHERE slug = $1 AND status = 'approved'",
    [slug],
  );
}

export function getSubItems(serviceId: number): Promise<SubItem[]> {
  return query<SubItem>(
    "SELECT * FROM sub_items WHERE service_id = $1 AND status = 'approved' ORDER BY id",
    [serviceId],
  );
}

export function getOfficesForServiceCity(
  serviceId: number,
  cityId: number,
): Promise<Office[]> {
  return query<Office>(
    "SELECT * FROM offices WHERE service_id = $1 AND city_id = $2 AND status = 'approved' ORDER BY name",
    [serviceId, cityId],
  );
}

export function getOfficeBySlug(slug: string): Promise<Office | undefined> {
  return queryOne<Office>(
    "SELECT * FROM offices WHERE slug = $1 AND status = 'approved'",
    [slug],
  );
}

export function getCityById(id: number): Promise<City | undefined> {
  return queryOne<City>(
    "SELECT * FROM cities WHERE id = $1 AND status = 'approved'",
    [id],
  );
}

export function getServiceById(id: number): Promise<Service | undefined> {
  return queryOne<Service>(
    "SELECT * FROM services WHERE id = $1 AND status = 'approved'",
    [id],
  );
}

async function approvedExtras(
  officeId: number,
  subItemId: number,
): Promise<number[]> {
  const rows = await query<{ extra_paid: number }>(
    "SELECT extra_paid FROM reports WHERE office_id = $1 AND sub_item_id = $2 AND status = 'approved'",
    [officeId, subItemId],
  );
  return rows.map((r) => r.extra_paid);
}

async function corroborationCount(
  officeId: number,
  subItemId: number,
): Promise<number> {
  const row = await queryOne<{ c: string }>(
    "SELECT COUNT(*)::text AS c FROM corroborations WHERE office_id = $1 AND sub_item_id = $2",
    [officeId, subItemId],
  );
  return Number(row?.c ?? 0);
}

/** Per-sub-item aggregated rates for a single office (the "money" page). */
export async function getOfficeRates(office: Office): Promise<SubItemRate[]> {
  const subItems = await getSubItems(office.service_id);
  return Promise.all(
    subItems.map(async (subItem) => ({
      subItem,
      stats: computeStats(
        await approvedExtras(office.id, subItem.id),
        await corroborationCount(office.id, subItem.id),
      ),
    })),
  );
}

/** Aggregated rates for a sub-item across every office in a city. */
export async function getServiceCityRates(
  serviceId: number,
  cityId: number,
): Promise<{ offices: Office[]; rates: SubItemRate[] }> {
  const offices = await getOfficesForServiceCity(serviceId, cityId);
  const subItems = await getSubItems(serviceId);
  const officeIds = offices.map((o) => o.id);

  const rates: SubItemRate[] = await Promise.all(
    subItems.map(async (subItem) => {
      const extras: number[] = [];
      let corr = 0;
      for (const id of officeIds) {
        extras.push(...(await approvedExtras(id, subItem.id)));
        corr += await corroborationCount(id, subItem.id);
      }
      return { subItem, stats: computeStats(extras, corr) };
    }),
  );

  return { offices, rates };
}

export function getServiceCitiesWithData(serviceId: number): Promise<City[]> {
  return query<City>(
    `SELECT DISTINCT c.* FROM cities c
     JOIN offices o ON o.city_id = c.id
     WHERE o.service_id = $1 AND o.status = 'approved' AND c.status = 'approved'
     ORDER BY c.name`,
    [serviceId],
  );
}

// ---- corroboration write ----

export async function insertCorroboration(input: {
  subItemId: number;
  officeId: number;
  direction: "same" | "more" | "less";
  ipHash: string | null;
}): Promise<void> {
  await query(
    `INSERT INTO corroborations (sub_item_id, office_id, direction, ip_hash)
     VALUES ($1, $2, $3, $4)`,
    [input.subItemId, input.officeId, input.direction, input.ipHash],
  );
}

// ---- find-or-create resolvers (used when a user adds new taxonomy) ----

async function uniqueSlug(
  client: PoolClient,
  table: "services" | "offices" | "cities",
  base: string,
): Promise<string> {
  const root = base || "item";
  let slug = root;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const r = await client.query(
      `SELECT 1 FROM ${table} WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    if (r.rowCount === 0) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

async function uniqueSubItemSlug(
  client: PoolClient,
  serviceId: number,
  base: string,
): Promise<string> {
  const root = base || "item";
  let slug = root;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const r = await client.query(
      "SELECT 1 FROM sub_items WHERE service_id = $1 AND slug = $2 LIMIT 1",
      [serviceId, slug],
    );
    if (r.rowCount === 0) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

async function resolveCity(
  client: PoolClient,
  city: { id?: number; name?: string; state?: string },
): Promise<number> {
  if (city.id) return city.id;
  const name = (city.name ?? "").trim();
  const state = (city.state ?? "").trim();
  const found = await client.query<{ id: number }>(
    "SELECT id FROM cities WHERE lower(name) = lower($1) AND lower(state) = lower($2) ORDER BY (status = 'approved') DESC LIMIT 1",
    [name, state],
  );
  if (found.rowCount) return found.rows[0].id;
  const slug = await uniqueSlug(client, "cities", slugify(name));
  const ins = await client.query<{ id: number }>(
    "INSERT INTO cities (slug, name, state, status) VALUES ($1, $2, $3, 'pending') RETURNING id",
    [slug, name, state],
  );
  return ins.rows[0].id;
}

async function resolveService(
  client: PoolClient,
  service: { id?: number; name?: string },
): Promise<number> {
  if (service.id) return service.id;
  const name = (service.name ?? "").trim();
  const found = await client.query<{ id: number }>(
    "SELECT id FROM services WHERE lower(name) = lower($1) ORDER BY (status = 'approved') DESC LIMIT 1",
    [name],
  );
  if (found.rowCount) return found.rows[0].id;
  const slug = await uniqueSlug(client, "services", slugify(name));
  const ins = await client.query<{ id: number }>(
    `INSERT INTO services (slug, name, category, status)
     VALUES ($1, $2, $3, 'pending') RETURNING id`,
    [slug, name, slug],
  );
  return ins.rows[0].id;
}

async function resolveSubItem(
  client: PoolClient,
  serviceId: number,
  subItem: { id?: number; name?: string },
): Promise<number> {
  if (subItem.id) return subItem.id;
  const name = (subItem.name ?? "").trim();
  const found = await client.query<{ id: number }>(
    "SELECT id FROM sub_items WHERE service_id = $1 AND lower(name) = lower($2) ORDER BY (status = 'approved') DESC LIMIT 1",
    [serviceId, name],
  );
  if (found.rowCount) return found.rows[0].id;
  const slug = await uniqueSubItemSlug(client, serviceId, slugify(name));
  const ins = await client.query<{ id: number }>(
    "INSERT INTO sub_items (service_id, slug, name, status) VALUES ($1, $2, $3, 'pending') RETURNING id",
    [serviceId, slug, name],
  );
  return ins.rows[0].id;
}

async function resolveOffice(
  client: PoolClient,
  serviceId: number,
  cityId: number,
  office: { id?: number; name?: string; area?: string },
): Promise<number> {
  if (office.id) return office.id;
  const name = (office.name ?? "").trim();
  const area = (office.area ?? "").trim();
  const found = await client.query<{ id: number }>(
    "SELECT id FROM offices WHERE service_id = $1 AND city_id = $2 AND lower(name) = lower($3) ORDER BY (status = 'approved') DESC LIMIT 1",
    [serviceId, cityId, name],
  );
  if (found.rowCount) return found.rows[0].id;
  const slug = await uniqueSlug(client, "offices", slugify(name));
  const ins = await client.query<{ id: number }>(
    "INSERT INTO offices (slug, name, area, city_id, service_id, status) VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id",
    [slug, name, area, cityId, serviceId],
  );
  return ins.rows[0].id;
}

export type EntityInput = { id?: number; name?: string };

/**
 * Create a report, resolving (or creating, as pending) each taxonomy entity.
 * Everything a user adds stays invisible to the public until an admin approves
 * the report, which approves the whole chain.
 */
export async function createReportWithTaxonomy(input: {
  city: { id?: number; name?: string; state?: string };
  service: EntityInput;
  subItem: EntityInput;
  office: { id?: number; name?: string; area?: string };
  officialFee: number | null;
  extraPaid: number;
  paidTo: PaidTo;
  period: string;
  note: string | null;
  ipHash: string | null;
}): Promise<number> {
  await ready();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const cityId = await resolveCity(client, input.city);
    const serviceId = await resolveService(client, input.service);
    const subItemId = await resolveSubItem(client, serviceId, input.subItem);
    const officeId = await resolveOffice(
      client,
      serviceId,
      cityId,
      input.office,
    );

    const res = await client.query<{ id: number }>(
      `INSERT INTO reports
        (sub_item_id, office_id, official_fee, extra_paid, paid_to, period, note, status, is_sample)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 0) RETURNING id`,
      [
        subItemId,
        officeId,
        input.officialFee,
        input.extraPaid,
        input.paidTo,
        input.period,
        input.note,
      ],
    );
    await client.query("COMMIT");
    return res.rows[0].id;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ---- moderation ----

export type PendingReport = {
  id: number;
  extra_paid: number;
  paid_to: string;
  period: string;
  note: string | null;
  created_at: string;
  office_name: string;
  office_new: boolean;
  sub_item_name: string;
  sub_item_new: boolean;
  service_name: string;
  service_new: boolean;
  city_name: string;
  city_new: boolean;
};

export function getPendingReports(): Promise<PendingReport[]> {
  return query<PendingReport>(
    `SELECT r.id, r.extra_paid, r.paid_to, r.period, r.note, r.created_at,
            o.name AS office_name,   (o.status <> 'approved')  AS office_new,
            s.name AS sub_item_name, (s.status <> 'approved')  AS sub_item_new,
            sv.name AS service_name, (sv.status <> 'approved') AS service_new,
            c.name AS city_name,     (c.status <> 'approved')  AS city_new
     FROM reports r
     JOIN offices o   ON o.id = r.office_id
     JOIN sub_items s ON s.id = r.sub_item_id
     JOIN services sv ON sv.id = o.service_id
     JOIN cities c    ON c.id = o.city_id
     WHERE r.status = 'pending'
     ORDER BY r.created_at ASC`,
  );
}

/** Approve a report and the entire taxonomy chain it references. */
export async function approveReport(id: number): Promise<void> {
  await ready();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const rep = await client.query<{ office_id: number; sub_item_id: number }>(
      "SELECT office_id, sub_item_id FROM reports WHERE id = $1",
      [id],
    );
    if (rep.rowCount) {
      const { office_id, sub_item_id } = rep.rows[0];
      const off = await client.query<{ service_id: number; city_id: number }>(
        "SELECT service_id, city_id FROM offices WHERE id = $1",
        [office_id],
      );
      await client.query("UPDATE reports SET status = 'approved' WHERE id = $1", [id]);
      await client.query("UPDATE offices SET status = 'approved' WHERE id = $1", [office_id]);
      await client.query("UPDATE sub_items SET status = 'approved' WHERE id = $1", [sub_item_id]);
      if (off.rowCount) {
        await client.query("UPDATE services SET status = 'approved' WHERE id = $1", [off.rows[0].service_id]);
        await client.query("UPDATE cities SET status = 'approved' WHERE id = $1", [off.rows[0].city_id]);
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function rejectReport(id: number): Promise<void> {
  await query("UPDATE reports SET status = 'rejected' WHERE id = $1", [id]);
}

// ---- submit form data (approved options only) ----

export type SubmitFormData = {
  services: { id: number; slug: string; name: string }[];
  cities: { id: number; slug: string; name: string; state: string }[];
  offices: {
    id: number;
    slug: string;
    name: string;
    serviceSlug: string;
    citySlug: string;
  }[];
  subItems: { id: number; slug: string; name: string; serviceSlug: string }[];
};

export async function getSubmitFormData(): Promise<SubmitFormData> {
  const [services, cities, offices, subItems] = await Promise.all([
    query<SubmitFormData["services"][number]>(
      "SELECT id, slug, name FROM services WHERE status = 'approved' ORDER BY name",
    ),
    query<SubmitFormData["cities"][number]>(
      "SELECT id, slug, name, state FROM cities WHERE status = 'approved' ORDER BY name",
    ),
    query<SubmitFormData["offices"][number]>(
      `SELECT o.id, o.slug, o.name, sv.slug AS "serviceSlug", c.slug AS "citySlug"
       FROM offices o
       JOIN services sv ON sv.id = o.service_id
       JOIN cities c ON c.id = o.city_id
       WHERE o.status = 'approved'
       ORDER BY o.name`,
    ),
    query<SubmitFormData["subItems"][number]>(
      `SELECT si.id, si.slug, si.name, sv.slug AS "serviceSlug"
       FROM sub_items si
       JOIN services sv ON sv.id = si.service_id
       WHERE si.status = 'approved'
       ORDER BY si.id`,
    ),
  ]);
  return { services, cities, offices, subItems };
}

// ---- directory / navigation ----

export type NavData = {
  services: { slug: string; name: string }[];
  cities: { slug: string; name: string; state: string }[];
};

export async function getNavData(): Promise<NavData> {
  const [services, cities] = await Promise.all([
    query<{ slug: string; name: string }>(
      "SELECT slug, name FROM services WHERE status = 'approved' ORDER BY name",
    ),
    query<{ slug: string; name: string; state: string }>(
      "SELECT slug, name, state FROM cities WHERE status = 'approved' ORDER BY name",
    ),
  ]);
  return { services, cities };
}

export type DepartmentEntry = {
  id: number;
  slug: string;
  name: string;
  short_desc: string;
  city_count: number;
  office_count: number;
};

export function getDepartmentsDirectory(): Promise<DepartmentEntry[]> {
  return query<DepartmentEntry>(
    `SELECT sv.id, sv.slug, sv.name, sv.short_desc,
            COUNT(DISTINCT o.city_id)::int AS city_count,
            COUNT(o.id)::int AS office_count
     FROM services sv
     LEFT JOIN offices o ON o.service_id = sv.id AND o.status = 'approved'
     WHERE sv.status = 'approved'
     GROUP BY sv.id
     ORDER BY sv.name`,
  );
}

export type CityEntry = {
  id: number;
  slug: string;
  name: string;
  state: string;
  office_count: number;
  dept_count: number;
};

export async function getLocationsByState(): Promise<
  { state: string; cities: CityEntry[] }[]
> {
  const rows = await query<CityEntry>(
    `SELECT c.id, c.slug, c.name, c.state,
            COUNT(DISTINCT o.id)::int AS office_count,
            COUNT(DISTINCT o.service_id)::int AS dept_count
     FROM cities c
     LEFT JOIN offices o ON o.city_id = c.id AND o.status = 'approved'
     WHERE c.status = 'approved'
     GROUP BY c.id
     ORDER BY c.state, c.name`,
  );
  const byState = new Map<string, CityEntry[]>();
  for (const r of rows) {
    const list = byState.get(r.state) ?? [];
    list.push(r);
    byState.set(r.state, list);
  }
  return [...byState.entries()].map(([state, cities]) => ({ state, cities }));
}

/** Cities where a given department has at least one office. */
export function getDepartmentCities(serviceId: number): Promise<CityEntry[]> {
  return query<CityEntry>(
    `SELECT c.id, c.slug, c.name, c.state,
            COUNT(o.id)::int AS office_count,
            1 AS dept_count
     FROM cities c
     JOIN offices o ON o.city_id = c.id AND o.service_id = $1 AND o.status = 'approved'
     WHERE c.status = 'approved'
     GROUP BY c.id
     ORDER BY c.state, c.name`,
    [serviceId],
  );
}

/** Departments (with their offices) available in a given city. */
export async function getCityDepartments(
  cityId: number,
): Promise<
  { service: { slug: string; name: string }; offices: { slug: string; name: string; area: string }[] }[]
> {
  const rows = await query<{
    svc_slug: string;
    svc_name: string;
    off_slug: string;
    off_name: string;
    area: string;
  }>(
    `SELECT sv.slug AS svc_slug, sv.name AS svc_name,
            o.slug AS off_slug, o.name AS off_name, o.area
     FROM offices o
     JOIN services sv ON sv.id = o.service_id
     WHERE o.city_id = $1 AND o.status = 'approved' AND sv.status = 'approved'
     ORDER BY sv.name, o.name`,
    [cityId],
  );
  const grouped = new Map<
    string,
    { service: { slug: string; name: string }; offices: { slug: string; name: string; area: string }[] }
  >();
  for (const r of rows) {
    const entry =
      grouped.get(r.svc_slug) ??
      { service: { slug: r.svc_slug, name: r.svc_name }, offices: [] };
    entry.offices.push({ slug: r.off_slug, name: r.off_name, area: r.area });
    grouped.set(r.svc_slug, entry);
  }
  return [...grouped.values()];
}

export function getAllCitySlugs(): Promise<string[]> {
  return query<{ slug: string }>(
    "SELECT slug FROM cities WHERE status = 'approved'",
  ).then((rows) => rows.map((r) => r.slug));
}

export function getAllServiceSlugs(): Promise<string[]> {
  return query<{ slug: string }>(
    "SELECT slug FROM services WHERE status = 'approved'",
  ).then((rows) => rows.map((r) => r.slug));
}

// ---- sitemap helpers (approved only) ----

export async function getAllOfficeSlugs(): Promise<string[]> {
  const rows = await query<{ slug: string }>(
    "SELECT slug FROM offices WHERE status = 'approved'",
  );
  return rows.map((r) => r.slug);
}

export function getServiceCityPairs(): Promise<
  { service: string; city: string }[]
> {
  return query<{ service: string; city: string }>(
    `SELECT DISTINCT sv.slug AS service, c.slug AS city
     FROM offices o
     JOIN services sv ON sv.id = o.service_id
     JOIN cities c ON c.id = o.city_id
     WHERE o.status = 'approved' AND sv.status = 'approved' AND c.status = 'approved'`,
  );
}
