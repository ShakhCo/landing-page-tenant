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
          <span className="text-gray-900">Biznesingizga mos tarifni tanlang.</span>
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
          Tez-tez beriladigan <span className="text-gray-900">savollar.</span>
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
  const dark = !!plan.dark;

  // Premium dark variant keeps the same layout with inverted colours.
  const t = {
    card: dark ? "bg-gray-900" : "bg-gray-50",
    name: dark ? "text-white" : "text-gray-900",
    pill: dark
      ? "bg-white/10 text-[var(--accent)]"
      : "bg-[var(--accent)]/10 text-[var(--accent)]",
    price: dark ? "text-white" : "text-gray-900",
    sub: dark ? "text-gray-400" : "text-gray-500",
    strike: dark ? "text-gray-500" : "text-gray-400",
    heading: dark ? "text-white" : "text-gray-900",
    features: dark ? "text-gray-400" : "text-gray-500",
    cta: dark
      ? "bg-white text-gray-900 hover:bg-gray-100"
      : "bg-gray-900 text-white hover:bg-gray-800",
  };

  return (
    <div
      className={`relative flex h-full flex-col rounded-[1.75rem] p-8 md:p-10 ${t.card}`}
    >
      {/* Name (+ trial pill for priced plans) */}
      <motion.div
        layout="position"
        transition={LAYOUT}
        className="flex items-center gap-3"
      >
        <h3 className={`text-2xl font-bold tracking-tight ${t.name}`}>
          {plan.name}
        </h3>
        {!plan.custom && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${t.pill}`}>
            14 kun bepul
          </span>
        )}
      </motion.div>

      {plan.custom ? (
        /* Custom headline (contact-sales tier) */
        <p className={`mt-7 text-3xl font-extrabold tracking-tight md:text-4xl ${t.price}`}>
          {plan.priceLabel}
        </p>
      ) : (
        /* Price — rows appear/disappear; siblings slide via layout animation */
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
                className={`text-base font-normal line-through decoration-1 ${t.strike}`}
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
                className={`text-3xl font-extrabold tracking-tight md:text-4xl ${t.price}`}
              >
                UZS {formatUZS(monthly)}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Subtitle */}
          <motion.p layout transition={LAYOUT} className={`mt-4 text-base ${t.sub}`}>
            {plan.perMember ? "har bir a'zo uchun oyiga" : "bir oyga"}
            {plan.minMembers ? ` · kamida ${plan.minMembers} ta a'zo` : ""}
          </motion.p>
        </div>
      )}

      {/* Features */}
      {plan.features.length > 0 && (
        <motion.div layout="position" transition={LAYOUT} className="mt-8">
          <p className={`text-sm font-semibold ${t.heading}`}>{intro}</p>
          <ul className={`mt-4 space-y-2.5 text-sm leading-snug ${t.features}`}>
            {plan.features.map((feature) => (
              <li key={feature.text}>{feature.text}</li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* CTA — pinned to the bottom of the card */}
      <div className="mt-auto pt-10">
        <motion.a
          layout
          transition={LAYOUT}
          href="#"
          className={`inline-flex w-fit items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold transition-colors ${t.cta}`}
        >
          {plan.custom ? "Bog'lanish" : "Boshlash"}
        </motion.a>
      </div>
    </div>
  );
}
