import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceBySlug, getDepartmentCities } from "@/lib/queries";

type Params = { service: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { service: slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  const title = `${service.name} charges across India — by city`;
  const description = `Crowd-reported ${service.name.toLowerCase()} charges in cities across India: the real amounts people paid over official fees.`;
  return {
    title,
    description,
    alternates: { canonical: `/${service.slug}` },
    openGraph: { title, description, url: `/${service.slug}` },
  };
}

export const dynamic = "force-dynamic";

export default async function DepartmentPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { service: slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const cities = await getDepartmentCities(service.id);

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
        <span className="text-faint">/ {service.name}</span>
      </nav>

      <header className="mt-4 border-b border-hairline pb-8">
        <p className="kicker">Department</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {service.name}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          {service.short_desc} Choose a city to see what people report paying
          over the official fee.
        </p>
      </header>

      <h2 className="mt-10 font-display text-xl font-medium text-ink">
        Available cities{" "}
        <span className="text-faint">({cities.length})</span>
      </h2>
      {cities.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          No cities have data for this department yet.{" "}
          <Link href="/submit" className="font-medium text-accent underline">
            Be the first to report
          </Link>
          .
        </p>
      ) : (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {cities.map((c) => (
            <Link
              key={c.slug}
              href={`/${service.slug}/${c.slug}`}
              className="group flex items-center justify-between rounded-lg border border-hairline bg-surface px-4 py-3 transition hover:border-accent"
            >
              <span>
                <span className="font-medium text-ink">{c.name}</span>
                <span className="ml-2 text-sm text-faint">{c.state}</span>
              </span>
              <span className="text-xs uppercase tracking-[0.1em] text-faint">
                {c.office_count} office{c.office_count === 1 ? "" : "s"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
