// resources/js/Components/ui/FormControls.jsx
import React from "react";
import clsx from "clsx";

export function Field({
  label,
  required = false,
  error,
  hint,
  className,
  children,
}) {
  return (
    <div className={clsx("tw-space-y-1", className)}>
      {label && (
        <label className="tw-text-sm tw-font-medium tw-text-gray-800">
          {label} {required && <span className="tw-text-rose-600">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="tw-text-[12px] tw-text-rose-600">{error}</p>
      ) : hint ? (
        <p className="tw-text-[12px] tw-text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

const baseInput =
  "tw-w-full tw-rounded-xl tw-border tw-bg-white tw-text-[15px] tw-leading-6 tw-px-3.5 tw-py-2.5 " +
  "tw-border-gray-300 focus:tw-outline-none focus:tw-border-[#f44032] focus:tw-ring-4 focus:tw-ring-[#f44032]/15 " +
  "placeholder:tw-text-gray-400 disabled:tw-opacity-60";

export function Input({ error, className, ...props }) {
  return (
    <input
      {...props}
      className={clsx(
        baseInput,
        error && "tw-border-rose-500 focus:tw-ring-rose-200",
        className
      )}
      aria-invalid={!!error}
    />
  );
}

export function Textarea({ error, className, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      {...props}
      className={clsx(
        baseInput,
        "tw-min-h-[44px]",
        error && "tw-border-rose-500 focus:tw-ring-rose-200",
        className
      )}
      aria-invalid={!!error}
    />
  );
}

export function Select({ error, className, children, ...props }) {
  return (
    <select
      {...props}
      className={clsx(
        baseInput,
        "tw-pr-10",
        error && "tw-border-rose-500 focus:tw-ring-rose-200",
        className
      )}
      aria-invalid={!!error}
    >
      {children}
    </select>
  );
}

export function Checkbox({ label, className, ...props }) {
  return (
    <label className={clsx("tw-flex tw-items-center tw-gap-3", className)}>
      <input
        type="checkbox"
        {...props}
        className="tw-h-5 tw-w-5 tw-rounded tw-border-gray-300 focus:tw-ring-[#f44032] tw-text-[#f44032]"
      />
      <span className="tw-text-[15px] tw-text-gray-800">{label}</span>
    </label>
  );
}

export function SectionTitle({ children }) {
  return (
    <div className="tw-text-xl tw-font-semibold tw-text-gray-900">{children}</div>
  );
}

export function Card({ children, className }) {
  return (
    <div className={clsx("tw-bg-white tw-rounded-2xl tw-border tw-border-gray-200 tw-p-4", className)}>
      {children}
    </div>
  );
}
