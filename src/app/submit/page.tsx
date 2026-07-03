import type { Metadata } from "next";
import Script from "next/script";
import { getSubmitFormData } from "@/lib/queries";
import { SubmitForm } from "./SubmitForm";

export const metadata: Metadata = {
  title: "Report what you paid",
  description:
    "Anonymously report the extra amount you paid for government paperwork. No login required.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [data, sp] = await Promise.all([getSubmitFormData(), searchParams]);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {turnstileSiteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
      )}
      <h1 className="text-2xl font-bold sm:text-3xl">Report what you paid</h1>
      <p className="mt-2 text-black/70 dark:text-white/70">
        Help the next person know the going rate. It&apos;s anonymous — no login,
        no name, no email — and takes under a minute. Reports are reviewed before
        they go live.
      </p>

      <SubmitForm
        data={data}
        initial={{ office: sp.office, service: sp.service, city: sp.city }}
        turnstileSiteKey={turnstileSiteKey}
      />
    </div>
  );
}
