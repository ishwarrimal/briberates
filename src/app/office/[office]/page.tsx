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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav className="text-sm text-black/50 dark:text-white/50">
        <Link href="/" className="hover:underline">
          Home
        </Link>{" "}
        /{" "}
        {service && city && (
          <Link
            href={`/${service.slug}/${city.slug}`}
            className="hover:underline"
          >
            {service.name} in {city.name}
          </Link>
        )}{" "}
        / {office.area || office.name}
      </nav>

      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{office.name}</h1>
      {city && (
        <p className="mt-1 text-black/60 dark:text-white/60">
          {office.area && `${office.area}, `}
          {city.name}, {city.state}
        </p>
      )}
      <p className="mt-3 max-w-2xl text-black/70 dark:text-white/70">
        Amounts below are what people report paying{" "}
        <strong>over and above</strong> the official government fee at this
        office. Figures are anonymous and crowd-reported.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {rates.map((rate) => (
          <RateCard
            key={rate.subItem.id}
            rate={rate}
            officeId={office.id}
            submitHref={submitHref}
          />
        ))}
      </div>

      <div className="mt-10 rounded-xl bg-amber-50 p-5 text-sm dark:bg-amber-950/20">
        Been to {office.name}?{" "}
        <Link href={submitHref} className="font-semibold text-amber-600 underline">
          Report what you paid
        </Link>{" "}
        — anonymously. Every report sharpens the number for the next person.
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
