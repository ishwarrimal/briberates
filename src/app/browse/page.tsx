import type { Metadata } from "next";
import Link from "next/link";
import { getDepartmentsDirectory, getLocationsByState } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Directory — Browse by department & city",
  description:
    "Browse crowd-reported government charges across India by department and by city.",
  alternates: { canonical: "/browse" },
};

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const [departments, locations] = await Promise.all([
    getDepartmentsDirectory(),
    getLocationsByState(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <header className="border-b border-hairline pb-8">
        <p className="kicker">Directory</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Browse everything
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          Find rates by government department or by city. Pick a department to
          see every city it covers, or a city to see every office in it.
        </p>
      </header>

      {/* Departments */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-medium text-ink">
          By department
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {departments.map((d) => (
            <Link
              key={d.slug}
              href={`/${d.slug}`}
              className="group rounded-xl border border-hairline bg-surface p-5 transition hover:border-accent"
            >
              <h3 className="font-display text-lg font-medium text-ink group-hover:text-accent">
                {d.name}
              </h3>
              {d.short_desc && (
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {d.short_desc}
                </p>
              )}
              <p className="mt-3 text-xs uppercase tracking-[0.1em] text-faint">
                {d.office_count} office{d.office_count === 1 ? "" : "s"} ·{" "}
                {d.city_count} cit{d.city_count === 1 ? "y" : "ies"}
              </p>
            </Link>
          ))}
          {departments.length === 0 && (
            <p className="text-sm text-faint">No departments yet.</p>
          )}
        </div>
      </section>

      {/* Locations */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-medium text-ink">By location</h2>
        <div className="mt-4 space-y-8">
          {locations.map((group) => (
            <div key={group.state}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-muted">
                {group.state}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.cities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/city/${c.slug}`}
                    className="rounded-lg border border-hairline bg-surface px-3.5 py-2 text-sm text-ink transition hover:border-accent hover:text-accent"
                  >
                    {c.name}
                    <span className="ml-1.5 text-xs text-faint">
                      {c.office_count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {locations.length === 0 && (
            <p className="text-sm text-faint">No cities yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
