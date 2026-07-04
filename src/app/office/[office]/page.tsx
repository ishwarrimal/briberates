import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RateCard } from "@/components/RateCard";
import {
  getOfficeBySlug,
  getOfficeRates,
  getCityById,
  getServiceById,
} from "@/lib/queries";
import { nowMonthYear } from "@/lib/format";

type Params = { office: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { office: slug } = await params;
  const office = await getOfficeBySlug(slug);
  if (!office) return {};
  const [city, service] = await Promise.all([
    getCityById(office.city_id),
    getServiceById(office.service_id),
  ]);

  const title = `${office.name} — Charges People Actually Paid`;
  const description = `What people report paying at ${office.name}${
    city ? `, ${city.name}` : ""
  } for ${service?.name.toLowerCase() ?? "government work"}: real, over-the-official-fee amounts from anonymous reports.`;
  const canonical = `/office/${office.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  };
}

export default async function OfficePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { office: slug } = await params;
  const office = await getOfficeBySlug(slug);
  if (!office) notFound();

  const [city, service, rates] = await Promise.all([
    getCityById(office.city_id),
    getServiceById(office.service_id),
    getOfficeRates(office),
  ]);
  const submitHref = `/submit?office=${office.slug}`;
  const totalReports = rates.reduce((n, r) => n + r.stats.count, 0);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <nav className="text-sm text-muted">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>{" "}
        <span className="text-faint">/</span>{" "}
        {service && city && (
          <Link
            href={`/${service.slug}/${city.slug}`}
            className="hover:text-accent"
          >
            {service.name} in {city.name}
          </Link>
        )}{" "}
        <span className="text-faint">/ {office.area || office.name}</span>
      </nav>

      <header className="mt-4 border-b border-hairline pb-8">
        {service && <p className="kicker">{service.name}</p>}
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {office.name}
        </h1>
        {city && (
          <p className="mt-2 text-muted">
            {office.area && `${office.area}, `}
            {city.name}, {city.state}
          </p>
        )}
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          What people report paying <strong className="text-ink">over and
          above</strong> the official government fee at this office. Anonymous
          and crowd-reported.
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.1em] text-faint">
          Based on {totalReports} anonymous report{totalReports === 1 ? "" : "s"} ·{" "}
          {nowMonthYear()}
        </p>
      </header>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {rates.map((rate) => (
          <RateCard
            key={rate.subItem.id}
            rate={rate}
            officeId={office.id}
            submitHref={submitHref}
          />
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-hairline bg-surface p-6 text-sm text-muted">
        Been to {office.name}?{" "}
        <Link href={submitHref} className="font-medium text-accent underline">
          Report what you paid
        </Link>{" "}
        — anonymously. Every report sharpens the number for the next person.
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
