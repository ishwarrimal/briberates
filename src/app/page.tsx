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
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <p className="kicker">Crowdsourced · India</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            What government paperwork{" "}
            <span className="italic text-accent">really</span> costs.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {SITE.name} collects what people actually paid — over and above the
            official fee — to get everyday government work done across India.
            Anonymous, crowd-reported, no login. Know the going rate before you go.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/submit"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:opacity-90"
            >
              Report what you paid
            </Link>
            <a
              href="#browse"
              className="rounded-full border border-hairline px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
            >
              Browse the rates
            </a>
          </div>
        </div>
      </section>

      {/* Browse */}
      <section id="browse" className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="font-display text-2xl font-medium text-ink">
          Browse by department
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {services.map((service, i) => (
            <div
              key={service.id}
              className="rounded-xl border border-hairline bg-surface p-6"
            >
              <h3 className="font-display text-xl font-medium text-ink">
                {service.name}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {service.short_desc}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {cityLists[i].map((city) => (
                  <Link
                    key={city.id}
                    href={`/${service.slug}/${city.slug}`}
                    className="rounded-full border border-hairline px-3 py-1 text-sm text-ink transition hover:border-accent hover:text-accent"
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-12 grid gap-6 border-t border-hairline pt-10 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "People report",
              d: "Anonymously, in under a minute. No login, no name — just what they paid.",
            },
            {
              n: "02",
              t: "Numbers converge",
              d: "We show the median with outliers removed. One report is a rumour; many become a price.",
            },
            {
              n: "03",
              t: "You go informed",
              d: "See the typical extra and the range for your office, so you don't overpay.",
            },
          ].map((step) => (
            <div key={step.n}>
              <p className="font-display text-2xl text-accent">{step.n}</p>
              <h4 className="mt-2 font-medium text-ink">{step.t}</h4>
              <p className="mt-1 text-sm leading-relaxed text-muted">{step.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
