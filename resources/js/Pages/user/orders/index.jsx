import { Head, Link } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import UserDashboard from '../../../Layouts/UserDashboard';

const money = (value) => {
    const amount = Number(value || 0);
    return `LKR ${amount.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const OrdersIndex = ({ orders, userDetails, WG }) => {
    const records = orders?.data || [];

    return (
        <>
            <Head title="My Orders" />
            <UserDashboard userDetails={userDetails} WG={WG}>
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
                    <div>
                        <h1 className="tw-text-2xl tw-font-bold tw-text-slate-900">
                            My Orders
                        </h1>
                        <p className="tw-text-sm tw-text-slate-500">
                            Track the progress of your print jobs and approvals.
                        </p>
                    </div>
                    <Icon
                        icon="solar:bag-3-bold-duotone"
                        className="tw-text-4xl tw-text-blue-500"
                    />
                </div>

                <div className="card">
                    <div className="card-body">
                        {records.length === 0 ? (
                            <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-12 tw-text-center tw-text-slate-500">
                                <Icon
                                    icon="solar:clipboard-remove-bold-duotone"
                                    className="tw-mb-3 tw-text-4xl tw-text-slate-300"
                                />
                                <p className="tw-text-base tw-font-semibold">
                                    No orders yet
                                </p>
                                <p className="tw-text-sm">
                                    Once you place an order, it will appear here for tracking.
                                </p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table align-middle">
                                    <thead>
                                        <tr className="tw-text-xs tw-uppercase tw-text-slate-500">
                                            <th scope="col">Order</th>
                                            <th scope="col">Status</th>
                                            <th scope="col">Total</th>
                                            <th scope="col">Placed</th>
                                            <th scope="col" className="tw-text-center">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.map((order) => (
                                            <tr key={order.id}>
                                                <td className="tw-font-semibold tw-text-slate-800">
                                                    {order.number}
                                                </td>
                                                <td>
                                                    <span className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-bg-slate-100 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-slate-700">
                                                        <span className="tw-h-2 tw-w-2 tw-rounded-full tw-bg-emerald-500" />
                                                        {order.status_label}
                                                    </span>
                                                </td>
                                                <td className="tw-font-medium">{money(order.total_amount)}</td>
                                                <td>{formatDate(order.created_at)}</td>
                                                <td className="tw-text-center">
                                                    <Link
                                                        href={route('user.orders.show', order.id)}
                                                        className="btn btn-sm btn-outline-primary tw-inline-flex tw-items-center tw-gap-2"
                                                    >
                                                        <Icon icon="solar:eye-bold" className="tw-text-base" />
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {orders?.links?.length > 1 && (
                        <div className="card-footer tw-flex tw-justify-end">
                            <div className="tw-flex tw-items-center tw-gap-2">
                                {orders.links.map((link, idx) => (
                                    <Link
                                        // eslint-disable-next-line react/no-array-index-key
                                        key={idx}
                                        href={link.url || '#'}
                                        className={`tw-min-w-[2rem] tw-rounded tw-px-2 tw-py-1 tw-text-sm ${
                                            link.active
                                                ? 'tw-bg-blue-600 tw-text-white'
                                                : 'tw-text-slate-600 hover:tw-bg-slate-100'
                                        } ${!link.url ? 'tw-pointer-events-none tw-opacity-40' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </UserDashboard>
        </>
    );
};

export default OrdersIndex;
