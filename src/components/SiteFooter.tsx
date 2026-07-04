import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-hairline">
      <div className="mx-auto max-w-5xl px-5 py-10 text-sm text-muted">
        <p className="font-display text-base italic text-ink">{SITE.name}</p>
        <p className="mt-3 max-w-2xl leading-relaxed">
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
