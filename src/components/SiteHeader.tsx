import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-hairline bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            Bribe<span className="text-accent">Rates</span>
          </span>
          <span className="hidden text-[11px] uppercase tracking-[0.14em] text-faint sm:inline">
            India
          </span>
        </Link>
        <Link
          href="/submit"
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:opacity-90"
        >
          Report what you paid
        </Link>
      </div>
    </header>
  );
}
