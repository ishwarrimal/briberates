import Link from "next/link";
import { getServices, getServiceCitiesWithData } from "@/lib/queries";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function Home() {
  const services = await getServices();
  const cityLists = await Promise.all(
    services.map((s) => getServiceCitiesWithData(s.id)),
  );

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-black/10 bg-amber-50 dark:border-white/10 dark:bg-amber-950/20">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Know the going rate before you go.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-black/70 dark:text-white/70">
            {SITE.name} collects what people <em>actually</em> paid — over and
            above official fees — to get government paperwork done across India.
            Anonymous, crowd-reported, no login.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/submit"
              className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400"
            >
              Report what you paid
            </Link>
            <a
              href="#browse"
              className="rounded-full border border-black/20 px-5 py-2.5 text-sm font-semibold hover:bg-black/5 dark:border-white/25 dark:hover:bg-white/10"
            >
              Browse rates
            </a>
          </div>
        </div>
      </section>

      {/* Browse */}
      <section id="browse" className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-xl font-semibold">Browse by service</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {services.map((service, i) => (
            <div
              key={service.id}
              className="rounded-xl border border-black/10 p-5 dark:border-white/10"
            >
              <h3 className="text-lg font-semibold">{service.name}</h3>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                {service.short_desc}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {cityLists[i].map((city) => (
                  <Link
                    key={city.id}
                    href={`/${service.slug}/${city.slug}`}
                    className="rounded-full border border-black/15 px-3 py-1 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-dashed border-black/15 p-5 text-sm text-black/60 dark:border-white/20 dark:text-white/60">
          <strong className="text-black/80 dark:text-white/80">
            How the numbers work:
          </strong>{" "}
          each rate is the median of anonymous reports, with statistical
          outliers removed. One report is a rumour; many reports become a price.
          Confidence grows as more people report and confirm.
        </div>
      </section>
    </div>
  );
}
