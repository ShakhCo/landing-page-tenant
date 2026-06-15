'use client';

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BILLING_PERIODS,
  PLAN_FAQ,
  PLANS,
  planMonthly,
  type BillingPeriod,
  type Plan,
} from "@/lib/pricing";
import { FaqColumn } from "@/components/Pricing";

function formatUZS(amount: number) {
  return amount.toLocaleString("ru-RU").replace(/,/g, " ");
}

// Soft, premium ease (easeOutQuint) used across the price transitions.
const EASE = [0.22, 1, 0.36, 1] as const;
// Shared transition for layout (reflow) animations.
const LAYOUT = { duration: 0.3, ease: EASE } as const;

export function PricingPlans() {
  const [periodId, setPeriodId] = useState("1m");
  const selectedPeriod =
    BILLING_PERIODS.find((p) => p.id === periodId) ?? BILLING_PERIODS[0];

  return (
    <section id="narxlar" className="mt-24">
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Narxlar
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
          <span className="text-[var(--accent)]">14 kun bepul.</span>{" "}
          <span className="text-gray-500">Biznesingizga mos tarifni tanlang.</span>
        </h2>
      </div>

      {/* Billing period toggle — the active pill slides between options */}
      <div className="mt-10 flex justify-center">
        <div className="flex items-stretch gap-1 rounded-full bg-gray-100 p-1.5">
          {BILLING_PERIODS.map((period) => {
            const isActive = period.id === periodId;
            return (
              <button
                key={period.id}
                type="button"
                onClick={() => setPeriodId(period.id)}
                className={`relative flex items-center rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="period-pill"
                    className="absolute inset-0 rounded-full bg-white shadow-sm"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
                <span className="relative z-10">{period.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Plan cards */}
      <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-stretch lg:gap-6">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} period={selectedPeriod} />
        ))}
      </div>

      <PlansFaq />
    </section>
  );
}

function PlansFaq() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="mt-24 md:mt-32">
      <div className="mx-auto max-w-2xl text-center">
        <h3 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl lg:text-4xl">
          Tez-tez beriladigan <span className="text-gray-500">savollar.</span>
        </h3>
      </div>

      <FaqColumn
        className="mx-auto mt-10 max-w-3xl"
        items={PLAN_FAQ}
        groupKey="plans"
        openKey={openKey}
        setOpenKey={setOpenKey}
      />
    </div>
  );
}

function PlanCard({ plan, period }: { plan: Plan; period: BillingPeriod }) {
  const monthly = planMonthly(plan.price, period.discount);
  const hasDiscount = period.discount > 0 && monthly < plan.price;
  const intro = plan.featuresIntro ?? "Tarkibida";

  return (
    <div className="relative flex h-full flex-col rounded-[1.75rem] bg-gray-50 p-8 md:p-10">
      {/* Name + trial pill */}
      <motion.div
        layout="position"
        transition={LAYOUT}
        className="flex items-center gap-3"
      >
        <h3 className="text-2xl font-bold tracking-tight text-gray-900">
          {plan.name}
        </h3>
        <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
          14 kun bepul
        </span>
      </motion.div>

      {/* Price — rows appear/disappear; siblings slide via layout animation */}
      <div className="mt-7">
        {/* Strikethrough original */}
        <AnimatePresence mode="popLayout">
          {hasDiscount && (
            <motion.p
              key="strike"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE, layout: LAYOUT }}
              className="text-base font-semibold text-gray-400 line-through decoration-2"
            >
              UZS {formatUZS(plan.price)}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Big monthly price — cross-fades when the value changes */}
        <motion.div layout transition={LAYOUT} className="relative">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={monthly}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl"
            >
              UZS {formatUZS(monthly)}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Subtitle / period total */}
        <motion.p layout transition={LAYOUT} className="mt-4 text-base text-gray-500">
          {period.months > 1
            ? `${period.label} uchun UZS ${formatUZS(monthly * period.months)}`
            : "oyiga"}
        </motion.p>
      </div>

      {/* Features */}
      <motion.div layout="position" transition={LAYOUT} className="mt-8">
        <p className="text-sm font-semibold text-gray-900">{intro}</p>
        <ul className="mt-4 space-y-3.5 text-[15px] leading-snug text-gray-500">
          {plan.features.map((feature) => (
            <li key={feature.text}>{feature.text}</li>
          ))}
        </ul>
      </motion.div>

      {/* CTA — pinned to the bottom of the card */}
      <div className="mt-auto pt-10">
        <motion.a
          layout
          transition={LAYOUT}
          href="#"
          className="inline-flex w-fit items-center justify-center rounded-full bg-gray-900 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
        >
          Boshlash
        </motion.a>
      </div>
    </div>
  );
}
