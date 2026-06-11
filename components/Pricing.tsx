'use client';

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Plus } from "lucide-react";
import {
  ADDONS,
  BASE_PRICE,
  BILLING_PERIODS,
  GENERAL_FAQ,
  PRICE_PER_EXTRA_STAFF,
  PRICING_FAQ,
  SMS_PACKS,
  STAFF_OPTIONS,
  calcTotal,
  type PricingFAQ,
} from "@/lib/pricing";

const STAFF_MIN = STAFF_OPTIONS[0];
const STAFF_MAX = STAFF_OPTIONS[STAFF_OPTIONS.length - 1];

function formatUZS(amount: number) {
  return amount.toLocaleString("ru-RU").replace(/,/g, " ");
}

export function PricingSection() {
  const [periodId, setPeriodId] = useState("1m");
  const [staffCount, setStaffCount] = useState(1);
  const [smsPackId, setSmsPackId] = useState("included");
  const [addonIds, setAddonIds] = useState<Set<string>>(new Set(["instagram"]));

  const monthlyTotal = calcTotal({
    staff: staffCount,
    smsPackId,
    addonIds,
  });
  const selectedPeriod =
    BILLING_PERIODS.find((p) => p.id === periodId) ?? BILLING_PERIODS[0];
  const effectiveMonthly =
    Math.floor((monthlyTotal * (1 - selectedPeriod.discount)) / 1000) * 1000;
  const periodTotal = effectiveMonthly * selectedPeriod.months;

  const selectedPack = SMS_PACKS.find((p) => p.id === smsPackId) ?? SMS_PACKS[0];
  const selectedAddons = ADDONS.filter((a) => addonIds.has(a.id));
  const extraStaff = Math.max(0, staffCount - 1);
  const extraStaffSubtotal = extraStaff * PRICE_PER_EXTRA_STAFF;

  const toggleAddon = (id: string) => {
    setAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section id="narxlar" className="mt-24">
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Narxlar
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
          <span className="text-[var(--accent)]">14 kun bepul.</span>{" "}
          <span className="text-gray-500">
            Faqat keraklisi uchun to&apos;lang.
          </span>
        </h2>
      </div>

      {/* Calculator + Summary */}
      <div className="mt-14 grid gap-8 lg:grid-cols-12 lg:gap-10">
        {/* LEFT: Configuration */}
        <div className="space-y-6 lg:col-span-8">
          <p className="text-base text-gray-600 md:text-lg">
            Biznesingiz uchun kerakli imkoniyatlarni tanlang. Hech qanday
            yashirin to&apos;lov yo&apos;q.
          </p>

          {/* Base plan card */}
          <div className="rounded-3xl bg-gray-50 p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Asosiy tarif
                </p>
                <h3 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
                  BOOKUP Standard
                </h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold tracking-tight text-gray-900">
                  {formatUZS(BASE_PRICE)}
                </p>
                <p className="text-xs text-gray-500">UZS / oy</p>
              </div>
            </div>
            <ul className="mt-5 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
              <BaseFeature>1 ta master kiritilgan</BaseFeature>
              <BaseFeature>50 ta SMS / oy</BaseFeature>
              <BaseFeature>Onlayn jadval va bron</BaseFeature>
              <BaseFeature>Telegram bot</BaseFeature>
              <BaseFeature>sizning-biznes.bookup.uz sayti</BaseFeature>
              <BaseFeature>Mijozlar bazasi</BaseFeature>
            </ul>
          </div>

          {/* Masters count */}
          <ConfigSection
            subtitle="Jamoa hajmi"
            title="Masterlar soni"
            // description={`Birinchisi bepul. Har bir qo'shimcha master — ${formatUZS(
            //   PRICE_PER_EXTRA_STAFF,
            // )} UZS / oy`}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1.5">
              <button
                type="button"
                onClick={() =>
                  setStaffCount((c) => Math.max(STAFF_MIN, c - 1))
                }
                disabled={staffCount <= STAFF_MIN}
                aria-label="Bir master kamaytirish"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-100"
              >
                <Minus className="size-5" strokeWidth={2.5} />
              </button>
              <span className="min-w-[3.5rem] text-center text-2xl font-bold tracking-tight text-gray-900 tabular-nums">
                {staffCount}
              </span>
              <button
                type="button"
                onClick={() =>
                  setStaffCount((c) => Math.min(STAFF_MAX, c + 1))
                }
                disabled={staffCount >= STAFF_MAX}
                aria-label="Bir master qo'shish"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
              >
                <Plus className="size-5" strokeWidth={2.5} />
              </button>
            </div>
          </ConfigSection>

          {/* SMS pack */}
          <ConfigSection subtitle="Xabarnomalar" title="SMS paket">
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700">
                SMS quyidagilar uchun ishlatiladi:
              </p>
              <ol className="mt-3 space-y-2 text-sm">
                {[
                  {
                    id: "sms-reminder",
                    text: "Tashrifdan 2 soat oldin avtomatik eslatma",
                  },
                  {
                    id: "reviews",
                    text: "Tashrifdan keyin baho so'rovi",
                  },
                  {
                    id: "loyalty",
                    text: "Chegirma va aksiya xabarlari",
                  },
                ].map((item, idx) => {
                  const enabled = addonIds.has(item.id);
                  return (
                    <li key={item.id} className="flex items-start gap-3">
                      <span
                        className={`min-w-[1.25rem] font-semibold ${
                          enabled
                            ? "text-[var(--accent)]"
                            : "text-gray-400"
                        }`}
                      >
                        {idx + 1}.
                      </span>
                      <span
                        className={
                          enabled ? "text-gray-700" : "text-gray-500"
                        }
                      >
                        {item.text}
                        {!enabled && (
                          <span className="ml-1.5 text-xs text-gray-400">
                            (yoqilganda)
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SMS_PACKS.map((pack) => {
                const isActive = smsPackId === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setSmsPackId(pack.id)}
                    className={`relative flex flex-col items-start gap-1 rounded-2xl border p-5 text-left transition ${
                      isActive
                        ? "border-[var(--accent)] bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute right-4 top-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                        isActive
                          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                          : "border-gray-300 bg-white text-transparent"
                      }`}
                    >
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {pack.totalSms} ta SMS
                    </span>
                    <span
                      className={`text-xs ${
                        isActive ? "text-[var(--accent)]" : "text-gray-500"
                      }`}
                    >
                      {pack.price === 0
                        ? "Bepul"
                        : `+${formatUZS(pack.price)} UZS`}
                    </span>
                  </button>
                );
              })}
            </div>
          </ConfigSection>

          {/* Add-ons */}
          <ConfigSection
            subtitle="Kengaytirish"
            title="Qo'shimcha imkoniyatlar"
            // description="Faqat o'zingizga kerakli imkoniyatlarni tanlang."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {[...ADDONS]
                .sort(
                  (a, b) =>
                    Number(Boolean(b.recommended)) -
                    Number(Boolean(a.recommended)),
                )
                .map((addon) => {
                const selected = addonIds.has(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon.id)}
                    className={`group relative flex flex-col rounded-2xl border p-6 text-left transition ${
                      selected
                        ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-sm shadow-[var(--accent)]/10 ring-1 ring-[var(--accent)]"
                        : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    {addon.recommended && (
                      <span className="absolute right-5 top-5 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                        Tavsiya
                      </span>
                    )}

                    <h4
                      className={`text-base font-bold tracking-tight text-gray-900 ${
                        addon.recommended ? "pr-20" : ""
                      }`}
                    >
                      {addon.name}
                    </h4>
                    <p className="mt-2 grow text-sm leading-relaxed text-gray-600">
                      {addon.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span
                        className={`text-base font-extrabold tracking-tight ${
                          selected ? "text-[var(--accent)]" : "text-gray-900"
                        }`}
                      >
                        +{formatUZS(addon.price)}
                        <span className="ml-1.5 text-xs font-medium text-gray-500">
                          UZS / oy
                        </span>
                      </span>
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                          selected
                            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                            : "border-gray-300 bg-white text-transparent group-hover:border-gray-400"
                        }`}
                      >
                        <Check className="size-4" strokeWidth={3} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </ConfigSection>
        </div>

        {/* RIGHT: Summary (sticky on lg+) */}
        <aside className="lg:col-span-4 lg:sticky lg:top-40 lg:self-start">
          {/* Billing period */}
          <div className="mb-4 flex items-stretch gap-1 rounded-full bg-gray-100 p-1.5">
            {BILLING_PERIODS.map((period) => {
              const isActive = period.id === periodId;
              return (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => setPeriodId(period.id)}
                  className={`flex flex-1 items-center justify-center rounded-full px-2 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {period.label}
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-[var(--accent)]/15 ring-2 ring-[var(--accent)]">
            <div className="p-6 md:p-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                Sizning tarifingiz
              </p>

              <div className="mt-5">
                {selectedPeriod.discount > 0 && (
                  <p className="text-lg font-semibold text-gray-400 line-through decoration-2">
                    {formatUZS(monthlyTotal)} UZS
                  </p>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-[2.5rem]">
                    {formatUZS(effectiveMonthly)}
                  </span>
                  <span className="text-sm font-medium text-gray-500">
                    UZS / oy
                  </span>
                </div>
              </div>
              {selectedPeriod.months > 1 && (
                <p className="mt-2 text-sm text-gray-500">
                  {selectedPeriod.label} uchun {formatUZS(periodTotal)} UZS
                </p>
              )}

              <a
                href="#"
                className="mt-6 flex w-full items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                14 kun bepul boshlash
              </a>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-6 py-5 md:px-7">
              <ul className="space-y-2 text-sm">
                <SummaryRow
                  label={`${staffCount} ta master`}
                  value={`${formatUZS(BASE_PRICE + extraStaffSubtotal)} UZS`}
                />
                {selectedPack.price > 0 && (
                  <SummaryRow
                    label={selectedPack.label}
                    value={`+${formatUZS(selectedPack.price)} UZS`}
                  />
                )}
                <AnimatePresence initial={false}>
                  {selectedAddons.map((a) => (
                    <motion.li
                      key={a.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="truncate text-gray-700">{a.name}</span>
                      <span className="shrink-0 font-medium text-gray-900">
                        +{formatUZS(a.price)} UZS
                      </span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      <PricingFaq />
    </section>
  );
}

function ConfigSection({
  subtitle,
  title,
  description,
  children,
}: {
  subtitle: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-gray-50 p-6 md:p-8">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {subtitle}
        </p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function BaseFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check
        className="mt-0.5 size-4 shrink-0 text-[var(--accent)]"
        strokeWidth={2.5}
      />
      <span>{children}</span>
    </li>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="truncate text-gray-700">{label}</span>
      <span className="shrink-0 font-medium text-gray-900">{value}</span>
    </li>
  );
}

function PricingFaq() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="mt-20 md:mt-24">
      <div className="mx-auto max-w-2xl text-center">
        <h3 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl lg:text-4xl">
          Tez-tez beriladigan{" "}
          <span className="text-gray-500">savollar.</span>
        </h3>
      </div>

      <div className="mt-10 grid gap-3 lg:grid-cols-12 lg:gap-6">
        <FaqColumn
          className="lg:col-span-6"
          subtitle="Narxlar haqida"
          items={PRICING_FAQ}
          groupKey="pricing"
          openKey={openKey}
          setOpenKey={setOpenKey}
        />
        <FaqColumn
          className="lg:col-span-6"
          subtitle="Umumiy savollar"
          items={GENERAL_FAQ}
          groupKey="general"
          openKey={openKey}
          setOpenKey={setOpenKey}
        />
      </div>
    </div>
  );
}

function FaqColumn({
  className,
  subtitle,
  items,
  groupKey,
  openKey,
  setOpenKey,
}: {
  className?: string;
  subtitle: string;
  items: PricingFAQ[];
  groupKey: string;
  openKey: string | null;
  setOpenKey: (key: string | null) => void;
}) {
  return (
    <div className={className}>
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
        {subtitle}
      </p>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => {
          const key = `${groupKey}-${i}`;
          const isOpen = openKey === key;
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-2xl bg-gray-100"
            >
              <button
                type="button"
                onClick={() => setOpenKey(isOpen ? null : key)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left md:px-7 md:py-6"
              >
                <span className="text-base font-semibold tracking-tight text-gray-900 md:text-lg">
                  {item.q}
                </span>
                <Plus
                  className={`size-5 shrink-0 text-gray-500 transition-transform duration-300 ${
                    isOpen ? "rotate-45 text-[var(--accent)]" : ""
                  }`}
                  strokeWidth={2}
                />
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 text-sm leading-relaxed text-gray-600 md:px-7 md:pb-7 md:text-base">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
