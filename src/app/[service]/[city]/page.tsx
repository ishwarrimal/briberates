import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RateCard } from "@/components/RateCard";
import {
  getServiceBySlug,
  getCityBySlug,
  getServiceCityRates,
} from "@/lib/queries";
import { nowMonthYear } from "@/lib/format";

type Params = { service: string; city: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { service: serviceSlug, city: citySlug } = await params;
  const [service, city] = await Promise.all([
    getServiceBySlug(serviceSlug),
    getCityBySlug(citySlug),
  ]);
  if (!service || !city) return {};

  const title = `${service.name} Charges in ${city.name} — What People Actually Paid`;
  const description = `Crowd-reported ${service.name.toLowerCase()} charges in ${city.name}, ${city.state}: the real amounts people paid over official fees, by Sub-Registrar Office. Updated from anonymous reports.`;
  const canonical = `/${service.slug}/${city.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  };
}

export default async function ServiceCityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { service: serviceSlug, city: citySlug } = await params;
  const [service, city] = await Promise.all([
    getServiceBySlug(serviceSlug),
    getCityBySlug(citySlug),
  ]);
  if (!service || !city) notFound();

  const { offices, rates } = await getServiceCityRates(service.id, city.id);
  const submitHref = `/submit?service=${service.slug}&city=${city.slug}`;
  const totalReports = rates.reduce((n, r) => n + r.stats.count, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: rates
      .filter((r) => r.stats.median != null)
      .map((r) => ({
        "@type": "Question",
        name: `How much extra do people pay for ${r.subItem.name} in ${city.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Anonymous reports put the typical extra amount at around ₹${r.stats.median?.toLocaleString(
            "en-IN",
          )}, with most people paying between ₹${r.stats.q1?.toLocaleString(
            "en-IN",
          )} and ₹${r.stats.q3?.toLocaleString("en-IN")}.`,
        },
      })),
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-muted">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>{" "}
        <span className="text-faint">/ {service.name} / {city.name}</span>
      </nav>

      <header className="mt-4 border-b border-hairline pb-8">
        <p className="kicker">{service.name}</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {service.name} charges in {city.name}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">
          What people report paying <strong className="text-ink">over and
          above</strong> official government fees for{" "}
          {service.name.toLowerCase()} in {city.name}, {city.state}.
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.1em] text-faint">
          Based on {totalReports} anonymous report{totalReports === 1 ? "" : "s"} ·{" "}
          {nowMonthYear()}
        </p>
      </header>

      {/* City-wide aggregates */}
      <h2 className="mt-10 font-display text-xl font-medium text-ink">
        Typical extra, across {city.name}
      </h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        {rates.map((rate) => (
          <RateCard key={rate.subItem.id} rate={rate} submitHref={submitHref} />
        ))}
      </div>

      {/* Offices */}
      <h2 className="mt-12 font-display text-xl font-medium text-ink">
        By office <span className="text-faint">({offices.length})</span>
      </h2>
      <p className="mt-1 text-sm text-muted">
        Rates vary by office. Pick yours for office-specific figures.
      </p>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {offices.map((office) => (
          <Link
            key={office.id}
            href={`/office/${office.slug}`}
            className="group flex items-center justify-between rounded-lg border border-hairline bg-surface px-4 py-3 transition hover:border-accent"
          >
            <span className="font-medium text-ink">{office.name}</span>
            <span className="text-accent opacity-0 transition group-hover:opacity-100">
              →
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-hairline bg-surface p-6 text-sm text-muted">
        Paid for {service.name.toLowerCase()} in {city.name} recently?{" "}
        <Link href={submitHref} className="font-medium text-accent underline">
          Add your figures
        </Link>{" "}
        — anonymously, in under a minute. It helps the next person.
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
