import { Icon } from '@iconify/react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useMemo, useState } from 'react';
import UserDashboard from '../../../Layouts/UserDashboard';

const money = (value) => {
    const amount = Number(value || 0);
    return `LKR ${amount.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const OrderShow = ({ order, timeline, userDetails, WG }) => {
    const [approvalNote, setApprovalNote] = useState('');
    const [approving, setApproving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const estimateLink = useMemo(
        () => order.attachments?.[0],
        [order.attachments],
    );

    const handleApprove = useCallback(async () => {
        if (approving) return;
        setApproving(true);
        setFeedback(null);

        try {
            await axios.post(route('user.orders.approve', order.id), {
                note: approvalNote.trim() || null,
            });

            setFeedback({
                type: 'success',
                message: 'Thank you! Your approval has been recorded.',
            });
            setApprovalNote('');
            router.reload({ only: ['order', 'timeline'] });
        } catch (error) {
            setFeedback({
                type: 'error',
                message:
                    error.response?.data?.message ||
                    'We could not record your approval. Please try again.',
            });
        } finally {
            setApproving(false);
        }
    }, [approvalNote, approving, order.id]);

    return (
        <>
            <Head title={`Order ${order.number}`} />
            <UserDashboard userDetails={userDetails} WG={WG}>
                <div className="tw-mb-6 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
                    <div>
                        <h1 className="tw-text-3xl tw-font-bold tw-text-slate-900">
                            {order.number}
                        </h1>
                        <p className="tw-text-sm tw-text-slate-500">
                            Status:{' '}
                            <span className="tw-font-semibold">
                                {order.status_label}
                            </span>
                        </p>
                        {order.status_description && (
                            <p className="tw-mt-1 tw-text-xs tw-text-slate-400">
                                {order.status_description}
                            </p>
                        )}
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-3">
                        {estimateLink && (
                            <a
                                href={estimateLink.url}
                                className="btn btn-outline-secondary tw-inline-flex tw-items-center tw-gap-2"
                            >
                                <Icon
                                    icon="solar:download-bold"
                                    className="tw-text-base"
                                />
                                Download Estimate
                            </a>
                        )}
                        <div className="tw-rounded-xl tw-bg-blue-50 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-blue-700">
                            Total {money(order.total_amount)}
                        </div>
                    </div>
                </div>

                {feedback && (
                    <div
                        className={`tw-mb-4 tw-rounded-lg tw-border tw-px-4 tw-py-3 tw-text-sm ${
                            feedback.type === 'success'
                                ? 'tw-border-emerald-200 tw-bg-emerald-50 tw-text-emerald-700'
                                : 'tw-border-red-200 tw-bg-red-50 tw-text-red-600'
                        }`}
                    >
                        {feedback.message}
                    </div>
                )}

                {order.can_approve && (
                    <section className="tw-mb-6 tw-rounded-2xl tw-border tw-border-emerald-200 tw-bg-emerald-50 tw-p-5">
                        <div className="tw-mb-4 tw-flex tw-items-center tw-gap-3">
                            <Icon
                                icon="solar:chat-square-like-bold-duotone"
                                className="tw-text-3xl tw-text-emerald-500"
                            />
                            <div>
                                <h2 className="tw-text-lg tw-font-semibold tw-text-emerald-800">
                                    Ready to Approve?
                                </h2>
                                <p className="tw-text-sm tw-text-emerald-700">
                                    Confirm the quotation to move your order
                                    forward. You can add a message for our team.
                                </p>
                            </div>
                        </div>
                        <textarea
                            value={approvalNote}
                            onChange={(e) => setApprovalNote(e.target.value)}
                            className="tw-w-full tw-rounded-xl tw-border-2 tw-border-emerald-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-text-emerald-900 tw-transition-all focus:tw-border-emerald-400 focus:tw-ring-4 focus:tw-ring-emerald-500/20"
                            rows={3}
                            placeholder="Optional: share any confirmation notes or PO reference."
                        />
                        <button
                            type="button"
                            onClick={handleApprove}
                            disabled={approving}
                            className={`tw-mt-4 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-bg-emerald-600 tw-px-5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-transition-all hover:tw-bg-emerald-700 ${
                                approving
                                    ? 'tw-cursor-not-allowed tw-opacity-70'
                                    : ''
                            }`}
                        >
                            <Icon
                                icon="solar:check-circle-bold"
                                className="tw-text-base"
                            />
                            {approving ? 'Submitting…' : 'Approve Estimate'}
                        </button>
                    </section>
                )}

                <div className="tw-grid tw-gap-6 lg:tw-grid-cols-[2fr_1fr]">
                    <section className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-5 tw-shadow-sm">
                        <h2 className="tw-mb-4 tw-text-lg tw-font-semibold tw-text-slate-800">
                            Order Items
                        </h2>
                        <div className="table-responsive">
                            <table className="table table-borderless align-middle">
                                <thead>
                                    <tr className="tw-text-xs tw-uppercase tw-text-slate-500">
                                        <th scope="col">Item</th>
                                        <th scope="col">Qty</th>
                                        <th scope="col">Unit Price</th>
                                        <th scope="col" className="tw-text-end">
                                            Line Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="tw-font-semibold tw-text-slate-800">
                                                    {item.name}
                                                </div>
                                                {item.description && (
                                                    <div className="tw-text-xs tw-text-slate-500">
                                                        {item.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{item.quantity}</td>
                                            <td>{money(item.unit_price)}</td>
                                            <td className="tw-text-end tw-font-semibold">
                                                {money(item.line_total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="tw-mt-6 tw-flex tw-flex-col tw-items-end tw-gap-2">
                            <div className="tw-flex tw-w-full tw-max-w-sm tw-items-center tw-justify-between tw-text-sm">
                                <span className="tw-text-slate-500">
                                    Subtotal
                                </span>
                                <span className="tw-font-semibold tw-text-slate-800">
                                    {money(order.subtotal_amount)}
                                </span>
                            </div>
                            <div className="tw-flex tw-w-full tw-max-w-sm tw-items-center tw-justify-between tw-text-sm">
                                <span className="tw-text-slate-500">
                                    Discount
                                </span>
                                <span className="tw-font-semibold tw-text-slate-800">
                                    {money(order.discount_amount)}
                                </span>
                            </div>
                            <div className="tw-flex tw-w-full tw-max-w-sm tw-items-center tw-justify-between tw-text-sm">
                                <span className="tw-text-slate-500">
                                    Shipping
                                </span>
                                <span className="tw-font-semibold tw-text-slate-800">
                                    {money(order.shipping_amount)}
                                </span>
                            </div>
                            <div className="tw-flex tw-w-full tw-max-w-sm tw-items-center tw-justify-between tw-text-sm">
                                <span className="tw-text-slate-500">Tax</span>
                                <span className="tw-font-semibold tw-text-slate-800">
                                    {money(order.tax_amount)}
                                </span>
                            </div>
                            <div className="tw-flex tw-w-full tw-max-w-sm tw-items-center tw-justify-between tw-text-base tw-font-bold tw-text-slate-900">
                                <span>Total</span>
                                <span>{money(order.total_amount)}</span>
                            </div>
                        </div>
                    </section>

                    <section className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-5 tw-shadow-sm">
                        <h2 className="tw-mb-4 tw-text-lg tw-font-semibold tw-text-slate-800">
                            Order Timeline
                        </h2>
                        {timeline.length === 0 ? (
                            <p className="tw-text-sm tw-text-slate-500">
                                Updates will appear here as your order
                                progresses.
                            </p>
                        ) : (
                            <ul className="tw-space-y-4">
                                {timeline.map((event) => (
                                    <li
                                        key={event.id}
                                        className="tw-rounded-xl tw-bg-slate-50 tw-p-3"
                                    >
                                        <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-slate-500">
                                            <Icon icon="solar:clock-circle-bold" />
                                            {formatDateTime(event.created_at)}
                                        </div>
                                        <div className="tw-mt-2 tw-text-sm tw-font-semibold tw-text-slate-800">
                                            {event.new_status
                                                ? `Status changed to ${event.new_status.replace(/_/g, ' ')}`
                                                : event.event_type.replace(
                                                      /_/g,
                                                      ' ',
                                                  )}
                                        </div>
                                        {event.message && (
                                            <div className="tw-mt-1 tw-text-sm tw-text-slate-600">
                                                {event.message}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {order.attachments?.length > 0 && (
                            <div className="tw-mt-6">
                                <h3 className="tw-mb-2 tw-text-sm tw-font-semibold tw-text-slate-700">
                                    Documents
                                </h3>
                                <ul className="tw-space-y-2">
                                    {order.attachments.map((file) => (
                                        <li key={file.id}>
                                            <a
                                                href={file.url}
                                                className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-blue-600 hover:tw-underline"
                                            >
                                                <Icon icon="solar:file-download-bold" />
                                                {file.file_name}
                                            </a>
                                            <div className="tw-text-xs tw-text-slate-400">
                                                Uploaded{' '}
                                                {formatDateTime(
                                                    file.uploaded_at,
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                </div>
            </UserDashboard>
        </>
    );
};

export default OrderShow;
