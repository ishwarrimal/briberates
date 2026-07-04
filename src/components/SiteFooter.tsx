import Link from "next/link";
import { SITE } from "@/lib/site";
import { getNavData } from "@/lib/queries";

export async function SiteFooter() {
  const { services, cities } = await getNavData();

  return (
    <footer className="mt-20 border-t border-hairline">
      <div className="mx-auto max-w-5xl px-5 py-12">
        {(services.length > 0 || cities.length > 0) && (
          <div className="grid gap-8 border-b border-hairline pb-10 sm:grid-cols-3">
            <div>
              <p className="kicker mb-3">Departments</p>
              <ul className="space-y-1.5">
                {services.slice(0, 8).map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/${s.slug}`}
                      className="text-sm text-muted transition hover:text-accent"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="kicker mb-3">Cities</p>
              <ul className="space-y-1.5">
                {cities.slice(0, 8).map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/city/${c.slug}`}
                      className="text-sm text-muted transition hover:text-accent"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="kicker mb-3">Site</p>
              <ul className="space-y-1.5">
                <li>
                  <Link
                    href="/browse"
                    className="text-sm text-muted transition hover:text-accent"
                  >
                    Full directory
                  </Link>
                </li>
                <li>
                  <Link
                    href="/submit"
                    className="text-sm text-muted transition hover:text-accent"
                  >
                    Report what you paid
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        )}

        <p className="mt-8 font-display text-base italic text-ink">{SITE.name}</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          We publish anonymous, crowd-reported amounts that people say they paid —
          over and above official government fees — to get everyday paperwork done.
          Figures are user-submitted and unverified; treat them as a rough guide,
          not advice. We do not encourage paying anyone beyond the lawful fee.
        </p>
        <p className="mt-4 text-xs text-faint">
          © {SITE.domain} · Crowdsourced data, provided as-is.
        </p>
      </div>
    </footer>
  );
}
