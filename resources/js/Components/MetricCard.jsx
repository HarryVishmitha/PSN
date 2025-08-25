import React from "react";
import { Icon } from "@iconify/react";

/**
 * Hybrid card with gradients + dark mode:
 * - Bootstrap structure (card, card-body)
 * - Tailwind visuals (tw-*)
 *
 * Props:
 *  label, value, icon, tone ("cyan"|"violet"|"amber"|"teal"|"rose"|"slate")
 *  subtitle, delta: { value, dir: "up"|"down" }, rightNode, loading, gradient (bool)
 */

const TONES = {
  cyan: {
    chip: "tw-bg-cyan-500",
    text: "tw-text-cyan-400",
    // Light/Dark gradient layers
    grad: "tw-from-cyan-500/10 tw-via-cyan-400/5 tw-to-transparent dark:tw-from-cyan-400/15 dark:tw-via-cyan-300/10 dark:tw-to-transparent",
    ring: "tw-ring-cyan-400/30",
    spark: "tw-text-cyan-300",
  },
  violet: {
    chip: "tw-bg-violet-500",
    text: "tw-text-violet-400",
    grad: "tw-from-violet-500/10 tw-via-violet-400/5 tw-to-transparent dark:tw-from-violet-400/15 dark:tw-via-violet-300/10 dark:tw-to-transparent",
    ring: "tw-ring-violet-400/30",
    spark: "tw-text-violet-300",
  },
  amber: {
    chip: "tw-bg-amber-500",
    text: "tw-text-amber-400",
    grad: "tw-from-amber-500/10 tw-via-amber-400/5 tw-to-transparent dark:tw-from-amber-400/15 dark:tw-via-amber-300/10 dark:tw-to-transparent",
    ring: "tw-ring-amber-400/30",
    spark: "tw-text-amber-300",
  },
  teal: {
    chip: "tw-bg-teal-500",
    text: "tw-text-teal-400",
    grad: "tw-from-teal-500/10 tw-via-teal-400/5 tw-to-transparent dark:tw-from-teal-400/15 dark:tw-via-teal-300/10 dark:tw-to-transparent",
    ring: "tw-ring-teal-400/30",
    spark: "tw-text-teal-300",
  },
  rose: {
    chip: "tw-bg-rose-500",
    text: "tw-text-rose-400",
    grad: "tw-from-rose-500/10 tw-via-rose-400/5 tw-to-transparent dark:tw-from-rose-400/15 dark:tw-via-rose-300/10 dark:tw-to-transparent",
    ring: "tw-ring-rose-400/30",
    spark: "tw-text-rose-300",
  },
  slate: {
    chip: "tw-bg-slate-500",
    text: "tw-text-slate-300",
    grad: "tw-from-slate-500/10 tw-via-slate-400/5 tw-to-transparent dark:tw-from-slate-300/10 dark:tw-via-slate-200/5 dark:tw-to-transparent",
    ring: "tw-ring-slate-300/20",
    spark: "tw-text-slate-300",
  },
};

const TinySpark = ({ points = [], className = "" }) => {
  const max = Math.max(1, ...points);
  const svgPoints =
    points.length > 1
      ? points.map((v, i) => `${(i / (points.length - 1)) * 100},${100 - (v / max) * 100}`).join(" ")
      : `0,100 100,100`;
  return (
    <svg
      viewBox="0 0 100 100"
      width="120"
      height="40"
      preserveAspectRatio="none"
      className={className}
    >
      <polyline fill="none" stroke="currentColor" strokeWidth="3" points={svgPoints} />
    </svg>
  );
};

export default function MetricCard({
  label,
  value,
  icon = "mdi:counter",
  tone = "slate",
  subtitle,
  delta,
  rightNode,
  loading = false,
  gradient = true,
}) {
  const t = TONES[tone] ?? TONES.slate;

  return (
    <div
      className={[
        "card shadow-none border tw-rounded-2xl tw-transition",
        // base surface colors
        "tw-bg-white tw-border tw-border-gray-200 dark:tw-bg-[#0a0f1a] dark:tw-border-gray-800",
        // subtle elevation
        "tw-shadow-sm hover:tw-shadow-md",
        // ring accent on hover/focus
        "hover:tw-ring hover:tw-ring-1",
        t.ring,
        "tw-relative tw-overflow-hidden",
      ].join(" ")}
    >
      {/* Gradient overlay (doesn't block content) */}
      {gradient && (
        <div
          className={[
            "tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-br",
            t.grad,
          ].join(" ")}
        />
      )}

      {/* Soft corner glow */}
      {gradient && (
        <div className="tw-pointer-events-none tw-absolute -tw-top-24 -tw-right-20 tw-w-72 tw-h-72 tw-rounded-full tw-bg-white/5 dark:tw-bg-white/2 tw-blur-3xl" />
      )}

      <div className="card-body p-20 tw-p-5">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2 tw-gap-3">
            <span
              className={[
                t.chip,
                "tw-w-12 tw-h-12 tw-rounded-full tw-flex tw-justify-center tw-items-center tw-text-white",
                "tw-shadow-inner tw-shadow-black/10",
              ].join(" ")}
            >
              <Icon icon={icon} className="tw-text-2xl" />
            </span>

            <div>
              <p className="fw-medium text-body-secondary tw-text-sm tw-font-medium tw-text-gray-500 dark:tw-text-gray-400 tw-mb-1 mb-1">
                {label}
              </p>

              {loading ? (
                <div className="placeholder-glow tw-animate-pulse">
                  <span className="placeholder col-6 tw-h-5 tw-bg-gray-200 dark:tw-bg-gray-700 tw-rounded d-block" />
                </div>
              ) : (
                <h3 className="tw-text-xl tw-font-semibold tw-text-gray-900 dark:tw-text-gray-50 tw-mb-0 mb-0">
                  {value ?? "-"}
                </h3>
              )}
            </div>
          </div>

          <div className={["tw-hidden sm:tw-block", t.spark].join(" ")}>
            {/* default spark if rightNode not provided */}
            {rightNode ?? <TinySpark className={t.spark} points={[]} />}
          </div>
        </div>

        {/* Footer */}
        <div className="d-flex align-items-center justify-content-between mt-3 tw-mt-4">
          <span className="tw-text-xs tw-text-gray-400 dark:tw-text-gray-500">{subtitle}</span>

          {delta && !loading && (
            <span
              className={[
                "badge tw-inline-flex tw-items-center tw-text-xs tw-font-medium tw-rounded-full tw-px-2 tw-py-1",
                delta.dir === "up"
                  ? "bg-success-subtle text-success-emphasis tw-bg-green-100 tw-text-green-700 dark:tw-bg-green-900/30 dark:tw-text-green-300"
                  : "bg-danger-subtle text-danger-emphasis tw-bg-red-100 tw-text-red-700 dark:tw-bg-red-900/30 dark:tw-text-red-300",
              ].join(" ")}
            >
              <Icon
                icon={delta.dir === "up" ? "mdi:trending-up" : "mdi:trending-down"}
                className="me-1 tw-mr-1"
              />
              {Math.abs(delta.value)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
