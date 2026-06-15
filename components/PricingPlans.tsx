'use client';

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
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
      <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-start lg:gap-6">
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
  const dark = !!plan.dark;

  // Per-tier text colours so the dark (premium) card stays legible.
  const t = {
    name: dark ? "text-white" : "text-gray-900",
    tagline: dark ? "text-gray-400" : "text-gray-500",
    price: dark ? "text-white" : "text-gray-900",
    muted: dark ? "text-gray-400" : "text-gray-500",
    strike: dark ? "text-gray-500" : "text-gray-400",
    intro: dark ? "text-gray-400" : "text-gray-500",
    features: dark ? "text-gray-300" : "text-gray-700",
    check: dark ? "text-gray-500" : "text-gray-400",
    featureOn: dark ? "font-semibold text-white" : "font-semibold text-gray-900",
  };

  return (
    <div
      className={`relative flex h-full flex-col rounded-3xl p-7 md:p-8 ${
        plan.highlighted
          ? "bg-[var(--accent)]/[0.07] shadow-xl shadow-[var(--accent)]/15 ring-2 ring-[var(--accent)] lg:-mt-4 lg:pb-12"
          : dark
            ? "bg-gray-900 shadow-xl shadow-gray-900/20"
            : "bg-gray-100"
      }`}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
          {plan.badge}
        </span>
      )}

      {/* Name + tagline */}
      <motion.div layout="position" transition={LAYOUT}>
        <h3 className={`text-2xl font-bold tracking-tight ${t.name}`}>
          {plan.name}
        </h3>
        <p className={`mt-1 text-sm ${t.tagline}`}>{plan.tagline}</p>
      </motion.div>

      {/* Price — rows appear/disappear; siblings slide via layout animation */}
      <div className="mt-6">
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
              className={`text-base font-semibold line-through decoration-2 ${t.strike}`}
            >
              {formatUZS(plan.price)} UZS
            </motion.p>
          )}
        </AnimatePresence>

        {/* Big monthly price — cross-fades when the value changes */}
        <motion.div layout transition={LAYOUT} className="flex items-baseline gap-2">
          <span className="relative inline-block">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={monthly}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: EASE }}
                className={`block text-4xl font-extrabold tracking-tight ${t.price}`}
              >
                {formatUZS(monthly)}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className={`text-sm font-medium ${t.muted}`}>UZS / oy</span>
        </motion.div>

        {/* Period total */}
        <AnimatePresence mode="popLayout">
          {period.months > 1 && (
            <motion.p
              key={period.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE, layout: LAYOUT }}
              className={`mt-2 text-sm ${t.muted}`}
            >
              {period.label} uchun {formatUZS(monthly * period.months)} UZS
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* CTA */}
      <motion.a
        layout
        transition={LAYOUT}
        href="#"
        className={`mt-6 flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold ${
          plan.highlighted
            ? "bg-[var(--accent)] text-white hover:brightness-110"
            : dark
              ? "bg-white text-gray-900 hover:brightness-95"
              : "border border-gray-300 bg-white text-gray-900 hover:border-gray-400"
        }`}
      >
        14 kun bepul boshlash
      </motion.a>

      {/* Features */}
      <motion.div layout="position" transition={LAYOUT} className="mt-7">
        {plan.featuresIntro && (
          <p className={`text-xs font-semibold uppercase tracking-wider ${t.intro}`}>
            {plan.featuresIntro}
          </p>
        )}
        <ul className={`mt-4 space-y-3 text-sm ${t.features}`}>
          {plan.features.map((feature) => (
            <li key={feature.text} className="flex items-start gap-2.5">
              <Check
                className={`mt-0.5 size-4 shrink-0 ${
                  feature.highlight ? "text-[var(--accent)]" : t.check
                }`}
                strokeWidth={2.5}
              />
              <span
                className={feature.highlight ? t.featureOn : ""}
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
