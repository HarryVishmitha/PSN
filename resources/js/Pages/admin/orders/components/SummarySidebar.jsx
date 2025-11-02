import { Icon } from '@iconify/react';

const SummarySidebar = ({
    order,
    status,
    setStatus,
    statusNote,
    setStatusNote,
    statusVisibility,
    setStatusVisibility,
    cancellationReason,
    setCancellationReason,
    statusOptions,
    availableStatuses,
    workingGroupId,
    setWorkingGroupId,
    workingGroups,
    shippingMethodId,
    setShippingMethodId,
    shippingMethods,
    discountMode,
    setDiscountMode,
    discountValue,
    setDiscountValue,
    discountAmount,
    taxMode,
    setTaxMode,
    taxValue,
    setTaxValue,
    taxAmount,
    shippingAmount,
    setShippingAmount,
    subtotal,
    grandTotal,
    notes,
    setNotes,
    contact,
    setContact,
    companyName,
    setCompanyName,
    isCompany,
    setIsCompany,
    unlockOrder,
    showUnlockModal,
    setShowUnlockModal,
    unlockReason,
    setUnlockReason,
    unlocking,
}) => {
    const isLocked = order?.is_locked;
    const isPricingLocked = order?.is_pricing_locked;

    // Get status config for current status
    const selectedStatusConfig =
        statusOptions.find((option) => option.value === status) || {};
    const statusRequiresNote = selectedStatusConfig.requires_note || false;

    return (
        <div className="tw-sticky tw-top-6 tw-space-y-6">
            <section className="tw-group tw-space-y-5 tw-rounded-2xl tw-border-2 tw-border-slate-200 tw-bg-gradient-to-br tw-from-white tw-to-slate-50 tw-p-6 tw-shadow-xl tw-transition-all hover:tw-shadow-2xl">
                <div className="tw-flex tw-items-center tw-gap-3 tw-border-b-2 tw-border-slate-200 tw-pb-4">
                    <div className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-xl tw-bg-gradient-to-br tw-from-blue-500 tw-to-purple-600 tw-shadow-lg">
                        <Icon
                            icon="solar:widget-3-bold-duotone"
                            className="tw-text-xl tw-text-white"
                        />
                    </div>
                    <div>
                        <h5 className="tw-text-base tw-font-bold tw-text-slate-900">
                            Status & Assignment
                        </h5>
                        <p className="tw-mt-0.5 tw-text-xs tw-text-slate-600">
                            Workflow control & team management
                        </p>
                    </div>
                </div>
                <div className="tw-space-y-4">
                    <div>
                        <label className="tw-mb-2 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-slate-700">
                            <Icon
                                icon="solar:clipboard-check-bold-duotone"
                                className="tw-text-sm tw-text-blue-600"
                            />
                            Order Status
                            {isLocked && (
                                <span className="tw-ml-auto tw-flex tw-items-center tw-gap-1 tw-rounded-full tw-bg-red-100 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-bold tw-text-red-600">
                                    <Icon
                                        icon="solar:lock-bold"
                                        className="tw-text-xs"
                                    />
                                    LOCKED
                                </span>
                            )}
                        </label>
                        <div className="tw-relative">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="tw-w-full tw-appearance-none tw-rounded-xl tw-border-2 tw-border-slate-200 tw-bg-white tw-px-4 tw-py-3 tw-pr-10 tw-text-sm tw-font-semibold tw-transition-all focus:tw-border-blue-400 focus:tw-ring-4 focus:tw-ring-blue-500/20"
                            >
                                {statusOptions.map((option) => {
                                    const isAvailable = availableStatuses?.some(
                                        (s) => s.value === option.value,
                                    );
                                    const isCurrent = option.value === status;
                                    const isDisabled =
                                        !isAvailable && !isCurrent;

                                    return (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                            disabled={isDisabled}
                                            title={
                                                isDisabled
                                                    ? 'This transition is not allowed from current status'
                                                    : option.label
                                            }
                                        >
                                            {option.label}
                                            {isDisabled
                                                ? ' (Not Available)'
                                                : ''}
                                        </option>
                                    );
                                })}
                            </select>
                            <Icon
                                icon="solar:alt-arrow-down-bold"
                                className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 tw--translate-y-1/2 tw-text-slate-400"
                            />
                        </div>
                        {isLocked && (
                            <button
                                type="button"
                                onClick={() => setShowUnlockModal(true)}
                                disabled={unlocking}
                                className={`tw-mt-2 tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border-2 tw-border-red-200 tw-bg-red-50 tw-px-3 tw-py-2 tw-text-xs tw-font-bold tw-text-red-600 tw-transition-all hover:tw-border-red-300 hover:tw-bg-red-100 ${
                                    unlocking
                                        ? 'tw-cursor-not-allowed tw-opacity-70'
                                        : ''
                                }`}
                            >
                                <Icon
                                    icon="solar:lock-unlocked-bold"
                                    className="tw-text-sm"
                                />
                                {unlocking ? 'Submitting...' : 'Request Unlock'}
                            </button>
                        )}
                        {order?.locked_at && (
                            <div className="tw-mt-2 tw-rounded-lg tw-border-2 tw-border-orange-200 tw-bg-orange-50 tw-p-3">
                                <div className="tw-flex tw-items-start tw-gap-2">
                                    <Icon
                                        icon="solar:info-circle-bold"
                                        className="tw-mt-0.5 tw-text-sm tw-text-orange-600"
                                    />
                                    <div className="tw-text-xs tw-text-orange-700">
                                        <p className="tw-font-bold">
                                            Locked since{' '}
                                            {new Date(
                                                order.locked_at,
                                            ).toLocaleDateString()}
                                        </p>
                                        {order.locked_total && (
                                            <p className="tw-mt-0.5 tw-text-orange-600">
                                                Locked amount:{' '}
                                                {money(order.locked_total)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                        <div>
                            <label className="tw-mb-2 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-slate-700">
                                <Icon
                                    icon="solar:notes-minimalistic-bold-duotone"
                                    className="tw-text-sm tw-text-blue-600"
                                />
                                Status Note
                                <span
                                    className={`tw-ml-auto tw-rounded-full tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-bold tw-normal-case ${
                                        statusRequiresNote
                                            ? 'tw-bg-red-100 tw-text-red-600'
                                            : 'tw-text-slate-400'
                                    }`}
                                >
                                    {statusRequiresNote
                                        ? 'REQUIRED'
                                        : '(Optional)'}
                                </span>
                            </label>
                            <textarea
                                rows={3}
                                value={statusNote}
                                onChange={(e) => setStatusNote(e.target.value)}
                                placeholder={
                                    statusRequiresNote
                                        ? 'Explain how this status was confirmed...'
                                        : 'Add a note about the status change...'
                                }
                                required={statusRequiresNote}
                                className={`tw-w-full tw-rounded-xl tw-border-2 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-transition-all focus:tw-border-blue-400 focus:tw-ring-4 focus:tw-ring-blue-500/20 ${
                                    statusRequiresNote
                                        ? 'tw-placeholder:text-red-300 tw-border-red-300'
                                        : 'tw-placeholder:text-slate-400 tw-border-slate-200'
                                }`}
                            />
                            {statusRequiresNote && (
                                <p className="tw-mt-2 tw-text-[11px] tw-font-medium tw-text-red-600">
                                    <Icon
                                        icon="solar:info-circle-bold"
                                        className="tw-mr-1 tw-inline tw-text-xs"
                                    />
                                    Please include the confirmation method or
                                    customer communication details.
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="tw-mb-2 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-slate-700">
                                <Icon
                                    icon="solar:eye-bold-duotone"
                                    className="tw-text-sm tw-text-blue-600"
                                />
                                Visibility
                            </label>
                            <div className="tw-relative">
                                <select
                                    value={statusVisibility}
                                    onChange={(e) =>
                                        setStatusVisibility(e.target.value)
                                    }
                                    className="tw-w-full tw-appearance-none tw-rounded-xl tw-border-2 tw-border-slate-200 tw-bg-white tw-px-4 tw-py-3 tw-pr-10 tw-text-sm tw-font-semibold tw-transition-all focus:tw-border-blue-400 focus:tw-ring-4 focus:tw-ring-blue-500/20"
                                >
                                    <option value="admin">Internal Only</option>
                                    <option value="customer">
                                        Customer Visible
                                    </option>
                                    <option value="public" selected>
                                        Public
                                    </option>
                                </select>
                                <Icon
                                    icon="solar:alt-arrow-down-bold"
                                    className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 tw--translate-y-1/2 tw-text-slate-400"
                                />
                            </div>
                        </div>
                    </div>
                    {status === 'cancelled' && (
                        <div className="tw-rounded-xl tw-border-2 tw-border-red-200 tw-bg-red-50 tw-p-4">
                            <label className="tw-mb-2 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-red-700">
                                <Icon
                                    icon="solar:close-circle-bold-duotone"
                                    className="tw-text-sm tw-text-red-600"
                                />
                                Cancellation Reason
                                <span className="tw-ml-auto tw-rounded-full tw-bg-red-600 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-bold tw-text-white">
                                    REQUIRED
                                </span>
                            </label>
                            <textarea
                                rows={3}
                                value={cancellationReason}
                                onChange={(e) =>
                                    setCancellationReason(e.target.value)
                                }
                                placeholder="Please explain why this order is being cancelled..."
                                required={status === 'cancelled'}
                                className="tw-placeholder:text-red-300 tw-w-full tw-rounded-xl tw-border-2 tw-border-red-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-red-900 tw-transition-all focus:tw-border-red-400 focus:tw-ring-4 focus:tw-ring-red-500/20"
                            />
                            <p className="tw-mt-2 tw-text-xs tw-text-red-600">
                                <Icon
                                    icon="solar:info-circle-bold"
                                    className="tw-mr-1 tw-inline"
                                />
                                This reason will be recorded in the order
                                history.
                            </p>
                        </div>
                    )}
                    <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                        <div>
                            <label className="tw-mb-2 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-slate-700">
                                <Icon
                                    icon="solar:users-group-two-rounded-bold-duotone"
                                    className="tw-text-sm tw-text-purple-600"
                                />
                                Working Group
                            </label>
                            <div className="tw-relative">
                                <select
                                    value={workingGroupId || ''}
                                    onChange={(e) =>
                                        setWorkingGroupId(e.target.value)
                                    }
                                    className="tw-w-full tw-appearance-none tw-rounded-xl tw-border-2 tw-border-slate-200 tw-bg-white tw-px-4 tw-py-3 tw-pr-10 tw-text-sm tw-font-semibold tw-transition-all focus:tw-border-purple-400 focus:tw-ring-4 focus:tw-ring-purple-500/20"
                                >
                                    <option value="">Unassigned</option>
                                    {workingGroups.map((wg) => (
                                        <option key={wg.id} value={wg.id}>
                                            {wg.name}
                                        </option>
                                    ))}
                                </select>
                                <Icon
                                    icon="solar:alt-arrow-down-bold"
                                    className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 tw--translate-y-1/2 tw-text-slate-400"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="tw-mb-2 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-slate-700">
                                <Icon
                                    icon="solar:delivery-bold-duotone"
                                    className="tw-text-sm tw-text-emerald-600"
                                />
                                Shipping Method
                            </label>
                            <div className="tw-relative">
                                <select
                                    value={shippingMethodId || ''}
                                    onChange={(e) =>
                                        setShippingMethodId(e.target.value)
                                    }
                                    className="tw-w-full tw-appearance-none tw-rounded-xl tw-border-2 tw-border-slate-200 tw-bg-white tw-px-4 tw-py-3 tw-pr-10 tw-text-sm tw-font-semibold tw-transition-all focus:tw-border-emerald-400 focus:tw-ring-4 focus:tw-ring-emerald-500/20"
                                >
                                    <option value="">Not set</option>
                                    {shippingMethods.map((method) => (
                                        <option
                                            key={method.id}
                                            value={method.id}
                                        >
                                            {method.name}
                                            {method.estimated_eta
                                                ? ` • ${method.estimated_eta}`
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                                <Icon
                                    icon="solar:alt-arrow-down-bold"
                                    className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 tw--translate-y-1/2 tw-text-slate-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="tw-group tw-space-y-5 tw-rounded-2xl tw-border-2 tw-border-emerald-200 tw-bg-gradient-to-br tw-from-emerald-50 tw-via-white tw-to-emerald-50 tw-p-6 tw-shadow-xl tw-transition-all hover:tw-shadow-2xl">
                <div className="tw-flex tw-items-center tw-justify-between tw-border-b-2 tw-border-emerald-200 tw-pb-4">
                    <div className="tw-flex tw-items-center tw-gap-3">
                        <div className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-xl tw-bg-gradient-to-br tw-from-emerald-500 tw-to-emerald-600 tw-shadow-lg">
                            <Icon
                                icon="solar:wallet-money-bold-duotone"
                                className="tw-text-xl tw-text-white"
                            />
                        </div>
                        <div>
                            <h5 className="tw-text-base tw-font-bold tw-text-emerald-900">
                                Financial Summary
                                {isPricingLocked && (
                                    <Icon
                                        icon="solar:lock-bold"
                                        className="tw-ml-2 tw-inline tw-text-sm tw-text-red-600"
                                    />
                                )}
                            </h5>
                            <p className="tw-mt-0.5 tw-text-xs tw-text-emerald-700">
                                Pricing & calculations
                                {isPricingLocked && (
                                    <span className="tw-ml-2 tw-text-red-600">
                                        (Locked)
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <span className="tw-rounded-lg tw-bg-emerald-600 tw-px-2 tw-py-1 tw-text-[10px] tw-font-bold tw-uppercase tw-text-white tw-shadow-sm">
                        Live
                    </span>
                </div>
                {isPricingLocked && (
                    <div className="tw-space-y-2">
                        <div className="tw-rounded-lg tw-border-2 tw-border-red-200 tw-bg-red-50 tw-p-3">
                            <div className="tw-flex tw-items-start tw-gap-2">
                                <Icon
                                    icon="solar:lock-password-bold-duotone"
                                    className="tw-mt-0.5 tw-text-base tw-text-red-600"
                                />
                                <div className="tw-text-xs tw-text-red-700">
                                    <p className="tw-font-bold">
                                        Pricing Locked
                                    </p>
                                    <p className="tw-mt-0.5 tw-text-red-600">
                                        Discount, tax, and shipping cannot be
                                        changed. Request unlock below to modify.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowUnlockModal(true)}
                            disabled={unlocking}
                            className={`tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border-2 tw-border-red-200 tw-bg-red-50 tw-px-3 tw-py-2 tw-text-xs tw-font-bold tw-text-red-600 tw-transition-all hover:tw-border-red-300 hover:tw-bg-red-100 ${
                                unlocking
                                    ? 'tw-cursor-not-allowed tw-opacity-70'
                                    : ''
                            }`}
                        >
                            <Icon
                                icon="solar:lock-unlocked-bold"
                                className="tw-text-sm"
                            />
                            {unlocking ? 'Submitting...' : 'Request Unlock'}
                        </button>
                    </div>
                )}
                <div className="tw-space-y-3">
                    <div className="tw-flex tw-items-center tw-justify-between tw-text-sm">
                        <span className="tw-text-slate-500">Subtotal</span>
                        <span className="tw-font-semibold tw-text-slate-900">
                            {money(subtotal)}
                        </span>
                    </div>
                    <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                        <div>
                            <label className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-text-slate-500">
                                Discount
                            </label>
                            <div className="tw-flex tw-gap-2">
                                <select
                                    value={discountMode}
                                    onChange={(e) =>
                                        setDiscountMode(e.target.value)
                                    }
                                    disabled={isPricingLocked}
                                    className="tw-w-1/2 tw-rounded-lg tw-border tw-border-slate-200 tw-px-2 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/40 disabled:tw-cursor-not-allowed disabled:tw-bg-gray-100 disabled:tw-opacity-60"
                                >
                                    <option value="none">None</option>
                                    <option value="fixed">Fixed</option>
                                    <option value="percent">%</option>
                                </select>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={discountValue}
                                    onChange={(e) =>
                                        setDiscountValue(e.target.value)
                                    }
                                    disabled={isPricingLocked}
                                    className="tw-flex-1 tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/40 disabled:tw-cursor-not-allowed disabled:tw-bg-gray-100 disabled:tw-opacity-60"
                                />
                            </div>
                        </div>
                        <div className="tw-flex tw-items-end tw-justify-between">
                            <span className="tw-text-sm tw-text-slate-500">
                                Discount applied
                            </span>
                            <span className="tw-text-sm tw-font-semibold tw-text-slate-900">
                                - {money(discountAmount)}
                            </span>
                        </div>
                    </div>

                    <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                        <div>
                            <label className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-text-slate-500">
                                Tax
                            </label>
                            <div className="tw-flex tw-gap-2">
                                <select
                                    value={taxMode}
                                    onChange={(e) => setTaxMode(e.target.value)}
                                    disabled={isPricingLocked}
                                    className="tw-w-1/2 tw-rounded-lg tw-border tw-border-slate-200 tw-px-2 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/40 disabled:tw-cursor-not-allowed disabled:tw-bg-gray-100 disabled:tw-opacity-60"
                                >
                                    <option value="none">None</option>
                                    <option value="fixed">Fixed</option>
                                    <option value="percent">%</option>
                                </select>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={taxValue}
                                    onChange={(e) =>
                                        setTaxValue(e.target.value)
                                    }
                                    disabled={isPricingLocked}
                                    className="tw-flex-1 tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/40 disabled:tw-cursor-not-allowed disabled:tw-bg-gray-100 disabled:tw-opacity-60"
                                />
                            </div>
                        </div>
                        <div className="tw-flex tw-items-end tw-justify-between">
                            <span className="tw-text-sm tw-text-slate-500">
                                Tax amount
                            </span>
                            <span className="tw-text-sm tw-font-semibold tw-text-slate-900">
                                {money(taxAmount)}
                            </span>
                        </div>
                    </div>

                    <div className="tw-flex tw-items-center tw-justify-between tw-text-sm">
                        <div className="tw-flex tw-flex-1 tw-flex-col tw-pr-3">
                            <span className="tw-text-slate-500">Shipping</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={shippingAmount}
                                onChange={(e) =>
                                    setShippingAmount(e.target.value)
                                }
                                disabled={isPricingLocked}
                                className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/40 disabled:tw-cursor-not-allowed disabled:tw-bg-gray-100 disabled:tw-opacity-60"
                            />
                        </div>
                        <span className="tw-font-semibold tw-text-slate-900">
                            {money(shippingAmount)}
                        </span>
                    </div>

                    <div className="tw--mx-2 tw-mt-2 tw-flex tw-items-center tw-justify-between tw-rounded-xl tw-border-t-2 tw-border-emerald-300 tw-bg-gradient-to-r tw-from-emerald-100 tw-to-emerald-50 tw-px-4 tw-py-4">
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <Icon
                                icon="solar:calculator-minimalistic-bold-duotone"
                                className="tw-text-2xl tw-text-emerald-700"
                            />
                            <span className="tw-text-base tw-font-bold tw-uppercase tw-tracking-wide tw-text-emerald-900">
                                Grand Total
                            </span>
                        </div>
                        <span className="tw-text-2xl tw-font-extrabold tw-text-emerald-900 tw-drop-shadow-sm">
                            {money(grandTotal)}
                        </span>
                    </div>
                </div>
            </section>

            <section className="tw-group tw-space-y-5 tw-rounded-2xl tw-border-2 tw-border-blue-200 tw-bg-gradient-to-br tw-from-blue-50 tw-via-white tw-to-purple-50 tw-p-6 tw-shadow-xl tw-transition-all hover:tw-shadow-2xl">
                <div className="tw-flex tw-items-center tw-justify-between tw-border-b-2 tw-border-blue-200 tw-pb-4">
                    <div className="tw-flex tw-items-center tw-gap-3">
                        <div className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-xl tw-bg-gradient-to-br tw-from-blue-500 tw-to-purple-600 tw-shadow-lg">
                            <Icon
                                icon="solar:user-id-bold-duotone"
                                className="tw-text-xl tw-text-white"
                            />
                        </div>
                        <div>
                            <h5 className="tw-text-base tw-font-bold tw-text-blue-900">
                                Customer & Contact
                            </h5>
                            <p className="tw-mt-0.5 tw-text-xs tw-text-blue-700">
                                Contact information
                            </p>
                        </div>
                    </div>
                    <label className="tw-group/check tw-flex tw-cursor-pointer tw-items-center tw-gap-2">
                        <input
                            type="checkbox"
                            checked={isCompany}
                            onChange={(e) => setIsCompany(e.target.checked)}
                            className="tw-h-5 tw-w-5 tw-rounded-lg tw-border-2 tw-border-blue-300 tw-text-blue-600 tw-transition-all focus:tw-ring-2 focus:tw-ring-blue-500/50"
                        />
                        <span className="tw-text-xs tw-font-bold tw-text-blue-700 group-hover/check:tw-text-blue-900">
                            Company
                        </span>
                    </label>
                </div>
                {isCompany && (
                    <div>
                        <label className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-text-slate-500">
                            Company name
                        </label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/40"
                        />
                    </div>
                )}

                <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                    <div>
                        <label className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-text-slate-500">
                            First name
                        </label>
                        <input
                            type="text"
                            value={contact.first_name}
                            onChange={(e) =>
                                setContact((prev) => ({
                                    ...prev,
                                    first_name: e.target.value,
                                }))
                            }
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/40"
                        />
                    </div>
                    <div>
                        <label className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-text-slate-500">
                            Last name
                        </label>
                        <input
                            type="text"
                            value={contact.last_name}
                            onChange={(e) =>
                                setContact((prev) => ({
                                    ...prev,
                                    last_name: e.target.value,
                                }))
                            }
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/40"
                        />
                    </div>
                </div>

                <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                    <div>
                        <label className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-text-slate-500">
                            Email
                        </label>
                        <input
                            type="email"
                            value={contact.email}
                            onChange={(e) =>
                                setContact((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                }))
                            }
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/40"
                        />
                    </div>
                    <div>
                        <label className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-text-slate-500">
                            Phone
                        </label>
                        <input
                            type="text"
                            value={contact.phone}
                            onChange={(e) =>
                                setContact((prev) => ({
                                    ...prev,
                                    phone: e.target.value,
                                }))
                            }
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/40"
                        />
                    </div>
                </div>

                <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                    <div>
                        <label className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-text-slate-500">
                            WhatsApp
                        </label>
                        <input
                            type="text"
                            value={contact.whatsapp}
                            onChange={(e) =>
                                setContact((prev) => ({
                                    ...prev,
                                    whatsapp: e.target.value,
                                }))
                            }
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/40"
                        />
                    </div>
                    <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                        <div>
                            <label className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-text-slate-500">
                                Alt phone 1
                            </label>
                            <input
                                type="text"
                                value={contact.phone_alt_1}
                                onChange={(e) =>
                                    setContact((prev) => ({
                                        ...prev,
                                        phone_alt_1: e.target.value,
                                    }))
                                }
                                className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/40"
                            />
                        </div>
                        <div>
                            <label className="tw-mb-1 tw-block tw-text-xs tw-font-semibold tw-text-slate-500">
                                Alt phone 2
                            </label>
                            <input
                                type="text"
                                value={contact.phone_alt_2}
                                onChange={(e) =>
                                    setContact((prev) => ({
                                        ...prev,
                                        phone_alt_2: e.target.value,
                                    }))
                                }
                                className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-border-slate-400 focus:tw-ring-2 focus:tw-ring-slate-500/40"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="tw-group tw-space-y-5 tw-rounded-2xl tw-border-2 tw-border-amber-200 tw-bg-gradient-to-br tw-from-amber-50 tw-via-white tw-to-yellow-50 tw-p-6 tw-shadow-xl tw-transition-all hover:tw-shadow-2xl">
                <div className="tw-flex tw-items-center tw-gap-3 tw-border-b-2 tw-border-amber-200 tw-pb-4">
                    <div className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-xl tw-bg-gradient-to-br tw-from-amber-500 tw-to-orange-600 tw-shadow-lg">
                        <Icon
                            icon="solar:notes-bold-duotone"
                            className="tw-text-xl tw-text-white"
                        />
                    </div>
                    <div>
                        <h5 className="tw-text-base tw-font-bold tw-text-amber-900">
                            Internal Notes
                        </h5>
                        <p className="tw-mt-0.5 tw-text-xs tw-text-amber-700">
                            <Icon
                                icon="solar:lock-keyhole-bold-duotone"
                                className="tw-mr-1 tw-inline"
                            />
                            Admin-only visibility
                        </p>
                    </div>
                </div>
                <div className="tw-relative">
                    <textarea
                        rows={6}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add private notes, production details, special instructions..."
                        className="tw-placeholder:text-slate-400 tw-w-full tw-rounded-xl tw-border-2 tw-border-amber-200 tw-bg-white tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-transition-all focus:tw-border-amber-400 focus:tw-ring-4 focus:tw-ring-amber-500/20"
                    />
                    <div className="tw-absolute tw-bottom-3 tw-right-3 tw-text-xs tw-font-semibold tw-text-slate-400">
                        {notes.length} characters
                    </div>
                </div>
            </section>

            {/* Unlock Modal */}
            {showUnlockModal && (
                <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-bg-black/50 tw-p-4">
                    <div className="tw-w-full tw-max-w-md tw-rounded-2xl tw-border-2 tw-border-red-200 tw-bg-white tw-p-6 tw-shadow-2xl">
                        <div className="tw-mb-4 tw-flex tw-items-center tw-gap-3">
                            <div className="tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-xl tw-bg-gradient-to-br tw-from-red-500 tw-to-orange-600 tw-shadow-lg">
                                <Icon
                                    icon="solar:lock-unlocked-bold"
                                    className="tw-text-2xl tw-text-white"
                                />
                            </div>
                            <div>
                                <h3 className="tw-text-lg tw-font-bold tw-text-slate-900">
                                    Unlock Order
                                </h3>
                                <p className="tw-text-sm tw-text-slate-600">
                                    Provide a reason for unlocking
                                </p>
                            </div>
                        </div>

                        <div className="tw-mb-4">
                            <label className="tw-mb-2 tw-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-slate-700">
                                <Icon
                                    icon="solar:document-text-bold-duotone"
                                    className="tw-text-sm tw-text-red-600"
                                />
                                Unlock Reason
                                <span className="tw-ml-auto tw-rounded-full tw-bg-red-600 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-bold tw-text-white">
                                    REQUIRED
                                </span>
                            </label>
                            <textarea
                                rows={4}
                                value={unlockReason}
                                onChange={(e) =>
                                    setUnlockReason(e.target.value)
                                }
                                placeholder="Explain why this order needs to be unlocked (e.g., customer requested changes, pricing error, etc.)"
                                className="tw-placeholder:text-slate-400 tw-w-full tw-rounded-xl tw-border-2 tw-border-slate-200 tw-bg-white tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-transition-all focus:tw-border-red-400 focus:tw-ring-4 focus:tw-ring-red-500/20"
                                autoFocus
                            />
                            <p className="tw-mt-2 tw-text-xs tw-text-slate-600">
                                <Icon
                                    icon="solar:danger-circle-bold"
                                    className="tw-mr-1 tw-inline tw-text-amber-500"
                                />
                                This action will be logged and visible to
                                administrators.
                            </p>
                        </div>

                        <div className="tw-flex tw-gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowUnlockModal(false);
                                    setUnlockReason('');
                                }}
                                disabled={unlocking}
                                className="tw-flex-1 tw-rounded-xl tw-border-2 tw-border-slate-200 tw-bg-white tw-px-4 tw-py-3 tw-text-sm tw-font-bold tw-text-slate-700 tw-transition-all hover:tw-border-slate-300 hover:tw-bg-slate-50 disabled:tw-opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={unlockOrder}
                                disabled={
                                    unlocking ||
                                    !unlockReason.trim() ||
                                    unlockReason.trim().length < 10
                                }
                                className="tw-flex tw-flex-1 tw-items-center tw-justify-center tw-gap-2 tw-rounded-xl tw-border-2 tw-border-red-600 tw-bg-gradient-to-br tw-from-red-500 tw-to-orange-600 tw-px-4 tw-py-3 tw-text-sm tw-font-bold tw-text-white tw-shadow-lg tw-transition-all hover:tw-from-red-600 hover:tw-to-orange-700 disabled:tw-opacity-50"
                            >
                                {unlocking ? (
                                    <>
                                        <Icon
                                            icon="solar:refresh-bold"
                                            className="tw-animate-spin"
                                        />
                                        Unlocking...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="solar:lock-unlocked-bold" />
                                        Unlock Order
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const money = (value) => {
    const amount = Number(value || 0);
    return `LKR ${amount.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

export default SummarySidebar;
