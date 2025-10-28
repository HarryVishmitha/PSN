import React from 'react';

const SummarySidebar = ({
    status,
    setStatus,
    statusNote,
    setStatusNote,
    statusVisibility,
    setStatusVisibility,
    statusOptions,
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
}) => (
    <div className="tw-space-y-6">
        <section className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm tw-p-5 tw-space-y-4">
            <div>
                <h3 className="tw-text-sm tw-font-semibold tw-text-slate-900">Status &amp; assignment</h3>
                <p className="tw-text-xs tw-text-slate-500 tw-mt-1">
                    Control workflow stage, visibility and working group ownership.
                </p>
            </div>
            <div className="tw-space-y-3">
                <div>
                    <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
                <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                    <div>
                        <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">
                            Status note
                        </label>
                        <textarea
                            rows={3}
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                        />
                    </div>
                    <div>
                        <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Visibility</label>
                        <select
                            value={statusVisibility}
                            onChange={(e) => setStatusVisibility(e.target.value)}
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                        >
                            <option value="admin">Internal</option>
                            <option value="customer">Customer</option>
                            <option value="public">Public</option>
                        </select>
                    </div>
                </div>
                <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                    <div>
                        <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Working group</label>
                        <select
                            value={workingGroupId || ''}
                            onChange={(e) => setWorkingGroupId(e.target.value)}
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                        >
                            <option value="">Unassigned</option>
                            {workingGroups.map((wg) => (
                                <option key={wg.id} value={wg.id}>{wg.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Shipping method</label>
                        <select
                            value={shippingMethodId || ''}
                            onChange={(e) => setShippingMethodId(e.target.value)}
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                        >
                            <option value="">Not set</option>
                            {shippingMethods.map((method) => (
                                <option key={method.id} value={method.id}>
                                    {method.name}{method.estimated_eta ? ` • ${method.estimated_eta}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </section>

        <section className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm tw-p-5 tw-space-y-4">
            <div className="tw-flex tw-items-center tw-justify-between">
                <h3 className="tw-text-sm tw-font-semibold tw-text-slate-900">Financial summary</h3>
                <span className="tw-text-xs tw-text-slate-400">Server totals refresh on save</span>
            </div>
            <div className="tw-space-y-3">
                <div className="tw-flex tw-items-center tw-justify-between tw-text-sm">
                    <span className="tw-text-slate-500">Subtotal</span>
                    <span className="tw-font-semibold tw-text-slate-900">{money(subtotal)}</span>
                </div>
                <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                    <div>
                        <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Discount</label>
                        <div className="tw-flex tw-gap-2">
                            <select
                                value={discountMode}
                                onChange={(e) => setDiscountMode(e.target.value)}
                                className="tw-w-1/2 tw-rounded-lg tw-border tw-border-slate-200 tw-px-2 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
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
                                onChange={(e) => setDiscountValue(e.target.value)}
                                className="tw-flex-1 tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                            />
                        </div>
                    </div>
                    <div className="tw-flex tw-items-end tw-justify-between">
                        <span className="tw-text-sm tw-text-slate-500">Discount applied</span>
                        <span className="tw-text-sm tw-font-semibold tw-text-slate-900">- {money(discountAmount)}</span>
                    </div>
                </div>

                <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                    <div>
                        <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Tax</label>
                        <div className="tw-flex tw-gap-2">
                            <select
                                value={taxMode}
                                onChange={(e) => setTaxMode(e.target.value)}
                                className="tw-w-1/2 tw-rounded-lg tw-border tw-border-slate-200 tw-px-2 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
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
                                onChange={(e) => setTaxValue(e.target.value)}
                                className="tw-flex-1 tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                            />
                        </div>
                    </div>
                    <div className="tw-flex tw-items-end tw-justify-between">
                        <span className="tw-text-sm tw-text-slate-500">Tax amount</span>
                        <span className="tw-text-sm tw-font-semibold tw-text-slate-900">{money(taxAmount)}</span>
                    </div>
                </div>

                <div className="tw-flex tw-items-center tw-justify-between tw-text-sm">
                    <div className="tw-flex tw-flex-col tw-flex-1 tw-pr-3">
                        <span className="tw-text-slate-500">Shipping</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={shippingAmount}
                            onChange={(e) => setShippingAmount(e.target.value)}
                            className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                        />
                    </div>
                    <span className="tw-font-semibold tw-text-slate-900">{money(shippingAmount)}</span>
                </div>

                <div className="tw-flex tw-items-center tw-justify-between tw-border-t tw-border-slate-200 tw-pt-3">
                    <span className="tw-text-base tw-font-semibold tw-text-slate-500">Grand total</span>
                    <span className="tw-text-xl tw-font-semibold tw-text-slate-900">{money(grandTotal)}</span>
                </div>
            </div>
        </section>

        <section className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm tw-p-5 tw-space-y-4">
            <div className="tw-flex tw-items-center tw-justify-between">
                <h3 className="tw-text-sm tw-font-semibold tw-text-slate-900">Customer &amp; contact</h3>
                <label className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-slate-500">
                    <input
                        type="checkbox"
                        checked={isCompany}
                        onChange={(e) => setIsCompany(e.target.checked)}
                        className="tw-rounded tw-border tw-border-slate-300"
                    />
                    Company order
                </label>
            </div>
            {isCompany && (
                <div>
                    <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Company name</label>
                    <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                    />
                </div>
            )}

            <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                <div>
                    <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">First name</label>
                    <input
                        type="text"
                        value={contact.first_name}
                        onChange={(e) => setContact((prev) => ({ ...prev, first_name: e.target.value }))}
                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                    />
                </div>
                <div>
                    <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Last name</label>
                    <input
                        type="text"
                        value={contact.last_name}
                        onChange={(e) => setContact((prev) => ({ ...prev, last_name: e.target.value }))}
                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                    />
                </div>
            </div>

            <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                <div>
                    <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Email</label>
                    <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => setContact((prev) => ({ ...prev, email: e.target.value }))}
                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                    />
                </div>
                <div>
                    <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Phone</label>
                    <input
                        type="text"
                        value={contact.phone}
                        onChange={(e) => setContact((prev) => ({ ...prev, phone: e.target.value }))}
                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                    />
                </div>
            </div>

            <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                <div>
                    <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">WhatsApp</label>
                    <input
                        type="text"
                        value={contact.whatsapp}
                        onChange={(e) => setContact((prev) => ({ ...prev, whatsapp: e.target.value }))}
                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                    />
                </div>
                <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                    <div>
                        <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Alt phone 1</label>
                        <input
                            type="text"
                            value={contact.phone_alt_1}
                            onChange={(e) => setContact((prev) => ({ ...prev, phone_alt_1: e.target.value }))}
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                        />
                    </div>
                    <div>
                        <label className="tw-text-xs tw-font-semibold tw-text-slate-500 tw-block tw-mb-1">Alt phone 2</label>
                        <input
                            type="text"
                            value={contact.phone_alt_2}
                            onChange={(e) => setContact((prev) => ({ ...prev, phone_alt_2: e.target.value }))}
                            className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
                        />
                    </div>
                </div>
            </div>
        </section>

        <section className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm tw-p-5 tw-space-y-4">
            <div>
                <h3 className="tw-text-sm tw-font-semibold tw-text-slate-900">Internal notes</h3>
                <p className="tw-text-xs tw-text-slate-500 tw-mt-1">Visible to administrative users only.</p>
            </div>
            <textarea
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-px-3 tw-py-2 tw-text-sm focus:tw-ring-2 focus:tw-ring-slate-500/40 focus:tw-border-slate-400"
            />
        </section>
    </div>
);

const money = (value) => {
    const amount = Number(value || 0);
    return `LKR ${amount.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

export default SummarySidebar;
