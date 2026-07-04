import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCityBySlug, getCityDepartments } from "@/lib/queries";

type Params = { city: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return {};
  const title = `Government office charges in ${city.name}`;
  const description = `What people report paying over official fees at government offices in ${city.name}, ${city.state} — by department.`;
  return {
    title,
    description,
    alternates: { canonical: `/city/${city.slug}` },
    openGraph: { title, description, url: `/city/${city.slug}` },
  };
}

export const dynamic = "force-dynamic";

export default async function CityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { city: slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const departments = await getCityDepartments(city.id);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <nav className="text-sm text-muted">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>{" "}
        <span className="text-faint">/</span>{" "}
        <Link href="/browse" className="hover:text-accent">
          Directory
        </Link>{" "}
        <span className="text-faint">/ {city.name}</span>
      </nav>

      <header className="mt-4 border-b border-hairline pb-8">
        <p className="kicker">{city.state}</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Government charges in {city.name}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          What people report paying over official fees at government offices in{" "}
          {city.name}, {city.state} — organised by department.
        </p>
      </header>

      {departments.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          No data for {city.name} yet.{" "}
          <Link href="/submit" className="font-medium text-accent underline">
            Be the first to report
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {departments.map((d) => (
            <section key={d.service.slug}>
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl font-medium text-ink">
                  {d.service.name}
                </h2>
                <Link
                  href={`/${d.service.slug}/${city.slug}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  See rates →
                </Link>
              </div>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {d.offices.map((o) => (
                  <Link
                    key={o.slug}
                    href={`/office/${o.slug}`}
                    className="group flex items-center justify-between rounded-lg border border-hairline bg-surface px-4 py-3 transition hover:border-accent"
                  >
                    <span className="font-medium text-ink">{o.name}</span>
                    <span className="text-accent opacity-0 transition group-hover:opacity-100">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
