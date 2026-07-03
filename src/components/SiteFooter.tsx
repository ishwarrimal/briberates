import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-black/60 dark:text-white/60">
        <p className="max-w-2xl">
          {SITE.name} publishes anonymous, crowd-reported amounts that people say
          they paid — over and above official government fees — to get everyday
          paperwork done. Figures are user-submitted and unverified; treat them
          as a rough guide, not advice. We do not encourage paying anyone
          anything beyond the lawful fee.
        </p>
        <p className="mt-4 text-black/40 dark:text-white/40">
          © {SITE.domain} · Data is crowdsourced and provided as-is.
        </p>
      </div>
    </footer>
  );
}
