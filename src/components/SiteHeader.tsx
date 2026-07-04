import Link from "next/link";
import { BrowseMenu } from "./BrowseMenu";
import { getNavData } from "@/lib/queries";

export async function SiteHeader() {
  const { services, cities } = await getNavData();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold tracking-tight text-ink">
              Bribe<span className="text-accent">Rates</span>
            </span>
            <span className="hidden text-[11px] uppercase tracking-[0.14em] text-faint sm:inline">
              India
            </span>
          </Link>
          <nav className="hidden items-center gap-5 sm:flex">
            <BrowseMenu services={services} cities={cities} />
            <Link
              href="/browse"
              className="text-sm font-medium text-ink transition hover:text-accent"
            >
              Directory
            </Link>
          </nav>
        </div>
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
