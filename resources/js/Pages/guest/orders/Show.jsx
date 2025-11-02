import { Icon } from '@iconify/react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useState } from 'react';

const money = (value) => {
    const amount = Number(value || 0);
    return `LKR ${amount.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const formatDateTime = (value, fallback = '—') => {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;

    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function Show({ order, timeline = [], expiresAt }) {
    const hasAttachments = order?.attachments?.length > 0;
    const canApprove = Boolean(order?.can_approve && order?.approve_url);
    const [approving, setApproving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const handleApprove = useCallback(async () => {
        if (!canApprove || approving) return;

        setApproving(true);
        setFeedback(null);

        try {
            await axios.post(order.approve_url);

            setFeedback({
                type: 'success',
                message:
                    'Thank you! Your approval has been recorded. We will take it from here.',
            });

            router.reload({ only: ['order', 'timeline'] });
        } catch (error) {
            setFeedback({
                type: 'error',
                message:
                    error.response?.data?.message ??
                    'We could not record your approval right now. Please try again or contact us.',
            });
        } finally {
            setApproving(false);
        }
    }, [approving, canApprove, order?.approve_url]);

    return (
        <div className="tw-min-h-screen tw-bg-gradient-to-br tw-from-gray-50 tw-to-gray-100 tw-pb-16">
            <Head
                title={`Order ${order?.number ?? 'Tracking'} - Printair Advertising`}
            />

            {/* Hero Header with Printair Branding */}
            <div className="tw-relative tw-overflow-hidden tw-bg-gradient-to-r tw-from-[#f44032] tw-to-[#ff6b5e] tw-py-16 tw-text-white tw-shadow-2xl">
                {/* Decorative Background Pattern */}
                <div className="tw-absolute tw-inset-0 tw-opacity-10">
                    <div className="tw-absolute tw-left-0 tw-top-0 tw-h-64 tw-w-64 tw--translate-x-32 tw--translate-y-32 tw-rounded-full tw-bg-white"></div>
                    <div className="tw-absolute tw-bottom-0 tw-right-0 tw-h-96 tw-w-96 tw-translate-x-48 tw-translate-y-48 tw-rounded-full tw-bg-white"></div>
                </div>

                <div className="tw-relative tw-mx-auto tw-max-w-5xl tw-px-4">
                    {/* Logo */}
                    <div className="tw-mb-6 tw-flex tw-justify-center md:tw-justify-start">
                        <img
                            src="/assets/images/logo-light.png"
                            alt="Printair Advertising"
                            className="tw-h-16 tw-drop-shadow-lg md:tw-h-20"
                        />
                    </div>

                    <p className="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-widest tw-text-white/90">
                        <Icon
                            icon="mdi:package-variant"
                            className="tw-mr-2 tw-inline"
                        />
                        Order Tracking
                    </p>
                    <h3 className="tw-mt-3 tw-text-4xl tw-font-extrabold tw-drop-shadow-lg md:tw-text-5xl">
                        {order?.number}
                    </h3>
                    <div className="tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
                        <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-white tw-px-5 tw-py-2 tw-text-sm tw-font-bold tw-text-[#f44032] tw-shadow-lg">
                            <Icon
                                icon="solar:activity-bold-duotone"
                                className="tw-mr-2 tw-text-lg"
                            />
                            {order?.status_label}
                        </span>
                        {expiresAt && (
                            <span className="tw-flex tw-items-center tw-gap-2 tw-rounded-full tw-bg-white/10 tw-px-4 tw-py-2 tw-text-sm tw-text-white/90 tw-backdrop-blur-sm">
                                <Icon
                                    icon="mdi:clock-outline"
                                    className="tw-text-base"
                                />
                                Valid until {formatDateTime(expiresAt)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="tw-mx-auto tw-max-w-5xl tw--translate-y-16 tw-space-y-6 tw-px-4">
                {feedback && (
                    <div
                        className={`tw-rounded-2xl tw-border tw-px-4 tw-py-3 tw-text-sm ${
                            feedback.type === 'success'
                                ? 'tw-border-emerald-200 tw-bg-emerald-50 tw-text-emerald-700'
                                : 'tw-border-rose-200 tw-bg-rose-50 tw-text-rose-600'
                        }`}
                    >
                        {feedback.message}
                    </div>
                )}

                {/* Order Summary Card */}
                <section className="tw-mt-4 tw-rounded-3xl tw-border tw-border-gray-200 tw-bg-white tw-p-8 tw-shadow-2xl">
                    <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-8">
                        <div className="tw-flex-1">
                            <div className="tw-mb-4 tw-flex tw-items-center tw-gap-3">
                                <div className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-bg-[#f44032]/10">
                                    <Icon
                                        icon="mdi:file-document-outline"
                                        className="tw-text-xl tw-text-[#f44032]"
                                    />
                                </div>
                                <h4 className="tw-text-2xl tw-font-bold tw-text-gray-900">
                                    Order Summary
                                </h4>
                            </div>

                            <div className="tw-space-y-2">
                                <p className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
                                    <Icon
                                        icon="mdi:calendar"
                                        className="tw-text-[#f44032]"
                                    />
                                    <span className="tw-font-medium">
                                        Placed on:
                                    </span>
                                    <span>
                                        {formatDateTime(order?.created_at)}
                                    </span>
                                </p>

                                {order?.contact_name && (
                                    <p className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
                                        <Icon
                                            icon="mdi:account"
                                            className="tw-text-[#f44032]"
                                        />
                                        <span className="tw-font-medium">
                                            Customer:
                                        </span>
                                        <span className="tw-font-semibold tw-text-gray-900">
                                            {order.contact_name}
                                        </span>
                                    </p>
                                )}

                                {order?.contact_email && (
                                    <p className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
                                        <Icon
                                            icon="mdi:email"
                                            className="tw-text-[#f44032]"
                                        />
                                        <span className="tw-font-medium">
                                            Email:
                                        </span>
                                        <span>{order.contact_email}</span>
                                    </p>
                                )}
                            </div>

                            {order?.status_description && (
                                <div className="tw-mt-4 tw-rounded-xl tw-border tw-border-[#f44032]/20 tw-bg-gradient-to-r tw-from-orange-50 tw-to-red-50 tw-px-5 tw-py-4">
                                    <div className="tw-flex tw-items-start tw-gap-3">
                                        <Icon
                                            icon="mdi:information"
                                            className="tw-mt-0.5 tw-flex-shrink-0 tw-text-xl tw-text-[#f44032]"
                                        />
                                        <p className="tw-text-sm tw-leading-relaxed tw-text-gray-700">
                                            {order.status_description}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pricing Grid */}
                        <div className="tw-grid tw-grid-cols-2 tw-gap-3 md:tw-grid-cols-3 lg:tw-min-w-[400px]">
                            <Metric
                                label="Subtotal"
                                value={money(order?.subtotal_amount)}
                                icon="mdi:calculator"
                            />
                            <Metric
                                label="Discount"
                                value={money(order?.discount_amount)}
                                icon="mdi:tag-percent"
                            />
                            <Metric
                                label="Shipping"
                                value={money(order?.shipping_amount)}
                                icon="mdi:truck-delivery"
                            />
                            <Metric
                                label="Tax"
                                value={money(order?.tax_amount)}
                                icon="mdi:receipt"
                            />
                            <Metric
                                label="Total"
                                value={money(order?.total_amount)}
                                icon="mdi:cash-multiple"
                                emphasize
                            />
                        </div>
                    </div>

                    {/* Attachments */}
                    {hasAttachments && (
                        <div className="tw-mt-8 tw-border-t tw-border-gray-200 tw-pt-6">
                            <h4 className="tw-mb-4 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                                <Icon
                                    icon="mdi:paperclip"
                                    className="tw-text-[#f44032]"
                                />
                                Attachments
                            </h4>
                            <div className="tw-flex tw-flex-wrap tw-gap-3">
                                {order.attachments.map((attachment) => (
                                    <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        className="tw-group tw-inline-flex tw-items-center tw-gap-3 tw-rounded-xl tw-border-2 tw-border-gray-200 tw-bg-gray-50 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-gray-700 tw-shadow-sm tw-transition-all hover:tw--translate-y-1 hover:tw-border-[#f44032] hover:tw-bg-[#f44032] hover:tw-text-white hover:tw-shadow-lg"
                                    >
                                        <Icon
                                            icon="solar:download-bold"
                                            className="tw-text-lg tw-transition-transform group-hover:tw-scale-110"
                                        />
                                        <span className="tw-max-w-[200px] tw-truncate">
                                            {attachment.file_name}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {canApprove && (
                        <div className="tw-mt-8 tw-rounded-xl tw-border tw-border-emerald-200 tw-bg-emerald-50 tw-p-6">
                            <div className="tw-flex tw-flex-col tw-gap-4 md:tw-flex-row md:tw-items-center md:tw-justify-between">
                                <div className="tw-flex tw-items-start tw-gap-3">
                                    <div className="tw-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-full tw-bg-emerald-100">
                                        <Icon
                                            icon="mdi:check-decagram"
                                            className="tw-text-xl tw-text-emerald-600"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="tw-text-lg tw-font-semibold tw-text-emerald-800">
                                            Ready to confirm your quotation?
                                        </h3>
                                        <p className="tw-mt-1 tw-text-sm tw-text-emerald-700">
                                            This lets our team know that you are
                                            happy with the estimate and ready to
                                            move forward.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleApprove}
                                    disabled={approving}
                                    className={`tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-bg-emerald-600 tw-px-5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm tw-transition hover:tw-bg-emerald-700 ${
                                        approving
                                            ? 'tw-cursor-not-allowed tw-opacity-70'
                                            : ''
                                    }`}
                                >
                                    <Icon
                                        icon="mdi:check"
                                        className="tw-text-base"
                                    />
                                    {approving
                                        ? 'Recording approval…'
                                        : 'Approve Quotation'}
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Order Items Card */}
                <section className="tw-rounded-3xl tw-border tw-border-gray-200 tw-bg-white tw-p-8 tw-shadow-2xl">
                    <div className="tw-mb-6 tw-flex tw-items-center tw-justify-between">
                        <div className="tw-flex tw-items-center tw-gap-3">
                            <div className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-bg-[#f44032]/10">
                                <Icon
                                    icon="mdi:cart-outline"
                                    className="tw-text-xl tw-text-[#f44032]"
                                />
                            </div>
                            <h4 className="tw-text-2xl tw-font-bold tw-text-gray-900">
                                Order Items
                            </h4>
                        </div>
                        <span className="tw-rounded-full tw-bg-gray-100 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-gray-700">
                            {order?.items?.length ?? 0} item
                            {(order?.items?.length ?? 0) !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="tw-overflow-x-auto tw-rounded-xl tw-border tw-border-gray-200">
                        <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
                            <thead className="tw-bg-gray-50">
                                <tr>
                                    <th className="tw-px-6 tw-py-4 tw-text-left tw-text-xs tw-font-bold tw-uppercase tw-tracking-wider tw-text-gray-600">
                                        Item
                                    </th>
                                    <th className="tw-px-6 tw-py-4 tw-text-left tw-text-xs tw-font-bold tw-uppercase tw-tracking-wider tw-text-gray-600">
                                        Qty
                                    </th>
                                    <th className="tw-px-6 tw-py-4 tw-text-left tw-text-xs tw-font-bold tw-uppercase tw-tracking-wider tw-text-gray-600">
                                        Unit Price
                                    </th>
                                    <th className="tw-px-6 tw-py-4 tw-text-right tw-text-xs tw-font-bold tw-uppercase tw-tracking-wider tw-text-gray-600">
                                        Line Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="tw-divide-y tw-divide-gray-200 tw-bg-white">
                                {order?.items?.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="tw-transition-colors hover:tw-bg-gray-50"
                                    >
                                        <td className="tw-px-6 tw-py-4">
                                            <div className="tw-flex tw-items-start tw-gap-3">
                                                <div className="tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-[#f44032]/10 tw-text-sm tw-font-bold tw-text-[#f44032]">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <div className="tw-font-bold tw-text-gray-900">
                                                        {item.name}
                                                    </div>
                                                    {item.description && (
                                                        <div className="tw-mt-1 tw-text-xs tw-leading-relaxed tw-text-gray-500">
                                                            {item.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="tw-px-6 tw-py-4 tw-text-gray-900">
                                            <span className="tw-font-semibold">
                                                {item.quantity}
                                            </span>
                                            {item.unit && (
                                                <span className="tw-ml-1 tw-text-xs tw-text-gray-500">
                                                    {item.unit}
                                                </span>
                                            )}
                                        </td>
                                        <td className="tw-px-6 tw-py-4 tw-font-medium tw-text-gray-700">
                                            {money(item.unit_price)}
                                        </td>
                                        <td className="tw-px-6 tw-py-4 tw-text-right tw-text-lg tw-font-bold tw-text-[#f44032]">
                                            {money(item.line_total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Timeline Card */}
                <section className="tw-rounded-3xl tw-border tw-border-gray-200 tw-bg-white tw-p-8 tw-shadow-2xl">
                    <div className="tw-mb-6 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
                        <div className="tw-flex tw-items-center tw-gap-3">
                            <div className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-bg-[#f44032]/10">
                                <Icon
                                    icon="mdi:timeline-clock"
                                    className="tw-text-xl tw-text-[#f44032]"
                                />
                            </div>
                            <h4 className="tw-text-2xl tw-font-bold tw-text-gray-900">
                                Order Timeline
                            </h4>
                        </div>
                        <span className="tw-rounded-full tw-bg-gray-100 tw-px-4 tw-py-2 tw-text-xs tw-text-gray-500">
                            <Icon
                                icon="mdi:information"
                                className="tw-mr-1 tw-inline"
                            />
                            Customer-visible updates only
                        </span>
                    </div>

                    <div className="tw-space-y-4">
                        {timeline.length === 0 ? (
                            <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-12 tw-text-center">
                                <div className="tw-mb-4 tw-flex tw-h-20 tw-w-20 tw-items-center tw-justify-center tw-rounded-full tw-bg-gray-100">
                                    <Icon
                                        icon="mdi:clock-outline"
                                        className="tw-text-4xl tw-text-gray-400"
                                    />
                                </div>
                                <p className="tw-mb-2 tw-font-medium tw-text-gray-600">
                                    No updates yet
                                </p>
                                <p className="tw-max-w-md tw-text-sm tw-text-gray-500">
                                    We'll notify you as soon as there are any
                                    changes to your order. Keep an eye on your
                                    email!
                                </p>
                            </div>
                        ) : (
                            <div className="tw-relative">
                                {/* Timeline Line */}
                                <div className="tw-absolute tw-bottom-0 tw-left-6 tw-top-0 tw-w-0.5 tw-bg-gradient-to-b tw-from-[#f44032] tw-to-gray-200"></div>

                                {timeline.map((event) => (
                                    <div
                                        key={event.id}
                                        className="tw-relative tw-flex tw-gap-6 tw-pb-8 last:tw-pb-0"
                                    >
                                        {/* Timeline Icon */}
                                        <div className="tw-relative tw-z-10 tw-flex tw-h-12 tw-w-12 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-gradient-to-br tw-from-[#f44032] tw-to-[#ff6b5e] tw-shadow-lg tw-ring-4 tw-ring-white">
                                            <Icon
                                                icon="mdi:bell-ring"
                                                className="tw-text-xl tw-text-white"
                                            />
                                        </div>

                                        {/* Event Card */}
                                        <div className="tw-flex-1 tw-rounded-2xl tw-border-2 tw-border-gray-200 tw-bg-gradient-to-br tw-from-white tw-to-gray-50 tw-p-5 tw-shadow-md tw-transition-all hover:tw--translate-y-1 hover:tw-shadow-xl">
                                            <div className="tw-mb-3 tw-flex tw-items-start tw-justify-between tw-gap-4">
                                                <h6 className="tw-text-base tw-font-bold tw-text-gray-900">
                                                    {event.title ??
                                                        'Status Update'}
                                                </h6>
                                                <span className="tw-rounded-full tw-bg-[#f44032] tw-px-3 tw-py-1 tw-text-xs tw-font-bold tw-uppercase tw-tracking-wide tw-text-white tw-shadow-sm">
                                                    {event.new_status
                                                        ? event.new_status.replace(
                                                              /_/g,
                                                              ' ',
                                                          )
                                                        : event.event_type}
                                                </span>
                                            </div>
                                            <p className="tw-mb-3 tw-text-sm tw-leading-relaxed tw-text-gray-700">
                                                {event.message ??
                                                    'The order status has been updated.'}
                                            </p>
                                            <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-gray-500">
                                                <Icon
                                                    icon="mdi:clock-outline"
                                                    className="tw-text-sm"
                                                />
                                                {formatDateTime(
                                                    event.created_at,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Footer with Printair Branding */}
                <section className="tw-mt-8 tw-rounded-3xl tw-bg-gradient-to-r tw-from-gray-900 tw-to-gray-800 tw-p-8 tw-text-white tw-shadow-2xl">
                    <div className="tw-flex tw-flex-col tw-items-center tw-justify-between tw-gap-6 md:tw-flex-row">
                        <div className="tw-flex tw-items-center tw-gap-4">
                            <img
                                src="/assets/images/logo-light.png"
                                alt="Printair Advertising"
                                className="tw-h-12 tw-opacity-90"
                            />
                            <p className="tw-text-sm tw-text-gray-400">
                                You think it, We ink it.
                            </p>
                        </div>

                        <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-text-sm md:tw-grid-cols-3">
                            <div className="tw-flex tw-items-center tw-gap-2">
                                <Icon
                                    icon="mdi:phone"
                                    className="tw-text-[#f44032]"
                                />
                                <span>+94 76 886 0175</span>
                            </div>
                            <div className="tw-flex tw-items-center tw-gap-2">
                                <Icon
                                    icon="mdi:email"
                                    className="tw-text-[#f44032]"
                                />
                                <span>contact@printair.lk</span>
                            </div>
                            <div className="tw-flex tw-items-center tw-gap-2">
                                <Icon
                                    icon="mdi:web"
                                    className="tw-text-[#f44032]"
                                />
                                <span>printair.lk</span>
                            </div>
                        </div>
                    </div>

                    <div className="tw-mt-6 tw-border-t tw-border-gray-700 tw-pt-6 tw-text-center tw-text-xs tw-text-gray-400">
                        <p>
                            &copy; {new Date().getFullYear()} Printair
                            Advertising. All rights reserved.
                        </p>
                        <p className="tw-mt-1">
                            No.67/D, Uggashena road, Walpola, Ragama, Sri Lanka
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}

const Metric = ({ label, value, icon, emphasize = false }) => (
    <div
        className={`tw-group tw-relative tw-overflow-hidden tw-rounded-2xl tw-border-2 tw-px-5 tw-py-4 tw-transition-all tw-duration-300 ${
            emphasize
                ? 'tw-border-[#f44032] tw-bg-gradient-to-br tw-from-[#f44032]/10 tw-to-[#ff6b5e]/10 tw-shadow-lg hover:tw-scale-105 hover:tw-shadow-xl'
                : 'tw-border-gray-200 tw-bg-gray-50 hover:tw-border-[#f44032]/30 hover:tw-shadow-md'
        }`}
    >
        {emphasize && (
            <div className="tw-absolute tw-right-0 tw-top-0 tw-h-full tw-w-full tw-bg-gradient-to-br tw-from-[#f44032]/5 tw-to-transparent tw-opacity-0 tw-transition-opacity group-hover:tw-opacity-100"></div>
        )}
        <div className="tw-relative tw-mb-2 tw-flex tw-items-center tw-gap-2">
            {icon && (
                <Icon
                    icon={icon}
                    className={`tw-text-lg ${emphasize ? 'tw-text-[#f44032]' : 'tw-text-gray-400'}`}
                />
            )}
            <div
                className={`tw-text-xs tw-font-bold tw-uppercase tw-tracking-wider ${emphasize ? 'tw-text-[#f44032]' : 'tw-text-gray-500'}`}
            >
                {label}
            </div>
        </div>
        <div
            className={`tw-relative tw-text-lg tw-font-bold ${emphasize ? 'tw-text-[#f44032]' : 'tw-text-gray-900'}`}
        >
            {value}
        </div>
    </div>
);
