import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thanks for your report",
  robots: { index: false, follow: false },
};

export default function ThankYou() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="font-display text-4xl font-semibold text-ink">Thank you 🙏</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Your report was submitted anonymously and will appear once it&apos;s
        reviewed. You just made the next person a little less likely to overpay.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-full border border-hairline px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
        >
          Back to home
        </Link>
        <Link
          href="/submit"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:opacity-90"
        >
          Report another
        </Link>
      </div>
    </div>
  );
}
