"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SubmitFormData } from "@/lib/queries";

const PAID_TO = [
  { value: "sro-staff", label: "Office staff" },
  { value: "agent", label: "Agent" },
  { value: "middleman", label: "Middleman / broker" },
  { value: "other", label: "Other" },
];

const norm = (s: string) => s.trim().toLowerCase();

export function SubmitForm({
  data,
  initial,
  turnstileSiteKey,
}: {
  data: SubmitFormData;
  initial: { office?: string; service?: string; city?: string };
  turnstileSiteKey?: string;
}) {
  const router = useRouter();

  const initialOffice = initial.office
    ? data.offices.find((o) => o.slug === initial.office)
    : undefined;
  const initialService =
    data.services.find(
      (s) => s.slug === (initialOffice?.serviceSlug ?? initial.service),
    ) ?? undefined;
  const initialCity =
    data.cities.find(
      (c) => c.slug === (initialOffice?.citySlug ?? initial.city),
    ) ?? undefined;

  const [serviceText, setServiceText] = useState(initialService?.name ?? "");
  const [subItemText, setSubItemText] = useState("");
  const [cityText, setCityText] = useState(initialCity?.name ?? "");
  const [cityState, setCityState] = useState("");
  const [officeText, setOfficeText] = useState(initialOffice?.name ?? "");
  const [officeArea, setOfficeArea] = useState("");

  const [extraPaid, setExtraPaid] = useState("");
  const [officialFee, setOfficialFee] = useState("");
  const [paidTo, setPaidTo] = useState("sro-staff");
  const [period, setPeriod] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Match typed text to an existing (approved) entry, case-insensitively.
  const matchedService = useMemo(
    () => data.services.find((s) => norm(s.name) === norm(serviceText)),
    [data.services, serviceText],
  );
  const matchedCity = useMemo(
    () => data.cities.find((c) => norm(c.name) === norm(cityText)),
    [data.cities, cityText],
  );
  const subItemOptions = useMemo(
    () =>
      matchedService
        ? data.subItems.filter((s) => s.serviceSlug === matchedService.slug)
        : [],
    [data.subItems, matchedService],
  );
  const matchedSubItem = useMemo(
    () => subItemOptions.find((s) => norm(s.name) === norm(subItemText)),
    [subItemOptions, subItemText],
  );
  const officeOptions = useMemo(
    () =>
      matchedService && matchedCity
        ? data.offices.filter(
            (o) =>
              o.serviceSlug === matchedService.slug &&
              o.citySlug === matchedCity.slug,
          )
        : [],
    [data.offices, matchedService, matchedCity],
  );
  const matchedOffice = useMemo(
    () => officeOptions.find((o) => norm(o.name) === norm(officeText)),
    [officeOptions, officeText],
  );

  const serviceNew = serviceText.trim() !== "" && !matchedService;
  const subItemNew = subItemText.trim() !== "" && !matchedSubItem;
  const cityNew = cityText.trim() !== "" && !matchedCity;
  const officeNew = officeText.trim() !== "" && !matchedOffice;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (
      !serviceText.trim() ||
      !subItemText.trim() ||
      !cityText.trim() ||
      !officeText.trim() ||
      !extraPaid
    ) {
      setError("Please fill department, service, city, office and the amount.");
      return;
    }
    if (cityNew && !cityState.trim()) {
      setError("Please add the state for the new city.");
      return;
    }

    let turnstileToken = "";
    if (turnstileSiteKey) {
      turnstileToken =
        (
          document.querySelector(
            'input[name="cf-turnstile-response"]',
          ) as HTMLInputElement | null
        )?.value ?? "";
    }

    const payload = {
      service: matchedService
        ? { id: matchedService.id }
        : { name: serviceText.trim() },
      subItem: matchedSubItem
        ? { id: matchedSubItem.id }
        : { name: subItemText.trim() },
      city: matchedCity
        ? { id: matchedCity.id }
        : { name: cityText.trim(), state: cityState.trim() },
      office: matchedOffice
        ? { id: matchedOffice.id }
        : { name: officeText.trim(), area: officeArea.trim() },
      extraPaid: Number(extraPaid),
      officialFee: officialFee ? Number(officialFee) : null,
      paidTo,
      period,
      note: note.trim() || null,
      turnstileToken,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Something went wrong. Please try again.");
      }
      router.push("/submit/thank-you");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  const field =
    "mt-1 w-full rounded-lg border border-hairline bg-surface px-3 py-2 text-ink outline-none focus:border-accent";
  const label = "block text-sm font-medium text-ink";
  const newHint = "mt-1 text-xs text-accent";

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5">
      {/* Department / service */}
      <div>
        <label className={label}>Department / Service *</label>
        <input
          className={field}
          list="services-list"
          placeholder="e.g. Property Registration, RTO, Passport…"
          value={serviceText}
          onChange={(e) => setServiceText(e.target.value)}
        />
        <datalist id="services-list">
          {data.services.map((s) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>
        {serviceNew && (
          <p className={newHint}>
            New department — we&apos;ll add it after a quick review.
          </p>
        )}
      </div>

      {/* Sub-item */}
      <div>
        <label className={label}>What did you get done? *</label>
        <input
          className={field}
          list="subitems-list"
          placeholder="e.g. Sale Deed, Driving Licence, Khata Transfer…"
          value={subItemText}
          onChange={(e) => setSubItemText(e.target.value)}
        />
        <datalist id="subitems-list">
          {subItemOptions.map((s) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>
        {subItemNew && (
          <p className={newHint}>New service item — will be added for review.</p>
        )}
      </div>

      {/* City */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>City *</label>
          <input
            className={field}
            list="cities-list"
            placeholder="e.g. Bengaluru"
            value={cityText}
            onChange={(e) => setCityText(e.target.value)}
          />
          <datalist id="cities-list">
            {data.cities.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
          {cityNew && <p className={newHint}>New city — will be added for review.</p>}
        </div>
        {cityNew && (
          <div>
            <label className={label}>State *</label>
            <input
              className={field}
              placeholder="e.g. Karnataka"
              value={cityState}
              onChange={(e) => setCityState(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Office */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Office / location *</label>
          <input
            className={field}
            list="offices-list"
            placeholder="e.g. Sub-Registrar Office, Banaswadi"
            value={officeText}
            onChange={(e) => setOfficeText(e.target.value)}
          />
          <datalist id="offices-list">
            {officeOptions.map((o) => (
              <option key={o.id} value={o.name} />
            ))}
          </datalist>
          {officeNew && (
            <p className={newHint}>New office — will be added for review.</p>
          )}
        </div>
        {officeNew && (
          <div>
            <label className={label}>Area / locality (optional)</label>
            <input
              className={field}
              placeholder="e.g. Banaswadi"
              value={officeArea}
              onChange={(e) => setOfficeArea(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Amounts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Extra amount you paid (₹) *</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            className={field}
            placeholder="e.g. 30000"
            value={extraPaid}
            onChange={(e) => setExtraPaid(e.target.value)}
          />
          <p className="mt-1 text-xs text-faint">
            Over and above the official fee.
          </p>
        </div>
        <div>
          <label className={label}>Official fee, if you know it (₹)</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            className={field}
            placeholder="optional"
            value={officialFee}
            onChange={(e) => setOfficialFee(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Paid to</label>
          <select
            className={field}
            value={paidTo}
            onChange={(e) => setPaidTo(e.target.value)}
          >
            {PAID_TO.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>When?</label>
          <input
            type="month"
            className={field}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={label}>Anything else? (optional)</label>
        <textarea
          className={field}
          rows={3}
          maxLength={500}
          placeholder="Context that might help others — no personal details, please."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {turnstileSiteKey && (
        <div className="cf-turnstile" data-sitekey={turnstileSiteKey} />
      )}

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit anonymously"}
      </button>
      <p className="text-xs text-faint">
        No login, no name, no email. Anything new you add is reviewed before it
        appears publicly.
      </p>
    </form>
  );
}
