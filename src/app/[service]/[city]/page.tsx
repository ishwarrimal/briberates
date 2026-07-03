import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RateCard } from "@/components/RateCard";
import {
  getServiceBySlug,
  getCityBySlug,
  getServiceCityRates,
} from "@/lib/queries";

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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-black/50 dark:text-white/50">
        <Link href="/" className="hover:underline">
          Home
        </Link>{" "}
        / {service.name} / {city.name}
      </nav>

      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
        {service.name} charges in {city.name}
      </h1>
      <p className="mt-2 max-w-2xl text-black/70 dark:text-white/70">
        What people report paying <strong>over and above</strong> official
        government fees for {service.name.toLowerCase()} in {city.name},{" "}
        {city.state}. {service.official_fee_note}
      </p>

      {/* City-wide aggregates */}
      <h2 className="mt-8 text-lg font-semibold">Typical extra, across {city.name}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {rates.map((rate) => (
          <RateCard key={rate.subItem.id} rate={rate} submitHref={submitHref} />
        ))}
      </div>

      {/* Offices */}
      <h2 className="mt-10 text-lg font-semibold">
        By Sub-Registrar Office ({offices.length})
      </h2>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        Rates vary by office. Pick yours for office-specific figures.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {offices.map((office) => (
          <Link
            key={office.id}
            href={`/office/${office.slug}`}
            className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            <span className="font-medium">{office.name}</span>
            <span className="text-sm text-black/40 dark:text-white/40">→</span>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-xl bg-amber-50 p-5 text-sm dark:bg-amber-950/20">
        Paid for {service.name.toLowerCase()} in {city.name} recently?{" "}
        <Link href={submitHref} className="font-semibold text-amber-600 underline">
          Add your figures
        </Link>{" "}
        — anonymously, in under a minute. It helps the next person.
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
